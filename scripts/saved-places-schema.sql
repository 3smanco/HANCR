-- HANCR — Saved Places schema (Phase B2)
-- يُطبَّق يدوياً على الإنتاج (synchronize=false)

CREATE TABLE IF NOT EXISTS hancr_saved_place (
  id SERIAL PRIMARY KEY,
  rider_id INT NOT NULL,
  label VARCHAR(60) NOT NULL,
  address VARCHAR(255) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  type VARCHAR(10) NOT NULL DEFAULT 'other',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_place_rider ON hancr_saved_place(rider_id);
