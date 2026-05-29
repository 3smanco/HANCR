import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BidStatus } from '../enums/bid-status.enum';
import { GeoPoint } from '../interfaces/point.interface';
import { GeoPointsTransformer } from '../transformers/geo-points.transformer';
import { RiderEntity } from './rider.entity';
import { ServiceEntity } from './service.entity';
import { RegionEntity } from './region.entity';
import { BidOfferEntity } from './bid-offer.entity';

/**
 * Bid Mode — نظام المزايدة العكسية الحصري
 * الراكب يحدد السعر → السائقون يقبلون أو يعرضون بديلاً
 * نافذة 30 ثانية فقط
 */
@Entity('hancr_bid')
export class BidEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** حالة المزايدة */
  @Column({ type: 'enum', enum: BidStatus, default: BidStatus.Open })
  status!: BidStatus;

  /** وقت انتهاء صلاحية المزايدة (30 ثانية من الإنشاء) */
  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  /** السعر الذي يقترحه الراكب */
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'rider_proposed_price' })
  riderProposedPrice!: number;

  /** عملة المزايدة */
  @Column({ length: 3 })
  currency!: string;

  /** نقاط المسار [انطلاق, وجهة] */
  @Column({
    type: 'text',
    transformer: new GeoPointsTransformer(),
  })
  points!: GeoPoint[];

  /** العناوين النصية */
  @Column({ type: 'jsonb', default: '[]' })
  addresses!: string[];

  /** المسافة التقديرية بالأمتار */
  @Column({ default: 0, name: 'estimated_distance' })
  estimatedDistance!: number;

  /** المدة التقديرية بالثواني */
  @Column({ default: 0, name: 'estimated_duration' })
  estimatedDuration!: number;

  /** معرّف العرض المقبول */
  @Column({ nullable: true, name: 'accepted_offer_id' })
  acceptedOfferId?: number;

  /** الراكب الذي أنشأ المزايدة */
  @ManyToOne(() => RiderEntity)
  @JoinColumn({ name: 'rider_id' })
  rider!: RiderEntity;

  @Column({ name: 'rider_id' })
  riderId!: number;

  /** الخدمة المطلوبة */
  @ManyToOne(() => ServiceEntity)
  @JoinColumn({ name: 'service_id' })
  service!: ServiceEntity;

  @Column({ name: 'service_id' })
  serviceId!: number;

  /** المنطقة */
  @ManyToOne(() => RegionEntity)
  @JoinColumn({ name: 'region_id' })
  region!: RegionEntity;

  @Column({ name: 'region_id' })
  regionId!: number;

  /** عروض السائقين */
  @OneToMany(() => BidOfferEntity, (offer) => offer.bid)
  offers!: BidOfferEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
