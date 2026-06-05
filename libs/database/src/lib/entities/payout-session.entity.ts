import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * I4 — جلسة دفعة جماعية. يُختار فيها مجموعة سائقين ويُحسَب لكل واحد رصيده
 * المراد سحبه، ثم تُحوَّل في خطوة واحدة (مع تتبّع كل entry فردياً).
 *
 * Status: draft → processing → completed | partial_failure
 */
@Entity('hancr_payout_session')
@Index(['status'])
export class PayoutSessionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true, name: 'initiated_by' })
  initiatedBy?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_amount' })
  totalAmount!: number;

  @Column({ length: 3, default: 'SAR' })
  currency!: string;

  @Column({ type: 'int', default: 0, name: 'driver_count' })
  driverCount!: number;

  @Column({ length: 20, default: 'manual' })
  mode!: string;

  @Column({ length: 20, default: 'draft' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt?: Date;
}
