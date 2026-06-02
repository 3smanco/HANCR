-- HANCR — Referral schema (Phase 3.2)
-- يُطبَّق يدوياً على الإنتاج (synchronize=false)

ALTER TABLE hancr_rider ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12);
ALTER TABLE hancr_rider ADD COLUMN IF NOT EXISTS referred_by INT;
ALTER TABLE hancr_rider ADD COLUMN IF NOT EXISTS referral_rewarded BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rider_referral_code ON hancr_rider(referral_code);

-- توليد كود إحالة لكل راكب حالي لا يملك واحداً
UPDATE hancr_rider
SET referral_code = upper(substr(md5(random()::text || id::text), 1, 6))
WHERE referral_code IS NULL;
