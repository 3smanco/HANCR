import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * I4 — entry فردي ضمن جلسة دفع: مبلغ سائق واحد.
 *
 * Status: pending → processing → completed | failed
 */
@Entity('hancr_payout_entry')
@Index(['sessionId'])
@Index(['driverId'])
@Index(['status'])
export class PayoutEntryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'session_id' })
  sessionId!: number;

  @Column({ name: 'driver_id' })
  driverId!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ nullable: true, name: 'payout_method_id' })
  payoutMethodId?: number;

  @Column({ length: 20, default: 'pending' })
  status!: string;

  @Column({ length: 100, nullable: true, name: 'gateway_ref' })
  gatewayRef?: string;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt?: Date;
}
