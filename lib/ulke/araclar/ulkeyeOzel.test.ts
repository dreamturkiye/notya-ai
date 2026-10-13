/**
 * NOTYA-ULKE-OZEL-01 — WHAT ONE COUNTRY MAY ADD TO THE TOOLS, rule by rule, on the kit's own functions (no pack).
 * The whole of it on a complete pack: lib/ulke/ornekUlke.test.ts.
 *
 *   A. UNITS            a factor and a factor-with-shift, both ways; several accepted units; A NUMBER WITHOUT ITS UNIT
 *                       IS NOT A VALUE and stops the result — also in an optional field
 *   B. NUMBERS, TABLES  a laboratory limit is stated with its unit and converted; a bare number is refused; a missing
 *                       number or table gives NO result
 *   C. BANDS, OPTIONS   a country's own bands over one number (their count is the country's); every value falls in a
 *                       band; only where the definition allows it; a pack that restates nothing gets the same object
 *   D. THE PATIENT      age and sex; what is not known never fits
 *   E. THE MECHANISM    the kit's wins by key; a pack's own for its own key; a link-out tile has none; the licence is
 *                       a second lock on the gate; every doctor role
 *   F. WHOSE A KEY IS   a key that carries a country's code; the kit holds none
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ULKE_KODLARI } from '../tipler'
import { alanAraligi, alanBirimi, alanBirimleri, birimAnahtari, birimdenKanonige, kanoniktenBirime, LAB_BIRIMLERI, olcuTanimi, type BirimOrtami } from './birimler'
import { birimiSecilmeyenler, girdiyiCoz, hamdanGosterilen, hamiSuz, okunamayanAlanlar } from './girdi'
import { kapiSonucu, tamYas } from './hastaKapisi'
import { KIT_ARACLARI, kitAraci } from './katalog'
import { aracCalistir, aracinKapisi, aracOrtami, aracOzeti, hekimRolleri, hesabinAraci, hesabinAraclari, paketinAraci, paketinTanimi, type GorunurArac, type Yazici } from './paket'
import type { AracTanimi, OlcuTanimi, PaketAraci, UlkeAraclari } from './tipler'
import { anahtarUlkesi, ulkeyeOzelAnahtarlar, ulkeyeOzelMi } from './ulkeyeOzel'
import { bantBul, bantSinirlari, etkinTanim, parametreleriCoz, tablolariCoz, ulkeOrtami } from './uyarlama'
import { BOS_SONUC, sayi, sayiMi, secim } from './yardimci'

const D = 'en-GB'
const m = (metin: string) => ({ [D]: metin })
const SAYI = { ondalikAyraci: '.', binlikAyraci: ',' } as const
const OLCEK: OlcuTanimi = { kanonik: 'a', birimler: { a: 1, b: { carpan: 0.5, kaydirma: 10 } } }
const ortam = (lab: BirimOrtami['lab']): BirimOrtami => ({ birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }, lab, sayi: SAYI, olculer: { 'zz-olcek': OLCEK } })
const yakin = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`)

/** A tool of a test: a haemoglobin against a limit the country states; an optional second value of the country's own quantity. */
const TANIM: AracTanimi = {
  anahtar: 'zz-deneme',
  tur: 'hesap',
  alanlar: [sayi('hb', 2, 25, { lab: 'hemoglobin' }), sayi('ikinci', 0, 200, { lab: 'zz-olcek', istege: true }), { ...secim('ortam', ['x', 'y'], true), secenekSerbest: true }, secim('sinif', ['p', 'q'], true)],
  parametreler: ['hb_alt', 'gun'],
  parametreOlculeri: { hb_alt: 'hemoglobin' },
  sayiOlculeri: { hb: 'hemoglobin' },
  tablolar: [{ anahtar: 'satirlar', sutunlar: [{ anahtar: 'alt', tur: 'sayi', lab: 'hemoglobin' }, { anahtar: 'ad', tur: 'anahtar' }, { anahtar: 'puan', tur: 'sayi' }] }],
  cikti: { sayilar: ['hb'], bantlar: ['dusuk', 'normal'], uyarilar: [], tarihler: [] },
  bantSerbest: true,
  kaynak: null,
  hesapla: (g, { p }) => (sayiMi(g.hb) && sayiMi(p.hb_alt) ? { tamam: true, sayilar: [{ anahtar: 'hb', deger: g.hb, ondalik: 1 }], bant: g.hb < p.hb_alt ? 'dusuk' : 'normal', uyarilar: [], tarihler: [] } : BOS_SONUC),
}
const TABLO = { satirlar: { birimler: { alt: 'g/L' }, satirlar: [{ alt: 100, ad: 'bir', puan: 1 }, { alt: 120, ad: 'iki', puan: 2 }] } }
const PAKET: PaketAraci = { anahtar: 'zz-deneme', roller: ['r1'], metin: { ad: m('T'), aciklama: m('T'), alanlar: { hb: m('Hb'), ikinci: m('Second'), ortam: m('Setting'), sinif: m('Class') }, not: m('N') }, parametreler: { hb_alt: { deger: 110, birim: 'g/L' }, gun: 30 }, tablolar: TABLO }

describe('A. units: a country\'s own, more than one, and never a number without its unit', () => {
  it('a factor and a factor-with-shift convert both ways; an unknown unit converts to nothing', () => {
    yakin(birimdenKanonige(LAB_BIRIMLERI.hemoglobin, 'g/L', 110), 11)
    yakin(kanoniktenBirime(LAB_BIRIMLERI.hemoglobin, 'g/L', 11), 110)
    yakin(birimdenKanonige(OLCEK, 'b', 100), 60)
    yakin(kanoniktenBirime(OLCEK, 'b', 60), 100)
    yakin(birimdenKanonige(OLCEK, 'a', 60), 60)
    assert.equal(birimdenKanonige(OLCEK, 'c', 1), null)
    assert.equal(birimdenKanonige(null, 'a', 1), null)
    assert.equal(kanoniktenBirime(OLCEK, undefined, 1), null)
  })

  it('a quantity is the kit\'s by its key; a pack\'s own only where the kit has none of that key — the kit\'s is never overridden', () => {
    assert.equal(olcuTanimi('hemoglobin', { hemoglobin: OLCEK }), LAB_BIRIMLERI.hemoglobin)
    assert.equal(olcuTanimi('zz-olcek', { 'zz-olcek': OLCEK }), OLCEK)
    assert.equal(olcuTanimi('zz-olcek'), null)
    assert.equal(olcuTanimi(undefined), null)
  })

  it('ONE unit: exactly as before — the field is read in it, with no choice', () => {
    const o = ortam({ hemoglobin: 'g/L' })
    assert.deepEqual(alanBirimleri(TANIM.alanlar[0], o), ['g/L'])
    assert.equal(alanBirimi(TANIM.alanlar[0], o), 'g/L')
    assert.deepEqual(alanAraligi(TANIM.alanlar[0], o), { enAz: 20, enCok: 250 })
    const g = girdiyiCoz(TANIM.alanlar, { hb: '110' }, o)
    yakin(g.hb as number, 11)
    assert.deepEqual(okunamayanAlanlar(TANIM.alanlar, { hb: '110' }, g, o), [])
  })

  it('SEVERAL units: nothing is chosen for the doctor; the chosen one is read; one the pack does not accept is no choice', () => {
    const o = ortam({ hemoglobin: ['g/L', 'g/dL'] })
    assert.deepEqual(alanBirimleri(TANIM.alanlar[0], o), ['g/L', 'g/dL'])
    assert.equal(alanBirimi(TANIM.alanlar[0], o), null, 'no unit until one is chosen')
    assert.equal(alanAraligi(TANIM.alanlar[0], o), null, 'no range without a unit')
    assert.deepEqual(alanAraligi(TANIM.alanlar[0], o, 'g/dL'), { enAz: 2, enCok: 25 })
    yakin(girdiyiCoz(TANIM.alanlar, { hb: '110', [birimAnahtari('hb')]: 'g/L' }, o).hb as number, 11)
    yakin(girdiyiCoz(TANIM.alanlar, { hb: '11', [birimAnahtari('hb')]: 'g/dL' }, o).hb as number, 11)
    // the same digits in the other unit are out of that unit's range: nothing, not a wrong value
    assert.equal(girdiyiCoz(TANIM.alanlar, { hb: '110', [birimAnahtari('hb')]: 'g/dL' }, o).hb, null)
    assert.equal(girdiyiCoz(TANIM.alanlar, { hb: '11', [birimAnahtari('hb')]: 'mmol/L' }, o).hb, null, 'a unit the pack does not accept')
  })

  it('A NUMBER WITHOUT ITS UNIT IS NOT A VALUE: no value, and the field counts as not read — also where it is optional', () => {
    const o = ortam({ hemoglobin: ['g/L', 'g/dL'], 'zz-olcek': ['a', 'b'] })
    const ham = { hb: '110', ikinci: '50' }
    const g = girdiyiCoz(TANIM.alanlar, ham, o)
    assert.equal(g.hb, null)
    assert.equal(g.ikinci, null)
    assert.deepEqual(okunamayanAlanlar(TANIM.alanlar, ham, g, o), ['hb', 'ikinci'])
    assert.deepEqual(birimiSecilmeyenler(TANIM.alanlar, ham, g, o), ['hb', 'ikinci'])
    // the required one chosen, the OPTIONAL one still without its unit: still not read, so no result may be shown
    const ham2 = { hb: '110', [birimAnahtari('hb')]: 'g/L', ikinci: '50' }
    const g2 = girdiyiCoz(TANIM.alanlar, ham2, o)
    yakin(g2.hb as number, 11)
    assert.deepEqual(okunamayanAlanlar(TANIM.alanlar, ham2, g2, o), ['ikinci'], 'an optional value typed without its unit is never worked with as "left empty"')
    // nothing typed in the optional field: nothing to choose a unit for
    const ham3 = { hb: '110', [birimAnahtari('hb')]: 'g/L' }
    assert.deepEqual(okunamayanAlanlar(TANIM.alanlar, ham3, girdiyiCoz(TANIM.alanlar, ham3, o), o), [])
  })

  it('the chosen unit travels with the form and with what is kept; only a laboratory field carries one', () => {
    const o = ortam({ hemoglobin: ['g/L', 'g/dL'], 'zz-olcek': ['a', 'b'] })
    const ham = hamiSuz(TANIM.alanlar, { hb: '110', 'hb.birim': 'g/L', 'ortam.birim': 'g/L', 'yok.birim': 'x', ikinci: '100', 'ikinci.birim': 'b', hesapla: 'x' })
    assert.deepEqual(ham, { 'hb.birim': 'g/L', hb: '110', 'ikinci.birim': 'b', ikinci: '100' })
    const g = girdiyiCoz(TANIM.alanlar, ham, o)
    yakin(g.ikinci as number, 60)
    const gosterilen = hamdanGosterilen(TANIM.alanlar, ham, g, o)
    assert.equal(gosterilen.hb, 110, 'the number as it was typed')
    assert.equal(gosterilen['hb.birim'], 'g/L', 'and the unit it was typed in')
    assert.equal(gosterilen['ikinci.birim'], 'b')
    // one unit: nothing is added to what is kept (a record of before reads as before)
    const tek = ortam({ hemoglobin: 'g/L', 'zz-olcek': 'a' })
    assert.deepEqual(Object.keys(hamdanGosterilen(TANIM.alanlar, { hb: '110' }, girdiyiCoz(TANIM.alanlar, { hb: '110' }, tek), tek)).filter((k) => k.endsWith('.birim')), [])
  })
})

describe('B. the country\'s numbers and tables, in the country\'s units', () => {
  it('a laboratory limit is stated with its unit and converted; a bare number there is refused; a plain number stays plain', () => {
    const { p, eksik } = parametreleriCoz(TANIM, PAKET)
    yakin(p.hb_alt, 11)
    assert.equal(p.gun, 30)
    assert.deepEqual(eksik, [])
    assert.deepEqual(parametreleriCoz(TANIM, { parametreler: { hb_alt: 110, gun: 30 } }).eksik, ['hb_alt'], 'a bare number says nothing about its unit')
    assert.deepEqual(parametreleriCoz(TANIM, { parametreler: { hb_alt: { deger: 110, birim: 'mmol/L' }, gun: 30 } }).eksik, ['hb_alt'], 'a unit the kit cannot convert')
    assert.deepEqual(parametreleriCoz(TANIM, { parametreler: { hb_alt: { deger: 110, birim: 'g/L' }, gun: { deger: 30, birim: 'gun' } } }).eksik, ['gun'], 'a unit on a number that is not a laboratory value')
    assert.deepEqual(parametreleriCoz(TANIM, {}).eksik, ['hb_alt', 'gun'])
  })

  it('THE SAME LIMIT IN EITHER UNIT GIVES THE SAME ANSWER, whichever unit the value is typed in', () => {
    const o = ortam({ hemoglobin: ['g/L', 'g/dL'] })
    for (const sinir of [{ deger: 110, birim: 'g/L' }, { deger: 11, birim: 'g/dL' }]) {
      const x: GorunurArac = { tanim: TANIM, paket: { ...PAKET, parametreler: { hb_alt: sinir, gun: 30 } } }
      for (const [yazilan, birim, beklenen] of [['105', 'g/L', 'dusuk'], ['10.5', 'g/dL', 'dusuk'], ['115', 'g/L', 'normal'], ['11', 'g/dL', 'normal'], ['110', 'g/L', 'normal']] as const) {
        const g = girdiyiCoz(TANIM.alanlar, { hb: yazilan, 'hb.birim': birim }, o)
        assert.equal(aracCalistir(x, g, '2026-10-10').bant, beklenen, `${yazilan} ${birim} against ${sinir.deger} ${sinir.birim}`)
      }
    }
  })

  it('a table: every row, laboratory columns converted by the unit the table states; anything wrong = the table is missing', () => {
    const { t, eksik } = tablolariCoz(TANIM, PAKET)
    assert.deepEqual(eksik, [])
    assert.equal(t.satirlar.length, 2)
    yakin(t.satirlar[0].alt as number, 10)
    yakin(t.satirlar[1].alt as number, 12)
    assert.deepEqual([t.satirlar[0].ad, t.satirlar[0].puan], ['bir', 1])
    const yanlis = (veri: unknown) => tablolariCoz(TANIM, { tablolar: { satirlar: veri } } as never).eksik
    assert.deepEqual(yanlis(undefined), ['satirlar'])
    assert.deepEqual(yanlis({ birimler: { alt: 'g/L' }, satirlar: [] }), ['satirlar'], 'no row')
    assert.deepEqual(yanlis({ satirlar: [{ alt: 100, ad: 'bir', puan: 1 }] }), ['satirlar'], 'a laboratory column without its unit')
    assert.deepEqual(yanlis({ birimler: { alt: 'g/L' }, satirlar: [{ alt: 100, puan: 1 }] }), ['satirlar'], 'a column missing in a row')
    assert.deepEqual(yanlis({ birimler: { alt: 'g/L' }, satirlar: [{ alt: '100', ad: 'bir', puan: 1 }] }), ['satirlar'], 'a number written as text')
  })

  it('A MISSING NUMBER OR TABLE GIVES NO RESULT — never a result without the part that could not be worked out', () => {
    const tam: GorunurArac = { tanim: TANIM, paket: PAKET }
    assert.equal(aracCalistir(tam, { hb: 10, ikinci: null, ortam: null, sinif: null }, '2026-10-10').tamam, true)
    assert.deepEqual(Object.keys(aracOrtami(tam, '2026-10-10')!).sort(), ['bugun', 'p', 't'])
    for (const eksik of [{ parametreler: { gun: 30 } }, { parametreler: { hb_alt: 110, gun: 30 } }, { tablolar: undefined }]) {
      const x: GorunurArac = { tanim: TANIM, paket: { ...PAKET, ...eksik } as PaketAraci }
      assert.equal(aracOrtami(x, '2026-10-10'), null)
      assert.deepEqual(aracCalistir(x, { hb: 10, ikinci: null, ortam: null, sinif: null }, '2026-10-10'), BOS_SONUC)
    }
    // a tool that leaves nothing to the country is handed exactly what it was handed before: the day and no numbers
    assert.deepEqual(ulkeOrtami({ ...TANIM, parametreler: undefined, tablolar: undefined }, {}, '2026-10-10'), { bugun: '2026-10-10', p: {} })
  })
})

describe('C. a country\'s own bands and options', () => {
  const BANTLAR = { sayi: 'hb', birim: 'g/L', satirlar: [{ ust: 80, bant: 'cok-dusuk' }, { ust: 110, bant: 'dusuk' }, { ust: 160, dahil: true, bant: 'normal' }, { ust: null, bant: 'yuksek' }] }

  it('A PACK THAT RESTATES NOTHING GETS THE SAME OBJECT: nothing is wrapped, nothing can differ', () => {
    assert.equal(etkinTanim(TANIM, {}), TANIM)
    assert.equal(etkinTanim(TANIM, { uyarlama: {} }), TANIM)
    assert.equal(etkinTanim(TANIM, { uyarlama: { secenekler: {} } }), TANIM)
    for (const t of KIT_ARACLARI) assert.equal(etkinTanim(t, {}), t, t.anahtar)
  })

  it('its own bands over one number: another count, limits in its own unit, the first row the value is below', () => {
    const e = etkinTanim(TANIM, { uyarlama: { bantlar: BANTLAR } })
    assert.deepEqual(e.cikti.bantlar, ['cok-dusuk', 'dusuk', 'normal', 'yuksek'], 'four bands where the definition has two')
    const sinirlar = bantSinirlari(TANIM, BANTLAR)!
    for (const [x, y] of [[sinirlar[0], 8], [sinirlar[1], 11], [sinirlar[2], 16]] as const) yakin(x, y)
    assert.equal(sinirlar[3], null)
    const bant = (hb: number) => e.hesapla({ hb }, { bugun: '2026-10-10', p: { hb_alt: 11 } }).bant
    assert.deepEqual([7.9, 8, 10.9, 11, 16, 16.1, 24].map(bant), ['cok-dusuk', 'dusuk', 'dusuk', 'normal', 'normal', 'yuksek', 'yuksek'])
    // the rest of the result is the tool's own
    assert.deepEqual(e.hesapla({ hb: 9 }, { bugun: '2026-10-10', p: { hb_alt: 11 } }).sayilar, [{ anahtar: 'hb', deger: 9, ondalik: 1 }])
    assert.equal(e.hesapla({ hb: null }, { bugun: '2026-10-10', p: { hb_alt: 11 } }).tamam, false, 'no result stays no result')
  })

  it('EVERY VALUE FALLS IN A BAND, or there is no result at all: a number that is missing, a limit that cannot be converted', () => {
    assert.equal(bantBul(BANTLAR, [8, 11, 16, null], Number.NaN), null)
    assert.equal(bantBul({ sayi: 'hb', satirlar: [{ ust: 5, bant: 'a' }] }, [5], 9), null, 'a table without an open last row leaves a value out — the pack check refuses such a table')
    const kapali = etkinTanim(TANIM, { uyarlama: { bantlar: { sayi: 'hb', birim: 'g/L', satirlar: [{ ust: 110, bant: 'dusuk' }] } } })
    assert.deepEqual(kapali.hesapla({ hb: 20 }, { bugun: 'x', p: { hb_alt: 11 } }), BOS_SONUC, 'above the last limit: nothing is interpreted')
    const baskaSayi = etkinTanim(TANIM, { uyarlama: { bantlar: { ...BANTLAR, sayi: 'yok' } } })
    assert.deepEqual(baskaSayi.hesapla({ hb: 9 }, { bugun: 'x', p: { hb_alt: 11 } }), BOS_SONUC, 'the number the bands are read from is not in the result')
    assert.equal(bantSinirlari(TANIM, { ...BANTLAR, birim: 'mmol/L' }), null)
    assert.deepEqual(etkinTanim(TANIM, { uyarlama: { bantlar: { ...BANTLAR, birim: 'mmol/L' } } }).hesapla({ hb: 9 }, { bugun: 'x', p: { hb_alt: 11 } }), BOS_SONUC)
  })

  it('ONLY WHERE THE DEFINITION ALLOWS IT: bands of a tool that does not say so, options of a field that does not say so, are left as they are', () => {
    const kilitli = { ...TANIM, bantSerbest: undefined }
    const e = etkinTanim(kilitli, { uyarlama: { bantlar: BANTLAR } })
    assert.deepEqual(e.cikti.bantlar, ['dusuk', 'normal'])
    assert.equal(e.hesapla({ hb: 20 }, { bugun: 'x', p: { hb_alt: 11 } }).bant, 'normal')
    const s = etkinTanim(TANIM, { uyarlama: { secenekler: { ortam: ['bir', 'iki', 'uc'], sinif: ['z'] } } })
    assert.deepEqual(s.alanlar.find((a) => a.anahtar === 'ortam')!.secenekler, ['bir', 'iki', 'uc'], 'three options where the definition has two')
    assert.deepEqual(s.alanlar.find((a) => a.anahtar === 'sinif')!.secenekler, ['p', 'q'], 'a field the arithmetic may read keeps the kit\'s options')
    // the form is then read with the country's options
    assert.equal(girdiyiCoz(s.alanlar, { ortam: 'uc' }, ortam({})).ortam, 'uc')
    assert.equal(girdiyiCoz(s.alanlar, { ortam: 'x' }, ortam({})).ortam, null)
  })
})

describe('D. a tool by the patient\'s age and sex', () => {
  it('age in whole years on the day; a missing or later birth date is no age', () => {
    assert.equal(tamYas('2010-10-10', '2026-10-10'), 16)
    assert.equal(tamYas('2010-10-11', '2026-10-10'), 15)
    assert.equal(tamYas('2026-10-10', '2026-10-10'), 0)
    assert.equal(tamYas('2027-01-01', '2026-10-10'), null)
    assert.equal(tamYas('', '2026-10-10'), null)
    assert.equal(tamYas(null, '2026-10-10'), null)
    assert.equal(tamYas('2010-10-10', ''), null)
  })

  it('the decision: no gate; no patient; a patient who fits; a patient who does not', () => {
    const B = '2026-10-10'
    assert.equal(kapiSonucu(undefined, { dogumTarihi: '2020-01-01', cinsiyet: 'male' }, B), 'kapisiz')
    assert.equal(kapiSonucu({}, null, B), 'kapisiz')
    assert.equal(kapiSonucu({ enAzYas: 18 }, null, B), 'hastasiz')
    assert.equal(kapiSonucu({ enAzYas: 18 }, { dogumTarihi: '2008-10-10', cinsiyet: '' }, B), 'uygun')
    assert.equal(kapiSonucu({ enAzYas: 18 }, { dogumTarihi: '2008-10-11', cinsiyet: '' }, B), 'degil')
    assert.equal(kapiSonucu({ enCokYas: 7 }, { dogumTarihi: '2018-10-11' }, B), 'uygun')
    assert.equal(kapiSonucu({ enCokYas: 7 }, { dogumTarihi: '2018-10-10' }, B), 'degil')
    assert.equal(kapiSonucu({ cinsiyet: 'female' }, { cinsiyet: 'female' }, B), 'uygun')
    assert.equal(kapiSonucu({ cinsiyet: 'female' }, { cinsiyet: 'male' }, B), 'degil')
    assert.equal(kapiSonucu({ cinsiyet: 'male', enAzYas: 18 }, { dogumTarihi: '1970-01-01', cinsiyet: 'male' }, B), 'uygun')
    assert.equal(kapiSonucu({ cinsiyet: 'male', enAzYas: 18 }, { dogumTarihi: '1970-01-01', cinsiyet: 'female' }, B), 'degil')
  })

  it('WHAT IS NOT KNOWN NEVER FITS: no birth date does not pass an age limit, no recorded sex does not pass a sex limit', () => {
    const B = '2026-10-10'
    assert.equal(kapiSonucu({ enAzYas: 18 }, { dogumTarihi: '', cinsiyet: 'male' }, B), 'degil')
    assert.equal(kapiSonucu({ enCokYas: 7 }, { dogumTarihi: null }, B), 'degil')
    assert.equal(kapiSonucu({ enAzYas: 0 }, {}, B), 'degil')
    assert.equal(kapiSonucu({ cinsiyet: 'male' }, { dogumTarihi: '1970-01-01', cinsiyet: '' }, B), 'degil')
    assert.equal(kapiSonucu({ cinsiyet: 'male' }, { dogumTarihi: '1970-01-01', cinsiyet: 'other' }, B), 'degil')
    assert.equal(kapiSonucu({ enAzYas: 18 }, { dogumTarihi: '1970-01-01' }, 'not-a-day'), 'degil')
  })
})

describe('E. which mechanism, for whom', () => {
  const kitAnahtari = KIT_ARACLARI.find((t) => t.tur !== 'ekran')!.anahtar
  const metin = { ad: m('A'), aciklama: m('B'), alanlar: {}, not: m('N') }
  const icerik = (ek: Partial<UlkeAraclari> & { araclar: PaketAraci[] }): UlkeAraclari => ({ metinler: {}, birimler: {}, labBirimleri: {}, yuvalar: [], inceleme: { makineYazimi: true, klinisyen: null }, ...ek })

  it('the kit\'s mechanism wins by key; a pack\'s own serves its own key; a key nobody defines is no tool', () => {
    const sahte: AracTanimi = { ...TANIM, anahtar: kitAnahtari }
    const i = icerik({ araclar: [{ anahtar: kitAnahtari, roller: null, metin }, PAKET, { anahtar: 'zz-yok', roller: null, metin }], kendiAraclari: [sahte, TANIM] })
    assert.equal(paketinTanimi(i, i.araclar[0]), kitAraci(kitAnahtari), 'a pack cannot replace a mechanism of the kit by bringing one under its key')
    assert.equal(paketinTanimi(i, PAKET), TANIM)
    assert.equal(paketinTanimi(i, i.araclar[2]), null)
    assert.deepEqual(hesabinAraclari(i, 'r1').rol.map((x) => x.tanim.anahtar), ['zz-deneme'])
    assert.equal(hesabinAraci(i, 'r1', 'zz-yok'), null)
    assert.equal(paketinAraci(i, 'zz-deneme')?.tanim, TANIM)
    assert.equal(paketinAraci(i, 'zz-yok'), null)
    assert.equal(paketinAraci(null, 'zz-deneme'), null)
  })

  it('a link-out tile: no field, no arithmetic; never a key of the kit', () => {
    const i = icerik({ araclar: [{ anahtar: 'zz-baglanti', roller: null, metin: { ...metin, baglanti: m('Open') }, baglanti: { adres: 'https://example.org/x' } }, { anahtar: kitAnahtari, roller: null, metin, baglanti: { adres: 'https://example.org/x' } }] })
    const t = paketinTanimi(i, i.araclar[0])!
    assert.equal(t.tur, 'baglanti')
    assert.deepEqual(t.alanlar, [])
    assert.deepEqual(t.hesapla({}, { bugun: 'x', p: {} }), BOS_SONUC)
    assert.equal(paketinTanimi(i, i.araclar[1]), null, 'a tool of the kit is never turned into a link')
    assert.deepEqual(hesabinAraclari(i, null).temel.map((x) => x.tanim.anahtar), ['zz-baglanti'])
  })

  it('THE LICENCE IS A SECOND LOCK: a tool that is not free or permitted is on no grid and opens from no address', () => {
    for (const durum of ['izin-gerekli', 'ucretli', 'belirsiz'] as const) {
      const i = icerik({ araclar: [{ ...PAKET, roller: null, lisans: { durum, hakSahibi: 'X' } }], kendiAraclari: [TANIM] })
      assert.deepEqual(hesabinAraclari(i, 'r1'), { temel: [], rol: [] }, durum)
      assert.equal(hesabinAraci(i, 'r1', 'zz-deneme'), null, durum)
    }
    for (const durum of ['serbest', 'izin-alindi'] as const) {
      const i = icerik({ araclar: [{ ...PAKET, roller: null, lisans: { durum, hakSahibi: 'X', kaynak: 'Y' } }], kendiAraclari: [TANIM] })
      assert.equal(hesabinAraclari(i, 'r1').temel.length, 1, durum)
    }
  })

  it('opened for a patient, a tool that is not for that patient is not on the grid; without a patient it is', () => {
    const i = icerik({ araclar: [{ ...PAKET, roller: null, hasta: { enAzYas: 18 } }, { anahtar: 'zz-baglanti', roller: null, metin, baglanti: { adres: 'https://example.org/x' } }], kendiAraclari: [TANIM] })
    const cocuk = { hasta: { dogumTarihi: '2020-01-01', cinsiyet: '' }, bugun: '2026-10-10' }
    const yetiskin = { hasta: { dogumTarihi: '1980-01-01', cinsiyet: '' }, bugun: '2026-10-10' }
    assert.deepEqual(hesabinAraclari(i, null).temel.map((x) => x.tanim.anahtar), ['zz-deneme', 'zz-baglanti'])
    assert.deepEqual(hesabinAraclari(i, null, yetiskin).temel.map((x) => x.tanim.anahtar), ['zz-deneme', 'zz-baglanti'])
    assert.deepEqual(hesabinAraclari(i, null, cocuk).temel.map((x) => x.tanim.anahtar), ['zz-baglanti'])
    assert.deepEqual(hesabinAraclari(i, null, { hasta: {}, bugun: '2026-10-10' }).temel.map((x) => x.tanim.anahtar), ['zz-baglanti'], 'an unknown birth date')
    const x = hesabinAraci(i, null, 'zz-deneme')!
    assert.equal(aracinKapisi(x, null, '2026-10-10'), 'hastasiz')
    assert.equal(aracinKapisi(x, cocuk.hasta, '2026-10-10'), 'degil')
    assert.equal(aracinKapisi(x, yetiskin.hasta, '2026-10-10'), 'uygun')
  })

  it('EVERY DOCTOR ROLE: the doctor specialties and the clinic doctors, in the pack\'s order — never an allied profession', () => {
    assert.deepEqual(hekimRolleri([{ anahtar: 'a', taraf: 'doktor' }, { anahtar: 'm', taraf: 'klinik-muttefik' }, { anahtar: 'k', taraf: 'klinik-hekim' }, { anahtar: 'b', taraf: 'doktor' }]), ['a', 'k', 'b'])
    assert.deepEqual(hekimRolleri([]), [])
  })

  it('the summary: a value in the unit it was typed in, and the rights holder\'s notice wherever the result goes', () => {
    const o = ortam({ hemoglobin: ['g/L', 'g/dL'] })
    const x: GorunurArac = { tanim: TANIM, paket: { ...PAKET, metin: { ...PAKET.metin, sayilar: { hb: m('Hb') }, bantlar: { dusuk: m('Low'), normal: m('Normal') } }, lisans: { durum: 'izin-alindi', hakSahibi: 'X', kaynak: 'Y', bildirim: m('© X. Used with permission.') } } }
    const y: Yazici = { sayi: (d, n) => d.toFixed(n), tarih: (iso) => iso, birim: (k) => `[${k}]` }
    const am = { arac: { madde: 'Item %', oran: '%1 / %2' } } as never
    const ham = { hb: '105', 'hb.birim': 'g/L' }
    const g = girdiyiCoz(TANIM.alanlar, ham, o)
    const ozet = aracOzeti(x, hamdanGosterilen(TANIM.alanlar, ham, g, o), aracCalistir(x, g, '2026-10-10'), D, am, y, o)
    assert.match(ozet, /^T\nHb: 105 \[g\/L\]\n/)
    assert.match(ozet, /\nLow\nN\n© X\. Used with permission\.$/)
    // typed in the other unit: that unit is written
    const ham2 = { hb: '10.5', 'hb.birim': 'g/dL' }
    const g2 = girdiyiCoz(TANIM.alanlar, ham2, o)
    assert.match(aracOzeti(x, hamdanGosterilen(TANIM.alanlar, ham2, g2, o), aracCalistir(x, g2, '2026-10-10'), D, am, y, o), /\nHb: 10\.5 \[g\/dL\]\n/)
    // a tool without a notice ends with the line that says what it is not, as before
    assert.match(aracOzeti({ ...x, paket: { ...x.paket, lisans: undefined } }, hamdanGosterilen(TANIM.alanlar, ham, g, o), aracCalistir(x, g, '2026-10-10'), D, am, y, o), /\nLow\nN$/)
  })
})

describe('F. whose a key is', () => {
  it('a key belongs to a country when it carries the code of a country the product has — or the asking pack\'s own', () => {
    for (const kod of ULKE_KODLARI) assert.equal(anahtarUlkesi(`${kod}-x`), kod)
    assert.equal(anahtarUlkesi('ca-125'), 'ca')
    assert.equal(anahtarUlkesi('kv-risk'), null, 'two letters that are no country\'s code')
    assert.equal(anahtarUlkesi('zz-x'), null)
    assert.equal(anahtarUlkesi('zz-x', 'zz'), 'zz')
    assert.equal(anahtarUlkesi('cardiology'), null)
    assert.equal(anahtarUlkesi('c-a'), null)
    assert.equal(anahtarUlkesi(undefined), null)
    assert.equal(ulkeyeOzelMi('ca-x', 'ca'), true)
    assert.equal(ulkeyeOzelMi('ca-x', 'us'), false)
  })

  it('THE KIT HOLDS NO KEY OF A COUNTRY: every tool of the kit belongs to every country, and none is a link', () => {
    for (const t of KIT_ARACLARI) {
      assert.equal(anahtarUlkesi(t.anahtar), null, `${t.anahtar} carries a country's code`)
      assert.doesNotMatch(t.anahtar, /^[a-z]{2}-/, `${t.anahtar}: a key of the kit never begins with two letters and a hyphen, so that no future country's code can ever claim it`)
      assert.notEqual(t.tur, 'baglanti', t.anahtar)
    }
    for (const olcu of Object.keys(LAB_BIRIMLERI)) assert.doesNotMatch(olcu, /-/, `${olcu}: a quantity of the kit carries no hyphen, so a pack's own can never be taken for it`)
  })

  it('the keys of a pack that carry a country\'s code: tools, placeholders and its own mechanisms, each once', () => {
    const i: UlkeAraclari = { metinler: {}, birimler: {}, labBirimleri: {}, inceleme: { makineYazimi: true, klinisyen: null }, araclar: [{ ...PAKET, anahtar: 'zz-b' }, { ...PAKET, anahtar: 'pasi' }], yuvalar: [{ anahtar: 'zz-a', acik: false, icerik: null, mekanizmaHazir: false, eksik: 'x', kimden: 'y', roller: null }, { anahtar: 'kv-risk', acik: false, icerik: null, mekanizmaHazir: false, eksik: 'x', kimden: 'y', roller: null }], kendiAraclari: [{ ...TANIM, anahtar: 'zz-b' }] }
    assert.deepEqual(ulkeyeOzelAnahtarlar(i, 'zz'), ['zz-a', 'zz-b'])
    assert.deepEqual(ulkeyeOzelAnahtarlar(i), [])
    assert.deepEqual(ulkeyeOzelAnahtarlar(null), [])
  })
})
