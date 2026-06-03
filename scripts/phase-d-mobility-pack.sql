-- HANCR — Phase D: Mobility Pack (School + Medical + VIP + Airport)
-- Applied to production manually (synchronize=false)

-- 1) Extend Commuter Subscription with subscription_type + new fields
ALTER TABLE hancr_commuter_subscription
  ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(20) NOT NULL DEFAULT 'commuter',
  ADD COLUMN IF NOT EXISTS child_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS medical_notes TEXT,
  ADD COLUMN IF NOT EXISTS wheelchair_needed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20) NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS preferred_driver_id INT,
  ADD COLUMN IF NOT EXISTS night_shift BOOLEAN NOT NULL DEFAULT false;

-- 2) Driver: kids-approved flag (set true by admin after background check)
ALTER TABLE hancr_driver
  ADD COLUMN IF NOT EXISTS kids_approved BOOLEAN NOT NULL DEFAULT false;

-- 3) Order: preferred-driver pointer for VIP and subscription-derived orders
ALTER TABLE hancr_order
  ADD COLUMN IF NOT EXISTS preferred_driver_id INT;

-- 4) Airport flight tracking (D4)
CREATE TABLE IF NOT EXISTS hancr_flight_tracking (
  id SERIAL PRIMARY KEY,
  rider_id INT NOT NULL,
  flight_number VARCHAR(20) NOT NULL,
  flight_date DATE NOT NULL,
  pickup_address VARCHAR(255) NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  scheduled_arrival TIMESTAMP NULL,
  service_id INT NOT NULL,
  region_id INT NOT NULL,
  pickup_triggered BOOLEAN NOT NULL DEFAULT false,
  order_id INT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'tracking',
  last_polled_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_flight_track_rider  ON hancr_flight_tracking(rider_id);
CREATE INDEX IF NOT EXISTS idx_flight_track_status ON hancr_flight_tracking(status);

-- 5) Seed VIP service per region
DELETE FROM hancr_service WHERE name_en = 'VIP';
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM hancr_region LOOP
    INSERT INTO hancr_service (name,name_en,service_type,base_fare,per_hundred_meters,per_minute_drive,per_minute_wait,minimum_fee,provider_share_percent,prepay_percent,cancellation_total_fee,cancellation_driver_share,time_multipliers,weekday_multipliers,date_range_multipliers,search_radius,bid_mode_enabled,enabled,display_order,is_vip,region_id)
    VALUES
    ('في آي بي','VIP','RideSharing',20.0,1.2,0.8,0.3,30.0,15.0,0.0,15.0,7.0,'[]','[]','[]',5000,false,true,6,true,r.id);
  END LOOP;
END $$;
