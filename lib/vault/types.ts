/**
 * Medical document vault — shared types.
 * Bytes are never returned on list endpoints; use download route.
 */

export type StorageBackend = 'db' | 's3' | 'r2'

export type DocumentMeta = {
  id: string
  doctorId: string
  patientId: string
  visitId: string | null
  fileName: string
  fileType: string
  fileSize: number
  uploadedBy: string
  notes: string | null
  category: string | null
  storageBackend: StorageBackend
  storageKey: string
  createdAt: string
}

export type UploadInput = {
  doctorId: string
  patientId: string
  visitId?: string | null
  fileName: string
  fileType: string
  bytes: Buffer
  notes?: string | null
  category?: string | null
  uploadedBy: string
}

export const VAULT_ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type VaultAllowedMime = (typeof VAULT_ALLOWED_MIME)[number]

/** Vercel body + Postgres practicality for beta BYTEA path. */
export const VAULT_MAX_BYTES = 4 * 1024 * 1024
