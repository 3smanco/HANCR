-- HANCR — Phase K3: Provider config (SMS + Payment Gateways)
-- Extends hancr_app_config with two JSON columns.
-- Applied to production manually (synchronize=false)

ALTER TABLE hancr_app_config
  ADD COLUMN IF NOT EXISTS sms_config JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gateway_config JSONB NOT NULL DEFAULT '{}';
