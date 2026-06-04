import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * حق الراكب باستخدام حزمة رحلات — يُنشَأ عند شراء RideBundle.
 *
 * status:
 *  - 'active':    لديه رحلات وغير منتهي
 *  - 'exhausted': نَفِدَت الرحلات
 *  - 'expired':   مرّت expiresAt
 *  - 'cancelled': ألغاه الأدمن
 */
@Entity('hancr_rider_entitlement')
@Index(['riderId'])
@Index(['status'])
export class RiderEntitlementEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'rider_id' })
  riderId!: number;

  @Column({ name: 'bundle_id' })
  bundleId!: number;

  /** اسم الحزمة وقت الشراء (snapshot) */
  @Column({ length: 100, name: 'bundle_name' })
  bundleName!: string;

  /** عدد الرحلات الإجمالي عند الشراء */
  @Column({ type: 'int', name: 'rides_total' })
  ridesTotal!: number;

  /** المتبقي من الرحلات */
  @Column({ type: 'int', name: 'rides_remaining' })
  ridesRemaining!: number;

  /** أقصى مسافة لكل رحلة (snapshot) */
  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0, name: 'max_distance_km' })
  maxDistanceKm!: number;

  /** انتهاء الصلاحية */
  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt!: Date;

  /** المبلغ المدفوع */
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount_paid' })
  amountPaid!: number;

  @Column({ length: 3, default: 'SAR' })
  currency!: string;

  /** active | exhausted | expired | cancelled */
  @Column({ length: 20, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
