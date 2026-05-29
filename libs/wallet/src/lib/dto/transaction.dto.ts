import {
  WalletTransactionType,
  WalletTransactionDirection,
  WalletTransactionStatus,
  WalletOwnerType,
  PaymentGateway,
} from '@hancr/database';

/**
 * Input لإنشاء معاملة جديدة في الـ wallet ledger.
 *
 * NOTE: `direction` اختياري لأن `WalletService.credit()` و `.debit()` يضعانه تلقائياً.
 * فقط عند استدعاء طُرق internal مباشرة يلزم تحديده.
 */
export interface CreateTransactionInput {
  ownerType: WalletOwnerType;
  ownerId: number;
  type: WalletTransactionType;
  direction?: WalletTransactionDirection;
  /** قيمة موجبة دائماً (الـ direction يحدِّد +/-) */
  amount: number;
  currency: string;
  status?: WalletTransactionStatus;
  gateway?: PaymentGateway;
  gatewayRef?: string;
  orderId?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result من خصم/إضافة على المحفظة
 */
export interface WalletOperationResult {
  transactionId: number;
  newBalance: number;
  currency: string;
}

/**
 * خطأ — رصيد غير كافٍ
 */
export class InsufficientBalanceError extends Error {
  constructor(
    public readonly currentBalance: number,
    public readonly requiredAmount: number,
    public readonly currency: string,
  ) {
    super(
      `Insufficient balance: have ${currentBalance} ${currency}, need ${requiredAmount} ${currency}`,
    );
    this.name = 'InsufficientBalanceError';
  }
}
