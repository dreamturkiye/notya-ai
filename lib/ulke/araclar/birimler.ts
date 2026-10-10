/**
 * NOTYA-ULKE-ARACLAR-01 — UNITS a tool's numbers are entered in. The country chooses; the kit converts to the unit
 * its arithmetic is written in, with the exact defined factors, and never the other way round on the screen: a
 * doctor reads back the number they typed.
 *
 * Length and weight follow the pack's `uygulama.birimler` (cm or in, kg or lb). A laboratory quantity follows the
 * pack's `araclar.labBirimleri`: a pack that switches on a tool reading that quantity must state its unit.
 */
import type { SayiKurali } from '../arayuz/sayiOkuma'
import type { Birimler } from '../tipler'
import type { AracAlani, LabOlcusu } from './tipler'

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
 */
export type BirimOrtami = { birimler: Birimler; lab: Readonly<Partial<Record<LabOlcusu, string>>>; sayi: SayiKurali }

/** The unit code a field is shown with in this country, or null where the field has none. */
export function alanBirimi(a: AracAlani, o: BirimOrtami): string | null {
  if (a.olcu === 'boy') return o.birimler.boy
  if (a.olcu === 'agirlik') return o.birimler.agirlik
  if (a.lab) return o.lab[a.lab] ?? null
  return a.birim ?? null
}

/** What the doctor typed → the number the tool's arithmetic takes. null = the country's unit is not one the kit knows. */
export function kanonigeCevir(a: AracAlani, deger: number, o: BirimOrtami): number | null {
  if (a.olcu === 'boy') return o.birimler.boy === 'in' ? deger * INC_CM : deger
  if (a.olcu === 'agirlik') return o.birimler.agirlik === 'lb' ? deger * LB_KG : deger
  if (a.lab) { const b = o.lab[a.lab]; const f = b ? LAB_BIRIMLERI[a.lab].birimler[b] : undefined; return typeof f === 'number' ? deger * f : null }
  return deger
}

/** The range a field accepts, in the unit it is shown in (the definition states it in the canonical unit). */
export function alanAraligi(a: AracAlani, o: BirimOrtami): { enAz: number; enCok: number } | null {
  if (typeof a.enAz !== 'number' || typeof a.enCok !== 'number') return null
  const bir = kanonigeCevir(a, 1, o)
  if (!bir) return null
  const yuvarla = (x: number) => Math.round(x * 100) / 100
  return { enAz: yuvarla(a.enAz / bir), enCok: yuvarla(a.enCok / bir) }
}
