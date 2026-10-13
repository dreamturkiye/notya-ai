/**
 * NOTYA-ULKE-UYGULA-NZ — New Zealand: THE TOOLS ONLY THIS COUNTRY HAS, held to their sources.
 *
 * Every figure asserted below was read from the named source on 2026-10-10, through a reading tool that returns the
 * text of a page (each source was read at least twice, and the readings agreed). Where a source prints a worked
 * example, it is a test; where it prints none, the rows of its own table are the test, and that is said.
 *
 * ALSO HELD HERE:
 *   - THE LIST OF TOOLS SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF (./onaysiz.ts) and the pack's switched-on tools
 *     of its own match exactly (Kaan, 2026-10-10: "Bring on all the tools ... We will test as we go");
 *   - each tool states a free licence with the notice its licence asks for, and no approval is claimed;
 *   - who sees each tool, and for which patients.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { kapiSonucu } from '@/lib/ulke/araclar/hastaKapisi'
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import { aracCalistir, aracOzeti, hekimRolleri, hesabinAraci, lisansBildirimi, paketinAraci } from '@/lib/ulke/araclar/paket'
import { ulkeyeOzelAnahtarlar } from '@/lib/ulke/araclar/ulkeyeOzel'
import { NZ_ARAYUZ } from '../arayuz'
import { NZ_PAKETI } from '../index'
import { NZ_EK_ARACLAR } from './araclar'
import { NZ_ONAYLI_ARACLAR, NZ_ONAYSIZ_ARACLAR } from './onaysiz'
import { NZ_BMI, NZ_PSA, NZ_TANIMLAR, nzBmi, nzBmiSinifi, nzPsaEsigi } from './tanimlar'

const D = 'en-NZ'
const BUGUN = '2026-10-10'
const a = NZ_ARAYUZ.araclar!
const calistir = (anahtar: string, g: Record<string, number | string | boolean | null>) => aracCalistir(paketinAraci(a, anahtar)!, g, BUGUN, a)
const metni = (anahtar: string) => a.araclar.find((p) => p.anahtar === anahtar)!.metin

describe('nz: the tools of this country\'s own — switched on, and listed as not yet signed off by a clinician', () => {
  it('THE LIST AND THE PACK MATCH EXACTLY: every tool of this country\'s own that is switched on is on the list of tools without a clinician\'s sign-off (or signed off by name), and the list names no other', () => {
    const acik = a.araclar.map((p) => p.anahtar).filter((k) => k.startsWith('nz-')).sort()
    const listede = [...NZ_ONAYSIZ_ARACLAR, ...Object.keys(NZ_ONAYLI_ARACLAR)].sort()
    assert.deepEqual(acik, listede)
    assert.deepEqual(acik, ['nz-bmi-waist', 'nz-psa-thresholds', 'nz-smoking-abc'])
    // no key on both lists; a signed-off tool names its clinician and its date
    for (const k of NZ_ONAYSIZ_ARACLAR) assert.ok(!(k in NZ_ONAYLI_ARACLAR), k)
    for (const [k, v] of Object.entries(NZ_ONAYLI_ARACLAR)) { assert.ok(v.klinisyen.trim(), k); assert.match(v.tarih, /^\d{4}-\d{2}-\d{2}$/, k) }
    // TODAY NOBODY HAS SIGNED ANY OF THEM OFF, and the pack says so
    assert.deepEqual(Object.keys(NZ_ONAYLI_ARACLAR), [])
    assert.deepEqual(a.inceleme, { makineYazimi: true, klinisyen: null })
  })

  it('each has its mechanism in this folder, under a key that carries New Zealand\'s code, is no tool of the kit, and is on the list the walls enforce', () => {
    assert.deepEqual(NZ_TANIMLAR.map((t) => t.anahtar).sort(), [...NZ_ONAYSIZ_ARACLAR].sort())
    assert.deepEqual(NZ_EK_ARACLAR.map((p) => p.anahtar).sort(), [...NZ_ONAYSIZ_ARACLAR].sort())
    for (const t of NZ_TANIMLAR) { assert.match(t.anahtar, /^nz-[a-z0-9]+(-[a-z0-9]+)*$/); assert.equal(kitAraci(t.anahtar), null, t.anahtar); assert.ok(t.kaynak?.startsWith('Ministry of Health.'), `${t.anahtar}: its source is cited under every result`) }
    const yasak = JSON.parse(readFileSync(join(resolve(__dirname, '../../..'), 'countries/yasak-araclar.json'), 'utf8')) as Record<string, string[]>
    assert.deepEqual([...yasak.nz].sort(), ulkeyeOzelAnahtarlar(a, 'nz'))
    // NO PAYER TOOL WAS BUILT: nothing of this country's own answers whether funding criteria are met
    for (const p of NZ_EK_ARACLAR) assert.doesNotMatch(JSON.stringify(p.metin), /Pharmac|Special Authority|funded|funding|eligib|\bACC\b|Work and Income/i, p.anahtar)
  })

  it('LICENCE: each states "free", the rights holder, where the notice was read, and carries the credit its licence asks for — never a claim of approval', () => {
    for (const p of NZ_EK_ARACLAR) {
      assert.equal(p.lisans?.durum, 'serbest', p.anahtar)
      assert.equal(p.lisans?.hakSahibi, 'Ministry of Health (New Zealand)', p.anahtar)
      assert.match(p.lisans?.kaynak ?? '', /printed in the document itself \(Creative Commons Attribution 4\.0 International\), read 2026-10-10: https:\/\/(www\.)?health\.govt\.nz\//, p.anahtar)
      const bildirim = lisansBildirimi({ paket: p }, D)
      assert.match(bildirim, /Ministry of Health\. \d{4}\. .+ Wellington: Ministry of Health\. Used under the Creative Commons Attribution 4\.0 International licence/, p.anahtar)
      assert.match(bildirim, /the product's own, not the Ministry's/, p.anahtar)
      assert.doesNotMatch(bildirim, /approved|endors|certif|recommended by|in partnership/i, p.anahtar)
    }
    // the notice goes wherever the result goes: it is the last line of the summary a doctor copies
    const x = paketinAraci(a, 'nz-smoking-abc')!
    const g = { soruldu: true, kisa_tavsiye: false, destek_onerildi: false, destek_saglandi: false, durum: null }
    const yazici = { sayi: (v: number, o: number) => v.toFixed(o), tarih: (iso: string) => iso, birim: (kod: string) => a.birimler[kod]?.[D] ?? kod }
    const ozet = aracOzeti(x, g, calistir('nz-smoking-abc', g), D, a.metinler[D]!, yazici, { birimler: NZ_PAKETI.uygulama!.birimler, lab: a.labBirimleri, sayi: NZ_PAKETI.bicim })
    assert.ok(ozet.trim().endsWith('not the Ministry\'s.'), ozet)
  })
})

// ───────────────────────── nz-bmi-waist ─────────────────────────
/**
 * SOURCE (opened 2026-10-10): Ministry of Health. 2017. Clinical Guidelines for Weight Management in New Zealand
 * Adults. Wellington: Ministry of Health. Table 2 and the text beside it.
 * https://health.govt.nz/system/files/2017-11/clinical-guidelines-for-weight-management-in-new-zealand-adultsv2.pdf
 */
describe('nz-bmi-waist: the adult weight-management guideline of the Ministry of Health (2017), Table 2', () => {
  const bmi = (kilo: number, boy: number, ek: Record<string, number | string | null> = {}) => calistir('nz-bmi-waist', { kilo, boy, bel: null, cinsiyet: null, ...ek })

  it('THE CLASS LIMITS ARE THE TABLE\'S OWN: below 18.5; 18.5–24.9; 25.0–29.9; 30.0–34.9; 35.0–39.9; 40.0 or above', () => {
    assert.deepEqual(NZ_BMI, { zayifAlti: 18.5, normalUst: 24.9, fazlaKiloluUst: 29.9, obez1Ust: 34.9, obez2Ust: 39.9, bel: { erkek: { alt: 94, ust: 102 }, kadin: { alt: 80, ust: 88 } } })
    // each printed limit of the table, on both of its sides
    const beklenen: readonly (readonly [number, string])[] = [
      [18.4, 'zayif'], [18.5, 'normal'], [24.9, 'normal'], [25.0, 'fazla_kilolu'], [29.9, 'fazla_kilolu'],
      [30.0, 'obez_1'], [34.9, 'obez_1'], [35.0, 'obez_2'], [39.9, 'obez_2'], [40.0, 'obez_3'], [55.3, 'obez_3'],
    ]
    for (const [deger, sinif] of beklenen) assert.equal(nzBmiSinifi(deger), sinif, String(deger))
  })

  it('THE INDEX: kilograms over metres squared. The source prints no worked example; one from a New Zealand health-information page is used, and where it differs by 0.1 is said', () => {
    // Healthify He Puna Waiora (Health Navigator Charitable Trust), "Body mass index (BMI)", reviewed 28 September 2026,
    // opened 2026-10-10: https://healthify.nz/health-a-z/b/body-mass-index-bmi — its example: 73 kg, 1.75 m; it
    // rounds 1.75 × 1.75 to 3.06 and prints 23.9. The exact square is 3.0625 and 73 / 3.0625 = 23.84: this tool rounds
    // only the result, and shows 23.8. Both figures are in the same class. (The two calculator pages of the health
    // ministry and of Health New Zealand refused the reading tool on 2026-10-10, so no official calculator was read.)
    assert.equal(nzBmi(73, 175), 23.8)
    assert.ok(Math.abs(73 / 3.06 - 23.9) < 0.05, 'the page\'s own arithmetic, with its rounded square')
    const s = bmi(73, 175)
    assert.equal(s.tamam, true)
    assert.deepEqual(s.sayilar, [{ anahtar: 'bmi', deger: 23.8, ondalik: 1, birim: 'kg/m2' }])
    assert.equal(s.bant, 'normal')
    // plain arithmetic at round figures: 100 kg at 2 m is 25.0; 81 kg at 1.80 m is 25.0; 45 kg at 1.60 m is 17.6
    assert.equal(bmi(100, 200).sayilar[0].deger, 25)
    assert.equal(bmi(100, 200).bant, 'fazla_kilolu')
    assert.equal(bmi(81, 180).sayilar[0].deger, 25)
    assert.equal(bmi(45, 160).sayilar[0].deger, 17.6)
    assert.equal(bmi(45, 160).bant, 'zayif')
  })

  it('the class is read from the figure that is SHOWN (one decimal place), so no index falls between two classes', () => {
    // 72.1 kg at 1.70 m is 24.948…: shown as 24.9 and classed as normal weight; 72.25 kg is exactly 25.0: overweight
    assert.deepEqual([bmi(72.1, 170).sayilar[0].deger, bmi(72.1, 170).bant], [24.9, 'normal'])
    assert.deepEqual([bmi(72.25, 170).sayilar[0].deger, bmi(72.25, 170).bant], [25, 'fazla_kilolu'])
    // every class is reachable, and the shown figure always decides
    for (let kilo = 40; kilo <= 160; kilo += 0.7) { const s = bmi(kilo, 170); assert.equal(s.bant, nzBmiSinifi(s.sayilar[0].deger)) }
  })

  it('THE WAIST: men 94 to 102 cm and above 102 cm; women 80 to 88 cm and above 88 cm — the table\'s columns', () => {
    const bel = (cinsiyet: string, cm: number) => bmi(80, 175, { bel: cm, cinsiyet }).uyarilar
    assert.deepEqual(bel('erkek', 93.9), [])
    assert.deepEqual(bel('erkek', 94), ['bel_alt_bant'], 'the lower figure is inclusive: the table prints the range 94–102')
    assert.deepEqual(bel('erkek', 102), ['bel_alt_bant'])
    assert.deepEqual(bel('erkek', 102.1), ['bel_ust_bant'])
    assert.deepEqual(bel('kadin', 79.9), [])
    assert.deepEqual(bel('kadin', 80), ['bel_alt_bant'])
    assert.deepEqual(bel('kadin', 88), ['bel_alt_bant'])
    assert.deepEqual(bel('kadin', 88.1), ['bel_ust_bant'])
    // a woman's figure is never applied to a man, nor a man's to a woman
    assert.deepEqual(bel('erkek', 90), [])
    assert.deepEqual(bel('kadin', 90), ['bel_ust_bant'])
    // the words name the same figures as the arithmetic
    const m = metni('nz-bmi-waist')
    assert.match(m.uyarilar!.bel_alt_bant[D], /men 94 to 102 cm, women 80 to 88 cm/)
    assert.match(m.uyarilar!.bel_ust_bant[D], /men 102 cm, women 88 cm/)
    for (const [k, v] of Object.entries({ zayif: 'below 18.5', normal: '18.5 to 24.9', fazla_kilolu: '25.0 to 29.9', obez_1: '30.0 to 34.9', obez_2: '35.0 to 39.9', obez_3: '40.0 or above' })) assert.ok(m.bantlar![k][D].includes(v), k)
  })

  it('A MISSING INPUT IS NEVER READ AS A REASSURING ONE: a waist without the sex gives no result at all; without a waist there is no waist line', () => {
    assert.equal(bmi(80, 175, { bel: 110 }).tamam, false)
    assert.deepEqual(bmi(80, 175, { cinsiyet: 'erkek' }).uyarilar, [])
    assert.equal(calistir('nz-bmi-waist', { kilo: 80, boy: null, bel: null, cinsiyet: null }).tamam, false)
    assert.equal(calistir('nz-bmi-waist', { kilo: null, boy: 175, bel: null, cinsiyet: null }).tamam, false)
  })

  it('WHO SEES IT, AND FOR WHOM: every doctor role whose patients are adults, and the dietitian; for patients aged 19 and over, never for a patient whose age is not known', () => {
    const p = a.araclar.find((x) => x.anahtar === 'nz-bmi-waist')!
    const hekimler = hekimRolleri(NZ_ARAYUZ.roller)
    assert.deepEqual([...(p.roller ?? [])], [...hekimler.filter((r) => r !== 'paediatrics' && r !== 'paediatric-surgery'), 'dietetics'])
    assert.ok(hesabinAraci(a, 'family-medicine', 'nz-bmi-waist') && hesabinAraci(a, 'dietetics', 'nz-bmi-waist'))
    for (const rol of ['paediatrics', 'paediatric-surgery', 'physiotherapy', 'podiatry', null]) assert.equal(hesabinAraci(a, rol, 'nz-bmi-waist'), null, String(rol))
    // the companion guideline for children and young people covers ages 2 to 18 (opened 2026-10-10:
    // https://www.health.govt.nz/system/files/2011-10/clinical-guidelines-weight-management-nz-children-young-people-dec16.pdf)
    assert.deepEqual(p.hasta, { enAzYas: 19 })
    assert.equal(kapiSonucu(p.hasta, { dogumTarihi: '2007-10-10' }, BUGUN), 'uygun', '19 today')
    assert.equal(kapiSonucu(p.hasta, { dogumTarihi: '2007-10-11' }, BUGUN), 'degil', '18: the children\'s guideline covers this age')
    assert.equal(kapiSonucu(p.hasta, { dogumTarihi: null }, BUGUN), 'degil', 'an unknown birth date never opens it')
    assert.match(p.metin.hastaKapisi![D], /adults aged 19 and over/)
  })
})

// ───────────────────────── nz-smoking-abc ─────────────────────────
/**
 * SOURCE (opened 2026-10-10): Ministry of Health. 2021. The New Zealand Guidelines for Helping People to Stop Smoking:
 * 2021 Update. Wellington: Ministry of Health. Its ABC pathway: three bullets.
 * https://health.govt.nz/system/files/2014-06/the-new-zealand-guidelines-for-helping-people-to-stop-smoking-2021.pdf
 */
describe('nz-smoking-abc: a record of the ABC pathway of the stop-smoking guidelines (2021)', () => {
  it('four ticks — the three steps, and the second sentence of the third — and the status in the doctor\'s own words; NO number is worked out and no date is proposed', () => {
    const t = paketinAraci(a, 'nz-smoking-abc')!.tanim
    assert.equal(t.tur, 'liste')
    assert.deepEqual(t.alanlar.map((x) => `${x.anahtar}:${x.tur}`), ['soruldu:isaret', 'kisa_tavsiye:isaret', 'destek_onerildi:isaret', 'destek_saglandi:isaret', 'durum:metin'])
    assert.deepEqual(t.cikti, { sayilar: ['isaretli'], bantlar: [], uyarilar: [], tarihler: [] })
    const m = metni('nz-smoking-abc')
    assert.equal(m.alanlar.soruldu[D], 'Smoking status asked about and documented')
    assert.equal(m.alanlar.kisa_tavsiye[D], 'Brief advice to stop smoking given')
    assert.match(m.alanlar.destek_onerildi[D], /^Cessation support strongly encouraged/)
    assert.match(m.alanlar.destek_saglandi[D], /referred to, or given, cessation support$/)
  })

  it('nothing is ticked: no record; one step ticked: the count and nothing else — no band, no warning', () => {
    const bos = { soruldu: false, kisa_tavsiye: false, destek_onerildi: false, destek_saglandi: false, durum: null }
    assert.equal(calistir('nz-smoking-abc', bos).tamam, false)
    assert.deepEqual(calistir('nz-smoking-abc', { ...bos, soruldu: true, kisa_tavsiye: true, durum: 'smokes, ten a day' }), { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: 2, ondalik: 0, enCok: 4 }], bant: null, uyarilar: [], tarihler: [] })
  })

  it('every doctor role sees it, and no allied profession', () => {
    const p = a.araclar.find((x) => x.anahtar === 'nz-smoking-abc')!
    assert.equal(p.sinif, 'hekimler')
    assert.deepEqual([...(p.roller ?? [])], hekimRolleri(NZ_ARAYUZ.roller))
    assert.equal(p.roller?.length, 44)
    for (const rol of ['physiotherapy', 'dietetics', 'podiatry', 'psychotherapy', null]) assert.equal(hesabinAraci(a, rol, 'nz-smoking-abc'), null, String(rol))
  })
})

// ───────────────────────── nz-psa-thresholds ─────────────────────────
/**
 * SOURCE (opened 2026-10-10, read three times): Ministry of Health. 2015. Prostate Cancer Management and Referral
 * Guidance. Wellington: Ministry of Health. Table 1 (abnormal PSA level by age group, µg/L), Note 2.2 (the repeat
 * test) and Table 3 (criteria for referral: one immediate line, four urgent lines, three routine lines).
 * https://www.health.govt.nz/system/files/2015-09/prostate-cancer-management-referral-guidance_sept15-c.pdf
 * The guidance prints no worked example: every row of both tables is walked here with the tables' own figures.
 */
describe('nz-psa-thresholds: the prostate cancer guidance of the Ministry of Health (2015), Tables 1 and 3', () => {
  const BOS = { dre_anormal: false, sirt_noro: false, bobrek_yetmezligi: false, kemik_agrisi: false, hematuri: false, iki_anormal: false }
  const psa = (yas: number, deger: number, ek: Partial<typeof BOS> = {}) => calistir('nz-psa-thresholds', { yas, psa: deger, ...BOS, ...ek })

  it('TABLE 1: men aged 70 or under, 4.0 or more; 71 to 75, 10.0 or more; 76 or over, 20.0 or more (µg/L)', () => {
    assert.deepEqual(NZ_PSA.yasBantlari, [[70, 4.0], [75, 10.0], [null, 20.0]])
    for (const [yas, esik] of [[40, 4], [50, 4], [70, 4], [71, 10], [75, 10], [76, 20], [90, 20]] as const) assert.equal(nzPsaEsigi(yas), esik, String(yas))
    // at the level is abnormal ("≥"); just below it is not
    assert.deepEqual([psa(70, 4.0).bant, psa(70, 3.9).bant], ['anormal', 'esik_alti'])
    assert.deepEqual([psa(71, 10.0).bant, psa(71, 9.9).bant], ['anormal', 'esik_alti'])
    assert.deepEqual([psa(75, 10.0).bant, psa(75, 9.9).bant], ['anormal', 'esik_alti'])
    assert.deepEqual([psa(76, 20.0).bant, psa(76, 19.9).bant], ['anormal', 'esik_alti'])
    // the same result reads differently by age, as the table means it to: 5.0 µg/L at 70 and at 71
    assert.deepEqual([psa(70, 5).bant, psa(71, 5).bant], ['anormal', 'esik_alti'])
    // the level itself is shown, in the unit the guidance prints
    assert.deepEqual(psa(73, 5).sayilar, [{ anahtar: 'esik', deger: 10, ondalik: 1, birim: 'ug/L' }])
    assert.equal(a.birimler['ug/L'][D], 'µg/L')
  })

  it('NOTE 2.2: a raised result alone asks for a repeat after 6 to 12 weeks — not where the examination is abnormal, a red flag is present, or two results already stand', () => {
    assert.deepEqual(psa(65, 4.5).uyarilar, ['tekrar'])
    assert.deepEqual(psa(65, 3.9).uyarilar, [], 'not raised: nothing is said')
    assert.ok(!psa(65, 4.5, { dre_anormal: true }).uyarilar.includes('tekrar'))
    for (const bayrak of ['sirt_noro', 'bobrek_yetmezligi', 'kemik_agrisi', 'hematuri'] as const) assert.ok(!psa(65, 4.5, { [bayrak]: true }).uyarilar.includes('tekrar'), bayrak)
    assert.ok(!psa(65, 4.5, { iki_anormal: true }).uyarilar.includes('tekrar'))
    assert.equal(metni('nz-psa-thresholds').uyarilar!.tekrar[D], 'The guidance asks for a repeat PSA test after 6 to 12 weeks to confirm a raised result')
  })

  it('TABLE 3, IMMEDIATE (within 24 hours): PSA 10 or more AND severe back pain with acute neurological symptoms', () => {
    assert.deepEqual(psa(68, 10, { sirt_noro: true }).uyarilar, ['sevk_hemen'])
    assert.deepEqual(psa(68, 250, { sirt_noro: true, kemik_agrisi: true, hematuri: true }).uyarilar, ['sevk_hemen'], 'the most urgent group only')
    assert.ok(!psa(68, 9.9, { sirt_noro: true }).uyarilar.includes('sevk_hemen'), 'below 10 the line does not apply')
    assert.match(metni('nz-psa-thresholds').uyarilar!.sevk_hemen[D], /within 24 hours$/)
  })

  it('TABLE 3, URGENT (within 14 days): PSA 10 or more AND renal failure, or bone pain, or macroscopic haematuria, or a hard or irregular prostate', () => {
    for (const bulgu of ['bobrek_yetmezligi', 'kemik_agrisi', 'hematuri', 'dre_anormal'] as const) {
      assert.deepEqual(psa(68, 10, { [bulgu]: true }).uyarilar, ['sevk_ivedi'], bulgu)
      assert.ok(!psa(68, 9.9, { [bulgu]: true }).uyarilar.includes('sevk_ivedi'), `${bulgu}: below 10`)
    }
    assert.match(metni('nz-psa-thresholds').uyarilar!.sevk_ivedi[D], /within 14 days$/)
  })

  it('TABLE 3, ROUTINE (within 6 to 8 weeks): PSA 4 to 10 AND haematuria; PSA below 10 AND a hard or irregular prostate; two clearly abnormal results 6 to 12 weeks apart', () => {
    // line 6
    assert.deepEqual(psa(68, 4, { hematuri: true }).uyarilar, ['sevk_rutin'])
    assert.deepEqual(psa(68, 9.9, { hematuri: true }).uyarilar, ['sevk_rutin'])
    assert.deepEqual(psa(68, 3.9, { hematuri: true }).uyarilar, [], 'below 4 with haematuria: the table has no line, and the tool says nothing')
    assert.deepEqual(psa(68, 10, { hematuri: true }).uyarilar, ['sevk_ivedi'], 'at 10 the urgent line applies')
    // line 7
    assert.deepEqual(psa(68, 2, { dre_anormal: true }).uyarilar, ['sevk_rutin'])
    assert.deepEqual(psa(68, 9.9, { dre_anormal: true }).uyarilar, ['sevk_rutin'])
    // line 8: the doctor's own tick
    assert.deepEqual(psa(68, 6, { iki_anormal: true }).uyarilar, ['sevk_rutin'])
    assert.deepEqual(psa(74, 12, { iki_anormal: true }).uyarilar, ['sevk_rutin'])
    assert.match(metni('nz-psa-thresholds').uyarilar!.sevk_rutin[D], /within 6 to 8 weeks$/)
  })

  it('ENTRIES THAT MATCH NO LINE RAISE NOTHING, and the tool never says that no referral is needed; nor does it state a rate of change', () => {
    const s = psa(60, 2)
    assert.deepEqual([s.tamam, s.bant, s.uyarilar], [true, 'esik_alti', []])
    const m = metni('nz-psa-thresholds')
    assert.deepEqual(Object.keys(m.uyarilar ?? {}).sort(), ['sevk_hemen', 'sevk_ivedi', 'sevk_rutin', 'tekrar'])
    assert.doesNotMatch(JSON.stringify(m), /no referral|not needed|reassur|velocity|per year/i)
    assert.match(m.not[D], /does not exclude prostate cancer/)
    // no age or no result: no answer at all
    assert.equal(calistir('nz-psa-thresholds', { yas: null, psa: 5, ...BOS }).tamam, false)
    assert.equal(calistir('nz-psa-thresholds', { yas: 65, psa: null, ...BOS }).tamam, false)
  })

  it('General practice and Urology see it, and nobody else', () => {
    assert.deepEqual([...(a.araclar.find((x) => x.anahtar === 'nz-psa-thresholds')!.roller ?? [])], ['family-medicine', 'urology'])
    for (const rol of ['emergency-medicine', 'paediatrics', 'cardiology', 'physiotherapy', null]) assert.equal(hesabinAraci(a, rol, 'nz-psa-thresholds'), null, String(rol))
  })
})
