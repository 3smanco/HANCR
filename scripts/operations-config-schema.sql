-- HANCR — Phase N1: Operational values move from hardcoded → hancr_app_config
-- Adds two JSONB columns and seeds them with the EXACT current hardcoded
-- values so deploying this is zero-behavior-change. Admin can then tune
-- everything live without a code deploy.
-- Applied to production manually (synchronize=false)

ALTER TABLE hancr_app_config
  ADD COLUMN IF NOT EXISTS operations_config   JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pricing_rules_config JSONB NOT NULL DEFAULT '{}';

-- Seed the 'main' row with current defaults (matches the constants being
-- removed from auth/matching/loyalty/order services). Only fills if empty.
UPDATE hancr_app_config
SET operations_config = jsonb_build_object(
      'otpTtlSeconds', 300,
      'maxOtpAttempts', 5,
      'otpResendCooldownSeconds', 60,
      'searchRadiusKm', 5,
      'etaMinutesPerKm', 1.5,
      'matchingTimeoutSeconds', 60
    )
WHERE config_key = 'main'
  AND (operations_config IS NULL OR operations_config = '{}'::jsonb);

UPDATE hancr_app_config
SET pricing_rules_config = jsonb_build_object(
      'cancellationFee', 0,
      'cancellationGraceSeconds', 120,
      'cancellableStatuses', jsonb_build_array(
        'Requested','NotFound','Found','DriverAccepted','Booked'
      ),
      'surge', jsonb_build_array()
    )
WHERE config_key = 'main'
  AND (pricing_rules_config IS NULL OR pricing_rules_config = '{}'::jsonb);

-- Seed loyalty_config with the current loyalty.service constants if empty.
UPDATE hancr_app_config
SET loyalty_config = jsonb_build_object(
      'tierThresholds', jsonb_build_object(
        'Bronze', 0, 'Silver', 500, 'Gold', 2000, 'Platinum', 5000
      ),
      'milesPerCurrency', 1,
      'milesToCurrency', 0.05,
      'minRedeem', 100,
      'redeemStep', 50,
      'referralBonus', 15
    )
WHERE config_key = 'main'
  AND (loyalty_config IS NULL OR loyalty_config = '{}'::jsonb);

-- Ensure a 'main' row exists at all (fresh installs).
INSERT INTO hancr_app_config (config_key, operations_config, pricing_rules_config, loyalty_config)
SELECT 'main',
  jsonb_build_object(
    'otpTtlSeconds', 300, 'maxOtpAttempts', 5, 'otpResendCooldownSeconds', 60,
    'searchRadiusKm', 5, 'etaMinutesPerKm', 1.5, 'matchingTimeoutSeconds', 60
  ),
  jsonb_build_object(
    'cancellationFee', 0, 'cancellationGraceSeconds', 120,
    'cancellableStatuses', jsonb_build_array('Requested','NotFound','Found','DriverAccepted','Booked'),
    'surge', jsonb_build_array()
  ),
  jsonb_build_object(
    'tierThresholds', jsonb_build_object('Bronze',0,'Silver',500,'Gold',2000,'Platinum',5000),
    'milesPerCurrency', 1, 'milesToCurrency', 0.05, 'minRedeem', 100, 'redeemStep', 50, 'referralBonus', 15
  )
WHERE NOT EXISTS (SELECT 1 FROM hancr_app_config WHERE config_key = 'main');
