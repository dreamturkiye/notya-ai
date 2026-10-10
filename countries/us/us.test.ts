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
  ornekTelefon: /^\+1 \d{3} 555 01\d{2}$/,
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
    // NO RANGE: the range either side is a number the country may state, and this pack states none (NOTYA-ULKE-ARAC-DUZELTME-01, fault 11)
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
    // internal medicine had the kidney tool and nothing else: with no tool whose result can be kept, it has no follow-up list
    assert.ok(!a.araclar.find((x) => x.anahtar === 'takip-paneli')!.roller!.includes('internal-medicine'))
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
