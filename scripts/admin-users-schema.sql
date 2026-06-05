-- HANCR — Phase I5: Operators & Roles (RBAC)
-- Applied to production manually (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_admin_user (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(40) NOT NULL DEFAULT 'support',
    -- 'super' | 'ops' | 'finance' | 'marketing' | 'support'
  active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_email  ON hancr_admin_user(email);
CREATE INDEX IF NOT EXISTS idx_admin_active ON hancr_admin_user(active);
