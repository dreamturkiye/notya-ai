/**
 * NOTYA-ULKE-UYGULA-UZ — Uzbekistan: THE TOOLS ONLY UZBEKISTAN HAS, the country data supplied with them, and the
 * licence states, each held to the source it was read in on 2026-10-10.
 *
 *   1. THE NUMBERS ARE THE SOURCES': the limits of the body mass index, the age the classes are for, and the four
 *      numbers of the dating rule are written out here a second time, each with its source, and compared with the code.
 *   2. THE ARITHMETIC against the worked examples a source prints: the index of the NHS page (89 kg, 1.62 m: 33.9), and
 *      the day counts of the antenatal protocol (280 = 40 weeks, 266 = 38 weeks) and of the ACOG opinion (261, 263).
 *      The national protocol prints no example with calendar dates, and no official calculator page that prints one
 *      was found: the dates below are counted on a calendar, and say so.
 *   3. THE VACCINATION TOOL ONLY RECORDS: it knows no vaccine, proposes no day, and its answer never depends on what
 *      the vaccine is called.
 *   4. WHO SEES THEM, and the patient gate of the index.
 *   5. SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF (./onay.ts): the list and the pack's switched-on new tools match
 *      exactly; the dose calculator is on again and on its own list; the cardiovascular risk stays a placeholder.
 *   6. COUNTRY DATA: every laboratory unit names the national document it was read in — or says that none was found.
 *   7. LICENCE: "free" is stated exactly where a notice was read; nothing else gained a statement.
 */
process.env.NOTYA_COUNTRY = 'uz'

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { AracGirdisi, AracSonucu, UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { gunEkle, gunFarki } from '@/lib/ulke/araclar/yardimci'
import { UZ_EMLASH_QAYDI, UZ_HOMILADORLIK_MUDDATI, UZ_HOMILADORLIK_QOIDASI, UZ_KENDI_TANIMLAR, UZ_TANA_VAZNI_INDEKSI, UZ_TVI_CHEGARALARI, UZ_TVI_ENG_KICHIK_YOSH } from './tanimlar'
import { UZ_KENDI_ARACLAR } from './metinler'
import { UZ_ONAYSIZ_GERI_ACILAN, UZ_ONAYSIZ_YENI_ARACLAR } from './onay'
import { UZ_LAB_BIRIM_KAYNAKLARI, UZ_LAB_BIRIMLERI } from '../birimler'

const KOK = resolve(__dirname, '../../../../..')
const DIZIN = join(KOK, 'countries/uz/uygulama/araclar/kendi')
const OKUNDU = '2026-10-10'
const BUGUN = '2026-10-10'

/** Every source a number of these tools was read in: the address as it stands beside the number. */
const KAYNAKLAR = {
  ANC: 'https://uzbekistan.unfpa.org/sites/default/files/submissions/protokoly_anu_1_2_3_4_5_6_12_13_rus.pdf',
  WHO: 'https://www.who.int/data/nutrition/nlis/info/malnutrition-in-women',
  CDC1: 'https://www.cdc.gov/growth-chart-training/hcp/using-bmi/calculating-bmi.html',
  CDC2: 'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',
  NHS: 'https://www.healthyweightgrampian.scot.nhs.uk/?p=3519',
  ACOG: 'https://www.healthcare.uiowa.edu/familymedicine/fpinfo/OB/OB2017/ACOG redating gestational age.pdf',
  IMM: 'https://lex.uz/uz/acts/-5524039',
  TELIF: 'https://lex.uz/en/acts/-1022944',
  CDC_BILDIRIM: 'https://cdc.gov/other/agencymaterials.html',
} as const

const tvi = (vazn: number | null, boy: number | null, bel: number | null = null): AracSonucu => UZ_TANA_VAZNI_INDEKSI.hesapla({ vazn, boy, bel }, { bugun: BUGUN, p: {} })
const muddat = (g: AracGirdisi, bugun: string): AracSonucu => UZ_HOMILADORLIK_MUDDATI.hesapla({ usul: null, oxirgi_hayz: null, sikl: null, uzi_tugish: null, kochirish: null, kultivatsiya: null, ...g }, { bugun, p: {} })
const emlash = (g: AracGirdisi, bugun = BUGUN): AracSonucu => UZ_EMLASH_QAYDI.hesapla({ vaksina: null, doza: null, sana: null, manba: null, keyingi: null, ...g }, { bugun, p: {} })
const sayi = (s: AracSonucu, k: string) => s.sayilar.find((x) => x.anahtar === k)?.deger
const gun = (s: AracSonucu, k: string) => s.tarihler.find((x) => x.anahtar === k)?.tarih

describe('Uzbekistan — the tools only this country has: the numbers are the sources\'', () => {
  it('the file of the mechanisms names every source by its address and the day it was read, and says a machine wrote it', () => {
    const kaynak = readFileSync(join(DIZIN, 'tanimlar.ts'), 'utf8')
    for (const [ad, adres] of Object.entries(KAYNAKLAR)) assert.ok(kaynak.includes(adres), `${ad}: ${adres} is not cited in tanimlar.ts`)
    assert.ok(kaynak.includes(OKUNDU))
    assert.match(kaynak, /WRITTEN BY A MACHINE FROM SOURCES OPENED ON 2026-10-10\. NO CLINICIAN OF UZBEKISTAN HAS READ A LINE OF THIS FILE\./)
    assert.match(readFileSync(join(DIZIN, 'metinler.ts'), 'utf8').slice(0, 1200), /MACHINE-WRITTEN\. AWAITS NATIVE REVIEW/)
  })

  it('BODY MASS INDEX — the limits of the four classes are those of Table 1 of the national antenatal protocol (2021): below 18,5; 18,5–24,9; 25,0–29,9; 30 and above', () => {
    // [ANC] Table 1; the same limits on the WHO page and on the CDC page "Adult BMI Categories" (read 2026-10-10)
    assert.deepEqual(UZ_TVI_CHEGARALARI, { kam: 18.5, meyor: 24.9, ortiqcha: 29.9 })
    // the one source that states an age: CDC, "For adults 20 and older"
    assert.equal(UZ_TVI_ENG_KICHIK_YOSH, 20)
  })

  it('EXPECTED DATE OF BIRTH — the four numbers of the rule are those of the national antenatal protocol (2021): 280 days = 40 weeks, 266 days after a transfer, more than 5 days', () => {
    assert.deepEqual(UZ_HOMILADORLIK_QOIDASI, { hayzdanKun: 280, kochirishdanKun: 266, uziFarqiKun: 5, hafta: 40 })
    // the protocol's own equivalences: 280 days are 40 weeks, 266 days are 38 weeks
    assert.equal(UZ_HOMILADORLIK_QOIDASI.hayzdanKun, UZ_HOMILADORLIK_QOIDASI.hafta * 7)
    assert.equal(UZ_HOMILADORLIK_QOIDASI.kochirishdanKun, 38 * 7)
  })

  it('no tool of the three leaves a number to the country or reads a table: there is nothing a pack could state wrongly', () => {
    for (const t of UZ_KENDI_TANIMLAR) { assert.deepEqual([t.parametreler ?? [], t.secimlikParametreler ?? [], t.tablolar ?? []], [[], [], []], t.anahtar); assert.ok(!t.alanlar.some((a) => a.lab), `${t.anahtar} reads a laboratory value`) }
  })
})

describe('Uzbekistan — body mass index: the arithmetic and the classes', () => {
  it('THE WORKED EXAMPLE OF A SOURCE (NHS Grampian, read 2026-10-10): 89 kg and 1.62 m give 33.9 kg/m2', () => {
    const s = tvi(89, 162)
    assert.equal(s.tamam, true)
    assert.deepEqual(s.sayilar, [{ anahtar: 'tvi', deger: 33.9, ondalik: 1, birim: 'kg/m2' }])
    assert.equal(s.bant, 'semizlik')
    // the formula as the CDC page prints it — weight (kg) / [height (m)]2 — worked by hand for the same person
    assert.equal(Math.round((89 / (1.62 * 1.62)) * 10) / 10, 33.9)
  })

  it('every limit of Table 1, from both sides (a height of 2 m, so that the index is a quarter of the weight)', () => {
    const sinif = (vazn: number) => { const s = tvi(vazn, 200); return [sayi(s, 'tvi'), s.bant] }
    assert.deepEqual(sinif(73.6), [18.4, 'kam'])
    assert.deepEqual(sinif(74), [18.5, 'meyor'])
    assert.deepEqual(sinif(99.6), [24.9, 'meyor'])
    assert.deepEqual(sinif(100), [25, 'ortiqcha'])
    assert.deepEqual(sinif(119.6), [29.9, 'ortiqcha'])
    assert.deepEqual(sinif(120), [30, 'semizlik'])
  })

  it('the index is held against the limits AS IT IS WRITTEN, to one decimal place: 24,96 is written 25,0 and is in the class that begins at 25,0 — the number and the class on the screen never disagree', () => {
    const s = tvi(99.84, 200)
    assert.deepEqual([sayi(s, 'tvi'), s.bant], [25, 'ortiqcha'])
    const t = tvi(99.76, 200) // 24,94 is written 24,9
    assert.deepEqual([sayi(t, 'tvi'), t.bant], [24.9, 'meyor'])
    // every result falls in exactly one of the four classes
    for (let vazn = 30; vazn <= 250; vazn += 0.7) for (const boy of [140, 162, 175, 200]) { const x = tvi(vazn, boy); assert.ok(x.tamam && UZ_TANA_VAZNI_INDEKSI.cikti.bantlar.includes(x.bant!), `${vazn} kg, ${boy} cm`) }
  })

  it('nothing is worked out from half a form, and the waist circumference changes nothing: it is recorded and never assessed', () => {
    for (const [v, b] of [[null, 170], [70, null], [null, null], [70, 0]] as const) assert.equal(tvi(v, b).tamam, false)
    assert.deepEqual(tvi(70, 170, 60), tvi(70, 170, 130))
    assert.deepEqual(tvi(70, 170, 95), tvi(70, 170))
    assert.deepEqual(UZ_TANA_VAZNI_INDEKSI.cikti.uyarilar, [], 'the tool has no warning: it holds no limit for the waist')
  })
})

describe('Uzbekistan — gestational age and the expected date of birth: the date arithmetic', () => {
  // NO SOURCE READ PRINTS AN EXAMPLE WITH CALENDAR DATES. The days below were counted on a calendar of 2026 (not a
  // leap year): 1 January + 280 days = 8 October (31+28+31+30+31+30+31+31+30 = 273 days to 1 October, and 7 more).
  const HAYZ = '2026-01-01', TUGISH = '2026-10-08'

  it('FROM THE LAST PERIOD: the first day plus 280 days — 40 weeks to the day', () => {
    const s = muddat({ usul: 'hayz', oxirgi_hayz: HAYZ, sikl: 'yigirma_sakkiz' }, '2026-03-12')
    assert.equal(s.tamam, true)
    assert.equal(gun(s, 'tugish'), TUGISH)
    assert.equal(gunFarki(HAYZ, gun(s, 'tugish')!), 280)
    assert.equal(s.bant, 'hayz_boyicha')
    // 12 March is 70 days after 1 January (30 days left of January, 28 of February, 12 of March): 10 weeks and 0 days
    assert.deepEqual([sayi(s, 'hafta'), sayi(s, 'kun')], [10, 0])
    assert.deepEqual(s.uyarilar, [])
    // on the expected day itself: 40 weeks and 0 days — the protocol's own equivalence
    const son = muddat({ usul: 'hayz', oxirgi_hayz: HAYZ, sikl: 'yigirma_sakkiz' }, TUGISH)
    assert.deepEqual([sayi(son, 'hafta'), sayi(son, 'kun'), son.uyarilar], [40, 0, []])
    // on the first day of the period: 0 weeks and 0 days; the day before: no result
    assert.deepEqual([sayi(muddat({ usul: 'hayz', oxirgi_hayz: HAYZ, sikl: 'yigirma_sakkiz' }, HAYZ), 'hafta'), muddat({ usul: 'hayz', oxirgi_hayz: HAYZ, sikl: 'yigirma_sakkiz' }, '2025-12-31').tamam], [0, false])
    // for every day of a year the date is 280 days on, and the age is the days since the first day
    for (let i = 0; i < 366; i += 13) { const h = gunEkle('2027-06-15', i), b = gunEkle(h, 100); const x = muddat({ usul: 'hayz', oxirgi_hayz: h, sikl: 'yigirma_sakkiz' }, b); assert.deepEqual([gunFarki(h, gun(x, 'tugish')!), sayi(x, 'hafta'), sayi(x, 'kun')], [280, 14, 2], h) }
  })

  it('THE ULTRASOUND OF 11 TO 14 WEEKS: its date replaces the date by the last period when the two differ by MORE THAN 5 days — exactly 5 days does not', () => {
    const ile = (uzi: string) => muddat({ usul: 'hayz', oxirgi_hayz: HAYZ, sikl: 'yigirma_sakkiz', uzi_tugish: uzi }, '2026-03-12')
    for (const [uzi, fark, bant, tarih] of [
      ['2026-10-08', 0, 'hayz_boyicha', TUGISH],
      ['2026-10-13', 5, 'hayz_boyicha', TUGISH], // 5 days later: not more than 5
      ['2026-10-03', 5, 'hayz_boyicha', TUGISH], // 5 days earlier
      ['2026-10-14', 6, 'uzi_boyicha', '2026-10-14'],
      ['2026-10-02', 6, 'uzi_boyicha', '2026-10-02'],
      ['2026-10-29', 21, 'uzi_boyicha', '2026-10-29'],
    ] as const) {
      const s = ile(uzi)
      assert.deepEqual([sayi(s, 'farq'), s.bant, gun(s, 'tugish')], [fark, bant, tarih], uzi)
    }
    // where the ultrasound sets the date, the age shown is counted back from it: 6 days later = 6 days younger
    assert.deepEqual([sayi(ile('2026-10-14'), 'hafta'), sayi(ile('2026-10-14'), 'kun')], [9, 1])
    // without an ultrasound date no difference is shown
    assert.equal(sayi(muddat({ usul: 'hayz', oxirgi_hayz: HAYZ, sikl: 'yigirma_sakkiz' }, '2026-03-12'), 'farq'), undefined)
  })

  it('A CYCLE THAT IS NOT 28 DAYS: the protocol asks for a correction and prints no number — the tool corrects NOTHING, and says so', () => {
    const duz = muddat({ usul: 'hayz', oxirgi_hayz: HAYZ, sikl: 'yigirma_sakkiz' }, '2026-03-12')
    const baska = muddat({ usul: 'hayz', oxirgi_hayz: HAYZ, sikl: 'boshqa' }, '2026-03-12')
    assert.deepEqual(baska.uyarilar, ['sikl_tuzatilmagan'])
    assert.deepEqual([baska.tarihler, baska.sayilar, baska.bant], [duz.tarihler, duz.sayilar, duz.bant], 'the date of another cycle is the uncorrected date')
    // the cycle must be answered: without it there is no result
    assert.equal(muddat({ usul: 'hayz', oxirgi_hayz: HAYZ }, '2026-03-12').tamam, false)
    // the definition holds no field for a cycle length: there is no number the tool could correct by
    assert.ok(!UZ_HOMILADORLIK_MUDDATI.alanlar.some((a) => a.tur === 'sayi' && a.anahtar !== 'kultivatsiya'))
  })

  it('AFTER AN EMBRYO TRANSFER: the transfer day plus 266 days minus the days of culture — 261 days for a day-5 embryo and 263 for a day-3 embryo, as the ACOG opinion works them out', () => {
    const K = '2026-02-01'
    for (const [kultivatsiya, kunlar] of [[5, 261], [3, 263], [0, 266], [6, 260]] as const) {
      const s = muddat({ usul: 'yrt', kochirish: K, kultivatsiya }, K)
      assert.equal(s.tamam, true)
      assert.equal(gunFarki(K, gun(s, 'tugish')!), kunlar, `culture ${kultivatsiya}`)
      assert.equal(s.bant, 'yrt_boyicha')
      // the age on the transfer day, counted back from the date: 280 minus the days left
      assert.equal(sayi(s, 'hafta')! * 7 + sayi(s, 'kun')!, 280 - kunlar)
    }
    // a day-5 embryo, on the transfer day: 19 days = 2 weeks and 5 days
    assert.deepEqual([sayi(muddat({ usul: 'yrt', kochirish: K, kultivatsiya: 5 }, K), 'hafta'), sayi(muddat({ usul: 'yrt', kochirish: K, kultivatsiya: 5 }, K), 'kun')], [2, 5])
    // the days of culture are required, whole and not negative; the fields of the other way of counting are not read
    for (const kultivatsiya of [null, 2.5, -1]) assert.equal(muddat({ usul: 'yrt', kochirish: K, kultivatsiya }, K).tamam, false)
    assert.deepEqual(muddat({ usul: 'yrt', kochirish: K, kultivatsiya: 5, oxirgi_hayz: '2025-01-01', uzi_tugish: '2027-01-01', sikl: 'boshqa' }, K), muddat({ usul: 'yrt', kochirish: K, kultivatsiya: 5 }, K))
  })

  it('a day after the expected date raises a warning; nothing is worked out without the way of counting; and the tool holds no visit, no examination and no advice', () => {
    const gec = muddat({ usul: 'hayz', oxirgi_hayz: HAYZ, sikl: 'yigirma_sakkiz' }, '2026-10-20')
    assert.deepEqual([gec.uyarilar, sayi(gec, 'hafta'), sayi(gec, 'kun')], [['muddat_otgan'], 41, 5])
    assert.equal(muddat({ oxirgi_hayz: HAYZ, sikl: 'yigirma_sakkiz' }, '2026-03-12').tamam, false)
    assert.deepEqual(UZ_HOMILADORLIK_MUDDATI.cikti, { sayilar: ['hafta', 'kun', 'farq'], bantlar: ['hayz_boyicha', 'uzi_boyicha', 'yrt_boyicha'], uyarilar: ['sikl_tuzatilmagan', 'muddat_otgan'], tarihler: ['tugish'] })
  })
})

describe('Uzbekistan — a vaccination, recorded: the tool knows no vaccine and proposes nothing', () => {
  const TAM = { vaksina: 'A', doza: 2, sana: '2026-09-01', manba: 'hujjat', keyingi: '2026-12-01' } as const

  it('it repeats what was typed and nothing else: the dose number, the two days, where the fact comes from', () => {
    const s = emlash(TAM)
    assert.deepEqual(s, { tamam: true, sayilar: [{ anahtar: 'doza', deger: 2, ondalik: 0 }], bant: 'hujjat', uyarilar: [], tarihler: [{ anahtar: 'sana', tarih: '2026-09-01' }, { anahtar: 'keyingi', tarih: '2026-12-01' }] })
    // without a next day and a dose number: the day it was given, and nothing proposed in their place
    assert.deepEqual(emlash({ vaksina: 'A', sana: '2026-09-01', manba: 'ogzaki' }), { tamam: true, sayilar: [], bant: 'ogzaki', uyarilar: [], tarihler: [{ anahtar: 'sana', tarih: '2026-09-01' }] })
  })

  it('THE ANSWER NEVER DEPENDS ON WHAT THE VACCINE IS CALLED, on the dose number or on the patient: every day in a result is a day the doctor typed', () => {
    for (const vaksina of ['A', 'B', 'x y z', '1']) for (const doza of [null, 1, 7]) {
      const s = emlash({ ...TAM, vaksina, doza })
      assert.deepEqual([s.bant, s.uyarilar, s.tarihler], [emlash(TAM).bant, [], emlash(TAM).tarihler], `${vaksina} ${doza}`)
      for (const t of s.tarihler) assert.ok([TAM.sana, TAM.keyingi].includes(t.tarih as never))
    }
    // the mechanism: a free text, a number, two days and one choice — no list of vaccines, no age, no interval, no table, no number of the country
    assert.deepEqual(UZ_EMLASH_QAYDI.alanlar.map((a) => [a.anahtar, a.tur]), [['vaksina', 'metin'], ['doza', 'sayi'], ['sana', 'tarih'], ['manba', 'secim'], ['keyingi', 'tarih']])
    assert.deepEqual(UZ_EMLASH_QAYDI.alanlar.find((a) => a.anahtar === 'manba')!.secenekler, ['hujjat', 'ogzaki'])
    assert.equal(UZ_EMLASH_QAYDI.kaynak, null, 'a record of the product\'s own cites no source: it holds none')
    // the only warning is about the day the DOCTOR set
    assert.deepEqual(UZ_EMLASH_QAYDI.cikti.uyarilar, ['keyingi_otgan'])
    assert.deepEqual(emlash({ ...TAM, keyingi: '2026-10-09' }).uyarilar, ['keyingi_otgan'])
    assert.deepEqual(emlash({ ...TAM, keyingi: BUGUN }).uyarilar, [], 'today is not past')
  })

  it('a vaccination that was not given is not recorded: no name, no day, no source, or a day after today', () => {
    for (const g of [{ ...TAM, vaksina: null }, { ...TAM, vaksina: '   ' }, { ...TAM, sana: null }, { ...TAM, manba: null }, { ...TAM, sana: '2026-10-11' }]) assert.equal(emlash(g).tamam, false, JSON.stringify(g))
    assert.equal(emlash({ ...TAM, sana: BUGUN }).tamam, true, 'given today')
  })

  it('NOTHING OF THE NATIONAL CALENDAR IS IN THE FOLDER: the act is named for its title and status only, and no file holds an age, an interval or a list of vaccines', () => {
    const tanimlar = readFileSync(join(DIZIN, 'tanimlar.ts'), 'utf8')
    assert.match(tanimlar, /NOTHING OF ITS CALENDAR IS IN THE PRODUCT/)
    const blok = tanimlar.slice(tanimlar.indexOf('export const UZ_EMLASH_QAYDI'), tanimlar.indexOf('/** The mechanisms of the pack\'s own tools'))
    // besides zero, the mechanism's code holds exactly two numbers: the limits of what can be typed as a dose number
    assert.deepEqual(blok.replace(/\/\/.*$/gm, '').match(/\b\d+\b/g), ['1', '20', '0', '0', '0'])
    const p = UZ_KENDI_ARACLAR.find((x) => x.anahtar === 'uz-emlash-qaydi')!
    for (const metin of [p.metin.ad, p.metin.aciklama, p.metin.not, ...Object.values(p.metin.alanlar), ...Object.values(p.metin.bantlar ?? {})]) for (const v of Object.values(metin)) assert.doesNotMatch(v, /\d/, `a number in a text of the vaccination record: "${v}"`)
  })
})

describe('Uzbekistan — the tools only this country has, in the pack: who sees them, what is switched on, the licence', () => {
  let icerik: UlkeAraclari
  let roller: readonly string[]
  let P: typeof import('@/lib/ulke/araclar/paket')
  before(async () => {
    icerik = (await import('../index')).UZ_ARACLAR
    roller = (await import('../../../index')).UZ_PAKETI.uygulama!.roller!
    P = await import('@/lib/ulke/araclar/paket')
  })

  it('the pack check finds nothing to say about the tools area with the three new tools in it', async () => {
    const { araclarSorunlari } = await import('@/lib/ulke/araclar/denetim')
    const { UZ_PAKETI } = await import('../../../index')
    const { AKTIF_ARAYUZ } = await import('@/countries/active/arayuz')
    assert.deepEqual(araclarSorunlari(UZ_PAKETI, AKTIF_ARAYUZ, UZ_PAKETI.diller), [])
    assert.deepEqual(icerik.kendiAraclari, UZ_KENDI_TANIMLAR)
  })

  it('WHO SEES WHICH: the index every one of the 40 doctor roles and no allied profession; the dates obstetrics and family medicine; the vaccination record paediatrics and family medicine; an account without a role none', async () => {
    const { UZ_HEKIM_ROLLERI } = await import('../../../klinik/rolListesi')
    const goren = (anahtar: string) => roller.filter((r) => P.hesabinAraci(icerik, r, anahtar))
    assert.equal(UZ_HEKIM_ROLLERI.length, 40)
    assert.deepEqual(goren('uz-tana-vazni-indeksi'), [...UZ_HEKIM_ROLLERI])
    assert.deepEqual(goren('uz-homiladorlik-muddati').sort(), ['aile-hekimligi', 'kadin-hastaliklari-dogum'])
    assert.deepEqual(goren('uz-emlash-qaydi').sort(), ['aile-hekimligi', 'pediatri'])
    for (const k of ['uz-tana-vazni-indeksi', 'uz-homiladorlik-muddati', 'uz-emlash-qaydi']) {
      assert.equal(P.hesabinAraci(icerik, null, k), null, `${k}: an account without a role`)
      for (const r of ['fizyoterapi', 'klinik-psikolog']) assert.equal(P.hesabinAraci(icerik, r, k), null, `${k}: ${r}`)
      assert.notEqual(icerik.araclar.find((p) => p.anahtar === k)!.roller, null, `${k} is a base tool`)
    }
    // BEFORE → NOW, three doctors: a cardiologist had the three base tools only; a family doctor too; a paediatrician had the expected height
    const kendi = (rol: string) => P.hesabinAraclari(icerik, rol).rol.map((x) => x.tanim.anahtar)
    assert.deepEqual(kendi('kardiyoloji'), ['uz-tana-vazni-indeksi', 'takip-paneli'])
    assert.deepEqual(kendi('aile-hekimligi'), ['uz-tana-vazni-indeksi', 'uz-homiladorlik-muddati', 'uz-emlash-qaydi', 'takip-paneli'])
    assert.deepEqual(kendi('pediatri'), ['hedef-boy', 'doz-hesabi', 'uz-tana-vazni-indeksi', 'uz-emlash-qaydi', 'takip-paneli'])
  })

  it('THE PATIENT GATE of the index: opened for a patient under 20, or for one whose birth date is not recorded, the tool is not there; without a patient it opens with the sentence that says who it is for', async () => {
    const { kapiSonucu } = await import('@/lib/ulke/araclar/hastaKapisi')
    const p = icerik.araclar.find((x) => x.anahtar === 'uz-tana-vazni-indeksi')!
    assert.deepEqual(p.hasta, { enAzYas: 20 })
    // today is 2026-10-10: born 2006-10-10 is 20 today; born 2006-10-11 is still 19
    assert.equal(kapiSonucu(p.hasta, { dogumTarihi: '2006-10-10' }, BUGUN), 'uygun')
    assert.equal(kapiSonucu(p.hasta, { dogumTarihi: '2006-10-11' }, BUGUN), 'degil')
    assert.equal(kapiSonucu(p.hasta, { dogumTarihi: '2019-05-01' }, BUGUN), 'degil')
    assert.equal(kapiSonucu(p.hasta, { dogumTarihi: null }, BUGUN), 'degil', 'what is not known never fits')
    assert.equal(kapiSonucu(p.hasta, null, BUGUN), 'hastasiz')
    const cocuk = P.hesabinAraclari(icerik, 'pediatri', { hasta: { dogumTarihi: '2019-05-01' }, bugun: BUGUN }).rol.map((x) => x.tanim.anahtar)
    assert.ok(!cocuk.includes('uz-tana-vazni-indeksi') && cocuk.includes('uz-emlash-qaydi') && cocuk.includes('hedef-boy'))
    for (const f of ['uz-Latn', 'uz-Cyrl', 'ru'] as const) assert.match(p.metin.hastaKapisi![f], /20/)
    // the other two have no gate, and so no sentence about one
    for (const k of ['uz-homiladorlik-muddati', 'uz-emlash-qaydi']) { const x = icerik.araclar.find((y) => y.anahtar === k)!; assert.deepEqual([x.hasta, x.metin.hastaKapisi], [undefined, undefined], k) }
  })

  it('THROUGH THE SCREEN\'S OWN PATH: what a doctor types in this country\'s units and number style gives the source\'s example', async () => {
    const { girdiyiCoz } = await import('@/lib/ulke/araclar/girdi')
    const { birimOrtami } = await import('@/lib/ulke/araclar/ortam')
    const o = birimOrtami(icerik)
    assert.deepEqual(o.birimler, { agirlik: 'kg', boy: 'cm', sicaklik: 'C' })
    const x = P.hesabinAraci(icerik, 'kardiyoloji', 'uz-tana-vazni-indeksi')!
    const s = P.aracCalistir(x, girdiyiCoz(x.tanim.alanlar, { vazn: '89', boy: '162' }, o), BUGUN, icerik)
    assert.deepEqual([s.tamam, sayi(s, 'tvi'), s.bant], [true, 33.9, 'semizlik'])
    // a weight or a height outside what can be typed is "nothing", never a number to work with
    assert.equal(P.aracCalistir(x, girdiyiCoz(x.tanim.alanlar, { vazn: '89', boy: '1.62' }, o), BUGUN, icerik).tamam, false, 'a height typed in metres is refused, not read as centimetres')
    const y = P.hesabinAraci(icerik, 'kadin-hastaliklari-dogum', 'uz-homiladorlik-muddati')!
    const t = P.aracCalistir(y, girdiyiCoz(y.tanim.alanlar, { usul: 'yrt', kochirish: '2026-02-01', kultivatsiya: '5', oxirgi_hayz: '2025-01-01' }, o), '2026-02-01', icerik)
    assert.deepEqual([t.tamam, gunFarki('2026-02-01', gun(t, 'tugish')!)], [true, 261])
    // every unit a result or a field of the three shows has a name in the three forms
    for (const b of ['kg/m2', 'hafta', 'gun', 'kg', 'cm']) for (const f of ['uz-Latn', 'uz-Cyrl', 'ru'] as const) assert.ok(icerik.birimler[b]?.[f], `${b} ${f}`)
  })

  it('SWITCHED ON WITHOUT A CLINICIAN\'S SIGN-OFF: the list and the pack\'s switched-on new tools match exactly — and the register of tools that are one country\'s alone lists the same three', async () => {
    const { ulkeyeOzelMi } = await import('@/lib/ulke/araclar/ulkeyeOzel')
    const acikYeni = icerik.araclar.map((p) => p.anahtar).filter((k) => ulkeyeOzelMi(k, 'uz')).sort()
    const liste = UZ_ONAYSIZ_YENI_ARACLAR.map((x) => x.anahtar).sort()
    assert.deepEqual(liste, acikYeni, 'a new tool is switched on and not on the list of ./onay.ts, or is on the list and not switched on')
    assert.deepEqual(liste, ['uz-emlash-qaydi', 'uz-homiladorlik-muddati', 'uz-tana-vazni-indeksi'])
    assert.deepEqual(UZ_KENDI_TANIMLAR.map((t) => t.anahtar).sort(), liste, 'a mechanism without a switched-on tool, or the other way round')
    assert.deepEqual(UZ_KENDI_ARACLAR.map((p) => p.anahtar).sort(), liste)
    const kayit = JSON.parse(readFileSync(join(KOK, 'countries/yasak-araclar.json'), 'utf8')) as Record<string, string[]>
    assert.deepEqual(kayit.uz, liste)
    // each entry says what a clinician has to confirm; nobody has: the pack still names no clinician
    for (const x of [...UZ_ONAYSIZ_YENI_ARACLAR, ...UZ_ONAYSIZ_GERI_ACILAN]) assert.ok(x.ne.length > 30 && x.teyit.length >= 2 && x.teyit.every((t) => t.length > 40), x.anahtar)
    assert.deepEqual(icerik.inceleme, { makineYazimi: true, klinisyen: null })
    // no placeholder of the country's own: what was built is on, what was not built is not here under a key of ours
    assert.deepEqual(icerik.yuvalar.filter((y) => ulkeyeOzelMi(y.anahtar, 'uz')), [])
  })

  it('THE DOSE CALCULATOR IS ON AGAIN by the owner\'s order, for paediatrics only, and on the list of what is on without a sign-off; the other four of that day stay off', async () => {
    const { UZ_KAPALI_ARACLAR } = await import('../index')
    assert.deepEqual(UZ_ONAYSIZ_GERI_ACILAN.map((x) => x.anahtar), ['doz-hesabi'])
    assert.deepEqual([...UZ_KAPALI_ARACLAR].sort(), ['esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi'])
    assert.deepEqual(roller.filter((r) => P.hesabinAraci(icerik, r, 'doz-hesabi')), ['pediatri'])
    assert.ok(!icerik.yuvalar.some((y) => y.anahtar === 'doz-hesabi'), 'the dose calculator is still a placeholder')
    assert.deepEqual(icerik.dozYazimi, { sondaSifir: true })
    for (const k of UZ_KAPALI_ARACLAR) { assert.ok(!icerik.araclar.some((p) => p.anahtar === k), `${k} is switched on`); assert.ok(icerik.yuvalar.some((y) => y.anahtar === k), `${k} is not a placeholder`) }
  })

  it('THE AUDIT\'S REMOVALS, read from its own decisions file: every tool it marks "remove" is off for every role, and the proposals it kept are the ones accounted for here', () => {
    const karar = JSON.parse(readFileSync(join(KOK, 'docs/araclar-denetim/uz-kararlar.json'), 'utf8')) as { tools: { key: string; verdict: string }[]; addTools: { proposedName: string; secondPass: string }[] }
    const kaldir = karar.tools.filter((t) => t.verdict === 'remove').map((t) => t.key)
    assert.ok(kaldir.includes('esi-triyaj') && kaldir.length === 17, `${kaldir.length} tools are marked for removal`)
    for (const ham of kaldir) {
      // "tr:…" = a tool of the pre-split application the audit says must never come here ("tr:klinik/enabiz": its last segment)
      const anahtar = ham.replace(/^tr:(klinik\/)?/, '')
      assert.ok(!icerik.araclar.some((p) => p.anahtar === anahtar), `${ham} is marked "remove" and is switched on`)
      for (const r of [null, ...roller]) assert.equal(P.hesabinAraci(icerik, r, anahtar), null, `${ham} opens for ${r}`)
    }
    // the proposals the second pass KEPT: five. Three are built and on, one stays a placeholder by the owner's order, one was not built (below).
    assert.deepEqual(karar.addTools.filter((t) => t.secondPass === 'kept').map((t) => t.proposedName.split(/[:(]/)[0].trim()), ['Body mass index and waist circumference', 'Kidney function', 'Ten-year cardiovascular risk for the very-high-risk region', 'Gestational age and expected date of birth', 'Vaccination status against the national calendar'])
  })

  it('NOT BUILT: the ten-year cardiovascular risk stays an empty placeholder, and no tool works a kidney function out of a creatinine', () => {
    const kv = icerik.yuvalar.find((y) => y.anahtar === 'kv-risk-score2')
    assert.ok(kv && kv.acik === false && kv.icerik === null)
    assert.ok(!icerik.araclar.some((p) => p.anahtar === 'kv-risk-score2'))
    // the proposal that was not built: no tool of the pack reads a creatinine, and the pack states no unit for one
    assert.equal(UZ_LAB_BIRIMLERI.kreatinin, undefined)
    for (const p of icerik.araclar) { const t = P.paketinTanimi(icerik, p)!; assert.ok(!t.alanlar.some((a) => a.lab === 'kreatinin'), p.anahtar) }
  })

  it('LICENCE: each of the three states "free" and where that was read; the placeholder of the two questionnaires states "free" by the notice printed on the forms; no other tool or placeholder gained a statement', () => {
    for (const p of UZ_KENDI_ARACLAR) { assert.equal(p.lisans?.durum, 'serbest', p.anahtar); assert.ok((p.lisans?.kaynak ?? '').length > 60, `${p.anahtar}: where the licence was read`); assert.equal(p.lisans?.bildirim, undefined) }
    assert.ok(UZ_KENDI_ARACLAR[0].lisans!.kaynak!.includes(KAYNAKLAR.CDC_BILDIRIM))
    assert.ok(UZ_KENDI_ARACLAR[1].lisans!.kaynak!.includes(KAYNAKLAR.TELIF))
    for (const p of UZ_KENDI_ARACLAR.slice(0, 2)) assert.match(p.lisans!.kaynak!, /A machine's reading, not a lawyer's\./, p.anahtar)
    const anket = icerik.yuvalar.find((y) => y.anahtar === 'phq9-gad7')!
    assert.equal(anket.lisans?.durum, 'serbest')
    assert.ok(anket.lisans!.kaynak!.includes('"No permission required to reproduce, translate, display or distribute."') && anket.lisans!.kaynak!.includes(OKUNDU))
    assert.deepEqual([anket.acik, anket.icerik], [false, null], 'a licence is not an authorised translation: the placeholder stays a placeholder')
    // EXACTLY THESE state a licence, and no further tool was switched off on licence grounds
    assert.deepEqual(icerik.araclar.filter((p) => p.lisans).map((p) => p.anahtar).sort(), ['uz-emlash-qaydi', 'uz-homiladorlik-muddati', 'uz-tana-vazni-indeksi'])
    assert.deepEqual(icerik.yuvalar.filter((y) => y.lisans).map((y) => [y.anahtar, y.lisans!.durum]).sort(), [['esi-triyaj', 'izin-gerekli'], ['phq9-gad7', 'serbest'], ['rapor-taslagi', 'izin-gerekli']])
    assert.notEqual(icerik.lisansTam, true, 'the pack does not claim that every licence is stated: the others are listed for the owner')
  })

  it('the folder is the country\'s own: no Turkish letter, no tool of another country\'s state system, and no claim of a certificate, an approval or an endorsement in a text a doctor sees', () => {
    const yasak = (JSON.parse(readFileSync(join(KOK, 'countries/yasak-araclar.json'), 'utf8')) as { tr: string[] }).tr
    for (const ad of readdirSync(DIZIN).filter((x) => x.endsWith('.ts') && !x.endsWith('.test.ts'))) {
      const kaynak = readFileSync(join(DIZIN, ad), 'utf8')
      for (const k of yasak) assert.ok(!kaynak.includes(`'${k}'`), `${ad} names "${k}"`)
      assert.doesNotMatch(kaynak, /[çğıöşüİĞŞÇÖÜ]/, `${ad}: a Turkish letter`)
    }
    for (const p of UZ_KENDI_ARACLAR) for (const v of Object.values(p.metin).flatMap((m) => JSON.stringify(m))) assert.doesNotMatch(v, /sertifikat|сертифи|tasdiqlangan|одобрен|утвержд|тасдиқланган|litsenziya|лицензи/i, p.anahtar)
  })
})

describe('Uzbekistan — country data: the unit of each laboratory value, and where it was read', () => {
  /** What was read on 2026-10-10, written out a second time: quantity → unit, and the document that writes it so. */
  const OKUNAN: Readonly<Record<string, readonly [string, string | null]>> = {
    hemoglobin: ['g/L', 'ANC'], // the national antenatal protocols of 2021 write haemoglobin in g/l
    glukoz: ['mmol/L', 'ANC'], // …plasma glucose in mmol/l (the cardiology collection of 2015 too)
    hba1c: ['%', 'ANC'], // …glycated haemoglobin in per cent
    kolesterol: ['mmol/L', 'CARD'], // the cardiology collection of 2015 writes total cholesterol in mmol/l
    crp: ['mg/L', 'JIA'], // the protocol on juvenile arthritis (order No. 180 of 23.06.2025) writes C-reactive protein in mg/l
    psa: ['ng/mL', 'PSA'], // a paper of the national urology centre (2024): not a protocol
    albuminKreatinin: ['mg/g', null], // NOT FOUND in a national text: the starting value it always was
  }
  const ADRES: Readonly<Record<string, string>> = {
    ANC: 'https://uzbekistan.unfpa.org/sites/default/files/submissions/protokoly_anu_1_2_3_4_5_6_12_13_rus.pdf',
    CARD: 'https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf',
    JIA: 'https://api-portal.gov.uz/uploads/10/2026/03/07/c1e87c90-ebfe-7f4a-e9cd-655fdc8ee3a0_media_.pdf',
    PSA: 'https://fjsti.uz/uploads/img/yangilikar/Klinik%20va%20profilaktik%20tibbiyot%20jurnali/JCPM%204-2024/Kadirov%20N.U..pdf',
  }

  it('every unit the pack states is the one read, each names its document, and the file cites every document by address, title, number and date', () => {
    assert.deepEqual(Object.fromEntries(Object.entries(UZ_LAB_BIRIM_KAYNAKLARI).map(([k, v]) => [k, [v.birim, v.kaynak]])), OKUNAN)
    assert.deepEqual(UZ_LAB_BIRIMLERI, Object.fromEntries(Object.entries(OKUNAN).map(([k, v]) => [k, v[0]])))
    const kaynak = readFileSync(join(KOK, 'countries/uz/uygulama/araclar/birimler.ts'), 'utf8')
    for (const [ad, adres] of Object.entries(ADRES)) assert.ok(kaynak.includes(adres), `${ad} is not cited by its address`)
    for (const d of [/29\.07\.2021, minutes No\. 7/, /order No\. 180 of 23\.06\.2025/, /of 2015/, /2024, No\. 4/, /each opened on 2026-10-10/, /A PAPER, NOT A PROTOCOL OF THE MINISTRY/]) assert.match(kaynak, d)
    assert.match(kaynak, /UZ_LAB_BIRIMLERI` IS UNVERIFIED LOCAL CONTENT/)
  })

  it('WHAT NO NATIONAL TEXT STATES IS NOT SUPPLIED: no unit for creatinine, and not one limit of any value', () => {
    assert.equal(UZ_LAB_BIRIM_KAYNAKLARI.kreatinin, undefined)
    assert.match(readFileSync(join(KOK, 'countries/uz/uygulama/araclar/birimler.ts'), 'utf8'), /NO LIMIT OF ANY VALUE IS STATED HERE/)
  })

  it('BEFORE → NOW, the example the audit gives: a haemoglobin typed as 110 is read as 110 g/l — 11 g/dl to the kit — and no longer as a number without a unit', async () => {
    const { birimdenKanonige, olcuTanimi } = await import('@/lib/ulke/araclar/birimler')
    assert.equal(birimdenKanonige(olcuTanimi('hemoglobin'), UZ_LAB_BIRIMLERI.hemoglobin, 110), 11)
    // every stated unit is one the kit converts
    for (const [k, b] of Object.entries(UZ_LAB_BIRIMLERI)) assert.notEqual(birimdenKanonige(olcuTanimi(k), b, 1), null, k)
  })

  it('NOTHING ELSE WAS SUPPLIED, because no national source was found: the hearing grades and frequencies, the steps of a return to sport, the range of the expected height and the PSA caution are the kit\'s own or absent', async () => {
    const { UZ_ARACLAR } = await import('../index')
    for (const k of ['odyometri-pta', 'rtp-basamak', 'hedef-boy', 'psa-hizi']) {
      const p = UZ_ARACLAR.araclar.find((x) => x.anahtar === k)!
      assert.ok(p, k)
      assert.deepEqual([p.parametreler, p.tablolar, p.uyarlama], [undefined, undefined, undefined], `${k}: the pack states a number, a table or a band of its own`)
    }
  })
})
