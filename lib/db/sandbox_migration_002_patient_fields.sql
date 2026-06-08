-- Run once in Supabase SQL Editor (safe to re-run)
ALTER TABLE sandbox_appointments ADD COLUMN IF NOT EXISTS patient_age INTEGER;
ALTER TABLE sandbox_appointments ADD COLUMN IF NOT EXISTS patient_gender TEXT;
