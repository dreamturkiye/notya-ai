-- ============================================================
-- Migration 001: Doctor Profile (Hocam) — Postgres / Supabase
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT
  CHECK (title IS NULL OR title IN ('Dr.', 'Uzm. Dr.', 'Doç. Dr.', 'Prof. Dr.'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS hospital TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT
  CHECK (gender IS NULL OR gender IN ('male', 'female'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS addressing_preference TEXT DEFAULT 'named_hocam'
  CHECK (addressing_preference IN ('hocam', 'named_hocam', 'first_name_only'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Backfill from existing full_name where possible
UPDATE users
SET
  first_name = COALESCE(first_name, split_part(full_name, ' ', 1)),
  last_name = COALESCE(last_name, NULLIF(trim(substring(full_name from position(' ' in full_name))), '')),
  hospital = COALESCE(hospital, clinic_name)
WHERE full_name IS NOT NULL AND first_name IS NULL;

-- Allow users to insert their own profile row on signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Kullanıcı kendi profilini oluşturabilir'
  ) THEN
    CREATE POLICY "Kullanıcı kendi profilini oluşturabilir" ON users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;
