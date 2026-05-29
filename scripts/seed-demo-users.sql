-- =============================================
-- HANCR — Demo Users Seed Script
-- شغّل: docker exec -i hancr_postgres psql -U hancr -d hancr < scripts/seed-demo-users.sql
-- =============================================

-- ─── Demo Riders ───
INSERT INTO hancr_rider (
    phone_number, country_code, first_name, last_name,
    email, balance, currency, total_rides, rating, language, active, banned, created_at
) VALUES
(
    '+966500000001', '+966', 'أحمد', 'الراكب',
    'demo.rider@hancr.com', 150.00, 'SAR', 5, 4.8, 'ar', true, false, NOW()
),
(
    '+966500000002', '+966', 'سارة', 'العتيبي',
    'sara.rider@hancr.com', 75.50, 'SAR', 2, 5.0, 'ar', true, false, NOW()
)
ON CONFLICT (phone_number) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    balance = EXCLUDED.balance,
    total_rides = EXCLUDED.total_rides,
    rating = EXCLUDED.rating,
    active = true,
    banned = false;

-- ─── Demo Drivers ───
INSERT INTO hancr_driver (
    phone_number, country_code, first_name, last_name,
    car_brand, car_model, car_color, car_year, plate_number,
    balance, currency, rating, rating_count, status,
    active, banned, language, region_id, created_at
) VALUES
(
    '+966500000010', '+966', 'محمد', 'السائق',
    'تويوتا', 'كامري', 'أبيض', 2023, 'أب ج 4521',
    540.00, 'SAR', 4.9, 127, 'Offline',
    true, false, 'ar', 1, NOW()
),
(
    '+966500000011', '+966', 'خالد', 'المطيري',
    'هيونداي', 'سوناتا', 'أسود', 2024, 'هـ د و 8932',
    320.00, 'SAR', 4.7, 84, 'Offline',
    true, false, 'ar', 1, NOW()
)
ON CONFLICT (phone_number) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    car_brand = EXCLUDED.car_brand,
    car_model = EXCLUDED.car_model,
    car_color = EXCLUDED.car_color,
    plate_number = EXCLUDED.plate_number,
    balance = EXCLUDED.balance,
    rating = EXCLUDED.rating,
    rating_count = EXCLUDED.rating_count,
    active = true,
    banned = false;

-- ─── Loyalty records للراكبين ───
INSERT INTO hancr_loyalty (
    rider_id, current_miles, lifetime_miles, tier,
    free_cancellations_remaining, last_calculated_at
)
SELECT id, 350, 850, 'Silver', 2, NOW()
FROM hancr_rider WHERE phone_number IN ('+966500000001', '+966500000002')
ON CONFLICT (rider_id) DO UPDATE SET
    current_miles = EXCLUDED.current_miles,
    lifetime_miles = EXCLUDED.lifetime_miles,
    tier = EXCLUDED.tier;

-- ─── Verification ───
SELECT '===== Demo Riders =====' as info;
SELECT id, phone_number, first_name, last_name, email, balance, currency, rating
FROM hancr_rider
WHERE phone_number IN ('+966500000001', '+966500000002')
ORDER BY phone_number;

SELECT '===== Demo Drivers =====' as info;
SELECT id, phone_number, first_name, last_name, car_brand, car_model, plate_number, balance, rating
FROM hancr_driver
WHERE phone_number IN ('+966500000010', '+966500000011')
ORDER BY phone_number;

SELECT '===== Demo Credentials =====' as info;
SELECT
    'OTP لكل الأرقام التجريبية: 1234' as credentials,
    '+966500000001 / +966500000002' as rider_phones,
    '+966500000010 / +966500000011' as driver_phones;
