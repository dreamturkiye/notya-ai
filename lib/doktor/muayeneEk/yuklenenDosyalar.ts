/**
 * MUAYENE-EKLERI-07 (Dr. Gökhan Mamur, 2026-10-16) — "Yüklenen dosyalar": every document attached to a visit, listed
 * in the final muayene note with a link that opens the full file next to the report.
 *
 * Two halves in one file:
 *  1) PURE list builder (client-safe): ordering, classification label, display name, print lines. Unit-tested.
 *  2) SERVER access helpers: list + open a visit's files. Used ONLY by the two routes under
 *     app/api/doktor/muayene-ekleri/yuklenenler/** and nothing else.
 *
 * HASTA-IZOLASYON: the only ids that arrive from outside are sessionId and belgeId. Both are resolved against the
 * doctor of the PRACTICE session (doctor, or the doctor's staff) — never a client-supplied doctor id:
 *   seansSahibi(doctor, session)  → the session AND its patient belong to the doctor, else null;
 *   medical_documents row         → doctor_id = doctor, visit_id = session, patient_id = the session's patient,
 *                                    deleted_at null. Any mismatch is "not found" (the route answers 404).
 * No public bucket URL exists: bytes live encrypted in the vault and are decrypted per request by the route.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { downloadDocument, getDocumentMeta } from '@/lib/vault/service'
import type { DocumentMeta } from '@/lib/vault/types'
import { rowToMeta } from '@/lib/vault/validation'
import { EK_TUR_ETIKETI, ekTuruMu, type EkTuru } from './tipler'

// ─── Pure half ────────────────────────────────────────────────────────────────────────────────────────────
export type GorunumTuru = 'gorsel' | 'pdf' | 'diger'

/** Browsers render these inline; anything else (DICOM, Word, CSV, audio…) is offered as download. */
const GORSEL_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function gorunumTuru(mime: string | null | undefined): GorunumTuru {
  const m = String(mime || '').toLowerCase().split(';')[0].trim()
  if (m === 'application/pdf') return 'pdf'
  if (GORSEL_MIME.has(m)) return 'gorsel'
  return 'diger'
}

export interface YuklenenDosya {
  /** medical_documents.id — the only identifier the viewer ever sends back. */
  id: string
  /** Full original file name (NFC). Shown in the title attribute and in print. */
  ad: string
  /** Name shortened for a single visual line (extension kept); equals `ad` when short. */
  gorunenAd: string
  mime: string
  boyut: number
  yuklenmeAt: string
  /** Classification label ("Laboratuvar") or null when nothing meaningful is known. */
  sinif: string | null
  gorunum: GorunumTuru
}

export const GORUNEN_AD_AZAMI = 48

/** Shortens by code points (never splits a Turkish letter / surrogate pair), keeps the tail with the extension. */
export function gorunenAdKisalt(ad: string, azami: number = GORUNEN_AD_AZAMI): string {
  const harfler = Array.from(String(ad || '').normalize('NFC'))
  if (harfler.length <= azami) return harfler.join('')
  const son = Math.min(14, Math.floor(azami / 3))
  const bas = azami - son - 1
  return `${harfler.slice(0, bas).join('')}…${harfler.slice(harfler.length - son).join('')}`
}

/** Label shown next to the name. A bare "diger" carries no information, so it shows nothing. */
export function siniflandirmaEtiketi(tur: EkTuru | null | undefined, kategori?: string | null): string | null {
  if (tur && tur !== 'diger') return EK_TUR_ETIKETI[tur]
  const k = String(kategori || '').trim()
  if (k && k.toLocaleLowerCase('tr-TR') !== 'diğer') return k
  return null
}

export interface YuklenenHam {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  createdAt: string
  category?: string | null
}

/**
 * Builds the list: chronological (upload time, oldest first = the order the doctor added them), ties broken by name
 * with Turkish collation, then id so the order is fully deterministic. Duplicate ids are dropped.
 */
export function yuklenenListesiKur(belgeler: YuklenenHam[], turler: Map<string, EkTuru> | Record<string, EkTuru> = {}): YuklenenDosya[] {
  const tur = (id: string): EkTuru | undefined => (turler instanceof Map ? turler.get(id) : turler[id])
  const goruldu = new Set<string>()
  const liste: YuklenenDosya[] = []
  for (const b of belgeler || []) {
    if (!b || !b.id || goruldu.has(b.id)) continue
    goruldu.add(b.id)
    const ad = String(b.fileName || 'belge').normalize('NFC')
    liste.push({
      id: b.id, ad, gorunenAd: gorunenAdKisalt(ad), mime: b.fileType, boyut: Number(b.fileSize) || 0,
      yuklenmeAt: b.createdAt, sinif: siniflandirmaEtiketi(tur(b.id), b.category), gorunum: gorunumTuru(b.fileType),
    })
  }
  const zaman = (s: string) => { const t = Date.parse(s); return Number.isFinite(t) ? t : 0 }
  return liste.sort((a, b) => zaman(a.yuklenmeAt) - zaman(b.yuklenmeAt) || a.ad.localeCompare(b.ad, 'tr') || a.id.localeCompare(b.id))
}

/** Plain-text lines for print / PDF / HBYS text export: "1. IMG_2034.jpg — Laboratuvar". Full names, no links. */
export function yazdirSatirlari(liste: YuklenenDosya[]): string[] {
  return liste.map((d, i) => `${i + 1}. ${d.ad}${d.sinif ? ` — ${d.sinif}` : ''}`)
}

export const YUKLENEN_DOSYALAR_BASLIGI = 'Yüklenen dosyalar'

export function boyutMetni(bayt: number): string {
  if (!Number.isFinite(bayt) || bayt <= 0) return ''
  if (bayt < 1024) return `${bayt} B`
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`
  return `${(bayt / 1024 / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} MB`
}

// ─── Server half ──────────────────────────────────────────────────────────────────────────────────────────
const AZAMI_DOSYA = 100

/** Classification per document of the visit (muayene_ek_degerlendirmeleri.tur). Missing table → empty (fail soft). */
async function turHaritasi(sb: SupabaseClient, doktorId: string, sessionId: string): Promise<Map<string, EkTuru>> {
  const harita = new Map<string, EkTuru>()
  try {
    const { data, error } = await sb.from('muayene_ek_degerlendirmeleri').select('belge_id, tur').eq('doctor_id', doktorId).eq('session_id', sessionId).limit(AZAMI_DOSYA)
    if (error || !Array.isArray(data)) return harita
    for (const r of data) if (ekTuruMu(r.tur) && r.belge_id) harita.set(String(r.belge_id), r.tur)
  } catch { /* classification is decoration; the list must not depend on it */ }
  return harita
}

/** The visit's files, or null when the session is not the doctor's (route → 404). */
export async function seansYuklenenDosyalari(sb: SupabaseClient, doktorId: string, sessionId: string): Promise<YuklenenDosya[] | null> {
  const seans = await seansSahibi(sb, doktorId, sessionId)
  if (!seans?.patient_id) return null
  const { data, error } = await sb.from('medical_documents').select('*')
    .eq('doctor_id', doktorId).eq('patient_id', seans.patient_id).eq('visit_id', seans.id).is('deleted_at', null)
    .order('created_at', { ascending: true }).limit(AZAMI_DOSYA)
  if (error || !Array.isArray(data)) throw new Error('Yüklenen dosyalar listelenemedi')
  const metalar: DocumentMeta[] = data.map((r) => rowToMeta(r as Record<string, unknown>))
    .filter((m) => m.doctorId === doktorId && m.patientId === seans.patient_id && m.visitId === seans.id)
  const turler = await turHaritasi(sb, doktorId, seans.id)
  return yuklenenListesiKur(metalar.map((m) => ({ id: m.id, fileName: m.fileName, fileType: m.fileType, fileSize: m.fileSize, createdAt: m.createdAt, category: m.category })), turler)
}

/** One file of the visit with its decrypted bytes, or null (route → 404) when any ownership link fails. */
export async function seansDosyasiniAc(sb: SupabaseClient, doktorId: string, sessionId: string, belgeId: string): Promise<{ meta: DocumentMeta; bytes: Buffer } | null> {
  const seans = await seansSahibi(sb, doktorId, sessionId)
  if (!seans?.patient_id) return null
  let meta: DocumentMeta
  try { meta = await getDocumentMeta({ supabase: sb }, doktorId, belgeId) } catch { return null }
  if (meta.doctorId !== doktorId || meta.visitId !== seans.id || meta.patientId !== seans.patient_id) return null
  try { return await downloadDocument({ supabase: sb }, doktorId, meta.id) } catch { return null }
}
