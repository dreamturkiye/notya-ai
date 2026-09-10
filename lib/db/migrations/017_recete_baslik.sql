-- Migration 017: Reçete başlığı (NOTYA-RECETE-03)
-- Kaan (2026-09-10): kâğıt reçetenin başlığını doktor kendisi yazıp kaydedebilsin —
-- muayenehane adı/adresi/telefonu satırları, diploma no, küçük logo. Tek JSONB kolon;
-- users tablosu üstünde, ayrı tablo/ekran yok (sadelik kuralı).
ALTER TABLE users ADD COLUMN IF NOT EXISTS recete_baslik JSONB;
-- Şekil: { "satirlar": ["Çocuk Sağlığı ve Hastalıkları Uzmanı", "Bağdat Cad. No:12 Kadıköy/İstanbul", "0216 000 00 00"],
--          "diplomaNo": "123456", "logoDataUrl": "data:image/png;base64,..." (≤ 120 KB) }
