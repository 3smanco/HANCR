import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CouponType } from '../enums/coupon-type.enum';

/**
 * كوبونات الخصم — يُنشئها الأدمن ويُطبّقها الراكب عند الحجز.
 * التتبع: usedCount عالمي + حد لكل مستخدم يُفرض بعدّ الطلبات الحاملة لنفس couponId.
 */
@Entity('hancr_coupon')
export class CouponEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** الكود الذي يُدخله الراكب (يُخزَّن بأحرف كبيرة) */
  @Index({ unique: true })
  @Column({ length: 40 })
  code!: string;

  /** نسبة مئوية أو مبلغ ثابت */
  @Column({ type: 'enum', enum: CouponType, default: CouponType.Percent })
  type!: CouponType;

  /** قيمة الخصم: نسبة (0..100) أو مبلغ ثابت */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value!: number;

  /** الحد الأقصى لمبلغ الخصم (للنسبة المئوية) — 0 = بلا سقف */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'max_discount' })
  maxDiscount!: number;

  /** أقل أجرة يصلح معها الكوبون */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'min_fare' })
  minFare!: number;

  /** أقصى عدد استخدامات إجمالي — 0 = غير محدود */
  @Column({ type: 'int', default: 0, name: 'max_uses' })
  maxUses!: number;

  /** عدد مرات الاستخدام الحالية */
  @Column({ type: 'int', default: 0, name: 'used_count' })
  usedCount!: number;

  /** حد الاستخدام لكل راكب — 0 = غير محدود */
  @Column({ type: 'int', default: 1, name: 'per_user_limit' })
  perUserLimit!: number;

  /** المناطق المسموح بها — فارغ = كل المناطق */
  @Column({ type: 'int', array: true, default: '{}', name: 'region_ids' })
  regionIds!: number[];

  /** تاريخ انتهاء الصلاحية — null = بلا انتهاء */
  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  /** مفعّل / معطّل */
  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
