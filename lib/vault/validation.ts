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

/**
 * KASA-BELGE-01: macOS dosya adlarını NFD (ayrışmış) verir — "İ" = "I" + U+0307,
 * "ç" = "c" + U+0327. Eski hâlde taban harf `\w` ile geçiyor, birleşen işaret ise
 * izin listesinde olmadığı için "_" oluyordu: "Hasta İki … sonuçları.pdf" kasada
 * "Hasta I_ki … sonuc_ları.pdf" olarak görünüyordu. Önce NFC'ye toparlıyoruz, sonra
 * harf/rakamı Unicode duyarlı süzüyoruz — Türkçe, Kürtçe, Arapça adlar aynen kalır.
 * Yol ayıracı, denetim karakteri ve baştaki nokta hâlâ temizlenir.
 */
export function sanitizeFileName(name: string): string {
  return (
    name
      .normalize('NFC')
      .replace(/[\u0000-\u001F\u007F]+/g, '')
      .replace(/[^\p{L}\p{N}._\- ()[\]]+/gu, '_')
      .replace(/^\.+/, '')
      .trim()
      .slice(0, 180) || 'belge'
  )
}

/**
 * KASA-BELGE-01 — HTTP başlıkları yalnız Latin-1 taşır. "ğ ş ı İ" Latin-1'de yok; ham dosya adı
 * Content-Disposition'a yazılınca Node başlığı reddediyor, indirme rotası catch'e düşüp 404
 * dönüyordu. Sonuç: Türkçe adlı her belge Kasa'da açılmıyor ve İndir de çalışmıyordu (ç ö ü
 * Latin-1'de olduğu için tesadüfen çalışıyordu). RFC 5987: ASCII yedek `filename=` + gerçek adı
 * taşıyan `filename*=UTF-8''…`.
 */
export function contentDispositionAd(fileName: string): string {
  const ad = (fileName || 'belge').normalize('NFC')
  const asciiYedek = ad.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '') || 'belge'
  return `filename="${asciiYedek}"; filename*=UTF-8''${encodeURIComponent(ad)}`
}

export type { UploadInput }
