/**
 * NOTYA-ULKE-UYGULA-CA — Canada: THE TWO TOOLS ONLY THIS COUNTRY HAS (./tanimlar.ts, ./metinler.ts).
 *
 *   1. BOTH ARE SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF (the owner's order of 2026-10-10), and the list says so
 *      (./onayBekleyen.ts). THE LIST AND THE PACK'S SWITCHED-ON TOOLS OF ITS OWN MATCH EXACTLY: this test fails when a
 *      tool of this country is on and not listed, and when a listed tool is not on.
 *   2. THE ARITHMETIC OF EACH, AGAINST ITS SOURCE'S OWN FIGURES. Every source was opened on 2026-10-10; the numbers
 *      below are the ones the source prints, not ones worked out here.
 *   3. EACH IS COMPLETE IN THE PACK: the whole pack check finds nothing, every role the audit named sees its tool,
 *      and the tool that is for adults only is held back for the others.
 *   4. THE WORDS: Canadian spelling, nothing of another country, no claim, a licence stated "free" only with the
 *      rights holder named and the notice that was read.
 */
import '../testing/caDerlemesi'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { INC_CM, LB_KG, type BirimOrtami } from '@/lib/ulke/araclar/birimler'
import { girdiyiCoz, hamdanGosterilen } from '@/lib/ulke/araclar/girdi'
import { kapiSonucu } from '@/lib/ulke/araclar/hastaKapisi'
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import { aracCalistir, aracOzeti, hesabinAraci, hesabinAraclari, lisansBildirimi, paketinAraci, sayiMetni, type Yazici } from '@/lib/ulke/araclar/paket'
import type { AracGirdisi, AracSonucu, AracTanimi, UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { anahtarUlkesi, ulkeyeOzelAnahtarlar } from '@/lib/ulke/araclar/ulkeyeOzel'
import { paketiDenetle } from '@/lib/ulke/paketDenetimi'
import { bicimYazimSorunlari } from '../../_dil/en/testing/yazimDenetimi'
import { CA_ARAYUZ } from '../arayuz'
import { CA_GIRDI, CA_HEKIMLER } from '../ayarlar'
import { CA_PAKETI } from '../index'
import { CA_KLINIK } from '../klinik'
import { caKendiAraclari } from './metinler'
import { CA_ONAY_BEKLEYEN, CA_ONAY_BEKLEYEN_ANAHTARLAR } from './onayBekleyen'
import { CA_BIRIM_CEVIRICI, CA_EGFR, CA_FT_CM, CA_IN_CM, CA_LB_KG, CA_TANIMLAR, caEgfr2021 } from './tanimlar'

const D = 'en-CA'
const KOK = resolve(__dirname, '../../..')
const A = CA_ARAYUZ.araclar as UlkeAraclari
const M = A.metinler[D]!
const ROLLER = CA_PAKETI.uygulama!.roller!
const BUGUN = '2026-10-10'
const ORTAM = { bugun: BUGUN, p: {} }
const ANAHTARLAR = ['ca-unit-converter', 'ca-egfr-ckd-epi-2021']
const hesapla = (t: AracTanimi, g: AracGirdisi): AracSonucu => t.hesapla(g, ORTAM)
const O: BirimOrtami = { birimler: CA_PAKETI.uygulama!.birimler, lab: A.labBirimleri, sayi: CA_PAKETI.bicim }
const yazici: Yazici = { sayi: (deger, ondalik) => deger.toFixed(ondalik), tarih: (iso) => iso, birim: (kod) => A.birimler[kod]?.[D] ?? `?${kod}?` }
const yazarak = (k: string, ham: Record<string, string | boolean>) => { const x = paketinAraci(A, k)!; return aracCalistir(x, girdiyiCoz(x.tanim.alanlar, ham, O), BUGUN, A) }
const yazili = (k: string, ham: Record<string, string | boolean>) => Object.fromEntries(yazarak(k, ham).sayilar.map((s) => [s.anahtar, sayiMetni(s, M, yazici, O)]))
const goren = (k: string): string[] => ROLLER.filter((r) => hesabinAraci(A, r, k) !== null)
const KENDI = caKendiAraclari({ hekimler: CA_HEKIMLER })

describe('ca new tools 1: BOTH ARE SWITCHED ON, without a clinician\'s sign-off, and the list says so', () => {
  it('the two: their mechanisms, their words and the list name the same keys', () => {
    assert.deepEqual(CA_TANIMLAR.map((t) => t.anahtar), ANAHTARLAR)
    assert.deepEqual([...CA_ONAY_BEKLEYEN_ANAHTARLAR], ANAHTARLAR)
    assert.deepEqual(KENDI.map((p) => p.anahtar), ANAHTARLAR)
    for (const x of CA_ONAY_BEKLEYEN) assert.ok(x.sorular.length > 0 && x.sorular.every((s) => s.trim().length > 20), `${x.anahtar}: what the clinician is asked`)
  })

  it('THE LIST OF TOOLS SWITCHED ON WITHOUT A SIGN-OFF AND THE PACK\'S SWITCHED-ON TOOLS OF ITS OWN MATCH EXACTLY', () => {
    const acikKendi = A.araclar.map((p) => p.anahtar).filter((k) => anahtarUlkesi(k, 'ca') === 'ca')
    assert.deepEqual([...acikKendi].sort(), [...CA_ONAY_BEKLEYEN_ANAHTARLAR].sort(), 'a tool of this country is on and not on the list, or is on the list and not on: countries/ca/araclar/onayBekleyen.ts and ../ayarlar.ts → ek.araclar must name the same tools. A tool leaves the list only with the clinician\'s name recorded.')
    // every key of the country's own anywhere in the pack (a tool, a placeholder, a mechanism) is one of them: nothing is half-added
    assert.deepEqual(ulkeyeOzelAnahtarlar(A, 'ca'), [...CA_ONAY_BEKLEYEN_ANAHTARLAR].sort())
    assert.deepEqual((A.kendiAraclari ?? []).map((t) => t.anahtar), ANAHTARLAR)
    assert.deepEqual((CA_GIRDI.araclar.ek?.araclar ?? []).map((p) => p.anahtar), ANAHTARLAR)
    // on, so not a placeholder
    for (const k of ANAHTARLAR) { assert.ok(paketinAraci(A, k), k); assert.ok(!A.yuvalar.some((y) => y.anahtar === k), `${k} is also a placeholder`) }
  })

  it('every key carries this country\'s code, is no key of the kit, and is listed for Canada in countries/yasak-araclar.json, so no other country, no language set and no kit file can name one', () => {
    const liste = (JSON.parse(readFileSync(join(KOK, 'countries/yasak-araclar.json'), 'utf8')) as Record<string, string[]>).ca
    assert.deepEqual([...liste].sort(), [...ANAHTARLAR].sort())
    for (const k of ANAHTARLAR) { assert.equal(anahtarUlkesi(k, 'ca'), 'ca'); assert.equal(kitAraci(k), null, k); assert.match(k, /^ca-[a-z0-9]+(-[a-z0-9]+)*$/); assert.ok(k.length <= 60) }
  })

  it('no tool that is off was switched on with them: ESI triage, the report outline and both kidney tools are off', () => {
    const acik = A.araclar.map((p) => p.anahtar)
    for (const k of ['esi-triyaj', 'rapor-taslagi', 'kdigo-evre', 'kdigo-serit']) assert.ok(!acik.includes(k), k)
  })

  it('THE PROPOSALS THAT WERE NOT BUILT are not half-built: no key of theirs is anywhere in the pack', () => {
    // each needs a rights holder's permission, or its terms or its defining publication could not be opened (the report of 2026-10-10)
    const yapilmayan = ['ca-blood-pressure', 'ca-ctas', 'ca-framingham', 'ca-chads65', 'ca-kfre', 'ca-canrisk', 'ca-fracture-risk', 'ca-who-growth-charts', 'ca-rourke', 'ca-concussion-steps', 'ca-ottawa-rules', 'ca-stroke-scales', 'ca-pregnancy-dating']
    assert.equal(yapilmayan.length + ANAHTARLAR.length, 15, 'the fifteen proposals of the audit')
    const hepsi = [...A.araclar.map((p) => p.anahtar), ...A.yuvalar.map((y) => y.anahtar), ...(A.kendiAraclari ?? []).map((t) => t.anahtar)]
    for (const k of yapilmayan) assert.ok(!hepsi.includes(k), k)
  })
})

describe('ca new tools 2: the arithmetic of each, against its source\'s own figures (every source opened on 2026-10-10)', () => {
  /**
   * Weights and Measures Act, R.S.C., 1985, c. W-6, Schedule II, "Canadian Units of Measurement" (current to
   * 2026-06-21), https://laws-lois.justice.gc.ca/eng/acts/W-6/page-7.html: the yard is 9 144/10 000 of a metre, the
   * foot 1/3 of a yard, the inch 1/36 of a yard; the pound is 45 359 237/100 000 000 of a kilogram.
   */
  it('UNIT CONVERTER: the factors are the fractions of the Weights and Measures Act, and they are the kit\'s own constants', () => {
    assert.equal(CA_LB_KG, 45359237 / 100000000)
    assert.equal(CA_LB_KG, 0.45359237)
    // a yard is 0.9144 m = 91.44 cm: a foot is a third of it, an inch a thirty-sixth
    assert.equal(CA_FT_CM, 30.48)
    assert.equal(CA_IN_CM, 2.54)
    assert.equal(CA_FT_CM * 3, 91.44)
    assert.equal(CA_IN_CM * 36, 91.44)
    assert.equal(CA_IN_CM, INC_CM)
    assert.equal(CA_LB_KG, LB_KG)
    // one of each, through the tool
    assert.deepEqual(hesapla(CA_BIRIM_CEVIRICI, { agirlik_lb: 1, boy_ft: null, boy_in: null }).sayilar.map((x) => [x.anahtar, x.deger, x.birim]), [['kg', 0.45359237, 'kg']])
    assert.deepEqual(hesapla(CA_BIRIM_CEVIRICI, { agirlik_lb: null, boy_ft: 1, boy_in: 0 }).sayilar.map((x) => [x.anahtar, x.deger, x.birim]), [['cm', 30.48, 'cm']])
    assert.deepEqual(hesapla(CA_BIRIM_CEVIRICI, { agirlik_lb: null, boy_ft: null, boy_in: 1 }).sayilar.map((x) => [x.anahtar, x.deger, x.birim]), [['cm', 2.54, 'cm']])
    // a yard, typed as 3 feet 0 inches and as 36 inches
    assert.equal(hesapla(CA_BIRIM_CEVIRICI, { agirlik_lb: null, boy_ft: 3, boy_in: 0 }).sayilar[0].deger, 91.44)
    assert.equal(hesapla(CA_BIRIM_CEVIRICI, { agirlik_lb: null, boy_ft: null, boy_in: 36 }).sayilar[0].deger, 91.44)
  })

  /**
   * ISMP Canada, SafeMedicationUse.ca newsletter "Know and Share Your Weight in Kilograms" (2017-05-10),
   * https://safemedicationuse.ca/newsletter/newsletter_WeightKg.html: the child of its example weighed 18 kilograms,
   * which the page gives as 40 pounds.
   */
  it('UNIT CONVERTER: the example of ISMP Canada\'s newsletter — 40 pounds are 18 kilograms to the whole kilogram', () => {
    const kg = hesapla(CA_BIRIM_CEVIRICI, { agirlik_lb: 40, boy_ft: null, boy_in: null }).sayilar[0].deger
    assert.equal(Math.round(kg), 18)
    assert.ok(Math.abs(kg - 18.1436948) < 1e-9, '40 × 0.45359237')
    // and the mistake the newsletter is about: 18 pounds are not 18 kilograms
    assert.ok(Math.abs(hesapla(CA_BIRIM_CEVIRICI, { agirlik_lb: 18, boy_ft: null, boy_in: null }).sayilar[0].deger - 8.16466266) < 1e-9)
  })

  it('UNIT CONVERTER: nothing is worked out from half a height, and a weight is never shown beside a height that could not be read', () => {
    const c = (g: AracGirdisi) => hesapla(CA_BIRIM_CEVIRICI, g)
    assert.equal(c({ agirlik_lb: null, boy_ft: null, boy_in: null }).tamam, false, 'nothing typed')
    assert.equal(c({ agirlik_lb: null, boy_ft: 5, boy_in: null }).tamam, false, 'the inches are typed, 0 included: "5 feet" alone is not read as 5 feet 0 inches')
    assert.equal(c({ agirlik_lb: 150, boy_ft: 5, boy_in: null }).tamam, false, 'no weight beside a height left half typed')
    assert.equal(c({ agirlik_lb: null, boy_ft: 5, boy_in: 12 }).tamam, false, '12 inches is another foot')
    assert.equal(c({ agirlik_lb: null, boy_ft: 5, boy_in: 0 }).tamam, true)
    // inches alone are the whole height: 69 inches is 5 feet 9 inches
    assert.equal(c({ agirlik_lb: null, boy_ft: null, boy_in: 69 }).sayilar[0].deger, c({ agirlik_lb: null, boy_ft: 5, boy_in: 9 }).sayilar[0].deger)
    // the weight alone, the height alone, or both
    assert.deepEqual(c({ agirlik_lb: 150, boy_ft: null, boy_in: null }).sayilar.map((x) => x.anahtar), ['kg'])
    assert.deepEqual(c({ agirlik_lb: null, boy_ft: 5, boy_in: 9 }).sayilar.map((x) => x.anahtar), ['cm'])
    assert.deepEqual(c({ agirlik_lb: 150, boy_ft: 5, boy_in: 9 }).sayilar.map((x) => x.anahtar), ['kg', 'cm'])
    // no band, no warning, no date: a conversion and nothing else
    const s = c({ agirlik_lb: 150, boy_ft: 5, boy_in: 9 })
    assert.equal(s.bant, null); assert.deepEqual([...s.uyarilar], []); assert.deepEqual([...s.tarihler], [])
  })

  /**
   * National Kidney Foundation, "Example IT ticket: implement 2021 CKD-EPI equation to calculate eGFR from creatinine",
   * https://kidney.org/sites/default/files/example_it_ticket-implement_2021_ckd-epi_equation_to_calculate_egfr_from_creatinine_1.pdf:
   * eight test cases, in whole numbers, creatinine in mg/dL; under 18 years nothing is calculated. The equation:
   * National Institute of Diabetes and Digestive and Kidney Diseases, "eGFR Equations for Adults" (last reviewed May
   * 2025), https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults
   */
  it('ESTIMATED GFR: the eight test cases the National Kidney Foundation prints for the 2021 CKD-EPI creatinine equation', () => {
    const egfr = (cinsiyet: string, yas: number, kreatinin: number) => hesapla(CA_EGFR, { cinsiyet, yas, kreatinin })
    for (const [yas, cinsiyet, kreatinin, beklenen] of [
      [18, 'erkek', 0.90, 127], [18, 'erkek', 0.91, 125], [18, 'kadin', 0.70, 128], [18, 'kadin', 0.71, 126],
      [90, 'erkek', 0.50, 97], [90, 'erkek', 1.50, 44], [90, 'kadin', 0.50, 89], [90, 'kadin', 1.50, 33],
    ] as const) {
      const s = egfr(cinsiyet, yas, kreatinin)
      assert.equal(s.tamam, true)
      assert.deepEqual(s.sayilar.map((x) => [x.anahtar, x.deger, x.ondalik, x.birim]), [['egfr', beklenen, 0, 'mL/min/1.73m2']], `age ${yas}, ${cinsiyet}, ${kreatinin} mg/dL`)
      assert.equal(s.bant, null, 'no category and no stage')
      assert.deepEqual([...s.uyarilar], [], 'no referral flag')
    }
    // under 18 years nothing is calculated; nor without the sex, the age or the creatinine
    assert.equal(egfr('erkek', 17, 0.9).tamam, false)
    assert.equal(hesapla(CA_EGFR, { cinsiyet: null, yas: 40, kreatinin: 0.9 }).tamam, false)
    assert.equal(hesapla(CA_EGFR, { cinsiyet: 'erkek', yas: null, kreatinin: 0.9 }).tamam, false)
    assert.equal(hesapla(CA_EGFR, { cinsiyet: 'erkek', yas: 40, kreatinin: null }).tamam, false)
    assert.equal(hesapla(CA_EGFR, { cinsiyet: 'erkek', yas: 40.5, kreatinin: 0.9 }).tamam, false, 'age in whole years')
    assert.equal(hesapla(CA_EGFR, { cinsiyet: 'erkek', yas: 40, kreatinin: 0 }).tamam, false)
  })

  it('ESTIMATED GFR: the constants are the ones the institute\'s page prints — 142; 0.7 and 0.9; -0.241 and -0.302; -1.200; 0.9938; 1.012 for a female patient', () => {
    // at the knee of the equation (creatinine equal to kappa) both powers are 1: what is left is 142 × 0.9938^age × 1.012 [if female]
    assert.ok(Math.abs(caEgfr2021(false, 0, 0.9) - 142) < 1e-9)
    assert.ok(Math.abs(caEgfr2021(true, 0, 0.7) - 142 * 1.012) < 1e-9)
    assert.ok(Math.abs(caEgfr2021(false, 1, 0.9) - 142 * 0.9938) < 1e-9)
    // below the knee the exponent is alpha, above it -1.200
    assert.ok(Math.abs(caEgfr2021(false, 0, 0.45) - 142 * Math.pow(0.5, -0.302)) < 1e-9)
    assert.ok(Math.abs(caEgfr2021(true, 0, 0.35) - 142 * 1.012 * Math.pow(0.5, -0.241)) < 1e-9)
    assert.ok(Math.abs(caEgfr2021(false, 0, 1.8) - 142 * Math.pow(2, -1.2)) < 1e-9)
    assert.ok(Math.abs(caEgfr2021(true, 0, 1.4) - 142 * 1.012 * Math.pow(2, -1.2)) < 1e-9)
  })

  it('EVERY SOURCE STANDS BESIDE THE CODE IT WAS READ FOR: its address in ./tanimlar.ts, and the day', () => {
    const kaynak = readFileSync(join(__dirname, 'tanimlar.ts'), 'utf8')
    for (const adres of [
      'https://laws-lois.justice.gc.ca/eng/acts/W-6/page-7.html',
      'https://safemedicationuse.ca/newsletter/newsletter_WeightKg.html',
      'https://albertahealthservices.ca/assets/wf/lab/if-lab-hp-bulletin-2026-01-19-estimated-glomerular-filtration-rate-egfr-calculation-update-for-adult-patients.pdf',
      'https://www.cmaj.ca/content/194/11/E421',
      'https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults',
      'https://kidney.org/sites/default/files/example_it_ticket-implement_2021_ckd-epi_equation_to_calculate_egfr_from_creatinine_1.pdf',
    ]) assert.ok(kaynak.includes(adres), adres)
    assert.match(kaynak, /OPENED ON 2026-10-10/)
    assert.match(kaynak, /Nothing is from memory/)
  })
})

describe('ca new tools 3: each is complete in the pack', () => {
  it('the whole pack check finds nothing: every word, unit, role, patient gate and licence is there', () => {
    assert.deepEqual(paketiDenetle(CA_PAKETI, CA_ARAYUZ, CA_KLINIK).map((x) => `${x.yer}: ${x.sorun}`), [])
  })

  it('WHO SEES EACH, as the audit decided: the unit converter every role (a base tool); the estimated GFR every doctor role and no allied profession', () => {
    assert.equal(paketinAraci(A, 'ca-unit-converter')!.paket.roller, null)
    assert.deepEqual(goren('ca-unit-converter'), [...ROLLER])
    assert.ok(hesabinAraci(A, null, 'ca-unit-converter'), 'an account without a role sees a base tool')
    assert.equal(paketinAraci(A, 'ca-egfr-ckd-epi-2021')!.paket.sinif, 'hekimler')
    assert.deepEqual(goren('ca-egfr-ckd-epi-2021'), [...CA_HEKIMLER])
    assert.equal(goren('ca-egfr-ckd-epi-2021').length, 41)
    for (const rol of ['physiotherapy', 'clinical-psychology', 'dietetics', 'occupational-therapy', 'audiology', 'psychotherapy']) assert.equal(hesabinAraci(A, rol, 'ca-egfr-ckd-epi-2021'), null, rol)
    assert.equal(hesabinAraci(A, null, 'ca-egfr-ckd-epi-2021'), null)
  })

  it('THE ESTIMATED GFR IS FOR ADULTS ONLY and is held back for the others: 18 and over; an unknown birth date never opens it', () => {
    const kapi = paketinAraci(A, 'ca-egfr-ckd-epi-2021')!.paket.hasta
    assert.deepEqual(kapi, { enAzYas: 18 })
    assert.equal(kapiSonucu(kapi, { dogumTarihi: '2008-10-10' }, BUGUN), 'uygun', '18 today')
    assert.equal(kapiSonucu(kapi, { dogumTarihi: '2008-10-11' }, BUGUN), 'degil', '18 tomorrow')
    assert.equal(kapiSonucu(kapi, { dogumTarihi: null }, BUGUN), 'degil', 'no birth date on the file')
    assert.equal(kapiSonucu(kapi, null, BUGUN), 'hastasiz', 'opened without a patient: the sentence stands above the fields')
    // opened from the file of a child, the tool is not on a pediatrician's grid; from an adult's file it is
    const izgara = (dogumTarihi: string) => hesabinAraclari(A, 'paediatrics', { hasta: { dogumTarihi }, bugun: BUGUN }).rol.map((x) => x.tanim.anahtar)
    assert.ok(!izgara('2016-01-01').includes('ca-egfr-ckd-epi-2021'))
    assert.ok(izgara('1980-01-01').includes('ca-egfr-ckd-epi-2021'))
    assert.match(paketinAraci(A, 'ca-egfr-ckd-epi-2021')!.paket.metin.hastaKapisi![D], /adults aged 18 and over/)
    // the converter is for every patient
    assert.equal(paketinAraci(A, 'ca-unit-converter')!.paket.hasta, undefined)
  })

  it('TYPED AS A DOCTOR HERE TYPES: pounds, feet and inches; creatinine in µmol/L — and the result as the screen writes it', () => {
    assert.deepEqual(yazili('ca-unit-converter', { agirlik_lb: '40' }), { kg: '18.14 kg' })
    assert.deepEqual(yazili('ca-unit-converter', { agirlik_lb: '7.5' }), { kg: '3.40 kg' })
    assert.deepEqual(yazili('ca-unit-converter', { boy_ft: '5', boy_in: '9' }), { cm: '175.3 cm' })
    assert.deepEqual(yazili('ca-unit-converter', { agirlik_lb: '150', boy_in: '69' }), { kg: '68.04 kg', cm: '175.3 cm' })
    assert.equal(yazarak('ca-unit-converter', { boy_ft: '5' }).tamam, false)
    // the unit beside each field is named
    for (const b of ['lb', 'ft', 'in', 'kg', 'cm', 'umol/L', 'mL/min/1.73m2']) assert.ok(A.birimler[b]?.[D]?.trim(), b)
    // CREATININE IN µmol/L: the pack's unit; the kit divides by 88.4, the one conversion the institute's page prints.
    // The foundation's test cases in mg/dL, typed here in µmol/L: 0.90 mg/dL = 79.56 µmol/L; 1.50 mg/dL = 132.6 µmol/L.
    assert.equal(A.labBirimleri.kreatinin, 'umol/L')
    assert.deepEqual(yazili('ca-egfr-ckd-epi-2021', { cinsiyet: 'erkek', yas: '18', kreatinin: '79.56' }), { egfr: '127 mL/min/1.73 m²' })
    assert.deepEqual(yazili('ca-egfr-ckd-epi-2021', { cinsiyet: 'kadin', yas: '18', kreatinin: '61.88' }), { egfr: '128 mL/min/1.73 m²' })
    assert.deepEqual(yazili('ca-egfr-ckd-epi-2021', { cinsiyet: 'erkek', yas: '90', kreatinin: '132.6' }), { egfr: '44 mL/min/1.73 m²' })
    assert.deepEqual(yazili('ca-egfr-ckd-epi-2021', { cinsiyet: 'kadin', yas: '90', kreatinin: '132.6' }), { egfr: '33 mL/min/1.73 m²' })
    // a number typed as mg/dL by mistake (0.9) is below what the field takes in µmol/L: no result, never a wrong one
    assert.equal(yazarak('ca-egfr-ckd-epi-2021', { cinsiyet: 'erkek', yas: '40', kreatinin: '0.9' }).tamam, false)
    assert.equal(yazarak('ca-egfr-ckd-epi-2021', { cinsiyet: 'erkek', yas: '17', kreatinin: '80' }).tamam, false)
  })
})

describe('ca new tools 4: the words and the licences', () => {
  const metinler = KENDI.flatMap((p) => {
    const t = p.metin
    const grup = (ad: string, g?: Readonly<Record<string, Readonly<Record<string, string>>>>) => Object.entries(g ?? {}).map(([k, v]) => ({ yer: `${p.anahtar}.${ad}.${k}`, metin: v[D] }))
    return [
      { yer: `${p.anahtar}.ad`, metin: t.ad[D] }, { yer: `${p.anahtar}.aciklama`, metin: t.aciklama[D] }, { yer: `${p.anahtar}.not`, metin: t.not[D] },
      ...grup('alanlar', t.alanlar), ...grup('sayilar', t.sayilar), ...grup('bantlar', t.bantlar), ...grup('uyarilar', t.uyarilar),
      ...Object.entries(t.secenekler ?? {}).flatMap(([alan, s]) => grup(`secenekler.${alan}`, s)),
      ...(t.hastaKapisi ? [{ yer: `${p.anahtar}.hastaKapisi`, metin: t.hastaKapisi[D] }] : []),
      ...(p.lisans?.bildirim ? [{ yer: `${p.anahtar}.bildirim`, metin: p.lisans.bildirim[D] }] : []),
    ]
  })

  it('Canadian spelling in every word of every screen', () => {
    assert.ok(metinler.length >= 20)
    for (const x of metinler) { assert.ok(x.metin?.trim(), x.yer); assert.deepEqual(bicimYazimSorunlari(x.metin, D), [], x.yer) }
    assert.match(KENDI[0].metin.aciklama[D], /centimetres/)
  })

  it('nothing of another country, no claim, no price, no identity number; and no recommendation to screen anybody', () => {
    for (const x of metinler) {
      assert.doesNotMatch(x.metin, /\b(NHS|NHI|United Kingdom|United States|Australia|New Zealand|HIPAA|Medicaid|Medicare|attending physician|consultant)\b|£/, x.yer)
      assert.doesNotMatch(x.metin, /\b(compliant|compliance|certified|certification|accredited|endorsed|approved by|cleared|clinically proven|guarantee\w*)\b/i, x.yer)
      assert.doesNotMatch(x.metin, /[$€]\s*\d|social insurance|health card/i, x.yer)
      assert.doesNotMatch(x.metin, /\bscreen(ing)?\b|\brecommended\b/i, x.yer)
    }
  })

  it('every tool says under its result what it is not, and the summary that is copied carries the rights holder\'s notice', () => {
    for (const p of KENDI) assert.match(p.metin.not[D], /nothing else|not a precise measure/, p.anahtar)
    const x = paketinAraci(A, 'ca-egfr-ckd-epi-2021')!
    const ham = { cinsiyet: 'erkek', yas: '90', kreatinin: '132.6' }
    const g = girdiyiCoz(x.tanim.alanlar, ham, O)
    // as the screen does: the summary repeats the numbers as they were typed, in the unit they were typed in
    const ozet = aracOzeti(x, hamdanGosterilen(x.tanim.alanlar, ham, g, O), aracCalistir(x, g, BUGUN, A), D, M, yazici, O)
    assert.match(ozet, /Estimated GFR: 44 mL\/min\/1\.73 m²/)
    assert.match(ozet, /Serum creatinine: 132\.6 µmol\/L/)
    assert.match(ozet, /not a precise measure of kidney function/)
    assert.ok(ozet.endsWith(lisansBildirimi(x, D)))
  })

  it('A LICENCE IS STATED "FREE" ONLY WITH THE RIGHTS HOLDER NAMED, THE NOTICE THAT WAS READ AND THE DAY — and the holder\'s credit stands under every result', () => {
    for (const p of KENDI) {
      assert.equal(p.lisans?.durum, 'serbest', p.anahtar)
      assert.ok(p.lisans?.hakSahibi?.trim(), p.anahtar)
      assert.match(p.lisans?.kaynak ?? '', /https:\/\/\S+, read 2026-10-10$/, p.anahtar)
      assert.ok(lisansBildirimi(paketinAraci(A, p.anahtar)!, D).trim(), `${p.anahtar}: the notice under the result`)
    }
    // federal enactments: the Reproduction of Federal Law Order; the reproduction is not represented as an official version
    assert.match(KENDI[0].lisans!.kaynak!, /SI\/97-5/)
    assert.match(KENDI[0].lisans!.bildirim![D], /not an official version/)
    // the institute's page: its own notice; credited as the source; nothing says it stands behind this product
    assert.match(KENDI[1].lisans!.kaynak!, /niddk\.nih\.gov\/copyright/)
    assert.match(KENDI[1].lisans!.bildirim![D], /as published by the National Institute of Diabetes and Digestive and Kidney Diseases/)
    assert.match(KENDI[1].lisans!.bildirim![D], /has not reviewed this product/)
  })
})
