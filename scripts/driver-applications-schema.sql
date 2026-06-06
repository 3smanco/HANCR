-- HANCR — Phase M2: Driver application funnel (marketing site → admin review)
-- A `hancr_driver_application` row captures a multi-step signup before any
-- DriverEntity exists. Admin approves → provisions a real driver account.
-- Applied to production manually (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_driver_application (
  id SERIAL PRIMARY KEY,

  -- Identity & contact (step 1)
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  city VARCHAR(80),
  national_id_number VARCHAR(40),
  date_of_birth DATE,

  -- Vehicle (step 2)
  vehicle_brand VARCHAR(60),
  vehicle_model VARCHAR(60),
  vehicle_year SMALLINT,
  vehicle_color VARCHAR(40),
  plate_number VARCHAR(30),

  -- Documents (step 3) — URLs returned from the public signed-URL flow
  doc_national_id_url TEXT,
  doc_license_url TEXT,
  doc_vehicle_registration_url TEXT,
  doc_insurance_url TEXT,
  doc_profile_photo_url TEXT,

  -- Workflow
  status VARCHAR(24) NOT NULL DEFAULT 'submitted',
    -- submitted | in_review | approved | rejected | needs_more_info
  rejection_reason TEXT,
  reviewed_by INT,
  reviewed_at TIMESTAMP,

  -- Audit
  source_ip VARCHAR(60),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_app_status_created
  ON hancr_driver_application (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_app_phone
  ON hancr_driver_application (phone);
CREATE INDEX IF NOT EXISTS idx_driver_app_email
  ON hancr_driver_application (email);
