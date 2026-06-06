import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * I11/L3 — Zone Prices.
 *
 * Two lookup styles (both supported, polygon wins when both match):
 *   • Region-based  (polygon = NULL) — matches by regionId + serviceId.
 *   • PostGIS polygon — matches when pickup point lies inside `polygon`.
 *
 * Lookup priority in fare calc (rider-api/order.service.ts):
 *   1. Active polygon zone containing the pickup point, fleet-specific.
 *   2. Active polygon zone containing the pickup point, general (no fleet).
 *   3. Active region zone (regionId, serviceId, fleetId=driver.fleetId) in window.
 *   4. Active region zone (regionId, serviceId, fleetId=null) in window.
 *   5. Fall back to ServiceEntity.baseFare/perHundredMeters/perMinute.
 *
 * If `multiplier` is not 1.0 it's applied AFTER per-km/per-minute calc.
 *
 * `polygon` is read/written as WKT (e.g. "POLYGON((lng lat, lng lat, ...))")
 * by TypeORM via the transformer below.
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

  /**
   * L3 — Optional PostGIS polygon for point-in-polygon fare matching.
   * Stored as `GEOGRAPHY(POLYGON, 4326)` server-side; we read/write WKT so
   * the rest of the stack stays string-based. NULL = use regionId matching.
   */
  @Column({
    type: 'geography',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
    transformer: {
      to: (value?: string | null) => value ?? null,
      from: (value: unknown) =>
        typeof value === 'string' ? value : value ? String(value) : null,
    },
  })
  polygon?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
