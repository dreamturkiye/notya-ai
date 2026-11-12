/**
 * WHATSAPP-ONBURO-01 — "Ayşe ön büro (WhatsApp)": the per-doctor settings and the "Muayenehane bilgileri" sheet.
 * Pure, client-safe (the settings card and the server share it).
 *
 * Defaults are OFF: `randevuModu: 'kapali'` and `yanitAcik: false` change nothing for an existing doctor. The sheet is
 * practice information the DOCTOR writes (address, hours, fees …). It carries no patient data and is the ONLY content an
 * automatic answer may be built from.
 */
import type { BilgiAlani } from './dil/tipler'

export const TABLO_AYAR = 'whatsapp_on_buro_ayarlari'

/** kapali: nothing new · onay: the patient's pick becomes a request the desk approves · otomatik: booked at once. */
export type RandevuModu = 'kapali' | 'onay' | 'otomatik'
export const RANDEVU_MODLARI: readonly RandevuModu[] = ['kapali', 'onay', 'otomatik']

export interface SssSatiri { soru: string; yanit: string }

export interface MuayenehaneBilgisi {
  adres: string
  harita: string
  /** Empty = derived from the working plan of the appointment settings. */
  calismaSaatleri: string
  otopark: string
  ulasim: string
  /** Only what the doctor chooses to enter; empty = fee questions are never answered automatically. */
  ucretler: string
  odeme: string
  sigorta: string
  getirilecekler: string
  iptalPolitikasi: string
  telefon: string
  hazirlik: { ilk_muayene: string; muayene: string; kontrol: string }
  sss: SssSatiri[]
}

export interface OnBuroAyari {
  randevuModu: RandevuModu
  yanitAcik: boolean
  bilgi: MuayenehaneBilgisi
}

export const ALAN_SINIRI = 600
export const SSS_SINIRI = 12
export const SSS_SORU_SINIRI = 160

export const BOS_BILGI: MuayenehaneBilgisi = {
  adres: '', harita: '', calismaSaatleri: '', otopark: '', ulasim: '', ucretler: '', odeme: '', sigorta: '', getirilecekler: '',
  iptalPolitikasi: '', telefon: '', hazirlik: { ilk_muayene: '', muayene: '', kontrol: '' }, sss: [],
}

export const VARSAYILAN_ON_BURO: OnBuroAyari = { randevuModu: 'kapali', yanitAcik: false, bilgi: BOS_BILGI }

const DUZ_ALANLAR = ['adres', 'harita', 'calismaSaatleri', 'otopark', 'ulasim', 'ucretler', 'odeme', 'sigorta', 'getirilecekler', 'iptalPolitikasi', 'telefon'] as const

const metin = (x: unknown, sinir = ALAN_SINIRI): string => (typeof x === 'string' ? x.replace(/\s+\n/g, '\n').trim().slice(0, sinir) : '')

export function bilgiNormalize(x: unknown): MuayenehaneBilgisi {
  const r = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
  const h = (r.hazirlik && typeof r.hazirlik === 'object' ? r.hazirlik : {}) as Record<string, unknown>
  const b = { ...BOS_BILGI, hazirlik: { ilk_muayene: metin(h.ilk_muayene), muayene: metin(h.muayene), kontrol: metin(h.kontrol) }, sss: [] as SssSatiri[] }
  for (const a of DUZ_ALANLAR) b[a] = metin(r[a])
  // A map link is a link or nothing: the answer must never carry free text in the place of a URL.
  if (b.harita && !/^https:\/\/[^\s]+$/i.test(b.harita)) b.harita = ''
  if (Array.isArray(r.sss)) {
    for (const s of r.sss.slice(0, SSS_SINIRI * 2)) {
      const soru = metin((s as { soru?: unknown })?.soru, SSS_SORU_SINIRI)
      const yanit = metin((s as { yanit?: unknown })?.yanit)
      if (soru && yanit && b.sss.length < SSS_SINIRI) b.sss.push({ soru, yanit })
    }
  }
  return b
}

/** Normalises a DB row (snake_case) or a request body (camelCase). Anything unexpected → the OFF default. */
export function onBuroNormalize(x: unknown): OnBuroAyari {
  const r = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
  const mod = r.randevuModu !== undefined ? r.randevuModu : r.randevu_modu
  const yanit = r.yanitAcik !== undefined ? r.yanitAcik : r.yanit_acik
  return {
    randevuModu: (RANDEVU_MODLARI as readonly unknown[]).includes(mod) ? (mod as RandevuModu) : 'kapali',
    yanitAcik: yanit === true,
    bilgi: bilgiNormalize(r.bilgi),
  }
}

export function onBuroSatiri(doktorId: string, a: OnBuroAyari): Record<string, unknown> {
  return { doctor_id: doktorId, randevu_modu: a.randevuModu, yanit_acik: a.yanitAcik, bilgi: a.bilgi, updated_at: new Date().toISOString() }
}

/** Is anything of the front desk switched on for this doctor? */
export const onBuroAcikMi = (a: OnBuroAyari): boolean => a.randevuModu !== 'kapali' || a.yanitAcik

export type BilgiAnahtari = BilgiAlani | `sss.${number}`

/** The sheet as a flat key → text map: only the fields that have content. This is everything an answer may cite. */
export function bilgiDuzle(b: MuayenehaneBilgisi, turetilmisSaatler = ''): Map<BilgiAnahtari, string> {
  const m = new Map<BilgiAnahtari, string>()
  for (const a of DUZ_ALANLAR) {
    const v = a === 'calismaSaatleri' ? b.calismaSaatleri || turetilmisSaatler : b[a]
    if (v) m.set(a, v)
  }
  if (b.hazirlik.ilk_muayene) m.set('hazirlik.ilk_muayene', b.hazirlik.ilk_muayene)
  if (b.hazirlik.muayene) m.set('hazirlik.muayene', b.hazirlik.muayene)
  if (b.hazirlik.kontrol) m.set('hazirlik.kontrol', b.hazirlik.kontrol)
  b.sss.forEach((s, i) => m.set(`sss.${i}`, s.yanit))
  return m
}
