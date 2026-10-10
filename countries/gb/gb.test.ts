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
import { GB_GIRDI } from './ayarlar'
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
  // off by Kaan's order of 2026-10-10 as well (NOTYA-ULKE-ARAC-01b): all five; 'doz-hesabi' was on here until that day
  kapaliAraclar: ['doz-hesabi', 'esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi'],
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
    assert.equal(ad('orthopaedics'), 'Trauma and orthopaedics')
    assert.equal(GB_ARAYUZ.randevuMetinleri['en-GB']!.durum.iptal, 'Cancelled')
    assert.match(GB_KLINIK.notTalimati('en-GB', 'general') ?? '', /You are an experienced consultant\.[\s\S]*in British spelling/)
  })

  it('the patient identifier is labelled "NHS number"; the guardian age is the pack\'s setting in both halves', () => {
    assert.equal(GB_PAKETI.ulusalKimlik?.ad, 'NHS number')
    assert.equal(GB_PAKETI.uygulama!.veliYasi, GB_GIRDI.veliYasi)
    assert.equal(GB_PAKETI.uygulama!.veliYasi, 16)
  })

  it('the recording-consent stamp is the United Kingdom\'s own draft', () => {
    assert.equal(GB_KLINIK.riza.surum, 'gb-draft-2026-10-09')
    assert.equal(GB_ARAYUZ.metinler['en-GB']!.muayene.riza, GB_GIRDI.sozler.kayitRizasi)
  })
})
