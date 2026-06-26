-- ============================================================
-- Migration 004: Clinic Backend + Pabau OAuth Integration
-- Notya AI Ñ dev branch only
-- ============================================================

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT DEFAULT 'klinik' CHECK (plan IN ('klinik', 'isletme')),
  seat_count INTEGER DEFAULT 5,
  seats_used INTEGER DEFAULT 0,
  pabau_connected BOOLEAN DEFAULT FALSE,
  pabau_account_id TEXT,
  city TEXT,
  phone TEXT,
  website TEXT,
  specialty_focus TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  specialty TEXT,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(clinic_id, user_id)
);

CREATE TABLE IF NOT EXISTS clinic_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token_hash TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pabau_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  pabau_account_id TEXT NOT NULL,
  pabau_user_email TEXT,
  token_expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='clinic_id') THEN
    ALTER TABLE users ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pabau_connected') THEN
    ALTER TABLE users ADD COLUMN pabau_connected BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='account_type') THEN
    ALTER TABLE users ADD COLUMN account_type TEXT DEFAULT 'individual' CHECK (account_type IN ('individual','clinic_member','clinic_admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clinics_owner ON clinics(owner_id);
CREATE INDEX IF NOT EXISTS idx_clinic_members_clinic ON clinic_members(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_members_user ON clinic_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pabau_connections_user ON pabau_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_token ON clinic_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_email ON clinic_invitations(email);
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pabau_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clinics' AND policyname='clinics_owner_all') THEN
    CREATE POLICY clinics_owner_all ON clinics FOR ALL USING (auth.uid() = owner_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clinics' AND policyname='clinics_member_select') THEN
    CREATE POLICY clinics_member_select ON clinics FOR SELECT USING (
      auth.uid() IN (SELECT user_id FROM clinic_members WHERE clinic_id = id AND is_active = TRUE)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clinic_members' AND policyname='clinic_members_admin_all') THEN
    CREATE POLICY clinic_members_admin_all ON clinic_members FOR ALL USING (
      auth.uid() IN (SELECT user_id FROM clinic_members cm2 WHERE cm2.clinic_id = clinic_members.clinic_id AND cm2.role = 'admin' AND cm2.is_active = TRUE)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clinic_members' AND policyname='clinic_members_own_row') THEN
    CREATE POLICY clinic_members_own_row ON clinic_members FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clinic_invitations' AND policyname='invitations_admin_all') THEN
    CREATE POLICY invitations_admin_all ON clinic_invitations FOR ALL USING (
      auth.uid() IN (SELECT user_id FROM clinic_members WHERE clinic_id = clinic_invitations.clinic_id AND role = 'admin' AND is_active = TRUE)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clinic_invitations' AND policyname='invitations_public_select') THEN
    CREATE POLICY invitations_public_select ON clinic_invitations FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pabau_connections' AND policyname='pabau_own_row') THEN
    CREATE POLICY pabau_own_row ON pabau_connections FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clinics_updated_at') THEN
    CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pabau_connections_updated_at') THEN
    CREATE TRIGGER update_pabau_connections_updated_at BEFORE UPDATE ON pabau_connections FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
  END IF;
END $$;