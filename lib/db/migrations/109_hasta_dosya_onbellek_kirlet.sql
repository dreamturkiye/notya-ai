-- ============================================================
-- Migration 109: hasta dosya önbelleğini klinik yazımda kirlet.
-- Klinik satır (doctor_id veya doktor_id + patient) değişince kirli=true.
-- Tetik hata verirse klinik yazımı düşürmez. notes hasta_id taşımaz → sessions.
-- Üretim: bu dosya Vercel ile kendiliğinden çalışmaz; Supabase SQL olarak bir kez uygulanır.
-- ============================================================

CREATE OR REPLACE FUNCTION notya_guvenli_uuid(t text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF t IS NULL OR btrim(t) = '' THEN
    RETURN NULL;
  END IF;
  RETURN t::uuid;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION hasta_dosya_onbellek_kirlet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  satir jsonb;
  doktor uuid;
  hasta uuid;
BEGIN
  satir := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  doktor := COALESCE(notya_guvenli_uuid(satir->>'doctor_id'), notya_guvenli_uuid(satir->>'doktor_id'));
  hasta := notya_guvenli_uuid(satir->>'patient_id');
  IF TG_TABLE_NAME = 'patients' THEN
    hasta := COALESCE(notya_guvenli_uuid(satir->>'id'), hasta);
  END IF;
  IF hasta IS NULL AND notya_guvenli_uuid(satir->>'session_id') IS NOT NULL THEN
    SELECT s.patient_id, COALESCE(doktor, s.doctor_id)
      INTO hasta, doktor
      FROM sessions s
      WHERE s.id = notya_guvenli_uuid(satir->>'session_id');
  END IF;
  IF doktor IS NOT NULL AND hasta IS NOT NULL THEN
    INSERT INTO hasta_dosya_onbellek (doctor_id, patient_id, kirli, guncelleme)
    VALUES (doktor, hasta, true, now())
    ON CONFLICT (doctor_id, patient_id)
    DO UPDATE SET kirli = true, guncelleme = now();
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
  tablolar text[] := ARRAY[
    'patients',
    'sessions',
    'notes',
    'hasta_ilaclar',
    'asilar',
    'hasta_intake_formlari',
    'hasta_goruntulemeler',
    'hasta_belgeler',
    'cihaz_olcumleri',
    'belge_analizleri',
    'randevular',
    'lab_satirlar',
    'goruntu_calisma'
  ];
BEGIN
  IF to_regclass('public.hasta_dosya_onbellek') IS NULL THEN
    RAISE NOTICE 'hasta_dosya_onbellek yok — 108 önce uygulanmalı';
    RETURN;
  END IF;
  FOREACH t IN ARRAY tablolar LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('DROP TRIGGER IF EXISTS trg_hasta_dosya_onbellek_kirlet ON %I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_hasta_dosya_onbellek_kirlet AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION hasta_dosya_onbellek_kirlet()',
      t
    );
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.hasta_dosya_onbellek_kirlet() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notya_guvenli_uuid(text) FROM PUBLIC;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.hasta_dosya_onbellek_kirlet() FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON FUNCTION public.notya_guvenli_uuid(text) FROM anon, authenticated';
  END IF;
END $$;
