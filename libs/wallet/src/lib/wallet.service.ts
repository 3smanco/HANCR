import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  WalletTransactionEntity,
  WalletTransactionType,
  WalletTransactionDirection,
  WalletTransactionStatus,
  WalletOwnerType,
  PaymentGateway,
  RiderEntity,
  DriverEntity,
} from '@hancr/database';
import {
  CreateTransactionInput,
  WalletOperationResult,
  InsufficientBalanceError,
} from './dto/transaction.dto';

/**
 * WalletService — منطق المحفظة المركزي (atomic transactions)
 *
 * المسؤوليات:
 *  - إنشاء معاملة وتحديث الـ balance في entity (Rider أو Driver) atomically عبر transaction
 *  - منع double-spending عبر row locking (SELECT ... FOR UPDATE)
 *  - حفظ ledger history في `hancr_wallet_transaction`
 *  - حسابات مساعدة (getBalance, listTransactions)
 *
 * مهم: كل عملية credit/debit تستخدم DB transaction للحفاظ على consistency.
 */
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(WalletTransactionEntity)
    private readonly txRepo: Repository<WalletTransactionEntity>,

    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,

    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,

    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Credit (إضافة) للمحفظة.
   * Atomic: locks the wallet row + creates transaction + updates balance.
   */
  async credit(input: CreateTransactionInput): Promise<WalletOperationResult> {
    if (input.amount <= 0) {
      throw new Error(`credit amount must be positive (got ${input.amount})`);
    }
    return this._executeTransaction({
      ...input,
      direction: WalletTransactionDirection.Credit,
    });
  }

  /**
   * Debit (خصم) من المحفظة.
   * يرمي InsufficientBalanceError لو الرصيد غير كافٍ.
   */
  async debit(input: CreateTransactionInput): Promise<WalletOperationResult> {
    if (input.amount <= 0) {
      throw new Error(`debit amount must be positive (got ${input.amount})`);
    }
    return this._executeTransaction({
      ...input,
      direction: WalletTransactionDirection.Debit,
    });
  }

  /**
   * احصل على الرصيد الحالي للمالك
   */
  async getBalance(
    ownerType: WalletOwnerType,
    ownerId: number,
  ): Promise<{ balance: number; currency: string }> {
    if (ownerType === WalletOwnerType.Rider) {
      const rider = await this.riderRepo.findOne({
        where: { id: ownerId },
        select: ['balance', 'currency'],
      });
      if (!rider) throw new Error(`Rider #${ownerId} not found`);
      return { balance: Number(rider.balance), currency: rider.currency };
    }
    if (ownerType === WalletOwnerType.Company) {
      const row = await this.dataSource.query<
        Array<{ balance: string; currency: string }>
      >(`SELECT balance, currency FROM hancr_company WHERE id = $1`, [ownerId]);
      if (row.length === 0) throw new Error(`Company #${ownerId} not found`);
      return {
        balance: Number(row[0].balance),
        currency: row[0].currency,
      };
    }
    if (ownerType === WalletOwnerType.Fleet) {
      const row = await this.dataSource.query<
        Array<{ balance: string; currency: string }>
      >(`SELECT balance, currency FROM hancr_fleet WHERE id = $1`, [ownerId]);
      if (row.length === 0) throw new Error(`Fleet #${ownerId} not found`);
      return {
        balance: Number(row[0].balance),
        currency: row[0].currency,
      };
    }
    const driver = await this.driverRepo.findOne({
      where: { id: ownerId },
      select: ['balance', 'currency'],
    });
    if (!driver) throw new Error(`Driver #${ownerId} not found`);
    return { balance: Number(driver.balance), currency: driver.currency };
  }

  /**
   * قائمة معاملات المحفظة بترتيب زمني (الأحدث أولاً)
   */
  async listTransactions(
    ownerType: WalletOwnerType,
    ownerId: number,
    limit = 50,
    offset = 0,
  ): Promise<WalletTransactionEntity[]> {
    return this.txRepo.find({
      where: { ownerType, ownerId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * جلب معاملة بمعرّفها (يُستخدم بواسطة webhook handlers)
   */
  async getTransactionById(
    transactionId: number,
  ): Promise<WalletTransactionEntity | null> {
    return this.txRepo.findOne({ where: { id: transactionId } });
  }

  /**
   * يجلب رابط checkout المعلّق لدفع رحلة بالبطاقة (لإكمال الدفع من تطبيق الراكب).
   * يُعيد آخر معاملة TripPayment معلّقة للطلب مع redirectUrl المخزَّن في metadata.
   */
  async findPendingTripCheckout(
    ownerType: WalletOwnerType,
    ownerId: number,
    orderId: number,
  ): Promise<{
    transactionId: number;
    redirectUrl?: string;
    gatewayRef?: string;
  } | null> {
    const tx = await this.txRepo.findOne({
      where: {
        ownerType,
        ownerId,
        orderId,
        type: WalletTransactionType.TripPayment,
        status: WalletTransactionStatus.Pending,
      },
      order: { id: 'DESC' },
    });
    if (!tx) return null;
    const md = (tx.metadata ?? {}) as { redirectUrl?: string };
    return {
      transactionId: tx.id,
      redirectUrl: md.redirectUrl,
      gatewayRef: tx.gatewayRef,
    };
  }

  /**
   * تحديث حالة معاملة Pending (يُستخدم بواسطة webhook handlers)
   */
  async updateTransactionStatus(
    transactionId: number,
    status: WalletTransactionStatus,
    metadata?: Record<string, unknown>,
  ): Promise<WalletTransactionEntity> {
    const tx = await this.txRepo.findOne({ where: { id: transactionId } });
    if (!tx) throw new Error(`Transaction #${transactionId} not found`);

    tx.status = status;
    if (metadata) tx.metadata = { ...tx.metadata, ...metadata };
    if (status === WalletTransactionStatus.Completed) {
      tx.completedAt = new Date();
    }
    return this.txRepo.save(tx);
  }

  /**
   * N3 — Reverse a completed transaction by creating an offsetting one.
   * Used by ops to undo fraudulent / mistaken charges. Marks the original's
   * metadata with reversedBy + reversedAt for audit, and the reversal tx
   * carries metadata.reverses = original_id for traceability.
   *
   * Throws if the tx is not Completed (Pending/Failed should be flipped via
   * updateTransactionStatus, not reversed).
   */
  async reverseTransaction(
    transactionId: number,
    actorId: number,
    reason: string,
  ): Promise<WalletTransactionEntity> {
    const original = await this.txRepo.findOne({ where: { id: transactionId } });
    if (!original) throw new Error(`Transaction #${transactionId} not found`);
    if (original.status !== WalletTransactionStatus.Completed) {
      throw new Error(
        `Only Completed transactions can be reversed (got ${original.status})`,
      );
    }
    if ((original.metadata as Record<string, unknown> | null)?.reversedBy) {
      throw new Error(`Transaction #${transactionId} was already reversed`);
    }

    const offsetDirection =
      original.direction === WalletTransactionDirection.Credit
        ? WalletTransactionDirection.Debit
        : WalletTransactionDirection.Credit;

    const reversal = await this._executeTransaction({
      ownerType: original.ownerType,
      ownerId: original.ownerId,
      type: WalletTransactionType.AdminAdjustment,
      amount: Number(original.amount),
      currency: original.currency,
      direction: offsetDirection,
      status: WalletTransactionStatus.Completed,
      description: `Reversal of tx #${original.id}: ${reason}`,
      orderId: original.orderId ?? undefined,
      metadata: {
        reverses: original.id,
        reversedBy: actorId,
        reversedAt: new Date().toISOString(),
        reason,
      },
    });

    // mark the original as reversed (audit trail; status stays Completed)
    original.metadata = {
      ...(original.metadata ?? {}),
      reversedBy: actorId,
      reversedAt: new Date().toISOString(),
      reversalTxId: reversal.transactionId,
      reversalReason: reason,
    };
    await this.txRepo.save(original);

    this.logger.log(
      `Reversed tx #${original.id} via new tx #${reversal.transactionId} by admin #${actorId}`,
    );
    const saved = await this.txRepo.findOne({
      where: { id: reversal.transactionId },
    });
    if (!saved) throw new Error('reversal save failed');
    return saved;
  }

  /**
   * Reconciliation: إجمالي الـ credits − debits للمالك.
   * يفيد للتحقق من تطابق الـ ledger مع الـ cached balance في rider/driver.
   */
  async getLedgerTotal(
    ownerType: WalletOwnerType,
    ownerId: number,
  ): Promise<number> {
    const result = await this.txRepo
      .createQueryBuilder('tx')
      .select(
        `COALESCE(SUM(
          CASE WHEN tx.direction = 'Credit' THEN tx.amount ELSE -tx.amount END
        ), 0)`,
        'total',
      )
      .where('tx.owner_type = :ownerType', { ownerType })
      .andWhere('tx.owner_id = :ownerId', { ownerId })
      .andWhere('tx.status = :status', {
        status: WalletTransactionStatus.Completed,
      })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal — atomic transaction execution
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * يُنفِّذ معاملة atomic:
   *  1. يبدأ DB transaction
   *  2. يقفل صف المالك (Rider/Driver) بـ SELECT ... FOR UPDATE
   *  3. يتحقق من الرصيد (في Debit)
   *  4. يحدِّث الرصيد
   *  5. ينشئ سجل المعاملة بـ balanceAfter
   *  6. commit
   */
  private async _executeTransaction(
    input: CreateTransactionInput & { direction: WalletTransactionDirection },
  ): Promise<WalletOperationResult> {
    const status = input.status ?? WalletTransactionStatus.Completed;
    const gateway = input.gateway ?? PaymentGateway.Internal;
    const isDebit = input.direction === WalletTransactionDirection.Debit;
    const delta = isDebit ? -input.amount : input.amount;

    return this.dataSource.transaction(async (em) => {
      // ─── Step 1: Lock the owner row ───
      const tableName =
        input.ownerType === WalletOwnerType.Rider
          ? 'hancr_rider'
          : input.ownerType === WalletOwnerType.Company
          ? 'hancr_company'
          : input.ownerType === WalletOwnerType.Fleet
          ? 'hancr_fleet'
          : 'hancr_driver';

      const ownerRow = await em.query<
        Array<{ id: number; balance: string; currency: string }>
      >(
        `SELECT id, balance, currency FROM ${tableName} WHERE id = $1 FOR UPDATE`,
        [input.ownerId],
      );

      if (ownerRow.length === 0) {
        throw new Error(
          `${input.ownerType} #${input.ownerId} not found in ${tableName}`,
        );
      }

      const currentBalance = Number(ownerRow[0].balance);
      const ownerCurrency = ownerRow[0].currency;

      // ─── Step 2: Currency check ───
      if (input.currency !== ownerCurrency) {
        throw new Error(
          `Currency mismatch: transaction is ${input.currency}, ` +
            `${input.ownerType} wallet is ${ownerCurrency}`,
        );
      }

      // ─── Step 3: Insufficient balance check (Debit only, Completed status only) ───
      if (
        isDebit &&
        status === WalletTransactionStatus.Completed &&
        currentBalance < input.amount
      ) {
        throw new InsufficientBalanceError(
          currentBalance,
          input.amount,
          ownerCurrency,
        );
      }

      // ─── Step 4: Compute new balance ───
      // Note: Pending transactions don't change balance yet — only Completed.
      // This handles the case where a Recharge is Pending (awaiting gateway confirmation).
      const willAffectBalance = status === WalletTransactionStatus.Completed;
      const newBalance = willAffectBalance ? currentBalance + delta : currentBalance;

      // ─── Step 5: Update wallet (only if Completed) ───
      if (willAffectBalance) {
        await em.query(
          `UPDATE ${tableName} SET balance = $1, updated_at = NOW() WHERE id = $2`,
          [newBalance, input.ownerId],
        );
      }

      // ─── Step 6: Insert transaction record ───
      const tx = em.create(WalletTransactionEntity, {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        type: input.type,
        direction: input.direction,
        amount: input.amount,
        balanceAfter: newBalance,
        currency: input.currency,
        status,
        gateway,
        gatewayRef: input.gatewayRef,
        orderId: input.orderId,
        description: input.description,
        metadata: input.metadata,
        completedAt: status === WalletTransactionStatus.Completed ? new Date() : undefined,
      });
      const saved = await em.save(tx);

      this.logger.log(
        `[${input.ownerType}#${input.ownerId}] ${input.direction} ` +
          `${input.amount} ${input.currency} (${input.type}) → balance: ${newBalance}` +
          (status !== WalletTransactionStatus.Completed ? ` [${status}]` : ''),
      );

      return {
        transactionId: saved.id,
        newBalance,
        currency: ownerCurrency,
      };
    });
  }
}
