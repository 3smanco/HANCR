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
import { OrderStatus } from '../enums/order-status.enum';
import { OrderType } from '../enums/order-type.enum';
import { PaymentMode } from '../enums/payment-mode.enum';
import { GeoPoint } from '../interfaces/point.interface';
import { GeoPointsTransformer } from '../transformers/geo-points.transformer';
import { RiderEntity } from './rider.entity';
import { DriverEntity } from './driver.entity';
import { ServiceEntity } from './service.entity';
import { RegionEntity } from './region.entity';
import { RequestActivityEntity } from './request-activity.entity';
import { OrderMessageEntity } from './order-message.entity';

/**
 * الطلب الرئيسي — قلب نظام HANCR
 * يمر بـ 14 حالة كاملة مُوثَّقة بـ Audit Trail
 * يحتوي على جميع الميزات الحصرية: OTP, Ride Moods, Bid, ...
 */
@Entity('hancr_order')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ name: 'created_on' })
  createdOn!: Date;

  /** نوع الطلب */
  @Column({ type: 'enum', enum: OrderType, default: OrderType.Ride })
  type!: OrderType;

  /** حالة الطلب الحالية */
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Requested })
  status!: OrderStatus;

  /** وقت بدء الرحلة */
  @Column({ nullable: true, name: 'start_timestamp' })
  startTimestamp?: Date;

  /** وقت انتهاء الرحلة */
  @Column({ nullable: true, name: 'finish_timestamp' })
  finishTimestamp?: Date;

  /** الوقت المتوقع للطلب (للحجز المسبق) */
  @Column({ nullable: true, name: 'expected_timestamp' })
  expectedTimestamp?: Date;

  /** الوقت المتوقع لوصول السائق */
  @Column({ nullable: true, name: 'eta_pickup' })
  etaPickup?: Date;

  /** ===== التسعير ===== */

  /** أفضل سعر محسوب */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'cost_best' })
  costBest!: number;

  /** السعر بعد الخصم */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'cost_after_coupon' })
  costAfterCoupon!: number;

  /** الكوبون المُطبَّق (إن وُجد) */
  @Column({ type: 'int', nullable: true, name: 'coupon_id' })
  couponId?: number;

  /** كود الكوبون المُطبَّق (للعرض) */
  @Column({ type: 'varchar', length: 40, nullable: true, name: 'coupon_code' })
  couponCode?: string;

  /** مبلغ الخصم المُطبَّق */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'discount_amount' })
  discountAmount!: number;

  /** المبلغ المدفوع فعلاً */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'paid_amount' })
  paidAmount!: number;

  /** حصة المنصة */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'provider_share' })
  providerShare!: number;

  /** البقشيش */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tip_amount' })
  tipAmount!: number;

  /** تكلفة الانتظار */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'wait_cost' })
  waitCost!: number;

  /** تكلفة خيارات إضافية */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'ride_options_cost' })
  rideOptionsCost!: number;

  /** الضريبة */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tax_cost' })
  taxCost!: number;

  /** عملة الطلب */
  @Column({ length: 3, default: 'QAR' })
  currency!: string;

  /** ===== المسار ===== */

  /** المسافة المحسوبة بالأمتار */
  @Column({ default: 0, name: 'distance_best' })
  distanceBest!: number;

  /** المدة المحسوبة بالثواني */
  @Column({ default: 0, name: 'duration_best' })
  durationBest!: number;

  /** دقائق الانتظار */
  @Column({ default: 0, name: 'wait_minutes' })
  waitMinutes!: number;

  /** نقاط المسار المطلوب [نقطة الانطلاق, ...محطات, الوجهة] */
  @Column({
    type: 'text',
    transformer: new GeoPointsTransformer(),
    nullable: true,
  })
  points?: GeoPoint[];

  /** العناوين النصية المقابلة للنقاط */
  @Column({
    type: 'jsonb',
    default: '[]',
  })
  addresses!: string[];

  /** نقاط المسار الفعلي (اتجاهات) */
  @Column({
    type: 'text',
    transformer: new GeoPointsTransformer(),
    nullable: true,
  })
  directions?: GeoPoint[];

  /** ===== ميزات حصرية — Ride Moods ===== */

  /** طلب رحلة صامتة — تنبيه للسائق */
  @Column({ default: false, name: 'quiet_ride' })
  quietRide!: boolean;

  /** درجة الحرارة المطلوبة للتكييف */
  @Column({ nullable: true, name: 'requested_temperature' })
  requestedTemperature?: number;

  /** طلب إيقاف الصوت */
  @Column({ default: false, name: 'audio_off' })
  audioOff!: boolean;

  /** تشفير أرقام الهاتف (Number Masking) */
  @Column({ default: false, name: 'number_masked' })
  numberMasked!: boolean;

  /** وضع العائلة — يفضّل سائقات وسلوكاً مناسباً للعائلة */
  @Column({ default: false, name: 'family_mode' })
  familyMode!: boolean;

  /** تفضيل صريح لسائقة (يمكن استخدامه حتى بدون وضع العائلة) */
  @Column({ default: false, name: 'prefer_female_driver' })
  preferFemaleDriver!: boolean;

  /** ===== ميزة OTP للتسليم الآمن ===== */

  /** رمز OTP المولّد (4 أرقام) */
  @Column({ nullable: true, length: 6, name: 'otp_code' })
  otpCode?: string;

  /** وقت انتهاء صلاحية OTP */
  @Column({ nullable: true, name: 'otp_expires_at' })
  otpExpiresAt?: Date;

  /** عدد محاولات OTP الفاشلة */
  @Column({ default: 0, name: 'otp_attempts' })
  otpAttempts!: number;

  /** هاتف المستلم (لإرسال OTP) */
  @Column({ nullable: true, name: 'receiver_phone' })
  receiverPhone?: string;

  /** اسم المستلم */
  @Column({ nullable: true, name: 'receiver_name' })
  receiverName?: string;

  /** ===== Bid Mode ===== */

  /** هل هذا الطلب عبر Bid Mode */
  @Column({ default: false, name: 'is_bid_order' })
  isBidOrder!: boolean;

  /** معرّف المزايدة المرتبطة */
  @Column({ nullable: true, name: 'bid_id' })
  bidId?: number;

  /** ===== سائق بالساعة ===== */

  /** عدد الساعات المحجوزة (HourlyChauffeur) */
  @Column({ nullable: true, name: 'booked_hours' })
  bookedHours?: number;

  /** ===== طرق الدفع ===== */

  @Column({ type: 'enum', enum: PaymentMode, nullable: true, name: 'payment_mode' })
  paymentMode?: PaymentMode;

  /** ===== العلاقات ===== */

  @ManyToOne(() => RiderEntity, (rider) => rider.orders)
  @JoinColumn({ name: 'rider_id' })
  rider!: RiderEntity;

  @Column({ name: 'rider_id' })
  riderId!: number;

  @ManyToOne(() => DriverEntity, (driver) => driver.orders, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver?: DriverEntity;

  @Column({ nullable: true, name: 'driver_id' })
  driverId?: number;

  @ManyToOne(() => ServiceEntity, (service) => service.orders)
  @JoinColumn({ name: 'service_id' })
  service!: ServiceEntity;

  @Column({ name: 'service_id' })
  serviceId!: number;

  @ManyToOne(() => RegionEntity, (region) => region.orders)
  @JoinColumn({ name: 'region_id' })
  region!: RegionEntity;

  @Column({ name: 'region_id' })
  regionId!: number;

  /** سجل أحداث الطلب (Audit Trail) */
  @OneToMany(() => RequestActivityEntity, (activity) => activity.order)
  activities!: RequestActivityEntity[];

  /** محادثة الراكب والسائق */
  @OneToMany(() => OrderMessageEntity, (message) => message.order)
  messages!: OrderMessageEntity[];

  /** معرّف المجموعة (Pool) إذا كان الطلب على حساب مجموعة */
  @Column({ nullable: true, name: 'pool_id' })
  poolId?: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
