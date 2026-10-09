/**
 * NOTYA-ULKE-PORTAL-01 — Uzbekistan: the PATIENT PORTAL's text, and the language a patient reads it in.
 *
 * What is Uzbekistan's own here (everything else about the portal is the kit's and is tested for every pack:
 * lib/ulke/portal/portal.paket.test.ts, components/ulke/portal/portalEkranlari.paket.test.ts):
 *
 *   1. LEAK TEST over every new string, in the three forms: same keys, nothing empty, each form in its own script
 *      (Uzbek Latin with ʻ and ʼ, never a typewriter apostrophe; no Latin letter in the Cyrillic and Russian forms),
 *      no Turkish word or letter, and the three forms really are three texts.
 *   2. THE PATIENT'S LANGUAGE: Russian for a patient recorded as Russian-speaking, whatever the doctor reads; Uzbek
 *      for an Uzbek-speaking patient, in the DOCTOR's script (of the interface if that is Uzbek, else of the notes,
 *      else Latin). The summary's instruction exists in each of the three forms and asks for that form.
 *   3. The catalogue and the instruction say, at their top, that they are machine-written and patient-facing; and
 *      the country's record lists every patient-facing sentence for the native reader, as it stands in the code.
 */
process.env.NOTYA_COUNTRY = 'uz'

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'

const KOK = resolve(__dirname, '../../..')
const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: 'uz', kaynak }), [])
function yaprak(o: unknown, on = ''): [string, string][] {
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (typeof v === 'string' ? [[`${on}${k}`, v] as [string, string]] : yaprak(v, `${on}${k}.`)))
}

describe('Uzbekistan — the patient portal: text in three forms, and the patient\'s language', () => {
  let PM: typeof import('./portalMetinleri')
  let A: typeof import('@/lib/ulke/arayuz')
  let K: typeof import('../klinik/hastaOzeti')
  before(async () => { PM = await import('./portalMetinleri'); A = await import('@/lib/ulke/arayuz'); K = await import('../klinik/hastaOzeti') })

  it('the catalogue and the instruction say, at their top, that they are machine-written, patient-facing, and await native review', () => {
    const katalog = readFileSync(join(KOK, 'countries/uz/uygulama/portalMetinleri.ts'), 'utf8').slice(0, 2200)
    assert.match(katalog, /MACHINE-WRITTEN\. AWAITS NATIVE REVIEW\./); assert.match(katalog, /PATIENT-FACING/); assert.match(katalog, /103/)
    const talimat = readFileSync(join(KOK, 'countries/uz/klinik/hastaOzeti.ts'), 'utf8').slice(0, 1200)
    assert.match(talimat, /MACHINE-WRITTEN, NOT READ BY A NATIVE-SPEAKING CLINICIAN/); assert.match(talimat, /PATIENT-FACING/)
  })

  it('LEAK TEST over every new string, in all three forms: same keys, nothing empty, each form in its own script, no Turkish word or letter', () => {
    const [lat, kir, ru] = FORMLAR.map((f) => yaprak(PM.UZ_PORTAL_METINLERI[f]))
    assert.equal(lat.length, 99, `the portal catalogue has ${lat.length} entries per form`)
    assert.deepEqual(kir.map((x) => x[0]), lat.map((x) => x[0])); assert.deepEqual(ru.map((x) => x[0]), lat.map((x) => x[0]))
    for (let i = 0; i < lat.length; i++) {
      const k = lat[i][0]
      for (const [f, v] of [['uz-Latn', lat[i][1]], ['uz-Cyrl', kir[i][1]], ['ru', ru[i][1]]] as const) {
        assert.ok(v.trim().length > 0, `${f}/${k} is empty`)
        temiz(v, `${f}/${k}`)
        assert.doesNotMatch(v, /[çğıİşĞŞöüÖÜâîû]/, `${f}/${k} has a Turkish letter`)
        assert.doesNotMatch(v, /'|`/, `${f}/${k}: a typewriter apostrophe (Uzbek Latin uses ʻ and ʼ)`)
        assert.doesNotMatch(v, /hasta|randevu|doktor|hekim|muayene|özet/i, `${f}/${k} carries a Turkish word`)
      }
      assert.doesNotMatch(lat[i][1], /[Ѐ-ӿ]/, `uz-Latn/${k} has a Cyrillic letter`)
      assert.doesNotMatch(kir[i][1], /[A-Za-z]/, `uz-Cyrl/${k} has a Latin letter`)
      assert.doesNotMatch(ru[i][1], /[A-Za-zўқғҳЎҚҒҲ]/, `ru/${k} has a Latin or Uzbek-only letter`)
      // The three forms really are three texts: Cyrillic Uzbek is not the Russian line, nor the Latin one.
      if (kir[i][1].length > 12) assert.notEqual(kir[i][1], ru[i][1], `${k}: uz-Cyrl and ru are the same sentence`)
      assert.notEqual(kir[i][1], lat[i][1], `${k}: uz-Cyrl is the Latin line`)
      // A sentence carries the same placeholders in every form.
      const yer = (s: string) => [...s.matchAll(/%\d?/g)].map((x) => x[0]).sort()
      assert.deepEqual(yer(kir[i][1]), yer(lat[i][1]), `${k}: placeholders differ in uz-Cyrl`); assert.deepEqual(yer(ru[i][1]), yer(lat[i][1]), `${k}: placeholders differ in ru`)
    }
    // Uzbek is written as Uzbek: the Latin form uses its own letters, the Cyrillic form its own.
    assert.match(lat.map((x) => x[1]).join(' '), /[ʻ]/); assert.match(kir.map((x) => x[1]).join(' '), /[ўқғҳ]/)
    // The ambulance number is the same in the three forms, and the page says in each that it is not for emergencies.
    for (const f of FORMLAR) assert.match(PM.UZ_PORTAL_METINLERI[f].sayfa.acil, /: 103\.$/, f)
    // One time zone in this country: nothing to say about zones on a patient's page.
    for (const f of FORMLAR) assert.equal(PM.UZ_PORTAL_METINLERI[f].sayfa.saatDilimi, undefined)
    // The kit reads exactly these three, and nothing for a form the country does not have.
    for (const f of FORMLAR) assert.equal(A.portalMetni(f), PM.UZ_PORTAL_METINLERI[f])
    assert.equal(A.portalMetni('tr'), PM.UZ_PORTAL_METINLERI['uz-Latn'], 'an unknown form is the pack\'s default, never another country')
  })

  it('THE PATIENT\'S LANGUAGE: Russian for a Russian-speaking patient whatever the doctor reads; Uzbek in the DOCTOR\'s script otherwise', () => {
    const b = (hasta: string, dil: (typeof FORMLAR)[number], notDili: (typeof FORMLAR)[number]) => A.hastaIcinBicim(hasta, { dil, notDili })
    // Russian-speaking patient: Russian, with every kind of doctor.
    for (const d of FORMLAR) for (const n of FORMLAR) assert.equal(b('ru', d, n), 'ru', `patient ru, doctor ${d}/${n}`)
    // Uzbek-speaking patient: the script of the doctor's interface where that is Uzbek …
    for (const n of FORMLAR) { assert.equal(b('uz', 'uz-Latn', n), 'uz-Latn'); assert.equal(b('uz', 'uz-Cyrl', n), 'uz-Cyrl') }
    // … else the script the doctor writes notes in, where that is Uzbek …
    assert.equal(b('uz', 'ru', 'uz-Cyrl'), 'uz-Cyrl'); assert.equal(b('uz', 'ru', 'uz-Latn'), 'uz-Latn')
    // … else Latin: an Uzbek-speaking patient never gets a Russian page because their doctor works in Russian.
    assert.equal(b('uz', 'ru', 'ru'), 'uz-Latn')
  })

  it('THE SUMMARY\'S INSTRUCTION exists in each form, asks for that form, and keeps the contract with the code', () => {
    for (const f of FORMLAR) {
      const t = K.uzHastaOzetiTalimati(f)
      assert.ok(t && t.length > 400, `${f}: no instruction`)
      assert.ok(t.includes('{"summary": "…"}'), `${f}: the answer's shape is not named`)
      temiz(t, `summary instruction (${f})`)
      const duz = t.replace('{"summary": "…"}', '').replace(/JSON/g, '')
      if (f === 'uz-Latn') { assert.doesNotMatch(duz, /[Ѐ-ӿ]/); assert.match(t, /Oʻzbek tilida, lotin yozuvida/) }
      if (f === 'uz-Cyrl') { assert.doesNotMatch(duz, /[A-Za-z]/, `${f}: Latin letter in ${duz.match(/[A-Za-z]+/)?.[0]}`); assert.match(t, /Ўзбек тилида, кирилл ёзувида/) }
      if (f === 'ru') { assert.doesNotMatch(duz, /[A-Za-zўқғҳЎҚҒҲ]/, `${f}: Latin or Uzbek-only letter in ${duz.match(/[A-Za-zўқғҳ]+/)?.[0]}`); assert.match(t, /на русском языке/) }
      // No assistant, doctor or patient is named, and no source.
      assert.doesNotMatch(t, /Notya|Нотя/)
      // The message that carries the note: the four sections as data, under a label in the same form.
      const g = K.uzHastaOzetiGirdisi(f, { s: 'S-TEXT', o: 'O-TEXT', a: 'A-TEXT', p: 'P-TEXT' })
      assert.ok(g.endsWith('{"s":"S-TEXT","o":"O-TEXT","a":"A-TEXT","p":"P-TEXT"}'))
      if (f !== 'uz-Latn') assert.doesNotMatch(g.split(':\n')[0], /[A-Za-z]/)
    }
    assert.equal(K.uzHastaOzetiTalimati('tr'), null, 'no instruction for a form this country does not have')
  })

  it('FOR THE NATIVE READER: the country\'s record lists every patient-facing sentence of the portal, exactly as it stands in the code', () => {
    const kayit = readFileSync(join(KOK, 'docs/COUNTRY-PACK-UZBEKISTAN.md'), 'utf8')
    assert.match(kayit, /^## The patient portal/m)
    let n = 0
    for (const grup of ['giris', 'sayfa'] as const) {
      for (const [k] of yaprak(PM.UZ_PORTAL_METINLERI['uz-Latn'][grup])) {
        for (const f of FORMLAR) {
          const v = (PM.UZ_PORTAL_METINLERI[f][grup] as unknown as Record<string, string>)[k]
          assert.ok(kayit.includes(v), `docs/COUNTRY-PACK-UZBEKISTAN.md does not list ${f} ${grup}.${k}: "${v}" — the list in the record must be the text in countries/uz/uygulama/portalMetinleri.ts`)
          n++
        }
      }
    }
    assert.equal(n, (14 + 23) * 3, 'every patient-facing sentence, in three forms')
    // … and the three instructions the summary is written with are named as the first thing to read.
    assert.match(kayit, /countries\/uz\/klinik\/hastaOzeti\.ts/)
  })
})
