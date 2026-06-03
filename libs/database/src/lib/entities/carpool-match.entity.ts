import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * مجموعة Carpool المُطابَقة — تربط بين 2-4 طلبات Carpool.
 *
 * status:
 *  - 'forming':    جمعنا 2+ ركاب، نمنح نافذة دقائق قليلة لانضمام آخرين
 *  - 'confirmed':  تم إنشاء الأوردر المشترك
 *  - 'completed':  انتهت الرحلة
 *  - 'cancelled':  أُلغيت
 */
@Entity('hancr_carpool_match')
@Index(['status'])
export class CarpoolMatchEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** قائمة معرّفات الركاب */
  @Column({ type: 'int', array: true, name: 'rider_ids' })
  riderIds!: number[];

  /** قائمة معرّفات طلبات Carpool */
  @Column({ type: 'int', array: true, name: 'request_ids' })
  requestIds!: number[];

  /** الموعد المتوسّط للمجموعة */
  @Column({ type: 'timestamp', name: 'scheduled_at' })
  scheduledAt!: Date;

  /** نسبة الخصم المطبقة */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'discount_percent' })
  discountPercent!: number;

  /** forming | confirmed | completed | cancelled */
  @Column({ length: 20, default: 'forming' })
  status!: string;

  /** معرّف الـ order المشترك (يُنشَأ عند confirm) */
  @Column({ type: 'int', nullable: true, name: 'order_id' })
  orderId?: number;

  @Column({ name: 'service_id' })
  serviceId!: number;

  @Column({ name: 'region_id' })
  regionId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
