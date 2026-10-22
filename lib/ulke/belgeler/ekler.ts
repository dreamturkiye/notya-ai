/**
 * NOTYA-ULKE-EKLER-01 — the "add documents" step of a country's visit flow: PURE, client-safe parts.
 *
 * The standard workflow (.cursor/skills/belge-otomatik-akis/SKILL.md), country edition. After the recording is
 * transcribed and before the note is written, the doctor adds any number of documents (scans, photos, pages of a
 * PDF). Each image is masked ON THE DEVICE (core/belgeler/deid.ts — the outbound copy only; the doctor keeps seeing
 * the original), read by the model in the note's language, and ALL results go into the FIRST note in one write
 * (core/belgeler/notaBlok.ts → notaBloklariUygula): "Ultrasound 1/4 … 4/4", idempotent per document id, no
 * per-document approval. A document that cannot be masked is skipped and never sent.
 *
 * Nothing here stores a document: the original stays in the doctor's browser; what reaches the server is the masked
 * copy (for one evaluation, not kept) and, later, the evaluation text that goes into the note.
 *
 * Types of document are DATA (EK_TURLERI). Labels are per note language. No engine, model or runtime is named
 * anywhere a doctor can see.
 */
import type { BlokDili, BlokGirdi } from '@/core/belgeler/notaBlok'
import { icdKoru } from '@/core/belgeler/notaBlok'

export const EK_TURLERI = ['ultrasound', 'xray', 'ct_mri', 'ecg', 'lab', 'photo', 'other'] as const
export type EkTuru = (typeof EK_TURLERI)[number]
/** What the doctor may choose for a file: let the reader decide, or name the type. */
export type EkTuruSecimi = 'auto' | EkTuru
export const EK_TURU_SECIMLERI: readonly EkTuruSecimi[] = ['auto', ...EK_TURLERI]

/** At most this many documents (images, or PDF pages) in one step / one request. */
export const EK_AZAMI_ADET = 12
/** A PDF is read on the device page by page; at most this many pages of one file. */
export const EK_PDF_AZAMI_SAYFA = 3
/** The masked image as base64 (≤ 1568 px JPEG is ~0.3–0.8 MB); anything near the platform's body limit is refused. */
export const EK_GORSEL_AZAMI_B64 = 3_200_000
/** The picture file the doctor may add, before it is made smaller on the device. */
export const EK_DOSYA_AZAMI = 25 * 1024 * 1024

export const EK_GORSEL_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const
export type EkGorselMime = (typeof EK_GORSEL_MIME)[number]
/** What the file picker offers: pictures (HEIC where the browser can decode it) and PDF. */
export const EK_KABUL = 'image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.pdf'

export type EkDosyaTuru = 'gorsel' | 'pdf' | null
/** Image / PDF / not accepted — by the file's own declared type, falling back to its extension. */
export function ekDosyaTuru(ad: string, mime: string): EkDosyaTuru {
  const m = (mime || '').toLowerCase()
  const uzanti = (ad.split('.').pop() || '').toLowerCase()
  if (m === 'application/pdf' || (!m && uzanti === 'pdf')) return 'pdf'
  if (/^image\/(jpeg|png|webp|heic|heif)$/.test(m)) return 'gorsel'
  if (!m && /^(jpe?g|png|webp|heic|heif)$/.test(uzanti)) return 'gorsel'
  return null
}

// ─── language ────────────────────────────────────────────────────────────────────

/** The language the document block and its heading are written in: the note's language. */
export function blokDili(dil: string): BlokDili {
  if (dil === 'ru') return 'ru'
  if (dil === 'uz-Latn') return 'uz'
  if (dil === 'uz-Cyrl') return 'uzk'
  return 'en'
}

const TUR_ETIKETI: Record<Exclude<BlokDili, 'tr'>, Record<EkTuru, string>> = {
  en: { ultrasound: 'Ultrasound', xray: 'X-ray', ct_mri: 'CT / MRI', ecg: 'ECG', lab: 'Lab report', photo: 'Photo', other: 'Document' },
  ru: { ultrasound: 'УЗИ', xray: 'Рентген', ct_mri: 'КТ / МРТ', ecg: 'ЭКГ', lab: 'Лабораторный анализ', photo: 'Фото', other: 'Документ' },
  uz: { ultrasound: 'Ultratovush', xray: 'Rentgen', ct_mri: 'KT / MRT', ecg: 'EKG', lab: 'Laboratoriya tahlili', photo: 'Fotosurat', other: 'Hujjat' },
  uzk: { ultrasound: 'Ультратовуш', xray: 'Рентген', ct_mri: 'КТ / МРТ', ecg: 'ЭКГ', lab: 'Лаборатория таҳлили', photo: 'Фотосурат', other: 'Ҳужжат' },
}
export const ekTuruEtiketi = (dil: BlokDili, tur: EkTuru): string => TUR_ETIKETI[dil === 'tr' ? 'en' : dil][tur]

// ─── the reader's answer ─────────────────────────────────────────────────────────

export type EkKalite = 'iyi' | 'orta' | 'dusuk'
/** What one evaluated document carries. Observations only: never a diagnosis, never an identity. */
export type EkSonucu = {
  tur: EkTuru
  kalite: EkKalite
  /** ISO date or date-time printed on the document, when readable and plausible; else null. */
  sinavZamani: string | null
  ozet: string
  bulgular: string[]
  acil: boolean
}

const OZET_AZAMI = 1_500
const BULGU_AZAMI = 400
const BULGU_ADEDI = 24

const metin = (ham: unknown, azami: number): string => (typeof ham === 'string' ? ham.replace(/\u0000/g, '').trim().slice(0, azami) : '')

/** A date the document printed: accepted only when it parses and is plausible (1990 … a day from now). */
export function sinavZamaniniSuz(ham: unknown, simdi: number = Date.now()): string | null {
  if (typeof ham !== 'string') return null
  const t = ham.trim().slice(0, 40)
  if (!/^\d{4}-\d{2}-\d{2}([T ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(t)) return null
  const ms = Date.parse(t.replace(' ', 'T'))
  if (Number.isNaN(ms) || ms < Date.parse('1990-01-01') || ms > simdi + 86_400_000) return null
  return t
}

export function turuOku(ham: unknown): EkTuru {
  return (EK_TURLERI as readonly string[]).includes(ham as string) ? (ham as EkTuru) : 'other'
}

/** The date shown in a block heading, in the note's own form: '21/10/2026' (en-GB), '10/21/2026' (en-US), '21.10.2026' (ru). */
export function tarihGoster(dil: string, iso: string | null, simdi: Date = new Date()): string {
  // The exam date is a calendar date as written on the document: read its parts and format them in UTC, so the
  // server's own time zone can never move it by a day.
  const p = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null
  const d = p ? new Date(Date.UTC(Number(p[1]), Number(p[2]) - 1, Number(p[3]))) : simdi
  const yerel = dil === 'uz-Cyrl' ? 'uz-Cyrl-UZ' : dil === 'uz-Latn' ? 'uz-Latn-UZ' : dil
  try { return d.toLocaleDateString(yerel, { day: '2-digit', month: '2-digit', year: 'numeric', ...(p ? { timeZone: 'UTC' } : {}) }) } catch { return d.toISOString().slice(0, 10) }
}

// ─── what the browser sends with the first note / a later upload ─────────────────

/** One evaluated document as the browser reports it. The server re-validates every field (ekGirdileriniOku). */
export type EkGonderimi = {
  belgeId: string
  tur: EkTuru
  sinavZamani: string | null
  ozet: string
  bulgular: string[]
  acil: boolean
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The documents of a request, as note-block inputs — or [] when there are none. Pure and total: anything that is not
 * a well-formed entry is dropped, text is cut to length, the label and the heading date are made HERE (never taken
 * from the request), and the order is the order of the request. `dil` = the note's language code.
 */
export function ekGirdileriniOku(ham: unknown, dil: string, simdi: Date = new Date()): BlokGirdi[] {
  if (!Array.isArray(ham)) return []
  const bd = blokDili(dil)
  const gorulen = new Set<string>()
  const cikti: BlokGirdi[] = []
  for (const x of ham.slice(0, EK_AZAMI_ADET)) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) continue
    const o = x as Record<string, unknown>
    const belgeId = typeof o.belgeId === 'string' ? o.belgeId.toLowerCase() : ''
    if (!UUID.test(belgeId) || gorulen.has(belgeId)) continue
    const ozet = icdKoru(metin(o.ozet, OZET_AZAMI))
    const bulgular = (Array.isArray(o.bulgular) ? o.bulgular : []).slice(0, BULGU_ADEDI).map((b) => icdKoru(metin(b, BULGU_AZAMI))).filter(Boolean)
    if (!ozet && !bulgular.length) continue // nothing was read: there is nothing to put into the note
    const sinav = sinavZamaniniSuz(o.sinavZamani, simdi.getTime())
    gorulen.add(belgeId)
    cikti.push({
      belgeId,
      etiket: ekTuruEtiketi(bd, turuOku(o.tur)),
      tarih: tarihGoster(dil, sinav, simdi),
      sinavZamani: sinav,
      yuklemeSirasi: cikti.length,
      ozet: ozet || null,
      bulgular,
      acil: o.acil === true,
    })
  }
  return cikti
}

/** The client side of the same shape: a reader's answer → what is sent. */
export function ekGonderimi(belgeId: string, s: EkSonucu): EkGonderimi {
  return { belgeId, tur: s.tur, sinavZamani: s.sinavZamani, ozet: s.ozet, bulgular: s.bulgular, acil: s.acil }
}

/** A request's list of documents with the entries the browser may send: only evaluated ones with something to say. */
export function gonderilebilir(s: EkSonucu | undefined): s is EkSonucu {
  return Boolean(s) && s!.kalite !== 'dusuk' && Boolean(s!.ozet || s!.bulgular.length)
}

export { metin as ekMetniSuz, OZET_AZAMI as EK_OZET_AZAMI, BULGU_AZAMI as EK_BULGU_AZAMI, BULGU_ADEDI as EK_BULGU_ADEDI }
