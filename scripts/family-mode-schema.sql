-- HANCR — Family mode + driver gender (Phase B4)
-- يُطبَّق يدوياً على الإنتاج (synchronize=false)

ALTER TABLE hancr_order ADD COLUMN IF NOT EXISTS family_mode BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE hancr_order ADD COLUMN IF NOT EXISTS prefer_female_driver BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE hancr_driver ADD COLUMN IF NOT EXISTS gender VARCHAR(1);
