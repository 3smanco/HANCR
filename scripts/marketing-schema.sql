-- HANCR — Phase I6: Marketing pack (Announcements + Gifts)
-- Applied to production manually (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_announcement (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  target VARCHAR(20) NOT NULL DEFAULT 'all',
    -- 'all' | 'rider' | 'driver'
  url TEXT,
  starts_at TIMESTAMP NOT NULL DEFAULT now(),
  ends_at TIMESTAMP,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_announcement_active ON hancr_announcement(active);
CREATE INDEX IF NOT EXISTS idx_announcement_window ON hancr_announcement(starts_at, ends_at);

CREATE TABLE IF NOT EXISTS hancr_gift_batch (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
  total_count INT NOT NULL,
  claimed_count INT NOT NULL DEFAULT 0,
  expires_at DATE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hancr_gift_code (
  id SERIAL PRIMARY KEY,
  batch_id INT NOT NULL,
  code VARCHAR(40) UNIQUE NOT NULL,
  claimed_by INT, -- rider_id
  claimed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gift_code_batch  ON hancr_gift_code(batch_id);
CREATE INDEX IF NOT EXISTS idx_gift_code_code   ON hancr_gift_code(code);
CREATE INDEX IF NOT EXISTS idx_gift_code_claim  ON hancr_gift_code(claimed_by);
