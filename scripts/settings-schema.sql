-- HANCR — Phase I7: Settings (cancel reasons + review parameters)
-- Applied to production manually (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_cancel_reason (
  id SERIAL PRIMARY KEY,
  code VARCHAR(40) UNIQUE NOT NULL,
  label_ar VARCHAR(200) NOT NULL,
  label_en VARCHAR(200) NOT NULL,
  applies_to VARCHAR(10) NOT NULL,
    -- 'rider' | 'driver' | 'both'
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cancel_reason_active ON hancr_cancel_reason(active);

CREATE TABLE IF NOT EXISTS hancr_review_parameter (
  id SERIAL PRIMARY KEY,
  code VARCHAR(40) UNIQUE NOT NULL,
  label_ar VARCHAR(100) NOT NULL,
  label_en VARCHAR(100) NOT NULL,
  target VARCHAR(10) NOT NULL,
    -- 'driver' | 'rider'
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_review_param_active ON hancr_review_parameter(active);

-- Seed default cancel reasons
INSERT INTO hancr_cancel_reason (code, label_ar, label_en, applies_to, sort_order) VALUES
  ('changed_mind',      'غيّرت رأيي',          'Changed my mind',      'rider',  10),
  ('long_wait',         'وقت الانتظار طويل',     'Waiting time too long', 'rider', 20),
  ('wrong_pickup',      'موقع الاستلام خاطئ',    'Wrong pickup location', 'rider', 30),
  ('found_alternative', 'وجدت بديلاً',          'Found an alternative', 'rider',  40),
  ('rider_no_show',     'الراكب لم يأتِ',        'Rider no-show',         'driver', 10),
  ('wrong_destination', 'الوجهة غير صحيحة',     'Wrong destination',     'driver', 20),
  ('vehicle_issue',     'مشكلة في المركبة',     'Vehicle issue',         'driver', 30),
  ('safety_concern',    'مخاوف على السلامة',    'Safety concern',        'driver', 40)
ON CONFLICT (code) DO NOTHING;

-- Seed default review parameters (driver-side)
INSERT INTO hancr_review_parameter (code, label_ar, label_en, target, sort_order) VALUES
  ('cleanliness', 'نظافة المركبة', 'Vehicle cleanliness', 'driver', 10),
  ('safety',      'القيادة الآمنة', 'Safe driving',        'driver', 20),
  ('manners',     'حُسن المعاملة',  'Good manners',        'driver', 30),
  ('punctuality', 'الالتزام بالوقت', 'Punctuality',        'driver', 40)
ON CONFLICT (code) DO NOTHING;
