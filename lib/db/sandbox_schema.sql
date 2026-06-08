-- ============================================================
-- Dr. Ayşe Sandbox Schema (isolated from main Notya tables)
-- Run manually in Supabase SQL Editor if migration script fails
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Appointments
CREATE TABLE IF NOT EXISTS sandbox_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT NOT NULL DEFAULT 'dr-gokhan',
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_age INTEGER,
  patient_gender TEXT CHECK (patient_gender IN ('male', 'female')),
  appointment_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'interview_in_progress', 'interview_complete', 'chart_ready', 'cancelled')),
  chief_complaint_seed TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_appointments_doctor_time
  ON sandbox_appointments (doctor_id, appointment_time);

-- Patient interviews
CREATE TABLE IF NOT EXISTS sandbox_patient_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES sandbox_appointments(id) ON DELETE CASCADE,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  chief_complaint TEXT,
  hpi TEXT,
  past_history TEXT,
  medications JSONB DEFAULT '[]'::jsonb,
  allergies TEXT,
  review_of_systems JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_interviews_appointment
  ON sandbox_patient_interviews (appointment_id);

-- Clinical charts (Dr. Ayşe pre-visit output)
CREATE TABLE IF NOT EXISTS sandbox_clinical_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES sandbox_appointments(id) ON DELETE CASCADE,
  differential_diagnosis JSONB DEFAULT '[]'::jsonb,
  suggested_workup JSONB DEFAULT '[]'::jsonb,
  treatment_options JSONB DEFAULT '[]'::jsonb,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'moderate', 'high', 'urgent')),
  dr_ayse_notes TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sandbox_charts_appointment
  ON sandbox_clinical_charts (appointment_id);

-- Test scores (Dr. Gökhan evaluation)
CREATE TABLE IF NOT EXISTS sandbox_test_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES sandbox_appointments(id) ON DELETE CASCADE,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_test_scores_appointment
  ON sandbox_test_scores (appointment_id);

-- Phase 2: doctor decisions
CREATE TABLE IF NOT EXISTS sandbox_doctor_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES sandbox_appointments(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL,
  decision_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_doctor_decisions_appointment
  ON sandbox_doctor_decisions (appointment_id);
