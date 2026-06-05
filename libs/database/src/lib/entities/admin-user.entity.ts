import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * I5 — مستخدم لوحة الإدارة.
 *
 * Roles:
 *   super     — كل الصلاحيات
 *   ops       — العمليات: السائقين/الطلبات/التعيين اليدوي/الشكاوى
 *   finance   — المالية: المحافظ/الـ Payouts/الكوبونات/الشركات
 *   marketing — التسويق: البانرات/الإشعارات/الإعلانات/الـ Bundles
 *   support   — الدعم: عرض فقط + معالجة الشكاوى
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

  @Column({ default: true })
  active!: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
