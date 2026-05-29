import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BidEntity } from './bid.entity';
import { DriverEntity } from './driver.entity';

/**
 * عرض السائق في Bid Mode
 * السائق يقبل سعر الراكب أو يعرض سعراً مضاداً
 */
@Entity('hancr_bid_offer')
export class BidOfferEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** السعر الذي يعرضه السائق */
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'offered_price' })
  offeredPrice!: number;

  /** هل قبل الراكب هذا العرض */
  @Column({ default: false })
  accepted!: boolean;

  /** المزايدة التي ينتمي إليها هذا العرض */
  @ManyToOne(() => BidEntity, (bid) => bid.offers)
  @JoinColumn({ name: 'bid_id' })
  bid!: BidEntity;

  @Column({ name: 'bid_id' })
  bidId!: number;

  /** السائق الذي قدّم العرض */
  @ManyToOne(() => DriverEntity)
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity;

  @Column({ name: 'driver_id' })
  driverId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
