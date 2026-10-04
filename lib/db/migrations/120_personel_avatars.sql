-- NOTYA-SEKRETER-01 — sekreter/asistan profil fotoğrafı (doctor_avatars ile aynı zarf modeli).
CREATE TABLE IF NOT EXISTS personel_avatars (
  personel_id UUID PRIMARY KEY REFERENCES personel(id) ON DELETE CASCADE,
  mime_type TEXT NOT NULL
    CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_length INTEGER NOT NULL CHECK (byte_length > 0 AND byte_length <= 4194304),
  image_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE personel_avatars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS personel_avatars_deny ON personel_avatars;
CREATE POLICY personel_avatars_deny ON personel_avatars
  FOR ALL USING (false) WITH CHECK (false);
