import {
  VAULT_ALLOWED_MIME,
  VAULT_MAX_BYTES,
  type UploadInput,
  type DocumentMeta,
  type VaultAllowedMime,
} from './types'

export function assertAllowedUpload(fileType: string, fileSize: number, fileName: string): void {
  if (!fileName?.trim()) throw new VaultValidationError('Dosya adı zorunludur')
  if (!VAULT_ALLOWED_MIME.includes(fileType as VaultAllowedMime)) {
    throw new VaultValidationError('Desteklenen türler: PDF, JPEG, PNG, WebP')
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    throw new VaultValidationError('Dosya boş olamaz')
  }
  if (fileSize > VAULT_MAX_BYTES) {
    throw new VaultValidationError('Dosya 4 MB sınırını aşıyor')
  }
}

export class VaultValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VaultValidationError'
  }
}

export class VaultAccessError extends Error {
  constructor(message = 'Bu belgeye erişim yetkiniz yok') {
    super(message)
    this.name = 'VaultAccessError'
  }
}

export function rowToMeta(row: Record<string, unknown>): DocumentMeta {
  return {
    id: String(row.id),
    doctorId: String(row.doctor_id),
    patientId: String(row.patient_id),
    visitId: row.visit_id ? String(row.visit_id) : null,
    fileName: String(row.file_name),
    fileType: String(row.file_type),
    fileSize: Number(row.file_size),
    uploadedBy: String(row.uploaded_by),
    notes: row.notes != null ? String(row.notes) : null,
    category: row.category != null ? String(row.category) : null,
    storageBackend: (row.storage_backend as DocumentMeta['storageBackend']) || 'db',
    storageKey: String(row.storage_key),
    createdAt: String(row.created_at),
  }
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\- ()ğüşıöçĞÜŞİÖÇ]+/gi, '_').slice(0, 180) || 'belge'
}

export type { UploadInput }
