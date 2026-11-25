/**
 * HASTA-PORTALI-GUNLUK — default targets and alert thresholds for home readings, and the merge with the doctor's
 * per-patient settings (ev_hedefler.ayarlar). Defaults are deliberately conservative starting points; the doctor owns the
 * final numbers for each patient (Ev verisi card → "Eşikleri düzenle"). Kaan's rule: always the latest edition of a
 * guideline — re-check these sources in the monthly regulatory watch (docs/OPEN-COMMITMENTS.md § MEVZUAT-TAKIP).
 *
 * Sources (latest editions at the time of writing, 2026-11):
 *  - Home blood pressure: 2024 ESC Guidelines for the management of elevated blood pressure and hypertension (home
 *    hypertension threshold ≥135/85 mmHg; treated target 120–129 systolic) and 2023 ESH Guidelines (home protocol:
 *    morning + evening for 7 days; grade 3 ≥180/110); Türk Hipertansiyon Uzlaşı Raporu (TKD / TİHD / THD) follows them.
 *    Severe ≥180/120 with symptoms = emergency (112).
 *  - Glucose: TEMD Diabetes Mellitus ve Komplikasyonlarının Tanı, Tedavi ve İzlem Kılavuzu (latest edition) — açlık /
 *    öğün öncesi 80–130 mg/dL, tokluk 2. saat <160 mg/dL; ADA Standards of Care in Diabetes (latest annual edition) —
 *    level 1 hypoglycaemia <70, level 2 <54 mg/dL.
 *  - Pregnancy BP (Kadın Hastalıkları ve Doğum, active pregnancy only): T.C. Sağlık Bakanlığı Doğum Öncesi Bakım
 *    Yönetim Rehberi and TJOD gebelikte hipertansiyon önerileri — ≥140/90 notify, ≥160/110 severe range (urgent).
 *  - Weight gain alert (+2 kg within 3 days): 2021 ESC Heart Failure Guidelines with the 2023 focused update (patient
 *    self-care: weight gain >2 kg in 3 days → contact the care team). Doctor-notify only for heart / kidney branches.
 *  - SpO₂: BTS Guideline for oxygen use in healthcare and emergency settings (latest edition) — usual target 94–98 %,
 *    <92 % needs assessment; COPD-type targets 88–92 % are set by the doctor per patient.
 *  - Fever: Türk Pediatri Kurumu / AAP fever guidance — any fever ≥38.0 °C under 3 months of age is urgent; ≥40 °C or
 *    fever lasting 3 days → doctor.
 *  - Pulse: resting <40 or >130 /min notify; <50 or >110 attention (general adult resting range 60–100).
 */
import type { OlcumTipi } from './tipler'

export interface EsikSeti {
  /** Target range used for "time in target" and the patient's goal ring. */
  hedefMin?: number
  hedefMax?: number
  /** Second value (diastolic) target. */
  hedefMax2?: number
  /** Single-value thresholds (upper / lower), first value. */
  dikkatUst?: number
  dikkatAlt?: number
  bildirUst?: number
  bildirAlt?: number
  acilUst?: number
  acilAlt?: number
  /** Diastolic counterparts for 'kb'. */
  dikkatUst2?: number
  bildirUst2?: number
  acilUst2?: number
  /** Trend rule: weekly average rose by ≥ trendDelta vs the 3 weeks before AND the weekly average ≥ trendTaban. */
  trendDelta?: number
  trendTaban?: number
}

/** Metric keys: a kind, or 'glukoz:<context>'. */
export type MetrikAnahtari = OlcumTipi | `glukoz:${'aclik' | 'tokluk2' | 'yatmadan' | 'rastgele'}`

export type HedefProfili = 'genel' | 'gebelik'

const GENEL: Record<string, EsikSeti> = {
  kb: { hedefMax: 130, hedefMax2: 80, dikkatUst: 160, dikkatUst2: 100, bildirUst: 170, bildirUst2: 105, acilUst: 180, acilUst2: 120, dikkatAlt: 90, bildirAlt: 80, trendDelta: 10, trendTaban: 135 },
  'glukoz:aclik': { hedefMin: 80, hedefMax: 130, dikkatAlt: 70, acilAlt: 54, bildirUst: 300, trendDelta: 20, trendTaban: 130 },
  'glukoz:tokluk2': { hedefMin: 80, hedefMax: 160, dikkatAlt: 70, acilAlt: 54, bildirUst: 300, trendDelta: 30, trendTaban: 140 },
  'glukoz:yatmadan': { hedefMin: 90, hedefMax: 150, dikkatAlt: 70, acilAlt: 54, bildirUst: 300, trendDelta: 30, trendTaban: 150 },
  'glukoz:rastgele': { hedefMin: 70, hedefMax: 180, dikkatAlt: 70, acilAlt: 54, bildirUst: 300 },
  kilo: {},
  nabiz: { hedefMin: 60, hedefMax: 100, dikkatAlt: 50, dikkatUst: 110, bildirAlt: 40, bildirUst: 130 },
  spo2: { hedefMin: 95, hedefMax: 100, dikkatAlt: 94, bildirAlt: 92, acilAlt: 88 },
  ates: { hedefMax: 37.5, dikkatUst: 39, bildirUst: 40 },
  bel: {},
  su: {},
}

const GEBELIK_KB: EsikSeti = { hedefMax: 140, hedefMax2: 90, dikkatUst: 135, dikkatUst2: 85, bildirUst: 140, bildirUst2: 90, acilUst: 160, acilUst2: 110, dikkatAlt: 90, trendDelta: 10, trendTaban: 130 }

export function varsayilanEsikler(profil: HedefProfili = 'genel'): Record<string, EsikSeti> {
  const k = JSON.parse(JSON.stringify(GENEL)) as Record<string, EsikSeti>
  if (profil === 'gebelik') k.kb = { ...GEBELIK_KB }
  return k
}

/** What the doctor may store per patient (ev_hedefler.ayarlar). */
export interface HekimAyarlari {
  esikler?: Partial<Record<string, Partial<EsikSeti>>>
  /** Extra measurement kinds the doctor turned on for this patient (on top of the branş defaults). */
  olcumler?: OlcumTipi[]
  /** Kinds the doctor turned off for this patient. */
  kapali?: OlcumTipi[]
  /** LDL target (mg/dL), shown with the latest lab value — no default, the doctor's risk decision. */
  ldlHedef?: number | null
  /** Weight-gain alert goes to the doctor (heart / kidney follow-up). Branş default when unset. */
  kiloBildir?: boolean
}

const SAYISAL_ALANLAR: (keyof EsikSeti)[] = ['hedefMin', 'hedefMax', 'hedefMax2', 'dikkatUst', 'dikkatAlt', 'bildirUst', 'bildirAlt', 'acilUst', 'acilAlt', 'dikkatUst2', 'bildirUst2', 'acilUst2', 'trendDelta', 'trendTaban']

/** Clean a doctor's settings payload: unknown keys dropped, numbers only, null clears an override. */
export function hekimAyarlariniTemizle(ham: unknown): HekimAyarlari {
  const h = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const out: HekimAyarlari = {}
  const esik = (h.esikler && typeof h.esikler === 'object' ? h.esikler : {}) as Record<string, unknown>
  const gecerliAnahtar = new Set(Object.keys(GENEL))
  for (const [k, v] of Object.entries(esik)) {
    if (!gecerliAnahtar.has(k) || !v || typeof v !== 'object') continue
    const temiz: Partial<EsikSeti> = {}
    for (const a of SAYISAL_ALANLAR) {
      const x = (v as Record<string, unknown>)[a]
      if (x === null || x === undefined || x === '') continue
      const n = Number(x)
      if (Number.isFinite(n) && n >= 0 && n <= 1000) temiz[a] = n
    }
    if (Object.keys(temiz).length) (out.esikler ||= {})[k] = temiz
  }
  const tipler: OlcumTipi[] = ['kb', 'glukoz', 'kilo', 'nabiz', 'spo2', 'ates', 'bel', 'su']
  if (Array.isArray(h.olcumler)) out.olcumler = tipler.filter((t) => (h.olcumler as unknown[]).includes(t))
  if (Array.isArray(h.kapali)) out.kapali = tipler.filter((t) => (h.kapali as unknown[]).includes(t))
  if (h.ldlHedef === null) out.ldlHedef = null
  else if (Number.isFinite(Number(h.ldlHedef)) && Number(h.ldlHedef) > 0 && Number(h.ldlHedef) < 400) out.ldlHedef = Number(h.ldlHedef)
  if (typeof h.kiloBildir === 'boolean') out.kiloBildir = h.kiloBildir
  return out
}

/** Effective thresholds: defaults (by profile) overlaid with the doctor's per-patient overrides. */
export function etkinEsikler(profil: HedefProfili, ayar: HekimAyarlari | null | undefined): Record<string, EsikSeti> {
  const k = varsayilanEsikler(profil)
  for (const [anahtar, v] of Object.entries(ayar?.esikler || {})) {
    if (!v) continue
    k[anahtar] = { ...(k[anahtar] || {}), ...v }
  }
  return k
}

/** Is one reading inside its target range? null = the metric has no target. */
export function hedefteMi(e: EsikSeti | undefined, deger: number, deger2: number | null = null): boolean | null {
  if (!e || (e.hedefMin == null && e.hedefMax == null && e.hedefMax2 == null)) return null
  if (e.hedefMin != null && deger < e.hedefMin) return false
  if (e.hedefMax2 != null) {
    // Blood pressure target is "below 130/80": the limit itself is outside.
    if (e.hedefMax != null && deger >= e.hedefMax) return false
    if (deger2 != null && deger2 >= e.hedefMax2) return false
    return true
  }
  if (e.hedefMax != null && deger > e.hedefMax) return false
  return true
}

/** Patient-facing target sentence, e.g. "Hedef: 130/80 altı". */
export function hedefMetni(anahtar: string, e: EsikSeti | undefined): string | null {
  if (!e) return null
  if (anahtar === 'kb' && e.hedefMax != null) return `Hedef: ${e.hedefMax}/${e.hedefMax2 ?? '—'} altı`
  if (e.hedefMin != null && e.hedefMax != null) return `Hedef aralık: ${e.hedefMin}–${e.hedefMax}`
  if (e.hedefMax != null) return `Hedef: ${e.hedefMax} ve altı`
  if (e.hedefMin != null) return `Hedef: ${e.hedefMin} ve üstü`
  return null
}
