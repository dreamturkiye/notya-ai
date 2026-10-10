/**
 * NOTYA-ULKE-ARAC-DUZELTME-01 — THE FOURTEEN CORRECTIONS OF THE SHARED TOOLS, each held to its source.
 *
 * Six country audits (docs/araclar-denetim/<CODE>.md on the branches araclar-denetim/<code>) checked the kit's tools
 * against national and primary sources and named fourteen faults. Each was corrected only with its primary source
 * OPEN in the correcting session (2026-10-10); the source is cited beside the correction in the kit and again here,
 * and wherever a source prints a worked example, that example is a test below. The audits' own worked examples are
 * tests too: they are what a doctor would have seen before.
 *
 * What the tool showed before and shows now, fault by fault: docs/araclar-denetim/DUZELTMELER.md.
 * The same corrections against the pre-split application's answers: ./esdegerlik.test.ts, "DELIBERATE DIFFERENCES".
 * A country using what was opened to it: ../ornekUlke.test.ts, part 8 (the kit's test country).
 *
 * SOURCES (each opened on 2026-10-10):
 *   [NCPDP]     NCPDP, "Standardize the Dosing Designations on Prescription Container Labels for Oral Liquid Medications to Metric (mL) Only" — https://www.fda.gov/media/88498/download
 *   [AHS]       Alberta Health Services, Connect Care, "Decimal precision for oral medication measurements" (2019-11-14) — https://support.connect-care.ca/2019/11/14.html
 *   [EASI-GUIDE] HOME, "EASI User Guide" (January 2017, v3) — https://www.homeforeczema.org/documents/easi-user-guide-jan-2017-v3.pdf
 *   [LESHEM]    Leshem YA, Hajar T, Hanifin JM, Simpson EL. Br J Dermatol 2015;172:1353–1357 — https://academic.oup.com/bjd/article-abstract/172/5/1353/6616225
 *   [NHSN]      CDC, National Healthcare Safety Network, "FAQs: Antimicrobial Use (AU) Option" — https://www.cdc.gov/nhsn/faqs/faq-au.html
 *   [ASA]       American Society of Anesthesiologists, "Statement on ASA Physical Status Classification System" — https://asahq.org/resources/clinical-information/asa-physical-status-classification-system
 *   [KDIGO-FULL] KDIGO 2024 CKD Guideline, Kidney Int 2024;105(4S) — https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf
 *   [KDIGO-SUM] KDIGO 2024 CKD Guideline, Summary of Recommendation Statements and Practice Points — https://kdigo.org/wp-content/uploads/2026/05/KDIGO-2024-CKD-Guideline-Summary-Recommendations-and-Practice-Points.pdf
 *   [ASHA]      American Speech-Language-Hearing Association, "Degree of Hearing Loss" (Clark 1981) — https://asha.org/public/hearing/degree-of-hearing-loss
 *   [AAO-HNS]   AAO-HNS position statement "Red Flags-Warning of Ear Disease" — https://www.entnet.org/resource/position-statement-red-flags-warning-of-ear-disease/
 *   [HEADS-UP]  CDC HEADS UP, "Returning to Sports" — https://www.cdc.gov/heads-up/guidelines/returning-to-sports.html
 *   [CMAJ]      Johns P, Quinn J. CMAJ 2020;192(8):E182-6 — https://cmaj.ca/content/cmaj/192/8/e182.full.pdf
 *   [CADTH]     CADTH, Clinical Review Report: Guselkumab, Appendix 5 — https://www.ncbi.nlm.nih.gov/books/NBK534046/
 *   [SCORAD-RIGHTS] Pierre Fabre Eczema Foundation, PO-SCORAD — https://www.pierrefabreeczemafoundation.org/en/po-scorad-tool
 *   [GABBETT]   Gabbett TJ. Br J Sports Med 2016;50:273–280 — https://bjsm.bmj.com/content/50/5/273
 *   [AAFP]      Barstow C, Rerucha C. Am Fam Physician 2015;92(1):43-50 — https://www.aafp.org/afp/2015/0701/p43.pdf
 *   [RCPCH]     UK growth chart, boys 2–18 years (© RCPCH 2012) — https://www.sign.ac.uk/media/1436/boys_2-18_years_growth_chart.pdf
 *   [NGSP]      NGSP, "IFCC Standardization: IFCC and NGSP" — https://ngsp.org/ifccngsp.asp
 *   [DAS]       DAS28-CRP calculator of the score's developers — https://www.das-score.nl/das28/DAScalculators/DAS28_CRP_4VAR.html
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { birimdenKanonige, kanoniktenBirime, LAB_BIRIMLERI, type BirimOrtami } from './birimler'
import { girdiyiCoz, hamdanGosterilen, yazilanBirim } from './girdi'
import { KIT_ARACLARI, kitAraci } from './katalog'
import { aracOzeti, sayiMetni, type Yazici } from './paket'
import type { AracGirdisi, AracSonucu, AracTanimi, PaketAraci } from './tipler'
import { etkinTanim, tabloAnahtarlari, ulkeOrtami } from './uyarlama'
import { gosterimOndaligi, sondakiSifirlariAt, yazilanOndalik } from './yazim'
import { KDIGO_A_SINIRLARI, easiBandi, kdigoA, scoradBandi, yuzde20denFazlaDustu } from './tanimlar/cerrahiDahiliyeDerm'
import { PTA_ASIMETRI_USTU, ptaBandi } from './tanimlar/kalpKbb'
import { KUCUK_HACIM_ML, PSA_KISA_ARALIK_GUN, yuklenmeDuzeyi } from './tanimlar/ortoPediRadyoRoma'

const KOK = resolve(__dirname, '../../..')
const BUGUN = '2026-10-10'
const O = { bugun: BUGUN, p: {} }
const arac = (k: string): AracTanimi => kitAraci(k)!
const calis = (k: string, g: AracGirdisi, p: Record<string, number> = {}): AracSonucu => arac(k).hesapla(g, { bugun: BUGUN, p })
const sayi = (s: AracSonucu, k: string): number | undefined => s.sayilar.find((x) => x.anahtar === k)?.deger
/** How an English-speaking pack and the Uzbek pack write a number: the decimal mark, and nothing else of them. */
const yaz = (ondalikAyraci: string, sifirsiz: boolean): Yazici => {
  const s = (d: number, n: number) => d.toFixed(n).replace('.', ondalikAyraci)
  return { sayi: s, tarih: (iso) => iso, birim: (k) => k, ...(sifirsiz ? { doz: (d: number, n: number) => sondakiSifirlariAt(s(d, n), ondalikAyraci) } : {}) }
}
const M = { arac: { oran: '%1 / %2', madde: '%' } } as never
const EN = yaz('.', true), UZ = yaz(',', false)
const yazilan = (y: Yazici, s: AracSonucu, k: string): string => sayiMetni(s.sayilar.find((x) => x.anahtar === k)!, M, y)

describe('fault 1 — dose arithmetic: the volume is not rounded, and an amount is written by the country\'s own rule', () => {
  // The audits' example (docs/araclar-denetim/CA.md, fault 2): a baby of 4 kg at 2 mg/kg for one dose, liquid of 50 mg in 1 mL.
  const bebek = { kilo: 4, mg_kg: 2, mod: 'doz', doz_sayisi: 1, kons_mg: 50, kons_ml: 1, tavan_doz_mg: null, tavan_gun_mg: null }
  // The audits' example (AU.md fault 1, GB.md fault 4, NZ.md fault 2, CA.md fault 3): 16 kg at 10 mg/kg for one dose, liquid of 160 mg in 5 mL.
  const cocuk = { kilo: 16, mg_kg: 10, mod: 'doz', doz_sayisi: 1, kons_mg: 160, kons_ml: 5, tavan_doz_mg: null, tavan_gun_mg: null }

  it('8 mg of a 50 mg/mL liquid is 0.16 mL — shown as 0.16 mL, never as 0.2 mL', () => {
    const s = calis('doz-hesabi', bebek)
    assert.equal(sayi(s, 'doz_mg'), 8)
    assert.equal(sayi(s, 'doz_ml'), 0.16)
    assert.equal(yazilan(EN, s, 'doz_ml'), '0.16 mL')
    assert.equal(yazilan(UZ, s, 'doz_ml'), '0,160 mL')
  })

  it('NO STEP: a volume is whatever the arithmetic gives — no multiple of 0.1 mL, of 0.01 mL or of anything else', () => {
    // 10 mg of a 3 mg/mL liquid is 3.333… mL: not 3.3, and not 3.33 either — only WRITTEN to two places
    const s = calis('doz-hesabi', { ...bebek, kilo: 5, kons_mg: 3 })
    assert.ok(Math.abs(sayi(s, 'doz_ml')! - 10 / 3) < 1e-12)
    assert.equal(yazilan(EN, s, 'doz_ml'), '3.33 mL')
    // a volume far below what was the rounding step is still the volume
    const kucuk = calis('doz-hesabi', { ...bebek, kilo: 0.5, mg_kg: 0.1, kons_mg: 10 })
    assert.ok(Math.abs(sayi(kucuk, 'doz_ml')! - 0.005) < 1e-12)
    assert.equal(yazilan(EN, kucuk, 'doz_ml'), '0.005 mL', 'three significant figures: a small amount is never written 0.00 or 0.01')
    assert.equal(yazilan(EN, kucuk, 'doz_mg'), '0.05 mg')
    // the capped dose is not rounded either
    const tavanli = calis('doz-hesabi', { ...cocuk, kons_mg: 30, kons_ml: 1, tavan_doz_mg: 100 })
    assert.ok(Math.abs(sayi(tavanli, 'tavanli_doz_ml')! - 100 / 30) < 1e-12)
  })

  it('TWO CAUTIONS in the result: with every volume, that it is not rounded; below 1 mL, that it is small', () => {
    assert.deepEqual(calis('doz-hesabi', bebek).uyarilar, ['ml_yuvarlanmadi', 'ml_kucuk'])
    assert.deepEqual(calis('doz-hesabi', cocuk).uyarilar, ['ml_yuvarlanmadi'], '5 mL: not small')
    assert.equal(KUCUK_HACIM_ML, 1)
    assert.deepEqual(calis('doz-hesabi', { ...bebek, kons_mg: 8.01 }).uyarilar, ['ml_yuvarlanmadi', 'ml_kucuk'], 'just below 1 mL')
    assert.deepEqual(calis('doz-hesabi', { ...bebek, kons_mg: 8 }).uyarilar, ['ml_yuvarlanmadi'], 'exactly 1 mL')
    // no concentration, no volume: no caution about a volume
    assert.deepEqual(calis('doz-hesabi', { ...bebek, kons_mg: null, kons_ml: null }).uyarilar, [])
    // a capped dose whose volume is small is cautioned too
    assert.ok(calis('doz-hesabi', { ...cocuk, kons_mg: 200, kons_ml: 1, tavan_doz_mg: 100 }).uyarilar.includes('ml_kucuk'))
    assert.deepEqual([...arac('doz-hesabi').cikti.uyarilar], ['tavan_doz', 'tavan_gun', 'kilo_birim', 'ml_yuvarlanmadi', 'ml_kucuk'])
  })

  it('NO ZERO AFTER THE DECIMAL POINT where the country forbids one: "160 mg" and "5 mL", never "160.00 mg" and "5.0 mL" ([NCPDP]: "Do NOT use trailing zeros after a decimal point")', () => {
    const s = calis('doz-hesabi', cocuk)
    assert.equal(yazilan(EN, s, 'doz_mg'), '160 mg')
    assert.equal(yazilan(EN, s, 'doz_ml'), '5 mL')
    assert.equal(yazilan(EN, s, 'gunluk_mg'), '160 mg')
    // 2.5 keeps its figure; the leading zero is always written ([NCPDP]: "Use leading zeros (e.g., "0.5" mL, NOT ".5" mL)")
    assert.equal(yazilan(EN, calis('doz-hesabi', { ...cocuk, mg_kg: 5 }), 'doz_ml'), '2.5 mL')
    assert.equal(yazilan(EN, calis('doz-hesabi', { ...cocuk, mg_kg: 1 }), 'doz_ml'), '0.5 mL')
  })

  it('…and the decimals stand where the national order itself writes "1,0" (Uzbekistan, Order No. 121 of 01.07.2020, clause 19: "(0,001; 0,5; 1,0)")', () => {
    const s = calis('doz-hesabi', cocuk)
    assert.equal(yazilan(UZ, s, 'doz_mg'), '160,00 mg')
    assert.equal(yazilan(UZ, s, 'doz_ml'), '5,00 mL')
  })

  it('every amount of a medicine in the result is marked as one; the hours between two doses are not', () => {
    const s = calis('doz-hesabi', { ...cocuk, tavan_doz_mg: 100 })
    assert.deepEqual(s.sayilar.filter((x) => x.doz).map((x) => x.anahtar), ['doz_mg', 'gunluk_mg', 'doz_ml', 'gunluk_ml', 'tavanli_doz_mg', 'tavanli_doz_ml'])
    assert.equal(arac('doz-hesabi').dozYazar, true)
    // only this tool of the kit writes an amount of a medicine
    assert.deepEqual(KIT_ARACLARI.filter((t) => t.dozYazar).map((t) => t.anahtar), ['doz-hesabi'])
  })

  it('how a number is written: the rules themselves', () => {
    assert.deepEqual([0.16, 5, 160, 2.5, 1 / 6, 12.345, 0.0003, 0].map((v) => gosterimOndaligi(v, 2, 3)), [3, 2, 2, 2, 3, 2, 6, 2])
    assert.equal(gosterimOndaligi(0.16, 1), 1, 'without a number of significant figures: the places stated')
    assert.deepEqual(['5.00', '2.50', '0.160', '160', '1,500', '10.0', '100', '0.05'].map((m) => sondakiSifirlariAt(m, '.')), ['5', '2.5', '0.16', '160', '1,500', '10', '100', '0.05'])
    assert.equal(sondakiSifirlariAt('5,00', ','), '5')
    assert.equal(sondakiSifirlariAt('1 500,50', ','), '1 500,5')
  })

  it('THE SUMMARY REPEATS A TYPED NUMBER WITH EVERY PLACE IT HAS: a dose typed as 0.15 mg/kg is not copied into the note as "0.2 mg/kg"', () => {
    assert.deepEqual([0.15, 2.5, 10, 0.125, 4.25].map(yazilanOndalik), [2, 1, 0, 3, 2])
    const t = arac('doz-hesabi')
    const o: BirimOrtami = { birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }, lab: {}, sayi: { ondalikAyraci: '.', binlikAyraci: ',' } }
    const ham = { kilo: '8.2', mg_kg: '0.15', mod: 'doz', doz_sayisi: '2' }
    const g = girdiyiCoz(t.alanlar, ham, o)
    const paket = { anahtar: 'doz-hesabi', roller: null, metin: { ad: { x: 'T' }, aciklama: { x: '' }, alanlar: { kilo: { x: 'Weight' }, mg_kg: { x: 'Per kg' }, mod: { x: 'For' }, doz_sayisi: { x: 'Doses' } }, secenekler: { mod: { doz: { x: 'one dose' } } }, sayilar: { doz_mg: { x: 'Dose' }, gunluk_mg: { x: 'Day' }, aralik_saat: { x: 'Every' } }, not: { x: 'N' } } } as unknown as PaketAraci
    const ozet = aracOzeti({ tanim: t, paket }, hamdanGosterilen(t.alanlar, ham, g, o), t.hesapla(g, O), 'x', M, EN, o)
    assert.match(ozet, /\nWeight: 8\.2 kg\nPer kg: 0\.15 mg\/kg\n/)
    // the result itself is WRITTEN to three significant figures (the arithmetic keeps every figure): 8.2 × 0.15 = 1.23 mg, 2.46 mg a day
    assert.match(ozet, /\nDose: 1\.23 mg\nDay: 2\.46 mg\n/, 'no zero after the last figure')
  })
})

describe('faults 2 and 9 — EASI: the patient\'s age, the instrument\'s own weights under 8, the published strata', () => {
  // The audits' example (US.md fault 3): a young child, head and neck only, all four signs 3, area score 6.
  const basBoyun = { bas_e: 3, bas_i: 3, bas_d: 3, bas_l: 3, bas_a: 6, ust_a: 0, govde_a: 0, alt_a: 0 }
  const hepsi = (belirti: number, alan: number) => Object.fromEntries(['bas', 'ust', 'govde', 'alt'].flatMap((b) => [[`${b}_e`, belirti], [`${b}_i`, belirti], [`${b}_d`, belirti], [`${b}_l`, belirti], [`${b}_a`, alan]]))

  it('[EASI-GUIDE] "Patients under 8 years of age": head/neck 0.2 — the child scores 14.4 where the tool gave 7.2', () => {
    assert.equal(sayi(calis('easi', { yas: 'yedi_ve_alti', ...basBoyun }), 'easi'), 14.4)
    assert.equal(sayi(calis('easi', { yas: 'sekiz_ve_ustu', ...basBoyun }), 'easi'), 7.2)
  })

  it('[EASI-GUIDE] the two sets of multipliers, region by region: 0.1 / 0.2 / 0.3 / 0.4 from 8 years, 0.2 / 0.2 / 0.3 / 0.3 under 8', () => {
    const tek = (yas: string, bolge: string) => sayi(calis('easi', { yas, bas_a: 0, ust_a: 0, govde_a: 0, alt_a: 0, [`${bolge}_e`]: 1, [`${bolge}_i`]: 1, [`${bolge}_d`]: 1, [`${bolge}_l`]: 1, [`${bolge}_a`]: 1 }), 'easi')
    // four signs of 1 and an area score of 1 give 4 × the region's multiplier
    assert.deepEqual(['bas', 'ust', 'govde', 'alt'].map((b) => tek('sekiz_ve_ustu', b)), [0.4, 0.8, 1.2, 1.6])
    assert.deepEqual(['bas', 'ust', 'govde', 'alt'].map((b) => tek('yedi_ve_alti', b)), [0.8, 0.8, 1.2, 1.2])
  })

  it('[EASI-GUIDE] "The final EASI score ranges from 0-72" — at either age', () => {
    for (const yas of ['yedi_ve_alti', 'sekiz_ve_ustu']) { assert.equal(sayi(calis('easi', { yas, ...hepsi(3, 6) }), 'easi'), 72); assert.equal(sayi(calis('easi', { yas, ...hepsi(0, 0) }), 'easi'), 0) }
  })

  it('NO AGE, NO SCORE; an unfinished region, no score (an empty box used to count as 0)', () => {
    assert.equal(calis('easi', basBoyun).tamam, false)
    assert.equal(calis('easi', { yas: 'sekiz_ve_ustu', bas_e: 3 }).tamam, false)
    assert.equal(calis('easi', { yas: 'sekiz_ve_ustu', ...basBoyun, bas_l: null }).tamam, false, 'a region with an area and a sign missing')
    assert.equal(calis('easi', { yas: 'sekiz_ve_ustu', ...basBoyun, alt_a: null }).tamam, false, 'a region without its area score')
    assert.equal(calis('easi', { yas: 'sekiz_ve_ustu', ...basBoyun }).tamam, true, 'a region whose area is 0 needs no sign')
    assert.equal(arac('easi').alanlar[0].anahtar, 'yas', 'the age is asked first')
  })

  it('[LESHEM] "0 = clear; 0·1–1·0 = almost clear; 1·1–7·0 = mild; 7·1–21·0 = moderate; 21·1–50·0 = severe; 50·1–72·0 = very severe"', () => {
    const beklenen: [number, string][] = [[0, 'temiz'], [0.1, 'neredeyse_temiz'], [1, 'neredeyse_temiz'], [1.1, 'hafif'], [7, 'hafif'], [7.1, 'orta'], [21, 'orta'], [21.1, 'siddetli'], [50, 'siddetli'], [50.1, 'cok_siddetli'], [72, 'cok_siddetli']]
    for (const [v, bant] of beklenen) assert.equal(easiBandi(v), bant, String(v))
    // the audits' examples (US.md fault 4): 7.0 was "Moderate", 21.0 "Severe", 0 "Mild"
    assert.equal(calis('easi', { yas: 'sekiz_ve_ustu', ...hepsi(0, 0) }).bant, 'temiz')
    assert.deepEqual([...arac('easi').cikti.bantlar], ['temiz', 'neredeyse_temiz', 'hafif', 'orta', 'siddetli', 'cok_siddetli'])
  })
})

describe('fault 3 — antibiotic course: the first day is day 1', () => {
  it('7 days from 1 October end on 7 October, not on 8 October ([NHSN]: a day on which the medicine is given is one antimicrobial day)', () => {
    assert.deepEqual(calis('antibiyotik-sure', { baslangic: '2026-10-01', sure_gun: 7, kontrol: null, sinif: null }).tarihler, [{ anahtar: 'bitis', tarih: '2026-10-07' }, { anahtar: 'kontrol', tarih: '2026-10-07' }])
  })
  it('a course of one day ends on the day it starts; across a month and a leap day the count is of calendar days', () => {
    const bitis = (baslangic: string, gun: number) => calis('antibiyotik-sure', { baslangic, sure_gun: gun, kontrol: null, sinif: null }).tarihler[0].tarih
    assert.equal(bitis('2026-10-01', 1), '2026-10-01')
    assert.equal(bitis('2026-10-28', 5), '2026-11-01')
    assert.equal(bitis('2028-02-27', 3), '2028-02-29')
    assert.equal(bitis('2026-12-30', 14), '2027-01-12')
  })
  it('the doctor\'s own review date stands as typed', () => {
    assert.deepEqual(calis('antibiyotik-sure', { baslangic: '2026-10-01', sure_gun: 7, kontrol: '2026-10-05', sinif: null }).tarihler, [{ anahtar: 'bitis', tarih: '2026-10-07' }, { anahtar: 'kontrol', tarih: '2026-10-05' }])
  })
})

describe('fault 4 — ASA physical status: six classes; E is a mark added to a class', () => {
  const t = arac('asa-preop')
  it('[ASA] the classes are ASA I to ASA VI — "E" is not one of them', () => {
    assert.deepEqual(t.alanlar.find((a) => a.anahtar === 'asa_sinif')!.secenekler, ['I', 'II', 'III', 'IV', 'V', 'VI'])
    assert.deepEqual([...t.cikti.bantlar], ['I', 'II', 'III', 'IV', 'V', 'VI'])
    assert.equal(calis('asa-preop', { asa_sinif: 'VI', anamnez_tamam: true }).bant, 'VI', 'class VI can be recorded')
    assert.equal(calis('asa-preop', { asa_sinif: 'E', anamnez_tamam: true }).bant, null, '"E" alone is no class')
  })
  it('[ASA] "The addition of "E" denotes Emergency surgery": a tick beside the class, there only once a class is chosen', () => {
    const acil = t.alanlar.find((a) => a.anahtar === 'asa_acil')!
    assert.equal(acil.tur, 'isaret')
    assert.deepEqual(acil.kosul, { alan: 'asa_sinif', degerler: ['I', 'II', 'III', 'IV', 'V', 'VI'] })
    assert.deepEqual(t.alanlar.slice(0, 2).map((a) => a.anahtar), ['asa_sinif', 'asa_acil'])
    const s = calis('asa-preop', { asa_sinif: 'III', asa_acil: true, anamnez_tamam: true })
    assert.deepEqual([s.bant, s.uyarilar], ['III', ['asa_acil']])
    assert.deepEqual(calis('asa-preop', { asa_sinif: 'III', asa_acil: false, anamnez_tamam: true }).uyarilar, [])
    // the mark without a class is not recorded: there is nothing it could be added to (and the screen does not offer it)
    assert.deepEqual(calis('asa-preop', { asa_sinif: null, asa_acil: true, anamnez_tamam: true }).uyarilar, [])
    const o: BirimOrtami = { birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }, lab: {}, sayi: { ondalikAyraci: '.', binlikAyraci: ',' } }
    assert.equal(girdiyiCoz(t.alanlar, { asa_acil: true, anamnez_tamam: true }, o).asa_acil, false, 'ticked earlier, class taken away: not read')
  })
  it('THE SOCIETY\'S DEFINITIONS OF THE CLASSES ARE NOT IN THE PRODUCT: no pack text of the tool carries one', () => {
    for (const d of ['countries/_dil/en/araclar/arac1.ts', 'countries/uz/uygulama/araclar/rol1.ts']) assert.doesNotMatch(readFileSync(join(KOK, d), 'utf8'), /normal healthy patient|mild systemic disease|severe systemic disease|moribund|brain-dead/i, d)
  })
})

describe('fault 5 — kidney tools: no risk cell without a urine result; the guideline\'s limits in the unit typed; referral lines as the list prints them', () => {
  const mmol = (x: number) => birimdenKanonige(LAB_BIRIMLERI.albuminKreatinin, 'mg/mmol', x)!
  const evre = (g: AracGirdisi) => calis('kdigo-evre', { egfr: 75, uacr: null, egfr_bir_yil_once: null, ...g })

  it('an eGFR of 75 and nothing else: no "low risk (green cell)" — no cell at all, and the result says what is missing ([KDIGO-FULL]: classified by GFR category AND albuminuria category)', () => {
    for (const k of ['kdigo-evre', 'kdigo-serit']) {
      const s = calis(k, { egfr: 75, uacr: null, egfr_bir_yil_once: null })
      assert.deepEqual([s.tamam, s.bant, s.uyarilar], [true, null, ['G2', 'uacr_yok']], k)
    }
    // with both results the cell is there, as before
    assert.deepEqual([evre({ uacr: 10 }).bant, evre({ uacr: 10 }).uyarilar], ['yesil', ['G2', 'A1']])
    assert.equal(calis('kdigo-serit', { egfr: 40, uacr: 100 }).bant, 'kirmizi')
  })

  it('[KDIGO-FULL] Table 3 in mg/g: A1 "<30", A2 "30–300", A3 ">300" — a value exactly on a limit', () => {
    const a = (x: number) => kdigoA(x)
    assert.deepEqual([29.9, 30, 30.1, 299.9, 300, 300.1].map(a), ['A1', 'A2', 'A2', 'A2', 'A2', 'A3'])
  })

  it('[KDIGO-FULL] Table 3 in mg/mmol: A1 "<3", A2 "3–30", A3 ">30" — as printed, not as converted from mg/g', () => {
    const a = (x: number) => kdigoA(mmol(x), 'mg/mmol')
    assert.deepEqual([2.9, 3, 3.1, 29.9, 30, 30.1, 31].map(a), ['A1', 'A2', 'A2', 'A2', 'A2', 'A3', 'A3'])
    // the audits' examples (AU.md fault 10, GB.md fault 8, NZ.md fault 12): the tool called 3.0 mg/mmol A1 and 31 mg/mmol A2
    assert.equal(kdigoA(mmol(3)), 'A1', 'what the conversion to mg/g alone answers (26.5 mg/g): the fault')
    assert.equal(kdigoA(mmol(31)), 'A2', 'what the conversion to mg/g alone answers (274 mg/g): the fault')
    assert.deepEqual(KDIGO_A_SINIRLARI, { 'mg/g': { a2: 30, a3: 300, sevk: 300, sevkYuksek: 700 }, 'mg/mmol': { a2: 3, a3: 30, sevk: 30, sevkYuksek: 70 } })
    assert.equal(kdigoA(5, 'mmol/L'), null, 'a unit the guideline prints no limits for: no category')
  })

  it('THROUGH THE SCREEN\'S OWN READING: 3 typed in a mg/mmol pack is A2, 30 is A2, 31 is A3; 30 typed in a mg/g pack is A2', () => {
    const t = arac('kdigo-evre')
    const ortam = (birim: string | readonly string[]): BirimOrtami => ({ birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }, lab: { albuminKreatinin: birim }, sayi: { ondalikAyraci: '.', binlikAyraci: ',' } })
    const kategori = (uacr: string, o: BirimOrtami, ek: Record<string, string> = {}) => { const g = girdiyiCoz(t.alanlar, { egfr: '75', uacr, ...ek }, o); return t.hesapla(g, O).uyarilar[1] }
    assert.deepEqual(['2.9', '3', '3.0', '30', '30.1', '31'].map((x) => kategori(x, ortam('mg/mmol'))), ['A1', 'A2', 'A2', 'A2', 'A3', 'A3'])
    assert.deepEqual(['29', '30', '300', '301'].map((x) => kategori(x, ortam('mg/g'))), ['A1', 'A2', 'A2', 'A3'])
    // where the pack accepts both, the unit the doctor chose decides which limits apply
    const iki = ortam(['mg/mmol', 'mg/g'])
    assert.equal(kategori('28', iki, { 'uacr.birim': 'mg/g' }), 'A1')
    assert.equal(kategori('28', iki, { 'uacr.birim': 'mg/mmol' }), 'A2')
    assert.equal(yazilanBirim(girdiyiCoz(t.alanlar, { egfr: '75', uacr: '3' }, ortam('mg/mmol')), 'uacr', 'mg/g'), 'mg/mmol')
    assert.equal(yazilanBirim({ uacr: 30 }, 'uacr', 'mg/g'), 'mg/g', 'a direct call, already in the arithmetic\'s unit')
  })

  it('[KDIGO-SUM] Figure 48, the referral list: eGFR <30; ACR ≥300 mg/g [≥30 mg/mmol] (with haematuria); ACR >700 mg/g [>70 mg/mmol]; a sustained fall of >20%', () => {
    // the audits' example (US.md fault 1): eGFR 75, ratio 350 mg/g, no blood in the urine — "a KDIGO referral criterion is met" was shown; by the list it is not
    assert.deepEqual(evre({ uacr: 350 }).uyarilar, ['G2', 'A3', 'sevk_acr_hematuri'])
    assert.deepEqual([299.9, 300, 700, 700.1].map((x) => evre({ uacr: x }).uyarilar.at(-1)), ['A2', 'sevk_acr_hematuri', 'sevk_acr_hematuri', 'sevk_acr700'])
    assert.deepEqual([29.9, 30, 70, 70.1].map((x) => evre({ uacr: mmol(x), 'uacr.birim': 'mg/mmol' }).uyarilar.at(-1)), ['A2', 'sevk_acr_hematuri', 'sevk_acr_hematuri', 'sevk_acr700'])
    assert.deepEqual(evre({ egfr: 29.9, uacr: 10 }).uyarilar, ['G4', 'A1', 'sevk_egfr30'])
    assert.deepEqual(evre({ egfr: 30, uacr: 10 }).uyarilar, ['G3b', 'A1'])
    // a fall of exactly 20% is not "more than 20%"; the old limit was 25% and "in a year"
    assert.equal(yuzde20denFazlaDustu(55, 44), false)
    assert.equal(yuzde20denFazlaDustu(55, 43.9), true)
    assert.deepEqual(evre({ egfr: 43.9, uacr: 10, egfr_bir_yil_once: 55 }).uyarilar, ['G3b', 'A1', 'sevk_dusus20'])
    // the audits' example (GB.md fault 8): a GFR that falls from 44 to 32 (27%)
    assert.ok(evre({ egfr: 32, uacr: 10, egfr_bir_yil_once: 44 }).uyarilar.includes('sevk_dusus20'))
    // several lines may apply at once
    assert.deepEqual(evre({ egfr: 20, uacr: 800, egfr_bir_yil_once: 40 }).uyarilar, ['G4', 'A3', 'sevk_egfr30', 'sevk_acr700', 'sevk_dusus20'])
  })

  it('WHAT IS GONE: "albuminuria A3" as a criterion by itself, "the very-high-risk cell" (not on the list), and the 25% limit', () => {
    const anahtarlar = arac('kdigo-evre').cikti.uyarilar
    for (const k of ['sevk_a3', 'sevk_cok_yuksek_risk', 'sevk_hizli_dusus', 'hizli_dusus']) assert.ok(!anahtarlar.includes(k), k)
    // the red cell alone raises no referral line: G3b with A2 is red, and nothing on the list is touched
    assert.deepEqual(evre({ egfr: 40, uacr: 100 }).uyarilar, ['G3b', 'A2'])
    assert.equal(evre({ egfr: 40, uacr: 100 }).bant, 'kirmizi')
    // the nephrologist's grid has no referral line at all
    assert.deepEqual([...arac('kdigo-serit').cikti.uyarilar].filter((k) => k.startsWith('sevk')), [])
  })

  it('NO PACK TEXT SAYS A CRITERION IS MET: the words "KDIGO criterion" are gone from every form', () => {
    for (const d of ['countries/_dil/en/araclar/arac1.ts', 'countries/uz/uygulama/araclar/rol2.ts']) assert.doesNotMatch(readFileSync(join(KOK, d), 'utf8'), /KDIGO criterion|yoʻllash mezoni|Критерий KDIGO/, d)
  })
})

describe('fault 6 — pure-tone average: the grades of the table the tool cites; open to a country\'s own', () => {
  const kulak = (pta: number, ek: AracGirdisi = {}) => ({ kulak: null, e05: pta, e1: pta, e2: pta, e4: pta, onceki_pta: null, karsi_pta: null, ...ek })

  it('[ASHA] Clark 1981: Normal –10 to 15; Slight 16 to 25; Mild 26 to 40; Moderate 41 to 55; Moderately severe 56 to 70; Severe 71 to 90; Profound 91+', () => {
    const beklenen: [number, string][] = [[-10, 'normal'], [15, 'normal'], [16, 'hafifce'], [25, 'hafifce'], [26, 'hafif'], [40, 'hafif'], [41, 'orta'], [55, 'orta'], [56, 'orta_ileri'], [70, 'orta_ileri'], [71, 'ileri'], [90, 'ileri'], [91, 'cok_ileri'], [130, 'cok_ileri']]
    for (const [pta, bant] of beklenen) { assert.equal(ptaBandi(pta), bant, `${pta} dB`); assert.equal(calis('odyometri-pta', kulak(pta)).bant, bant) }
    // the audits' example (US.md fault 6, CA.md fault 4): all four thresholds at 20 dB were "within normal limits"
    assert.equal(calis('odyometri-pta', kulak(20)).bant, 'hafifce')
    assert.deepEqual([...arac('odyometri-pta').cikti.bantlar], ['normal', 'hafifce', 'hafif', 'orta', 'orta_ileri', 'ileri', 'cok_ileri'])
    // an average between two whole numbers is in the grade above the limit it has passed (the table is printed in whole decibels)
    assert.deepEqual([15.3, 25.5].map(ptaBandi), ['hafifce', 'hafif'])
  })

  it('[AAO-HNS] "a difference of greater than 15 dB Pure Tone Average between ears": exactly 15 dB is not flagged; the difference is shown either way', () => {
    assert.equal(PTA_ASIMETRI_USTU, 15)
    // the audits' example (US.md fault 6): an average of 30 dB against 15 dB in the other ear was flagged
    const s = calis('odyometri-pta', kulak(30, { karsi_pta: 15 }))
    assert.deepEqual([s.uyarilar, sayi(s, 'kulak_farki')], [[], 15])
    assert.deepEqual(calis('odyometri-pta', kulak(30, { karsi_pta: 14.9 })).uyarilar, ['asimetri'])
    assert.deepEqual(calis('odyometri-pta', kulak(15, { karsi_pta: 30.1 })).uyarilar, ['asimetri'], 'either ear may be the worse one')
    assert.equal(sayi(calis('odyometri-pta', kulak(30)), 'kulak_farki'), undefined, 'no other ear, no difference')
  })

  it('OPEN TO A COUNTRY: its own frequencies (the kit\'s own are 0.5, 1, 2 and 4 kHz)', () => {
    const t = arac('odyometri-pta')
    assert.deepEqual(t.alanGruplari!.frekans.secenekler.map((a) => a.anahtar), ['e025', 'e05', 'e1', 'e2', 'e3', 'e4', 'e6', 'e8'])
    assert.equal(etkinTanim(t, {}), t, 'a country that states nothing gets the kit\'s own definition')
    // five frequencies: the audits' example (GB.md fault 1) — 10 dB at 250 Hz, then 15, 20, 25 and 40 dB
    const bes = etkinTanim(t, { uyarlama: { alanlar: { frekans: ['e4', 'e025', 'e05', 'e1', 'e2'] } } })
    assert.deepEqual(bes.alanlar.map((a) => a.anahtar), ['kulak', 'e025', 'e05', 'e1', 'e2', 'e4', 'onceki_pta', 'karsi_pta'], 'in the kit\'s order, where the kit\'s four stood')
    const g = { kulak: null, e025: 10, e05: 15, e1: 20, e2: 25, e4: 40, onceki_pta: null, karsi_pta: null }
    assert.equal(sayi(bes.hesapla(g, O), 'pta'), 22, 'the average of five')
    assert.equal(sayi(t.hesapla(g, O), 'pta'), 25, 'the kit\'s own four')
    assert.equal(bes.hesapla({ ...g, e025: null }, O).tamam, false, 'every frequency the country has is needed')
    // three frequencies
    const uc = etkinTanim(t, { uyarlama: { alanlar: { frekans: ['e05', 'e1', 'e2'] } } })
    assert.equal(sayi(uc.hesapla({ ...g, e4: null }, O), 'pta'), 20)
  })

  it('OPEN TO A COUNTRY: its own grade table over the average, and its own asymmetry rule', () => {
    const t = arac('odyometri-pta')
    assert.equal(t.bantSerbest, true)
    const kendi = etkinTanim(t, { uyarlama: { bantlar: { sayi: 'pta', satirlar: [{ ust: 20, dahil: true, bant: 'a' }, { ust: 40, dahil: true, bant: 'b' }, { ust: null, bant: 'c' }] } } })
    assert.deepEqual([20, 20.1, 40, 41].map((v) => kendi.hesapla(kulak(v), O).bant), ['a', 'b', 'b', 'c'])
    assert.deepEqual([...kendi.cikti.bantlar], ['a', 'b', 'c'])
    assert.deepEqual([...t.secimlikParametreler!], ['asimetri_ustu', 'asimetri_en_az'])
    const fark = (karsi: number, p: Record<string, number>) => calis('odyometri-pta', kulak(40, { karsi_pta: karsi }), p).uyarilar
    assert.deepEqual([fark(20, { asimetri_en_az: 20 }), fark(20.1, { asimetri_en_az: 20 }), fark(24, { asimetri_en_az: 20 })], [['asimetri'], [], []], '20 dB or more: the kit\'s "greater than 15" is not applied beside it')
    assert.deepEqual([fark(30, { asimetri_ustu: 10 }), fark(29.9, { asimetri_ustu: 10 })], [[], ['asimetri']])
    assert.deepEqual(ulkeOrtami(t, { parametreler: { asimetri_en_az: 20 } }, BUGUN)?.p, { asimetri_en_az: 20 })
    assert.deepEqual(ulkeOrtami(t, {}, BUGUN)?.p, {}, 'a number the country may state and does not: left out, and the tool still answers')
    assert.equal(ulkeOrtami(t, { parametreler: { asimetri_en_az: 'yirmi' as never } }, BUGUN), null, 'stated and not a number: no result at all')
  })
})

describe('fault 7 — return to sport: the kit holds no staging; the steps are a country\'s table, with earliest days counted from the injury', () => {
  const t = arac('rtp-basamak')
  const ADIMLAR: PaketAraci['tablolar'] = { basamaklar: { satirlar: [{ basamak: 's1', en_erken_gun: 0 }, { basamak: 's5', en_erken_gun: 14 }, { basamak: 's6', en_erken_gun: 21 }] } }
  const ulkeninki = etkinTanim(t, { tablolar: ADIMLAR })
  const calistir = (g: AracGirdisi, bugun = BUGUN) => ulkeninki.hesapla(g, ulkeOrtami(ulkeninki, { tablolar: ADIMLAR }, bugun)!)

  it('WITHOUT A COUNTRY\'S STEPS: no stage is offered and none is shown — the days since the injury, and a line that says no steps are set', () => {
    assert.deepEqual(t.alanlar.map((a) => [a.anahtar, a.tur, a.secenekler ?? null]), [['yaralanma', 'tarih', null], ['basamak', 'secim', []]])
    assert.deepEqual([...t.cikti.bantlar], [], 'the six made-up stages (0 to 5) are gone')
    const s = t.hesapla({ yaralanma: '2026-10-01', basamak: null }, O)
    assert.deepEqual([s.tamam, s.bant, s.uyarilar, s.sayilar.map((x) => [x.anahtar, x.deger]), s.tarihler], [true, null, ['basamak_tanimsiz'], [['gun', 9]], []])
    // a stage of the old list, sent anyway, is not read
    assert.equal(t.hesapla({ yaralanma: '2026-10-01', basamak: '5' }, O).bant, null)
    assert.equal(t.hesapla({ yaralanma: BUGUN, basamak: null }, O).sayilar[0].deger, 0, 'the day of the injury is day 0')
    assert.equal(t.hesapla({ yaralanma: '2026-10-11', basamak: null }, O).tamam, false, 'an injury dated after today')
    assert.equal(t.hesapla({ yaralanma: null, basamak: null }, O).tamam, false)
    assert.equal(etkinTanim(t, {}), t)
  })

  it('WITH A COUNTRY\'S STEPS: the options and the bands are its rows; a step is held against its earliest day', () => {
    assert.deepEqual(tabloAnahtarlari({ tablolar: ADIMLAR }, 'basamaklar', 'basamak'), ['s1', 's5', 's6'])
    assert.deepEqual(ulkeninki.alanlar.find((a) => a.anahtar === 'basamak')!.secenekler, ['s1', 's5', 's6'])
    assert.deepEqual([...ulkeninki.cikti.bantlar], ['s1', 's5', 's6'])
    // the audits' example (GB.md fault 3, NZ.md fault 1, AU.md fault 3): the last stage recorded on day 10 (or 3) "and the screen does not object"
    const gun10 = calistir({ yaralanma: '2026-09-30', basamak: 's6' })
    assert.deepEqual([gun10.bant, sayi(gun10, 'gun'), gun10.uyarilar, gun10.tarihler], ['s6', 10, ['erken'], [{ anahtar: 'en_erken', tarih: '2026-10-21' }]])
    // on day 21 itself it is not early; on day 20 it is
    assert.deepEqual(calistir({ yaralanma: '2026-09-19', basamak: 's6' }).uyarilar, [])
    assert.deepEqual(calistir({ yaralanma: '2026-09-20', basamak: 's6' }).uyarilar, ['erken'])
    // a step without an earliest day raises nothing and shows no date
    const ilk = calistir({ yaralanma: BUGUN, basamak: 's1' })
    assert.deepEqual([ilk.bant, ilk.uyarilar, ilk.tarihler], ['s1', [], []])
    // steps exist: there is no result until one is chosen — never "no steps are set"
    assert.equal(calistir({ yaralanma: '2026-10-01', basamak: null }).tamam, false)
    assert.equal(calistir({ yaralanma: '2026-10-01', basamak: 'b5' }).tamam, false)
  })

  it('[HEADS-UP] the made-up stages matched no guideline: CDC numbers six steps 1 to 6, from "Back to regular activities" to "Competition" — the kit names none of them, nor anybody else\'s', () => {
    const kaynak = readFileSync(join(KOK, 'countries/_dil/en/araclar/arac3.ts'), 'utf8')
    assert.doesNotMatch(kaynak, /Stage [0-5]:|rest and control of symptoms|Back to regular activities/)
    assert.doesNotMatch(readFileSync(join(KOK, 'countries/uz/uygulama/araclar/rol5.ts'), 'utf8'), /[0-5]-bosqich:|Этап [0-5]:/)
  })
})

describe('fault 8 — vertigo note: three central signs were missing', () => {
  const t = arac('vertigo-notu')
  const bos = Object.fromEntries(t.alanlar.map((a) => [a.anahtar, a.tur === 'isaret' ? false : null]))
  it('[CMAJ] "Focal weakness or paresthesia of face or limbs"; "… dysmetria …"; "Significant headache or neck pain": a weak arm, poor coordination and neck pain each have a box', () => {
    for (const k of ['santral_uzuv', 'santral_koordinasyon', 'santral_boyun_agrisi']) {
      assert.ok(t.alanlar.some((a) => a.anahtar === k && a.tur === 'isaret'), k)
      // the audits' example (CA.md fault 8): the result read "No sign of a central cause was marked"
      const s = t.hesapla({ ...bos, dix_hallpike: 'pozitif', nis_torsiyonel: true, [k]: true }, O)
      assert.deepEqual([s.bant, s.uyarilar], ['manevra_uygun_degil', ['santral_suphe']], k)
    }
    assert.equal(t.hesapla({ ...bos, dix_hallpike: 'pozitif', nis_torsiyonel: true }, O).bant, 'manevra_uygun')
    assert.equal(t.alanlar.filter((a) => a.anahtar.startsWith('santral_')).length, 9)
  })
  it('the rule is unchanged: a repositioning manoeuvre recorded with a central sign is flagged', () => {
    assert.deepEqual(t.hesapla({ ...bos, epley: 'yapilamadi', santral_boyun_agrisi: true }, O).uyarilar, ['santral_suphe', 'repozisyon_santral'])
  })
})

describe('fault 9 — PASI and SCORAD: a score without an unsourced severity word; the edge at 50', () => {
  const tam = (belirti: number, alan: number) => Object.fromEntries(['bas', 'ust', 'govde', 'alt'].flatMap((b) => [[`${b}_e`, belirti], [`${b}_i`, belirti], [`${b}_d`, belirti], [`${b}_a`, alan]]))
  it('[CADTH] PASI: the formula stands (weights 0.1 / 0.2 / 0.3 / 0.4, signs 0 to 4, area 0 to 6, "ranging from 0 to 72") — and NO severity word', () => {
    assert.equal(sayi(calis('pasi', tam(4, 6)), 'pasi'), 72)
    assert.equal(sayi(calis('pasi', tam(0, 0)), 'pasi'), 0)
    // one region alone, signs 1+1+1 and area 1: 3 × the region's weight
    const tek = (b: string) => sayi(calis('pasi', { bas_a: 0, ust_a: 0, govde_a: 0, alt_a: 0, [`${b}_e`]: 1, [`${b}_i`]: 1, [`${b}_d`]: 1, [`${b}_a`]: 1 }), 'pasi')
    assert.deepEqual(['bas', 'ust', 'govde', 'alt'].map(tek), [0.3, 0.6, 0.9, 1.2])
    // the audits' example (US.md fault 11): PASI 12 was shown as "Moderate"; the one source read that gives bands calls over 10 severe
    const on2 = calis('pasi', tam(4, 1))
    assert.deepEqual([sayi(on2, 'pasi'), on2.bant], [12, null])
    assert.deepEqual([...arac('pasi').cikti.bantlar], [])
    assert.equal(arac('pasi').bantSerbest, true, 'a country whose own source states bands supplies them')
  })
  it('PASI: one erythema score alone is not "PASI 0" — an unfinished form has no score', () => {
    assert.equal(calis('pasi', { bas_e: 2 }).tamam, false)
    assert.equal(calis('pasi', { ...tam(2, 3), govde_d: null }).tamam, false)
    assert.equal(calis('pasi', { ...tam(2, 3), govde_a: 0, govde_d: null }).tamam, true, 'a region that is not involved needs no sign')
  })
  it('[SCORAD-RIGHTS] "Above 50" is severe: exactly 50 is moderate; 0 has no severity word', () => {
    assert.deepEqual([0, 0.1, 24.9, 25, 49.9, 50, 50.1, 103].map(scoradBandi), [null, 'hafif', 'hafif', 'orta', 'orta', 'orta', 'siddetli', 'siddetli'])
    // A = 50 → 10; B = 10 → 35; C = 5 → SCORAD 50.0 (the audits' example, US.md fault 12: shown as "Severe")
    const elli = calis('scorad', { yayginlik: 50, eritem: 3, odem: 3, sizinti: 2, ekskoriasyon: 1, likenifikasyon: 1, kuruluk: 0, kasinti: 3, uykusuzluk: 2 })
    assert.deepEqual([sayi(elli, 'scorad'), elli.bant], [50, 'orta'])
    const sifir = calis('scorad', { yayginlik: 0, eritem: 0, odem: 0, sizinti: 0, ekskoriasyon: 0, likenifikasyon: 0, kuruluk: 0, kasinti: 0, uykusuzluk: 0 })
    assert.deepEqual([sayi(sifir, 'scorad'), sifir.bant], [0, null])
    // the formula and its maximum stand (A/5 + 7B/2 + C; 103)
    assert.equal(sayi(calis('scorad', { yayginlik: 100, eritem: 3, odem: 3, sizinti: 3, ekskoriasyon: 3, likenifikasyon: 3, kuruluk: 3, kasinti: 10, uykusuzluk: 10 }), 'scorad'), 103)
    assert.equal(calis('scorad', { yayginlik: 50, eritem: 3 }).tamam, false, 'an unfinished form has no index')
  })
})

describe('fault 10 — injury log: a training ratio of exactly 1.3 is inside the cited paper\'s low-risk range', () => {
  const kayit = (dk7: number, onceki: number) => calis('sakatlik-gunlugu', { bolge: 'diz', mekanizma: null, siddet: null, durum: null, dk_7gun: dk7, dk_onceki: onceki })
  it('[GABBETT] "within the range of 0.8–1.3 … the training \'sweet spot\'"; "≥1.5 represent the \'danger zone\'"', () => {
    // the audits' example (US.md fault 13): 390 minutes this week against a usual 300 — ratio 1.3, "needs attention"
    assert.deepEqual(kayit(390, 300).uyarilar, [])
    assert.deepEqual(kayit(391, 300).uyarilar, ['yuklenme_dikkat'])
    assert.deepEqual(kayit(449, 300).uyarilar, ['yuklenme_dikkat'])
    assert.deepEqual(kayit(450, 300).uyarilar, ['yuklenme_yuksek'])
    assert.deepEqual(kayit(240, 300).uyarilar, [], '0.8: inside the range')
    // exactly on a limit whatever the division makes of it
    assert.deepEqual([[3.9, 3], [39, 30], [0.13, 0.1], [130.13, 100.1]].map(([a, b]) => yuklenmeDuzeyi(a, b)), [null, null, null, null])
    assert.deepEqual([[4.5, 3], [0.15, 0.1], [150.15, 100.1]].map(([a, b]) => yuklenmeDuzeyi(a, b)), ['yuklenme_yuksek', 'yuklenme_yuksek', 'yuklenme_yuksek'])
  })
  it('the ratio is written to two places: 1.26 and 1.34 are not both "1.3"', () => {
    assert.equal(sayiMetni(kayit(378, 300).sayilar[0], M, EN), '1.26')
    assert.equal(sayiMetni(kayit(402, 300).sayilar[0], M, EN), '1.34')
  })
})

describe('fault 11 — expected height: the range is a number the country states; the kit has none', () => {
  // the audits' example (GB.md fault 6): mother 160 cm, father 180 cm, a boy — the screen showed 176.5 cm and 168.0 to 185.0 cm
  const g = { cinsiyet: 'erkek', anne: 160, baba: 180 }
  it('NO RANGE where no country number is stated: the target height only', () => {
    assert.deepEqual(calis('hedef-boy', g).sayilar.map((x) => [x.anahtar, x.deger]), [['hedef', 176.5]])
    assert.deepEqual([...arac('hedef-boy').secimlikParametreler!], ['aralik_cm'])
  })
  it('[RCPCH] "within ±7 cm of this target height": with 7 the range is 169.5 to 183.5 cm; [AAFP] "within 10 cm (4 in)": with 10 it is 166.5 to 186.5 cm', () => {
    assert.deepEqual(calis('hedef-boy', g, { aralik_cm: 7 }).sayilar.map((x) => x.deger), [176.5, 169.5, 183.5])
    assert.deepEqual(calis('hedef-boy', g, { aralik_cm: 10 }).sayilar.map((x) => x.deger), [176.5, 166.5, 186.5])
    assert.deepEqual(calis('hedef-boy', g, { aralik_cm: 0 }).sayilar.map((x) => x.anahtar), ['hedef'], 'a range of nothing is no range')
  })
  it('[AAFP] the formula stands: "[Paternal height (cm) + 13 cm + maternal height (cm)] ÷ 2" for a boy, − 13 cm for a girl', () => {
    assert.equal(sayi(calis('hedef-boy', g), 'hedef'), (180 + 13 + 160) / 2)
    assert.equal(sayi(calis('hedef-boy', { ...g, cinsiyet: 'kiz' }), 'hedef'), (180 - 13 + 160) / 2)
  })
})

describe('fault 12 — units: HbA1c, C-reactive protein and PSA are quantities of the kit; limits that are laboratory values carry their unit', () => {
  it('[NGSP] "NGSP = (0.09148*IFCC) + 2.152": the table\'s own pairs, both ways', () => {
    // Table 1 of the page: 5.0% = 31, 6.0% = 42, 7.0% = 53, 8.0% = 64, 9.0% = 75, 10.0% = 86, 11.0% = 97, 12.0% = 108 mmol/mol
    const tablo: [number, number][] = [[5, 31], [6, 42], [7, 53], [8, 64], [9, 75], [10, 86], [11, 97], [12, 108]]
    for (const [yuzde, mmol] of tablo) {
      assert.equal(Math.round(kanoniktenBirime(LAB_BIRIMLERI.hba1c, 'mmol/mol', yuzde)!), mmol, `${yuzde}% in mmol/mol`)
      assert.equal(Math.round(birimdenKanonige(LAB_BIRIMLERI.hba1c, 'mmol/mol', mmol)! * 10) / 10, yuzde, `${mmol} mmol/mol in %`)
    }
    assert.equal(birimdenKanonige(LAB_BIRIMLERI.hba1c, '%', 7), 7)
  })

  it('HbA1c follow-up: 53 mmol/mol is read (it used to be refused as "above 20"); the two thresholds are stated with their unit', () => {
    const t = arac('lab-izlem')
    const o: BirimOrtami = { birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }, lab: { hba1c: 'mmol/mol' }, sayi: { ondalikAyraci: '.', binlikAyraci: ',' } }
    const g = girdiyiCoz(t.alanlar, { tur: 'hba1c', hba1c: '53' }, o)
    assert.ok(Math.abs((g.hba1c as number) - 7.00044) < 1e-9)
    assert.deepEqual(t.parametreOlculeri, { hba1c_dikkat: 'hba1c', hba1c_yuksek: 'hba1c' })
    // a pack states its thresholds in ITS unit: 48 and 58 mmol/mol (invented for the test) — 53 lies between them
    const paket: Pick<PaketAraci, 'parametreler'> = { parametreler: { hba1c_dikkat: { deger: 48, birim: 'mmol/mol' }, hba1c_yuksek: { deger: 58, birim: 'mmol/mol' }, tsh_alt: 0.4, tsh_ust: 4, tsh_dikkat_alt: 0.1, tsh_dikkat_ust: 10, ay_hba1c_hedef: 6, ay_hba1c_dikkat: 3, ay_hba1c_yuksek: 3, ay_tsh_hedef: 6, ay_tsh_dikkat: 3, ay_tsh_yuksek: 2 } }
    assert.equal(t.hesapla(g, ulkeOrtami(t, paket, BUGUN)!).bant, 'dikkat')
    assert.equal(ulkeOrtami(t, { parametreler: { ...paket.parametreler, hba1c_dikkat: 48 } }, BUGUN), null, 'a bare number says nothing about its unit: no result')
    // TSH has a field of its own and no unit of HbA1c
    assert.deepEqual(t.alanlar.map((a) => [a.anahtar, a.lab ?? null]), [['tur', null], ['hba1c', 'hba1c'], ['tsh', null], ['tarih', null]])
  })

  it('anaemia follow-up: the three haemoglobin limits are stated with their unit — 110 g/L is inside 100 to 120 g/L (it read "low" when the limits were bare numbers compared in g/dL)', () => {
    const t = arac('anemi-izlem')
    assert.deepEqual(t.parametreOlculeri, { hb_hedef_alt: 'hemoglobin', hb_hedef_ust: 'hemoglobin', hb_dusuk_alti: 'hemoglobin' })
    const gL = (deger: number) => ({ deger, birim: 'g/L' })
    const paket: Pick<PaketAraci, 'parametreler'> = { parametreler: { hb_hedef_alt: gL(100), hb_hedef_ust: gL(120), hb_dusuk_alti: gL(90), ay_hedef: 3, ay_dikkat: 2, ay_dusuk: 1 } }
    const o: BirimOrtami = { birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }, lab: { hemoglobin: 'g/L' }, sayi: { ondalikAyraci: '.', binlikAyraci: ',' } }
    const bant = (hb: string) => t.hesapla(girdiyiCoz(t.alanlar, { hb }, o), ulkeOrtami(t, paket, BUGUN)!).bant
    assert.deepEqual(['110', '100', '120', '95', '89'].map(bant), ['hedef_yakin', 'hedef_yakin', 'hedef_yakin', 'dikkat', 'dusuk'])
    assert.equal(ulkeOrtami(t, { parametreler: { ...paket.parametreler, hb_hedef_alt: 100 } }, BUGUN), null)
  })

  it('[DAS] DAS28 takes C-reactive protein in mg/L: the field is the quantity `crp`, and a value in mg/dL is converted, not typed as it was reported', () => {
    const t = arac('das28')
    assert.equal(t.alanlar.find((a) => a.anahtar === 'crp')!.lab, 'crp')
    assert.equal(birimdenKanonige(LAB_BIRIMLERI.crp, 'mg/dL', 1), 10)
    const o: BirimOrtami = { birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }, lab: { crp: ['mg/L', 'mg/dL'] }, sayi: { ondalikAyraci: '.', binlikAyraci: ',' } }
    // the audits' example (US.md fault 5): 4 tender and 2 swollen joints, global score 50 — CRP 10 mg/L gives 4.04; the same result typed as 1.0 gave 3.43
    const skor = (ek: Record<string, string>) => { const s = t.hesapla(girdiyiCoz(t.alanlar, { varyant: 'crp', tjc: '4', sjc: '2', pga: '50', ...ek }, o), O); return s.tamam ? s.sayilar[0].deger : null }
    assert.equal(skor({ crp: '10', 'crp.birim': 'mg/L' }), 4.04)
    assert.equal(skor({ crp: '1.0', 'crp.birim': 'mg/dL' }), 4.04)
    assert.equal(skor({ crp: '1.0' }), null, 'no unit chosen: no score')
    // the formulas and the bands were found right by the audits and are unchanged
    assert.equal(sayi(calis('das28', { varyant: 'esr', tjc: 4, sjc: 2, pga: 50, crp: null, esr: 30 }), 'das28'), Math.round((0.56 * 2 + 0.28 * Math.SQRT2 + 0.7 * Math.log(30) + 0.014 * 50) * 100) / 100)
    assert.deepEqual([2.59, 2.6, 3.19, 3.2, 5.1, 5.11].map((v) => (v < 2.6 ? 'remisyon' : v < 3.2 ? 'dusuk' : v <= 5.1 ? 'orta' : 'yuksek')), ['remisyon', 'dusuk', 'dusuk', 'orta', 'orta', 'yuksek'])
  })

  it('CRP and ESR follow-up: each marker has a field of its own; the two CRP thresholds are laboratory values', () => {
    const t = arac('iltihap-lab-izlem')
    assert.deepEqual(t.alanlar.map((a) => [a.anahtar, a.lab ?? a.birim ?? null]), [['tur', null], ['crp', 'crp'], ['esr', 'mm/saat'], ['tarih', null]])
    assert.deepEqual(t.parametreOlculeri, { crp_dikkat: 'crp', crp_yuksek: 'crp' })
  })

  it('every limit of the kit that is compared with a laboratory value says which quantity it is', () => {
    for (const t of KIT_ARACLARI) for (const k of Object.keys(t.parametreOlculeri ?? {})) assert.ok([...(t.parametreler ?? []), ...(t.secimlikParametreler ?? [])].includes(k), `${t.anahtar}.${k}`)
    // the tools whose pack numbers are laboratory values, all of them
    assert.deepEqual(KIT_ARACLARI.filter((t) => t.parametreOlculeri).map((t) => t.anahtar), ['lab-izlem', 'anemi-izlem', 'iltihap-lab-izlem'])
    // every laboratory field of the kit reads a quantity the kit defines
    for (const t of KIT_ARACLARI) for (const a of t.alanlar) if (a.lab) assert.ok(a.lab in LAB_BIRIMLERI, `${t.anahtar}.${a.anahtar}`)
    assert.deepEqual(Object.keys(LAB_BIRIMLERI), ['kreatinin', 'hemoglobin', 'glukoz', 'kolesterol', 'albuminKreatinin', 'hba1c', 'crp', 'psa'])
    for (const [olcu, t] of Object.entries(LAB_BIRIMLERI)) assert.equal(t.birimler[t.kanonik], 1, olcu)
  })
})

describe('fault 13 — pain and function: the two numbers, and no severity word from a weighting the product invented', () => {
  it('pain 5 of 10 with little loss of function was "mild pain and limitation of function": now the pain score, the function total, and nothing else', () => {
    const s = calis('vas-fonksiyon', { vas: 5, yurume: 1, merdiven: 0, gunluk: 0, uyku: 1 })
    assert.deepEqual([s.tamam, s.bant, s.sayilar.map((x) => [x.anahtar, x.deger, x.enCok])], [true, null, [['vas', 5, 10], ['fonksiyon', 2, 16]]])
    assert.deepEqual([...arac('vas-fonksiyon').cikti.bantlar], [])
    assert.equal(calis('vas-fonksiyon', { vas: 10, yurume: 4, merdiven: 4, gunluk: 4, uyku: 4 }).bant, null)
  })
})

describe('fault 14 — PSA: the unit is the pack\'s; the caution about a short interval can be turned off', () => {
  const t = arac('psa-hizi')
  // the audits' example (NZ.md fault 6): 4.5 µg/L, then 5.0 µg/L six weeks later — "Change in a year: 4.35" with the caution, on every repeat the guidance asks for
  const g = { onceki_deger: 4.5, onceki_tarih: '2026-01-01', son_deger: 5, son_tarih: '2026-02-12' }
  it('the two values are the quantity `psa`; ng/mL and µg/L are the same amount, and the yearly change is written in the unit typed', () => {
    assert.deepEqual(t.alanlar.filter((a) => a.tur === 'sayi').map((a) => a.lab), ['psa', 'psa'])
    assert.deepEqual(LAB_BIRIMLERI.psa.birimler, { 'ng/mL': 1, 'ug/L': 1 })
    assert.deepEqual(t.sonucLabEkleri, { psa: '/yil' })
    const s = t.hesapla({ ...g, 'son_deger.birim': 'ug/L', 'onceki_deger.birim': 'ug/L' }, O)
    assert.deepEqual([sayi(s, 'hiz'), s.sayilar[0].birim, sayi(s, 'gun')], [4.35, 'ug/L/yil', 42])
    assert.equal(t.hesapla(g, O).sayilar[0].birim, 'ng/mL/yil')
  })
  it('the caution: fewer than 90 days as before where a country states nothing; turned off with 0; moved with another number', () => {
    assert.equal(PSA_KISA_ARALIK_GUN, 90)
    assert.deepEqual(t.hesapla(g, O).uyarilar, ['kisa_aralik'])
    assert.deepEqual(calis('psa-hizi', g, { kisa_aralik_gun: 0 }).uyarilar, [])
    assert.deepEqual(calis('psa-hizi', g, { kisa_aralik_gun: 42 }).uyarilar, [], '42 days apart is not fewer than 42')
    assert.deepEqual(calis('psa-hizi', g, { kisa_aralik_gun: 43 }).uyarilar, ['kisa_aralik'])
    assert.deepEqual(calis('psa-hizi', { ...g, son_tarih: '2026-04-01' }).uyarilar, [], '90 days apart')
    assert.deepEqual(calis('psa-hizi', { ...g, son_tarih: '2026-03-31' }).uyarilar, ['kisa_aralik'], '89 days apart')
  })
})

describe('the kit as a whole after the corrections', () => {
  it('a tool whose bands a country may restate has nothing else that follows from its band; the ones that do are not marked', () => {
    assert.deepEqual(KIT_ARACLARI.filter((t) => t.bantSerbest).map((t) => t.anahtar), ['pasi', 'easi', 'scorad', 'odyometri-pta', 'das28'])
    // the report outline, the vertigo note and the follow-up tools decide a warning, a date or a number from the band: locked
    for (const k of ['rapor-taslagi', 'vertigo-notu', 'lab-izlem', 'anemi-izlem', 'ibd-skor', 'iltihap-lab-izlem', 'kdigo-evre', 'kdigo-serit', 'esi-triyaj', 'asa-preop']) assert.notEqual(arac(k).bantSerbest, true, k)
  })
  it('a number or a table a country MAY state is never one it must: every tool that has one still answers without it', () => {
    for (const t of KIT_ARACLARI) {
      if (!t.secimlikParametreler?.length && !(t.tablolar ?? []).some((x) => x.istege)) continue
      for (const k of t.secimlikParametreler ?? []) assert.ok(!(t.parametreler ?? []).includes(k), `${t.anahtar}.${k}`)
      // the country states nothing: the environment is there (unless the tool ALSO needs numbers of the country)
      if (!(t.parametreler ?? []).length && !(t.tablolar ?? []).some((x) => !x.istege)) assert.deepEqual(ulkeOrtami(t, {}, BUGUN), { bugun: BUGUN, p: {} }, t.anahtar)
    }
    assert.deepEqual(KIT_ARACLARI.filter((t) => t.secimlikParametreler?.length).map((t) => t.anahtar), ['odyometri-pta', 'hedef-boy', 'psa-hizi'])
    assert.deepEqual(KIT_ARACLARI.filter((t) => (t.tablolar ?? []).some((x) => x.istege)).map((t) => t.anahtar), ['rtp-basamak'])
  })
})
