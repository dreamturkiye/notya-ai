-- Sağlığım PIN kilidi. 6 haneli PIN tek başına deneme sınırı olmadan taranabilir.
-- Beş hatalı deneme satırı 15 dakika kilitler. Sayaç artışı tek SQL deyiminde olur
-- (eşzamanlı istekler sınırı aşamaz). Uygulama bu sütunlar ve fonksiyon yokken
-- kilidi doğrulayamaz; unlock o durumda 503 döner, sınırsız denemeye düşmez.
-- Written only — NOT applied by the agent. Idempotent.

ALTER TABLE hasta_portal_tokens
  ADD COLUMN IF NOT EXISTS pin_hata_sayisi INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_kilit_bitis TIMESTAMPTZ;

COMMENT ON COLUMN hasta_portal_tokens.pin_hata_sayisi IS
  'Yanlış PIN sayısı. Beşe ulaşınca sıfırlanır ve pin_kilit_bitis 15 dakika sonraya alınır.';
COMMENT ON COLUMN hasta_portal_tokens.pin_kilit_bitis IS
  'Bu an gelmeden unlock her PIN denemesini reddeder.';

CREATE OR REPLACE FUNCTION portal_pin_hata(p_token text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  yeni integer;
  kilit timestamptz;
BEGIN
  UPDATE hasta_portal_tokens
  SET pin_hata_sayisi = pin_hata_sayisi + 1
  WHERE token_hash = p_token
    AND (expires_at IS NULL OR expires_at > now())
  RETURNING pin_hata_sayisi INTO yeni;

  IF yeni IS NULL THEN
    RETURN NULL;
  END IF;

  IF yeni >= 5 THEN
    kilit := now() + interval '15 minutes';
    UPDATE hasta_portal_tokens
    SET pin_hata_sayisi = 0,
        pin_kilit_bitis = kilit
    WHERE token_hash = p_token;
    RETURN kilit;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION portal_pin_hata(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION portal_pin_hata(text) FROM anon;
REVOKE ALL ON FUNCTION portal_pin_hata(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION portal_pin_hata(text) TO service_role;
