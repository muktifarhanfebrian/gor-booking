-- Supabase PostgreSQL Database Schema Migration for GOR Booking Pandu

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Memberships Table (Active Members)
CREATE TABLE IF NOT EXISTS memberships (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE REFERENCES users(email) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL
);

-- 3. Create Courts Table
CREATE TABLE IF NOT EXISTS courts (
    id VARCHAR(50) PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance'))
);

-- 4. Create Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(100) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    court_id VARCHAR(50) NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    booking_type VARCHAR(50) NOT NULL CHECK (booking_type IN ('regular', 'member')),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cod', 'qris')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
    amount NUMERIC(12, 2) NOT NULL,
    service_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    member_group_id VARCHAR(100),
    payment_proof_url TEXT,
    payment_verification_status VARCHAR(50) NOT NULL DEFAULT 'unsubmitted' CHECK (payment_verification_status IN ('unsubmitted', 'pending_verification', 'verified', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Seed Default Data (Courts)
INSERT INTO courts (id, status) VALUES 
('court-1', 'active'),
('court-2', 'active'),
('court-3', 'active')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 6. Seed Default Users (Demo Accounts)
INSERT INTO users (email, name, phone, role, created_at) VALUES
('admin@gor.com', 'Admin GOR Pandu', '081360078986', 'admin', NOW()),
('user@gor.com', 'Rahmat Hidayat', '081269001122', 'user', NOW()),
('budi@gmail.com', 'Budi Santoso', '085277112233', 'user', NOW())
ON CONFLICT (email) DO NOTHING;

-- 7. Seed Default Active Member
INSERT INTO memberships (id, email, name, phone, start_date, end_date) VALUES
('mem_1', 'user@gor.com', 'Rahmat Hidayat', '081269001122', NOW(), NOW() + INTERVAL '25 days')
ON CONFLICT (email) DO NOTHING;
