import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * تتبّع رحلة طيران لاستقبال راكب من المطار.
 * كرون يستعلم AviationStack كل 10 دقائق ويُنشئ طلب pickup قبل الوصول الفعلي بـ 30 دقيقة.
 *
 * status: 'tracking' | 'scheduled' | 'completed' | 'cancelled'
 */
@Entity('hancr_flight_tracking')
@Index(['riderId'])
@Index(['status'])
export class FlightTrackingEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'rider_id' })
  riderId!: number;

  @Column({ length: 20, name: 'flight_number' })
  flightNumber!: string;

  @Column({ type: 'date', name: 'flight_date' })
  flightDate!: string;

  @Column({ length: 255, name: 'pickup_address' })
  pickupAddress!: string;

  @Column({ type: 'double precision', name: 'pickup_lat' })
  pickupLat!: number;

  @Column({ type: 'double precision', name: 'pickup_lng' })
  pickupLng!: number;

  /** ETA المُحدَّث من AviationStack */
  @Column({ type: 'timestamp', nullable: true, name: 'scheduled_arrival' })
  scheduledArrival?: Date;

  @Column({ name: 'service_id' })
  serviceId!: number;

  @Column({ name: 'region_id' })
  regionId!: number;

  @Column({ default: false, name: 'pickup_triggered' })
  pickupTriggered!: boolean;

  @Column({ type: 'int', nullable: true, name: 'order_id' })
  orderId?: number;

  @Column({ length: 20, default: 'tracking' })
  status!: string;

  @Column({ type: 'timestamp', nullable: true, name: 'last_polled_at' })
  lastPolledAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
