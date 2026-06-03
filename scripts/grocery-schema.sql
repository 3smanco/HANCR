-- HANCR — Phase E2: Grocery Run
-- Adds shopping_list (JSONB) + budget (numeric) to hancr_order
-- Applied to production manually (synchronize=false)

ALTER TABLE hancr_order ADD COLUMN IF NOT EXISTS shopping_list JSONB;
ALTER TABLE hancr_order ADD COLUMN IF NOT EXISTS budget NUMERIC(10,2);
