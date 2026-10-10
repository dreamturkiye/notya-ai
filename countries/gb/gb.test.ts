/**
 * NOTYA-ULKE-EN-01 — United Kingdom (`gb`): the pack's own tests. The tests every English-speaking pack runs on itself
 * (countries/_dil/en/testing/paketSinamasi.ts), with what is the United Kingdom's: British spelling, SI units, the
 * tools it keeps as slots, and the words of the other English-speaking countries that must not show here.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { ingilizcePaketSinamasi, kaynakOku } from '../_dil/en/testing/paketSinamasi'
import { GB_ARAYUZ } from './arayuz'
import { GB_GIRDI, GB_KIMLIK_ETIKETI } from './ayarlar'
import derleme from './derleme.mjs'
import { GB_PAKETI } from './index'
import { GB_KLINIK } from './klinik'

ingilizcePaketSinamasi({
  paket: GB_PAKETI,
  arayuz: GB_ARAYUZ,
  klinik: GB_KLINIK,
  bicim: 'en-GB',
  ayarlarKaynagi: kaynakOku(join(__dirname, 'ayarlar.ts')),
  // United States, Canada, Australia, New Zealand: their systems, identifiers, currencies, names, usage
  yabanci: /\b(Medicare|Medicaid|HIPAA|United States|U\.S\.|USD|CAD|AUD|NZD|Canada|Canadian|provincial|Australia|Australian|New Zealand|NHI|health card|ZIP|attending physician|Anesthesiology|Pulmonology|Respirology|Physical therapist)\b|\$/,
  kapaliAraclar: ['esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi'],
  birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' },
  labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L' },
  kidemliHekim: 'consultant',
  // a range reserved for fiction where this job is certain of one; otherwise a shape that is no number (see ./ayarlar.ts)
  ornekTelefon: /^\+44 7700 900\d{3}$/,
})

describe('gb: what is the United Kingdom\'s', () => {
  it('code gb, served at /uk; one time zone; day first; SI units; pounds sterling', () => {
    assert.equal(GB_PAKETI.kod, 'gb')
    assert.equal(GB_PAKETI.yolOnEki, '/uk')
    assert.equal(derleme.yolOnEki, '/uk')
    assert.equal(derleme.saatDilimi, GB_PAKETI.saatDilimi)
    assert.deepEqual([...GB_PAKETI.uygulama!.saatDilimleri], ['Europe/London'])
    assert.equal(GB_PAKETI.bicim.tarihDeseni, 'DD/MM/YYYY')
    assert.equal(GB_PAKETI.paraBirimi.kod, 'GBP')
    assert.equal(GB_ARAYUZ.metinler['en-GB']!.ayarlar.saatDilimi, undefined, 'one zone: no account is asked')
    assert.equal(GB_ARAYUZ.randevuMetinleri['en-GB']!.duzen.saatDilimi, 'All times are UK time.')
    assert.equal(GB_ARAYUZ.randevuMetinleri['en-GB']!.form.tarihOrnek, 'DD/MM/YYYY')
  })

  it('British spelling on the screens, and the country\'s own names for its specialties', () => {
    const ad = (rol: string) => GB_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad['en-GB']
    assert.equal(ad('paediatrics'), 'Paediatrics')
    assert.equal(ad('family-medicine'), 'General practice')
    assert.equal(ad('anaesthesia'), 'Anaesthetics')
    assert.equal(ad('orthopaedics'), 'Trauma and orthopaedic surgery')
    assert.equal(GB_ARAYUZ.randevuMetinleri['en-GB']!.durum.iptal, 'Cancelled')
    assert.match(GB_KLINIK.notTalimati('en-GB', 'general') ?? '', /You are an experienced consultant\.[\s\S]*in British spelling/)
  })

  it('the patient identifier names the identifiers of all four nations; the guardian age is the pack\'s setting in both halves', () => {
    assert.equal(GB_PAKETI.ulusalKimlik?.ad, GB_KIMLIK_ETIKETI)
    assert.equal(GB_GIRDI.sozler.kimlikEtiketi, GB_KIMLIK_ETIKETI)
    assert.equal(GB_ARAYUZ.metinler['en-GB']!.yeniHasta.ulusalKimlik, GB_KIMLIK_ETIKETI, 'the label on the patient form')
    for (const ad of ['NHS number', 'CHI', 'H&C']) assert.ok(GB_KIMLIK_ETIKETI.includes(ad), `${ad}: England and Wales, Scotland, Northern Ireland`)
    assert.equal(GB_PAKETI.uygulama!.kimlikNumarasi.dogrula, false, 'optional free text, never validated')
    assert.equal(GB_PAKETI.uygulama!.veliYasi, GB_GIRDI.veliYasi)
    assert.equal(GB_PAKETI.uygulama!.veliYasi, 16)
  })

  it('the recording-consent stamp is the United Kingdom\'s own draft', () => {
    assert.equal(GB_KLINIK.riza.surum, 'gb-draft-2026-10-09')
    assert.equal(GB_ARAYUZ.metinler['en-GB']!.muayene.riza, GB_GIRDI.sozler.kayitRizasi)
  })
})

/**
 * NOTYA-ULKE-DENETIM (audit of 2026-10-09, docs/COUNTRY-AUDIT-UNITED-KINGDOM.md): what the audit read on official
 * pages and the pack must keep. A test here holds a SETTING to the standard the audit found; it does not make the
 * setting verified by a person of the country.
 */
describe('gb: held to the standards sheet of the audit', () => {
  it('the specialty names are the regulator\'s where the audit found the pack differing', () => {
    const ad = (rol: string) => GB_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad['en-GB']
    // General Medical Council, list of specialties (link in ./ayarlar.ts)
    assert.equal(ad('internal-medicine'), 'General (internal) medicine')
    assert.equal(ad('endocrinology'), 'Endocrinology and diabetes mellitus')
    assert.equal(ad('otolaryngology'), 'Otolaryngology (ENT)')
    assert.equal(ad('orthopaedics'), 'Trauma and orthopaedic surgery')
    assert.equal(ad('nephrology'), 'Renal medicine')
    assert.equal(ad('radiology'), 'Clinical radiology')
    assert.equal(ad('respiratory-medicine'), 'Respiratory medicine')
    assert.equal(ad('sports-medicine'), 'Sport and exercise medicine')
    // the allied professions carry the titles the professions' regulator protects, where it protects one
    for (const [rol, unvan] of [['physiotherapy', 'Physiotherapist'], ['dietetics', 'Dietitian'], ['occupational-therapy', 'Occupational therapist'], ['clinical-psychology', 'Clinical psychologist']] as const) assert.equal(ad(rol), unvan)
    // the same names reach the instruction the model is given
    assert.match(GB_KLINIK.notTalimati('en-GB', 'orthopaedics') ?? '', /Trauma and orthopaedic surgery|trauma and orthopaedic surgery/)
  })

  it('day first with slashes, the 24-hour clock of a clinical record, the week from Monday, a point and a comma', () => {
    assert.deepEqual(GB_PAKETI.bicim, { yerel: 'en-GB', tarihDeseni: 'DD/MM/YYYY', ondalikAyraci: '.', binlikAyraci: ',', haftaBasi: 1 })
    assert.equal(GB_PAKETI.uygulama!.saatBicimi, 24)
    assert.equal(GB_GIRDI.sozler.tarihOrnegi, GB_PAKETI.bicim.tarihDeseni)
  })

  it('one time zone with summer time: an appointment keeps its wall-clock hour on both sides of the change', () => {
    assert.equal(GB_PAKETI.saatDilimi, 'Europe/London')
    const saat = (iso: string) => new Intl.DateTimeFormat('en-GB', { timeZone: GB_PAKETI.saatDilimi, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
    assert.equal(saat('2027-01-15T09:00:00Z'), '09:00', 'winter: Greenwich Mean Time')
    assert.equal(saat('2027-07-15T08:00:00Z'), '09:00', 'summer: one hour ahead')
  })

  it('pounds sterling written with the sign before the amount; metric units; the laboratory units read on official pages', () => {
    assert.deepEqual(GB_PAKETI.paraBirimi, { kod: 'GBP', simge: '£', ondalikHane: 2 })
    assert.equal(GB_GIRDI.acilis.aylikTutarKalibi, '£% a month')
    assert.deepEqual(GB_PAKETI.uygulama!.birimler, { agirlik: 'kg', boy: 'cm', sicaklik: 'C' })
    assert.deepEqual(GB_GIRDI.araclar.labBirimleri, { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L' })
  })

  it('the emergency number is 999 and is a setting, never a digit in a sentence', () => {
    assert.equal(GB_PAKETI.uygulama!.portal?.acilNumara, '999')
    const sayfa = GB_ARAYUZ.portalMetinleri!['en-GB']!.sayfa
    assert.doesNotMatch(`${sayfa.acil} ${sayfa.acilNumara}`, /\d/)
  })

  it('the phone: +44, and an example inside the regulator\'s range for drama (07700 900000 to 900999), which is no one\'s number', () => {
    assert.equal(GB_PAKETI.telefon.ulkeOnEki, '+44')
    assert.equal(GB_PAKETI.telefon.ornek, GB_GIRDI.acilis.telefonOrnegi)
    assert.match(GB_PAKETI.telefon.ornek.replace(/\s/g, ''), /^\+447700900\d{3}$/)
    for (const yazim of ['+44 7700 900123', '07700 900123', '07700900123', '0044 7700 900123']) assert.equal(GB_PAKETI.telefon.cepGecerliMi(yazim), true, yazim)
    for (const yazim of ['', '7700', '+1 202 555 0123', 'abc']) assert.equal(GB_PAKETI.telefon.cepGecerliMi(yazim), false, yazim)
  })

  it('the triage record of another country\'s scale and the two tools whose limits are not this country\'s stay switched off', () => {
    for (const anahtar of ['esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi']) assert.ok(GB_GIRDI.araclar.kapali[anahtar], anahtar)
  })
})
