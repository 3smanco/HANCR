-- HANCR — Phase F2: Corporate Accounts (B2B)
-- Applied to production manually (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_company (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(30),
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
  monthly_cap_per_employee NUMERIC(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_status ON hancr_company(status);

CREATE TABLE IF NOT EXISTS hancr_company_employee (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL,
  rider_id INT NOT NULL,
  monthly_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  monthly_period VARCHAR(7) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (company_id, rider_id)
);
CREATE INDEX IF NOT EXISTS idx_employee_rider   ON hancr_company_employee(rider_id);
CREATE INDEX IF NOT EXISTS idx_employee_company ON hancr_company_employee(company_id);

-- ربط الطلب بالشركة الدافعة
ALTER TABLE hancr_order ADD COLUMN IF NOT EXISTS company_id INT;
