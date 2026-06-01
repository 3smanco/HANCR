-- HANCR — Coupons schema (Phase 2.1)
-- يُطبَّق يدوياً على الإنتاج (synchronize=false)

DO $$ BEGIN
  CREATE TYPE hancr_coupon_type_enum AS ENUM ('Percent','Fixed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS hancr_coupon (
  id SERIAL PRIMARY KEY,
  code VARCHAR(40) NOT NULL,
  type hancr_coupon_type_enum NOT NULL DEFAULT 'Percent',
  value NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_fare NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses INT NOT NULL DEFAULT 0,
  used_count INT NOT NULL DEFAULT 0,
  per_user_limit INT NOT NULL DEFAULT 1,
  region_ids INT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMP NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_code ON hancr_coupon(code);

ALTER TABLE hancr_order ADD COLUMN IF NOT EXISTS coupon_id INT NULL;
ALTER TABLE hancr_order ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(40) NULL;
ALTER TABLE hancr_order ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
