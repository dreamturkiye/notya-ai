-- Migration 146: doktor-vertical parity fix for the six international countries
--
-- Root cause: the clinical-core backfill (2026-10-14) replayed lib/db/migrations/*.sql
-- in chunks, but these tables were never in that numbered sequence at all —
-- doctor_preferences/asistan_sessions/asistan_actions live only in the
-- untracked top-level lib/db/asistan_schema.sql, and fhir_audit / fhir_export_kuyruk /
-- kurum_entegrasyonlari / kurum_doktorlar / kurum_hasta_eslesme / ai_kullanim /
-- not_duzenlemeleri / ses_kullanim existed only on Türkiye's live production
-- database with no migration file ever committed for them. This migration is
-- the first time they are committed to source control, reverse-engineered
-- verbatim (columns, defaults, constraints, indexes, RLS, policies) from
-- Türkiye's live schema (anjayzospuurymjmmtim) on 2026-10-14.
--
-- Scope: doktor product only. Explicitly excludes the avukat/mali-müşavir
-- vertical tables that also live on Türkiye's database (clients, logs,
-- musevvekiller, sure_takibi, ingestion_log, review_queue, avukat_*, mali_*,
-- beyan_takvimi, dilekce_kuyrugu, deliller, normalized_transactions) — those
-- are a different professional vertical, not part of doktor parity.
--
-- Safe to run on Türkiye too (all guards are IF NOT EXISTS) but not required there.

-- ============================================================
-- Doctor learning preferences + asistan conversation tables
-- (verbatim from lib/db/asistan_schema.sql)
-- ============================================================

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

ALTER TABLE doctor_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistan_actions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='doctor_preferences' AND policyname='Doctor sees own prefs') THEN
    CREATE POLICY "Doctor sees own prefs" ON doctor_preferences FOR ALL USING (auth.uid() = doctor_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='asistan_sessions' AND policyname='Doctor sees own asistan sessions') THEN
    CREATE POLICY "Doctor sees own asistan sessions" ON asistan_sessions FOR ALL USING (auth.uid() = doctor_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='asistan_actions' AND policyname='Doctor sees own actions') THEN
    CREATE POLICY "Doctor sees own actions" ON asistan_actions FOR ALL USING (auth.uid() = doctor_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_doctor_prefs_updated_at') THEN
    CREATE TRIGGER update_doctor_prefs_updated_at BEFORE UPDATE ON doctor_preferences
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_asistan_sessions_doctor ON asistan_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_asistan_actions_doctor ON asistan_actions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_asistan_actions_session ON asistan_actions(asistan_session_id);

-- ============================================================
-- AI usage counter (daily bucket, per doctor)
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_kullanim (
  doctor_id UUID NOT NULL,
  gun DATE NOT NULL,
  kova TEXT NOT NULL,
  sayac INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (doctor_id, gun, kova)
);

ALTER TABLE ai_kullanim ENABLE ROW LEVEL SECURITY;
-- No policy on Türkiye either: ai_kullanim is service-role/backend-only (deny-all under RLS for other roles).

-- ============================================================
-- Institution (kurum) FHIR / HL7 integration — config, doctor mapping,
-- patient/MRN mapping, export queue, export audit
-- ============================================================

CREATE TABLE IF NOT EXISTS kurum_entegrasyonlari (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad TEXT NOT NULL,
  fhir_base_url TEXT NOT NULL,
  hedef TEXT NOT NULL DEFAULT 'kurum-fhir',
  oauth_token_url TEXT,
  oauth_client_id TEXT,
  oauth_client_secret TEXT,
  aktif BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  mrn_sistem_uri TEXT,
  hl7_alici_uygulama TEXT,
  hl7_alici_kurum TEXT,
  hl7_mesaj_tipi TEXT DEFAULT 'MDM',
  inbound_anahtar TEXT
);

ALTER TABLE kurum_entegrasyonlari ENABLE ROW LEVEL SECURITY;
-- Service-role/backend-only on Türkiye: contains OAuth client secrets, no end-user policy.

CREATE TABLE IF NOT EXISTS kurum_doktorlar (
  kurum_id UUID NOT NULL REFERENCES kurum_entegrasyonlari(id),
  doctor_id UUID NOT NULL,
  mrn_onek TEXT,
  kurum_doktor_kodu TEXT,
  PRIMARY KEY (kurum_id, doctor_id)
);

ALTER TABLE kurum_doktorlar ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS kurum_hasta_eslesme (
  kurum_id UUID NOT NULL REFERENCES kurum_entegrasyonlari(id),
  mrn TEXT NOT NULL,
  patient_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (kurum_id, mrn)
);

ALTER TABLE kurum_hasta_eslesme ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS fhir_export_kuyruk (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL,
  kurum_id UUID NOT NULL REFERENCES kurum_entegrasyonlari(id),
  durum TEXT NOT NULL DEFAULT 'pending',
  deneme INTEGER NOT NULL DEFAULT 0,
  fhir_bundle JSONB,
  yanit TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  CONSTRAINT fhir_export_kuyruk_note_id_kurum_id_key UNIQUE (note_id, kurum_id)
);

ALTER TABLE fhir_export_kuyruk ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS fhir_audit (
  id BIGINT NOT NULL GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  note_id UUID,
  kurum_id UUID,
  islem TEXT,
  sonuc TEXT,
  detay TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fhir_audit ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Note edit history (field-level before/after, per doctor)
-- ============================================================

CREATE TABLE IF NOT EXISTS not_duzenlemeleri (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID,
  doctor_id UUID,
  alan TEXT,
  onceki TEXT,
  sonraki TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE not_duzenlemeleri ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='not_duzenlemeleri' AND policyname='hasta_izolasyon_kendi_satiri') THEN
    CREATE POLICY hasta_izolasyon_kendi_satiri ON not_duzenlemeleri
      FOR ALL USING (doctor_id = (SELECT auth.uid()))
      WITH CHECK (doctor_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================================
-- Voice/AI usage metering (per doctor, per asistan session)
-- ============================================================

CREATE TABLE IF NOT EXISTS ses_kullanim (
  id BIGINT NOT NULL GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asistan_session_id UUID NOT NULL,
  kaynak TEXT NOT NULL CHECK (kaynak = ANY (ARRAY['fish','fish_asr','oturum','gecikme'])),
  olcu TEXT NOT NULL CHECK (olcu = ANY (ARRAY['utf8_bayt','karakter','ses_saniye','oturum_saniye','soz_sonu_ms','dinle_ms','asr_ms','ilk_soz_ms','ilk_ses_ms','toplam_ms'])),
  miktar NUMERIC NOT NULL CHECK (miktar >= 0),
  model TEXT
);

ALTER TABLE ses_kullanim ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS ses_kullanim_oturum_idx ON ses_kullanim(asistan_session_id, created_at);
CREATE INDEX IF NOT EXISTS ses_kullanim_doktor_idx ON ses_kullanim(doctor_id, created_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ses_kullanim' AND policyname='ses_kullanim_kendi_satiri_oku') THEN
    CREATE POLICY ses_kullanim_kendi_satiri_oku ON ses_kullanim
      FOR SELECT USING (doctor_id = (SELECT auth.uid()));
  END IF;
END $$;
