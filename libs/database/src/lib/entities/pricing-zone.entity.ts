import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * I11 — Zone Prices (lightweight, region-based).
 *
 * Lookup priority in fare calc:
 *   1. Active zone matching (regionId, serviceId, fleetId=driver.fleetId) within window
 *   2. Active zone matching (regionId, serviceId, fleetId=null) within window
 *   3. Fall back to ServiceEntity.baseFare/perHundredMeters/perMinute (default)
 *
 * If `multiplier` is not 1.0 it's applied AFTER the per-km/per-minute calc.
 */
@Entity('hancr_pricing_zone')
@Index(['regionId', 'serviceId', 'active'])
export class PricingZoneEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ name: 'region_id' })
  regionId!: number;

  @Column({ name: 'service_id' })
  serviceId!: number;

  @Column({ nullable: true, name: 'fleet_id' })
  fleetId?: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0, name: 'base_fare' })
  baseFare!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0, name: 'per_km' })
  perKm!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0, name: 'per_minute' })
  perMinute!: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 1.0 })
  multiplier!: number;

  @Column({ type: 'timestamp', nullable: true, name: 'starts_at' })
  startsAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'ends_at' })
  endsAt?: Date;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
