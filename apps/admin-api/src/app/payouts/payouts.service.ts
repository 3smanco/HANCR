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
import {
  PayoutGatewayName,
  PayoutGatewayService,
} from './payout-gateway.service';

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
    private readonly payoutGateway: PayoutGatewayService,
  ) {}

  /**
   * N4 — Process a webhook event from the payout gateway.
   * Flips a pending payout entry to completed/failed. Idempotent: if the
   * entry is already in a terminal state we no-op. On failure we refund
   * the wallet so the driver doesn't lose money.
   */
  async handleWebhookEvent(
    internalRef: string,
    status: 'completed' | 'failed',
    gatewayRef?: string,
    errorMessage?: string,
  ): Promise<{ matched: boolean; alreadyResolved: boolean }> {
    const entryId = Number(internalRef);
    if (!entryId) return { matched: false, alreadyResolved: false };
    const entry = await this.entryRepo.findOne({ where: { id: entryId } });
    if (!entry) return { matched: false, alreadyResolved: false };
    if (entry.status === 'completed' || entry.status === 'failed') {
      return { matched: true, alreadyResolved: true };
    }

    const session = await this.sessionRepo.findOne({
      where: { id: entry.sessionId },
    });
    if (!session) return { matched: true, alreadyResolved: false };

    if (status === 'completed') {
      entry.status = 'completed';
      entry.completedAt = new Date();
      if (gatewayRef) entry.gatewayRef = gatewayRef;
    } else {
      entry.status = 'failed';
      entry.errorMessage = errorMessage ?? 'gateway reported failure';
      // Refund the wallet — money never moved
      await this.walletService.credit({
        ownerType: WalletOwnerType.Driver,
        ownerId: entry.driverId,
        type: WalletTransactionType.DriverEarnings,
        amount: Number(entry.amount),
        currency: session.currency,
        status: WalletTransactionStatus.Completed,
        description: `Refund: webhook failed for payout entry #${entry.id}`,
      });
    }
    await this.entryRepo.save(entry);

    // Recompute session status based on remaining entries
    const remaining = await this.entryRepo.find({
      where: { sessionId: session.id },
    });
    const pending = remaining.filter((e) => e.status === 'pending').length;
    const failed = remaining.filter((e) => e.status === 'failed').length;
    if (pending === 0) {
      session.status =
        failed === 0
          ? 'completed'
          : failed === remaining.length
            ? 'draft'
            : 'partial_failure';
      session.completedAt = new Date();
      await this.sessionRepo.save(session);
    }

    this.logger.log(
      `Webhook: entry #${entryId} → ${status} (gateway ref ${gatewayRef ?? 'n/a'})`,
    );
    return { matched: true, alreadyResolved: false };
  }

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
   *  1. Debit driver.balance via WalletService.debit (DriverWithdrawal) —
   *     ledger is updated first so the driver can't double-withdraw while
   *     gateway is in-flight.
   *  2. Call PayoutGatewayService.initiate to actually move the money.
   *  3. Mark entry as completed | pending | failed based on the gateway
   *     response. Pending entries wait for /payouts/webhook/:gateway to
   *     flip them.
   *  4. Session status reflects entry outcomes: 'completed' (all done),
   *     'partial_failure' (some failed), 'processing' (any still pending).
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
    const methods = await this.methodRepo.find({
      where: { driverId: In(entries.map((e) => e.driverId)) },
    });
    const methodMap = new Map(methods.map((m) => [m.driverId, m]));

    let pendingCount = 0;
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
      } catch (err) {
        e.status = 'failed';
        e.errorMessage = `wallet debit failed: ${(err as Error).message}`;
        failedCount++;
        await this.entryRepo.save(e);
        this.logger.warn(
          `Payout entry #${e.id} (driver #${e.driverId}) failed: ${e.errorMessage}`,
        );
        continue;
      }

      // Ledger debit succeeded — now move the money externally.
      const method = methodMap.get(e.driverId);
      const gateway = (method?.type ?? 'manual') as PayoutGatewayName;
      const destination =
        method?.iban ?? method?.accountName ?? `driver-${e.driverId}`;

      try {
        const result = await this.payoutGateway.initiate(gateway, {
          amount: Number(e.amount),
          currency: session.currency,
          internalRef: String(e.id),
          destinationAccount: destination,
          description: `HANCR payout #${session.id}`,
        });
        e.gatewayRef = result.gatewayRef;
        if (result.status === 'completed') {
          e.status = 'completed';
          e.completedAt = new Date();
        } else if (result.status === 'failed') {
          e.status = 'failed';
          e.errorMessage = result.errorMessage ?? 'gateway returned failed';
          failedCount++;
          // Refund the wallet — gateway didn't move money
          await this.walletService.credit({
            ownerType: WalletOwnerType.Driver,
            ownerId: e.driverId,
            type: WalletTransactionType.DriverEarnings,
            amount: Number(e.amount),
            currency: session.currency,
            status: WalletTransactionStatus.Completed,
            description: `Refund: gateway failed for payout entry #${e.id}`,
          });
        } else {
          // pending — webhook will resolve
          e.status = 'pending';
          pendingCount++;
        }
      } catch (err) {
        e.status = 'failed';
        e.errorMessage = `gateway error: ${(err as Error).message}`;
        failedCount++;
        // Refund the wallet
        await this.walletService.credit({
          ownerType: WalletOwnerType.Driver,
          ownerId: e.driverId,
          type: WalletTransactionType.DriverEarnings,
          amount: Number(e.amount),
          currency: session.currency,
          status: WalletTransactionStatus.Completed,
          description: `Refund: gateway threw for payout entry #${e.id}`,
        });
      }
      await this.entryRepo.save(e);
    }

    session.status =
      pendingCount > 0
        ? 'processing'
        : failedCount === 0
          ? 'completed'
          : failedCount === entries.length
            ? 'draft'
            : 'partial_failure';
    if (pendingCount === 0) {
      session.completedAt = new Date();
    }
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
