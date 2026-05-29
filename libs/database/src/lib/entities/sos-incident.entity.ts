import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { SosStatus, SosTriggeredBy } from '../enums/sos.enum';

/**
 * SosIncident — حادثة طوارئ (SOS)
 *
 * Flow:
 *  1. Rider/Driver يضغط زر SOS → ينشأ سجل Active
 *  2. النظام يُرسل SMS فوراً لكل جهات الطوارئ + push للأدمن
 *  3. الموقع يُحدَّث كل 5 ثوان (آخر موقع في latitude/longitude)
 *  4. الأدمن يصعِّد للشرطة أو يُغلق
 *  5. الراكب/السائق يمكنه cancel إن كان false alarm
 */
@Entity('hancr_sos_incident')
@Index(['status'])
@Index(['createdAt'])
@Index(['triggeredBy', 'triggeredById'])
export class SosIncidentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // ── من فعَّل الإنذار ────────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: SosTriggeredBy,
    name: 'triggered_by',
  })
  triggeredBy!: SosTriggeredBy;

  /** id الراكب أو السائق الذي فعَّل الإنذار */
  @Column({ type: 'int', name: 'triggered_by_id' })
  triggeredById!: number;

  // ── الرحلة المرتبطة (إن وُجدت) ──────────────────────────────────────────
  @Column({ type: 'int', nullable: true, name: 'order_id' })
  orderId?: number;

  @ManyToOne(() => OrderEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order?: OrderEntity;

  // ── الموقع وقت التفعيل ──────────────────────────────────────────────────
  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  /** آخر موقع معروف (يُحدَّث كل تحديث location) */
  @Column({ type: 'double precision', nullable: true, name: 'last_latitude' })
  lastLatitude?: number;

  @Column({ type: 'double precision', nullable: true, name: 'last_longitude' })
  lastLongitude?: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_location_at' })
  lastLocationAt?: Date;

  // ── الحالة ───────────────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: SosStatus,
    default: SosStatus.Active,
  })
  status!: SosStatus;

  /** ملاحظة من الأدمن (سبب التصعيد، توثيق المكالمة...) */
  @Column({ type: 'text', nullable: true, name: 'admin_note' })
  adminNote?: string;

  /** عدد جهات الطوارئ التي تم إشعارها */
  @Column({ type: 'int', default: 0, name: 'contacts_notified' })
  contactsNotified!: number;

  /** هل أُبلغت الشرطة */
  @Column({ type: 'boolean', default: false, name: 'police_notified' })
  policeNotified!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt?: Date;
}
