/**
 * NOTYA-ULKE-EN-01 — Australia (`au`): the pack's own tests. The tests every English-speaking pack runs on itself
 * (countries/_dil/en/testing/paketSinamasi.ts), with what is Australia's: Australian spelling (the British base, with
 * "program"), SI units, several time zones, the tools it keeps as slots, and the words of the other English-speaking
 * countries that must not show here.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { ingilizcePaketSinamasi, kaynakOku } from '../_dil/en/testing/paketSinamasi'
import { enYaz } from '../_dil/en/varyant'
import { AU_ARAYUZ } from './arayuz'
import { AU_GIRDI } from './ayarlar'
import derleme from './derleme.mjs'
import { AU_PAKETI } from './index'
import { AU_KLINIK } from './klinik'
import { AU_SIZINTI_TERIMLERI } from './sizintiTerimleri'

const D = 'en-AU'

ingilizcePaketSinamasi({
  paket: AU_PAKETI,
  arayuz: AU_ARAYUZ,
  klinik: AU_KLINIK,
  bicim: D,
  ayarlarKaynagi: kaynakOku(join(__dirname, 'ayarlar.ts')),
  // United Kingdom, United States, Canada, New Zealand: their systems, identifiers, currencies, names, usage
  yabanci: /\b(NHS|NHI|GBP|USD|CAD|NZD|United Kingdom|United States|Canada|Canadian|provincial|Quebec|New Zealand|HIPAA|Medicaid|health card|Anaesthetics|Anesthesiology|Pulmonology|Respirology|Physical therapist|attending physician|staff physician|consultant)\b|£/,
  kapaliAraclar: ['esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi'],
  birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' },
  labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L' },
  kidemliHekim: 'specialist',
  // a range reserved for fiction where this job is certain of one; otherwise a shape that is no number (see ./ayarlar.ts)
  ornekTelefon: /^\+61 491 570 (006|110|15[6-9])$/,
})

describe('au: what is Australia\'s', () => {
  it('code au, served at /au; day first; week from Monday; 12-hour clock; SI units; Australian dollars', () => {
    assert.equal(AU_PAKETI.kod, 'au')
    assert.equal(AU_PAKETI.yolOnEki, '/au')
    assert.equal(derleme.yolOnEki, '/au')
    assert.equal(derleme.saatDilimi, AU_PAKETI.saatDilimi)
    assert.equal(AU_PAKETI.bicim.tarihDeseni, 'DD/MM/YYYY')
    assert.equal(AU_PAKETI.bicim.haftaBasi, 1)
    assert.equal(AU_PAKETI.uygulama!.saatBicimi, 12)
    assert.equal(AU_PAKETI.paraBirimi.kod, 'AUD')
    assert.equal(AU_ARAYUZ.randevuMetinleri![D]!.form.tarihOrnek, 'DD/MM/YYYY')
  })

  it('several time zones: the default is one of them, an account is asked, and the calendar names no single zone', () => {
    const dilimler = [...AU_PAKETI.uygulama!.saatDilimleri]
    assert.deepEqual(dilimler, ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Darwin', 'Australia/Perth', 'Australia/Hobart'])
    assert.ok(dilimler.includes(AU_PAKETI.saatDilimi))
    assert.equal(AU_ARAYUZ.metinler[D]!.ayarlar.saatDilimi, 'Time zone')
    assert.equal(AU_ARAYUZ.randevuMetinleri![D]!.duzen.saatDilimi, 'Times are shown in the time zone set for your account.')
  })

  it('Australian spelling on the screens — the British base, with "program" — and the country\'s own names for its specialties', () => {
    const ad = (rol: string) => AU_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad[D]
    assert.equal(ad('paediatric-surgery'), 'Paediatric surgery')
    assert.equal(ad('anaesthesia'), 'Anaesthesia')
    assert.equal(ad('family-medicine'), 'General practice')
    assert.equal(ad('internal-medicine'), 'General medicine')
    assert.equal(ad('respiratory-medicine'), 'Respiratory and sleep medicine')
    assert.equal(AU_ARAYUZ.randevuMetinleri![D]!.durum.iptal, 'Cancelled')
    assert.equal(enYaz('a rehabilitation programme', D), 'a rehabilitation program')
    assert.equal(enYaz('a rehabilitation programme', 'en-GB'), 'a rehabilitation programme')
    assert.match(AU_KLINIK.notTalimati(D, 'general') ?? '', /You are an experienced specialist\.[\s\S]*in Australian spelling/)
  })

  it('the patient identifier is labelled "Medicare card number", the national data element\'s name; the guardian age is the pack\'s setting in both halves', () => {
    assert.equal(AU_PAKETI.ulusalKimlik?.ad, 'Medicare card number')
    assert.equal(AU_GIRDI.sozler.kimlikEtiketi, 'Medicare card number')
    assert.equal(AU_ARAYUZ.metinler[D]!.yeniHasta.ulusalKimlik, 'Medicare card number')
    assert.equal(AU_PAKETI.uygulama!.veliYasi, AU_GIRDI.veliYasi)
    assert.equal(AU_PAKETI.uygulama!.veliYasi, 16)
  })

  it('prostate-specific antigen is written in µg/L; the consent stamp is Australia\'s own draft', () => {
    const a = AU_ARAYUZ.araclar!
    assert.equal(a.birimler['ng/mL'][D], 'µg/L')
    assert.equal(a.birimler['ng/mL/yil'][D], 'µg/L per year')
    assert.equal(AU_KLINIK.riza.surum, 'au-draft-2026-10-09')
    assert.equal(AU_ARAYUZ.metinler[D]!.muayene.riza, AU_GIRDI.sozler.kayitRizasi)
  })
})

/**
 * NOTYA-ULKE-AUDIT-AU — what the audit of 2026-10-09 checked against Australia's own sources and holds here.
 * The source of each rule is beside it in docs/COUNTRY-AUDIT-AUSTRALIA.md.
 */
describe('au: held by the audit against Australian sources', () => {
  const ad = (rol: string) => AU_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad[D]

  it('the specialties carry the wording of the Medical Board of Australia\'s list of specialties and fields of specialty practice', () => {
    const resmi: Record<string, string> = {
      'emergency-medicine': 'Emergency medicine', 'family-medicine': 'General practice', anaesthesia: 'Anaesthesia', neurosurgery: 'Neurosurgery',
      'paediatric-surgery': 'Paediatric surgery', 'internal-medicine': 'General medicine', dermatology: 'Dermatology', endocrinology: 'Endocrinology',
      'infectious-diseases': 'Infectious diseases', gastroenterology: 'Gastroenterology and hepatology', 'general-surgery': 'General surgery',
      'respiratory-medicine': 'Respiratory and sleep medicine', ophthalmology: 'Ophthalmology', 'obstetrics-gynaecology': 'Obstetrics and gynaecology',
      cardiology: 'Cardiology', otolaryngology: 'Otolaryngology – head and neck surgery', nephrology: 'Nephrology', neurology: 'Neurology',
      orthopaedics: 'Orthopaedic surgery', paediatrics: 'Paediatrics and child health', 'plastic-surgery': 'Plastic surgery', psychiatry: 'Psychiatry',
      radiology: 'Radiology', rheumatology: 'Rheumatology', urology: 'Urology', 'sports-medicine': 'Sport and exercise medicine',
      'rehabilitation-medicine': 'Rehabilitation medicine',
    }
    for (const [rol, isim] of Object.entries(resmi)) assert.equal(ad(rol), isim, rol)
    // the three doctor roles the list divides differently and no local clinician has mapped yet: still the set's base names
    assert.deepEqual(['thoracic-surgery', 'cardiovascular-surgery', 'oncology'].map(ad), ['Thoracic surgery', 'Cardiac and vascular surgery', 'Oncology'])
  })

  it('no role name is a title ("surgeon" is protected by law), and no name of another country\'s usage is shown', () => {
    for (const r of AU_ARAYUZ.roller) {
      assert.doesNotMatch(r.ad[D] ?? '', /surgeon/i, r.anahtar)
      assert.doesNotMatch(r.ad[D] ?? '', /Family medicine|Internal medicine|Pulmonology|\(ENT\)|Aesthetic medicine/, r.anahtar)
    }
  })

  it('the allied professions are named as the profession; the senior-doctor word is "specialist"', () => {
    assert.deepEqual(['physiotherapy', 'clinical-psychology', 'dietetics', 'occupational-therapy', 'audiology'].map(ad), ['Physiotherapist', 'Clinical psychologist', 'Dietitian', 'Occupational therapist', 'Audiologist'])
    assert.equal(AU_GIRDI.kidemliHekim, 'specialist')
  })

  it('numbers and money: a point for decimals, a comma for thousands, dollars with two decimal places', () => {
    assert.deepEqual({ o: AU_PAKETI.bicim.ondalikAyraci, b: AU_PAKETI.bicim.binlikAyraci }, { o: '.', b: ',' })
    assert.deepEqual(AU_PAKETI.paraBirimi, { kod: 'AUD', simge: '$', ondalikHane: 2 })
    assert.equal(AU_GIRDI.acilis.aylikTutarKalibi, '$% a month')
  })

  it('the emergency number is 000, as it is dialled; a mobile is +61 and nine digits beginning with 4, in the blocks the Style Manual gives', () => {
    assert.equal(AU_PAKETI.uygulama!.portal!.acilNumara, '000')
    assert.equal(AU_PAKETI.telefon.ulkeOnEki, '+61')
    assert.equal(AU_PAKETI.telefon.ulusalHane, 9)
    assert.match(AU_PAKETI.telefon.ornek, /^\+61 4\d{2} \d{3} \d{3}$/)
    assert.equal(AU_GIRDI.acilis.telefonOrnegi, AU_PAKETI.telefon.ornek)
    for (const yazim of ['0491 570 006', '+61 491 570 006', '61491570006', '0061 491 570 006', '(0491) 570-006']) assert.equal(AU_PAKETI.telefon.cepGecerliMi(yazim), true, yazim)
    for (const yazim of ['02 5550 1234', '491 570 00', '+61 391 570 006', '000', '']) assert.equal(AU_PAKETI.telefon.cepGecerliMi(yazim), false, yazim)
  })

  it('the time zones are the three standard times with and without daylight saving, each a zone the platform knows', () => {
    const ofset = (dilim: string, an: string) => new Intl.DateTimeFormat('en-AU', { timeZone: dilim, timeZoneName: 'longOffset' }).formatToParts(new Date(an)).find((p) => p.type === 'timeZoneName')?.value
    const kis = '2026-07-01T00:00:00Z', yaz = '2027-01-01T00:00:00Z'
    // [in July, in January]: daylight saving in New South Wales, Victoria, Tasmania and South Australia; none in Queensland, the Northern Territory and Western Australia
    const beklenen: Record<string, [string, string]> = {
      'Australia/Sydney': ['GMT+10:00', 'GMT+11:00'], 'Australia/Melbourne': ['GMT+10:00', 'GMT+11:00'], 'Australia/Hobart': ['GMT+10:00', 'GMT+11:00'],
      'Australia/Brisbane': ['GMT+10:00', 'GMT+10:00'], 'Australia/Adelaide': ['GMT+09:30', 'GMT+10:30'], 'Australia/Darwin': ['GMT+09:30', 'GMT+09:30'],
      'Australia/Perth': ['GMT+08:00', 'GMT+08:00'],
    }
    assert.deepEqual([...AU_PAKETI.uygulama!.saatDilimleri].sort(), Object.keys(beklenen).sort())
    for (const [dilim, [k, y]] of Object.entries(beklenen)) assert.deepEqual([ofset(dilim, kis), ofset(dilim, yaz)], [k, y], dilim)
  })

  it('a time of day reads the way the Australian Government Style Manual writes it: "2:30 pm"', () => {
    const saat = new Intl.DateTimeFormat(AU_PAKETI.bicim.yerel, { timeZone: 'UTC', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(Date.UTC(2000, 0, 1, 14, 30)))
    assert.match(saat, /^2:30[   ]pm$/)
  })

  it('laboratory values are typed in the pack\'s stated units; the tools that classify by the albumin-to-creatinine ratio or by another country\'s scale stay off', () => {
    assert.deepEqual(AU_GIRDI.araclar.labBirimleri, { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L' })
    for (const kapali of ['esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi']) assert.ok(AU_GIRDI.araclar.kapali[kapali], kapali)
  })

  it('no text asks for an identifier this product must not hold: no healthcare identifier, no tax file number', () => {
    const tum = JSON.stringify({ a: AU_ARAYUZ.metinler, p: AU_ARAYUZ.portalMetinleri, f: AU_ARAYUZ.formMetinleri, k: AU_KLINIK.hastaFormu })
    assert.doesNotMatch(tum, /healthcare identifier|\bIHI\b|tax file number|\bTFN\b/i)
  })

  it('the leak list hunts the regulator\'s name in both of its spellings', () => {
    const terimler = AU_SIZINTI_TERIMLERI.map((t) => t.terim)
    assert.ok(terimler.includes('AHPRA') && terimler.includes('Ahpra'))
  })
})
