/**
 * Sağlığım mesaj ekleri — hasta dosyayı mesajla gönderir; belgeler'e doğrudan yüklemez.
 * Hekim: gözlemle · Belgeler'e kaydet · mesaj silince ek CASCADE gider.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptBytes, decryptBytes } from '@/lib/vault/crypto'
import { uploadDocument } from '@/lib/vault/service'
import {
  VaultValidationError,
  assertAllowedUpload,
  sanitizeFileName,
} from '@/lib/vault/validation'
import { VAULT_ALLOWED_MIME, VAULT_MAX_BYTES } from '@/lib/vault/types'

export const MESAJ_EK_AZAMI = 3
export const MESAJ_EK_ACCEPT =
  'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,audio/*,.mp3,.wav,.m4a,.aac,video/mp4,video/webm'

export type MesajEkMeta = {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  /** Set when doctor filed into medical_documents */
  belgeId: string | null
}

export type MesajEkSatir = MesajEkMeta & {
  mesajId: string
  doctorId: string
  patientId: string
  ciphertextB64: string
}

/** Browser MIME gaps: Word/Excel often arrive as empty or application/octet-stream. */
export function mesajEkMimeCoz(fileName: string, reported: string): string {
  const r = String(reported || '').trim().toLowerCase()
  if (r && (VAULT_ALLOWED_MIME as readonly string[]).includes(r)) return r
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    heic: 'image/heic', heif: 'image/heif',
    mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac',
    mp4: 'video/mp4', webm: 'video/webm',
    csv: 'text/csv',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
  }
  return map[ext] || r || 'application/octet-stream'
}

export function mesajEkDogrula(fileName: string, fileType: string, byteLength: number): void {
  try {
    assertAllowedUpload(fileType, byteLength, fileName)
  } catch (e) {
    if (e instanceof VaultValidationError) {
      throw new VaultValidationError(
        'Desteklenen türler: PDF, Word, Excel, görüntü, ses (MP3/WAV/M4A), kısa video (MP4/WebM, en fazla 4 MB).'
      )
    }
    throw e
  }
}

export async function mesajEkleriYukle(
  sb: SupabaseClient,
  g: {
    mesajId: string
    doctorId: string
    patientId: string
    files: Array<{ fileName: string; fileType: string; bytes: Buffer }>
  }
): Promise<MesajEkMeta[]> {
  if (g.files.length > MESAJ_EK_AZAMI) {
    throw new VaultValidationError(`En fazla ${MESAJ_EK_AZAMI} dosya ekleyebilirsiniz.`)
  }
  const out: MesajEkMeta[] = []
  for (const f of g.files) {
    const fileName = sanitizeFileName(f.fileName)
    const fileType = mesajEkMimeCoz(fileName, f.fileType)
    mesajEkDogrula(fileName, fileType, f.bytes.length)
    const ciphertext_b64 = encryptBytes(f.bytes).toString('base64')
    const { data, error } = await sb
      .from('hasta_mesaj_ekleri')
      .insert({
        mesaj_id: g.mesajId,
        doctor_id: g.doctorId,
        patient_id: g.patientId,
        file_name: fileName,
        file_type: fileType,
        file_size: f.bytes.length,
        ciphertext_b64,
      })
      .select('id, file_name, file_type, file_size, medical_document_id')
      .single()
    if (error || !data) {
      // Migration 115 not applied yet
      if (/hasta_mesaj_ekleri|does not exist|schema cache/i.test(String(error?.message || ''))) {
        throw new VaultValidationError('Mesaj eki kısa süre içinde açılacak. Lütfen daha sonra deneyin.')
      }
      throw new Error('Dosya eklenemedi')
    }
    out.push({
      id: String(data.id),
      fileName: String(data.file_name),
      fileType: String(data.file_type),
      fileSize: Number(data.file_size),
      belgeId: data.medical_document_id ? String(data.medical_document_id) : null,
    })
  }
  return out
}

export async function mesajEkleriGetir(
  sb: SupabaseClient,
  mesajIds: string[]
): Promise<Map<string, MesajEkMeta[]>> {
  const map = new Map<string, MesajEkMeta[]>()
  if (!mesajIds.length) return map
  const { data, error } = await sb
    .from('hasta_mesaj_ekleri')
    .select('id, mesaj_id, file_name, file_type, file_size, medical_document_id')
    .in('mesaj_id', mesajIds)
  if (error || !data) return map
  for (const r of data) {
    const mid = String(r.mesaj_id)
    const arr = map.get(mid) || []
    arr.push({
      id: String(r.id),
      fileName: String(r.file_name),
      fileType: String(r.file_type),
      fileSize: Number(r.file_size),
      belgeId: r.medical_document_id ? String(r.medical_document_id) : null,
    })
    map.set(mid, arr)
  }
  return map
}

export async function mesajEkOku(
  sb: SupabaseClient,
  ekId: string,
  doctorId: string,
  patientId?: string
): Promise<{ meta: MesajEkMeta; bytes: Buffer; doctorId: string; patientId: string; mesajId: string } | null> {
  let q = sb
    .from('hasta_mesaj_ekleri')
    .select('id, mesaj_id, doctor_id, patient_id, file_name, file_type, file_size, ciphertext_b64, medical_document_id')
    .eq('id', ekId)
    .eq('doctor_id', doctorId)
  if (patientId) q = q.eq('patient_id', patientId)
  const { data, error } = await q.maybeSingle()
  if (error || !data?.ciphertext_b64) return null
  return {
    meta: {
      id: String(data.id),
      fileName: String(data.file_name),
      fileType: String(data.file_type),
      fileSize: Number(data.file_size),
      belgeId: data.medical_document_id ? String(data.medical_document_id) : null,
    },
    bytes: decryptBytes(Buffer.from(String(data.ciphertext_b64), 'base64')),
    doctorId: String(data.doctor_id),
    patientId: String(data.patient_id),
    mesajId: String(data.mesaj_id),
  }
}

export async function mesajEkBelgeyeKaydet(
  sb: SupabaseClient,
  g: { ekId: string; doctorId: string; uploadedBy: string; category?: string | null }
): Promise<{ belgeId: string }> {
  const ek = await mesajEkOku(sb, g.ekId, g.doctorId)
  if (!ek) throw new Error('Ek bulunamadı')
  if (ek.meta.belgeId) return { belgeId: ek.meta.belgeId }
  const doc = await uploadDocument(
    { supabase: sb },
    {
      doctorId: g.doctorId,
      patientId: ek.patientId,
      fileName: ek.meta.fileName,
      fileType: ek.meta.fileType,
      bytes: ek.bytes,
      uploadedBy: g.uploadedBy,
      category: g.category || 'Diğer',
      notes: 'Sağlığım mesaj eki',
    }
  )
  await sb
    .from('hasta_mesaj_ekleri')
    .update({ medical_document_id: doc.id })
    .eq('id', g.ekId)
    .eq('doctor_id', g.doctorId)
  return { belgeId: doc.id }
}

export { VAULT_MAX_BYTES, VaultValidationError }
