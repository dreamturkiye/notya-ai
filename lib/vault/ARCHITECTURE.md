# Medical Document Vault (beta)

Phase-1 vault for Notya clinic files (EKG, X-ray, lab PDF, images) attached to a **patient** and optionally a **visit** (`sessions.id`).

## Layering

```
API routes (auth + ACL)
  → vault service (validate, ownership checks)
    → StorageProvider.put/get/delete
      → DbBlobStorageProvider (AES-GCM ciphertext in Postgres BYTEA)
```

Swap later: implement `S3StorageProvider` / `R2StorageProvider` and change `STORAGE_BACKEND` — metadata table stays the same (`storage_backend` + `storage_key`).

## Schema

- `medical_documents` — metadata only (`document_id`, `patient_id`, `visit_id`, MIME, size, uploader, notes…)
- `medical_document_blobs` — encrypted `BYTEA` keyed by `document_id` (DB backend only)

Patients + visits already exist as `patients` and `sessions`.

## Security

- Doctor JWT via `doktorOturum`; every query scopes `doctor_id = user.id` and verifies patient (and visit) ownership.
- File bytes encrypted at rest with AES-256-GCM (`ENCRYPTION_MASTER_KEY`) before insert.
- Download streams through authenticated route with `Content-Type` / `Content-Disposition` — no public URLs.

## Limits (beta)

- Allowed: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`
- Max size: 4 MB (Vercel body + Postgres practicality)
