-- =========================================================
-- HANCR Seed Data v2 — يطابق الـ schema الفعلي
-- =========================================================

BEGIN;

-- ============= REGIONS =============
INSERT INTO hancr_region (id, name, name_en, currency, enabled, bid_mode_enabled, default_search_radius)
VALUES
  (1, 'الرياض',  'Riyadh',  'SAR', true, false, 5000),
  (2, 'جدة',      'Jeddah',  'SAR', true, false, 5000),
  (3, 'الدوحة',   'Doha',    'QAR', true, true,  6000),
  (4, 'دبي',      'Dubai',   'AED', true, false, 4000),
  (5, 'الكويت',   'Kuwait',  'KWD', false, false, 5000)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, enabled = EXCLUDED.enabled, updated_at = NOW();
SELECT setval('hancr_region_id_seq', (SELECT MAX(id) FROM hancr_region));

-- ============= SERVICES =============
INSERT INTO hancr_service (
  id, name, name_en, service_type, region_id,
  base_fare, per_hundred_meters, per_minute_drive, per_minute_wait,
  minimum_fee, provider_share_percent, prepay_percent,
  cancellation_total_fee, cancellation_driver_share,
  search_radius, enabled, display_order, is_vip
)
VALUES
  (1, 'HANCR Eco',      'HANCR Eco',      'RideSharing',     1, 5,  0.10, 0.15, 0.05, 12, 20, 0, 5,  50, 5000, true, 1, false),
  (2, 'HANCR Standard', 'HANCR Standard', 'RideSharing',     1, 8,  0.12, 0.20, 0.08, 18, 22, 0, 8,  50, 5000, true, 2, false),
  (3, 'HANCR Plus',     'HANCR Plus',     'RideSharing',     1, 12, 0.18, 0.30, 0.12, 25, 25, 0, 10, 50, 5000, true, 3, true),
  (4, 'HANCR XL',       'HANCR XL',       'RideSharing',     1, 15, 0.22, 0.35, 0.15, 35, 25, 0, 15, 50, 5000, true, 4, true),
  (5, 'HANCR Delivery', 'HANCR Delivery', 'PackageDelivery', 1, 7,  0.10, 0.15, 0.05, 15, 20, 0, 5,  50, 4000, true, 5, false),
  (6, 'HANCR Hours',    'HANCR Hours',    'HourlyChauffeur', 1, 50, 0,    0,    0,    50, 25, 30, 15, 50, 8000, true, 6, true)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, enabled = EXCLUDED.enabled, updated_at = NOW();
SELECT setval('hancr_service_id_seq', (SELECT MAX(id) FROM hancr_service));

-- ============= APP CONFIG (SDUI) =============
INSERT INTO hancr_app_config (id, config_key, theme_config, home_screen_config, feature_flags, loyalty_config)
VALUES
  (1, 'global',
   '{"primaryColor":"#B048FF","secondaryColor":"#22223B","fontFamily":"Cairo","isDarkMode":false}'::jsonb,
   '{"showBanner":true,"bannerText":"خصم 20% على رحلتك الأولى","serviceLayout":"grid"}'::jsonb,
   '{"bidMode":false,"pooling":false,"loyaltyEnabled":true,"sosButton":true,"shareTrip":true,"advanceBooking":true}'::jsonb,
   '{"bronzeThreshold":0,"silverThreshold":500,"goldThreshold":2000,"platinumThreshold":5000,"milesPerCurrency":1.0}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
  SET theme_config = EXCLUDED.theme_config, updated_at = NOW();

-- ============= DRIVERS (5: 3 active + 1 pending + 1 banned) =============
INSERT INTO hancr_driver (
  id, phone_number, country_code, first_name, last_name,
  car_brand, car_model, car_year, plate_number, car_color,
  status, active, banned, balance, rating, currency, region_id, service_ids
) VALUES
  (10, '+966500111001', '+966', 'أحمد',  'المطيري',  'Toyota',  'Camry',    2023, 'ABC 1001', 'أبيض', 'Online',  true,  false, 250, 4.8, 'SAR', 1, '[1,2,3]'::jsonb),
  (11, '+966500111002', '+966', 'سعد',   'القحطاني', 'Honda',   'Accord',   2022, 'XYZ 2002', 'فضي',  'Offline', true,  false, 120, 4.5, 'SAR', 1, '[1,2]'::jsonb),
  (12, '+966500111003', '+966', 'فيصل',  'العتيبي',  'Lexus',   'ES',       2024, 'LUX 3003', 'أسود', 'Busy',    true,  false, 480, 4.9, 'SAR', 1, '[2,3,4]'::jsonb),
  (13, '+966500111004', '+966', 'خالد',  'الشهري',   'Kia',     'Sportage', 2023, 'KIA 4004', 'أزرق', 'Offline', false, false, 0,   5.0, 'SAR', 1, '[1]'::jsonb),
  (14, '+966500111005', '+966', 'سلمان', 'الزهراني', 'Hyundai', 'Sonata',   2021, 'HYU 5005', 'رمادي','Offline', true,  true,  80,  3.2, 'SAR', 1, '[1]'::jsonb)
ON CONFLICT (id) DO UPDATE
  SET first_name = EXCLUDED.first_name, status = EXCLUDED.status, active = EXCLUDED.active, banned = EXCLUDED.banned, updated_at = NOW();
SELECT setval('hancr_driver_id_seq', (SELECT MAX(id) FROM hancr_driver));

-- ============= RIDERS (3 sample) =============
INSERT INTO hancr_rider (
  id, phone_number, country_code, first_name, last_name, email,
  active, banned, balance, currency, total_rides, rating
) VALUES
  (10, '+966505111001', '+966', 'محمد',    'الأنصاري', 'mohammed@example.com', true, false, 50,  'SAR', 24, 4.7),
  (11, '+966505111002', '+966', 'فاطمة',   'العمري',   'fatima@example.com',   true, false, 120, 'SAR', 67, 4.9),
  (12, '+966505111003', '+966', 'عبدالله', 'الحربي',   NULL,                   true, false, 0,   'SAR', 3,  5.0)
ON CONFLICT (id) DO UPDATE
  SET first_name = EXCLUDED.first_name, total_rides = EXCLUDED.total_rides, updated_at = NOW();
SELECT setval('hancr_rider_id_seq', (SELECT MAX(id) FROM hancr_rider));

-- ============= LOYALTY =============
INSERT INTO hancr_loyalty (id, rider_id, tier, total_miles, lifetime_miles, available_miles, free_upgrades_remaining, has_free_cancellation)
VALUES
  (1, 10, 'Silver',  850,  850,  450, 2, true),
  (2, 11, 'Gold',    2450, 2450, 1200, 5, true),
  (3, 12, 'Bronze',  50,   50,   50,  0, false)
ON CONFLICT (id) DO UPDATE
  SET tier = EXCLUDED.tier, updated_at = NOW();
SELECT setval('hancr_loyalty_id_seq', (SELECT MAX(id) FROM hancr_loyalty));

-- ============= ORDERS (10: 6 finished + 2 active + 2 canceled) =============
INSERT INTO hancr_order (
  id, rider_id, driver_id, service_id, region_id,
  type, status, cost_best, cost_after_coupon, paid_amount, provider_share,
  currency, distance_best, duration_best, payment_mode,
  addresses, created_on, finish_timestamp
) VALUES
  -- 6 finished
  (1, 10, 10, 1, 1, 'Ride', 'Finished', 18, 18, 18, 3.60, 'SAR', 3200,  720,  'Cash',
    '[{"address":"الياسمين"},{"address":"الملك فهد"}]'::jsonb,
    NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day' + INTERVAL '12 min'),
  (2, 11, 10, 2, 1, 'Ride', 'Finished', 65, 65, 65, 14.30, 'SAR', 28500, 2100, 'PaymentGateway',
    '[{"address":"العليا"},{"address":"مطار الملك خالد"}]'::jsonb,
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '35 min'),
  (3, 11, 12, 3, 1, 'Ride', 'Finished', 32, 32, 32, 8,     'SAR', 5800,  950,  'Wallet',
    '[{"address":"النخيل"},{"address":"الملقا"}]'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '16 min'),
  (4, 10, 12, 2, 1, 'Ride', 'Finished', 22, 22, 22, 4.40,  'SAR', 3900,  720,  'Cash',
    '[{"address":"الورود"},{"address":"الازدهار"}]'::jsonb,
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '12 min'),
  (5, 11, 10, 1, 1, 'Ride', 'Finished', 15, 15, 15, 3.30,  'SAR', 3000,  600,  'PaymentGateway',
    '[{"address":"المركز"},{"address":"السليمانية"}]'::jsonb,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '10 min'),
  (6, 12, 10, 1, 1, 'Ride', 'Finished', 20, 20, 20, 4,     'SAR', 5100,  900,  'Cash',
    '[{"address":"الروضة"},{"address":"الياسمين"}]'::jsonb,
    NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '15 min'),
  -- 2 active
  (7, 10, 12, 2, 1, 'Ride', 'Started',  28, 28, 0, 0, 'SAR', 6200, 1100, 'PaymentGateway',
    '[{"address":"المعذر"},{"address":"الياسمين"}]'::jsonb,
    NOW() - INTERVAL '10 min', NULL),
  (8, 11, NULL, 1, 1, 'Ride', 'Requested', 12, 12, 0, 0, 'SAR', 1200, 240, 'Cash',
    '[{"address":"التعاون"},{"address":"النخيل"}]'::jsonb,
    NOW() - INTERVAL '30 seconds', NULL),
  -- 2 canceled
  (9,  10, NULL, 1, 1, 'Ride', 'RiderCanceled',  20, 20, 0, 0, 'SAR', 5500,  900,  'Cash',
    '[{"address":"السفارات"},{"address":"الياسمين"}]'::jsonb,
    NOW() - INTERVAL '1 day',  NULL),
  (10, 11, 11,   2, 1, 'Ride', 'DriverCanceled', 55, 55, 0, 0, 'SAR', 24000, 1800, 'PaymentGateway',
    '[{"address":"النفل"},{"address":"مطار الملك خالد"}]'::jsonb,
    NOW() - INTERVAL '2 days', NULL)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();
SELECT setval('hancr_order_id_seq', (SELECT MAX(id) FROM hancr_order));

COMMIT;

-- ============= SUMMARY =============
SELECT 'Regions'             AS entity, COUNT(*)::text AS count FROM hancr_region
UNION ALL SELECT 'Services',            COUNT(*)::text FROM hancr_service
UNION ALL SELECT 'Drivers (total)',     COUNT(*)::text FROM hancr_driver
UNION ALL SELECT 'Drivers (active)',    COUNT(*)::text FROM hancr_driver WHERE active = true AND banned = false
UNION ALL SELECT 'Drivers (pending)',   COUNT(*)::text FROM hancr_driver WHERE active = false AND banned = false
UNION ALL SELECT 'Drivers (banned)',    COUNT(*)::text FROM hancr_driver WHERE banned = true
UNION ALL SELECT 'Riders',              COUNT(*)::text FROM hancr_rider
UNION ALL SELECT 'Orders (total)',      COUNT(*)::text FROM hancr_order
UNION ALL SELECT 'Orders (finished)',   COUNT(*)::text FROM hancr_order WHERE status = 'Finished'
UNION ALL SELECT 'Orders (canceled)',   COUNT(*)::text FROM hancr_order WHERE status::text LIKE '%Canceled'
UNION ALL SELECT 'Loyalty',             COUNT(*)::text FROM hancr_loyalty
UNION ALL SELECT 'AppConfig',           COUNT(*)::text FROM hancr_app_config
ORDER BY entity;
