import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * سجل مراجعة إعدادات التطبيق
 * كل تغيير من لوحة التحكم يُسجَّل هنا للمراجعة والتدقيق
 */
@Entity('hancr_config_audit_log')
export class ConfigAuditLogEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** معرّف المسؤول الذي أجرى التغيير */
  @Column({ name: 'admin_id' })
  adminId!: number;

  /** بريد المسؤول */
  @Column({ name: 'admin_email' })
  adminEmail!: string;

  /** نوع الإعداد الذي تغيّر: theme | services | features | pricing | loyalty */
  @Column({ name: 'config_type' })
  configType!: string;

  /** نوع الإجراء: create | update | delete */
  @Column({ length: 20 })
  action!: string;

  /** القيمة قبل التغيير */
  @Column({ type: 'jsonb', nullable: true, name: 'previous_value' })
  previousValue?: Record<string, unknown>;

  /** القيمة بعد التغيير */
  @Column({ type: 'jsonb', nullable: true, name: 'new_value' })
  newValue?: Record<string, unknown>;

  /** سبب التغيير (اختياري) */
  @Column({ nullable: true })
  reason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
