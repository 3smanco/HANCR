import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceType } from '../enums/service-type.enum';
import { RegionEntity } from './region.entity';
import { OrderEntity } from './order.entity';

/**
 * الخدمة — يحدد نوع الرحلة ومعادلة التسعير الكاملة
 * يأتي من السيرفر عبر SDUI — قابل للتعديل بدون تحديث التطبيق
 */
@Entity('hancr_service')
export class ServiceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** اسم الخدمة بالعربية (يظهر في التطبيق) */
  @Column({ length: 100 })
  name!: string;

  /** اسم الخدمة بالإنجليزية */
  @Column({ length: 100, name: 'name_en' })
  nameEn!: string;

  /** نوع الخدمة — يحدد منطق التسعير */
  @Column({ type: 'enum', enum: ServiceType, name: 'service_type' })
  serviceType!: ServiceType;

  /** ===== معادلة التسعير الأساسية ===== */

  /** الأجرة الأساسية عند بدء الرحلة */
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'base_fare' })
  baseFare!: number;

  /** السعر لكل 100 متر */
  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'per_hundred_meters' })
  perHundredMeters!: number;

  /** السعر لكل دقيقة أثناء القيادة */
  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'per_minute_drive' })
  perMinuteDrive!: number;

  /** السعر لكل دقيقة انتظار */
  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'per_minute_wait' })
  perMinuteWait!: number;

  /** الحد الأدنى للأجرة */
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'minimum_fee' })
  minimumFee!: number;

  /** سعر الساعة (للـ HourlyChauffeur فقط) */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'hourly_rate' })
  hourlyRate?: number;

  /** سعر الدقيقة الإضافية بعد نهاية الساعات المحجوزة */
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, name: 'extra_minute_rate' })
  extraMinuteRate?: number;

  /** ===== العمولات ===== */

  /** نسبة عمولة المنصة الافتراضية (20%) */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20, name: 'provider_share_percent' })
  providerSharePercent!: number;

  /** نسبة الدفع المسبق */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'prepay_percent' })
  prepayPercent!: number;

  /** رسوم الإلغاء الكاملة */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'cancellation_total_fee' })
  cancellationTotalFee!: number;

  /** حصة السائق من رسوم الإلغاء */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 50, name: 'cancellation_driver_share' })
  cancellationDriverShare!: number;

  /** ===== مضاعفات التسعير الديناميكي ===== */

  /** مضاعفات حسب الوقت: [{startHour, endHour, multiplier}] */
  @Column({ type: 'jsonb', default: '[]', name: 'time_multipliers' })
  timeMultipliers!: Array<{ startHour: number; endHour: number; multiplier: number }>;

  /** مضاعفات حسب يوم الأسبوع: [{weekdays, multiplier}] */
  @Column({ type: 'jsonb', default: '[]', name: 'weekday_multipliers' })
  weekdayMultipliers!: Array<{ weekdays: number[]; multiplier: number }>;

  /** مضاعفات حسب نطاق تاريخ: [{from, to, multiplier, label}] */
  @Column({ type: 'jsonb', default: '[]', name: 'date_range_multipliers' })
  dateRangeMultipliers!: Array<{ from: string; to: string; multiplier: number; label?: string }>;

  /** ===== الإعدادات ===== */

  /** نطاق البحث عن السائقين بالأمتار */
  @Column({ default: 5000, name: 'search_radius' })
  searchRadius!: number;

  /** وقت البدء المتاح (HH:MM) */
  @Column({ nullable: true, name: 'available_time_from' })
  availableTimeFrom?: string;

  /** وقت الانتهاء المتاح (HH:MM) */
  @Column({ nullable: true, name: 'available_time_to' })
  availableTimeTo?: string;

  /** هل هذه الخدمة تدعم Bid Mode */
  @Column({ default: false, name: 'bid_mode_enabled' })
  bidModeEnabled!: boolean;

  /** هل الخدمة تظهر في التطبيق */
  @Column({ default: true })
  enabled!: boolean;

  /** ترتيب ظهور الخدمة في القائمة */
  @Column({ default: 0, name: 'display_order' })
  displayOrder!: number;

  /** أيقونة الخدمة (URL أو اسم asset) */
  @Column({ nullable: true, name: 'icon_url' })
  iconUrl?: string;

  /** هل هذه خدمة VIP (تُشغّل VIP Skin) */
  @Column({ default: false, name: 'is_vip' })
  isVip!: boolean;

  /** المنطقة التي تنتمي إليها الخدمة */
  @ManyToOne(() => RegionEntity, (region) => region.services)
  @JoinColumn({ name: 'region_id' })
  region!: RegionEntity;

  @Column({ name: 'region_id' })
  regionId!: number;

  /** الطلبات التي استخدمت هذه الخدمة */
  @OneToMany(() => OrderEntity, (order) => order.service)
  orders!: OrderEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
