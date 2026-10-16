-- NOTYA-ASI-ONAM-01 (2026-10-16) — Dijital Aşı Onam Sistemi. Phase 1: Türkiye, Pediatri only.
--
-- Two tables, two different durability promises:
--
--  * asi_onam_talepleri — MUTABLE workflow state. A doctor-initiated request for a parent to
--    review vaccine information and consent REMOTELY, before the muayene (randevu oluşturulunca
--    veya bir gün önce). This is NOT itself a legal consent record — it only tracks "was a
--    request sent, for which vaccines, through which channel, is it done yet". Its status moves
--    (gonderildi → tamamlandi/iptal) because it is operational bookkeeping, not evidence.
--
--  * asi_onam_kayitlari — IMMUTABLE legal record. Exactly one row per actual consent EVENT
--    (a parent/patient confirming or declining, in clinic, remotely, or on paper). No UPDATE, no
--    DELETE — enforced by a trigger that rejects both unconditionally, even for the service-role
--    client the app uses everywhere (service-role bypasses RLS by design — see
--    .cursor/skills/hasta-izolasyon/SKILL.md — so RLS alone is not a strong enough guarantee for
--    a legal document; this follows migration 160's sessions_protokol_no_degismez() precedent,
--    generalised from "one immutable column" to "the whole row is append-only").
--    Correcting a mistaken or incomplete consent is always a NEW row — the old row must keep
--    showing exactly what was presented and signed at the time (icerik_anlik_goruntu is a frozen
--    snapshot of the content shown, never a live reference to the vaccine reference dataset,
--    which may change later).

CREATE TABLE IF NOT EXISTS asi_onam_talepleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doktor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  randevu_id UUID REFERENCES randevular(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  -- Planned vaccine names for this request, e.g. ["KPA (Konjuge Pnömokok)", "KKK (Kızamık-Kızamıkçık-Kabakulak)"].
  asilar JSONB NOT NULL,
  dil TEXT NOT NULL DEFAULT 'tr',
  -- How the parent was NOTIFIED (lib/iletisim one-tap WhatsApp/e-posta from the doctor's own
  -- account, or they came straight to Sağlığım without a separate notification). The actual
  -- review-and-confirm step always happens inside the PIN-gated Sağlığım portal — see
  -- lib/iletisim/README.md "no clinical content in any message"; vaccine names/content never go
  -- in the WhatsApp/e-posta text itself, only a generic notice + Sağlığım link.
  bildirim_kanali TEXT NOT NULL CHECK (bildirim_kanali IN ('eposta', 'whatsapp', 'dogrudan-portal')),
  durum TEXT NOT NULL DEFAULT 'gonderildi' CHECK (durum IN ('gonderildi', 'tamamlandi', 'iptal')),
  -- Filled once a parent actually confirms/declines (FK added below, after that table exists).
  onam_kaydi_id UUID,
  olusturan_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_asi_onam_talepleri_patient ON asi_onam_talepleri (doktor_id, patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_asi_onam_talepleri_bekleyen ON asi_onam_talepleri (doktor_id, durum) WHERE durum = 'gonderildi';
ALTER TABLE asi_onam_talepleri ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  CREATE POLICY "asi_onam_talepleri_kendi_satiri" ON asi_onam_talepleri FOR ALL
    USING (doktor_id = auth.uid()) WITH CHECK (doktor_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS asi_onam_kayitlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doktor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  -- The muayene this consent belongs to. NULL only briefly, for a remote consent taken before the
  -- visit's session row exists yet — the in-clinic doctor view then shows it as "on file, not yet
  -- linked to today's muayene" and links it the moment the session opens (lib/asi/onam/asiOnamMotoru).
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  randevu_id UUID REFERENCES randevular(id) ON DELETE SET NULL,
  talep_id UUID REFERENCES asi_onam_talepleri(id) ON DELETE SET NULL,
  -- The specific vaccines THIS consent event covers.
  asilar JSONB NOT NULL,
  -- Frozen per-vaccine content exactly as shown at the time: ad, korur, yanEtkiler, onamCumlesi,
  -- kaynak, dil — see lib/asi/onam/asiOnamIcerigi.ts (the live, editable reference dataset) and
  -- lib/asi/onam/asiOnamMotoru.ts asiOnamAnlikGoruntuOlustur() (what actually freezes this field).
  icerik_anlik_goruntu JSONB NOT NULL,
  dil TEXT NOT NULL DEFAULT 'tr',
  yontem TEXT NOT NULL CHECK (yontem IN ('klinik', 'uzaktan-eposta', 'uzaktan-whatsapp', 'uzaktan-portal', 'kagit')),
  durum TEXT NOT NULL DEFAULT 'alindi' CHECK (durum IN ('alindi', 'reddedildi')),
  -- Who actually confirmed: veli/yasal temsilci kimliği (the near-universal case in Pediatri —
  -- VELI-YASAL-ONAM, every patient under 18) or the patient's own name on the rare ≥18 Pediatri
  -- patient (onay_eden_yakinlik = 'Kendisi'). Snapshotted here, never only a reference to
  -- hasta_intake_formlari, which can be edited after the fact.
  onay_eden_adi TEXT NOT NULL,
  onay_eden_yakinlik TEXT,
  onay_eden_telefon TEXT,
  -- Patient's DOB as known at the time — proves the veli/self-consent branch taken was correct.
  hasta_dogum_tarihi_anlik DATE,
  -- Only for yontem = 'kagit': storage path of the uploaded signed scan (hasta-belgeler bucket).
  kagit_dosya_url TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_asi_onam_kayitlari_patient ON asi_onam_kayitlari (doktor_id, patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_asi_onam_kayitlari_session ON asi_onam_kayitlari (session_id) WHERE session_id IS NOT NULL;

ALTER TABLE asi_onam_talepleri
  ADD CONSTRAINT fk_asi_onam_talepleri_kaydi FOREIGN KEY (onam_kaydi_id) REFERENCES asi_onam_kayitlari(id) ON DELETE SET NULL;

ALTER TABLE asi_onam_kayitlari ENABLE ROW LEVEL SECURITY;
-- No UPDATE/DELETE policy on purpose — append-only (mirrors accounting_audit_log, migration 154).
DO $$
BEGIN
  CREATE POLICY "asi_onam_kayitlari_okuma" ON asi_onam_kayitlari FOR SELECT
    USING (doktor_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE POLICY "asi_onam_kayitlari_yazma" ON asi_onam_kayitlari FOR INSERT
    WITH CHECK (doktor_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Hard immutability: RLS is defense in depth only (every app route uses the service-role client,
-- which bypasses RLS — hasta-izolasyon.SKILL.md). A legal consent record must not depend on the
-- app "remembering" never to call .update()/.delete() on this table, so a trigger rejects BOTH
-- unconditionally, for every role including service-role. A correction is always a new row.
CREATE OR REPLACE FUNCTION asi_onam_kayitlari_degismez()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Aşı onam kaydı değiştirilemez veya silinemez (immutable, append-only kayıt).';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_asi_onam_kayitlari_update_engeli ON asi_onam_kayitlari;
CREATE TRIGGER trg_asi_onam_kayitlari_update_engeli
  BEFORE UPDATE ON asi_onam_kayitlari
  FOR EACH ROW EXECUTE FUNCTION asi_onam_kayitlari_degismez();

DROP TRIGGER IF EXISTS trg_asi_onam_kayitlari_delete_engeli ON asi_onam_kayitlari;
CREATE TRIGGER trg_asi_onam_kayitlari_delete_engeli
  BEFORE DELETE ON asi_onam_kayitlari
  FOR EACH ROW EXECUTE FUNCTION asi_onam_kayitlari_degismez();

COMMENT ON TABLE asi_onam_kayitlari IS
  $$NOTYA-ASI-ONAM-01 — immutable, append-only vaccine informed-consent records (Pediatri only, brans-alan-sizmasi gate: lib/asi/onam/asiOnamBransKapisi.ts). One row per consent EVENT; never updated or deleted (trg_asi_onam_kayitlari_update_engeli / _delete_engeli). icerik_anlik_goruntu freezes the exact content shown at the time.$$;
COMMENT ON TABLE asi_onam_talepleri IS
  $$NOTYA-ASI-ONAM-01 — mutable workflow state for a remote (pre-visit) consent request. NOT a legal record; the legal record is the asi_onam_kayitlari row created once the parent actually responds.$$;
