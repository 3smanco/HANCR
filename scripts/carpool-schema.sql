-- HANCR — Phase E1: Carpool
-- Applied to production manually (synchronize=false)

-- Rider gender (for women_only carpool mode)
ALTER TABLE hancr_rider ADD COLUMN IF NOT EXISTS gender VARCHAR(1);

CREATE TABLE IF NOT EXISTS hancr_carpool_request (
  id SERIAL PRIMARY KEY,
  rider_id INT NOT NULL,
  origin_address VARCHAR(255) NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  destination_address VARCHAR(255) NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  max_riders INT NOT NULL DEFAULT 3,
  trust_mode VARCHAR(20) NOT NULL DEFAULT 'open',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  match_id INT NULL,
  order_id INT NULL,
  service_id INT NOT NULL,
  region_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_carpool_req_status     ON hancr_carpool_request(status);
CREATE INDEX IF NOT EXISTS idx_carpool_req_rider      ON hancr_carpool_request(rider_id);
CREATE INDEX IF NOT EXISTS idx_carpool_req_scheduled  ON hancr_carpool_request(scheduled_at);

CREATE TABLE IF NOT EXISTS hancr_carpool_match (
  id SERIAL PRIMARY KEY,
  rider_ids INT[] NOT NULL,
  request_ids INT[] NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'forming',
  order_id INT NULL,
  service_id INT NOT NULL,
  region_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_carpool_match_status ON hancr_carpool_match(status);
