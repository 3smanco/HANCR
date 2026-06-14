import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceEntity } from './service.entity';
import { OrderEntity } from './order.entity';

/**
 * المنطقة الجغرافية — كل مدينة كيان مستقل
 * يتحكم في: العملة، الميزات، الأسعار، حدود الخريطة
 */
@Entity('hancr_region')
export class RegionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** اسم المنطقة بالعربية */
  @Column({ length: 100 })
  name!: string;

  /** اسم المنطقة بالإنجليزية */
  @Column({ length: 100, name: 'name_en' })
  nameEn!: string;

  /** رمز العملة المحلية — QAR | AED | SAR */
  @Column({ length: 3 })
  currency!: string;

  /** هل المنطقة مفعّلة */
  @Column({ default: true })
  enabled!: boolean;

  /** حدود المنطقة الجغرافية — مُخزَّن كـ JSONB (مصفوفة نقاط Polygon) */
  @Column({ type: 'jsonb', nullable: true })
  boundary?: Record<string, unknown>;

  /** هل Bid Mode مفعّل في هذه المنطقة */
  @Column({ default: false, name: 'bid_mode_enabled' })
  bidModeEnabled!: boolean;

  /** رابط API مترو المنطقة (للتنقل المتعدد الوسائط) */
  @Column({ nullable: true, name: 'metro_api_url' })
  metroApiUrl?: string;

  /** نصف قطر البحث الافتراضي عن السائقين (بالأمتار) */
  @Column({ default: 5000, name: 'default_search_radius' })
  defaultSearchRadius!: number;

  /** الدولة الأم في التسلسل العالمي (nullable للتوافق الرجعي). */
  @Column({ nullable: true, name: 'country_id' })
  countryId?: number;

  /** المدينة الأم (nullable). */
  @Column({ nullable: true, name: 'city_id' })
  cityId?: number;

  /** التوقيت المحلي (IANA tz) — يُورَّث من المدينة/الدولة افتراضياً. */
  @Column({ length: 64, nullable: true })
  timezone?: string;

  /** الخدمات المتاحة في هذه المنطقة */
  @OneToMany(() => ServiceEntity, (service) => service.region)
  services!: ServiceEntity[];

  /** الطلبات المنفذة في هذه المنطقة */
  @OneToMany(() => OrderEntity, (order) => order.region)
  orders!: OrderEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
