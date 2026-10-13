/**
 * NOTYA-ULKE-ARACLAR-01 — tools of paediatric surgery, internal medicine and dermatology. Keys and rules only.
 * Each stands beside a tool of the pre-split application (named on the definition) and is compared with it, input
 * for input, in lib/ulke/araclar/esdegerlik.test.ts. Nothing of that application is imported here.
 */
import { birimdenKanonige, LAB_BIRIMLERI } from '../birimler'
import { yazilanBirim } from '../girdi'
import type { AracAlani, AracGirdisi, AracTanimi } from '../tipler'
import { BOS_SONUC, gunEkle, gunMu, isaretliler, metin, puan, sayi, sayiMi, secim, tarih } from '../yardimci'

const isaretKosullu = (anahtar: string, deger: string): AracAlani => ({ anahtar, tur: 'isaret', kosul: { alan: 'tip', degerler: [deger] } })

/**
 * Before and after an operation on a child: which list (before / after), what is done, the day of the operation.
 * A list of the product's own. The other application also derives two reminder days from the operation day (three
 * days before, seven days after); the kit derives none — an interval is clinical guidance, and the doctor books
 * the follow-up on the calendar. Stands beside specialties/cocuk-cerrahisi/engines/prepost.ts → prepostSkorla.
 */
export const PREOP_MADDELER = ['onam', 'laboratuvar', 'goruntu', 'acil_kisi', 'anestezi_not'] as const
export const POSTOP_MADDELER = ['postop_yara', 'postop_agri', 'postop_beslenme', 'kontrol_plan', 'postop_acil_yol'] as const
export const COCUK_PREPOST: AracTanimi = {
  anahtar: 'cocuk-prepost-op',
  tur: 'liste',
  alanlar: [secim('tip', ['preop', 'postop']), ...PREOP_MADDELER.map((k) => isaretKosullu(k, 'preop')), ...POSTOP_MADDELER.map((k) => isaretKosullu(k, 'postop')), metin('etiket'), tarih('ameliyat_tarihi', true)],
  cikti: { sayilar: ['tamamlanan'], bantlar: [], uyarilar: [], tarihler: ['ameliyat_tarihi'] },
  kaynak: null,
  hesapla: (g) => {
    if (g.tip !== 'preop' && g.tip !== 'postop') return BOS_SONUC
    const liste = g.tip === 'preop' ? PREOP_MADDELER : POSTOP_MADDELER
    return { tamam: true, sayilar: [{ anahtar: 'tamamlanan', deger: isaretliler(g, liste).length, ondalik: 0, enCok: liste.length }], bant: null, uyarilar: [], tarihler: gunMu(g.ameliyat_tarihi) ? [{ anahtar: 'ameliyat_tarihi', tarih: g.ameliyat_tarihi }] : [] }
  },
}

/**
 * Wound, drain and suture follow-up: what is followed, where, on which day, the next check, and for a drain the
 * output in millilitres as the doctor records it. The other application proposes "ten days later" for suture
 * removal when no next check is given; the kit proposes nothing. Stands beside
 * specialties/cocuk-cerrahisi/engines/yaraDren.ts → yaraSkorla, yaraGorevleri.
 */
export const YARA_TIPLERI = ['yara', 'dren', 'dikis', 'taburcu_kontrol'] as const
export const YARA_DREN: AracTanimi = {
  anahtar: 'yara-dren-izlem',
  tur: 'takvim',
  alanlar: [secim('tip', YARA_TIPLERI), metin('bolge'), tarih('tarih'), tarih('sonraki_kontrol', true), sayi('dren_cikis_ml', 0, 5000, { tam: true, birim: 'mL', istege: true, kosul: { alan: 'tip', degerler: ['dren'] } })],
  cikti: { sayilar: ['dren_cikis_ml'], bantlar: [], uyarilar: [], tarihler: ['tarih', 'sonraki_kontrol'] },
  sonucBirimleri: ['mL'],
  kaynak: null,
  hesapla: (g) => {
    if (typeof g.tip !== 'string' || !gunMu(g.tarih)) return BOS_SONUC
    return {
      tamam: true,
      sayilar: g.tip === 'dren' && sayiMi(g.dren_cikis_ml) ? [{ anahtar: 'dren_cikis_ml', deger: g.dren_cikis_ml, ondalik: 0, birim: 'mL' }] : [],
      bant: null, uyarilar: [],
      tarihler: [{ anahtar: 'tarih', tarih: g.tarih }, ...(gunMu(g.sonraki_kontrol) ? [{ anahtar: 'sonraki_kontrol', tarih: g.sonraki_kontrol }] : [])],
    }
  },
}

/**
 * Chronic kidney disease: the GFR category (G1 to G5), the albuminuria category (A1 to A3) and the risk cell they
 * fall in, with what the numbers typed show against the guideline's list of circumstances for referral. The other
 * application also writes a plan and a monitoring interval; the kit classifies and stops there.
 * Source: KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease.
 * Kidney Int. 2024;105(4S):S117–S314 (the GFR and albuminuria categories and the risk grid).
 * Stands beside specialties/dahiliye/engines/ckd.ts → gEvre, aEvre, kdigoRenk, ckdDegerlendir.
 *
 * ── NOTYA-ULKE-ARAC-DUZELTME-01, fault 5. Sources opened on 2026-10-10: ──
 *   [KDIGO-FULL] the guideline, https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf — Table 3
 *     (p. S136), albuminuria categories: A1 "<3" mg/mmol, "<30" mg/g; A2 "3–30" mg/mmol, "30–300" mg/g; A3 ">30"
 *     mg/mmol, ">300" mg/g. P. S136: "CKD is classified based on Cause, GFR category (G1–G5), and Albuminuria
 *     category (A1–A3), abbreviated as CGA."
 *   [KDIGO-SUM] Summary of Recommendation Statements and Practice Points,
 *     https://kdigo.org/wp-content/uploads/2026/05/KDIGO-2024-CKD-Guideline-Summary-Recommendations-and-Practice-Points.pdf
 *     — Practice Point 5.1.1 and Figure 48 (circumstances for referral), among them: "eGFR <30 ml/min per 1.73 m2";
 *     "A sustained fall in GFR of >20% or >30% in those people initiating hemodynamically active therapies";
 *     "Consistent finding of significant albuminuria (ACR ≥300 mg/g [≥30 mg/mmol] …)" in combination with hematuria;
 *     "A consistent finding of ACR >700 mg/g [>70 mg/mmol]". The risk cell is not on the list.
 *
 *   1. NO RISK CELL WITHOUT A URINE ALBUMIN RESULT. The cell is defined by two results. The tool used to read a
 *      missing ratio as category A1 and show "low risk (green cell)" for an eGFR of 75 and nothing else. Now the band
 *      is null and the result says the ratio is missing (`uacr_yok`).
 *   2. THE LIMITS ARE THE GUIDELINE'S, IN THE UNIT THE VALUE WAS TYPED IN. The guideline prints the limits once per
 *      unit (3 and 30 mg/mmol; 30 and 300 mg/g) and the two sets are not conversions of each other. The tool used
 *      to convert a mg/mmol value to mg/g and compare it with 30 and 300: 3.0 mg/mmol (26.5 mg/g) was called A1 and
 *      31 mg/mmol (274 mg/g) A2. Now a value is compared with the limits of ITS OWN UNIT (`KDIGO_A_SINIRLARI`),
 *      each limit turned into the arithmetic's unit by the very multiplication the typed value went through, so a
 *      value exactly on a limit lands where the table puts it: 3 mg/mmol and 30 mg/g are A2, 30 mg/mmol and 300
 *      mg/g are A2, anything above is A3.
 *   3. THE REFERRAL LINES SAY WHAT THE LIST SAYS. Gone: "albuminuria A3" alone, "the very-high-risk cell" (not on
 *      the list), and a fall of more than 25% in a year. Each line that remains is an observation on the numbers
 *      typed, at the list's own limit, and its words (the pack's) say what the list asks for beyond one result:
 *        sevk_egfr30          eGFR below 30
 *        sevk_acr_hematuri    a ratio of 300 mg/g (30 mg/mmol) or more — the list: a CONSISTENT finding, IN COMBINATION WITH HAEMATURIA
 *        sevk_acr700          a ratio above 700 mg/g (70 mg/mmol) — the list: a CONSISTENT finding
 *        sevk_dusus20         an eGFR more than 20% below the earlier one — the list: a SUSTAINED fall
 *      The tool knows one result of each kind: it cannot say that a criterion IS met, and no line says so.
 */
export const KDIGO_G = ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'] as const
export const KDIGO_A = ['A1', 'A2', 'A3'] as const
export const kdigoG = (egfr: number): (typeof KDIGO_G)[number] => (egfr >= 90 ? 'G1' : egfr >= 60 ? 'G2' : egfr >= 45 ? 'G3a' : egfr >= 30 ? 'G3b' : egfr >= 15 ? 'G4' : 'G5')
/**
 * The guideline's limits of the albumin-to-creatinine ratio, AS PRINTED FOR EACH UNIT ([KDIGO-FULL] Table 3;
 * [KDIGO-SUM] Figure 48): `a2` = A2 begins here (below it A1); `a3` = A2 ends here (above it A3); `sevk` = "ACR ≥"
 * of the referral list (with haematuria); `sevkYuksek` = "ACR >" of the referral list.
 */
export const KDIGO_A_SINIRLARI: Readonly<Record<string, { a2: number; a3: number; sevk: number; sevkYuksek: number }>> = {
  'mg/g': { a2: 30, a3: 300, sevk: 300, sevkYuksek: 700 },
  'mg/mmol': { a2: 3, a3: 30, sevk: 30, sevkYuksek: 70 },
}
/** A limit printed in `birim`, in the arithmetic's unit — by the same multiplication a typed value goes through. */
const acrSiniri = (birim: string, deger: number): number | null => birimdenKanonige(LAB_BIRIMLERI.albuminKreatinin, birim, deger)
/** The albuminuria category of a ratio (in mg/g, as the arithmetic gets it) that was typed in `birim`. null = a unit the guideline prints no limits for. */
export function kdigoA(uacrMgG: number, birim = 'mg/g'): (typeof KDIGO_A)[number] | null {
  const s = Object.prototype.hasOwnProperty.call(KDIGO_A_SINIRLARI, birim) ? KDIGO_A_SINIRLARI[birim] : null
  const a2 = s ? acrSiniri(birim, s.a2) : null, a3 = s ? acrSiniri(birim, s.a3) : null
  if (a2 === null || a3 === null) return null
  return uacrMgG < a2 ? 'A1' : uacrMgG <= a3 ? 'A2' : 'A3'
}
/** Which line of the referral list a ratio touches, or null. */
function acrSevki(uacrMgG: number, birim: string): 'sevk_acr700' | 'sevk_acr_hematuri' | null {
  const s = Object.prototype.hasOwnProperty.call(KDIGO_A_SINIRLARI, birim) ? KDIGO_A_SINIRLARI[birim] : null
  const alt = s ? acrSiniri(birim, s.sevk) : null, ust = s ? acrSiniri(birim, s.sevkYuksek) : null
  if (alt === null || ust === null) return null
  return uacrMgG > ust ? 'sevk_acr700' : uacrMgG >= alt ? 'sevk_acr_hematuri' : null
}
/** The risk cell of a GFR category AND an albuminuria category. There is no cell for one of them alone. */
export function kdigoRisk(g: (typeof KDIGO_G)[number], a: (typeof KDIGO_A)[number]): 'yesil' | 'sari' | 'turuncu' | 'kirmizi' {
  const gi = KDIGO_G.indexOf(g), ai = KDIGO_A.indexOf(a)
  if (gi >= 4) return 'kirmizi'
  if (gi === 3) return ai === 0 ? 'turuncu' : 'kirmizi'
  if (gi === 2) return ai === 0 ? 'sari' : ai === 1 ? 'turuncu' : 'kirmizi'
  return ai === 0 ? 'yesil' : ai === 1 ? 'sari' : 'turuncu'
}
/** What both kidney tools work out from the two results: the categories, and the cell only where both are there. null = the ratio was typed in a unit the guideline prints no limits for. */
export function kdigoSinifla(g: AracGirdisi): { gk: (typeof KDIGO_G)[number]; ak: (typeof KDIGO_A)[number] | null; birim: string; risk: ReturnType<typeof kdigoRisk> | null } | null {
  if (!sayiMi(g.egfr)) return null
  const birim = yazilanBirim(g, 'uacr', LAB_BIRIMLERI.albuminKreatinin.kanonik)
  const gk = kdigoG(g.egfr), ak = sayiMi(g.uacr) ? kdigoA(g.uacr, birim) : null
  if (sayiMi(g.uacr) && ak === null) return null
  return { gk, ak, birim, risk: ak ? kdigoRisk(gk, ak) : null }
}
/** true = `simdi` is MORE than 20% below `once` (to two decimals of each, so that exactly 20% is never "more"). */
export const yuzde20denFazlaDustu = (once: number, simdi: number): boolean => { const a = Math.round(once * 100), b = Math.round(simdi * 100); return a > 0 && (a - b) * 5 > a }
export const KDIGO: AracTanimi = {
  anahtar: 'kdigo-evre',
  tur: 'hesap',
  alanlar: [sayi('egfr', 1, 200, { birim: 'mL/min/1.73m2' }), sayi('uacr', 0, 10000, { lab: 'albuminKreatinin', istege: true }), sayi('egfr_bir_yil_once', 1, 200, { birim: 'mL/min/1.73m2', istege: true })],
  cikti: { sayilar: [], bantlar: ['yesil', 'sari', 'turuncu', 'kirmizi'], uyarilar: [...KDIGO_G, ...KDIGO_A, 'uacr_yok', 'sevk_egfr30', 'sevk_acr_hematuri', 'sevk_acr700', 'sevk_dusus20'], tarihler: [] },
  kaynak: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.',
  hesapla: (g) => {
    const s = kdigoSinifla(g)
    if (!s || !sayiMi(g.egfr)) return BOS_SONUC
    const acr = sayiMi(g.uacr) ? acrSevki(g.uacr, s.birim) : null
    const sevk = [...(g.egfr < 30 ? ['sevk_egfr30'] : []), ...(acr ? [acr] : []), ...(sayiMi(g.egfr_bir_yil_once) && yuzde20denFazlaDustu(g.egfr_bir_yil_once, g.egfr) ? ['sevk_dusus20'] : [])]
    // NO RISK CELL WITHOUT THE RATIO: the band stays empty and the result says what is missing.
    return { tamam: true, sayilar: [], bant: s.risk, uyarilar: [s.gk, ...(s.ak ? [s.ak] : ['uacr_yok']), ...sevk], tarihler: [] }
  },
}

// ── dermatology: three published indices, each scored by the doctor ──

export const DERI_BOLGELERI = ['bas', 'ust', 'govde', 'alt'] as const
type Bolge = (typeof DERI_BOLGELERI)[number]
const AGIRLIK: Readonly<Record<Bolge, number>> = { bas: 0.1, ust: 0.2, govde: 0.3, alt: 0.4 }
const bir = (x: number) => Math.round(x * 10) / 10
/**
 * ONE REGION of PASI or EASI: the sum of its signs times its area score — or null while the region is not finished.
 * A region is finished when its area score is entered and, where the area is not 0, every sign is entered too.
 * NOTYA-ULKE-ARAC-DUZELTME-01 (faults 2 and 9): an empty box used to count as 0, so a form with one box filled was
 * scored as if the doctor had found nothing anywhere else ("PASI 0"). Now a form that is not finished has no result.
 */
function bolgePuani(g: AracGirdisi, b: Bolge, belirtiler: readonly string[]): number | null {
  const alan = g[`${b}_a`]
  if (!sayiMi(alan)) return null
  if (alan === 0) return 0
  let toplam = 0
  for (const k of belirtiler) { const v = g[`${b}_${k}`]; if (!sayiMi(v)) return null; toplam += v }
  return toplam * alan
}
function agirlikliToplam(g: AracGirdisi, belirtiler: readonly string[], agirlik: Readonly<Record<Bolge, number>>): number | null {
  let toplam = 0
  for (const b of DERI_BOLGELERI) { const p = bolgePuani(g, b, belirtiler); if (p === null) return null; toplam += agirlik[b] * p }
  return bir(toplam)
}

/**
 * PASI: four regions, each with erythema, induration and desquamation (0 to 4) and the area involved (0 to 6);
 * weights 0.1 / 0.2 / 0.3 / 0.4; total 0 to 72.
 * Source: Fredriksson T, Pettersson U. Severe psoriasis — oral therapy with a new retinoid. Dermatologica 1978;157:238–244.
 * Stands beside specialties/dermatoloji/engines/score-calculator.ts → pasi, pasiBandi.
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01 (fault 9) — THE SCORE WITHOUT A SEVERITY WORD. The tool called a PASI below 10 mild,
 * 10 to 19.9 moderate and 20 or above severe. No source was found for those bands. The one page opened that prints
 * any — Canadian Agency for Drugs and Technologies in Health, Clinical Review Report: Guselkumab, Appendix 5
 * "Validity of Outcome Measures" (March 2018), https://www.ncbi.nlm.nih.gov/books/NBK534046/, read 2026-10-10 — says
 * "In general, a PASI score of 5 to 10 is considered moderate disease, and a score over 10 is considered severe",
 * which contradicts them (it also confirms the formula, the weights, the two scales and the range 0 to 72). The
 * kit therefore shows the number and no band. A country whose own source states bands supplies them
 * (`bantSerbest` → `PaketAraci.uyarlama.bantlar`).
 */
export const PASI: AracTanimi = {
  anahtar: 'pasi',
  tur: 'olcek',
  alanlar: DERI_BOLGELERI.flatMap((b) => [puan(`${b}_e`, 0, 4), puan(`${b}_i`, 0, 4), puan(`${b}_d`, 0, 4), puan(`${b}_a`, 0, 6)]),
  cikti: { sayilar: ['pasi'], bantlar: [], uyarilar: [], tarihler: [] },
  bantSerbest: true,
  kaynak: 'Fredriksson T, Pettersson U. Dermatologica 1978;157:238-244.',
  hesapla: (g) => {
    const v = agirlikliToplam(g, ['e', 'i', 'd'], AGIRLIK)
    return v === null ? BOS_SONUC : { tamam: true, sayilar: [{ anahtar: 'pasi', deger: v, ondalik: 1, enCok: 72 }], bant: null, uyarilar: [], tarihler: [] }
  },
}

/**
 * EASI: four regions, each with erythema, oedema / papulation, excoriation and lichenification (0 to 3) and the area
 * involved (0 to 6); total 0 to 72.
 * Source: Hanifin JM, Thurston M, Omoto M, et al. The eczema area and severity index (EASI). Exp Dermatol 2001;10:11–18.
 * Stands beside specialties/dermatoloji/engines/score-calculator.ts → easi, easiBandi.
 *
 * ── NOTYA-ULKE-ARAC-DUZELTME-01, faults 2 and 9. Sources opened on 2026-10-10: ──
 *   [EASI-GUIDE] Harmonising Outcome Measures for Eczema (HOME), "EASI User Guide" (January 2017, v3),
 *     https://www.homeforeczema.org/documents/easi-user-guide-jan-2017-v3.pdf — the region multipliers:
 *     "Patients 8 years or above": head/neck 0.1, upper extremities 0.2, trunk 0.3, lower extremities 0.4;
 *     "Patients under 8 years of age": head/neck 0.2, upper extremities 0.2, trunk 0.3, lower extremities 0.3.
 *     "The final EASI score ranges from 0-72." (The guide prints no worked example and no severity bands.)
 *   [LESHEM] Leshem YA, Hajar T, Hanifin JM, Simpson EL. What the Eczema Area and Severity Index score tells us
 *     about the severity of atopic dermatitis: an interpretability study. Br J Dermatol 2015;172:1353–1357,
 *     https://academic.oup.com/bjd/article-abstract/172/5/1353/6616225 — abstract (paediatric and adult patients):
 *     "0 = clear; 0·1–1·0 = almost clear; 1·1–7·0 = mild; 7·1–21·0 = moderate; 21·1–50·0 = severe;
 *     50·1–72·0 = very severe".
 *
 *   THE PATIENT'S AGE IS ASKED (`yas`), and there is no result without it: the tool used the weights of a patient of
 *   8 or over for everybody. A child under 8 with only the head and neck involved, all four signs 3 and an area
 *   score of 6, was given 7.2; with the guide's multiplier for that age the score is 14.4.
 *   THE BANDS ARE THE PUBLISHED STRATA, six of them (the tool had three: mild below 7, moderate 7 to 20.9, severe from
 *   21, so that 0 was "mild", 7.0 "moderate" and 21.0 "severe"). The score has one decimal, so the strata leave no gap.
 *   NOT DONE: the guide allows the half points 1.5 and 2.5 for a sign; the fields take whole points only.
 */
export const EASI_YAS = ['yedi_ve_alti', 'sekiz_ve_ustu'] as const
const AGIRLIK_SEKIZ_ALTI: Readonly<Record<Bolge, number>> = { bas: 0.2, ust: 0.2, govde: 0.3, alt: 0.3 }
export const EASI_BANTLARI = ['temiz', 'neredeyse_temiz', 'hafif', 'orta', 'siddetli', 'cok_siddetli'] as const
export const easiBandi = (v: number): (typeof EASI_BANTLARI)[number] => (v === 0 ? 'temiz' : v <= 1 ? 'neredeyse_temiz' : v <= 7 ? 'hafif' : v <= 21 ? 'orta' : v <= 50 ? 'siddetli' : 'cok_siddetli')
export const EASI: AracTanimi = {
  anahtar: 'easi',
  tur: 'olcek',
  alanlar: [secim('yas', EASI_YAS), ...DERI_BOLGELERI.flatMap((b) => [puan(`${b}_e`, 0, 3), puan(`${b}_i`, 0, 3), puan(`${b}_d`, 0, 3), puan(`${b}_l`, 0, 3), puan(`${b}_a`, 0, 6)])],
  cikti: { sayilar: ['easi'], bantlar: [...EASI_BANTLARI], uyarilar: [], tarihler: [] },
  // Nothing else in the result follows from the band: a country may state its own bands over the score.
  bantSerbest: true,
  kaynak: 'Hanifin JM, Thurston M, Omoto M, et al. Exp Dermatol 2001;10:11-18. Leshem YA, Hajar T, Hanifin JM, Simpson EL. Br J Dermatol 2015;172:1353-1357.',
  hesapla: (g) => {
    if (g.yas !== 'yedi_ve_alti' && g.yas !== 'sekiz_ve_ustu') return BOS_SONUC
    const v = agirlikliToplam(g, ['e', 'i', 'd', 'l'], g.yas === 'yedi_ve_alti' ? AGIRLIK_SEKIZ_ALTI : AGIRLIK)
    return v === null ? BOS_SONUC : { tamam: true, sayilar: [{ anahtar: 'easi', deger: v, ondalik: 1, enCok: 72 }], bant: easiBandi(v), uyarilar: [], tarihler: [] }
  },
}

/**
 * SCORAD = A / 5 + 7 × B / 2 + C: A the extent in per cent of body surface (0 to 100), B six intensity items (0 to 3
 * each), C itch and sleep loss as the patient rates them (0 to 10 each). Total 0 to 103.
 * Source: European Task Force on Atopic Dermatitis. Severity scoring of atopic dermatitis: the SCORAD index.
 * Dermatology 1993;186:23–31. Stands beside specialties/dermatoloji/engines/score-calculator.ts → scorad, scoradBandi.
 *
 * ── NOTYA-ULKE-ARAC-DUZELTME-01, fault 9. Sources opened on 2026-10-10: ──
 *   [SCORAD-RIGHTS] Pierre Fabre Eczema Foundation (it holds the user rights of the SCORAD application),
 *     https://www.pierrefabreeczemafoundation.org/en/po-scorad-tool — "Between 0 and 25" a minor case, "Between 25
 *     and 50" a moderate case, "Above 50" a severe case.
 *   [ORANJE] Oranje A, Glazenburg E, Wolkerstorfer A, de Waard-van der Spek F. Practical issues on interpretation of
 *     scoring atopic dermatitis: the SCORAD index, objective SCORAD and the three-item severity score. Br J Dermatol 2007;157:645–648,
 *     https://repub.eur.nl/pub/35156 — the formula "A/5 + 7B/2 + C" and the maximum 103. (The page returned no
 *     severity limits; the paper's full text was not opened.)
 *
 *   EXACTLY 50 IS MODERATE: severe is ABOVE 50 on the rights holder's page; the tool called 50.0 severe.
 *   A SCORE OF 0 GETS NO SEVERITY WORD (the tool called it "mild").
 *   NOT SETTLED BY THE PAGE OPENED: on which side exactly 25 falls ("between 0 and 25" and "between 25 and 50" both
 *   name it). The tool keeps 25 as moderate, as it was; the paper that would settle it was not opened.
 *   A form that is not finished has no result: an empty box used to count as 0.
 */
export const SCORAD_SIDDET = ['eritem', 'odem', 'sizinti', 'ekskoriasyon', 'likenifikasyon', 'kuruluk'] as const
export const scoradBandi = (v: number): string | null => (v === 0 ? null : v < 25 ? 'hafif' : v <= 50 ? 'orta' : 'siddetli')
export const SCORAD: AracTanimi = {
  anahtar: 'scorad',
  tur: 'olcek',
  alanlar: [sayi('yayginlik', 0, 100, { birim: '%' }), ...SCORAD_SIDDET.map((k) => puan(k, 0, 3)), puan('kasinti', 0, 10), puan('uykusuzluk', 0, 10)],
  cikti: { sayilar: ['scorad', 'a', 'b', 'c'], bantlar: ['hafif', 'orta', 'siddetli'], uyarilar: [], tarihler: [] },
  // Nothing else in the result follows from the band: a country may state its own bands over the score.
  bantSerbest: true,
  kaynak: 'European Task Force on Atopic Dermatitis. Dermatology 1993;186:23-31.',
  hesapla: (g) => {
    const siddet = SCORAD_SIDDET.map((k) => g[k])
    if (!sayiMi(g.yayginlik) || !siddet.every(sayiMi) || !sayiMi(g.kasinti) || !sayiMi(g.uykusuzluk)) return BOS_SONUC
    const a = g.yayginlik, b = (siddet as number[]).reduce((t, x) => t + x, 0), c = g.kasinti + g.uykusuzluk
    const v = bir(a / 5 + 3.5 * b + c)
    return { tamam: true, sayilar: [{ anahtar: 'scorad', deger: v, ondalik: 1, enCok: 103 }, { anahtar: 'a', deger: a, ondalik: 1, enCok: 100 }, { anahtar: 'b', deger: b, ondalik: 0, enCok: 18 }, { anahtar: 'c', deger: c, ondalik: 0, enCok: 20 }], bant: scoradBandi(v), uyarilar: [], tarihler: [] }
  },
}

/**
 * Patch test: the day the patches were applied → the two reading days, day 2 and day 4.
 * Source: Johansen JD, Aalto-Korte K, Agner T, et al. European Society of Contact Dermatitis guideline for diagnostic
 * patch testing. Contact Dermatitis 2015;73:195–221. The series of allergens is not in the kit.
 * Stands beside specialties/dermatoloji/engines/patch-calendar.ts → plannedReads.
 */
export const YAMA_OKUMA: AracTanimi = {
  anahtar: 'yama-okuma',
  tur: 'takvim',
  alanlar: [tarih('uygulama')],
  cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: ['d2', 'd4'] },
  kaynak: 'Johansen JD, Aalto-Korte K, Agner T, et al. Contact Dermatitis 2015;73:195-221.',
  hesapla: (g) => (gunMu(g.uygulama) ? { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'd2', tarih: gunEkle(g.uygulama, 2) }, { anahtar: 'd4', tarih: gunEkle(g.uygulama, 4) }] } : BOS_SONUC),
}

export const CERRAHI_DAHILIYE_DERM: readonly AracTanimi[] = [COCUK_PREPOST, YARA_DREN, KDIGO, PASI, EASI, SCORAD, YAMA_OKUMA]
