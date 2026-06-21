import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';

/**
 * رسائل المحادثة بين الراكب والسائق أثناء الرحلة
 */
@Entity('hancr_order_message')
export class OrderMessageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** نص الرسالة */
  @Column({ type: 'text' })
  message!: string;

  /** رابط صورة مرفقة (اختياري) */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'image_url' })
  imageUrl?: string;

  /** من أرسل الرسالة: rider | driver */
  @Column({ length: 10, name: 'sender_type' })
  senderType!: 'rider' | 'driver';

  /** معرّف المرسل */
  @Column({ name: 'sender_id' })
  senderId!: number;

  /** هل قرأها الطرف الآخر */
  @Column({ default: false, name: 'is_read' })
  isRead!: boolean;

  /** الطلب المرتبط */
  @ManyToOne(() => OrderEntity, (order) => order.messages)
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ name: 'order_id' })
  orderId!: number;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt!: Date;
}
