import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DriverEntity } from './driver.entity';

/**
 * نظام Captain Stars — نظام الولاء الحصري للسائقين
 * كلما زادت النجوم، قلّت عمولة المنصة → دخل أعلى
 */
@Entity('hancr_driver_stars')
export class DriverStarsEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** إجمالي النجوم المكتسبة */
  @Column({ type: 'decimal', precision: 10, scale: 1, default: 0, name: 'total_stars' })
  totalStars!: number;

  /**
   * نسبة العمولة الحالية — تتحدث تلقائياً
   * 0-99 نجمة   → 20%
   * 100-299      → 17%
   * 300-699      → 15%
   * 700+         → 12%
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20, name: 'current_commission_percent' })
  currentCommissionPercent!: number;

  /** عدد الرحلات المكتملة */
  @Column({ default: 0, name: 'completed_rides' })
  completedRides!: number;

  /** متوسط التقييم */
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0, name: 'average_rating' })
  averageRating!: number;

  /** نجوم مكتسبة من تقييم عالي (4.8+) */
  @Column({ type: 'decimal', precision: 10, scale: 1, default: 0, name: 'stars_from_rating' })
  starsFromRating!: number;

  /** نجوم مكتسبة من رحلات بعيدة */
  @Column({ type: 'decimal', precision: 10, scale: 1, default: 0, name: 'stars_from_long_trips' })
  starsFromLongTrips!: number;

  /** نجوم مكتسبة من العمل في الذروة */
  @Column({ type: 'decimal', precision: 10, scale: 1, default: 0, name: 'stars_from_peak_hours' })
  starsFromPeakHours!: number;

  /** نجوم مكتسبة من عدم الإلغاء */
  @Column({ type: 'decimal', precision: 10, scale: 1, default: 0, name: 'stars_from_no_cancel' })
  starsFromNoCancel!: number;

  /** آخر يوم عمل بدون إلغاء (لحساب سلسلة الأسابيع) */
  @Column({ nullable: true, name: 'last_no_cancel_date' })
  lastNoCancelDate?: Date;

  /** عدد الأسابيع المتتالية بدون إلغاء */
  @Column({ default: 0, name: 'no_cancel_streak_weeks' })
  noCancelStreakWeeks!: number;

  /** السائق المرتبط */
  @OneToOne(() => DriverEntity, (driver) => driver.stars)
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity;

  @Column({ unique: true, name: 'driver_id' })
  driverId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
