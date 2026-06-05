
-- ============================================================
-- NOTYA ASISTAN — Additional Database Tables
-- Run this in Supabase SQL Editor after main schema
-- ============================================================

-- Doctor learning preferences (the game changer)
CREATE TABLE IF NOT EXISTS doctor_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  preferred_drugs JSONB DEFAULT '{}',
  note_style TEXT DEFAULT 'orta' CHECK (note_style IN ('kisa', 'orta', 'detayli')),
  common_diagnoses TEXT[] DEFAULT '{}',
  correction_history JSONB DEFAULT '[]',
  session_pace TEXT DEFAULT 'normal' CHECK (session_pace IN ('hizli', 'normal', 'yavas')),
  preferred_persona TEXT DEFAULT 'elifsahin',
  sessions_completed INTEGER DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asistan conversation sessions
CREATE TABLE IF NOT EXISTS asistan_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  persona_id TEXT NOT NULL DEFAULT 'elifsahin',
  messages JSONB DEFAULT '[]',
  active_context JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Every action the asistan takes (audit + learning)
CREATE TABLE IF NOT EXISTS asistan_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  asistan_session_id UUID REFERENCES asistan_sessions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  input_text TEXT,
  ai_response TEXT,
  action_data JSONB,
  was_corrected BOOLEAN DEFAULT FALSE,
  correction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE doctor_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistan_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctor sees own prefs" ON doctor_preferences FOR ALL USING (auth.uid() = doctor_id);
CREATE POLICY "Doctor sees own asistan sessions" ON asistan_sessions FOR ALL USING (auth.uid() = doctor_id);
CREATE POLICY "Doctor sees own actions" ON asistan_actions FOR ALL USING (auth.uid() = doctor_id);

-- Auto-update trigger
CREATE TRIGGER update_doctor_prefs_updated_at BEFORE UPDATE ON doctor_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_asistan_sessions_doctor ON asistan_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_asistan_actions_doctor ON asistan_actions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_asistan_actions_session ON asistan_actions(asistan_session_id);
