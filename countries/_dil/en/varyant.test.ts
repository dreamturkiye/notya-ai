/**
 * NOTYA-ULKE-EN-01 — the spelling mechanism of the English language set: the table is sound, each form is written
 * as that form writes, and the checks that guard the texts really catch a wrong spelling.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ABD_TIBBI_YAZIMLAR, KELIMELER, KOKLER, KORUNAN } from './sozluk'
import { EN_BICIMLER, EN_TEMEL, enBicimMi, enCevir, enYaz, kelimeSatirlari, yabanciYazimlar } from './varyant'
import { bicimYazimSorunlari, temelYazimSorunlari, tumMetinler } from './testing/yazimDenetimi'

describe('English language set: the spelling table', () => {
  it('names five forms, and the base is en-GB', () => {
    assert.deepEqual([...EN_BICIMLER], ['en-GB', 'en-US', 'en-CA', 'en-AU', 'en-NZ'])
    assert.equal(EN_TEMEL, 'en-GB')
    assert.equal(enBicimMi('en-CA'), true)
    for (const x of ['en', 'en-IE', 'uz-Latn', 'tr', '', null, 7]) assert.equal(enBicimMi(x), false, String(x))
  })

  it('every row states the British and the American spelling and which side Canada takes', () => {
    for (const k of [...KELIMELER, ...KOKLER]) {
      assert.ok(k.gb && k.us && k.gb !== k.us, `row ${k.gb} / ${k.us}`)
      assert.ok(k.ca === 'gb' || k.ca === 'us', `row ${k.gb}: Canada must be stated`)
      assert.match(k.gb, /^[a-z]+$/, `row ${k.gb}: lower-case letters only`)
      assert.match(k.us, /^[a-z]+$/, `row ${k.us}: lower-case letters only`)
    }
  })

  it('no British spelling is listed twice, and no row undoes another', () => {
    const satirlar = kelimeSatirlari()
    const gb = satirlar.map((s) => s.gb)
    assert.equal(new Set(gb).size, gb.length, `listed twice: ${gb.filter((x, i) => gb.indexOf(x) !== i).join(', ')}`)
    // a spelling one row writes for a form is never the British spelling another row would convert again
    for (const sutun of ['us', 'ca', 'au'] as const) for (const s of satirlar) if (s[sutun] !== s.gb) assert.ok(!gb.includes(s[sutun]), `${s.gb} → ${s[sutun]} is itself a row`)
    const kokler = KOKLER.map((k) => k.gb)
    assert.equal(new Set(kokler).size, kokler.length)
  })

  it('a stem is never part of a whole-word row, so the two passes cannot meet in one word', () => {
    for (const s of kelimeSatirlari()) for (const k of KOKLER) for (const yazim of [s.gb, s.us]) assert.ok(!yazim.includes(k.gb), `"${yazim}" holds the stem "${k.gb}"`)
  })
})

describe('English language set: one text, five forms', () => {
  const TEMEL = 'The paediatric centre organises a colour-coded programme: the anaesthetist analyses nothing, travelling staff practise, and the licence is recognised.'.replace('analyses nothing', 'analysed nothing')

  it('en-GB and en-NZ are the base, unchanged', () => {
    assert.equal(enYaz(TEMEL, 'en-GB'), TEMEL)
    assert.equal(enYaz(TEMEL, 'en-NZ'), TEMEL)
  })

  it('en-US: every family is written the American way', () => {
    assert.equal(enYaz(TEMEL, 'en-US'), 'The pediatric center organizes a color-coded program: the anesthetist analyzed nothing, traveling staff practice, and the license is recognized.')
  })

  it('en-CA: -our, -re, doubled consonants, licence and practise stay; -ize, -yze, medical stems and "program" follow the American spelling', () => {
    assert.equal(enYaz(TEMEL, 'en-CA'), 'The pediatric centre organizes a colour-coded program: the anesthetist analyzed nothing, travelling staff practise, and the licence is recognized.')
  })

  it('en-AU: the base, with "program"', () => {
    assert.equal(enYaz(TEMEL, 'en-AU'), TEMEL.replace('programme', 'program'))
  })

  it('capitals are kept: sentence case, title case, all capitals', () => {
    assert.equal(enYaz('Colour. COLOUR. colour. Paediatrics. HAEMATOLOGY. Organisation', 'en-US'), 'Color. COLOR. color. Pediatrics. HEMATOLOGY. Organization')
  })

  it('whole words only: a word that merely contains a row is left alone', () => {
    assert.equal(enYaz('The laboratory and the collaborator; Coloured pencils; metres and a peak-flow meter; totally centred', 'en-US'), 'The laboratory and the collaborator; Colored pencils; meters and a peak-flow meter; totally centered')
  })

  it('medical stems are written inside longer words', () => {
    assert.equal(enYaz('haemoglobin, anaemia, hyperglycaemia, ischaemic, oesophageal, diarrhoea, dyspnoea, oedematous, gynaecological, orthopaedics, faeces, leukaemia', 'en-US'), 'hemoglobin, anemia, hyperglycemia, ischemic, esophageal, diarrhea, dyspnea, edematous, gynecological, orthopedics, feces, leukemia')
  })

  it('Latin names of organisms are the same in every form', () => {
    for (const ad of KORUNAN) for (const b of EN_BICIMLER) assert.equal(enYaz(`${ad} and haematuria`, b).startsWith(ad), true, `${ad} in ${b}`)
    assert.equal(enYaz('Haemophilus influenzae, Enterococcus faecalis, faecal sample', 'en-US'), 'Haemophilus influenzae, Enterococcus faecalis, fecal sample')
  })

  it('a whole catalogue is converted at any depth; keys, numbers and functions are left as they are', () => {
    const f = () => 'colour'
    const k = enCevir({ colour: 'colour', liste: ['centre', { ic: 'organise' }], sayi: 3, yok: null, f }, 'en-US') as Record<string, unknown>
    assert.deepEqual({ ...k, f: undefined }, { colour: 'color', liste: ['center', { ic: 'organize' }], sayi: 3, yok: null, f: undefined })
    assert.equal(k.f, f)
  })

  it('placeholders and line breaks pass through untouched', () => {
    assert.equal(enYaz('%1 organised\n%2 — colour: %', 'en-US'), '%1 organized\n%2 — color: %')
  })
})

describe('English language set: the checks that guard the texts', () => {
  it('no form shows another form\'s spelling once the table has written it', () => {
    const TEMEL = kelimeSatirlari().map((s) => s.gb).join(' ') + ' ' + ['haemoglobin', 'paediatrician', 'anaesthesia', 'orthopaedic', 'gynaecology', 'oesophagus', 'oedema', 'diarrhoea', 'apnoea', 'coeliac', 'oestrogen', 'caesarean', 'aetiology', 'anaemia', 'faecal'].join(' ')
    for (const b of EN_BICIMLER) assert.deepEqual(bicimYazimSorunlari(enYaz(TEMEL, b), b), [], b)
  })

  it('…and the same text left in the base spelling IS caught in the forms that write differently', () => {
    assert.ok(bicimYazimSorunlari('colour and centre', 'en-US').length === 2)
    assert.ok(bicimYazimSorunlari('organise', 'en-CA').length === 1)
    assert.deepEqual(bicimYazimSorunlari('colour and centre', 'en-CA'), [])
    assert.ok(bicimYazimSorunlari('programme', 'en-AU').length === 1)
    assert.ok(bicimYazimSorunlari('paediatric', 'en-US').length === 1)
    assert.ok(bicimYazimSorunlari('paediatric', 'en-CA').length === 1)
  })

  it('American spelling is caught in the forms that write the British way', () => {
    for (const b of ['en-GB', 'en-AU', 'en-NZ'] as const) {
      assert.ok(bicimYazimSorunlari('color', b).length === 1, b)
      assert.ok(bicimYazimSorunlari('organize', b).length === 1, b)
      assert.ok(bicimYazimSorunlari('Pediatric anemia', b).length === 2, b)
    }
    assert.ok(bicimYazimSorunlari('color', 'en-CA').length === 1)
    assert.ok(bicimYazimSorunlari('organise', 'en-CA').length === 1)
  })

  it('an American spelling that is also a British word is not hunted where it proves nothing', () => {
    for (const b of ['en-GB', 'en-NZ'] as const) assert.deepEqual(bicimYazimSorunlari('a peak-flow meter, a computer program, a practice, to license, a check', b), [], b)
    assert.ok(yabanciYazimlar('en-US').kelimeler.includes('programme'))
    assert.ok(yabanciYazimlar('en-AU').kelimeler.includes('programme'))
    assert.ok(!yabanciYazimlar('en-GB').kelimeler.includes('program'))
  })

  it('a text of the set must be written in the base form, and a word of a disputed family must be in the table', () => {
    assert.deepEqual(temelYazimSorunlari('We organise the colour of the centre. Otherwise your hour is a promise to exercise and revise; the size is precise.'), [])
    assert.equal(temelYazimSorunlari('We organize it.').length >= 1, true)
    assert.match(temelYazimSorunlari('We harmonise it.').join('\n'), /harmonise.*not in the spelling table/)
    assert.match(temelYazimSorunlari('The splendour of it.').join('\n'), /splendour.*not in the spelling table/)
    assert.match(temelYazimSorunlari('She analyses it.').join('\n'), /write around it/)
    assert.match(temelYazimSorunlari('He catalyzed it.').join('\n'), /-yze/)
  })

  it('the American medical spellings on the cross-check list are exactly what the table makes of a British word', () => {
    const gbdenYap = (us: string) => KOKLER.some((k) => us.includes(k.us))
    for (const us of ABD_TIBBI_YAZIMLAR) assert.ok(gbdenYap(us), `${us}: no stem of the table produces this spelling`)
  })

  it('tumMetinler walks a catalogue and names each place', () => {
    assert.deepEqual(tumMetinler({ a: 'x', b: ['y', { c: 'z' }], d: 1, e: () => 'no' }), [{ yer: 'a', metin: 'x' }, { yer: 'b[0]', metin: 'y' }, { yer: 'b[1].c', metin: 'z' }])
  })
})
