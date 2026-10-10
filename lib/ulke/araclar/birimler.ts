/**
 * NOTYA-ULKE-ARACLAR-01 — UNITS a tool's numbers are entered in. The country chooses; the kit converts to the unit
 * its arithmetic is written in, with the exact defined factors, and never the other way round on the screen: a
 * doctor reads back the number they typed.
 *
 * Length and weight follow the pack's `uygulama.birimler` (cm or in, kg or lb). A laboratory quantity follows the
 * pack's `araclar.labBirimleri`: a pack that switches on a tool reading that quantity must state its unit.
 *
 * NOTYA-ULKE-OZEL-01 — MORE THAN ONE UNIT, AND A COUNTRY'S OWN QUANTITIES.
 *   - A pack may ACCEPT SEVERAL UNITS for one quantity (`labBirimleri: { hemoglobin: ['g/L', 'g/dL'] }`). Then nothing
 *     is chosen for the doctor: the unit is picked beside the field and travels with the form under the field's key
 *     plus `.birim` (`birimAnahtari`). A NUMBER WITHOUT ITS UNIT IS NOT A VALUE — the tool gives no result.
 *   - A conversion is a factor, or a factor and a shift (`BirimDonusumu`): two scales of one measurement need not
 *     share their zero.
 *   - A tool only one country has may read a quantity only that country defines (`UlkeAraclari.olculer`). The kit's
 *     own table below is unchanged by it and is never overridden: a pack's quantity carries the country's code.
 */
import type { SayiKurali } from '../arayuz/sayiOkuma'
import type { Birimler } from '../tipler'
import type { AracAlani, BirimDonusumu, LabOlcusu, OlcuTanimi } from './tipler'

/** 1 inch = 2.54 cm and 1 lb = 0.45359237 kg (exact, international yard and pound agreement of 1959). */
export const INC_CM = 2.54
export const LB_KG = 0.45359237

/**
 * Laboratory quantity → the unit the kit's arithmetic uses (factor 1) and the other units a country may report in,
 * each with the factor that turns it into the canonical one. Factors are the molar-mass conversions in general use:
 * creatinine 88.4 µmol/L per mg/dL; glucose 18.016 mg/dL per mmol/L; cholesterol 38.67 mg/dL per mmol/L;
 * haemoglobin 10 g/L per g/dL; albumin-to-creatinine ratio 0.113 mg/mmol per mg/g.
 */
export const LAB_BIRIMLERI: Readonly<Record<LabOlcusu, { kanonik: string; birimler: Readonly<Record<string, number>> }>> = {
  kreatinin: { kanonik: 'mg/dL', birimler: { 'mg/dL': 1, 'umol/L': 1 / 88.4 } },
  hemoglobin: { kanonik: 'g/dL', birimler: { 'g/dL': 1, 'g/L': 0.1 } },
  glukoz: { kanonik: 'mg/dL', birimler: { 'mg/dL': 1, 'mmol/L': 18.016 } },
  kolesterol: { kanonik: 'mg/dL', birimler: { 'mg/dL': 1, 'mmol/L': 38.67 } },
  albuminKreatinin: { kanonik: 'mg/g', birimler: { 'mg/g': 1, 'mg/mmol': 1 / 0.113 } },
}

/**
 * What a tool needs to know about the country to read what was typed: its units, the unit of each laboratory value,
 * and HOW IT WRITES A NUMBER (`sayi`: the pack's decimal and thousands marks — NOTYA-ULKE-DENETIM-01a). All three are
 * the pack's; none has a default, so a typed "1,500" is never read by another country's rules.
 * `olculer` = the quantities the pack's own tools read (NOTYA-ULKE-OZEL-01); absent in a pack that has none.
 */
export type BirimOrtami = {
  birimler: Birimler
  lab: Readonly<Record<string, string | readonly string[] | undefined>>
  sayi: SayiKurali
  olculer?: Readonly<Record<string, OlcuTanimi | undefined>>
}

const sahip = (o: object, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k)

/** A quantity by its key: the kit's, or — only where the kit has none of that key — the pack's own. null = unknown. */
export function olcuTanimi(anahtar: string | undefined, olculer?: Readonly<Record<string, OlcuTanimi | undefined>>): OlcuTanimi | null {
  if (typeof anahtar !== 'string') return null
  if (sahip(LAB_BIRIMLERI, anahtar)) return LAB_BIRIMLERI[anahtar as LabOlcusu]
  return olculer && sahip(olculer, anahtar) ? olculer[anahtar] ?? null : null
}

/** A value in `birim` → the canonical value of its quantity. null = the unit is not one of the quantity's. */
export function birimdenKanonige(t: OlcuTanimi | null, birim: string | null | undefined, deger: number): number | null {
  if (!t || typeof birim !== 'string' || !sahip(t.birimler, birim)) return null
  const d: BirimDonusumu = t.birimler[birim]
  const sonuc = typeof d === 'number' ? deger * d : deger * d.carpan + d.kaydirma
  return Number.isFinite(sonuc) ? sonuc : null
}

/** A canonical value → the value in `birim`. null = the unit is not one of the quantity's. */
export function kanoniktenBirime(t: OlcuTanimi | null, birim: string | null | undefined, kanonik: number): number | null {
  if (!t || typeof birim !== 'string' || !sahip(t.birimler, birim)) return null
  const d: BirimDonusumu = t.birimler[birim]
  const carpan = typeof d === 'number' ? d : d.carpan
  if (!carpan) return null
  const sonuc = (kanonik - (typeof d === 'number' ? 0 : d.kaydirma)) / carpan
  return Number.isFinite(sonuc) ? sonuc : null
}

/** The key the chosen unit of a field travels under in a form: never a field's own key (those hold no dot). */
export const BIRIM_EKI = '.birim'
export const birimAnahtari = (alanAnahtari: string): string => `${alanAnahtari}${BIRIM_EKI}`

/** The units a LABORATORY field may be typed in here, in the pack's order. One = fixed; several = the doctor chooses. */
export function alanBirimleri(a: AracAlani, o: BirimOrtami): readonly string[] {
  if (!a.lab) return []
  const b = o.lab[a.lab]
  if (typeof b === 'string') return b ? [b] : []
  return Array.isArray(b) ? b.filter((x): x is string => typeof x === 'string' && x.length > 0) : []
}

/** true = the field's unit is CHOSEN on the screen (the pack accepts more than one). */
export const birimSecilirMi = (a: AracAlani, o: BirimOrtami): boolean => alanBirimleri(a, o).length > 1

/**
 * The unit a laboratory field is read in: the pack's one unit, or — where the pack accepts several — the unit
 * `secilen` names, IF it is one of them. null = none chosen yet (or a unit the pack does not accept): no value.
 */
export function seciliBirim(a: AracAlani, o: BirimOrtami, secilen?: unknown): string | null {
  const hepsi = alanBirimleri(a, o)
  if (hepsi.length === 1) return hepsi[0]
  return typeof secilen === 'string' && hepsi.includes(secilen) ? secilen : null
}

/** The unit code a field is shown with in this country, or null where the field has none (or none is chosen yet). */
export function alanBirimi(a: AracAlani, o: BirimOrtami, secilen?: unknown): string | null {
  if (a.olcu === 'boy') return o.birimler.boy
  if (a.olcu === 'agirlik') return o.birimler.agirlik
  if (a.lab) return seciliBirim(a, o, secilen)
  return a.birim ?? null
}

/** What the doctor typed → the number the tool's arithmetic takes. null = the country's unit is not one the kit knows, or none is chosen. */
export function kanonigeCevir(a: AracAlani, deger: number, o: BirimOrtami, secilen?: unknown): number | null {
  if (a.olcu === 'boy') return o.birimler.boy === 'in' ? deger * INC_CM : deger
  if (a.olcu === 'agirlik') return o.birimler.agirlik === 'lb' ? deger * LB_KG : deger
  if (a.lab) return birimdenKanonige(olcuTanimi(a.lab, o.olculer), seciliBirim(a, o, secilen), deger)
  return deger
}

/** The range a field accepts, in the unit it is shown in (the definition states it in the canonical unit). */
export function alanAraligi(a: AracAlani, o: BirimOrtami, secilen?: unknown): { enAz: number; enCok: number } | null {
  if (typeof a.enAz !== 'number' || typeof a.enCok !== 'number') return null
  const yuvarla = (x: number) => Math.round(x * 100) / 100
  if (a.lab) {
    const t = olcuTanimi(a.lab, o.olculer), birim = seciliBirim(a, o, secilen)
    const alt = kanoniktenBirime(t, birim, a.enAz), ust = kanoniktenBirime(t, birim, a.enCok)
    if (alt === null || ust === null) return null
    return { enAz: yuvarla(Math.min(alt, ust)), enCok: yuvarla(Math.max(alt, ust)) }
  }
  const bir = kanonigeCevir(a, 1, o)
  if (!bir) return null
  return { enAz: yuvarla(a.enAz / bir), enCok: yuvarla(a.enCok / bir) }
}
