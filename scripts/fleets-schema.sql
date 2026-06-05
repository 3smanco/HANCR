-- HANCR — Phase I10: Fleets (sub-operator taxi companies)
-- Applied to production manually (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_fleet (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  owner_name VARCHAR(100),
  contact_phone VARCHAR(30),
  contact_email VARCHAR(255),
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  exclusivity_region_ids INT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fleet_active ON hancr_fleet(active);

ALTER TABLE hancr_driver ADD COLUMN IF NOT EXISTS fleet_id INT;
CREATE INDEX IF NOT EXISTS idx_driver_fleet ON hancr_driver(fleet_id);
