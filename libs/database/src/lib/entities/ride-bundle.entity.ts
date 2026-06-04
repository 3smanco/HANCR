import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * حزمة رحلات مسبقة الدفع — يديرها الأدمن.
 * مثال: "10 رحلات قصيرة" بـ150 ر.س لمدة 30 يوماً، أقصى مسافة 10 كم.
 */
@Entity('hancr_ride_bundle')
@Index(['active'])
@Index(['regionId'])
export class RideBundleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  /** عدد الرحلات المتضمَّنة */
  @Column({ type: 'int', name: 'rides_count' })
  ridesCount!: number;

  /** السعر (بالعملة الكاملة لا cents) */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ length: 3, default: 'SAR' })
  currency!: string;

  /** مدة الصلاحية بالأيام */
  @Column({ type: 'int', default: 30, name: 'validity_days' })
  validityDays!: number;

  /** أقصى مسافة لكل رحلة بالكيلومتر (0 = بلا حد) */
  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0, name: 'max_distance_km' })
  maxDistanceKm!: number;

  @Column({ name: 'region_id' })
  regionId!: number;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
