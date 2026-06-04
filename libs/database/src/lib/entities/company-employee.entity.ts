import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

/**
 * F2 — ربط راكب بشركة (موظف).
 *
 * monthlySpent: نتتبّع المصاريف الشهرية الجارية لاحترام cap.
 * monthlyPeriod: 'YYYY-MM' — نُعيد تصفير monthlySpent عند تغيّر الشهر.
 */
@Entity('hancr_company_employee')
@Unique(['companyId', 'riderId'])
@Index(['riderId'])
@Index(['companyId'])
export class CompanyEmployeeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id' })
  companyId!: number;

  @Column({ name: 'rider_id' })
  riderId!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'monthly_spent' })
  monthlySpent!: number;

  /** YYYY-MM */
  @Column({ length: 7, name: 'monthly_period' })
  monthlyPeriod!: string;

  /** active | revoked */
  @Column({ length: 20, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
