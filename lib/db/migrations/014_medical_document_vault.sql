-- ============================================================
-- Migration 014: Medical document vault (beta)
-- ============================================================
-- Metadata + encrypted BYTEA blobs. storage_backend/storage_key
-- let us swap DB storage for S3/R2 later without rewriting callers.
-- visit_id → sessions.id (Notya's visit model).

CREATE TABLE IF NOT EXISTS medical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size >= 0),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  category TEXT,
  storage_backend TEXT NOT NULL DEFAULT 'db'
    CHECK (storage_backend IN ('db', 's3', 'r2')),
  storage_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS medical_documents_storage_key_uidx
  ON medical_documents (storage_key)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS medical_documents_doctor_patient_idx
  ON medical_documents (doctor_id, patient_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS medical_documents_visit_idx
  ON medical_documents (visit_id)
  WHERE deleted_at IS NULL AND visit_id IS NOT NULL;

-- Encrypted ciphertext only (AES-GCM envelope from app). Never store plaintext.
CREATE TABLE IF NOT EXISTS medical_document_blobs (
  document_id UUID PRIMARY KEY REFERENCES medical_documents(id) ON DELETE CASCADE,
  ciphertext BYTEA NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_document_blobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS medical_documents_doctor ON medical_documents;
CREATE POLICY medical_documents_doctor ON medical_documents
  FOR ALL USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

-- Blobs are only reachable via service-role / RPC; still deny direct anon access.
DROP POLICY IF EXISTS medical_document_blobs_deny ON medical_document_blobs;
CREATE POLICY medical_document_blobs_deny ON medical_document_blobs
  FOR ALL USING (false) WITH CHECK (false);

-- PostgREST-friendly put/get (base64 ↔ BYTEA). Service role calls these.
CREATE OR REPLACE FUNCTION vault_put_blob(p_document_id UUID, p_ciphertext_b64 TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO medical_document_blobs (document_id, ciphertext, byte_length)
  VALUES (
    p_document_id,
    decode(p_ciphertext_b64, 'base64'),
    octet_length(decode(p_ciphertext_b64, 'base64'))
  )
  ON CONFLICT (document_id) DO UPDATE
    SET ciphertext = EXCLUDED.ciphertext,
        byte_length = EXCLUDED.byte_length;
END;
$$;

CREATE OR REPLACE FUNCTION vault_get_blob(p_document_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  out_b64 TEXT;
BEGIN
  SELECT encode(ciphertext, 'base64') INTO out_b64
  FROM medical_document_blobs
  WHERE document_id = p_document_id;
  RETURN out_b64;
END;
$$;

REVOKE ALL ON FUNCTION vault_put_blob(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION vault_get_blob(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vault_put_blob(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION vault_get_blob(UUID) TO service_role;

COMMENT ON TABLE medical_documents IS
  'Medical document vault metadata. Bytes live behind StorageProvider (db blobs or future object storage).';
COMMENT ON TABLE medical_document_blobs IS
  'AES-GCM encrypted file bytes for storage_backend=db. Never plaintext.';

INSERT INTO schema_migrations (version, filename, checksum, applied_at, backfilled, note)
VALUES (
  '014',
  '014_medical_document_vault.sql',
  NULL,
  NOW(),
  FALSE,
  'Medical document vault: metadata + encrypted BYTEA blobs + StorageProvider-ready keys'
)
ON CONFLICT (version) DO NOTHING;
