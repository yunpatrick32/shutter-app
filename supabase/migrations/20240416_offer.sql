ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS offered_price numeric,
  ADD COLUMN IF NOT EXISTS counter_price numeric;
