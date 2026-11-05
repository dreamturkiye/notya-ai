/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — GYNAECOLOGICAL CLASSIFICATIONS: FIGO PALM-COEIN with the FIGO leiomyoma
 * subclassification (types 0-8 and hybrids), revised ASRM endometriosis staging, #Enzian, and a myomectomy planning
 * summary. Obstetrics and gynaecology only. Pure, country-neutral: KEYS, NUMBERS AND CLASSIFICATION CODES ONLY.
 *
 *   PALM-COEIN          Munro MG, Critchley HOD, Broder MS, Fraser IS. FIGO classification system (PALM-COEIN) for causes
 *                       of abnormal uterine bleeding. Int J Gynecol Obstet 2011;113:3-13; revised: Munro MG et al., The two
 *                       FIGO systems for normal and abnormal uterine bleeding symptoms and classification of causes of
 *                       abnormal uterine bleeding in the reproductive years: 2018 revisions. Int J Gynecol Obstet
 *                       2018;143:393-408 (leiomyoma types 0-8 and hybrid "x-y"; notation P A L(SM/O) M - C O E I N).
 *   rASRM               American Society for Reproductive Medicine. Revised ASRM classification of endometriosis: 1996.
 *                       Fertil Steril 1997;67:817-821 (points table; stage I 1-5, II 6-15, III 16-40, IV over 40).
 *   #Enzian             Keckstein J et al. The #Enzian classification: a comprehensive non-invasive and surgical
 *                       description system for endometriosis. Acta Obstet Gynecol Scand 2021;100:1165-1175 (compartments
 *                       P, O, T, A, B, C and F; notation "#Enzian(s) P2, O1/2, T2/3, A2, B1/1, C3, FA").
 * These were written from the published systems as the job knows them and were NOT re-opened in this session: listed for
 * a clinician's sign-off in docs/OPEN-COMMITMENTS.md KD-OPERATOR-01.
 */

// ───────────────────────── FIGO leiomyoma subclassification ─────────────────────────

/** 0 pedunculated intracavitary · 1 submucous <50% intramural · 2 submucous >=50% intramural · 3 contacts endometrium, 100% intramural ·
 *  4 intramural · 5 subserous >=50% intramural · 6 subserous <50% intramural · 7 subserous pedunculated · 8 other (cervical, parasitic) ·
 *  hybrids "x-y": submucous and subserous, each less than half the diameter in the endometrial and peritoneal cavities. */
export const FIGO_MYOM_TIPLERI = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '2-5', '1-5', '2-6', '1-6'] as const
export type FigoMyomTipi = (typeof FIGO_MYOM_TIPLERI)[number]
const SUBMUKOZ = new Set(['0', '1', '2'])

export const PALM = ['P', 'A', 'L', 'M'] as const
export const COEIN = ['C', 'O', 'E', 'I', 'N'] as const

/** The FIGO notation: "P0 A0 L1(SM) M0 - C0 O1 E0 I0 N0". L is (SM) where any leiomyoma is type 0-2 (or a hybrid starting 1-2), else (O). */
export function palmCoeinKodu(g: { palm: readonly string[]; coein: readonly string[]; myomTipleri?: readonly string[] }): string {
  const p = new Set(g.palm)
  const c = new Set(g.coein)
  const tipler = g.myomTipleri || []
  const lVar = p.has('L') || tipler.length > 0
  const sm = tipler.some((t) => SUBMUKOZ.has(t.split('-')[0]))
  const l = lVar ? `L1(${sm ? 'SM' : 'O'})` : 'L0'
  const palm = `P${p.has('P') ? 1 : 0} A${p.has('A') ? 1 : 0} ${l} M${p.has('M') ? 1 : 0}`
  const coein = COEIN.map((k) => `${k}${c.has(k) ? 1 : 0}`).join(' ')
  return `${palm} - ${coein}`
}

// ───────────────────────── myomectomy planning summary ─────────────────────────

export type Myom = { tip: string; boyutMm: number | null; konum?: string }
export type MyomOzeti = {
  sayi: number
  enBuyukMm: number | null
  toplamCapMm: number
  submukoz: number
  intramural: number
  subseroz: number
  diger: number
  hibrit: number
  /** Keys of facts the record shows (never a route or a decision). */
  bayraklar: string[]
}
export function myomOzeti(myomlar: readonly Myom[]): MyomOzeti {
  const gecerli = myomlar.filter((m) => (FIGO_MYOM_TIPLERI as readonly string[]).includes(m.tip))
  const boyutlar = gecerli.map((m) => m.boyutMm).filter((x): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0)
  const o: MyomOzeti = { sayi: gecerli.length, enBuyukMm: boyutlar.length ? Math.max(...boyutlar) : null, toplamCapMm: boyutlar.reduce((a, b) => a + b, 0), submukoz: 0, intramural: 0, subseroz: 0, diger: 0, hibrit: 0, bayraklar: [] }
  for (const m of gecerli) {
    if (m.tip.includes('-')) o.hibrit++
    else if (SUBMUKOZ.has(m.tip)) o.submukoz++
    else if (m.tip === '3' || m.tip === '4') o.intramural++
    else if (m.tip === '5' || m.tip === '6' || m.tip === '7') o.subseroz++
    else o.diger++
  }
  if (o.submukoz > 0) o.bayraklar.push('kavite_ile_iliskili') // types 0-2: the cavity is involved
  if (gecerli.some((m) => m.tip === '3')) o.bayraklar.push('endometriuma_temas') // type 3: myometrial closure may reach the endometrium
  if (o.hibrit > 0) o.bayraklar.push('transmural_hibrit')
  if (gecerli.some((m) => m.tip === '7')) o.bayraklar.push('sapli_subseroz')
  if (gecerli.some((m) => m.tip === '8')) o.bayraklar.push('servikal_veya_parazitik')
  if (gecerli.length < myomlar.length) o.bayraklar.push('tipi_bilinmeyen_var')
  return o
}

// ───────────────────────── revised ASRM (1996) ─────────────────────────

/** Size bands of a lesion and the extent of an adhesion, as the form asks them. */
export const ASRM_BOYUT = ['0', 'lt1', '1_3', 'gt3'] as const
export const ASRM_YAPISIKLIK = ['0', 'lt13', '13_23', 'gt23'] as const
export const ASRM_DOUGLAS = ['yok', 'kismi', 'tam'] as const

const PUAN = {
  periton_yuzeyel: [0, 1, 2, 4], periton_derin: [0, 2, 4, 6],
  over_yuzeyel: [0, 1, 2, 4], over_derin: [0, 4, 16, 20],
  film: [0, 1, 2, 4], yogun: [0, 4, 8, 16],
} as const
const ix = (x: unknown, liste: readonly string[]) => Math.max(0, liste.indexOf(String(x ?? '0')))

export type AsrmGirdi = Partial<Record<
  | 'periton_yuzeyel' | 'periton_derin' | 'over_sag_yuzeyel' | 'over_sag_derin' | 'over_sol_yuzeyel' | 'over_sol_derin'
  | 'over_sag_film' | 'over_sag_yogun' | 'over_sol_film' | 'over_sol_yogun' | 'tup_sag_film' | 'tup_sag_yogun' | 'tup_sol_film' | 'tup_sol_yogun'
  | 'douglas', string>> & { fimbria_sag_kapali?: boolean; fimbria_sol_kapali?: boolean }

export const ASRM_EVRELERI = ['I', 'II', 'III', 'IV'] as const
/** Total points and stage (null at 0 points). A tube whose fimbriated end is completely enclosed scores 16 for that tube. */
export function asrmEvre(g: AsrmGirdi): { puan: number; evre: (typeof ASRM_EVRELERI)[number] | null } {
  let p = 0
  p += PUAN.periton_yuzeyel[ix(g.periton_yuzeyel, ASRM_BOYUT)] + PUAN.periton_derin[ix(g.periton_derin, ASRM_BOYUT)]
  for (const t of ['sag', 'sol'] as const) {
    p += PUAN.over_yuzeyel[ix(g[`over_${t}_yuzeyel`], ASRM_BOYUT)] + PUAN.over_derin[ix(g[`over_${t}_derin`], ASRM_BOYUT)]
    p += PUAN.film[ix(g[`over_${t}_film`], ASRM_YAPISIKLIK)] + PUAN.yogun[ix(g[`over_${t}_yogun`], ASRM_YAPISIKLIK)]
    const tupYogun = (t === 'sag' ? g.fimbria_sag_kapali : g.fimbria_sol_kapali) ? 16 : PUAN.yogun[ix(g[`tup_${t}_yogun`], ASRM_YAPISIKLIK)]
    p += PUAN.film[ix(g[`tup_${t}_film`], ASRM_YAPISIKLIK)] + tupYogun
  }
  const d = String(g.douglas ?? 'yok')
  p += d === 'tam' ? 40 : d === 'kismi' ? 4 : 0
  const evre = p <= 0 ? null : p <= 5 ? 'I' : p <= 15 ? 'II' : p <= 40 ? 'III' : 'IV'
  return { puan: p, evre }
}

// ───────────────────────── #Enzian (2021) ─────────────────────────

export const ENZIAN_YONTEM = ['s', 'u', 'm'] as const // surgical, ultrasound, MRI
export const ENZIAN_DERECE = ['0', '1', '2', '3', 'x'] as const
export const ENZIAN_F = ['FA', 'FB', 'FU', 'FI', 'FO'] as const

export type EnzianGirdi = {
  yontem: string
  P?: string; A?: string; C?: string
  O_sol?: string; O_sag?: string; T_sol?: string; T_sag?: string; B_sol?: string; B_sag?: string
  F?: readonly string[]
}
const d = (x: unknown) => ((ENZIAN_DERECE as readonly string[]).includes(String(x)) ? String(x) : '0')
/** "#Enzian(s) P2, O1/2, T2/3, A2, B1/1, C3, FA, FB" — left before right, as the publication writes the paired compartments. */
export function enzianKodu(g: EnzianGirdi): string | null {
  if (!(ENZIAN_YONTEM as readonly string[]).includes(g.yontem)) return null
  const f = (g.F || []).filter((x) => (ENZIAN_F as readonly string[]).includes(x))
  const parca = [`P${d(g.P)}`, `O${d(g.O_sol)}/${d(g.O_sag)}`, `T${d(g.T_sol)}/${d(g.T_sag)}`, `A${d(g.A)}`, `B${d(g.B_sol)}/${d(g.B_sag)}`, `C${d(g.C)}`, ...f]
  return `#Enzian(${g.yontem}) ${parca.join(', ')}`
}
