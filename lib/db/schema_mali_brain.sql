-- lib/db/schema_mali_brain.sql
CREATE TABLE IF NOT EXISTS mali_preferences (
  musavir_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  preferred_mevzuat JSONB DEFAULT '{}',
  correction_history JSONB DEFAULT '[]',
  note_style TEXT DEFAULT 'orta',
  preferred_hizmetler JSONB DEFAULT '[]',
  sessions_completed INT DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mali_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  musavir_id UUID REFERENCES users(id),
  musteri_id UUID,
  messages JSONB DEFAULT '[]',
  active_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mali_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  musavir_id UUID REFERENCES users(id),
  mali_session_id UUID,
  action_type TEXT,
  input_text TEXT,
  ai_response TEXT,
  action_data JSONB DEFAULT '{}',
  was_corrected BOOLEAN DEFAULT FALSE,
  correction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mali_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE mali_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mali_actions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mali_preferences' AND policyname='mali_pref_policy') THEN
    CREATE POLICY mali_pref_policy ON mali_preferences FOR ALL USING (auth.uid() = musavir_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mali_sessions' AND policyname='mali_sessions_policy') THEN
    CREATE POLICY mali_sessions_policy ON mali_sessions FOR ALL USING (auth.uid() = musavir_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mali_actions' AND policyname='mali_actions_policy') THEN
    CREATE POLICY mali_actions_policy ON mali_actions FOR ALL USING (auth.uid() = musavir_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mali_sessions_musavir ON mali_sessions(musavir_id);
CREATE INDEX IF NOT EXISTS idx_mali_actions_musavir ON mali_actions(musavir_id);