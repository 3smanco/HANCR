import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  WalletTransactionType,
  WalletTransactionDirection,
  WalletTransactionStatus,
  WalletOwnerType,
  PaymentGateway,
} from '../enums/wallet-transaction.enum';
import { OrderEntity } from './order.entity';

/**
 * Wallet Transaction — سجلّ كل حركة مالية في النظام
 *
 * كل معاملة:
 *  - مرتبطة بـ Rider أو Driver (ownerType + ownerId)
 *  - لها direction (Credit أو Debit)
 *  - amount مع currency
 *  - balanceAfter للسرعة في الـ ledger
 *  - status (Pending → Completed/Failed/Reversed)
 *  - gateway (Internal/HyperPay/Moyasar/...)
 *  - اختيارياً مرتبطة بـ orderId
 *  - gatewayRef للـ traceback (transaction ID من الـ gateway)
 *
 * هذا الجدول يُعتبر الـ source of truth للأرصدة.
 * حقل `balance` في rider/driver entities هو cached value فقط.
 */
@Entity('hancr_wallet_transaction')
@Index(['ownerType', 'ownerId', 'createdAt'])
@Index(['status'])
@Index(['gatewayRef'], { unique: true, where: '"gateway_ref" IS NOT NULL' })
export class WalletTransactionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** نوع المالك (Rider أو Driver) */
  @Column({
    type: 'enum',
    enum: WalletOwnerType,
    name: 'owner_type',
  })
  ownerType!: WalletOwnerType;

  /** معرّف المالك (rider.id أو driver.id حسب ownerType) */
  @Column({ name: 'owner_id' })
  ownerId!: number;

  /** نوع المعاملة */
  @Column({ type: 'enum', enum: WalletTransactionType })
  type!: WalletTransactionType;

  /** اتجاه المعاملة (Credit / Debit) */
  @Column({ type: 'enum', enum: WalletTransactionDirection })
  direction!: WalletTransactionDirection;

  /** المبلغ (موجب دائماً — الاتجاه يحدِّد الإضافة/الخصم) */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  /** الرصيد بعد المعاملة (للسرعة في عرض الـ ledger) */
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'balance_after' })
  balanceAfter!: number;

  /** العملة (SAR, QAR, AED, ...) */
  @Column({ type: 'char', length: 3 })
  currency!: string;

  /** حالة المعاملة */
  @Column({
    type: 'enum',
    enum: WalletTransactionStatus,
    default: WalletTransactionStatus.Pending,
  })
  status!: WalletTransactionStatus;

  /** بوابة الدفع المستخدمة */
  @Column({ type: 'enum', enum: PaymentGateway, default: PaymentGateway.Internal })
  gateway!: PaymentGateway;

  /** المعرّف الخارجي للمعاملة عند الـ gateway (للـ traceback + reconciliation) */
  @Column({ nullable: true, name: 'gateway_ref' })
  gatewayRef?: string;

  /** الطلب المرتبط (إن وُجد) */
  @ManyToOne(() => OrderEntity, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order?: OrderEntity;

  @Column({ nullable: true, name: 'order_id' })
  orderId?: number;

  /** وصف نصّي للمعاملة (يظهر في الـ ledger UI) */
  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  /** Metadata إضافية (gateway response، card last4، ...) */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** متى أصبحت Completed (يفيد reconciliation reports) */
  @Column({ nullable: true, name: 'completed_at' })
  completedAt?: Date;
}
