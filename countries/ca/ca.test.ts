/**
 * NOTYA-ULKE-EN-01 — Canada (`ca`): the pack's own tests. The tests every English-speaking pack runs on itself
 * (countries/_dil/en/testing/paketSinamasi.ts), with what is Canada's: Canadian spelling (a mix stated word by word),
 * SI units, year-first dates, several time zones, ENGLISH ONLY (French is absent and waits on the owner), the tools it
 * keeps as slots, and the words of the other English-speaking countries that must not show here.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { ingilizcePaketSinamasi, kaynakOku } from '../_dil/en/testing/paketSinamasi'
import { tumMetinler } from '../_dil/en/testing/yazimDenetimi'
import { enYaz } from '../_dil/en/varyant'
import { CA_ARAYUZ } from './arayuz'
import { CA_GIRDI } from './ayarlar'
import derleme from './derleme.mjs'
import { CA_PAKETI } from './index'
import { CA_KLINIK } from './klinik'

const D = 'en-CA'

ingilizcePaketSinamasi({
  paket: CA_PAKETI,
  arayuz: CA_ARAYUZ,
  klinik: CA_KLINIK,
  bicim: D,
  ayarlarKaynagi: kaynakOku(join(__dirname, 'ayarlar.ts')),
  // United Kingdom, United States, Australia, New Zealand: their systems, identifiers, currencies, names, usage
  yabanci: /\b(NHS|NHI|GBP|USD|AUD|NZD|United Kingdom|United States|Australia|Australian|New Zealand|HIPAA|Medicaid|Medicare|General practice|Anaesthetics|Pulmonology|Respiratory and sleep medicine|Physical therapist|attending physician|consultant)\b|£/,
  kapaliAraclar: ['esi-triyaj', 'kdigo-evre', 'kdigo-serit'],
  birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' },
  labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L' },
  kidemliHekim: 'staff physician',
  // a range reserved for fiction where this job is certain of one; otherwise a shape that is no number (see ./ayarlar.ts)
  ornekTelefon: /^\d{3}-555-01\d{2}$/,
})

describe('ca: what is Canada\'s', () => {
  it('code ca, served at /ca; year first; week from Sunday; 12-hour clock; SI units; Canadian dollars', () => {
    assert.equal(CA_PAKETI.kod, 'ca')
    assert.equal(CA_PAKETI.yolOnEki, '/ca')
    assert.equal(derleme.yolOnEki, '/ca')
    assert.equal(derleme.saatDilimi, CA_PAKETI.saatDilimi)
    assert.equal(CA_PAKETI.bicim.tarihDeseni, 'YYYY-MM-DD')
    assert.equal(CA_PAKETI.bicim.haftaBasi, 7)
    assert.equal(CA_PAKETI.uygulama!.saatBicimi, 12)
    assert.equal(CA_PAKETI.paraBirimi.kod, 'CAD')
    assert.equal(CA_ARAYUZ.randevuMetinleri![D]!.form.tarihOrnek, 'YYYY-MM-DD')
  })

  it('several time zones: the default is one of them, an account is asked, and the calendar names no single zone', () => {
    const dilimler = [...CA_PAKETI.uygulama!.saatDilimleri]
    assert.deepEqual(dilimler, ['America/Toronto', 'America/St_Johns', 'America/Halifax', 'America/Winnipeg', 'America/Regina', 'America/Edmonton', 'America/Vancouver', 'America/Whitehorse'])
    assert.ok(dilimler.includes(CA_PAKETI.saatDilimi))
    assert.equal(CA_ARAYUZ.metinler[D]!.ayarlar.saatDilimi, 'Time zone')
    assert.equal(CA_ARAYUZ.randevuMetinleri![D]!.duzen.saatDilimi, 'Times are shown in the time zone set for your account.')
  })

  it('Canadian spelling is a mix, stated word by word: colour and centre as in Britain, pediatric and organize as in the United States', () => {
    assert.equal(enYaz('the colour of the centre', D), 'the colour of the centre')
    assert.equal(enYaz('paediatric', D), 'pediatric')
    assert.equal(enYaz('organise', D), 'organize')
    assert.equal(CA_ARAYUZ.randevuMetinleri![D]!.durum.iptal, 'Cancelled')
    const ad = (rol: string) => CA_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad[D]
    assert.equal(ad('paediatrics'), 'Pediatrics')
    assert.equal(ad('anaesthesia'), 'Anesthesiology')
    assert.equal(ad('respiratory-medicine'), 'Respirology')
    assert.equal(ad('family-medicine'), 'Family medicine')
    assert.equal(ad('physiotherapy'), 'Physiotherapist')
    assert.match(CA_KLINIK.notTalimati(D, 'general') ?? '', /You are an experienced staff physician\.[\s\S]*in Canadian spelling/)
  })

  it('ENGLISH ONLY: one language form, nothing in French, and the country\'s file says French waits on the owner', () => {
    assert.deepEqual([...CA_PAKETI.diller], [D])
    assert.deepEqual([...CA_PAKETI.uygulama!.hastaDilleri], ['en'])
    assert.deepEqual(Object.keys(CA_KLINIK.konusma.zorlamaDilKodlari), [D])
    assert.match(kaynakOku(join(__dirname, 'ayarlar.ts')), /ENGLISH ONLY\. FRENCH IS ABSENT — WAITING ON KAAN/)
    const hepsi = tumMetinler({ paket: CA_PAKETI.metinler, arayuz: { ...CA_ARAYUZ, asistan: undefined }, form: CA_KLINIK.hastaFormu })
    for (const x of hepsi) assert.doesNotMatch(x.metin, /[àâçéèêëîïôùûüœ]|\b(le|la|les|des|une|vous|votre|pour|avec|santé)\b/i, `${x.yer}: "${x.metin.slice(0, 60)}"`)
  })

  it('the patient identifier is labelled "Health card number"; the guardian age is the pack\'s setting in both halves', () => {
    assert.equal(CA_PAKETI.ulusalKimlik?.ad, 'Health card number')
    assert.equal(CA_ARAYUZ.metinler[D]!.yeniHasta.ulusalKimlik, 'Health card number')
    assert.equal(CA_PAKETI.uygulama!.veliYasi, CA_GIRDI.veliYasi)
    assert.equal(CA_PAKETI.uygulama!.veliYasi, 16)
  })

  it('prostate-specific antigen is written in µg/L; the report outline is on; the consent stamp is Canada\'s own draft', () => {
    const a = CA_ARAYUZ.araclar!
    assert.equal(a.birimler['ng/mL'][D], 'µg/L')
    assert.equal(a.birimler['ng/mL/yil'][D], 'µg/L per year')
    assert.ok(a.araclar.some((x) => x.anahtar === 'rapor-taslagi'))
    assert.equal(CA_KLINIK.riza.surum, 'ca-draft-2026-10-09')
    assert.equal(CA_ARAYUZ.metinler[D]!.muayene.riza, CA_GIRDI.sozler.kayitRizasi)
  })
})

/**
 * AUDIT 2026-10-09 (docs/COUNTRY-AUDIT-CANADA.md): what the audit against Canada's own standards changed, held here so
 * that it does not drift back. Each expectation names its source in that document. None of this was read by a person
 * of the country; it is what a machine could confirm from official pages.
 */
describe('ca: the audit against Canada\'s standards (2026-10-09)', () => {
  const ad = (rol: string) => CA_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad[D]

  it('ROLE NAMES as the Royal College and the College of Family Physicians name the discipline, in sentence case', () => {
    // the names of the national list that this pack's roles map onto one to one
    const beklenen: Record<string, string> = {
      'emergency-medicine': 'Emergency medicine',
      'family-medicine': 'Family medicine',
      anaesthesia: 'Anesthesiology',
      neurosurgery: 'Neurosurgery',
      'paediatric-surgery': 'Pediatric surgery',
      'internal-medicine': 'Internal medicine',
      dermatology: 'Dermatology',
      endocrinology: 'Endocrinology and metabolism',
      'infectious-diseases': 'Infectious diseases',
      gastroenterology: 'Gastroenterology',
      'general-surgery': 'General surgery',
      'thoracic-surgery': 'Thoracic surgery',
      'respiratory-medicine': 'Respirology',
      ophthalmology: 'Ophthalmology',
      'obstetrics-gynaecology': 'Obstetrics and gynecology',
      cardiology: 'Cardiology',
      otolaryngology: 'Otolaryngology – head and neck surgery',
      nephrology: 'Nephrology',
      neurology: 'Neurology',
      orthopaedics: 'Orthopedic surgery',
      paediatrics: 'Pediatrics',
      'plastic-surgery': 'Plastic surgery',
      psychiatry: 'Psychiatry',
      radiology: 'Diagnostic radiology',
      rheumatology: 'Rheumatology',
      urology: 'Urology',
      'sports-medicine': 'Sport and exercise medicine',
      'rehabilitation-medicine': 'Physical medicine and rehabilitation',
    }
    for (const [rol, isim] of Object.entries(beklenen)) assert.equal(ad(rol), isim, rol)
  })

  it('INTERNAL MEDICINE is the specialty; "general internal medicine" is a subspecialty there and names no role', () => {
    assert.equal(ad('internal-medicine'), 'Internal medicine')
    assert.ok(!('internal-medicine' in CA_GIRDI.rolAdlari))
    for (const r of CA_ARAYUZ.roller) assert.doesNotMatch(r.ad[D] ?? '', /general internal medicine/i, r.anahtar)
  })

  it('THE PATIENT IDENTIFIER does not say "provincial" (the territories issue health cards too), is free text, and is never a Social Insurance Number', () => {
    assert.equal(CA_GIRDI.sozler.kimlikEtiketi, 'Health card number')
    assert.doesNotMatch(CA_PAKETI.ulusalKimlik?.ad ?? '', /provinc/i)
    assert.equal(CA_PAKETI.ulusalKimlik?.hane, 0)
    assert.equal(CA_PAKETI.uygulama!.kimlikNumarasi.dogrula, false)
    // a health number is not all digits everywhere (a version code, letters): any non-empty text is taken
    for (const ornek of ['1234567890', '1234-567-890-AB', 'ABCD 1234 5678']) assert.equal(CA_PAKETI.ulusalKimlik!.gecerliMi(ornek), true, ornek)
    const hepsi = tumMetinler({ paket: CA_PAKETI.metinler, arayuz: { ...CA_ARAYUZ, asistan: undefined }, form: CA_KLINIK.hastaFormu })
    for (const x of hepsi) assert.doesNotMatch(x.metin, /social insurance|\bSIN\b/i, `${x.yer}: "${x.metin.slice(0, 60)}"`)
  })

  it('TIME ZONES: every zone is one the platform knows; Yukon and Saskatchewan, which keep one time all year, are offered', () => {
    const dilimler = [...CA_PAKETI.uygulama!.saatDilimleri]
    assert.equal(new Set(dilimler).size, dilimler.length)
    for (const z of dilimler) assert.doesNotThrow(() => new Intl.DateTimeFormat('en-CA', { timeZone: z }), z)
    assert.ok(dilimler.includes('America/Whitehorse'))
    assert.ok(dilimler.includes('America/Regina'))
    const fark = (z: string, an: string) => new Intl.DateTimeFormat('en-CA', { timeZone: z, timeZoneName: 'longOffset' }).formatToParts(new Date(an)).find((p) => p.type === 'timeZoneName')?.value
    // one time all year: the same offset in January and in July (2025, before any change of 2026)
    for (const z of ['America/Whitehorse', 'America/Regina']) assert.equal(fark(z, '2025-01-15T18:00:00Z'), fark(z, '2025-07-15T18:00:00Z'), z)
    assert.equal(fark('America/Whitehorse', '2025-01-15T18:00:00Z'), 'GMT-07:00')
    // and no other entry gives Yukon's time in both seasons, which is why it has an entry of its own
    for (const z of dilimler.filter((x) => x !== 'America/Whitehorse')) {
      assert.ok(fark(z, '2025-01-15T18:00:00Z') !== 'GMT-07:00' || fark(z, '2025-07-15T18:00:00Z') !== 'GMT-07:00', z)
    }
  })

  it('THE EXAMPLE PHONE NUMBER is written with hyphens, as a number is written in Canada, and the form accepts every common spelling of it', () => {
    assert.equal(CA_PAKETI.telefon.ornek, '613-555-0123')
    assert.equal(CA_GIRDI.acilis.telefonOrnegi, CA_PAKETI.telefon.ornek)
    for (const yazim of ['613-555-0123', '(613) 555-0123', '613 555 0123', '613.555.0123', '+1 613 555 0123', '1-613-555-0123', '6135550123']) assert.equal(CA_PAKETI.telefon.cepGecerliMi(yazim), true, yazim)
    for (const yazim of ['555-0123', '013-555-0123', '613-155-0123', '+44 7700 900123', 'six one three']) assert.equal(CA_PAKETI.telefon.cepGecerliMi(yazim), false, yazim)
  })

  it('DATES, CLOCK, NUMBERS, MONEY as the federal standards write them: year-month-day with hyphens; a point for decimals; dollars with two decimals', () => {
    assert.deepEqual(CA_PAKETI.bicim, { yerel: 'en-CA', tarihDeseni: 'YYYY-MM-DD', ondalikAyraci: '.', binlikAyraci: ',', haftaBasi: 7 })
    assert.equal(CA_GIRDI.sozler.tarihOrnegi, CA_PAKETI.bicim.tarihDeseni)
    assert.deepEqual(CA_PAKETI.paraBirimi, { kod: 'CAD', simge: '$', ondalikHane: 2 })
    // the 12-hour clock is written "2:30 p.m." by the platform's data for this locale, which is the Translation Bureau's form
    assert.match(new Intl.DateTimeFormat(CA_PAKETI.bicim.yerel, { timeZone: 'UTC', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(Date.UTC(2000, 0, 1, 14, 30))), /^2:30\sp\.m\.$/)
  })

  it('UNITS: SI on every screen (kilograms, centimetres, degrees Celsius) and the SI laboratory units the provinces report in', () => {
    assert.deepEqual(CA_PAKETI.uygulama!.birimler, { agirlik: 'kg', boy: 'cm', sicaklik: 'C' })
    assert.deepEqual(CA_GIRDI.araclar.labBirimleri, { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L' })
  })

  it('THE EMERGENCY NUMBER is 911, the triage record of another country\'s scale stays a slot, and nothing is offered in French yet', () => {
    assert.equal(CA_PAKETI.uygulama!.portal?.acilNumara, '911')
    assert.ok('esi-triyaj' in CA_GIRDI.araclar.kapali)
    assert.ok(!CA_ARAYUZ.araclar!.araclar.some((x) => x.anahtar === 'esi-triyaj'))
    assert.deepEqual([...CA_PAKETI.uygulama!.hastaDilleri], ['en'])
  })
})
