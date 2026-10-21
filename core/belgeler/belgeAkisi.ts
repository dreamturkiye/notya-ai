/**
 * NOTYA-BELGE-OTO-01 — THE standard document workflow, as data. One shared implementation (otoBatch.ts, notaBlok.ts,
 * the Ekler step, the Belgeler vault upload); specialties differ only through this config and core/belgeler/router.ts
 * (modality list / persona). A branch cannot opt out (the flag is typed as the literal `true`).
 *
 *   post-dictation "belgeleri ekle" -> auto mask (outbound copy only) -> auto evaluate -> auto insert; no per-document approval.
 */
import type { Modalite } from './ontoloji'
import { bransAnahtari, bransKurali, type BransKurali } from './router'
import type { NotaBolumu } from './notaBlok'

export interface BelgeAkisi {
  /** Always true — kept as a field so tests can prove nobody turned it off. */
  readonly otomatik: true
  readonly belgeBasinaOnay: false
  /** Note section that receives the blocks ("Fizik Muayene / Bulgular" = objektif). */
  readonly bolum: NotaBolumu
  readonly bransAnahtari: string
  readonly kural: BransKurali
}

/** Per-modality section target. Everything lands in Fizik Muayene / Bulgular today; the table is the extension point. */
export const MODALITE_BOLUMU: Partial<Record<Modalite | 'lab', NotaBolumu>> = {}
/** Per-branch overrides (data only), e.g. { kadin_dogum: { nst: 'objektif' } }. */
export const BRANS_BOLUM_ISTISNASI: Record<string, Partial<Record<Modalite | 'lab', NotaBolumu>>> = {}

export function belgeBolumu(bransKey: string, modalite: Modalite | 'lab'): NotaBolumu {
  return BRANS_BOLUM_ISTISNASI[bransKey]?.[modalite] ?? MODALITE_BOLUMU[modalite] ?? 'objektif'
}

/** Accepts a router key, a lib/doktor/specialties slug or a free-text specialty; never throws, never opts out. */
export function belgeAkisi(specialty: string | null | undefined): BelgeAkisi {
  const key = bransAnahtari(specialty)
  return { otomatik: true, belgeBasinaOnay: false, bolum: belgeBolumu(key, 'us'), bransAnahtari: key, kural: bransKurali(key) }
}

/** Default image modality when the doctor did not classify the upload (imaging first, ultrasound preferred). */
const ONCELIK: Modalite[] = ['us', 'eko', 'cxr', 'xr_kemik', 'xr_batin', 'ct', 'mr', 'mamografi', 'derm', 'dermatoskopi', 'yara', 'fundus', 'otoskopi']
export function varsayilanGoruntuModalitesi(bransKey: string): Modalite {
  const l = bransKurali(bransKey).modaliteler
  return ONCELIK.find((m) => l.includes(m)) ?? l.find((m) => m !== 'pdf_rapor') ?? 'serbest'
}
