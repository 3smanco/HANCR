import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * F2 — Corporate Accounts (B2B)
 *
 * شركة تدفع رحلات موظفيها. يديرها الأدمن:
 * - يشحن رصيدها (balance)
 * - يحدّد سقف شهري لكل موظف (monthlyCapPerEmployee)
 * - يضيف الموظفين عبر CompanyEmployeeEntity
 *
 * عند الحجز: الراكب الموظف يختار "حساب الشركة" بدل المحفظة الشخصية —
 * فيتم خصم الأجرة من balance الشركة (WalletService.debit بـ ownerType=Company)
 * مع احترام السقف الشهري.
 */
@Entity('hancr_company')
@Index(['status'])
export class CompanyEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  name!: string;

  @Column({ length: 255, nullable: true, name: 'contact_email' })
  contactEmail?: string;

  @Column({ length: 30, nullable: true, name: 'contact_phone' })
  contactPhone?: string;

  /** الرصيد المتاح بالعملة (يمكن للأدمن شحنه) */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance!: number;

  @Column({ length: 3, default: 'SAR' })
  currency!: string;

  /** سقف شهري لكل موظف (0 = بلا سقف) */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'monthly_cap_per_employee',
  })
  monthlyCapPerEmployee!: number;

  /** active | suspended */
  @Column({ length: 20, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
