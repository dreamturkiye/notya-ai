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
    assert.deepEqual(dilimler, ['America/Toronto', 'America/St_Johns', 'America/Halifax', 'America/Winnipeg', 'America/Regina', 'America/Edmonton', 'America/Vancouver'])
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

  it('the patient identifier is labelled "Provincial health card number"; the guardian age is the pack\'s setting in both halves', () => {
    assert.equal(CA_PAKETI.ulusalKimlik?.ad, 'Provincial health card number')
    assert.equal(CA_ARAYUZ.metinler[D]!.yeniHasta.ulusalKimlik, 'Provincial health card number')
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
