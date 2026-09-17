-- ============================================================
-- Migration 050: Hekim profil fotoğrafı (NOTYA-AVATAR-01)
-- ============================================================
-- Kaan/Dr. Gökhan (2026-09-17): karşılama ekranında hekimin kendi avatarı.
-- Hekimin KENDİ görseli — PHI değil, hasta verisi değil. Yine de kasa (lib/vault) ile aynı
-- çizgide AES-256-GCM zarfı olarak saklanır; sızıntıda düz görsel çıkmasın.
--
-- Neden BYTEA değil TEXT: kasa blob'ları PostgREST'in bytea'yı `\x…` hex olarak döndürmesi
-- yüzünden SECURITY DEFINER RPC (vault_put_blob/vault_get_blob) gerektiriyor. Avatar tek
-- satır ve ≤2 MB; base64 TEXT ile fazladan RPC yüzeyi açmadan aynı işi görüyor.

CREATE TABLE IF NOT EXISTS doctor_avatars (
  doctor_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mime_type TEXT NOT NULL
    CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_length INTEGER NOT NULL CHECK (byte_length > 0 AND byte_length <= 2097152),
  -- AES-256-GCM zarfının base64'ü (iv || ciphertext || tag) — düz görsel ASLA yazılmaz.
  image_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE doctor_avatars ENABLE ROW LEVEL SECURITY;

-- Kasa blob'larıyla aynı duruş: yalnız service-role rotası (doktorOturum + doctor_id kapsamı)
-- okur/yazar. Anon/authenticated istemciye doğrudan erişim kapalı.
DROP POLICY IF EXISTS doctor_avatars_deny ON doctor_avatars;
CREATE POLICY doctor_avatars_deny ON doctor_avatars
  FOR ALL USING (false) WITH CHECK (false);
