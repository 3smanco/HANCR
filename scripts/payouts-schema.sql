-- HANCR — Phase I4: Driver Payouts
-- Applied to production manually (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_payout_method (
  id SERIAL PRIMARY KEY,
  driver_id INT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'bank',
    -- 'bank' | 'mada' | 'stcpay'
  account_name VARCHAR(100),
  iban VARCHAR(40),
  bank_name VARCHAR(80),
  phone_number VARCHAR(30), -- for stcpay
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payout_method_driver ON hancr_payout_method(driver_id);

CREATE TABLE IF NOT EXISTS hancr_payout_session (
  id SERIAL PRIMARY KEY,
  initiated_by INT, -- admin user id
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
  driver_count INT NOT NULL DEFAULT 0,
  mode VARCHAR(20) NOT NULL DEFAULT 'manual',
    -- 'manual' | 'auto'
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- 'draft' | 'processing' | 'completed' | 'partial_failure'
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payout_session_status ON hancr_payout_session(status);

CREATE TABLE IF NOT EXISTS hancr_payout_entry (
  id SERIAL PRIMARY KEY,
  session_id INT NOT NULL,
  driver_id INT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payout_method_id INT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- 'pending' | 'processing' | 'completed' | 'failed'
  gateway_ref VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payout_entry_session ON hancr_payout_entry(session_id);
CREATE INDEX IF NOT EXISTS idx_payout_entry_driver  ON hancr_payout_entry(driver_id);
CREATE INDEX IF NOT EXISTS idx_payout_entry_status  ON hancr_payout_entry(status);
