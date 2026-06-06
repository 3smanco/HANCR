-- HANCR — Phase L3: PostGIS polygon support for pricing zones
-- Adds a nullable `polygon` GEOGRAPHY column + GiST index to hancr_pricing_zone.
-- Lightweight (region-based) zones still work — polygon zones take priority
-- when both match a given pickup point.

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE hancr_pricing_zone
  ADD COLUMN IF NOT EXISTS polygon GEOGRAPHY(POLYGON, 4326);

CREATE INDEX IF NOT EXISTS idx_pricing_zone_polygon
  ON hancr_pricing_zone USING GIST (polygon);
