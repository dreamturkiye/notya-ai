/**
 * NOTYA-ULKE-EN-01 — United States (`us`): the pack's own tests. The tests every English-speaking pack runs on itself
 * (countries/_dil/en/testing/paketSinamasi.ts), with what is the United States': American spelling, CONVENTIONAL
 * UNITS (pounds, inches, degrees Fahrenheit; mg/dL, g/dL, mg/g), several time zones, a neutral patient identifier
 * that is never a Social Security number, and the words of the other English-speaking countries that must not show.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { INC_CM, LAB_BIRIMLERI, type BirimOrtami } from '@/lib/ulke/araclar/birimler'
import { girdiyiCoz } from '@/lib/ulke/araclar/girdi'
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import { sayiMetni, type Yazici } from '@/lib/ulke/araclar/paket'
import { sayiBirimi } from '@/lib/ulke/intake/sorular'
import { ingilizcePaketSinamasi, kaynakOku } from '../_dil/en/testing/paketSinamasi'
import { tumMetinler } from '../_dil/en/testing/yazimDenetimi'
import { US_ARAYUZ } from './arayuz'
import { US_GIRDI } from './ayarlar'
import derleme from './derleme.mjs'
import { US_PAKETI } from './index'
import { US_KLINIK } from './klinik'

const D = 'en-US'
const BIRIMLER = { agirlik: 'lb', boy: 'in', sicaklik: 'F' } as const
const LAB = { albuminKreatinin: 'mg/g', hemoglobin: 'g/dL', kreatinin: 'mg/dL', glukoz: 'mg/dL', kolesterol: 'mg/dL' }

ingilizcePaketSinamasi({
  paket: US_PAKETI,
  arayuz: US_ARAYUZ,
  klinik: US_KLINIK,
  bicim: D,
  ayarlarKaynagi: kaynakOku(join(__dirname, 'ayarlar.ts')),
  // United Kingdom, Canada, Australia, New Zealand: their systems, identifiers, currencies, names, usage
  yabanci: /\b(NHS|NHI|GBP|CAD|AUD|NZD|United Kingdom|Canada|Canadian|provincial|Quebec|Australia|Australian|New Zealand|Medicare|health card|General practice|Anaesthetics|Respirology|staff physician|consultant)\b|£/,
  kapaliAraclar: ['doz-hesabi'],
  birimler: BIRIMLER,
  labBirimleri: LAB,
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
    assert.deepEqual(dilimler, ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'])
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
    assert.equal(ad('respiratory-medicine'), 'Pulmonology')
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
  const o: BirimOrtami = { birimler: US_PAKETI.uygulama!.birimler, lab: a.labBirimleri }
  const yazici: Yazici = { sayi: (deger, ondalik) => deger.toFixed(ondalik), tarih: (iso) => iso, birim: (kod) => a.birimler[kod]?.[D] ?? `?${kod}?` }

  it('pounds, inches, degrees Fahrenheit; and the laboratory units are the ones the kit\'s arithmetic is written in', () => {
    assert.deepEqual({ ...US_PAKETI.uygulama!.birimler }, BIRIMLER)
    for (const [olcu, birim] of Object.entries(LAB)) assert.equal(LAB_BIRIMLERI[olcu as keyof typeof LAB_BIRIMLERI].birimler[birim], 1, `${olcu} in ${birim} needs no conversion`)
  })

  it('expected height: heights typed in inches, the result written in inches — 64 in and 70 in give 69.6 in for a boy', () => {
    const t = kitAraci('hedef-boy')!
    const g = girdiyiCoz(t.alanlar, { cinsiyet: 'erkek', anne: '64', baba: '70' }, o)
    assert.ok(Math.abs((g.anne as number) - 64 * INC_CM) < 1e-9 && Math.abs((g.baba as number) - 70 * INC_CM) < 1e-9, 'inches become centimetres with the exact factor')
    const sonuc = t.hesapla(g, { bugun: '2026-10-09' } as never)
    assert.equal(sonuc.tamam, true)
    // by hand: 64 in = 162.56 cm → 162.6; 70 in = 177.8 cm; (177.8 + 162.6 + 13) / 2 = 176.7 cm = 69.57 in
    const hedef = sonuc.sayilar.find((x) => x.anahtar === 'hedef')!
    assert.equal(hedef.deger, 176.7)
    assert.equal(sayiMetni(hedef, a.metinler[D]!, yazici, o), '69.6 in')
    // the same heights typed as if they were centimetres are refused, not silently computed: 64 "cm" is out of range
    assert.equal(t.hesapla(girdiyiCoz(t.alanlar, { cinsiyet: 'erkek', anne: '162.56', baba: '177.8' }, o), { bugun: '2026-10-09' } as never).tamam, false)
  })

  it('weight-based dose arithmetic is NOT offered while weight is measured in pounds', () => {
    assert.ok(!a.araclar.some((x) => x.anahtar === 'doz-hesabi'))
    const yuva = a.yuvalar.find((y) => y.anahtar === 'doz-hesabi')
    assert.match(yuva?.eksik ?? '', /UNIT SAFETY/)
    assert.ok(!('lb' in a.birimler) || a.birimler.lb[D], 'no tool shows a weight; were one switched on, pounds would need a name')
  })

  it('DAS28: the C-reactive protein field says it takes mg/L and how to get there from mg/dL', () => {
    const das = a.araclar.find((x) => x.anahtar === 'das28')!
    assert.equal(das.metin.alanlar.crp[D], 'C-reactive protein (in mg/L; multiply a value in mg/dL by 10)')
    assert.equal(kitAraci('das28')!.alanlar.find((x) => x.anahtar === 'crp')?.birim, 'mg/L')
  })

  it('the tools the other English-speaking packs keep off for their units or scales are on here: KDIGO in mg/g, ESI, the report outline', () => {
    for (const k of ['kdigo-evre', 'kdigo-serit', 'esi-triyaj', 'rapor-taslagi']) assert.ok(a.araclar.some((x) => x.anahtar === k), k)
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
