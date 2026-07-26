-- Migration 005: Allied health compliance - physician diagnosis reference
-- Required by Saglik Meslek Mensuplarinin Serbest Meslek Icrasi Hakkinda Yonetmelik (29 Mart 2025)
-- Fizyoterapist, diyetisyen, ergoterapist, odyolog, klinik psikolog cannot diagnose -
-- every treatment record must reference an external physician diagnosis + treatment plan.

-- 1. Allow new note types for allied health professions
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_note_type_check;
ALTER TABLE notes ADD CONSTRAINT notes_note_type_check
  CHECK (note_type IN ('soap', 'anamnez', 'epikriz', 'konsultan', 'ameliyat', 'fizyoterapi', 'diyetisyen', 'ergoterapi', 'odyoloji', 'psikolog'));

-- 2. Physician diagnosis reference fields
-- hekim_tani_referansi: free-text description of the referring physician's diagnosis
-- hekim_tani_tarihi: date the diagnosis/treatment plan was issued
-- hekim_adi: referring physician's name (may be external to this platform)
-- tedavi_plani_ozet: summary of the physician's treatment plan this session follows
ALTER TABLE notes ADD COLUMN IF NOT EXISTS hekim_tani_referansi TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS hekim_tani_tarihi DATE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS hekim_adi TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tedavi_plani_ozet TEXT;

-- 3. Enforce at the database level: allied-health note types cannot be inserted
-- without a diagnosis reference. Doctor-authored note types (soap, epikriz, etc.)
-- are exempt since the doctor IS the diagnosing physician.
CREATE OR REPLACE FUNCTION enforce_hekim_tani_referansi()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.note_type IN ('fizyoterapi', 'diyetisyen', 'ergoterapi', 'odyoloji', 'psikolog') THEN
    IF NEW.hekim_tani_referansi IS NULL OR trim(NEW.hekim_tani_referansi) = '' THEN
      RAISE EXCEPTION 'hekim_tani_referansi zorunludur: % turu icin hekim tanisi olmadan kayit olusturulamaz', NEW.note_type;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_hekim_tani ON notes;
CREATE TRIGGER trg_enforce_hekim_tani
  BEFORE INSERT OR UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION enforce_hekim_tani_referansi();

-- 4. Index for lookups by note_type (allied-health dashboards will filter on this)
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON notes(note_type);
