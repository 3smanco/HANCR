import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * اشتراك التنقّل اليومي/الشهري (Commuter) — يقوم بحجز رحلة آلياً
 * قبل الموعد بـ 10 دقائق في الأيام المختارة (للموظفين والطلاب).
 *
 * - `outboundTime` / `returnTime`: HH:mm (24h) بالتوقيت المحلي للمنطقة.
 * - `daysOfWeek`: 0=الأحد … 6=السبت.
 * - عند الإيقاف المؤقت (`active=false`) لا ينتج عنه أي حجوزات.
 */
@Entity('hancr_commuter_subscription')
@Index(['riderId'])
@Index(['active'])
export class CommuterSubscriptionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'rider_id' })
  riderId!: number;

  /** بيانات المنزل */
  @Column({ length: 255, name: 'home_address' })
  homeAddress!: string;
  @Column({ type: 'double precision', name: 'home_lat' })
  homeLat!: number;
  @Column({ type: 'double precision', name: 'home_lng' })
  homeLng!: number;

  /** بيانات العمل/الجامعة */
  @Column({ length: 255, name: 'work_address' })
  workAddress!: string;
  @Column({ type: 'double precision', name: 'work_lat' })
  workLat!: number;
  @Column({ type: 'double precision', name: 'work_lng' })
  workLng!: number;

  /** HH:mm — موعد الذهاب (من المنزل إلى العمل). null = بلا ذهاب */
  @Column({ type: 'varchar', length: 5, nullable: true, name: 'outbound_time' })
  outboundTime?: string;

  /** HH:mm — موعد العودة (من العمل إلى المنزل). null = بلا عودة */
  @Column({ type: 'varchar', length: 5, nullable: true, name: 'return_time' })
  returnTime?: string;

  /** أيام الأسبوع (0=الأحد … 6=السبت) */
  @Column({ type: 'int', array: true, default: '{0,1,2,3,4}', name: 'days_of_week' })
  daysOfWeek!: number[];

  /** daily | monthly */
  @Column({ length: 10, default: 'daily', name: 'plan_type' })
  planType!: string;

  /** نوع الاشتراك: commuter | school | campus | medical */
  @Column({ length: 20, default: 'commuter', name: 'subscription_type' })
  subscriptionType!: string;

  /** اسم الطفل (للنقل المدرسي) */
  @Column({ length: 100, nullable: true, name: 'child_name' })
  childName?: string;

  /** هاتف ولي الأمر الاحتياطي */
  @Column({ length: 20, nullable: true, name: 'parent_phone' })
  parentPhone?: string;

  /** ملاحظات طبية (للنقل الطبي) */
  @Column({ type: 'text', nullable: true, name: 'medical_notes' })
  medicalNotes?: string;

  /** يحتاج كرسي متحرك / مقعد فسيح */
  @Column({ default: false, name: 'wheelchair_needed' })
  wheelchairNeeded!: boolean;

  /** تكرار التشغيل: daily | weekly | biweekly | monthly */
  @Column({ length: 20, default: 'daily' })
  recurrence!: string;

  /** السائق المفضّل (VIP / اشتراك مع نفس السائق) */
  @Column({ type: 'int', nullable: true, name: 'preferred_driver_id' })
  preferredDriverId?: number;

  /** وضع ليلي: سعر ثابت + مشاركة موقع للطوارئ */
  @Column({ default: false, name: 'night_shift' })
  nightShift!: boolean;

  /** مفعّل / موقوف مؤقتاً */
  @Column({ default: true })
  active!: boolean;

  @Column({ name: 'service_id' })
  serviceId!: number;

  @Column({ name: 'region_id' })
  regionId!: number;

  /** كم دقيقة قبل الموعد ننشئ الطلب (افتراضي 10) */
  @Column({ type: 'int', default: 10, name: 'lead_minutes' })
  leadMinutes!: number;

  /** آخر تشغيل ذهاب — لمنع التكرار في نفس اليوم */
  @Column({ type: 'date', nullable: true, name: 'last_outbound_date' })
  lastOutboundDate?: string;

  /** آخر تشغيل عودة — لمنع التكرار في نفس اليوم */
  @Column({ type: 'date', nullable: true, name: 'last_return_date' })
  lastReturnDate?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
