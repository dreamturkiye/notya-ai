-- Migration: 002_doktor_hasta_management.sql

CREATE TABLE IF NOT EXISTS hasta_belgeler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  belge_turu TEXT NOT NULL,
  dosya_url TEXT NOT NULL,
  ai_ozet JSONB,
  inceleme_bekliyor BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hasta_goruntulemeler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  modalite TEXT CHECK (modalite IN ('xray','mri','bt','us','pet')),
  vucut_bolgesi TEXT,
  dosya_url TEXT,
  dicom_metadata JSONB,
  rapor_metni TEXT,
  radyolog TEXT,
  goruntuleme_tarihi DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hasta_ilaclar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  ilac_adi TEXT NOT NULL,
  etken_madde TEXT,
  doz TEXT,
  kullanim_sikli TEXT,
  baslangic_tarihi DATE,
  bitis_tarihi DATE,
  aktif BOOLEAN DEFAULT TRUE,
  yazan_doktor TEXT,
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hasta_lab_sonuclari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  belge_id UUID REFERENCES hasta_belgeler(id),
  testler JSONB NOT NULL,
  lab_adi TEXT,
  sonuc_tarihi DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hasta_hatirlatma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  mesaj TEXT NOT NULL,
  gonder_tarih TIMESTAMPTZ,
  gonderildi BOOLEAN DEFAULT FALSE,
  kanal TEXT CHECK (kanal IN ('whatsapp','sms')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hasta_belgeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE hasta_goruntulemeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE hasta_ilaclar ENABLE ROW LEVEL SECURITY;
ALTER TABLE hasta_lab_sonuclari ENABLE ROW LEVEL SECURITY;
ALTER TABLE hasta_hatirlatma ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctor sees own only" ON hasta_belgeler FOR ALL USING (auth.uid() = doctor_id);
CREATE POLICY "doctor sees own only" ON hasta_goruntulemeler FOR ALL USING (auth.uid() = doctor_id);
CREATE POLICY "doctor sees own only" ON hasta_ilaclar FOR ALL USING (auth.uid() = doctor_id);
CREATE POLICY "doctor sees own only" ON hasta_lab_sonuclari FOR ALL USING (auth.uid() = doctor_id);
CREATE POLICY "doctor sees own only" ON hasta_hatirlatma FOR ALL USING (auth.uid() = doctor_id);
