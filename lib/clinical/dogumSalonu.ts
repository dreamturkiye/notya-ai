/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — THE LABOUR WARD: Bishop score, Robson ten-group classification, caesarean urgency
 * category, quantitative blood loss with shock index and the postpartum haemorrhage stage and bundle, and the inputs of the
 * MFMU VBAC model. Obstetrics and gynaecology only. Pure, country-neutral: KEYS AND NUMBERS ONLY.
 *
 *   Bishop          Bishop EH. Pelvic scoring for elective induction. Obstet Gynecol 1964;24:266-268. Components and
 *                   points checked 2026-11-05 (Am Fam Physician 2022;105(2):177, table 2). THE "FAVOURABLE" LIMIT IS THE
 *                   COUNTRY'S: NICE NG207 (2021): 6 or less unfavourable, more than 6 favourable; US practice (ACOG
 *                   Practice Bulletin 107, as summarised in Am Fam Physician 2022): more than 8 favourable.
 *   Robson          World Health Organization. Robson Classification: Implementation Manual (2017). Ten groups, with 2a/2b
 *                   and 4a/4b. Built from the obstetric concepts; the clinician confirms.
 *   Urgency         Four categories (Lucas DN et al., J R Soc Med 2000;93:346-350), used by NICE NG192 (2021):
 *                   1 immediate threat to the life of the woman or fetus; 2 maternal or fetal compromise that is not
 *                   immediately life-threatening; 3 no compromise but needs early birth; 4 at a time to suit the woman and
 *                   the service. DECISION-TO-BIRTH TARGETS ARE THE COUNTRY'S (NICE NG192: category 1 within 30 minutes,
 *                   category 2 within 75 minutes, read in an NHS protocol citing NG192 on 2026-11-05).
 *   QBL             Weighed blood loss: (wet weight - dry weight of soaked items, 1 g = 1 mL) + canister volume - amniotic
 *                   fluid and other fluid collected before the placenta (ACOG Committee Opinion 794, 2019, "Quantitative
 *                   blood loss in obstetric hemorrhage"; not re-opened in this session).
 *   Shock index     Heart rate / systolic blood pressure. Thresholds 0.9, 1.4 and 1.7: El Ayadi AM, Nathan HL et al.
 *                   Vital sign prediction of adverse maternal outcomes in women with hypovolemic shock: the role of shock
 *                   index. PLoS ONE 2016;11(2):e0148729 (read 2026-11-05): 0.9 the upper limit of normal postpartum,
 *                   1.4 urgent intervention, 1.7 high chance of an adverse outcome.
 *   PPH stage       THE COUNTRY'S LIMITS (`kanama_esik_1..3`): RCOG Green-top 52 minor 500-1000, major over 1000 (moderate
 *                   1001-2000, severe over 2000); ACOG Practice Bulletin 183: 1000 mL or more, or signs of hypovolaemia.
 *   PPH bundle      WHO recommendations on the assessment of postpartum blood loss and use of a treatment bundle (2023):
 *                   uterine massage, oxytocic, tranexamic acid, intravenous fluids, examination and escalation. Items only.
 *   VBAC            Grobman WA et al. Prediction of vaginal birth after cesarean delivery in term gestations: a calculator
 *                   without race and ethnicity. Am J Obstet Gynecol 2021;225:664.e1-7. ITS EQUATION COULD NOT BE READ FROM
 *                   THE PAPER in this session and secondary sources disagree: no probability is computed here. The inputs
 *                   are recorded for the official MFMU calculator (OPEN-COMMITMENTS KD-OPERATOR-01).
 */

// ───────────────────────── Bishop ─────────────────────────

export const BISHOP_BILESENLERI = {
  aciklik: ['kapali', '1_2', '3_4', '5_ustu'],
  silinme: ['0_30', '40_50', '60_70', '80_ustu'],
  istasyon: ['eksi3', 'eksi2', 'eksi1_0', 'arti1_2'],
  kivam: ['sert', 'orta', 'yumusak'],
  pozisyon: ['posterior', 'orta', 'anterior'],
} as const
export type BishopGirdi = { [K in keyof typeof BISHOP_BILESENLERI]?: string | null }

/** Total 0-13, or null where a component is missing. `esik` (the country's): favourable = total above it. */
export function bishopSkoru(g: BishopGirdi, esik?: number | null): { toplam: number | null; eksik: string[]; uygun: boolean | null } {
  const eksik: string[] = []
  let toplam = 0
  for (const [k, liste] of Object.entries(BISHOP_BILESENLERI) as [keyof typeof BISHOP_BILESENLERI, readonly string[]][]) {
    const i = liste.indexOf(String(g[k] ?? ''))
    if (i < 0) eksik.push(k)
    else toplam += i
  }
  if (eksik.length) return { toplam: null, eksik, uygun: null }
  return { toplam, eksik, uygun: typeof esik === 'number' && Number.isFinite(esik) ? toplam > esik : null }
}

// ───────────────────────── Robson (WHO 2017) ─────────────────────────

export type RobsonNotrGirdi = {
  parite: 'nullipar' | 'multipar' | '' | null
  oncekiSezaryen: boolean
  fetus: 'tekil' | 'cogul' | '' | null
  prezentasyon: 'bas' | 'makat' | 'transvers' | '' | null
  hafta: number | null
  eylem: 'spontan' | 'induksiyon' | 'eylem_oncesi_sezaryen' | '' | null
}
export type RobsonSonucu = { grup: number | null; alt?: 'a' | 'b'; eksik: string[] }
export function robsonSiniflandir(g: RobsonNotrGirdi): RobsonSonucu {
  const eksik: string[] = []
  if (!g.fetus) eksik.push('fetus')
  if (!g.prezentasyon) eksik.push('prezentasyon')
  if (!g.parite) eksik.push('parite')
  if (g.hafta == null || !Number.isFinite(g.hafta)) eksik.push('hafta')
  if (!g.eylem) eksik.push('eylem')
  if (g.fetus === 'cogul') return { grup: 8, eksik: [] }
  if (g.prezentasyon === 'transvers') return { grup: 9, eksik: [] }
  if (g.prezentasyon === 'makat') {
    if (!g.parite) return { grup: null, eksik }
    return { grup: g.parite === 'nullipar' ? 6 : 7, eksik: [] }
  }
  if (eksik.length) return { grup: null, eksik }
  if ((g.hafta as number) < 37) return { grup: 10, eksik: [] }
  if (g.oncekiSezaryen) return { grup: 5, eksik: [] }
  const alt = g.eylem === 'induksiyon' ? ('a' as const) : g.eylem === 'eylem_oncesi_sezaryen' ? ('b' as const) : undefined
  if (g.parite === 'nullipar') return g.eylem === 'spontan' ? { grup: 1, eksik: [] } : { grup: 2, alt, eksik: [] }
  return g.eylem === 'spontan' ? { grup: 3, eksik: [] } : { grup: 4, alt, eksik: [] }
}

// ───────────────────────── caesarean urgency ─────────────────────────

export const ACILIYET_KATEGORILERI = ['1', '2', '3', '4'] as const
/** Target time and whether it was met. `hedefDk` = the country's minutes for the category (none = no target). ISO local times. */
export function sezaryenAciliyeti(g: { kategori: string; kararZamani: string | null; dogumZamani?: string | null }, hedefDk?: number | null): { hedef: string | null; gecenDk: number | null; asildi: boolean | null } {
  if (!(ACILIYET_KATEGORILERI as readonly string[]).includes(g.kategori)) return { hedef: null, gecenDk: null, asildi: null }
  const karar = g.kararZamani ? Date.parse(g.kararZamani) : NaN
  const hedef = Number.isFinite(karar) && typeof hedefDk === 'number' && Number.isFinite(hedefDk) ? new Date(karar + hedefDk * 60000) : null
  const dogum = g.dogumZamani ? Date.parse(g.dogumZamani) : NaN
  const gecenDk = Number.isFinite(karar) && Number.isFinite(dogum) ? Math.round((dogum - karar) / 60000) : null
  return {
    hedef: hedef ? yerelIso(hedef) : null,
    gecenDk,
    asildi: gecenDk != null && typeof hedefDk === 'number' && Number.isFinite(hedefDk) ? gecenDk > hedefDk : null,
  }
}
function yerelIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// ───────────────────────── QBL, shock index, PPH ─────────────────────────

export type QblGirdi = { islakGram?: number | null; kuruGram?: number | null; kanisterMl?: number | null; amniyonMl?: number | null; tahminiMl?: number | null }
const n = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null)
/** Weighed blood loss in mL, or the visual estimate when nothing was weighed or measured. `olculdu` false = an estimate. */
export function kanKaybi(g: QblGirdi): { ml: number | null; olculdu: boolean } {
  const islak = n(g.islakGram), kuru = n(g.kuruGram), kanister = n(g.kanisterMl), amniyon = n(g.amniyonMl) ?? 0
  if (islak != null || kanister != null) {
    const tartim = islak != null ? Math.max(0, islak - (kuru ?? 0)) : 0
    return { ml: Math.max(0, Math.round(tartim + (kanister ?? 0) - amniyon)), olculdu: true }
  }
  const t = n(g.tahminiMl)
  return { ml: t != null ? Math.round(t) : null, olculdu: false }
}

export const SOK_INDEKSI_BANTLARI = ['normal', 'esik_0_9', 'esik_1_4', 'esik_1_7'] as const
export function sokIndeksi(nabiz: number | null | undefined, sistolik: number | null | undefined): { si: number; bant: (typeof SOK_INDEKSI_BANTLARI)[number] } | null {
  if (typeof nabiz !== 'number' || typeof sistolik !== 'number' || !(nabiz > 0) || !(sistolik > 0)) return null
  const si = Math.round((nabiz / sistolik) * 100) / 100
  return { si, bant: si >= 1.7 ? 'esik_1_7' : si >= 1.4 ? 'esik_1_4' : si >= 0.9 ? 'esik_0_9' : 'normal' }
}

/** The country's PPH limits, ascending (mL). Band index 0 = below the first limit. */
export function kanamaEvresi(ml: number | null, esikler: readonly number[]): number | null {
  if (ml == null) return null
  const e = esikler.filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  if (!e.length) return null
  let i = 0
  // A limit "at or above": RCOG's major PPH is "more than 1000"; a pack whose limit is strict states limit + 1.
  for (const x of e) if (ml >= x) i++
  return i
}

export const KANAMA_PAKETI = ['olcum', 'masaj', 'uterotonik', 'traneksamik_asit', 'iv_sivi', 'muayene_eskalasyon'] as const

// ───────────────────────── VBAC (inputs only) ─────────────────────────

export const VBAC_GIRDILERI = ['yas', 'boy_cm', 'gebelik_oncesi_kilo_kg', 'obstetrik_oyku', 'arrest_endikasyonu', 'tedavili_kronik_hipertansiyon'] as const
export const VBAC_OBSTETRIK_OYKU = ['onceki_vbac', 'yalniz_sezaryen_oncesi_vajinal', 'vajinal_dogum_yok'] as const
/** Pre-pregnancy BMI (kg/m2) from the recorded height and weight, one decimal; null where either is missing. */
export function vki(boyCm: number | null | undefined, kiloKg: number | null | undefined): number | null {
  if (typeof boyCm !== 'number' || typeof kiloKg !== 'number' || !(boyCm > 0) || !(kiloKg > 0)) return null
  return Math.round((kiloKg / (boyCm / 100) ** 2) * 10) / 10
}
/** The official MFMU Network calculator (Version 2.2, November 2023), opened 2026-11-05. No patient value is put into the address. */
export const MFMU_VBAC_HESAPLAYICI = 'https://extapps.bsc.gwu.edu/shinypub/mfmu/VBAC_Calculator/'
