import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * طلب Carpool — راكب يبحث عن شريك بنفس المسار في وقت قريب.
 *
 * status:
 *  - 'pending':  ينتظر مطابقة
 *  - 'matched':  وُجد شركاء (matchId مُسجَّل)
 *  - 'booked':   تم إنشاء الـ order (orderId مُسجَّل)
 *  - 'expired':  مرّ موعده ولم يطابَق
 *  - 'cancelled':ألغاه المستخدم
 *
 * trustMode:
 *  - 'open':         بلا قيود
 *  - 'women_only':   نساء فقط
 *  - 'family':       عائلات / مع تفضيل سائقة
 */
@Entity('hancr_carpool_request')
@Index(['status'])
@Index(['riderId'])
@Index(['scheduledAt'])
export class CarpoolRequestEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'rider_id' })
  riderId!: number;

  @Column({ length: 255, name: 'origin_address' })
  originAddress!: string;
  @Column({ type: 'double precision', name: 'origin_lat' })
  originLat!: number;
  @Column({ type: 'double precision', name: 'origin_lng' })
  originLng!: number;

  @Column({ length: 255, name: 'destination_address' })
  destinationAddress!: string;
  @Column({ type: 'double precision', name: 'destination_lat' })
  destinationLat!: number;
  @Column({ type: 'double precision', name: 'destination_lng' })
  destinationLng!: number;

  /** الوقت المرغوب (±15 دقيقة افتراضي للمطابقة) */
  @Column({ type: 'timestamp', name: 'scheduled_at' })
  scheduledAt!: Date;

  /** حدّ أعلى للركاب في الكاربول (2 أو 3 أو 4) */
  @Column({ type: 'int', default: 3, name: 'max_riders' })
  maxRiders!: number;

  /** open | women_only | family */
  @Column({ length: 20, default: 'open', name: 'trust_mode' })
  trustMode!: string;

  /** pending | matched | booked | expired | cancelled */
  @Column({ length: 20, default: 'pending' })
  status!: string;

  /** نسبة الخصم المُطبَّقة عند المطابقة (مثلاً 0.30) */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'discount_percent' })
  discountPercent!: number;

  /** معرّف مجموعة المطابقة لو طُوبق */
  @Column({ type: 'int', nullable: true, name: 'match_id' })
  matchId?: number;

  /** معرّف الـ order النهائي */
  @Column({ type: 'int', nullable: true, name: 'order_id' })
  orderId?: number;

  @Column({ name: 'service_id' })
  serviceId!: number;

  @Column({ name: 'region_id' })
  regionId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
