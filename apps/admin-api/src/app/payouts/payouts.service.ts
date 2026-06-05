import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  DriverEntity,
  PayoutEntryEntity,
  PayoutMethodEntity,
  PayoutSessionEntity,
  WalletOwnerType,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@hancr/database';
import { WalletService } from '@hancr/wallet';
import {
  CreatePayoutSessionInput,
  EligibleDriverType,
  PayoutEntryType,
  PayoutSessionDetailType,
  PayoutSessionType,
} from './dto/payout.types';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    @InjectRepository(PayoutSessionEntity)
    private readonly sessionRepo: Repository<PayoutSessionEntity>,
    @InjectRepository(PayoutEntryEntity)
    private readonly entryRepo: Repository<PayoutEntryEntity>,
    @InjectRepository(PayoutMethodEntity)
    private readonly methodRepo: Repository<PayoutMethodEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Drivers eligible for payout: have positive balance + default payout method.
   */
  async listEligible(): Promise<EligibleDriverType[]> {
    const drivers = await this.driverRepo
      .createQueryBuilder('d')
      .where('d.balance > 0')
      .andWhere('d.active = true')
      .andWhere('d.banned = false')
      .orderBy('d.balance', 'DESC')
      .limit(200)
      .getMany();

    if (drivers.length === 0) return [];

    const ids = drivers.map((d) => d.id);
    const methods = await this.methodRepo.find({
      where: { driverId: In(ids), isDefault: true },
    });
    const methodMap = new Map(methods.map((m) => [m.driverId, m]));

    return drivers.map((d) => {
      const m = methodMap.get(d.id);
      return {
        driverId: d.id,
        driverName:
          [d.firstName, d.lastName].filter(Boolean).join(' ') ||
          `Driver #${d.id}`,
        phoneNumber: d.phoneNumber,
        balance: Number(d.balance),
        currency: d.currency,
        defaultPayoutMethodId: m?.id,
        defaultMethodSummary: m ? this.methodSummary(m) : undefined,
      };
    });
  }

  async listSessions(): Promise<PayoutSessionType[]> {
    const rows = await this.sessionRepo.find({ order: { id: 'DESC' } });
    return rows.map((r) => this.toSessionType(r));
  }

  async getDetail(id: number): Promise<PayoutSessionDetailType> {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    const entries = await this.entryRepo.find({
      where: { sessionId: id },
      order: { id: 'ASC' },
    });
    const driverIds = entries.map((e) => e.driverId);
    const drivers = driverIds.length
      ? await this.driverRepo.findBy({ id: In(driverIds) })
      : [];
    const driverMap = new Map(drivers.map((d) => [d.id, d]));
    const methodIds = entries
      .map((e) => e.payoutMethodId)
      .filter((x): x is number => x != null);
    const methods = methodIds.length
      ? await this.methodRepo.findBy({ id: In(methodIds) })
      : [];
    const methodMap = new Map(methods.map((m) => [m.id, m]));

    return {
      ...this.toSessionType(session),
      entries: entries.map((e) => this.toEntryType(e, driverMap, methodMap)),
    };
  }

  /**
   * Create a draft session that snapshots each driver's current balance
   * as the payout amount. Does NOT yet move money — admin must call
   * processPayoutSession to debit the wallets.
   */
  async create(
    input: CreatePayoutSessionInput,
    initiatedBy: number,
  ): Promise<PayoutSessionDetailType> {
    const drivers = await this.driverRepo.findBy({
      id: In(input.driverIds),
    });
    if (drivers.length === 0) {
      throw new BadRequestException('No matching drivers');
    }

    // All drivers must share the same currency (simplification)
    const currencies = new Set(drivers.map((d) => d.currency));
    if (currencies.size > 1) {
      throw new BadRequestException(
        'Multi-currency payout not supported in one session',
      );
    }
    const currency = drivers[0].currency;

    // Skip zero/negative balances
    const eligible = drivers.filter((d) => Number(d.balance) > 0);
    if (eligible.length === 0) {
      throw new BadRequestException('All selected drivers have zero balance');
    }

    const methods = await this.methodRepo.find({
      where: { driverId: In(eligible.map((d) => d.id)), isDefault: true },
    });
    const methodMap = new Map(methods.map((m) => [m.driverId, m]));

    const total = eligible.reduce((s, d) => s + Number(d.balance), 0);
    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        initiatedBy,
        totalAmount: total,
        currency,
        driverCount: eligible.length,
        mode: 'manual',
        status: 'draft',
        note: input.note,
      }),
    );

    for (const d of eligible) {
      const m = methodMap.get(d.id);
      await this.entryRepo.save(
        this.entryRepo.create({
          sessionId: session.id,
          driverId: d.id,
          amount: Number(d.balance),
          payoutMethodId: m?.id,
          status: 'pending',
        }),
      );
    }

    this.logger.log(
      `Created payout session #${session.id} for ${eligible.length} drivers totalling ${total} ${currency}`,
    );
    return this.getDetail(session.id);
  }

  /**
   * Execute a draft session. For each entry:
   *  - debit driver.balance via WalletService.debit (DriverWithdrawal)
   *  - mark entry as completed (or failed if balance < amount)
   *  - if any failed: session status = partial_failure, else completed
   *
   * Note: gateway integration is a TODO; we only debit the ledger.
   */
  async process(sessionId: number): Promise<PayoutSessionDetailType> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'draft') {
      throw new BadRequestException(
        `Session is in status '${session.status}', cannot process`,
      );
    }
    session.status = 'processing';
    await this.sessionRepo.save(session);

    const entries = await this.entryRepo.find({
      where: { sessionId, status: 'pending' },
    });

    let failedCount = 0;
    for (const e of entries) {
      try {
        await this.walletService.debit({
          ownerType: WalletOwnerType.Driver,
          ownerId: e.driverId,
          type: WalletTransactionType.DriverWithdrawal,
          amount: Number(e.amount),
          currency: session.currency,
          status: WalletTransactionStatus.Completed,
          description: `Payout session #${session.id}`,
        });
        e.status = 'completed';
        e.completedAt = new Date();
      } catch (err) {
        e.status = 'failed';
        e.errorMessage = (err as Error).message;
        failedCount++;
        this.logger.warn(
          `Payout entry #${e.id} (driver #${e.driverId}) failed: ${e.errorMessage}`,
        );
      }
      await this.entryRepo.save(e);
    }

    session.status =
      failedCount === 0
        ? 'completed'
        : failedCount === entries.length
          ? 'draft' // all failed — let admin retry
          : 'partial_failure';
    session.completedAt = new Date();
    await this.sessionRepo.save(session);

    this.logger.log(
      `Processed payout session #${session.id}: ${entries.length - failedCount}/${entries.length} ok`,
    );
    return this.getDetail(session.id);
  }

  // ─── Mappers ─────────────────────────────────────────────────────────────

  private methodSummary(m: PayoutMethodEntity): string {
    if (m.type === 'bank' || m.type === 'mada') {
      const tail = m.iban?.slice(-4) ?? '????';
      return `${m.bankName ?? 'Bank'} · ****${tail}`;
    }
    if (m.type === 'stcpay') {
      return `STC Pay · ${m.phoneNumber ?? '—'}`;
    }
    return m.type;
  }

  private toSessionType(s: PayoutSessionEntity): PayoutSessionType {
    return {
      id: s.id,
      initiatedBy: s.initiatedBy,
      totalAmount: Number(s.totalAmount),
      currency: s.currency,
      driverCount: s.driverCount,
      mode: s.mode,
      status: s.status,
      note: s.note,
      createdAt: s.createdAt,
      completedAt: s.completedAt,
    };
  }

  private toEntryType(
    e: PayoutEntryEntity,
    driverMap: Map<number, DriverEntity>,
    methodMap: Map<number, PayoutMethodEntity>,
  ): PayoutEntryType {
    const d = driverMap.get(e.driverId);
    const m = e.payoutMethodId ? methodMap.get(e.payoutMethodId) : undefined;
    return {
      id: e.id,
      sessionId: e.sessionId,
      driverId: e.driverId,
      driverName: d
        ? [d.firstName, d.lastName].filter(Boolean).join(' ') || undefined
        : undefined,
      driverPhone: d?.phoneNumber,
      amount: Number(e.amount),
      payoutMethodId: e.payoutMethodId,
      methodSummary: m ? this.methodSummary(m) : undefined,
      status: e.status,
      gatewayRef: e.gatewayRef,
      errorMessage: e.errorMessage,
      createdAt: e.createdAt,
      completedAt: e.completedAt,
    };
  }
}
