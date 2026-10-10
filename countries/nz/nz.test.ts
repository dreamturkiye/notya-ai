/**
 * NOTYA-ULKE-EN-01 — New Zealand (`nz`): the pack's own tests. The tests every English-speaking pack runs on itself
 * (countries/_dil/en/testing/paketSinamasi.ts), with what is New Zealand's: New Zealand spelling (the British base,
 * unchanged), SI units, two time zones, the tools it keeps as slots, and the words of the other English-speaking
 * countries that must not show here.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { ingilizcePaketSinamasi, kaynakOku } from '../_dil/en/testing/paketSinamasi'
import { enYaz } from '../_dil/en/varyant'
import { NZ_ARAYUZ } from './arayuz'
import { NZ_GIRDI } from './ayarlar'
import derleme from './derleme.mjs'
import { NZ_PAKETI, nzAramaKatla } from './index'
import { NZ_KLINIK } from './klinik'

const D = 'en-NZ'

ingilizcePaketSinamasi({
  paket: NZ_PAKETI,
  arayuz: NZ_ARAYUZ,
  klinik: NZ_KLINIK,
  bicim: D,
  ayarlarKaynagi: kaynakOku(join(__dirname, 'ayarlar.ts')),
  // United Kingdom, United States, Canada, Australia: their systems, identifiers, currencies, names, usage
  yabanci: /\b(NHS|GBP|USD|CAD|AUD|United Kingdom|United States|Canada|Canadian|provincial|Quebec|Australia|Australian|HIPAA|Medicaid|Medicare|health card|Anaesthetics|Anesthesiology|Pulmonology|Respirology|Respiratory and sleep medicine|Physical therapist|attending physician|staff physician|consultant)\b|£/,
  kapaliAraclar: ['esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi'],
  birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' },
  labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L' },
  kidemliHekim: 'specialist',
  // a range reserved for fiction where this job is certain of one; otherwise a shape that is no number (see ./ayarlar.ts)
  ornekTelefon: /^\+64 2X XXX XXXX$/,
})

describe('nz: what is New Zealand\'s', () => {
  it('code nz, served at /nz; day first; week from Monday; 12-hour clock; SI units; New Zealand dollars', () => {
    assert.equal(NZ_PAKETI.kod, 'nz')
    assert.equal(NZ_PAKETI.yolOnEki, '/nz')
    assert.equal(derleme.yolOnEki, '/nz')
    assert.equal(derleme.saatDilimi, NZ_PAKETI.saatDilimi)
    assert.equal(NZ_PAKETI.bicim.tarihDeseni, 'DD/MM/YYYY')
    assert.equal(NZ_PAKETI.bicim.haftaBasi, 1)
    assert.equal(NZ_PAKETI.uygulama!.saatBicimi, 12)
    assert.equal(NZ_PAKETI.paraBirimi.kod, 'NZD')
    assert.equal(NZ_ARAYUZ.randevuMetinleri![D]!.form.tarihOrnek, 'DD/MM/YYYY')
  })

  it('two time zones: the default is one of them, an account is asked, and the calendar names no single zone', () => {
    const dilimler = [...NZ_PAKETI.uygulama!.saatDilimleri]
    assert.deepEqual(dilimler, ['Pacific/Auckland', 'Pacific/Chatham'])
    assert.ok(dilimler.includes(NZ_PAKETI.saatDilimi))
    assert.equal(NZ_ARAYUZ.metinler[D]!.ayarlar.saatDilimi, 'Time zone')
    assert.equal(NZ_ARAYUZ.randevuMetinleri![D]!.duzen.saatDilimi, 'Times are shown in the time zone set for your account.')
  })

  it('New Zealand spelling on the screens — the British base, "programme" kept — and the country\'s own names for its specialties', () => {
    const ad = (rol: string) => NZ_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad[D]
    assert.equal(ad('paediatrics'), 'Paediatrics')
    assert.equal(ad('anaesthesia'), 'Anaesthesia')
    assert.equal(ad('family-medicine'), 'General practice')
    assert.equal(ad('internal-medicine'), 'Internal medicine')
    assert.equal(ad('respiratory-medicine'), 'Respiratory medicine')
    assert.equal(NZ_ARAYUZ.randevuMetinleri![D]!.durum.iptal, 'Cancelled')
    assert.equal(enYaz('a rehabilitation programme', D), 'a rehabilitation programme')
    assert.match(NZ_KLINIK.notTalimati(D, 'general') ?? '', /You are an experienced specialist\.[\s\S]*in New Zealand spelling/)
  })

  it('the patient identifier is labelled "NHI number"; the guardian age is the pack\'s setting in both halves', () => {
    assert.equal(NZ_PAKETI.ulusalKimlik?.ad, 'NHI number')
    assert.equal(NZ_ARAYUZ.metinler[D]!.yeniHasta.ulusalKimlik, 'NHI number')
    assert.equal(NZ_PAKETI.uygulama!.veliYasi, NZ_GIRDI.veliYasi)
    assert.equal(NZ_PAKETI.uygulama!.veliYasi, 16)
  })

  // NOTYA-ULKE-DENETIM-NZ (2026-10-09) — what the audit compared with an official source and fixed or confirmed.
  // Sources and wording: docs/COUNTRY-AUDIT-NEW-ZEALAND.md.
  it('AUDIT: specialties that are vocational scopes of the medical council are named as its list names them', () => {
    const ad = (rol: string) => NZ_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad[D]
    const kapsam: Record<string, string> = {
      'emergency-medicine': 'Emergency medicine', 'family-medicine': 'General practice', anaesthesia: 'Anaesthesia', neurosurgery: 'Neurosurgery',
      'paediatric-surgery': 'Paediatric surgery', 'internal-medicine': 'Internal medicine', dermatology: 'Dermatology', 'general-surgery': 'General surgery',
      ophthalmology: 'Ophthalmology', 'obstetrics-gynaecology': 'Obstetrics and gynaecology', otolaryngology: 'Otolaryngology, head and neck surgery',
      orthopaedics: 'Orthopaedic surgery', paediatrics: 'Paediatrics', 'plastic-surgery': 'Plastic and reconstructive surgery', psychiatry: 'Psychiatry',
      radiology: 'Diagnostic and interventional radiology', urology: 'Urology', 'sports-medicine': 'Sport and exercise medicine', 'rehabilitation-medicine': 'Rehabilitation medicine',
    }
    for (const [rol, beklenen] of Object.entries(kapsam)) assert.equal(ad(rol), beklenen, rol)
    // the names this audit replaced must not come back
    const adlar = NZ_ARAYUZ.roller.map((r) => r.ad[D])
    for (const eski of ['General medicine', 'Plastic surgery', 'Radiology', 'Family medicine']) assert.ok(!adlar.includes(eski), eski)
    // the allied professions, as their own registration boards name them
    assert.deepEqual(['physiotherapy', 'clinical-psychology', 'dietetics', 'occupational-therapy', 'audiology'].map(ad), ['Physiotherapist', 'Clinical psychologist', 'Dietitian', 'Occupational therapist', 'Audiologist'])
  })

  it('AUDIT: the emergency number is 111, a setting and never a sentence; the two zones are the two times the law sets', () => {
    assert.equal(NZ_PAKETI.uygulama!.portal!.acilNumara, '111')
    const sayfa = NZ_ARAYUZ.portalMetinleri![D]!.sayfa
    assert.doesNotMatch(sayfa.acil + sayfa.acilNumara, /\d/)
    // main islands: UTC+12 in winter, +13 in summer; Chatham Islands: 45 minutes ahead of them all year
    const ofset = (dilim: string, an: string) => new Intl.DateTimeFormat('en-GB', { timeZone: dilim, timeZoneName: 'longOffset' }).formatToParts(new Date(an)).find((x) => x.type === 'timeZoneName')?.value
    assert.equal(ofset('Pacific/Auckland', '2026-07-01T00:00:00Z'), 'GMT+12:00')
    assert.equal(ofset('Pacific/Auckland', '2026-12-01T00:00:00Z'), 'GMT+13:00')
    assert.equal(ofset('Pacific/Chatham', '2026-07-01T00:00:00Z'), 'GMT+12:45')
    assert.equal(ofset('Pacific/Chatham', '2026-12-01T00:00:00Z'), 'GMT+13:45')
    assert.equal(NZ_PAKETI.saatDilimi, 'Pacific/Auckland')
  })

  it('AUDIT: an NHI number of either form is kept as typed (letters and digits), and nothing asks for a tax number', () => {
    const k = NZ_PAKETI.ulusalKimlik!
    // test numbers of the two forms: three letters, three digits, check digit; three letters, two digits, letter, check letter
    for (const ornek of ['ZZZ0016', 'ZZZ00AX']) assert.equal(k.gecerliMi(ornek), true, ornek)
    assert.equal(NZ_PAKETI.uygulama!.kimlikNumarasi.dogrula, false)
    assert.equal(k.hane, 0)
    const sorular = [...NZ_KLINIK.hastaFormu!.cekirdek.bolumler.flatMap((b) => b.sorular), ...Object.values(NZ_KLINIK.hastaFormu!.roller).flatMap((r) => r.sorular)]
    for (const q of sorular) assert.doesNotMatch(q.metin[D], /\b(IRD|tax number|tax file)\b/i, q.anahtar)
    assert.doesNotMatch(JSON.stringify(NZ_ARAYUZ.metinler[D]), /\bIRD\b|tax number/i)
  })

  it('AUDIT: dates day first with slashes, decimal point, comma for thousands, dollars with two decimals; a name with a macron is kept', () => {
    assert.deepEqual(NZ_PAKETI.bicim, { yerel: 'en-NZ', tarihDeseni: 'DD/MM/YYYY', ondalikAyraci: '.', binlikAyraci: ',', haftaBasi: 1 })
    assert.deepEqual(NZ_PAKETI.paraBirimi, { kod: 'NZD', simge: '$', ondalikHane: 2 })
    assert.equal(NZ_GIRDI.acilis.aylikTutarKalibi, '$% a month')
    // the pack's own locale sorts and compares a macron as its letter: "Pōtae" files beside "Potae", and is not altered
    const ad = 'Wiremu Pōtae'
    assert.equal(ad.normalize('NFC'), ad)
    assert.equal(new Intl.Collator(NZ_PAKETI.bicim.yerel, { sensitivity: 'base' }).compare('Pōtae', 'Potae'), 0)
  })

  it('AUDIT: a name with a macron is found with or without it, and the name itself is never changed', () => {
    assert.equal(NZ_PAKETI.uygulama!.aramaKatla, nzAramaKatla)
    assert.equal(nzAramaKatla('Wiremu Pōtae'), 'wiremu potae')
    assert.equal(nzAramaKatla('PŌTAE'), nzAramaKatla('potae'))
    assert.equal(nzAramaKatla('Ngāti Whātua Ōrākei'), 'ngati whatua orakei')
    assert.equal(nzAramaKatla('O’Brien'), nzAramaKatla("O'Brien"))
    assert.ok(nzAramaKatla('Wiremu Pōtae').includes(nzAramaKatla('Potae')))
    // digits and plain letters pass through: an NHI number typed into the search box is not altered beyond its case
    assert.equal(nzAramaKatla('ZZZ00AX'), 'zzz00ax')
  })

  it('AUDIT: the mobile rule takes the common spellings of a mobile number and refuses a landline and the emergency number', () => {
    const t = NZ_PAKETI.telefon
    assert.equal(t.ulkeOnEki, '+64')
    for (const ham of ['+64 21 123 4567', '021 123 4567', '027 123 4567', '+64 22 123 4567', '0064 21 123 4567', '021 123 456', '021 1234 5678']) assert.equal(t.cepGecerliMi(ham), true, ham)
    for (const ham of ['', '09 123 4567', '+64 9 123 4567', '111', '0800 611 116', 'abc']) assert.equal(t.cepGecerliMi(ham), false, ham)
  })

  it('AUDIT: the triage tool of another scale stays off, and its slot says which scale is used here', () => {
    assert.match(NZ_GIRDI.araclar.kapali['esi-triyaj'].eksik, /Australasian triage scale/)
    assert.ok(!NZ_ARAYUZ.araclar!.araclar.some((x) => x.anahtar === 'esi-triyaj'))
  })

  it('prostate-specific antigen is written in µg/L; the consent stamp is New Zealand\'s own draft', () => {
    const a = NZ_ARAYUZ.araclar!
    assert.equal(a.birimler['ng/mL'][D], 'µg/L')
    assert.equal(a.birimler['ng/mL/yil'][D], 'µg/L per year')
    assert.equal(NZ_KLINIK.riza.surum, 'nz-draft-2026-10-09')
    assert.equal(NZ_ARAYUZ.metinler[D]!.muayene.riza, NZ_GIRDI.sozler.kayitRizasi)
  })
})
