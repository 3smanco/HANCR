import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PoolEntity } from './pool.entity';
import { RiderEntity } from './rider.entity';

/**
 * عضو في المجموعة
 * لكل عضو صلاحيات منفصلة: حد الإنفاق، ساعات الاستخدام
 */
@Entity('hancr_pool_member')
export class PoolMemberEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** هل العضوية نشطة */
  @Column({ default: true })
  active!: boolean;

  /** الحد الشهري لهذا العضو بالتحديد */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'monthly_spend_limit' })
  monthlySpendLimit?: number;

  /** ساعة بداية الاستخدام المسموح (مثل 08:00) */
  @Column({ nullable: true, name: 'allowed_from' })
  allowedFrom?: string;

  /** ساعة نهاية الاستخدام المسموح (مثل 22:00) */
  @Column({ nullable: true, name: 'allowed_to' })
  allowedTo?: string;

  /** أيام الأسبوع المسموح بها [0=الأحد ... 6=السبت] */
  @Column({ type: 'jsonb', nullable: true, name: 'allowed_days' })
  allowedDays?: number[];

  /** الإنفاق الشهري الحالي */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'current_month_spend' })
  currentMonthSpend!: number;

  /** المجموعة */
  @ManyToOne(() => PoolEntity, (pool) => pool.members)
  @JoinColumn({ name: 'pool_id' })
  pool!: PoolEntity;

  @Column({ name: 'pool_id' })
  poolId!: number;

  /** الراكب العضو */
  @ManyToOne(() => RiderEntity)
  @JoinColumn({ name: 'rider_id' })
  rider!: RiderEntity;

  @Column({ name: 'rider_id' })
  riderId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
