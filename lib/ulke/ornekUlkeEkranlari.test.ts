/**
 * NOTYA-ULKE-OZEL-01 — WHAT A DOCTOR SEES of the things one country may add, drawn by the kit's own screens
 * (components/ulke/uygulama/Araclar.tsx) from the content of the kit's test country "xx". The rules themselves:
 * lib/ulke/araclar/ulkeyeOzel.test.ts and lib/ulke/ornekUlke.test.ts.
 *
 *   1. A UNIT THE DOCTOR CHOOSES   every accepted unit is offered and NONE is selected; a number without its unit
 *                                  shows the pack's sentence and no result; with its unit, the result
 *   2. WHO THE TOOL IS FOR         the pack's sentence above the fields; opened for a patient it is not for: that
 *                                  sentence and no field; such a tool is not on that patient's grid
 *   3. THE RIGHTS HOLDER'S NOTICE  under the result of the tool that has one, and of no other
 *   4. A LINK-OUT TILE             one link to a fixed address, opened in a tab of its own, telling that site
 *                                  nothing; no field, nothing kept; marked as a link on the grid
 *   5. BANDS AND OPTIONS           the country's own, in the country's words
 *
 * The process is a build of one real English-speaking country (./testing/ornekUlke/derleme.ts says why); the test
 * country's tools are content handed to the screens.
 */
import './testing/ornekUlke/derleme'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { birimAnahtari } from './araclar/birimler'
import { hesabinAraci, paketinAraci } from './araclar/paket'
import type { UlkeAraclari } from './araclar/tipler'
import { XX_ARAYUZ } from './testing/ornekUlke'
import { gorunurMetin } from './testing/sizintiTarayici'

const D = 'en-GB'
const A = XX_ARAYUZ.araclar as UlkeAraclari
const a = A.metinler[D]!
const h = React.createElement
const BUGUN = '2026-10-10'
let Ekran: typeof import('@/components/ulke/uygulama/Araclar')

before(async () => { Ekran = await import('@/components/ulke/uygulama/Araclar') })

const arac = (anahtar: string, ham: Record<string, string | boolean>) => {
  const x = paketinAraci(A, anahtar)!
  return renderToStaticMarkup(h(Ekran.AracGorunumu, { x, a, dil: D, notDili: D, icerik: A, ham, degistir: () => {}, temizle: () => {}, bugun: BUGUN, kopya: 'yok' as const, kopyalaTikla: () => {} }))
}

describe('1. a unit the doctor chooses', () => {
  it('every accepted unit is offered, by its name, and NONE is selected for the doctor', () => {
    const html = arac('xx-kansizlik', {})
    assert.match(html, /data-birim-secimi="hb"/)
    const secim = /data-birim-secimi="hb"[\s\S]*?<\/div>/.exec(html)![0]
    assert.equal((secim.match(/type="radio"/g) ?? []).length, 2)
    assert.ok(secim.includes('value="g/L"') && secim.includes('value="g/dL"'))
    assert.doesNotMatch(secim, /checked/, 'no unit is chosen for the doctor')
    // no unit, so no unit beside the label and no range under the field (a range is a range IN a unit)
    const alan = /data-alan="hb"[\s\S]*?data-birim-secimi="hb"/.exec(html)![0]
    assert.doesNotMatch(alan, /<small>/)
    assert.doesNotMatch(html, /data-birim-eksik/, 'nothing is typed: nothing to ask a unit for')
  })

  it('A NUMBER WITHOUT ITS UNIT: the pack\'s sentence under the field, and no result', () => {
    const html = arac('xx-kansizlik', { hb: '140' })
    assert.match(html, /data-birim-eksik="hb"/)
    assert.ok(gorunurMetin(html).includes(a.arac.birimSec!))
    assert.match(html, /data-sonuc="eksik"/)
    assert.doesNotMatch(html, /data-bant=|data-eylem="kopyala"/)
    // the optional second value typed without its unit stops the result too
    const yarim = arac('xx-kansizlik', { hb: '140', [birimAnahtari('hb')]: 'g/L', ikinci: '150' })
    assert.match(yarim, /data-birim-eksik="ikinci"/)
    assert.doesNotMatch(yarim, /data-birim-eksik="hb"/)
    assert.match(yarim, /data-sonuc="eksik"/)
    assert.doesNotMatch(yarim, /data-bant=/)
  })

  it('with its unit: the unit beside the label, the range in that unit, the result, and the summary in the unit that was typed', () => {
    const html = arac('xx-kansizlik', { hb: '105', [birimAnahtari('hb')]: 'g/L' })
    assert.match(html, /data-secili="evet"><input type="radio"[^>]*checked=""[^>]*value="g\/L"/)
    assert.doesNotMatch(html, /checked=""[^>]*value="g\/dL"/)
    assert.match(html, /data-bant="altinda"/)
    assert.ok(gorunurMetin(html).includes('Below the limit'))
    assert.ok(gorunurMetin(html).includes('20') && gorunurMetin(html).includes('250'), 'the range of the field in g/L')
    const digeri = arac('xx-kansizlik', { hb: '10.5', [birimAnahtari('hb')]: 'g/dL' })
    assert.match(digeri, /data-bant="altinda"/, 'the same value in the other unit: the same answer')
    assert.match(arac('xx-kansizlik', { hb: '115', [birimAnahtari('hb')]: 'g/L' }), /data-bant="ustunde"/)
  })

  it('a field with ONE unit is drawn as it always was: the unit beside the label, no choice', () => {
    // the height-and-weight tools of the kit read the pack's one unit; the second value of the test tool has two
    const html = arac('pasi', {})
    assert.doesNotMatch(html, /data-birim-secimi|data-birim-eksik/)
  })
})

describe('2. who the tool is for', () => {
  it('the pack\'s sentence stands above the fields of a tool that is limited by the patient', () => {
    const html = arac('xx-erken-uyari', {})
    assert.match(html, /data-hasta-kapisi/)
    assert.ok(gorunurMetin(html).includes('This tool is for patients aged 16 and over.'))
    assert.doesNotMatch(arac('xx-kansizlik', {}), /data-hasta-kapisi/, 'a tool for every patient says nothing of the kind')
  })

  it('opened for a patient it is not for: the sentence, and no field at all', () => {
    const x = paketinAraci(A, 'xx-erken-uyari')!
    const html = renderToStaticMarkup(h(Ekran.HastaKapisiKapali, { x, dil: D }))
    assert.match(html, /data-kapi="degil"/)
    assert.ok(gorunurMetin(html).includes('This tool is for patients aged 16 and over.'))
    assert.doesNotMatch(html, /<input|data-alan=/)
  })

  it('the grid opened for a patient leaves out the tools that are not for that patient; opened without one, it has them', () => {
    const izgara = (hasta: { id: string; ad: string; dogumTarihi: string; cinsiyet: string } | null) => renderToStaticMarkup(h(Ekran.AraclarIzgarasi, { a, dil: D, icerik: A, rol: 'urology', q: '', hasta, bugun: BUGUN }))
    const id = '30000000-0000-4000-8000-000000000001'
    assert.match(izgara(null), /data-arac="psa-hizi"/)
    assert.match(izgara({ id, ad: 'QA Patient', dogumTarihi: '1970-01-01', cinsiyet: 'male' }), /data-arac="psa-hizi"/)
    for (const h2 of [{ dogumTarihi: '1970-01-01', cinsiyet: 'female' }, { dogumTarihi: '2015-01-01', cinsiyet: 'male' }, { dogumTarihi: '', cinsiyet: 'male' }, { dogumTarihi: '1970-01-01', cinsiyet: '' }]) {
      const html = izgara({ id, ad: 'QA Patient', ...h2 })
      assert.doesNotMatch(html, /data-arac="psa-hizi"/, JSON.stringify(h2))
      assert.match(html, /data-arac="xx-erken-uyari"|data-arac="kdigo-evre"/, 'the other tools of the role are still there')
    }
  })
})

describe('3. the rights holder\'s notice', () => {
  it('under the result of the tool that has one — and in what is copied — and under no other tool', () => {
    const html = arac('xx-erken-uyari', { solunum: '1', nabiz: '1', bilinc: '0' })
    assert.match(html, /data-lisans-bildirimi/)
    assert.ok(gorunurMetin(html).includes('Test Scale © The Test Scale Society. Used with permission.'))
    assert.doesNotMatch(arac('xx-kansizlik', { hb: '105', [birimAnahtari('hb')]: 'g/L' }), /data-lisans-bildirimi/)
  })
})

describe('4. a link-out tile', () => {
  it('ONE link to the pack\'s fixed address, in a tab of its own, telling that site nothing; no field', () => {
    const x = hesabinAraci(A, 'xx-geriatrics', 'xx-kirik-riski')!
    const html = renderToStaticMarkup(h(Ekran.DisBaglantiAraci, { x, dil: D }))
    assert.equal((html.match(/<a /g) ?? []).length, 1)
    assert.match(html, /href="https:\/\/example\.org\/calculator"/)
    assert.match(html, /target="_blank"/)
    assert.match(html, /rel="noopener noreferrer external"/)
    assert.match(html, /referrerPolicy="no-referrer"|referrerpolicy="no-referrer"/)
    assert.ok(gorunurMetin(html).includes('Open the official calculator'))
    assert.ok(gorunurMetin(html).includes('Nothing from the patient file is sent to it.'))
    assert.doesNotMatch(html, /<input|<form|data-eylem="arac-kaydet"|data-eylem="kopyala"/)
  })

  it('on the grid it is a tile like any other, marked as a link; its heading is the tool\'s own', () => {
    // (a role the hosting build has too: the grid's heading is the role's name, which the screen asks the active pack for)
    const html = renderToStaticMarkup(h(Ekran.AraclarIzgarasi, { a, dil: D, icerik: A, rol: 'family-medicine', q: '' }))
    assert.match(html, /data-arac="xx-kirik-riski"[^>]*data-tur="baglanti"/)
    assert.match(html, /data-arac="vertigo-notu"/)
    assert.doesNotMatch(html, /data-arac="vertigo-notu"[^>]*data-tur=/, 'a tool that works something out is not marked as a link')
    // the tile leads to the tool's own screen inside the application; only that screen holds the outside address
    assert.doesNotMatch(html, /example\.org/)
    const x = hesabinAraci(A, 'xx-geriatrics', 'xx-kirik-riski')!
    assert.ok(gorunurMetin(renderToStaticMarkup(h(Ekran.AracBasligi, { x, a, dil: D }))).includes('Fracture risk calculator (link, test)'))
  })
})

describe('5. the country\'s own bands and options, in its words', () => {
  it('four options where the definition has three, four bands where it has three', () => {
    const bos = arac('xx-erken-uyari', {})
    for (const ad of ['Ward', 'Clinic', 'Home visit', 'Elsewhere']) assert.ok(gorunurMetin(bos).includes(ad), ad)
    assert.equal((/data-alan="ortam"[\s\S]*?<\/fieldset>/.exec(bos)![0].match(/type="radio"/g) ?? []).length, 4)
    const bant = (s: string, n: string, b: string) => /data-bant="([a-z]+)"/.exec(arac('xx-erken-uyari', { solunum: s, nabiz: n, bilinc: b }))?.[1]
    assert.deepEqual([bant('0', '0', '0'), bant('1', '1', '0'), bant('3', '2', '0'), bant('3', '3', '3')], ['sifir', 'bir', 'iki', 'uc'])
    assert.ok(gorunurMetin(arac('xx-erken-uyari', { solunum: '3', nabiz: '3', bilinc: '3' })).includes('Level 3'))
  })

  it('a shared tool under the country\'s own name and option names', () => {
    const x = paketinAraci(A, 'asa-preop')!
    assert.ok(gorunurMetin(renderToStaticMarkup(h(Ekran.AracBasligi, { x, a, dil: D }))).includes('Pre-anaesthetic record (test)'))
    const html = arac('asa-preop', {})
    for (const ad of ['Class one', 'Class five', 'Emergency']) assert.ok(gorunurMetin(html).includes(ad), ad)
    assert.ok(gorunurMetin(html).includes('TEST DATA: the line under the result, as this country writes it.'))
  })
})
