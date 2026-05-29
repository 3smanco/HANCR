import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LoyaltyTier } from '../enums/loyalty-tier.enum';
import { RiderEntity } from './rider.entity';

/**
 * نظام Hancr Miles — الولاء الحصري للركاب
 * يحتوي على كل بيانات النقاط والمزايا المكتسبة
 */
@Entity('hancr_loyalty')
export class LoyaltyEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** إجمالي النقاط الحالية القابلة للاستبدال */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_miles' })
  totalMiles!: number;

  /** النقاط المتاحة للاستبدال (بعد خصم المستخدم) */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'available_miles' })
  availableMiles!: number;

  /** النقاط المكتسبة مدى الحياة (لتحديد المستوى) */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'lifetime_miles' })
  lifetimeMiles!: number;

  /** المستوى الحالي */
  @Column({ type: 'enum', enum: LoyaltyTier, default: LoyaltyTier.Bronze })
  tier!: LoyaltyTier;

  /**
   * حصانة Surge Pricing — تُمنح عند ترقية Gold
   * تنتهي صلاحيتها بعد 30 يوماً
   */
  @Column({ nullable: true, name: 'surge_immunity_until' })
  surgeImmunityUntil?: Date;

  /** عدد الترقيات المجانية المتبقية (Platinum) */
  @Column({ default: 0, name: 'free_upgrades_remaining' })
  freeUpgradesRemaining!: number;

  /** هل يملك إلغاء مجاني (Platinum) */
  @Column({ default: false, name: 'has_free_cancellation' })
  hasFreeCancellation!: boolean;

  /** الراكب المرتبط */
  @OneToOne(() => RiderEntity, (rider) => rider.loyalty)
  @JoinColumn({ name: 'rider_id' })
  rider!: RiderEntity;

  @Column({ unique: true, name: 'rider_id' })
  riderId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
