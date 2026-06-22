-- Notya AI Mali Musavirlik Schema Migration
-- Run this in Supabase SQL Editor at anjayzospuurymjmmtim.supabase.co

ALTER TABLE users ADD COLUMN IF NOT EXISTS profession_type TEXT DEFAULT 'doktor';
ALTER TABLE users ADD COLUMN IF NOT EXISTS unvan TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS buro_adi TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sehir TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS raw_note TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS vergi_risk_skoru INTEGER;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS gorusme_turu TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS profession_type TEXT DEFAULT 'doktor';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS gorusme_turu TEXT;

CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  musavir_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  sirket_adi TEXT NOT NULL,
  vergi_no TEXT,
  faaliyet_alani TEXT,
  sirket_turu TEXT,
  yetkili_kisi TEXT,
  telefon TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beyan_takvimi (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  musavir_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  beyan_turu TEXT NOT NULL,
  son_gun DATE NOT NULL,
  tamamlandi BOOLEAN DEFAULT FALSE,
  hatirlatma_gonderildi BOOLEAN DEFAULT FALSE,
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyan_takvimi ENABLE ROW LEVEL SECURITY;
CREATE POLICY musavir_clients_policy ON clients FOR ALL USING (auth.uid() = musavir_id);
CREATE POLICY musavir_beyan_policy ON beyan_takvimi FOR ALL USING (auth.uid() = musavir_id);
CREATE INDEX IF NOT EXISTS idx_clients_musavir ON clients(musavir_id);
CREATE INDEX IF NOT EXISTS idx_beyan_musavir ON beyan_takvimi(musavir_id);
CREATE INDEX IF NOT EXISTS idx_beyan_son_gun ON beyan_takvimi(son_gun);
CREATE INDEX IF NOT EXISTS idx_notes_profession ON notes(profession_type);