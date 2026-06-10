-- ============================================================
-- GOR Pandu – Supabase Migration Patch v2
-- Run this in Supabase Dashboard → SQL Editor
-- SAFE: Uses IF NOT EXISTS / IS NULL guards — non-destructive
-- ============================================================

-- 1. Add `name` column to courts (display label)
ALTER TABLE courts ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- 2. Add `is_blocked` column to courts (manual slot lock)
ALTER TABLE courts ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

-- 3. Backfill default court names for existing seed rows
UPDATE courts SET name = 'Court 1 – Vinyl Premium' WHERE id = 'court-1' AND name IS NULL;
UPDATE courts SET name = 'Court 2 – Vinyl Premium' WHERE id = 'court-2' AND name IS NULL;
UPDATE courts SET name = 'Court 3 – Semen Standar' WHERE id = 'court-3' AND name IS NULL;

-- 4. Add UUID primary key column to users table
--    (current schema uses email as PK which is difficult to reference)
ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- 5. Add `whatsapp_number` column to users (mirrors phone for WA-based auth)
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);

-- 6. Backfill whatsapp_number from existing phone column
UPDATE users SET whatsapp_number = phone WHERE whatsapp_number IS NULL;

-- ============================================================
-- Verification queries (run after migration)
-- SELECT * FROM courts LIMIT 5;
-- SELECT id, name, whatsapp_number, role FROM users LIMIT 5;
-- ============================================================
