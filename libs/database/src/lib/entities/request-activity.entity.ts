import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RequestActivityType } from '../enums/request-activity-type.enum';
import { OrderEntity } from './order.entity';

/**
 * سجل أحداث الطلب — Audit Trail الكامل
 * كل حدث في دورة حياة الطلب يُحفظ هنا بالتفصيل
 */
@Entity('hancr_request_activity')
export class RequestActivityEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** نوع الحدث */
  @Column({ type: 'enum', enum: RequestActivityType })
  type!: RequestActivityType;

  /** بيانات إضافية للحدث (JSONB) */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  /** وقت الحدث */
  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt!: Date;

  /** الطلب المرتبط */
  @ManyToOne(() => OrderEntity, (order) => order.activities)
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ name: 'order_id' })
  orderId!: number;
}
