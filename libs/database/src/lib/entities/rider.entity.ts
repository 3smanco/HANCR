import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { LoyaltyEntity } from './loyalty.entity';

/**
 * الراكب — المستخدم الأساسي لتطبيق HANCR
 */
@Entity('hancr_rider')
export class RiderEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** رقم الهاتف — المعرّف الأساسي للتسجيل */
  @Column({ unique: true, name: 'phone_number' })
  phoneNumber!: string;

  /** رمز الدولة (+974 قطر، +971 الإمارات، ...) */
  @Column({ length: 5, name: 'country_code' })
  countryCode!: string;

  /** الاسم الأول */
  @Column({ nullable: true, name: 'first_name' })
  firstName?: string;

  /** الاسم الأخير */
  @Column({ nullable: true, name: 'last_name' })
  lastName?: string;

  /** صورة الملف الشخصي */
  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl?: string;

  /** البريد الإلكتروني */
  @Column({ nullable: true, unique: true })
  email?: string;

  /** معرّف حساب Google المرتبط (Sign-in with Google) */
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true, name: 'google_id' })
  googleId?: string;

  /** هل الحساب محظور */
  @Column({ default: false })
  banned!: boolean;

  /** سبب الحظر */
  @Column({ nullable: true, name: 'ban_reason' })
  banReason?: string;

  /** هل الحساب مفعّل */
  @Column({ default: true })
  active!: boolean;

  /** رصيد المحفظة */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance!: number;

  /** عملة المحفظة */
  @Column({ length: 3, default: 'QAR' })
  currency!: string;

  /** Firebase FCM token للإشعارات */
  @Column({ nullable: true, name: 'fcm_token' })
  fcmToken?: string;

  /** رابط بـ Pool (مجموعة عائلية أو مؤسسية) */
  @Column({ nullable: true, name: 'pool_id' })
  poolId?: number;

  /** كود الإحالة الخاص بالراكب (يشاركه لدعوة الأصدقاء) */
  @Column({ type: 'varchar', length: 12, nullable: true, unique: true, name: 'referral_code' })
  referralCode?: string;

  /** معرّف الراكب الذي أحال هذا الراكب (إن وُجد) */
  @Column({ type: 'int', nullable: true, name: 'referred_by' })
  referredBy?: number;

  /** هل مُنحت مكافأة الإحالة (تُمنح عند أول رحلة مكتملة) */
  @Column({ default: false, name: 'referral_rewarded' })
  referralRewarded!: boolean;

  /** تقييم الراكب (من 1 إلى 5) */
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  rating!: number;

  /** عدد مرات تقييم السائقين للراكب (لحساب المتوسط المرجّح) */
  @Column({ type: 'int', default: 0, name: 'rating_count' })
  ratingCount!: number;

  /** الجنس — لتفعيل وضع women_only في Carpool والتفضيلات */
  @Column({ length: 1, nullable: true })
  gender?: string;

  /** عدد الرحلات المكتملة */
  @Column({ default: 0, name: 'total_rides' })
  totalRides!: number;

  /** آخر تسجيل دخول */
  @Column({ nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  /** الرحلات */
  @OneToMany(() => OrderEntity, (order) => order.rider)
  orders!: OrderEntity[];

  /** نظام الولاء */
  @OneToOne(() => LoyaltyEntity, (loyalty) => loyalty.rider)
  loyalty?: LoyaltyEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
