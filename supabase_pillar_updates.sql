-- ============================================================
-- GOR Pandu – Backend Pillars Updates (Anti-Double Booking & RLS)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ==========================================
-- PILLAR 1: ATOMIC ANTI-DOUBLE BOOKING
-- ==========================================
-- Prevents two bookings on the same court, same date, and same start_time
-- ONLY IF the booking is not 'failed'. (i.e. 'pending' or 'success' bookings hold the slot)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_booking 
ON bookings (court_id, date, start_time) 
WHERE payment_status IN ('pending', 'success');

-- ==========================================
-- PILLAR 2: ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- Policies for 'courts'
-- ------------------------------------------
-- Public can view courts
CREATE POLICY "Public can view courts" 
ON courts FOR SELECT 
USING (true);

-- Admins can insert/update/delete courts
CREATE POLICY "Admins can manage courts" 
ON courts FOR ALL 
USING (
  (SELECT role FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email') = 'admin'
);

-- ------------------------------------------
-- Policies for 'users'
-- ------------------------------------------
-- Public can insert new accounts (Guest WhatsApp login)
CREATE POLICY "Public can register phone" 
ON users FOR INSERT 
WITH CHECK (true);

-- Admins can view and manage users
CREATE POLICY "Admins can manage users" 
ON users FOR ALL 
USING (
  (SELECT role FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email') = 'admin'
);

-- ------------------------------------------
-- Policies for 'bookings'
-- ------------------------------------------
-- Public can insert bookings
CREATE POLICY "Public can insert bookings" 
ON bookings FOR INSERT 
WITH CHECK (true);

-- Public can view bookings (Need to allow so that schedule grid works, but only show public info. 
-- In API, we fetch schedule. For safety we let everyone SELECT, but restrict fields in app if needed, 
-- or we can let API bypass with service_role. Here we allow public read so the UI can draw the schedule grid.)
CREATE POLICY "Public can view bookings" 
ON bookings FOR SELECT 
USING (true);

-- Admins can update/delete bookings
CREATE POLICY "Admins can manage bookings" 
ON bookings FOR UPDATE 
USING (
  (SELECT role FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email') = 'admin'
);
CREATE POLICY "Admins can delete bookings" 
ON bookings FOR DELETE 
USING (
  (SELECT role FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email') = 'admin'
);

-- ------------------------------------------
-- Policies for 'memberships'
-- ------------------------------------------
-- Public can view active memberships (to see who booked)
CREATE POLICY "Public can view memberships" 
ON memberships FOR SELECT 
USING (true);

-- Admins can manage memberships
CREATE POLICY "Admins can manage memberships" 
ON memberships FOR ALL 
USING (
  (SELECT role FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email') = 'admin'
);

-- ============================================================
-- NOTE: 
-- The API uses 'service_role' key where necessary to bypass RLS 
-- completely for admin server-side logic if the JWT check is insufficient 
-- due to custom auth flow.
-- ============================================================
