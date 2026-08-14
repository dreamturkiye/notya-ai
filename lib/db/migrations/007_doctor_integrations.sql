-- Migration: 007_doctor_integrations.sql
-- Encrypted per-doctor credential vault for SGK Medula + NVI/KPS.
-- Secrets never returned to the client after save.

CREATE TABLE IF NOT EXISTS doctor_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('medula', 'nvi_kps')),
  status TEXT NOT NULL DEFAULT 'disconnected'
    CHECK (status IN ('connected', 'disconnected', 'error')),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  secrets_encrypted TEXT,
  last_verified_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doctor_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_doctor_integrations_doctor
  ON doctor_integrations (doctor_id);

COMMENT ON TABLE doctor_integrations IS
  'Per-doctor encrypted credentials for government integrations (Medula, NVI/KPS). Authority stays with the doctor.';

COMMENT ON COLUMN doctor_integrations.secrets_encrypted IS
  'AES-256-GCM encrypted JSON secrets. Never select this column for client responses.';

COMMENT ON COLUMN doctor_integrations.meta IS
  'Non-secret metadata (e.g. tesis_kodu, masked hekim TC suffix). Safe for client.';
