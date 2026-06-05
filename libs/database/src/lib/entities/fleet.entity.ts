import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * I10 — أسطول/شركة تاكسي تابعة. تختلف عن CompanyEntity (F2):
 *   - Company = حساب B2B لدفع رحلات الموظفين
 *   - Fleet   = مزوّد سائقين تابع للمنصة (ينتسب له سائقون، له عمولة منفصلة، له منطقة حصرية)
 *
 * exclusivity_region_ids: لو السائق ينتمي لأسطول فعّال في منطقة الطلب
 * يحصل على أولوية مطلقة في المطابقة على غير المنتمين.
 */
@Entity('hancr_fleet')
@Index(['active'])
export class FleetEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  name!: string;

  @Column({ length: 100, nullable: true, name: 'owner_name' })
  ownerName?: string;

  @Column({ length: 30, nullable: true, name: 'contact_phone' })
  contactPhone?: string;

  @Column({ length: 255, nullable: true, name: 'contact_email' })
  contactEmail?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance!: number;

  @Column({ length: 3, default: 'SAR' })
  currency!: string;

  /** نسبة عمولة المنصة على رحلات هذا الأسطول */
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'commission_percent',
  })
  commissionPercent!: number;

  @Column({
    type: 'int',
    array: true,
    default: '{}',
    name: 'exclusivity_region_ids',
  })
  exclusivityRegionIds!: number[];

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
