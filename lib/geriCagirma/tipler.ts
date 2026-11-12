/**
 * GERI-CAGIRMA-01 (Kaan, 2026-11-12) — shared types and the constants every rule of the recall engine rests on.
 * Pure and client-safe. The same file in every build (Türkiye and the six country builds).
 *
 * CORE vs BRANŞ: the engine, the list, sending, attribution and the counter are CORE (all 40 branches, all six
 * countries). A recall REASON belongs to one branş and is only ever produced for a doctor of that branş
 * (lib/geriCagirma/nedenler.ts, tested both ways). The one universal reason is the doctor's own follow-up date.
 */

/**
 * THE ATTRIBUTION WINDOW. A recall can be credited with an appointment only when the appointment was made within
 * this many days AFTER the recall left. One constant; the tooltip on the home card and on the recall screen states
 * it; lib/geriCagirma/atif.ts is the only reader.
 */
export const ATIF_PENCERESI_GUN = 30

/** A payment is credited to an attributed visit when it was recorded from the visit day up to this many days later. */
export const TAHSILAT_PENCERESI_GUN = 30

/** Default cool-down: the same patient is not offered again for the same reason within this many days. */
export const VARSAYILAN_BEKLEME_GUN = 30
export const BEKLEME_GUN_ALT = 7
export const BEKLEME_GUN_UST = 365

/** The universal reason: the doctor's own recorded follow-up ("kontrol") date has passed. All 40 branches. */
export const KONTROL_NEDENI = 'kontrol'
export const KONTROL_KAYNAGI = 'takip'

/** Months shown in the home card's trend (this month included). */
export const EGILIM_AY_SAYISI = 6

export type GeriCagirmaKanali = 'whatsapp' | 'sms' | 'eposta'
/** 'elle' = no message left the product: the practice phoned the patient and marked it. */
export type KayitKanali = GeriCagirmaKanali | 'elle'

export type NedenSatiri = {
  /** `${brans}:${flag}` for a branş reason, KONTROL_NEDENI for the universal one. Never free clinical text. */
  anahtar: string
  /** What the DOCTOR reads in the list. Never sent to a patient. */
  etiket: string
  /** Which existing tool computed it (e.g. 'uro-kohort', 'takip'). */
  kaynak: string
  /** Due date when the source has one, else null — the engine never invents an interval. */
  vade: string | null
  gunGecikme: number | null
}

export type IzinDurumu = 'hazir' | 'gonderici_yok' | 'izin_yok'

export type GeriCagirmaAdayi = {
  patientId: string
  ad: string
  veliDili: boolean
  nedenler: NedenSatiri[]
  /** Earliest due date among the reasons (null when no reason carries one). */
  vade: string | null
  gunGecikme: number | null
  sonVizit: string | null
  /** The channel a one-tap recall would use, or null: listed, never messaged ("izin yok — arayın"). */
  kanal: GeriCagirmaKanali | null
  izin: IzinDurumu
  /** Last recall of this patient for any reason (ISO), or null. */
  sonCagri: string | null
  /** true = a personal booking link can be put in the message (portal booking is on and the patient has a portal login). */
  baglanti: boolean
}

export type GeriCagirmaListesi = {
  /** false = migration 196 is not applied yet: the feature reads as off. */
  kurulu: boolean
  adaylar: GeriCagirmaAdayi[]
  /** Patients left out and why (counts only). */
  disarida: { randevusuVar: number; beklemede: number; pasif: number }
  beklemeGun: number
  uretildi: string
}

export type AylikSayac = {
  /** YYYY-MM */
  ay: string
  gonderilen: number
  randevuAlan: number
  gelen: number
  tahsilatKurus: number
}

export type GeriCagirmaOzeti = {
  kurulu: boolean
  /** The card renders only when this is true: at least one patient can be recalled now, or one recall was ever sent. */
  goster: boolean
  cagrilabilir: number
  /** true = the stored "can be recalled now" number is old or missing; the card may ask for a background refresh. */
  bayat: boolean
  buAy: AylikSayac
  /** Oldest first, EGILIM_AY_SAYISI entries, months without a row are zeros. */
  egilim: AylikSayac[]
  paraBirimi: string
}

export const bosSayac = (ay: string): AylikSayac => ({ ay, gonderilen: 0, randevuAlan: 0, gelen: 0, tahsilatKurus: 0 })

/** YYYY-MM of an instant in a time zone. */
export function ayAnahtari(an: Date | number | string, saatDilimi: string): string {
  const d = new Date(an)
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: saatDilimi, year: 'numeric', month: '2-digit' }).formatToParts(d)
  return `${p.find((x) => x.type === 'year')?.value}-${p.find((x) => x.type === 'month')?.value}`
}

/** YYYY-MM-DD of an instant in a time zone. */
export function gunAnahtari(an: Date | number | string, saatDilimi: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: saatDilimi, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(an))
}

/** The last `n` month keys ending at `sonAy` (YYYY-MM), oldest first. */
export function sonAylar(sonAy: string, n: number): string[] {
  const [y, m] = sonAy.split('-').map(Number)
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1))
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

export function gunFarki(erkenIso: string, gecIso: string): number {
  return Math.round((Date.parse(`${gecIso.slice(0, 10)}T12:00:00Z`) - Date.parse(`${erkenIso.slice(0, 10)}T12:00:00Z`)) / 86_400_000)
}

export function beklemeGunTemizle(ham: unknown): number {
  const n = Math.round(Number(ham))
  if (!Number.isFinite(n)) return VARSAYILAN_BEKLEME_GUN
  return Math.min(BEKLEME_GUN_UST, Math.max(BEKLEME_GUN_ALT, n))
}
