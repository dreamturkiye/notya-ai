-- ============================================================
-- Migration 013: Expand imaging modality taxonomy (PACS-style)
-- ============================================================
-- Doctor upload UI already sends labels like X-Ray / EKG; portal filters
-- need a stable code set. Drop the tight CHECK and allow the codes used
-- by lib/doktor/imagingModalities.ts (normalized on write).

ALTER TABLE hasta_goruntulemeler DROP CONSTRAINT IF EXISTS hasta_goruntulemeler_modalite_check;

ALTER TABLE hasta_goruntulemeler
  ADD CONSTRAINT hasta_goruntulemeler_modalite_check
  CHECK (
    modalite IS NULL OR modalite IN (
      'xray', 'mri', 'bt', 'us', 'pet', 'ekg', 'eko', 'mamografi', 'diger'
    )
  );

COMMENT ON COLUMN hasta_goruntulemeler.modalite IS
  'Canonical PACS modality code: xray|mri|bt|us|pet|ekg|eko|mamografi|diger';

INSERT INTO schema_migrations (version, filename, checksum, applied_at, backfilled, note)
VALUES (
  '013',
  '013_imaging_modalities.sql',
  NULL,
  NOW(),
  FALSE,
  'Expand hasta_goruntulemeler.modalite for EKG/EKO/mamografi + normalize codes'
)
ON CONFLICT (version) DO NOTHING;
