import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CompanyEntity,
  DriverEntity,
  RiderEntity,
  WalletOwnerType,
  WalletTransactionEntity,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@hancr/database';
import { WalletService } from '@hancr/wallet';
import {
  AdjustWalletInput,
  AdminWalletTransactionType,
  WalletBalanceListResult,
  WalletBalanceRowType,
  WalletTransactionsResult,
} from './dto/wallet.types';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(WalletTransactionEntity)
    private readonly txRepo: Repository<WalletTransactionEntity>,
    private readonly walletService: WalletService,
  ) {}

  async listBalances(
    ownerType: WalletOwnerType,
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<WalletBalanceListResult> {
    if (ownerType === WalletOwnerType.Rider) {
      const qb = this.riderRepo
        .createQueryBuilder('r')
        .orderBy('r.balance', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);
      if (search) {
        qb.andWhere(
          '(r.phoneNumber ILIKE :q OR r.firstName ILIKE :q OR r.lastName ILIKE :q)',
          { q: `%${search}%` },
        );
      }
      const [items, total] = await qb.getManyAndCount();
      return {
        items: items.map((r) => ({
          ownerType: 'Rider',
          ownerId: r.id,
          name:
            [r.firstName, r.lastName].filter(Boolean).join(' ') ||
            `Rider #${r.id}`,
          phone: r.phoneNumber,
          balance: Number(r.balance),
          currency: r.currency,
          status: r.banned ? 'banned' : r.active ? 'active' : 'inactive',
        })),
        total,
        page,
        limit,
      };
    }
    if (ownerType === WalletOwnerType.Driver) {
      const qb = this.driverRepo
        .createQueryBuilder('d')
        .orderBy('d.balance', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);
      if (search) {
        qb.andWhere(
          '(d.phoneNumber ILIKE :q OR d.firstName ILIKE :q OR d.lastName ILIKE :q)',
          { q: `%${search}%` },
        );
      }
      const [items, total] = await qb.getManyAndCount();
      return {
        items: items.map((d) => ({
          ownerType: 'Driver',
          ownerId: d.id,
          name:
            [d.firstName, d.lastName].filter(Boolean).join(' ') ||
            `Driver #${d.id}`,
          phone: d.phoneNumber,
          balance: Number(d.balance),
          currency: d.currency,
          status: d.banned ? 'banned' : d.active ? d.status : 'inactive',
        })),
        total,
        page,
        limit,
      };
    }
    // Company
    const qb = this.companyRepo
      .createQueryBuilder('c')
      .orderBy('c.balance', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere('c.name ILIKE :q', { q: `%${search}%` });
    }
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((c) => ({
        ownerType: 'Company',
        ownerId: c.id,
        name: c.name,
        phone: c.contactPhone,
        balance: Number(c.balance),
        currency: c.currency,
        status: c.status,
      })),
      total,
      page,
      limit,
    };
  }

  async listTransactions(
    ownerType: WalletOwnerType,
    ownerId: number,
    limit = 50,
    offset = 0,
  ): Promise<WalletTransactionsResult> {
    const [items, total] = await this.txRepo.findAndCount({
      where: { ownerType, ownerId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    // Aggregate credits/debits across full history (not just page)
    const agg = await this.txRepo
      .createQueryBuilder('tx')
      .select(
        `COALESCE(SUM(CASE WHEN tx.direction = 'Credit' THEN tx.amount ELSE 0 END), 0)`,
        'credits',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN tx.direction = 'Debit' THEN tx.amount ELSE 0 END), 0)`,
        'debits',
      )
      .where('tx.owner_type = :ownerType', { ownerType })
      .andWhere('tx.owner_id = :ownerId', { ownerId })
      .andWhere('tx.status = :status', {
        status: WalletTransactionStatus.Completed,
      })
      .getRawOne<{ credits: string; debits: string }>();

    return {
      items: items.map((t) => this.toTxType(t)),
      total,
      totalCredits: Number(agg?.credits ?? 0),
      totalDebits: Number(agg?.debits ?? 0),
    };
  }

  async adjust(input: AdjustWalletInput): Promise<AdminWalletTransactionType> {
    if (input.amount === 0) {
      throw new BadRequestException('Amount must be non-zero');
    }
    // Fetch currency from owner
    const balance = await this.walletService.getBalance(
      input.ownerType,
      input.ownerId,
    );

    const isCredit = input.amount > 0;
    const absAmount = Math.abs(input.amount);

    const result = isCredit
      ? await this.walletService.credit({
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          type: WalletTransactionType.AdminAdjustment,
          amount: absAmount,
          currency: balance.currency,
          status: WalletTransactionStatus.Completed,
          description: input.reason ?? 'Admin manual adjustment',
        })
      : await this.walletService.debit({
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          type: WalletTransactionType.AdminAdjustment,
          amount: absAmount,
          currency: balance.currency,
          status: WalletTransactionStatus.Completed,
          description: input.reason ?? 'Admin manual adjustment',
        });

    const tx = await this.txRepo.findOne({
      where: { id: result.transactionId },
    });
    if (!tx) throw new Error('Transaction created but not found');
    this.logger.log(
      `Admin adjusted ${input.ownerType}#${input.ownerId} by ${input.amount} ${balance.currency} (reason: ${input.reason ?? 'n/a'})`,
    );
    return this.toTxType(tx);
  }

  private toTxType(t: WalletTransactionEntity): AdminWalletTransactionType {
    return {
      id: t.id,
      ownerType: t.ownerType,
      ownerId: t.ownerId,
      type: t.type,
      direction: t.direction,
      amount: Number(t.amount),
      balanceAfter: Number(t.balanceAfter),
      currency: t.currency,
      status: t.status,
      gateway: t.gateway,
      orderId: t.orderId,
      description: t.description,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    };
  }

  private _row(_: WalletBalanceRowType) {
    // placeholder for tree-shake protection
  }
}
