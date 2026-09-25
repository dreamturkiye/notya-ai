/**
 * NOTYA-GELEN-BELGELER — shared types and constants (client-safe: no Supabase, no Node APIs).
 * Plan: docs/OPEN-COMMITMENTS.md § NOTYA-GELEN-BELGELER. Entry point for capture: lib/gelenBelgeler/README.md.
 */

/** Where an item came from. Phase 1 = the first five (web app); eposta / whatsapp are phases 2 and 3. */
export const KAYNAKLAR = ['surukle', 'yapistir', 'yukleme', 'kamera', 'ses_kaydi', 'eposta', 'whatsapp'] as const
export type GelenKaynak = (typeof KAYNAKLAR)[number]
export const kaynakMi = (v: unknown): v is GelenKaynak => typeof v === 'string' && (KAYNAKLAR as readonly string[]).includes(v)

/** Plain Turkish, shown quietly under the item. */
export const KAYNAK_ETIKETI: Record<GelenKaynak, string> = {
  surukle: 'Sürükleyip bıraktınız',
  yapistir: 'Yapıştırdınız',
  yukleme: 'Siz eklediniz',
  kamera: 'Fotoğraf çektiniz',
  ses_kaydi: 'Sesli not',
  eposta: 'E-posta ile geldi',
  whatsapp: 'WhatsApp ile geldi',
}

export const DURUMLAR = ['yeni', 'dosyalandi', 'silindi'] as const
export type GelenDurum = (typeof DURUMLAR)[number]

/** How the server handles a file. */
export type Bicim = 'pdf' | 'gorsel' | 'heic' | 'ses' | 'word' | 'excel' | 'metin'

/** Same ceiling as the vault (lib/vault/types.ts VAULT_MAX_BYTES) — a filed item must fit the patient file. */
export const EN_BUYUK_BAYT = 4 * 1024 * 1024

/** Unfiled items are removed after this many days (daily kvkk-imha cron). */
export const SAKLAMA_GUN = 30

/** Signed URLs for thumbnails / audio live this long. */
export const IMZALI_URL_SN = 10 * 60

/** Private bucket; objects live under `<doctor id>/gelen/…`. */
export const KOVA = 'hasta-belgeler'

export type Kesinlik = 'eminim' | 'kontrol'
export const KESINLIK_ETIKETI: Record<Kesinlik, string> = { eminim: 'Eminim', kontrol: 'Kontrol edin' }

/** A suggested patient as stored on the row (ids of the doctor's own patients only; names are resolved per request). */
export type KayitliOneri = { patient_id: string; guven: number; kesinlik: Kesinlik; nedenler: string[] }

/** What the reader got out of the document. Stored encrypted (okuma_sifreli). */
export type Okuma = {
  ozet: string
  belgeTuru: string
  /** Transcript of a voice note or the text of a text / Word / Excel document (shortened). */
  metin: string | null
  kimlik: { ad: string | null; dogum: string | null; tc: string | null; tcSon: string | null }
  belgeTarihi: string | null
  konsultasyonYaniti: boolean
  okundu: boolean
}

/** Sender details a channel provides (email / WhatsApp); the web app has none. */
export type Gonderen = { telefon?: string | null; eposta?: string | null; ad?: string | null }

/** One inbox item as the API returns it. */
export type GelenOge = {
  id: string
  kaynak: GelenKaynak
  durum: GelenDurum
  dosyaAdi: string
  bicim: Bicim
  mime: string
  boyut: number
  tarih: string
  belgeTuru: string
  ozet: string
  metin: string | null
  okundu: boolean
  oneriler: { patientId: string; ad: string; dogum: string | null; guven: number; kesinlik: Kesinlik }[]
  url: string | null
  gonderen: string | null
}
