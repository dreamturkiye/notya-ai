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

const D = 'en-AU'

ingilizcePaketSinamasi({
  paket: AU_PAKETI,
  arayuz: AU_ARAYUZ,
  klinik: AU_KLINIK,
  bicim: D,
  ayarlarKaynagi: kaynakOku(join(__dirname, 'ayarlar.ts')),
  // United Kingdom, United States, Canada, New Zealand: their systems, identifiers, currencies, names, usage
  yabanci: /\b(NHS|NHI|GBP|USD|CAD|NZD|United Kingdom|United States|Canada|Canadian|provincial|Quebec|New Zealand|HIPAA|Medicaid|health card|Anaesthetics|Anesthesiology|Pulmonology|Respirology|Physical therapist|attending physician|staff physician|consultant)\b|£/,
  // off by Kaan's order of 2026-10-10 as well (NOTYA-ULKE-ARAC-01b): all five; 'doz-hesabi' was on here until that day
  kapaliAraclar: ['doz-hesabi', 'esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi'],
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
    assert.equal(ad('paediatrics'), 'Paediatrics')
    assert.equal(ad('anaesthesia'), 'Anaesthesia')
    assert.equal(ad('family-medicine'), 'General practice')
    assert.equal(ad('internal-medicine'), 'General medicine')
    assert.equal(ad('respiratory-medicine'), 'Respiratory and sleep medicine')
    assert.equal(AU_ARAYUZ.randevuMetinleri![D]!.durum.iptal, 'Cancelled')
    assert.equal(enYaz('a rehabilitation programme', D), 'a rehabilitation program')
    assert.equal(enYaz('a rehabilitation programme', 'en-GB'), 'a rehabilitation programme')
    assert.match(AU_KLINIK.notTalimati(D, 'general') ?? '', /You are an experienced specialist\.[\s\S]*in Australian spelling/)
  })

  it('the patient identifier is labelled "Medicare number"; the guardian age is the pack\'s setting in both halves', () => {
    assert.equal(AU_PAKETI.ulusalKimlik?.ad, 'Medicare number')
    assert.equal(AU_ARAYUZ.metinler[D]!.yeniHasta.ulusalKimlik, 'Medicare number')
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
