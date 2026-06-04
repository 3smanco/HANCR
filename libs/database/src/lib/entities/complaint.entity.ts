import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * I9 — شكوى راكب أو سائق على رحلة (اختياري) أو شكوى عامة.
 *
 * Categories:
 *  - safety       — سلامة (سياقة خطيرة، تحرّش، حادث…)
 *  - fare         — أجرة (سعر خاطئ، خصم زائد…)
 *  - route        — مسار (تجوّل، انحراف…)
 *  - cleanliness  — نظافة
 *  - behavior     — سلوك (تعامل سيء…)
 *  - other        — أخرى
 *
 * Status flow: submitted → under_review → resolved | dismissed
 */
@Entity('hancr_complaint')
@Index(['status'])
@Index(['orderId'])
@Index(['reportedByType', 'reportedById'])
export class ComplaintEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true, name: 'order_id' })
  orderId?: number;

  /** 'rider' | 'driver' */
  @Column({ length: 10, name: 'reported_by_type' })
  reportedByType!: string;

  @Column({ name: 'reported_by_id' })
  reportedById!: number;

  @Column({ length: 40 })
  category!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 20, default: 'submitted' })
  status!: string;

  @Column({ type: 'text', nullable: true, name: 'resolution_note' })
  resolutionNote?: string;

  @Column({ nullable: true, name: 'assigned_to' })
  assignedTo?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt?: Date;
}
