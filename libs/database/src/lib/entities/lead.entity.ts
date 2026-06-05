import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * J2 — Marketing-site lead. One row per form submission from hancr.com
 * (driver sign-up, business sales, generic contact, careers).
 *
 * Status flow: new → contacted → qualified | rejected
 */
@Entity('hancr_lead')
@Index(['type', 'status', 'createdAt'])
export class LeadEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 30 })
  type!: string; // 'driver_signup' | 'business' | 'contact' | 'careers'

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 120 })
  email!: string;

  @Column({ length: 30, nullable: true })
  phone?: string;

  @Column({ length: 80, nullable: true })
  company?: string;

  @Column({ length: 80, nullable: true })
  city?: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ length: 20, default: 'new' })
  status!: string; // 'new' | 'contacted' | 'qualified' | 'rejected'

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'source_ip', length: 60, nullable: true })
  sourceIp?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
