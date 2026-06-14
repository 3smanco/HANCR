import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * نطاق جغرافي للمشغّل (RBAC مُنطقَن). null/فارغ = عالمي.
 * `super` دائماً عالمي بغضّ النظر عن النطاق.
 */
export interface OperatorScope {
  /** رموز ISO-2 للدول المسموح بها (QA, GB). */
  countries?: string[];
  /** معرّفات المدن المسموح بها (تُضيّق ضمن الدول). */
  cities?: number[];
}

/**
 * I5 — مستخدم لوحة الإدارة.
 *
 * Roles:
 *   super     — كل الصلاحيات (عالمي دائماً)
 *   ops       — العمليات: السائقين/الطلبات/التعيين اليدوي/الشكاوى
 *   finance   — المالية: المحافظ/الـ Payouts/الكوبونات/الشركات
 *   marketing — التسويق: البانرات/الإشعارات/الإعلانات/الـ Bundles
 *   support   — الدعم: عرض فقط + معالجة الشكاوى
 *
 * scope — نطاق جغرافي يقيّد ما يراه المشغّل. null = عالمي.
 */
@Entity('hancr_admin_user')
@Index(['email'])
@Index(['active'])
export class AdminUserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ type: 'text', name: 'password_hash' })
  passwordHash!: string;

  @Column({ length: 100, nullable: true, name: 'full_name' })
  fullName?: string;

  @Column({ length: 40, default: 'support' })
  role!: string;

  /** النطاق الجغرافي (دول/مدن). null = عالمي. */
  @Column({ type: 'jsonb', nullable: true })
  scope?: OperatorScope;

  @Column({ default: true })
  active!: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
