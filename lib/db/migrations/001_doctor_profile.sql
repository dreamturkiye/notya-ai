-- NOTYA AI — Doctor profile & Turkish medical addressing (Postgres/Supabase)
-- Migration: 001_doctor_profile

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hospital TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS addressing_preference TEXT DEFAULT 'named_hocam';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_title_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_title_check
      CHECK (title IS NULL OR title IN ('Dr.', 'Uzm. Dr.', 'Doç. Dr.', 'Prof. Dr.'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_gender_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_gender_check
      CHECK (gender IS NULL OR gender IN ('male', 'female'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_addressing_preference_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_addressing_preference_check
      CHECK (addressing_preference IS NULL OR addressing_preference IN ('hocam', 'named_hocam', 'first_name_only'));
  END IF;
END $$;

-- Allow authenticated users to insert their own profile row on signup
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
