-- HANCR — Phase G1: Night Shift Mode
-- Applied to production manually (synchronize=false)

ALTER TABLE hancr_order
  ADD COLUMN IF NOT EXISTS night_shift BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE hancr_driver
  ADD COLUMN IF NOT EXISTS night_approved BOOLEAN NOT NULL DEFAULT false;
