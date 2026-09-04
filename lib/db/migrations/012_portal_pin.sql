-- ============================================================
-- Migration 012: Sağlığım portal 6-digit PIN gate
-- ============================================================
-- Bearer links alone are weak for health data. Each portal token stores a
-- scrypt hash of a 6-digit PIN; plaintext PIN is shown once to the doctor
-- at link creation and never stored.

ALTER TABLE hasta_portal_tokens
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

COMMENT ON COLUMN hasta_portal_tokens.pin_hash IS
  'scrypt hash of 6-digit patient portal PIN (format: saltHex:hashHex). NULL = legacy link; unlock API requires regenerate.';
