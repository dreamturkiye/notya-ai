-- ============================================================
-- NOTYA AI - Veritabanı Şeması
-- KVKK ve Sağlık Bakanlığı uyumlu
-- Tüm kişisel veriler şifreli saklanır
-- ============================================================

-- UUID eklentisi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- KULLANICI TABLOSU (Doktorlar)
-- ============================================================
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  title TEXT CHECK (title IS NULL OR title IN ('Dr.', 'Uzm. Dr.', 'Doç. Dr.', 'Prof. Dr.')),
  specialty TEXT, -- Uzmanlık alanı
  hospital TEXT,
  clinic_name TEXT,
  gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female')),
  addressing_preference TEXT DEFAULT 'named_hocam'
    CHECK (addressing_preference IN ('hocam', 'named_hocam', 'first_name_only')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'klinik', 'hastane')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  iyzico_customer_id TEXT,
  whatsapp_number TEXT, -- WhatsApp not gönderimi için
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  monthly_session_count INTEGER DEFAULT 0,
  total_session_count INTEGER DEFAULT 0,
  data_retention_hours INTEGER DEFAULT 24, -- Ses dosyası silme süresi (0=hemen)
  kvkk_consent_at TIMESTAMPTZ,
  kvkk_consent_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HASTA TABLOSU - Tüm KİŞİSEL VERİ ŞİFRELİ
-- ============================================================
CREATE TABLE patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name_encrypted TEXT NOT NULL,        -- AES-256-GCM ile şifreli
  dob_encrypted TEXT,                  -- Doğum tarihi şifreli
  gender_encrypted TEXT,               -- Cinsiyet şifreli
  tc_kimlik_hash TEXT,                 -- SHA-256 hash - arama için, ham veri yok
  phone_encrypted TEXT,                -- Telefon şifreli
  notes_encrypted TEXT,                -- Genel notlar şifreli
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEANS TABLOSU
-- ============================================================
CREATE TABLE sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  audio_url TEXT,                      -- Supabase Storage URL (geçici)
  audio_deleted_at TIMESTAMPTZ,        -- Ses silinme zamanı
  transcript_raw TEXT,                 -- Ham transkript
  transcript_cleaned TEXT,             -- Whisper temizlenmiş transkript
  status TEXT DEFAULT 'recording' CHECK (status IN ('recording', 'processing', 'completed', 'failed')),
  session_type TEXT DEFAULT 'muayene' CHECK (session_type IN ('muayene', 'kontrol', 'konsültasyon', 'telesağlık')),
  specialty TEXT,                      -- Hangi uzmanlık şablonu kullanıldı
  duration_seconds INTEGER,
  patient_consent_given BOOLEAN DEFAULT FALSE,
  patient_consent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOT TABLOSU - Klinik Notlar
-- ============================================================
CREATE TABLE notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  note_type TEXT DEFAULT 'soap' CHECK (note_type IN ('soap', 'anamnez', 'epikriz', 'konsültan', 'ameliyat')),
  -- SOAP Bölümleri
  content_subjektif TEXT,   -- S: Hasta şikayeti
  content_objektif TEXT,    -- O: Fizik muayene bulguları
  content_degerlendirme TEXT, -- A: Değerlendirme/Tanı
  content_plan TEXT,        -- P: Tedavi planı
  -- Detaylı Alanlar
  content_anamnez TEXT,
  content_fizik_muayene TEXT,
  content_tani TEXT,
  content_tedavi TEXT,
  content_ilaclar JSONB,    -- Reçete: [{ad, doz, süre, kullanım}]
  content_lab_istekleri JSONB, -- Lab istekleri
  content_goruntulemeler JSONB, -- Görüntüleme istekleri
  icd10_codes JSONB,        -- [{code, description, is_primary}]
  kritik_bulgular TEXT[],   -- Acil dikkat gerektiren bulgular
  takip_suresi TEXT,        -- Takip önerisi
  -- Onay
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  whatsapp_sent_at TIMESTAMPTZ,
  -- AI Metadata
  ai_model TEXT DEFAULT 'claude-sonnet-4',
  ai_confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ABONELİK TABLOSU
-- ============================================================
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'pro', 'klinik', 'hastane')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused')),
  iyzico_subscription_id TEXT UNIQUE,
  iyzico_plan_id TEXT,
  monthly_price_try NUMERIC(10,2),
  session_limit_monthly INTEGER, -- NULL = sınırsız
  user_count_limit INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DENETİM KAYITLARI (KVKK Madde 12 Uyumu)
-- ============================================================
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,         -- 'view', 'create', 'update', 'delete', 'export', 'approve'
  resource_type TEXT NOT NULL,  -- 'patient', 'session', 'note', 'subscription'
  resource_id UUID,
  old_values JSONB,             -- Değişiklik öncesi (hassas veriler hariç)
  new_values JSONB,             -- Değişiklik sonrası (hassas veriler hariç)
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VERİ İŞLEME RIZA KAYITLARI (KVKK)
-- ============================================================
CREATE TABLE consent_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('kayit', 'isleme', 'paylasim', 'whatsapp')),
  consent_text TEXT NOT NULL,   -- Rıza metni tam içeriği
  consent_version TEXT NOT NULL,
  given_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  method TEXT CHECK (method IN ('yazili', 'sesli', 'dijital'))
);

-- ============================================================
-- ROW LEVEL SECURITY - Her doktor sadece kendi verisini görür
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Users politikaları
CREATE POLICY "Kullanıcı kendi profilini görebilir" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Kullanıcı kendi profilini güncelleyebilir" ON users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Kullanıcı kendi profilini oluşturabilir" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Patients politikaları
CREATE POLICY "Doktor sadece kendi hastalarını görür" ON patients
  FOR ALL USING (auth.uid() = doctor_id);

-- Sessions politikaları
CREATE POLICY "Doktor sadece kendi seanslarını görür" ON sessions
  FOR ALL USING (auth.uid() = doctor_id);

-- Notes politikaları
CREATE POLICY "Doktor sadece kendi notlarını görür" ON notes
  FOR ALL USING (auth.uid() = doctor_id);

-- Subscriptions politikaları
CREATE POLICY "Kullanıcı kendi aboneliğini görür" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- DENETİM TETİKLEYİCİLERİ
-- ============================================================
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_sessions AFTER INSERT OR UPDATE OR DELETE ON sessions
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_notes AFTER INSERT OR UPDATE OR DELETE ON notes
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- ============================================================
-- OTOMATİK GÜNCELLEME TETİKLEYİCİSİ
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PERFORMANS İNDEKSLERİ
-- ============================================================
CREATE INDEX idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX idx_sessions_doctor_id ON sessions(doctor_id);
CREATE INDEX idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_notes_session_id ON notes(session_id);
CREATE INDEX idx_notes_doctor_id ON notes(doctor_id);
CREATE INDEX idx_notes_approved_at ON notes(approved_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
