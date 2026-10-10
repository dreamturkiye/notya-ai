/**
 * NOTYA-ULKE-UYGULA-US — United States: THE SIX TOOLS ONLY THIS COUNTRY HAS (./tanimlar.ts, ./metinler.ts).
 *
 *   1. EVERY ONE IS SWITCHED OFF — NOT IN THE PACK AT ALL — and stands on the list of tools awaiting a clinician's
 *      sign-off (./onayBekleyen.ts). THIS TEST FAILS THE DAY ONE OF THEM IS IN THE PACK WHILE IT IS STILL ON THAT LIST.
 *   2. THE ARITHMETIC OF EACH, AGAINST ITS SOURCE'S OWN WORKED EXAMPLES. Every source was opened on 2026-10-10; the
 *      numbers below are the ones the source prints, not ones worked out here.
 *   3. EACH IS COMPLETE: with all six switched on (in this test only), the whole pack check finds nothing, every
 *      role the audit named sees its tool, and a tool that is for some patients only is held back for the others.
 *   4. THE WORDS: American spelling, nothing of another country, no claim, a licence stated "free" only with the
 *      rights holder named and the notice that was read.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { type BirimOrtami } from '@/lib/ulke/araclar/birimler'
import { girdiyiCoz } from '@/lib/ulke/araclar/girdi'
import { kapiSonucu } from '@/lib/ulke/araclar/hastaKapisi'
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import { aracCalistir, hesabinAraci, lisansBildirimi, paketinAraci, sayiMetni, type Yazici } from '@/lib/ulke/araclar/paket'
import type { AracGirdisi, AracSonucu, AracTanimi, UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { anahtarUlkesi, ulkeyeOzelAnahtarlar } from '@/lib/ulke/araclar/ulkeyeOzel'
import { paketiDenetle } from '@/lib/ulke/paketDenetimi'
import { enArayuz } from '../../_dil/en/arayuz'
import { bicimYazimSorunlari, tumMetinler } from '../../_dil/en/testing/yazimDenetimi'
import { US_ARAYUZ } from '../arayuz'
import { US_GIRDI, US_HEKIMLER } from '../ayarlar'
import { US_PAKETI } from '../index'
import { US_KLINIK } from '../klinik'
import { US_KENDI_BIRIM_ADLARI, usAcilacakEk, usKendiAraclari } from './metinler'
import { US_ONAY_BEKLEYEN, US_ONAY_BEKLEYEN_ANAHTARLAR } from './onayBekleyen'
import { US_BMI, US_DUSME, US_ECOG, US_EGFR, US_GLUKOZ, US_PAKET_YIL, US_TANIMLAR, usEgfr2021, usGlukozBandi } from './tanimlar'

const D = 'en-US'
const KOK = resolve(__dirname, '../../..')
const A = US_ARAYUZ.araclar as UlkeAraclari
const ROLLER = US_PAKETI.uygulama!.roller!
const BUGUN = '2026-10-10'
const ORTAM = { bugun: BUGUN, p: {} }
const ANAHTARLAR = ['us-bmi', 'us-egfr-ckd-epi-2021', 'us-pack-years', 'us-blood-sugar-ranges', 'us-fall-risk-screen', 'us-ecog-performance-status']
const hesapla = (t: AracTanimi, g: AracGirdisi): AracSonucu => t.hesapla(g, ORTAM)

/** THIS TEST'S OWN WHAT-IF: the pack as it would be with all six switched on. No build has it. */
const EK = usAcilacakEk({ hekimler: US_HEKIMLER })
const ACIK_GIRDI = { ...US_GIRDI, araclar: { ...US_GIRDI.araclar, birimAdlari: { ...(US_GIRDI.araclar.birimAdlari ?? {}), ...EK.birimAdlari }, ek: EK.ek } }
const ACIK_ARAYUZ = enArayuz(ACIK_GIRDI)
const B = ACIK_ARAYUZ.araclar as UlkeAraclari
const O: BirimOrtami = { birimler: US_PAKETI.uygulama!.birimler, lab: B.labBirimleri, sayi: US_PAKETI.bicim }
const yazici: Yazici = { sayi: (deger, ondalik) => deger.toFixed(ondalik), tarih: (iso) => iso, birim: (kod) => B.birimler[kod]?.[D] ?? `?${kod}?` }
const yazarak = (k: string, ham: Record<string, string | boolean>) => { const x = paketinAraci(B, k)!; return aracCalistir(x, girdiyiCoz(x.tanim.alanlar, ham, O), BUGUN, B) }
const goren = (k: string): string[] => ROLLER.filter((r) => hesabinAraci(B, r, k) !== null)

describe('us new tools 1: ALL SIX ARE SWITCHED OFF, and await a clinician\'s sign-off', () => {
  it('the six: their mechanisms, their words and the list of tools awaiting sign-off name the same keys', () => {
    assert.deepEqual(US_TANIMLAR.map((t) => t.anahtar), ANAHTARLAR)
    assert.deepEqual([...US_ONAY_BEKLEYEN_ANAHTARLAR], ANAHTARLAR)
    assert.deepEqual(usKendiAraclari({ hekimler: US_HEKIMLER }).map((p) => p.anahtar), ANAHTARLAR)
    assert.ok(ANAHTARLAR.length <= 10, 'at most ten tools were to be built in this job')
    for (const x of US_ONAY_BEKLEYEN) assert.ok(x.sorular.length > 0 && x.sorular.every((q) => q.trim().length > 20), `${x.anahtar}: what the clinician is asked`)
    for (const k of ANAHTARLAR) { assert.equal(anahtarUlkesi(k, 'us'), 'us'); assert.equal(kitAraci(k), null, k); assert.match(k, /^us-[a-z0-9]+(-[a-z0-9]+)*$/); assert.ok(k.length <= 60) }
  })

  it('A TOOL AWAITING SIGN-OFF IS NOT IN THE PACK: not a tool, not a placeholder, not a mechanism — on no role\'s grid and not reachable by its address', () => {
    const acik = A.araclar.map((p) => p.anahtar)
    for (const k of US_ONAY_BEKLEYEN_ANAHTARLAR) {
      assert.ok(!acik.includes(k), `"${k}" is switched on and still awaits a clinician's sign-off: take it off countries/us/araclar/onayBekleyen.ts only with the clinician's name recorded and the owner's word`)
      assert.ok(!A.yuvalar.some((y) => y.anahtar === k), `${k} is a placeholder of the pack`)
      assert.ok(!(A.kendiAraclari ?? []).some((t) => t.anahtar === k), `${k}: the pack carries its arithmetic`)
      assert.equal(paketinAraci(A, k), null, k)
      for (const rol of [null, ...ROLLER]) assert.equal(hesabinAraci(A, rol, k), null, `${k} for ${rol}`)
    }
    // nothing of the country's own is in the pack today, so nothing can be on that is not on the list
    assert.equal(US_GIRDI.araclar.ek, undefined, 'the pack states no tool beyond the set')
    assert.deepEqual(ulkeyeOzelAnahtarlar(A, 'us'), [])
    assert.equal(A.kendiAraclari, undefined)
    // the day one is added, it must have left the list first
    for (const k of ulkeyeOzelAnahtarlar(A, 'us')) assert.ok(!US_ONAY_BEKLEYEN_ANAHTARLAR.includes(k), k)
  })

  it('NO BUILD OF THE UNITED STATES HOLDS A LINE OF THEM: the pack\'s settings do not import this folder, and no text or setting of the pack names a key', () => {
    const ayarlar = readFileSync(join(KOK, 'countries/us/ayarlar.ts'), 'utf8')
    assert.doesNotMatch(ayarlar, /from '\.\/araclar\//, 'countries/us/ayarlar.ts imports the country\'s own tools')
    for (const d of ['index.ts', 'arayuz.ts', 'klinik/index.ts', 'roller.ts', 'temel.ts']) assert.doesNotMatch(readFileSync(join(KOK, 'countries/us', d), 'utf8'), /araclar\/(tanimlar|metinler|onayBekleyen)/, d)
    const yazi = JSON.stringify([US_PAKETI.uygulama, A], (_k, v) => (typeof v === 'function' ? undefined : v))
    for (const k of ANAHTARLAR) assert.ok(!yazi.includes(`"${k}"`), `"${k}" is named in the pack`)
    for (const kod of Object.keys(US_KENDI_BIRIM_ADLARI)) assert.ok(!(kod in A.birimler), `the unit "${kod}" of a tool that is off is in the pack`)
  })

  it('while none is in the pack, countries/yasak-araclar.json lists no key for the United States (it lists a key the day its tool is switched on)', () => {
    const liste = JSON.parse(readFileSync(join(KOK, 'countries/yasak-araclar.json'), 'utf8')) as Record<string, string[] | string>
    assert.deepEqual([...((liste.us as string[] | undefined) ?? [])].sort(), ulkeyeOzelAnahtarlar(A, 'us'))
  })
})

describe('us new tools 2: the arithmetic of each, against its source\'s own worked examples (every source opened on 2026-10-10)', () => {
  /**
   * CDC, "Adult BMI Categories" (last reviewed March 19, 2024), https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html:
   * its example of an adult 5 feet 9 inches tall — 124 pounds or less Underweight; 125 to 168 Healthy Weight; 169 to
   * 202 Overweight; 203 to 236 Class 1 Obesity; 237 to 270 Class 2; 271 or more Class 3.
   * CDC, "About Body Mass Index (BMI)" (Dec. 16, 2025), https://www.cdc.gov/bmi/about/index.html: weight in
   * kilograms divided by the square of height in meters.
   */
  it('BODY MASS INDEX: the ten weights of the CDC\'s example at 5 feet 9 inches fall in the category the CDC prints for each', () => {
    const bmi = (lb: number) => hesapla(US_BMI, { boy_ft: 5, boy_in: 9, agirlik_lb: lb })
    for (const [lb, bant] of [[124, 'zayif'], [125, 'saglikli'], [168, 'saglikli'], [169, 'fazla_kilolu'], [202, 'fazla_kilolu'], [203, 'obezite_1'], [236, 'obezite_1'], [237, 'obezite_2'], [270, 'obezite_2'], [271, 'obezite_3']] as const) {
      const s = bmi(lb)
      assert.equal(s.tamam, true)
      assert.equal(s.bant, bant, `${lb} pounds at 5 feet 9 inches`)
    }
    // the index itself: kilograms over meters squared with the exact factors, to one decimal place
    assert.equal(bmi(125).sayilar[0].deger, 18.5, '125 lb = 56.699 kg; 69 in = 1.7526 m; 56.699 / 3.0716 = 18.46, written 18.5')
    assert.equal(bmi(169).sayilar[0].deger, 25)
    assert.equal(bmi(203).sayilar[0].deger, 30)
    assert.equal(bmi(160).sayilar[0].deger, 23.6)
  })

  it('BODY MASS INDEX: nothing is worked out from half an answer, or outside the limits the CDC\'s calculator states (3 to 9 feet, 55 to 1,000 pounds)', () => {
    assert.equal(hesapla(US_BMI, { boy_ft: 5, boy_in: null, agirlik_lb: 160 }).tamam, false, 'the inches are typed, 0 included: "5 feet" alone is not read as 5 feet 0 inches')
    assert.equal(hesapla(US_BMI, { boy_ft: 5, boy_in: 0, agirlik_lb: 160 }).tamam, true)
    assert.equal(hesapla(US_BMI, { boy_ft: null, boy_in: 9, agirlik_lb: 160 }).tamam, false)
    assert.equal(hesapla(US_BMI, { boy_ft: 5, boy_in: 9, agirlik_lb: null }).tamam, false)
    assert.equal(hesapla(US_BMI, { boy_ft: 5, boy_in: 12, agirlik_lb: 160 }).tamam, false, '12 inches is another foot')
    assert.equal(hesapla(US_BMI, { boy_ft: 9, boy_in: 1, agirlik_lb: 160 }).tamam, false)
    assert.equal(hesapla(US_BMI, { boy_ft: 9, boy_in: 0, agirlik_lb: 160 }).tamam, true)
    assert.equal(hesapla(US_BMI, { boy_ft: 5, boy_in: 9, agirlik_lb: 54 }).tamam, false)
    assert.equal(hesapla(US_BMI, { boy_ft: 5, boy_in: 9, agirlik_lb: 1001 }).tamam, false)
  })

  /**
   * National Kidney Foundation, "Example IT ticket: implement 2021 CKD-EPI equation to calculate eGFR from creatinine",
   * https://kidney.org/sites/default/files/example_it_ticket-implement_2021_ckd-epi_equation_to_calculate_egfr_from_creatinine_1.pdf:
   * eight test cases, in whole numbers, creatinine in mg/dL. The equation: National Institute of Diabetes and
   * Digestive and Kidney Diseases, "eGFR Equations for Adults" (last reviewed May 2025).
   */
  it('ESTIMATED GFR: the eight test cases the National Kidney Foundation prints for the 2021 CKD-EPI creatinine equation', () => {
    const egfr = (cinsiyet: string, yas: number, kreatinin: number) => hesapla(US_EGFR, { cinsiyet, yas, kreatinin })
    for (const [yas, cinsiyet, kreatinin, beklenen] of [
      [18, 'erkek', 0.90, 127], [18, 'erkek', 0.91, 125], [18, 'kadin', 0.70, 128], [18, 'kadin', 0.71, 126],
      [90, 'erkek', 0.50, 97], [90, 'erkek', 1.50, 44], [90, 'kadin', 0.50, 89], [90, 'kadin', 1.50, 33],
    ] as const) {
      const s = egfr(cinsiyet, yas, kreatinin)
      assert.equal(s.tamam, true)
      assert.deepEqual(s.sayilar.map((x) => [x.anahtar, x.deger, x.ondalik, x.birim]), [['egfr', beklenen, 0, 'mL/min/1.73m2']], `age ${yas}, ${cinsiyet}, ${kreatinin} mg/dL`)
      assert.equal(s.bant, null, 'no category and no stage')
    }
    // under 18 years nothing is calculated; nor without the sex, the age or the creatinine
    assert.equal(egfr('erkek', 17, 0.9).tamam, false)
    assert.equal(hesapla(US_EGFR, { cinsiyet: null, yas: 40, kreatinin: 1 }).tamam, false)
    assert.equal(hesapla(US_EGFR, { cinsiyet: 'kadin', yas: null, kreatinin: 1 }).tamam, false)
    assert.equal(hesapla(US_EGFR, { cinsiyet: 'kadin', yas: 40, kreatinin: null }).tamam, false)
    // the equation, term by term as the institute prints it: at the knot (creatinine = κ) both powers are 1
    assert.ok(Math.abs(usEgfr2021(false, 0, 0.9) - 142) < 1e-9)
    assert.ok(Math.abs(usEgfr2021(true, 0, 0.7) - 142 * 1.012) < 1e-9)
    assert.ok(Math.abs(usEgfr2021(false, 50, 0.9) - 142 * Math.pow(0.9938, 50)) < 1e-9)
    assert.ok(Math.abs(usEgfr2021(false, 0, 1.8) - 142 * Math.pow(2, -1.2)) < 1e-9)
    assert.ok(Math.abs(usEgfr2021(false, 0, 0.45) - 142 * Math.pow(0.5, -0.302)) < 1e-9)
    assert.ok(Math.abs(usEgfr2021(true, 0, 0.35) - 142 * Math.pow(0.5, -0.241) * 1.012) < 1e-9)
  })

  /**
   * CDC, "Screening for Lung Cancer" (page dated May 12, 2026), https://www.cdc.gov/lung-cancer/screening/index.html:
   * a pack-year is an average of one pack a day for one year; one pack a day for 20 years and two packs a day for
   * 10 years are each 20 pack-years. Screening: 20 pack-years or more, AND smokes now or quit within the past 15
   * years, AND between 50 and 80 years old; it stops at 81, or after 15 or more years without smoking.
   */
  it('PACK-YEARS: the CDC\'s two examples are 20 pack-years each; the three criteria, at each of their limits', () => {
    const s = (g: AracGirdisi) => hesapla(US_PAKET_YIL, g)
    const iciyor = { yas: 60, durum: 'iciyor', birakali_yil: null }
    assert.equal(s({ ...iciyor, paket_gun: 1, icilen_yil: 20 }).sayilar[0].deger, 20)
    assert.equal(s({ ...iciyor, paket_gun: 2, icilen_yil: 10 }).sayilar[0].deger, 20)
    assert.equal(s({ ...iciyor, paket_gun: 1, icilen_yil: 20 }).bant, 'karsiliyor')
    assert.equal(s({ ...iciyor, paket_gun: 0.5, icilen_yil: 30 }).sayilar[0].deger, 15)
    assert.deepEqual(s({ ...iciyor, paket_gun: 0.5, icilen_yil: 30 }).uyarilar, ['paket_yil_az'])
    assert.equal(s({ ...iciyor, paket_gun: 0.5, icilen_yil: 30 }).bant, 'karsilamiyor')
    // age: 50 to 80
    const yas = (y: number) => s({ yas: y, paket_gun: 1, icilen_yil: 25, durum: 'iciyor', birakali_yil: null })
    assert.deepEqual([49, 50, 80, 81].map((y) => yas(y).bant), ['karsilamiyor', 'karsiliyor', 'karsiliyor', 'karsilamiyor'])
    assert.deepEqual(yas(49).uyarilar, ['yas_disinda'])
    // quit within the past 15 years: 14 holds, 15 or more does not
    const birakti = (y: number | null) => s({ yas: 60, paket_gun: 1, icilen_yil: 25, durum: 'birakti', birakali_yil: y })
    assert.deepEqual([0, 14, 14.9].map((y) => birakti(y).bant), ['karsiliyor', 'karsiliyor', 'karsiliyor'])
    assert.deepEqual([15, 16, 30].map((y) => birakti(y).uyarilar), [['birakali_uzun'], ['birakali_uzun'], ['birakali_uzun']])
    assert.equal(birakti(null).tamam, false, 'has quit, and the years since are not typed: no result')
    // every criterion that fails is named
    assert.deepEqual(s({ yas: 45, paket_gun: 0.5, icilen_yil: 10, durum: 'birakti', birakali_yil: 20 }).uyarilar, ['yas_disinda', 'paket_yil_az', 'birakali_uzun'])
    assert.equal(s({ yas: 60, paket_gun: null, icilen_yil: 20, durum: 'iciyor', birakali_yil: null }).tamam, false)
    assert.equal(s({ yas: 60, paket_gun: 1, icilen_yil: 20, durum: null, birakali_yil: null }).tamam, false)
  })

  /**
   * CDC, "Diabetes Testing" (May 15, 2024), https://www.cdc.gov/diabetes/diabetes-testing/index.html — the table:
   * A1C below 5.7% / 5.7–6.4% / 6.5% or above; fasting blood sugar 99 mg/dL or below / 100–125 / 126 or above;
   * glucose tolerance test 140 mg/dL or below / 140–199 / 200 or above; random blood sugar 200 mg/dL or above.
   */
  it('BLOOD SUGAR TESTS: the two ends of every range the CDC\'s table prints', () => {
    for (const [deger, bant] of [[5.6, 'normal'], [5.7, 'prediyabet'], [6.4, 'prediyabet'], [6.5, 'diyabet'], [9, 'diyabet']] as const) assert.equal(usGlukozBandi('a1c', deger), bant, `A1C ${deger}%`)
    for (const [deger, bant] of [[99, 'normal'], [100, 'prediyabet'], [125, 'prediyabet'], [126, 'diyabet']] as const) assert.equal(usGlukozBandi('aclik', deger), bant, `fasting ${deger}`)
    for (const [deger, bant] of [[139, 'normal'], [141, 'prediyabet'], [199, 'prediyabet'], [200, 'diyabet']] as const) assert.equal(usGlukozBandi('ogtt', deger), bant, `2-hour ${deger}`)
    for (const [deger, bant] of [[199, 'rastgele_200_alti'], [200, 'diyabet'], [320, 'diyabet']] as const) assert.equal(usGlukozBandi('rastgele', deger), bant, `random ${deger}`)
    // WHAT THE TABLE LEAVES OPEN, AS THE TOOL DECIDES IT (for a US clinician: ./onayBekleyen.ts)
    assert.equal(usGlukozBandi('ogtt', 140), 'prediyabet', '140 is printed in two columns: the prediabetes one is taken')
    assert.equal(usGlukozBandi('a1c', 6.45), 'prediyabet', 'between two printed ranges: the lower one')
    assert.equal(usGlukozBandi('aclik', 99.5), 'normal')
    // through the tool: one test at a time, its own field, and no result from the other test's field
    assert.equal(hesapla(US_GLUKOZ, { test: 'a1c', a1c: 5.7, glukoz: null }).bant, 'prediyabet')
    assert.equal(hesapla(US_GLUKOZ, { test: 'aclik', a1c: null, glukoz: 126 }).bant, 'diyabet')
    assert.equal(hesapla(US_GLUKOZ, { test: 'a1c', a1c: null, glukoz: 126 }).tamam, false, 'an A1C was asked for and a glucose typed')
    assert.equal(hesapla(US_GLUKOZ, { test: null, a1c: 6, glukoz: 100 }).tamam, false)
  })

  /**
   * CDC, "STEADI: Algorithm for Fall Risk Screening, Assessment, and Intervention" (2019),
   * https://www.cdc.gov/steadi/media/pdfs/STEADI-Algorithm-508.pdf: three key questions; yes to any one = screened
   * at risk; otherwise screened not at risk.
   */
  it('FALL RISK: yes to any of the three key questions is a positive screen — all eight combinations', () => {
    for (const a of ['evet', 'hayir']) for (const b of ['evet', 'hayir']) for (const c of ['evet', 'hayir']) {
      const s = hesapla(US_DUSME, { dengesiz: a, endise: b, dustu: c })
      assert.equal(s.tamam, true)
      assert.equal(s.bant, [a, b, c].includes('evet') ? 'riskli' : 'riskli_degil', `${a}, ${b}, ${c}`)
    }
    // a question left open is never read as "no"
    assert.equal(hesapla(US_DUSME, { dengesiz: 'hayir', endise: 'hayir', dustu: null }).tamam, false)
    assert.equal(hesapla(US_DUSME, { dengesiz: 'evet', endise: null, dustu: null }).tamam, false)
  })

  /**
   * ECOG-ACRIN Cancer Research Group, "ECOG Performance Status Scale",
   * https://ecog-acrin.org/resources/ecog-performance-status/: six grades, numbered 0 to 5.
   */
  it('ECOG PERFORMANCE STATUS: six grades, 0 to 5, each recorded as chosen; the product holds no wording of a grade', () => {
    assert.deepEqual([...(US_ECOG.alanlar[0].secenekler ?? [])], ['d0', 'd1', 'd2', 'd3', 'd4', 'd5'])
    for (const d of ['d0', 'd1', 'd2', 'd3', 'd4', 'd5']) assert.equal(hesapla(US_ECOG, { derece: d }).bant, d)
    assert.equal(hesapla(US_ECOG, { derece: null }).tamam, false)
    assert.equal(hesapla(US_ECOG, { derece: 'd6' }).tamam, false)
    const p = usKendiAraclari({ hekimler: US_HEKIMLER }).find((x) => x.anahtar === 'us-ecog-performance-status')!
    assert.deepEqual(Object.values(p.metin.bantlar!).map((m) => m[D]), ['ECOG 0', 'ECOG 1', 'ECOG 2', 'ECOG 3', 'ECOG 4', 'ECOG 5'])
    assert.deepEqual(Object.values(p.metin.secenekler!.derece).map((m) => m[D]), ['0', '1', '2', '3', '4', '5'])
  })

  it('EVERY SOURCE STANDS BESIDE THE CODE IT WAS READ FOR: its address in ./tanimlar.ts, and the day', () => {
    const kaynak = readFileSync(join(__dirname, 'tanimlar.ts'), 'utf8')
    for (const adres of [
      'https://www.cdc.gov/bmi/about/index.html', 'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html', 'https://www.cdc.gov/bmi/adult-calculator/index.html',
      'https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults',
      'https://kidney.org/sites/default/files/example_it_ticket-implement_2021_ckd-epi_equation_to_calculate_egfr_from_creatinine_1.pdf',
      'https://www.cdc.gov/lung-cancer/screening/index.html', 'https://www.cdc.gov/diabetes/diabetes-testing/index.html',
      'https://www.cdc.gov/steadi/media/pdfs/STEADI-Algorithm-508.pdf', 'https://ecog-acrin.org/resources/ecog-performance-status/',
    ]) assert.ok(kaynak.includes(adres), adres)
    assert.match(kaynak, /OPENED ON 2026-10-10/)
    for (const t of US_TANIMLAR) assert.ok(t.kaynak && t.kaynak.trim().length > 20, `${t.anahtar}: the citation shown under a result`)
  })
})

describe('us new tools 3: each is complete — WITH ALL SIX SWITCHED ON, IN THIS TEST ONLY', () => {
  it('the whole pack check finds nothing: every word, unit, role, patient gate and licence is there', () => {
    assert.deepEqual(paketiDenetle(US_PAKETI, ACIK_ARAYUZ, US_KLINIK).map((x) => `${x.yer}: ${x.sorun}`), [])
    for (const k of ANAHTARLAR) assert.ok(paketinAraci(B, k), k)
    assert.deepEqual([...(B.kendiAraclari ?? [])].map((t) => t.anahtar), ANAHTARLAR)
    // one tool can be switched on without the others: only what has left the list is handed over
    assert.deepEqual(usAcilacakEk({ hekimler: US_HEKIMLER }, ['us-bmi']).ek.araclar.map((p) => p.anahtar), ['us-bmi'])
    assert.deepEqual(usAcilacakEk({ hekimler: US_HEKIMLER }, ['us-bmi']).ek.tanimlar.map((t) => t.anahtar), ['us-bmi'])
    // and the real pack is untouched by the what-if
    assert.ok(!A.araclar.some((p) => ANAHTARLAR.includes(p.anahtar)))
  })

  it('WHO WOULD SEE EACH, as the audit decided: four for every doctor role (two of them also for named professions), one for three specialties', () => {
    const hekimler = [...US_HEKIMLER]
    const sirali = (liste: readonly string[]) => ROLLER.filter((r) => liste.includes(r))
    assert.deepEqual(goren('us-bmi'), sirali([...hekimler, 'dietetics']))
    assert.deepEqual(goren('us-egfr-ckd-epi-2021'), sirali(hekimler))
    assert.deepEqual(goren('us-pack-years'), sirali(hekimler))
    assert.deepEqual(goren('us-blood-sugar-ranges'), sirali([...hekimler, 'dietetics', 'podiatry']))
    assert.deepEqual(goren('us-fall-risk-screen'), sirali([...hekimler, 'physiotherapy', 'occupational-therapy']))
    assert.deepEqual(goren('us-ecog-performance-status'), ['oncology', 'radiation-oncology', 'hospice-palliative-medicine'])
    // "every doctor role" is a promise the pack check keeps when a doctor role is added
    for (const k of ['us-egfr-ckd-epi-2021', 'us-pack-years']) assert.equal(B.araclar.find((p) => p.anahtar === k)!.sinif, 'hekimler', k)
    // an account without a role sees none of them
    for (const k of ANAHTARLAR) assert.equal(hesabinAraci(B, null, k), null, k)
    // no profession is shown a tool that was not named for it
    for (const rol of ['clinical-psychology', 'clinical-social-work', 'audiology', 'optometry', 'chiropractic', 'nurse-midwifery', 'speech-language-pathology']) for (const k of ANAHTARLAR) assert.equal(hesabinAraci(B, rol, k), null, `${k} for ${rol}`)
  })

  it('A TOOL FOR SOME PATIENTS ONLY IS HELD BACK FOR THE OTHERS: the ages each source states; an unknown birth date never opens it', () => {
    const kapi = (k: string, dogum: string | null) => kapiSonucu(B.araclar.find((p) => p.anahtar === k)!.hasta, { dogumTarihi: dogum }, BUGUN)
    // body mass index: adults 20 and older (CDC)
    assert.deepEqual([kapi('us-bmi', '2006-10-10'), kapi('us-bmi', '2006-10-11'), kapi('us-bmi', null)], ['uygun', 'degil', 'degil'])
    // estimated GFR: 18 and over (the equation's table)
    assert.deepEqual([kapi('us-egfr-ckd-epi-2021', '2008-10-10'), kapi('us-egfr-ckd-epi-2021', '2008-10-11'), kapi('us-egfr-ckd-epi-2021', null)], ['uygun', 'degil', 'degil'])
    // fall risk: 65 and older (STEADI)
    assert.deepEqual([kapi('us-fall-risk-screen', '1961-10-10'), kapi('us-fall-risk-screen', '1961-10-11'), kapi('us-fall-risk-screen', null)], ['uygun', 'degil', 'degil'])
    // the other three ask what they need themselves and have no gate
    for (const k of ['us-pack-years', 'us-blood-sugar-ranges', 'us-ecog-performance-status']) assert.equal(kapi(k, null), 'kapisiz', k)
    for (const k of ['us-bmi', 'us-egfr-ckd-epi-2021', 'us-fall-risk-screen']) assert.match(B.araclar.find((p) => p.anahtar === k)!.metin.hastaKapisi![D], /^This tool is for adults aged \d+ and over/)
  })

  it('TYPED AS A DOCTOR HERE TYPES: feet, inches and pounds; creatinine in mg/dL; and the result as the screen would write it', () => {
    const bmi = yazarak('us-bmi', { boy_ft: '5', boy_in: '9', agirlik_lb: '160' })
    assert.equal(bmi.bant, 'saglikli')
    assert.equal(sayiMetni(bmi.sayilar[0], B.metinler[D]!, yazici, O), '23.6 kg/m²')
    assert.equal(yazarak('us-bmi', { boy_ft: '5.5', boy_in: '9', agirlik_lb: '160' }).tamam, false, 'feet are whole: half a foot is typed as inches')
    const egfr = yazarak('us-egfr-ckd-epi-2021', { cinsiyet: 'kadin', yas: '90', kreatinin: '1.50' })
    assert.equal(sayiMetni(egfr.sayilar[0], B.metinler[D]!, yazici, O), '33 mL/min/1.73 m²')
    assert.equal(B.labBirimleri.kreatinin, 'mg/dL')
    assert.equal(yazarak('us-pack-years', { yas: '60', paket_gun: '1', icilen_yil: '20', durum: 'iciyor' }).bant, 'karsiliyor')
    assert.equal(yazarak('us-pack-years', { yas: '60', paket_gun: '1', icilen_yil: '20', durum: 'birakti' }).tamam, false)
    assert.equal(yazarak('us-blood-sugar-ranges', { test: 'aclik', glukoz: '100' }).bant, 'prediyabet')
    assert.equal(yazarak('us-fall-risk-screen', { dengesiz: 'hayir', endise: 'evet', dustu: 'hayir' }).bant, 'riskli')
    assert.equal(yazarak('us-ecog-performance-status', { derece: 'd2' }).bant, 'd2')
    // every unit a field or a result shows has a name
    for (const kod of ['ft', 'in', 'lb', 'kg/m2', 'mg/dL', '%', 'mL/min/1.73m2']) assert.ok(B.birimler[kod]?.[D]?.trim(), kod)
  })
})

describe('us new tools 4: the words and the licences', () => {
  const araclar = usKendiAraclari({ hekimler: US_HEKIMLER })
  const metinler = tumMetinler(araclar.map((p) => ({ metin: p.metin, bildirim: p.lisans?.bildirim })))

  it('American spelling in every word of every screen', () => {
    assert.ok(metinler.length > 90, `${metinler.length} texts`)
    assert.deepEqual(metinler.flatMap((x) => bicimYazimSorunlari(x.metin, D).map((s) => `${x.yer}: ${s}`)), [])
  })

  it('nothing of another country, no claim, no price, no identity number', () => {
    const YABANCI = /\b(NHS|NHI|GBP|CAD|AUD|NZD|United Kingdom|Canada|Canadian|provincial|Quebec|Australia|Australian|New Zealand|Medicare|health card|General practice|Anaesthetics|Respirology|staff physician|consultant)\b|£/
    const TURKIYE_OZBEKISTAN = /Türkiye|Turkey|Turkish|Uzbek|Tashkent|\bSGK\b|MEDULA|e-Nabız|\bKVKK\b|JSHSHIR|PINFL|[çğıöşüİĞŞÇÖÜʻўқғҳЎҚҒҲ]/
    const IDDIA = /\b(HIPAA|GDPR|PIPEDA|FDA|TGA|MHRA|Medsafe|Health Canada|ISO ?\d+|SOC ?2|CE[- ]mark\w*|compliant|compliance|certified|certification|accredited|accreditation|endorsed|clinically proven|cleared|integrat\w*|trusted by|award\w*|guarantee\w*|free trial|discount\w*)\b/i
    const KIMLIK = /social security|\bSSN\b/i
    const PARA = /\d[\d,.]*\s*(USD|GBP|CAD|AUD|NZD|dollars?|pounds?)\b|[$£€]\s*\d/
    for (const desen of [YABANCI, TURKIYE_OZBEKISTAN, IDDIA, KIMLIK, PARA]) {
      assert.deepEqual(metinler.filter((x) => desen.test(x.metin)).map((x) => `${x.yer}: ${desen.exec(x.metin)?.[0]}`), [])
    }
    // no tool says that an agency, an institute or a society stands behind the product
    for (const x of metinler) assert.doesNotMatch(x.metin, /\b(approved by|recommended by|in partnership with|on behalf of)\b/i, x.yer)
  })

  it('every tool says under its result what it is not', () => {
    for (const p of araclar) assert.match(p.metin.not[D], /doctor's|clinician's/, p.anahtar)
  })

  it('A LICENCE IS STATED "FREE" ONLY WITH THE RIGHTS HOLDER NAMED, THE NOTICE THAT WAS READ AND THE DAY — and the holder\'s credit stands under every result', () => {
    const beklenen: Readonly<Record<string, readonly [RegExp, string]>> = {
      'us-bmi': [/Centers for Disease Control and Prevention/, 'https://www.cdc.gov/other/agencymaterials.html'],
      'us-pack-years': [/Centers for Disease Control and Prevention/, 'https://www.cdc.gov/other/agencymaterials.html'],
      'us-blood-sugar-ranges': [/Centers for Disease Control and Prevention/, 'https://www.cdc.gov/other/agencymaterials.html'],
      'us-fall-risk-screen': [/Centers for Disease Control and Prevention/, 'https://www.cdc.gov/other/agencymaterials.html'],
      'us-egfr-ckd-epi-2021': [/National Institute of Diabetes and Digestive and Kidney Diseases/, 'https://www.niddk.nih.gov/copyright'],
      'us-ecog-performance-status': [/ECOG-ACRIN Cancer Research Group/, 'https://ecog-acrin.org/resources/ecog-performance-status/'],
    }
    assert.deepEqual(Object.keys(beklenen).sort(), [...ANAHTARLAR].sort())
    for (const p of araclar) {
      const [sahip, adres] = beklenen[p.anahtar]
      assert.equal(p.lisans?.durum, 'serbest', p.anahtar)
      assert.match(p.lisans?.hakSahibi ?? '', sahip, p.anahtar)
      assert.ok(p.lisans?.kaynak?.includes(adres), `${p.anahtar}: ${adres}`)
      assert.match(p.lisans?.kaynak ?? '', /read 2026-10-10/, p.anahtar)
      // the notice: the credit, as the holder asks for it, shown under every result and copied with the summary
      const bildirim = lisansBildirimi({ paket: B.araclar.find((x) => x.anahtar === p.anahtar)! }, D)
      assert.match(bildirim, sahip, p.anahtar)
    }
    // the CDC's terms: credit, where the material is, and no endorsement implied
    const cdc = lisansBildirimi({ paket: B.araclar.find((x) => x.anahtar === 'us-bmi')! }, D)
    assert.match(cdc, /available on the CDC website at no charge/)
    assert.match(cdc, /does not imply endorsement of this product/)
    // the ECOG group's: the scale's name, its credit line and its citation
    const ecog = lisansBildirimi({ paket: B.araclar.find((x) => x.anahtar === 'us-ecog-performance-status')! }, D)
    assert.match(ecog, /^ECOG Performance Status Scale\./)
    assert.match(ecog, /Am J Clin Oncol\. 1982;5\(6\):649-655\./)
  })
})
