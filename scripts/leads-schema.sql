-- HANCR — Phase J2: Marketing website leads inbox
-- Public submitLead mutation writes here; admin-panel /leads page reads.
-- Applied to production manually (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_lead (
  id SERIAL PRIMARY KEY,
  type VARCHAR(30) NOT NULL, -- 'driver_signup' | 'business' | 'contact' | 'careers'
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(30),
  company VARCHAR(80),
  city VARCHAR(80),
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'new', -- new | contacted | qualified | rejected
  metadata JSONB,
  source_ip VARCHAR(60),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_type_status_created
  ON hancr_lead(type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_status_created
  ON hancr_lead(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_email
  ON hancr_lead(email);
