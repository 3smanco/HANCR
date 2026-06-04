-- HANCR — Phase I1: Driver documents + multi-status approval workflow
-- Applied to production manually (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_driver_document (
  id SERIAL PRIMARY KEY,
  driver_id INT NOT NULL,
  type VARCHAR(40) NOT NULL,
    -- 'national_id' | 'license' | 'vehicle_registration' | 'insurance' | 'criminal_record'
  url TEXT NOT NULL,
  expires_at DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- 'pending' | 'approved' | 'rejected'
  rejected_reason TEXT,
  uploaded_at TIMESTAMP NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP,
  reviewed_by INT
);
CREATE INDEX IF NOT EXISTS idx_doc_driver  ON hancr_driver_document(driver_id);
CREATE INDEX IF NOT EXISTS idx_doc_status  ON hancr_driver_document(status);

-- Multi-status approval workflow for drivers
ALTER TABLE hancr_driver
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) NOT NULL DEFAULT 'pending_docs';
  -- 'pending_docs' | 'docs_uploaded' | 'approved' | 'soft_reject' | 'hard_reject'

ALTER TABLE hancr_driver
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Backfill: existing active drivers are considered approved
UPDATE hancr_driver SET approval_status = 'approved' WHERE active = true AND approval_status = 'pending_docs';
