-- HANCR — Commuter Subscriptions (Phase C: Commuter)
-- يُطبَّق يدوياً على الإنتاج (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_commuter_subscription (
  id SERIAL PRIMARY KEY,
  rider_id INT NOT NULL,
  home_address VARCHAR(255) NOT NULL,
  home_lat DOUBLE PRECISION NOT NULL,
  home_lng DOUBLE PRECISION NOT NULL,
  work_address VARCHAR(255) NOT NULL,
  work_lat DOUBLE PRECISION NOT NULL,
  work_lng DOUBLE PRECISION NOT NULL,
  outbound_time VARCHAR(5) NULL,
  return_time   VARCHAR(5) NULL,
  days_of_week  INT[] NOT NULL DEFAULT '{0,1,2,3,4}',
  plan_type VARCHAR(10) NOT NULL DEFAULT 'daily',
  active BOOLEAN NOT NULL DEFAULT true,
  service_id INT NOT NULL,
  region_id  INT NOT NULL,
  lead_minutes INT NOT NULL DEFAULT 10,
  last_outbound_date DATE NULL,
  last_return_date   DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commuter_rider  ON hancr_commuter_subscription(rider_id);
CREATE INDEX IF NOT EXISTS idx_commuter_active ON hancr_commuter_subscription(active);
