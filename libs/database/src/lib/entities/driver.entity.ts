import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DriverStatus } from '../enums/driver-status.enum';
import { OrderEntity } from './order.entity';
import { DriverStarsEntity } from './driver-stars.entity';

/**
 * السائق — شريك HANCR في تقديم الخدمة
 */
@Entity('hancr_driver')
export class DriverEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** رقم الهاتف */
  @Column({ unique: true, name: 'phone_number' })
  phoneNumber!: string;

  /** رمز الدولة */
  @Column({ length: 5, name: 'country_code' })
  countryCode!: string;

  /** الاسم الأول */
  @Column({ name: 'first_name' })
  firstName!: string;

  /** الاسم الأخير */
  @Column({ name: 'last_name' })
  lastName!: string;

  /** صورة الملف الشخصي */
  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl?: string;

  /** حالة السائق — تُحدَّث في Redis للمطابقة الفورية */
  @Column({ type: 'enum', enum: DriverStatus, default: DriverStatus.Offline })
  status!: DriverStatus;

  /** هل الحساب محظور */
  @Column({ default: false })
  banned!: boolean;

  /** هل الحساب مفعّل ومعتمد */
  @Column({ default: false })
  active!: boolean;

  /** تقييم السائق (1-5) */
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  rating!: number;

  /** عدد التقييمات */
  @Column({ default: 0, name: 'rating_count' })
  ratingCount!: number;

  /** ===== بيانات السيارة ===== */

  /** ماركة السيارة */
  @Column({ nullable: true, name: 'car_brand' })
  carBrand?: string;

  /** موديل السيارة */
  @Column({ nullable: true, name: 'car_model' })
  carModel?: string;

  /** لون السيارة */
  @Column({ nullable: true, name: 'car_color' })
  carColor?: string;

  /** رقم اللوحة */
  @Column({ nullable: true, name: 'plate_number' })
  plateNumber?: string;

  /** سنة الصنع */
  @Column({ nullable: true, name: 'car_year' })
  carYear?: number;

  /** صورة السيارة */
  @Column({ nullable: true, name: 'car_photo_url' })
  carPhotoUrl?: string;

  /** ===== المالية ===== */

  /** رصيد المحفظة */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance!: number;

  /** عملة المحفظة */
  @Column({ length: 3, default: 'QAR' })
  currency!: string;

  /** ===== المنطقة ===== */

  /** المنطقة التي يعمل فيها */
  @Column({ nullable: true, name: 'region_id' })
  regionId?: number;

  /** Firebase FCM token */
  @Column({ nullable: true, name: 'fcm_token' })
  fcmToken?: string;

  /** الخدمات التي يقدمها (JSONB: serviceIds[]) */
  @Column({ type: 'jsonb', default: '[]', name: 'service_ids' })
  serviceIds!: number[];

  /** هل ينتمي لأسطول (Fleet) */
  @Column({ nullable: true, name: 'fleet_id' })
  fleetId?: number;

  /** الرحلات */
  @OneToMany(() => OrderEntity, (order) => order.driver)
  orders!: OrderEntity[];

  /** نظام النجوم */
  @OneToOne(() => DriverStarsEntity, (stars) => stars.driver)
  stars?: DriverStarsEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
