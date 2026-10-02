/**
 * NOTYA-KORPUS-KALAN-01 (Y-023, Dr. Gökhan's 100-set #23) — "bu hastanın annesinin boyu kaç".
 *
 * The mother's / father's height is a Hasta Bilgi Formu field, not a measurement of the patient. Since
 * NOTYA-AYSE-GERI-05 the single-value matcher of the record tables saw only "boy … kaç" and answered with the
 * CHILD's height ("son boy 110 cm"). This module recognises whose height is asked and answers from the form: the
 * intake events of the chart index (lib/doktor/dosyaOlaylari.ts `anne-boy` / `baba-boy`), the doctor-scoped read the
 * other record answers use. No model, nothing derived (no target height). The sentence is said only when the doctor
 * asks; a chart whose form does not hold the field says so and never falls back to the patient's own height.
 *
 * Kept out of lib/asistan/kayitTablosu.ts on purpose: that module's single-measurement route is being reworked
 * separately, and a parent's height is not one of its measurements.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import type { DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'

export type Ebeveyn = 'anne' | 'baba'

/**
 * Whose height: [] = not this question. The parent is named right before the height, in the genitive ("annesinin
 * boyu") or as the compound ("anne boyu", "anne ve babasının boyları"); "annesi boyunu sordu" has the mother as its
 * subject and is the patient's height.
 */
export function ebeveynBoyuSorusu(mesaj: string | null | undefined): Ebeveyn[] {
  const k = trAramaNormalize(mesaj).replace(/[?!.,;:'’]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ')
  const boy = k.findIndex((x) => /^boy(u|unu|un|lari|larini)?$/.test(x))
  if (boy < 0) return []
  const once = k.slice(Math.max(0, boy - 3), boy)
  const var_ = (re: RegExp) => once.some((x) => re.test(x))
  return [
    ...(var_(/^(anne|annesinin|annenin|annemin)$/) ? ['anne' as const] : []),
    ...(var_(/^(baba|babasinin|babanin|babamin)$/) ? ['baba' as const] : []),
  ]
}

const AD: Record<Ebeveyn, { olay: string; ad: string }> = { anne: { olay: 'anne-boy', ad: 'anne boyu' }, baba: { olay: 'baba-boy', ad: 'baba boyu' } }
const birlestir = (l: string[]) => (l.length <= 1 ? l.join('') : `${l.slice(0, -1).join(', ')} ve ${l[l.length - 1]}`)
const sayi = (d: number) => d.toLocaleString('tr-TR', { maximumFractionDigits: 1 })

/** Screen and spoken answer (the same sentence). */
export function ebeveynBoyCevabi(kimler: Ebeveyn[], olaylar: DosyaOlayi[], hastaAdi: string): { ekran: string; konusma: string } {
  const ad = String(hastaAdi || '').trim() || 'Hasta'
  const deger = (k: Ebeveyn) => olaylar.find((o) => o.kaynak === 'intake' && o.tur === AD[k].olay && o.deger != null)?.deger ?? null
  const olan = kimler.filter((k) => deger(k) != null), olmayan = kimler.filter((k) => deger(k) == null)
  const parcalar: string[] = []
  if (olan.length) parcalar.push(`${ad} — ${birlestir(olan.map((k) => `${AD[k].ad} ${sayi(deger(k)!)} cm`))} (Hasta Bilgi Formu).`)
  if (olmayan.length) {
    const eksik = `${birlestir(olmayan.map((k) => AD[k].ad))} Hasta Bilgi Formu’nda kayıtlı değil`
    parcalar.push(olan.length ? `${eksik[0].toLocaleUpperCase('tr-TR')}${eksik.slice(1)}.` : `${ad} — ${eksik} Hocam.`)
  }
  const cumle = parcalar.join(' ')
  return { ekran: cumle, konusma: cumle }
}
