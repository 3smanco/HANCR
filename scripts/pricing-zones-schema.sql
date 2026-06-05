-- HANCR — Phase I11: Dynamic pricing zones
-- Lightweight version: zone = (region + service[+fleet]) override with multiplier.
-- PostGIS polygon version deferred for v2.
-- Applied to production manually (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_pricing_zone (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region_id INT NOT NULL,
  service_id INT NOT NULL,
  fleet_id INT, -- nullable: if null applies to all drivers in the region
  base_fare NUMERIC(8,2) NOT NULL DEFAULT 0,
  per_km NUMERIC(8,2) NOT NULL DEFAULT 0,
  per_minute NUMERIC(8,2) NOT NULL DEFAULT 0,
  multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pricing_zone_lookup
  ON hancr_pricing_zone(region_id, service_id, active);
