-- HANCR — Phase I9: Complaints inbox
-- Applied to production manually (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_complaint (
  id SERIAL PRIMARY KEY,
  order_id INT,
  reported_by_type VARCHAR(10) NOT NULL,
    -- 'rider' | 'driver'
  reported_by_id INT NOT NULL,
  category VARCHAR(40) NOT NULL,
    -- 'safety' | 'fare' | 'route' | 'cleanliness' | 'behavior' | 'other'
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted',
    -- 'submitted' | 'under_review' | 'resolved' | 'dismissed'
  resolution_note TEXT,
  assigned_to INT, -- admin user (later in I5)
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_complaint_status     ON hancr_complaint(status);
CREATE INDEX IF NOT EXISTS idx_complaint_order      ON hancr_complaint(order_id);
CREATE INDEX IF NOT EXISTS idx_complaint_reporter   ON hancr_complaint(reported_by_type, reported_by_id);

CREATE TABLE IF NOT EXISTS hancr_complaint_activity (
  id SERIAL PRIMARY KEY,
  complaint_id INT NOT NULL,
  actor_type VARCHAR(20) NOT NULL,
    -- 'admin' | 'rider' | 'driver' | 'system'
  actor_id INT,
  type VARCHAR(30) NOT NULL,
    -- 'created' | 'assigned' | 'status_change' | 'note' | 'resolved' | 'dismissed'
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_complaint_activity_complaint
  ON hancr_complaint_activity(complaint_id);
