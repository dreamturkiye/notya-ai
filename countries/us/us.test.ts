/**
 * NOTYA-ULKE-EN-01 — United States (`us`): the pack's own tests. The tests every English-speaking pack runs on itself
 * (countries/_dil/en/testing/paketSinamasi.ts), with what is the United States': American spelling, CONVENTIONAL
 * UNITS (pounds, inches, degrees Fahrenheit; mg/dL, g/dL, mg/g), several time zones, a neutral patient identifier
 * that is never a Social Security number, and the words of the other English-speaking countries that must not show.
 *
 * NOTYA-ULKE-DENETIM-US (2026-10-09), carried here on 2026-10-10 — the last block holds the pack to the standards
 * sheet of the localisation audit (branch audit/us, where each source is given): how a day, a time, a number and an
 * amount are written, the eight time zones and their daylight saving, the emergency number, the example phone number
 * and the phone rule, and the unit of every measured field of every live tool. The role names it held are now held,
 * for the fifty-five roles, by ./roller.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { INC_CM, LAB_BIRIMLERI, alanBirimi, alanBirimleri, type BirimOrtami } from '@/lib/ulke/araclar/birimler'
import { girdiyiCoz } from '@/lib/ulke/araclar/girdi'
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import { paketinTanimi, sayiMetni, type Yazici } from '@/lib/ulke/araclar/paket'
import { sayiYazKuralla } from '@/lib/ulke/arayuz/sayi'
import { sayiBirimi } from '@/lib/ulke/intake/sorular'
import { gunCoz, gunYazDesenle, haftaGunu, haftaninIlkGunu } from '@/lib/ulke/uygulama/zaman'
import { ingilizcePaketSinamasi, kaynakOku } from '../_dil/en/testing/paketSinamasi'
import { tumMetinler } from '../_dil/en/testing/yazimDenetimi'
import { US_ARAYUZ } from './arayuz'
import { US_BIRIMLER, US_GIRDI } from './ayarlar'
import derleme from './derleme.mjs'
import { US_PAKETI } from './index'
import { US_KLINIK } from './klinik'
import { US_ROLLER } from './roller'
import { US_ONAY_BEKLEYEN_ANAHTARLAR } from './araclar/onayBekleyen'

const D = 'en-US'
const BIRIMLER = { agirlik: 'lb', boy: 'in', sicaklik: 'F' } as const
const LAB = { albuminKreatinin: 'mg/g', hemoglobin: 'g/dL', kreatinin: 'mg/dL', glukoz: 'mg/dL', kolesterol: 'mg/dL', psa: 'ng/mL' }
/** C-reactive protein: BOTH units are accepted, and the doctor chooses one beside the field (NOTYA-ULKE-ARAC-DUZELTME-01). */
const CRP = ['mg/L', 'mg/dL'] as const

ingilizcePaketSinamasi({
  paket: US_PAKETI,
  arayuz: US_ARAYUZ,
  klinik: US_KLINIK,
  bicim: D,
  ayarlarKaynagi: kaynakOku(join(__dirname, 'ayarlar.ts')),
  // United Kingdom, Canada, Australia, New Zealand: their systems, identifiers, currencies, names, usage
  yabanci: /\b(NHS|NHI|GBP|CAD|AUD|NZD|United Kingdom|Canada|Canadian|provincial|Quebec|Australia|Australian|New Zealand|Medicare|health card|General practice|Anaesthetics|Respirology|staff physician|consultant)\b|£/,
  // off by Kaan's order of 2026-10-10 (NOTYA-ULKE-ARAC-01b): all five; only 'doz-hesabi' was off here before that day
  kapaliAraclar: ['doz-hesabi', 'esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi'],
  birimler: BIRIMLER,
  labBirimleri: { ...LAB, crp: CRP },
  kidemliHekim: 'attending physician',
  // a range reserved for fiction where this job is certain of one; otherwise a shape that is no number (see ./ayarlar.ts)
  // written the national way, NXX-NXX-XXXX, from the range the numbering plan keeps for fiction (555-0100 to 555-0199)
  ornekTelefon: /^[2-9]\d{2}-555-01\d{2}$/,
  // NOTYA-ULKE-UYGULA-US: this country's own role list (one role taken out, sixteen added: ./roller.ts, ./roller.test.ts)
  rolDegisimi: US_ROLLER,
  // the tools this country has beyond the set: seven of its own, switched on by the owner's order of 2026-10-10 (./araclar/)
  ekAraclar: US_ONAY_BEKLEYEN_ANAHTARLAR,
})

describe('us: what is the United States\'', () => {
  it('code us, served at /us; month first; week from Sunday; 12-hour clock; dollars', () => {
    assert.equal(US_PAKETI.kod, 'us')
    assert.equal(US_PAKETI.yolOnEki, '/us')
    assert.equal(derleme.yolOnEki, '/us')
    assert.equal(derleme.saatDilimi, US_PAKETI.saatDilimi)
    assert.equal(US_PAKETI.bicim.tarihDeseni, 'MM/DD/YYYY')
    assert.equal(US_PAKETI.bicim.haftaBasi, 7)
    assert.equal(US_PAKETI.uygulama!.saatBicimi, 12)
    assert.equal(US_PAKETI.paraBirimi.kod, 'USD')
    assert.equal(US_ARAYUZ.randevuMetinleri![D]!.form.tarihOrnek, 'MM/DD/YYYY')
  })

  it('several time zones: the default is one of them, an account is asked, and the calendar names no single zone', () => {
    const dilimler = [...US_PAKETI.uygulama!.saatDilimleri]
    assert.deepEqual(dilimler, ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'America/Adak', 'Pacific/Honolulu'])
    assert.ok(dilimler.includes(US_PAKETI.saatDilimi))
    assert.equal(US_ARAYUZ.metinler[D]!.ayarlar.saatDilimi, 'Time zone')
    assert.equal(US_ARAYUZ.randevuMetinleri![D]!.duzen.saatDilimi, 'Times are shown in the time zone set for your account.')
  })

  it('American spelling on the screens, and the country\'s own names for its specialties', () => {
    const ad = (rol: string) => US_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad[D]
    assert.equal(ad('paediatrics'), 'Pediatrics')
    assert.equal(ad('anaesthesia'), 'Anesthesiology')
    assert.equal(ad('orthopaedics'), 'Orthopedic surgery')
    assert.equal(ad('obstetrics-gynaecology'), 'Obstetrics and gynecology')
    // renamed by the audit of 2026-10-10 to the board's own name for the certificate (it was "Pulmonology")
    assert.equal(ad('respiratory-medicine'), 'Pulmonary Disease')
    assert.equal(ad('physiotherapy'), 'Physical therapist')
    assert.equal(US_ARAYUZ.randevuMetinleri![D]!.durum.iptal, 'Canceled')
    assert.match(US_KLINIK.notTalimati(D, 'general') ?? '', /You are an experienced attending physician\.[\s\S]*in American spelling/)
  })

  it('THE PATIENT IDENTIFIER IS NEUTRAL AND NEVER A SOCIAL SECURITY NUMBER', () => {
    assert.equal(US_PAKETI.ulusalKimlik?.ad, 'Patient identifier')
    assert.equal(US_ARAYUZ.metinler[D]!.yeniHasta.ulusalKimlik, 'Patient identifier')
    assert.equal(US_PAKETI.uygulama!.kimlikNumarasi.dogrula, false)
    assert.equal(US_PAKETI.ulusalKimlik?.hane, 0, 'no length is assumed: nothing shaped like a nine-digit number is asked for')
    const hepsi = tumMetinler({ paket: US_PAKETI.metinler, arayuz: { ...US_ARAYUZ, asistan: undefined }, form: US_KLINIK.hastaFormu })
    for (const x of hepsi) assert.doesNotMatch(x.metin, /social security|\bSSN\b|\bITIN\b|taxpayer/i, x.yer)
  })

  it('the guardian age is the pack\'s setting in both halves; the consent stamp is the country\'s own draft', () => {
    assert.equal(US_PAKETI.uygulama!.veliYasi, 18)
    assert.equal(US_PAKETI.uygulama!.veliYasi, US_GIRDI.veliYasi)
    assert.equal(US_KLINIK.riza.surum, 'us-draft-2026-10-09')
    assert.equal(US_ARAYUZ.metinler[D]!.muayene.riza, US_GIRDI.sozler.kayitRizasi)
    assert.match(kaynakOku(join(__dirname, 'ayarlar.ts')), /RECORDING-CONSENT LAW DIFFERS BY STATE/)
  })
})

describe('us: CONVENTIONAL UNITS — worked by hand', () => {
  const a = US_ARAYUZ.araclar!
  const o: BirimOrtami = { birimler: US_PAKETI.uygulama!.birimler, lab: a.labBirimleri, sayi: US_PAKETI.bicim }
  const yazici: Yazici = { sayi: (deger, ondalik) => deger.toFixed(ondalik), tarih: (iso) => iso, birim: (kod) => a.birimler[kod]?.[D] ?? `?${kod}?` }

  it('pounds, inches, degrees Fahrenheit; and the laboratory units are the ones the kit\'s arithmetic is written in', () => {
    assert.deepEqual({ ...US_PAKETI.uygulama!.birimler }, BIRIMLER)
    for (const [olcu, birim] of Object.entries(LAB)) assert.equal(LAB_BIRIMLERI[olcu as keyof typeof LAB_BIRIMLERI].birimler[birim], 1, `${olcu} in ${birim} needs no conversion`)
    assert.equal(LAB_BIRIMLERI.crp.birimler['mg/dL'], 10, 'a decilitre is a tenth of a litre')
  })

  it('expected height: heights typed in inches, the result written in inches — 64 in and 70 in give 69.6 in for a boy', () => {
    const t = kitAraci('hedef-boy')!
    const g = girdiyiCoz(t.alanlar, { cinsiyet: 'erkek', anne: '64', baba: '70' }, o)
    assert.ok(Math.abs((g.anne as number) - 64 * INC_CM) < 1e-9 && Math.abs((g.baba as number) - 70 * INC_CM) < 1e-9, 'inches become centimetres with the exact factor')
    const sonuc = t.hesapla(g, { bugun: '2026-10-09', p: {} })
    assert.equal(sonuc.tamam, true)
    // THE KIT BY ITSELF (no number of a country handed in) shows no range: the range either side is a number the country
    // states. This pack states 10 cm since NOTYA-ULKE-UYGULA-US, with its source: ./araclar/araclar.test.ts shows it.
    assert.deepEqual(sonuc.sayilar.map((x) => x.anahtar), ['hedef'])
    // by hand: 64 in = 162.56 cm → 162.6; 70 in = 177.8 cm; (177.8 + 162.6 + 13) / 2 = 176.7 cm = 69.57 in
    const hedef = sonuc.sayilar.find((x) => x.anahtar === 'hedef')!
    assert.equal(hedef.deger, 176.7)
    assert.equal(sayiMetni(hedef, a.metinler[D]!, yazici, o), '69.6 in')
    // the same heights typed as if they were centimetres are refused, not silently computed: 64 "cm" is out of range
    assert.equal(t.hesapla(girdiyiCoz(t.alanlar, { cinsiyet: 'erkek', anne: '162.56', baba: '177.8' }, o), { bugun: '2026-10-09', p: {} }).tamam, false)
  })

  it('weight-based dose arithmetic is NOT offered while weight is measured in pounds', () => {
    assert.ok(!a.araclar.some((x) => x.anahtar === 'doz-hesabi'))
    const yuva = a.yuvalar.find((y) => y.anahtar === 'doz-hesabi')
    assert.match(yuva?.eksik ?? '', /UNIT SAFETY/)
    assert.ok(!('lb' in a.birimler) || a.birimler.lb[D], 'no tool shows a weight; were one switched on, pounds would need a name')
  })

  it('DAS28: THE UNIT OF C-REACTIVE PROTEIN IS CHOSEN, NEVER ASSUMED — a number without its unit gives no result, and 1.0 mg/dL is 10 mg/L', () => {
    const t = kitAraci('das28')!
    assert.equal(t.alanlar.find((x) => x.anahtar === 'crp')?.lab, 'crp')
    assert.deepEqual(a.labBirimleri.crp, [...CRP])
    // the label no longer asks the doctor to multiply by hand
    assert.equal(a.araclar.find((x) => x.anahtar === 'das28')!.metin.alanlar.crp[D], 'C-reactive protein')
    // the audit's example (docs/araclar-denetim/US.md): 4 tender and 2 swollen joints, global score 50
    const ham = { varyant: 'crp', tjc: '4', sjc: '2', pga: '50' }
    const skor = (ek: Record<string, string>) => { const s = t.hesapla(girdiyiCoz(t.alanlar, { ...ham, ...ek }, o), { bugun: '2026-10-09', p: {} }); return s.tamam ? s.sayilar[0].deger : null }
    assert.equal(skor({ crp: '10' }), null, 'no unit chosen: no result')
    assert.equal(skor({ crp: '10', 'crp.birim': 'mg/L' }), 4.04)
    assert.equal(skor({ crp: '1.0', 'crp.birim': 'mg/dL' }), 4.04, 'the same result reported in mg/dL gives the same score')
    assert.equal(skor({ crp: '1.0', 'crp.birim': 'mg/L' }), 3.43, 'what the old screen made of a mg/dL value typed as it was reported')
    assert.equal(skor({ crp: '10', 'crp.birim': 'mmol/L' }), null, 'a unit the pack does not accept is no unit')
  })

  it('OFF BY KAAN\'S ORDER OF 2026-10-10 (they were on here until that day): KDIGO in mg/g (both tools), ESI, the report outline — each a slot that says why, the two licence cases stated as "permission needed"', () => {
    for (const k of ['kdigo-evre', 'kdigo-serit', 'esi-triyaj', 'rapor-taslagi']) {
      assert.ok(!a.araclar.some((x) => x.anahtar === k), `${k} is switched on`)
      assert.match(a.yuvalar.find((y) => y.anahtar === k)?.eksik ?? '', /off by the owner's order of 2026-10-10/, k)
    }
    for (const k of ['esi-triyaj', 'rapor-taslagi']) assert.equal(a.yuvalar.find((y) => y.anahtar === k)?.lisans?.durum, 'izin-gerekli', k)
    // internal medicine had the kidney tool and nothing else of the set. It has the follow-up list again since
    // NOTYA-ULKE-UYGULA-US, for the tools of this country's own that every doctor role has (./araclar/), not for the kidney tool
    assert.ok(a.araclar.find((x) => x.anahtar === 'takip-paneli')!.roller!.includes('internal-medicine'))
    assert.deepEqual(a.araclar.filter((x) => x.roller?.includes('internal-medicine')).map((x) => x.anahtar), ['us-bmi', 'us-egfr-ckd-epi-2021', 'us-pack-years', 'us-blood-sugar-ranges', 'us-fall-risk-screen', 'us-phq-9', 'takip-paneli'])
  })

  it('the intake form asks every height, weight and temperature in this country\'s unit, with the unit named', () => {
    const f = US_KLINIK.hastaFormu!
    const adlar = Object.fromEntries(Object.entries(US_ARAYUZ.formMetinleri![D]!.birim).map(([k, v]) => [k, String(v)]))
    const sorular = [...f.cekirdek.bolumler.flatMap((b) => [...b.sorular]), ...Object.values(f.roller).flatMap((r) => [...r.sorular])]
    let olculen = 0
    for (const s of sorular) {
      if (s.tur !== 'sayi' || !s.olcu) continue
      olculen++
      const b = sayiBirimi(s, D, US_PAKETI.uygulama!.birimler, adlar)
      assert.ok(['in', 'lb', 'F'].includes(b.kod), `${s.anahtar}: ${b.kod}`)
      assert.ok(b.ad.trim(), `${s.anahtar}: the unit has no name`)
    }
    assert.ok(olculen > 0, 'the form measures something')
  })
})

/**
 * NOTYA-ULKE-DENETIM-US — THE STANDARDS SHEET, HELD (carried from the localisation audit of 2026-10-09, branch
 * audit/us, where the source of each line is given). A change to the pack that breaks one of them must come with a
 * source of its own.
 */
describe('us: held to the standards sheet of the localisation audit (2026-10-09)', () => {
  const a = US_ARAYUZ.araclar!
  const u = US_PAKETI.uygulama!

  it('A DAY: month, day, four-digit year with slashes — written, typed and refused', () => {
    const desen = US_PAKETI.bicim.tarihDeseni
    assert.equal(desen, 'MM/DD/YYYY')
    assert.equal(gunYazDesenle('2026-10-09', desen), '10/09/2026', 'the ninth of October, not the tenth of September')
    assert.equal(gunYazDesenle('2026-03-04', desen), '03/04/2026')
    assert.equal(gunCoz('10/09/2026', desen), '2026-10-09')
    assert.equal(gunCoz('3/4/2026', desen), '2026-03-04', 'without leading zeros, as people here also write it')
    assert.equal(gunCoz('13/01/2026', desen), null, 'a day typed the day-first way is refused, not turned round')
    assert.equal(gunCoz('10/09/26', desen), null, 'a two-digit year is never guessed')
    assert.equal(US_GIRDI.sozler.tarihOrnegi, desen, 'the example a person is shown is the pattern the kit reads')
  })

  it('A TIME OF DAY: the 12-hour clock, as the platform writes it for en-US', () => {
    assert.equal(u.saatBicimi, 12)
    const yaz = (s: number, dk: number) => new Intl.DateTimeFormat(US_PAKETI.bicim.yerel, { timeZone: 'UTC', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(Date.UTC(2000, 0, 1, s, dk)))
    assert.match(yaz(14, 30), /^2:30\sPM$/u)
    assert.match(yaz(9, 0), /^9:00\sAM$/u)
    assert.match(yaz(0, 5), /^12:05\sAM$/u, 'five past midnight')
    assert.match(yaz(12, 0), /^12:00\sPM$/u, 'noon')
  })

  it('THE WEEK BEGINS ON SUNDAY: the pack, the kit\'s calendar arithmetic and the platform\'s locale data agree', () => {
    assert.equal(US_PAKETI.bicim.haftaBasi, 7)
    // 2026-10-09 is a Friday; the week it lies in begins on Sunday 2026-10-04
    assert.equal(haftaGunu('2026-10-09'), 5)
    assert.equal(haftaninIlkGunu('2026-10-09', US_PAKETI.bicim.haftaBasi), '2026-10-04')
    assert.equal(haftaGunu(haftaninIlkGunu('2026-10-09', US_PAKETI.bicim.haftaBasi)), 7)
    const yerel = new Intl.Locale(US_PAKETI.bicim.yerel) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } }
    const bilgi = yerel.getWeekInfo?.() ?? yerel.weekInfo
    if (bilgi) assert.equal(bilgi.firstDay, 7, 'the Unicode locale data for the United States')
  })

  it('A NUMBER AND AN AMOUNT: a point for decimals, a comma between thousands, the dollar sign before the number', () => {
    assert.deepEqual({ o: US_PAKETI.bicim.ondalikAyraci, b: US_PAKETI.bicim.binlikAyraci }, { o: '.', b: ',' })
    assert.equal(sayiYazKuralla(1234567.5, US_PAKETI.bicim, 2), '1,234,567.50')
    assert.equal(sayiYazKuralla(0.25, US_PAKETI.bicim, 2), '0.25', 'a zero before the point')
    assert.deepEqual({ ...US_PAKETI.paraBirimi }, { kod: 'USD', simge: '$', ondalikHane: 2 })
    assert.equal(US_GIRDI.acilis.aylikTutarKalibi, '$% a month')
    assert.equal(US_GIRDI.acilis.aylikTutarKalibi.replace('%', sayiYazKuralla(1250, US_PAKETI.bicim, 0)), '$1,250 a month')
    // and still no price anywhere: every plan is by quote
    for (const plan of Object.values(US_GIRDI.acilis.fiyatlar)) assert.equal(plan.aylik, null)
  })

  it('EIGHT TIME ZONES FOR THE FIFTY STATES, each a different clock: Arizona and Hawaii keep no daylight saving, the western Aleutians do', () => {
    const fark = (dilim: string, an: string): number => {
      const t = new Date(an)
      const p = new Intl.DateTimeFormat('en-GB', { timeZone: dilim, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(t)
      const al = (tur: string) => Number(p.find((x) => x.type === tur)!.value)
      return (Date.UTC(al('year'), al('month') - 1, al('day'), al('hour') % 24, al('minute')) - t.getTime()) / 3_600_000
    }
    const kis = '2026-01-15T12:00:00Z', yaz = '2026-07-15T12:00:00Z'
    const beklenen: Record<string, [number, number]> = {
      'America/New_York': [-5, -4], 'America/Chicago': [-6, -5], 'America/Denver': [-7, -6], 'America/Phoenix': [-7, -7],
      'America/Los_Angeles': [-8, -7], 'America/Anchorage': [-9, -8], 'America/Adak': [-10, -9], 'Pacific/Honolulu': [-10, -10],
    }
    assert.deepEqual([...u.saatDilimleri].sort(), Object.keys(beklenen).sort())
    for (const [dilim, [k, y]] of Object.entries(beklenen)) assert.deepEqual([fark(dilim, kis), fark(dilim, yaz)], [k, y], dilim)
    // no two of them are the same clock all year: each is listed for a reason
    assert.equal(new Set(Object.values(beklenen).map((x) => x.join())).size, 8)
    assert.equal(US_GIRDI.sozler.cokSaatDilimi, true)
    assert.doesNotMatch(US_GIRDI.sozler.saatDilimiCumlesi, /Eastern|Central|Mountain|Pacific|New York/, 'the calendar names no single zone')
  })

  it('THE EMERGENCY NUMBER IS 911, a setting and never part of a sentence; no other number is named', () => {
    assert.equal(u.portal?.acilNumara, '911')
    const hepsi = tumMetinler({ paket: US_PAKETI.metinler, arayuz: { ...US_ARAYUZ, asistan: undefined }, form: US_KLINIK.hastaFormu })
    for (const x of hepsi) assert.doesNotMatch(x.metin, /\b(911|988|999|112|111|000)\b/, x.yer)
  })

  it('THE PHONE: +1 and ten digits; the example is written the national way; the rule takes every common spelling and refuses the rest', () => {
    assert.deepEqual({ onEk: US_PAKETI.telefon.ulkeOnEki, hane: US_PAKETI.telefon.ulusalHane, ornek: US_PAKETI.telefon.ornek }, { onEk: '+1', hane: 10, ornek: '202-555-0123' })
    assert.equal(US_GIRDI.acilis.telefonOrnegi, US_PAKETI.telefon.ornek)
    const gecerli = US_PAKETI.telefon.cepGecerliMi
    for (const iyi of [US_PAKETI.telefon.ornek, '(202) 555-0123', '202.555.0123', '2025550123', '+1 202 555 0123', '1-202-555-0123']) assert.equal(gecerli(iyi), true, iyi)
    for (const kotu of ['', '555-0123', '202-555-012', '102-555-0123', '202-155-0123', '+44 20 7946 0123', '202-555-0123 ext 4', '20255501234']) assert.equal(gecerli(kotu), false, kotu)
  })

  it('THE UNIT OF EVERY MEASURED FIELD OF EVERY LIVE TOOL; no tool of the shared set takes a body weight while weight is in pounds, and the one tool that does works out no dose', () => {
    const o: BirimOrtami = { birimler: u.birimler, lab: a.labBirimleri }
    const adi = (kod: string) => a.birimler[kod]?.[D] ?? `?${kod}?`
    const gorulen: Record<string, string> = {}
    for (const x of a.araclar) {
      // the kit's mechanism, or — for a tool only this country has — the pack's own
      for (const alan of paketinTanimi(a, x)?.alanlar ?? []) {
        // a laboratory value the country accepts in two units is written with both: the doctor chooses one
        const kodlar = alan.lab ? alanBirimleri(alan, o) : [alanBirimi(alan, o)].filter((k): k is string => Boolean(k))
        if (!kodlar.length) continue
        assert.notEqual(alan.olcu, 'agirlik', `${x.anahtar}.${alan.anahtar}: a body weight in pounds on a clinician's screen (see ./temel.ts, US_BIRIMLER)`)
        // a weight typed in pounds: only the body mass index, as the CDC's own adult calculator takes it
        if (kodlar.includes('lb')) assert.equal(x.anahtar, 'us-bmi', `${x.anahtar}.${alan.anahtar} takes a weight in pounds`)
        gorulen[`${x.anahtar}.${alan.anahtar}`] = kodlar.map(adi).join(' or ')
      }
    }
    assert.deepEqual(gorulen, {
      'yara-dren-izlem.dren_cikis_ml': 'mL',
      'scorad.yayginlik': '%', 'antibiyotik-sure.sure_gun': 'days', 'inhaler-teknik.kontrol_ay': 'months',
      'odyometri-pta.e05': 'dB', 'odyometri-pta.e1': 'dB', 'odyometri-pta.e2': 'dB', 'odyometri-pta.e4': 'dB', 'odyometri-pta.onceki_pta': 'dB', 'odyometri-pta.karsi_pta': 'dB',
      'hedef-boy.anne': 'in', 'hedef-boy.baba': 'in',
      'das28.pga': 'mm', 'das28.crp': 'mg/L or mg/dL', 'das28.esr': 'mm/h',
      'psa-hizi.onceki_deger': 'ng/mL', 'psa-hizi.son_deger': 'ng/mL',
      'sakatlik-gunlugu.dk_7gun': 'min', 'sakatlik-gunlugu.dk_onceki': 'min',
      // the tools of this country's own (./araclar/)
      'us-bmi.boy_ft': 'ft', 'us-bmi.boy_in': 'in', 'us-bmi.agirlik_lb': 'lb',
      'us-egfr-ckd-epi-2021.kreatinin': 'mg/dL',
      'us-blood-sugar-ranges.a1c': '%', 'us-blood-sugar-ranges.glukoz': 'mg/dL',
    })
    // no tool writes an amount of a medicine: weight-based dose arithmetic is off
    for (const x of a.araclar) assert.notEqual(paketinTanimi(a, x)?.dozYazar, true, x.anahtar)
    assert.deepEqual({ ...US_BIRIMLER }, BIRIMLER)
    assert.deepEqual(US_ARAYUZ.formMetinleri![D]!.birim, { cm: 'cm', in: 'in', kg: 'kg', lb: 'lb', C: '°C', F: '°F' })
  })

  it('what the audit could NOT settle stays marked in the pack\'s own files: the lawyer\'s questions and the clinical lead\'s', () => {
    const ayarlar = kaynakOku(join(__dirname, 'ayarlar.ts')), temel = kaynakOku(join(__dirname, 'temel.ts'))
    assert.match(ayarlar, /MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE/)
    assert.match(ayarlar, /That is\s+\*?\s*not a person of the country confirming it/)
    assert.match(temel, /One number cannot be right in every state: FOR A LAWYER/)
    assert.match(temel, /FOR A LOCAL CLINICAL LEAD \(audit of 2026-10-09\)/)
    assert.equal(US_PAKETI.ulusalKimlik?.ad, 'Patient identifier', 'this country has no national patient number: the label names none')
    assert.deepEqual([...u.hastaDilleri], ['en'], 'a second patient language (Spanish) is the owner\'s decision and is not half-built')
  })
})
