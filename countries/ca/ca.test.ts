/**
 * NOTYA-ULKE-EN-01 — Canada (`ca`): the pack's own tests. The tests every English-speaking pack runs on itself
 * (countries/_dil/en/testing/paketSinamasi.ts), with what is Canada's: Canadian spelling (a mix stated word by word),
 * SI units, year-first dates, several time zones, ENGLISH ONLY (French is absent and waits on the owner), the tools it
 * keeps as slots, and the words of the other English-speaking countries that must not show here.
 *
 * NOTYA-ULKE-UYGULA-CA (2026-10-10): the country's own role list, the two tools it has beyond the set, and the fixes
 * of the localisation audit of 2026-10-09 (the last block). The roles: ./roller.test.ts. Who sees which tool and what
 * national sources state: ./araclar/araclar.test.ts. The two tools of its own: ./araclar/yeniAraclar.test.ts.
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
import { CA_ROLLER } from './roller'

const D = 'en-CA'
const LAB = { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L', crp: 'mg/L', psa: 'ug/L' }

ingilizcePaketSinamasi({
  paket: CA_PAKETI,
  arayuz: CA_ARAYUZ,
  klinik: CA_KLINIK,
  bicim: D,
  ayarlarKaynagi: kaynakOku(join(__dirname, 'ayarlar.ts')),
  // United Kingdom, United States, Australia, New Zealand: their systems, identifiers, currencies, names, usage
  yabanci: /\b(NHS|NHI|GBP|USD|AUD|NZD|United Kingdom|United States|Australia|Australian|New Zealand|HIPAA|Medicaid|Medicare|General practice|Anaesthetics|Pulmonology|Respiratory and sleep medicine|Physical therapist|attending physician|consultant)\b|£/,
  // off by Kaan's order of 2026-10-10 (NOTYA-ULKE-ARAC-01b): four. The dose calculator was the fifth and is back on here
  // by his order later the same day, its fault corrected in the kit (./ayarlar.ts).
  kapaliAraclar: ['esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi'],
  birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' },
  labBirimleri: LAB,
  kidemliHekim: 'staff physician',
  // a range reserved for fiction where this job is certain of one; otherwise a shape that is no number (see ./ayarlar.ts)
  ornekTelefon: /^\d{3}-555-01\d{2}$/,
  // NOTYA-ULKE-UYGULA-CA: this country's own role list (nothing taken out, seven added: ./roller.ts, ./roller.test.ts)
  rolDegisimi: CA_ROLLER,
  // … and the two tools only it has, both switched on (./araclar/)
  ekAraclar: ['ca-unit-converter', 'ca-egfr-ckd-epi-2021'],
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

  it('prostate-specific antigen is labelled in both forms in use here, "µg/L (= ng/mL)"; the report outline is OFF (Kaan\'s order of 2026-10-10) and says "permission needed"; the consent stamp is Canada\'s own draft', () => {
    const a = CA_ARAYUZ.araclar!
    assert.equal(a.labBirimleri.psa, 'ug/L')
    // the urologists' recommendations write ng/mL and a provincial laboratory µg/L: the same amount, so both are named
    assert.equal(a.birimler['ug/L'][D], 'µg/L (= ng/mL)')
    assert.equal(a.birimler['ug/L/yil'][D], 'µg/L (= ng/mL) per year')
    assert.ok(!('ng/mL' in a.birimler), 'no second unit of the amount is offered: nothing is converted')
    assert.ok(!a.araclar.some((x) => x.anahtar === 'rapor-taslagi'))
    assert.equal(a.yuvalar.find((y) => y.anahtar === 'rapor-taslagi')?.lisans?.durum, 'izin-gerekli')
    assert.equal(CA_KLINIK.riza.surum, 'ca-draft-2026-10-09')
    assert.equal(CA_ARAYUZ.metinler[D]!.muayene.riza, CA_GIRDI.sozler.kayitRizasi)
  })
})

/**
 * AUDIT 2026-10-09 (the localisation audit of Canada against its own standards, branch audit/ca): what it changed, held
 * here so that it does not drift back. None of this was read by a person of the country; it is what a machine could
 * confirm from official pages. Folded into this pack by NOTYA-ULKE-UYGULA-CA on 2026-10-10; the role names it checked
 * are now held, with the audit of the tools and roles, in ./roller.test.ts.
 */
describe('ca: the audit against Canada\'s standards (2026-10-09)', () => {
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
    // one time all year: the same offset in January and in July (2025)
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
    // the 12-hour clock is written "2:30 p.m." by the platform's data for this locale
    assert.match(new Intl.DateTimeFormat(CA_PAKETI.bicim.yerel, { timeZone: 'UTC', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(Date.UTC(2000, 0, 1, 14, 30))), /^2:30\sp\.m\.$/)
  })

  it('UNITS: SI on every screen (kilograms, centimetres, degrees Celsius) and the SI laboratory units the pack states', () => {
    assert.deepEqual(CA_PAKETI.uygulama!.birimler, { agirlik: 'kg', boy: 'cm', sicaklik: 'C' })
    assert.deepEqual(CA_GIRDI.araclar.labBirimleri, LAB)
  })

  it('THE EMERGENCY NUMBER is 911, the triage record of another country\'s scale stays a slot, and nothing is offered in French yet', () => {
    assert.equal(CA_PAKETI.uygulama!.portal?.acilNumara, '911')
    assert.ok('esi-triyaj' in CA_GIRDI.araclar.kapali)
    assert.ok(!CA_ARAYUZ.araclar!.araclar.some((x) => x.anahtar === 'esi-triyaj'))
    assert.deepEqual([...CA_PAKETI.uygulama!.hastaDilleri], ['en'])
  })
})
