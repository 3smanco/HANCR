-- HANCR — Phase F1: Ride Bundles
-- Applied to production manually (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_ride_bundle (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rides_count INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
  validity_days INT NOT NULL DEFAULT 30,
  max_distance_km NUMERIC(6,2) NOT NULL DEFAULT 0,
  region_id INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bundle_active  ON hancr_ride_bundle(active);
CREATE INDEX IF NOT EXISTS idx_bundle_region  ON hancr_ride_bundle(region_id);

CREATE TABLE IF NOT EXISTS hancr_rider_entitlement (
  id SERIAL PRIMARY KEY,
  rider_id INT NOT NULL,
  bundle_id INT NOT NULL,
  bundle_name VARCHAR(100) NOT NULL,
  rides_total INT NOT NULL,
  rides_remaining INT NOT NULL,
  max_distance_km NUMERIC(6,2) NOT NULL DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_entitlement_rider  ON hancr_rider_entitlement(rider_id);
CREATE INDEX IF NOT EXISTS idx_entitlement_status ON hancr_rider_entitlement(status);

-- ربط الطلب بالحزمة المستخدمة (للاسترداد عند الإلغاء)
ALTER TABLE hancr_order ADD COLUMN IF NOT EXISTS entitlement_id INT;
