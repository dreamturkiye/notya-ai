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
import { NZ_PAKETI } from './index'
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
    assert.equal(ad('internal-medicine'), 'General medicine')
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

  it('prostate-specific antigen is written in µg/L; the consent stamp is New Zealand\'s own draft', () => {
    const a = NZ_ARAYUZ.araclar!
    assert.equal(a.birimler['ng/mL'][D], 'µg/L')
    assert.equal(a.birimler['ng/mL/yil'][D], 'µg/L per year')
    assert.equal(NZ_KLINIK.riza.surum, 'nz-draft-2026-10-09')
    assert.equal(NZ_ARAYUZ.metinler[D]!.muayene.riza, NZ_GIRDI.sozler.kayitRizasi)
  })
})
