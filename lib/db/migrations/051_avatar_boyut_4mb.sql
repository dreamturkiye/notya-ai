-- ============================================================
-- Migration 051: Avatar üst sınırı 4 MB (NOTYA-AVATAR-01 takip)
-- ============================================================
-- Kaan (2026-09-17): uygulama tarafı sınırı (AVATAR_MAX_BYTES) 2 MB'dan 4 MB'a çıkarıldı
-- (PR #307), ama migration 050'deki CHECK kısıtı 2097152 (2 MB) olarak kaldı. Sonuç: 2-4 MB
-- arası bir fotoğraf istemci doğrulamasını geçiyor, sonra veritabanı INSERT'inde CHECK ihlaliyle
-- reddediliyor — hekime yalnızca genel 'Fotoğraf kaydedilemedi' dönüyordu.
-- Constraint adını varsaymadan (Postgres'in otomatik verdiği isim garanti değil), byte_length
-- üzerindeki TÜM mevcut CHECK kısıtlarını bulup kaldırıyor, sonra 4 MB olanı ekliyor — eskisi
-- silinmeden yenisi eklenirse ikisi birden uygulanır ve eski 2 MB sınırı sessizce kalır.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'doctor_avatars'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%byte_length%'
  LOOP
    EXECUTE format('ALTER TABLE doctor_avatars DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;
ALTER TABLE doctor_avatars ADD CONSTRAINT doctor_avatars_byte_length_check
  CHECK (byte_length > 0 AND byte_length <= 4194304);
