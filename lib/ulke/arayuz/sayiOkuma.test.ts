/**
 * NOTYA-ULKE-DENETIM-01a — A TYPED NUMBER IS READ BY THE COUNTRY'S OWN RULES, OR REFUSED. Never guessed.
 *
 * The fault this guards against, seen on the Canada build: a day limit typed "1,500" (mg) was read as 1.5, and the
 * tool answered "0.75 mg", because the kit turned the first comma into a point whatever the country.
 *
 * Every pack is read here side by side (countries/tumu, tests only), with its own `bicim`:
 *   - the five English-speaking packs: the point is the decimal mark; a comma only as correct thousands grouping;
 *   - Uzbekistan: the comma is the decimal mark; a space groups thousands; a point is a decimal mark only where it
 *     cannot be thousands;
 *   - and the tools' own reading (lib/ulke/araclar/girdi.ts), with the very tool and values of the audit.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { TUM_ULKELER } from '@/countries/tumu'
import type { BirimOrtami } from '../araclar/birimler'
import { girdiyiCoz, hamdanGosterilen, okunamayanAlanlar } from '../araclar/girdi'
import { DOZ_HESABI } from '../araclar/tanimlar/ortoPediRadyoRoma'
import type { UlkeKodu } from '../tipler'
import { sayiCozKuralla, sayiYaziliyorMu } from './sayiOkuma'

const KOK = resolve(__dirname, '../../..')
const INGILIZCE: readonly UlkeKodu[] = ['gb', 'us', 'ca', 'au', 'nz']
const ALTI: readonly UlkeKodu[] = [...INGILIZCE, 'uz']
const kural = (kod: UlkeKodu) => TUM_ULKELER[kod].paket.bicim
/** The number, or why there is none. */
const oku = (kod: UlkeKodu, ham: string): number | 'bos' | 'okunamadi' => { const o = sayiCozKuralla(ham, kural(kod)); return o.tamam ? o.sayi : o.neden }
const YOK = 'okunamadi' as const

describe('a typed number — what each pack states', () => {
  it('the five English-speaking packs: point for decimals, comma for thousands; Uzbekistan: comma for decimals, space for thousands', () => {
    for (const kod of INGILIZCE) assert.deepEqual([kural(kod).ondalikAyraci, kural(kod).binlikAyraci], ['.', ','], kod)
    assert.deepEqual([kural('uz').ondalikAyraci, kural('uz').binlikAyraci], [',', ' '])
  })
})

describe('a typed number — the five English-speaking packs', () => {
  const BEKLENEN: readonly (readonly [string, number | 'bos' | 'okunamadi'])[] = [
    // the cases of the brief
    ['1,500', 1500], ['1,5', YOK], ['1.5', 1.5], ['1.500', 1.5], ['12,345.6', 12345.6], ['1 500', 1500], ['', 'bos'], ['   ', 'bos'], ['-5', -5], ['abc', YOK],
    // a comma is thousands ONLY as correct grouping: groups of exactly three, a first group that does not begin with 0
    ['1,50', YOK], ['1,5000', YOK], ['12,34', YOK], ['1,500,000', 1500000], ['1,500,00', YOK], ['1,,500', YOK], ['0,125', YOK], ['01,500', YOK], [',5', YOK], ['5,', YOK], ['1,500,', YOK],
    // never after the decimal mark, never two kinds of grouping, never two decimal marks
    ['1.500,5', YOK], ['1,500 000', YOK], ['1.5.5', YOK], ['1.234,5', YOK],
    // a digit on both sides of the decimal mark
    ['.5', YOK], ['5.', YOK], ['0.5', 0.5], ['18.5', 18.5], ['1,500.25', 1500.25],
    // a space groups thousands in every country (also the no-break, narrow no-break and thin space), correctly or not at all
    ['1 500.5', 1500.5], ['1 500', 1500], ['1 500', 1500], ['1 500', 1500], ['1 50', YOK], ['1 5000', YOK], ['12 5', YOK],
    // signs, letters, exponents, other digits
    ['-1,500.5', -1500.5], ['−5', -5], ['-', YOK], ['- 5', YOK], ['+5', YOK], ['5-', YOK], ['12abc', YOK], ['1e3', YOK], ['0x10', YOK], ['Infinity', YOK], ['NaN', YOK], ['٣', YOK], ['１２', YOK], ["1'500", YOK],
    ['0', 0], ['-0', 0], ['007', 7], [' 36.6 ', 36.6], ['1234567890123456789012345', YOK],
  ]
  for (const kod of INGILIZCE) {
    it(`${kod}: every text is read as this country writes numbers, or refused`, () => {
      for (const [ham, beklenen] of BEKLENEN) assert.deepEqual(oku(kod, ham), beklenen, `${kod}: ${JSON.stringify(ham)}`)
    })
  }
})

describe('a typed number — Uzbekistan', () => {
  it('the comma is the decimal mark, a space groups thousands; a point is read as a decimal mark only where it cannot be thousands', () => {
    const BEKLENEN: readonly (readonly [string, number | 'bos' | 'okunamadi'])[] = [
      // the cases of the brief
      ['1,500', 1.5], ['1,5', 1.5], ['1.5', 1.5], ['1.500', YOK], ['12,345.6', YOK], ['1 500', 1500], ['', 'bos'], ['   ', 'bos'], ['-5', -5], ['abc', YOK],
      // comma: once, a digit on both sides
      ['18,5', 18.5], ['0,125', 0.125], ['1,5,5', YOK], [',5', YOK], ['5,', YOK], ['-1,5', -1.5],
      // space (also no-break, narrow no-break, thin): correct grouping or nothing
      ['1 500,5', 1500.5], ['12 345,6', 12345.6], ['1 500', 1500], ['1 500,25', 1500.25], ['1 500', 1500], ['1 50', YOK], ['1 5000', YOK], ['1 500 00', YOK], ['1,500 000', YOK],
      // THE POINT. Many phone keypads offer no comma, so a point is a decimal mark — unless the text could be thousands
      // written with points, as prices often are here ("1.500", "12.345.678"). Then it is refused.
      ['1.50', 1.5], ['36.6', 36.6], ['0.125', 0.125], ['0.5', 0.5], ['1234.500', 1234.5], ['1.5000', 1.5],
      ['12.500', YOK], ['123.456', YOK], ['1.500.000', YOK], ['12.345.678', YOK], ['1.500,5', YOK], ['1 500.5', YOK], ['.5', YOK], ['5.', YOK], ['1.5.5', YOK],
      // signs, letters, exponents
      ['−1,5', -1.5], ['-', YOK], ['+5', YOK], ['12abc', YOK], ['1e3', YOK], ['0', 0], ['-0', 0],
    ]
    for (const [ham, beklenen] of BEKLENEN) assert.deepEqual(oku('uz', ham), beklenen, `uz: ${JSON.stringify(ham)}`)
  })
})

describe('a typed number — the rule is the pack\'s, whatever the pack', () => {
  it('a pack whose thousands mark is the point (the pre-split application\'s) reads "1.500" as one thousand five hundred and refuses "1.5"', () => {
    const tr = { ondalikAyraci: ',', binlikAyraci: '.' } as const
    assert.deepEqual(sayiCozKuralla('1.500', tr), { tamam: true, sayi: 1500 })
    assert.deepEqual(sayiCozKuralla('1.500,25', tr), { tamam: true, sayi: 1500.25 })
    assert.deepEqual(sayiCozKuralla('1,5', tr), { tamam: true, sayi: 1.5 })
    assert.equal(sayiCozKuralla('1.5', tr).tamam, false)
    assert.equal(sayiCozKuralla('1,500.5', tr).tamam, false)
  })

  it('what is read is the same number the country WRITES: every pack reads back its own writing of a number', async () => {
    const { sayiYazKuralla } = await import('./sayi')
    for (const kod of ALTI) {
      for (const [n, hane] of [[0, 0], [7, 0], [1500, 0], [12345.6, 1], [1234567.25, 2], [0.5, 1], [-1500.5, 1], [999, 0], [1000, 0]] as const) {
        const yazilan = sayiYazKuralla(n, kural(kod), hane)
        assert.deepEqual(sayiCozKuralla(yazilan, kural(kod)), { tamam: true, sayi: n }, `${kod}: ${yazilan}`)
      }
    }
  })

  it('nothing but a text is a number; a refusal says whether anything was typed', () => {
    for (const kod of ALTI) {
      for (const x of [null, undefined, 5, true, {}, []]) assert.deepEqual(sayiCozKuralla(x, kural(kod)), { tamam: false, neden: 'bos' })
      assert.deepEqual(sayiCozKuralla('?', kural(kod)), { tamam: false, neden: 'okunamadi' })
    }
  })

  it('while typing: a text that can still become a number is waited for; one that cannot is said at once', () => {
    for (const kod of INGILIZCE) {
      for (const ham of ['', '1', '1,', '1,5', '1,50', '1,500', '18.', '-', '-1', '1 ', '1 5']) assert.equal(sayiYaziliyorMu(ham, kural(kod)), true, `${kod}: ${JSON.stringify(ham)}`)
      for (const ham of ['abc', '1,5000', '1,,', '1.5.', '1,5.', '0,1']) assert.equal(sayiYaziliyorMu(ham, kural(kod)), false, `${kod}: ${JSON.stringify(ham)}`)
    }
    for (const ham of ['1,', '1.', '1.5', '1.500', '1 ', '12 3']) assert.equal(sayiYaziliyorMu(ham, kural('uz')), true, `uz: ${JSON.stringify(ham)}`)
    for (const ham of ['1.500.', '1,5,', 'x']) assert.equal(sayiYaziliyorMu(ham, kural('uz')), false, `uz: ${JSON.stringify(ham)}`)
  })
})

describe('the tools read a typed number with the same rules — the audit\'s own case', () => {
  const ortam = (kod: UlkeKodu): BirimOrtami => { const p = TUM_ULKELER[kod].paket; return { birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }, lab: {}, sayi: p.bicim } }
  const doz = (kod: UlkeKodu, ham: Record<string, string>) => {
    const o = ortam(kod)
    const g = girdiyiCoz(DOZ_HESABI.alanlar, ham, o)
    return { g, okunamayan: okunamayanAlanlar(DOZ_HESABI.alanlar, ham, g, o), sonuc: DOZ_HESABI.hesapla(g, { bugun: '2026-10-10', p: {} }), gosterilen: hamdanGosterilen(DOZ_HESABI.alanlar, ham, g, o) }
  }
  const sayi = (s: ReturnType<typeof doz>['sonuc'], anahtar: string) => s.sayilar.find((x) => x.anahtar === anahtar)?.deger ?? null

  for (const kod of INGILIZCE) {
    it(`${kod}: 18.5 kg, 50 mg/kg a day in 2 doses, a day limit typed "1,500" is ONE THOUSAND FIVE HUNDRED — 462.50 mg each time, not 0.75`, () => {
      const temel = { kilo: '18.5', mg_kg: '50', mod: 'gun', doz_sayisi: '2' }
      const virgullu = doz(kod, { ...temel, tavan_gun_mg: '1,500' })
      const duz = doz(kod, { ...temel, tavan_gun_mg: '1500' })
      assert.equal(virgullu.g.tavan_gun_mg, 1500)
      assert.deepEqual(virgullu.sonuc, duz.sonuc)
      assert.equal(sayi(virgullu.sonuc, 'doz_mg'), 462.5)
      assert.equal(sayi(virgullu.sonuc, 'tavanli_doz_mg'), null, 'the day\'s dose (925 mg) is under the limit: nothing is held to it')
      assert.deepEqual(virgullu.okunamayan, [])
      assert.equal(virgullu.gosterilen.tavan_gun_mg, 1500, 'the summary repeats the number that was read')
    })

    it(`${kod}: a text that cannot be read is NOTHING and is reported — the weight "18,5", the optional limit "1,5"`, () => {
      const kilo = doz(kod, { kilo: '18,5', mg_kg: '50', mod: 'gun', doz_sayisi: '2' })
      assert.equal(kilo.g.kilo, null); assert.equal(kilo.sonuc.tamam, false); assert.deepEqual(kilo.okunamayan, ['kilo'])
      // An optional field: the arithmetic alone would go on without a limit. The screen and the server refuse the
      // whole form while this list is not empty (components/ulke/uygulama/Araclar.tsx, lib/ulke/araclar/kayit.ts).
      const limit = doz(kod, { kilo: '18.5', mg_kg: '50', mod: 'gun', doz_sayisi: '2', tavan_gun_mg: '1,5' })
      assert.equal(limit.g.tavan_gun_mg, null); assert.deepEqual(limit.okunamayan, ['tavan_gun_mg'])
    })
  }

  it('uz: the decimal comma is read as before ("18,5" kg), a space groups thousands ("1 500"), and "1.500" is refused, not guessed', () => {
    const temel = { mg_kg: '50', mod: 'gun', doz_sayisi: '2' }
    const a = doz('uz', { ...temel, kilo: '18,5', tavan_gun_mg: '1 500' })
    assert.equal(a.g.kilo, 18.5); assert.equal(a.g.tavan_gun_mg, 1500); assert.equal(sayi(a.sonuc, 'doz_mg'), 462.5); assert.deepEqual(a.okunamayan, [])
    const b = doz('uz', { ...temel, kilo: '18.5', tavan_gun_mg: '1.500' })
    assert.equal(b.g.kilo, 18.5); assert.equal(b.g.tavan_gun_mg, null); assert.deepEqual(b.okunamayan, ['tavan_gun_mg'])
    // "1,500" is one and a half here: the comma is this country's decimal mark.
    assert.equal(doz('uz', { ...temel, kilo: '18,5', tavan_gun_mg: '1,500' }).g.tavan_gun_mg, 1.5)
  })

  it('a field that is empty, or not there for this input, is not "unreadable"', () => {
    const o = ortam('us')
    const ham = { kilo: '18.5', mg_kg: '', mod: 'gun' }
    assert.deepEqual(okunamayanAlanlar(DOZ_HESABI.alanlar, ham, girdiyiCoz(DOZ_HESABI.alanlar, ham, o), o), [])
  })
})

describe('ONE PARSER: no other code of the country kit reads a typed number or draws a browser\'s own date or time field', () => {
  const DIZINLER = ['lib/ulke', 'components/ulke', 'countries', 'app']
  function gez(dizin: string, cikti: string[] = []): string[] {
    for (const ad of readdirSync(join(KOK, dizin)).sort()) {
      if (ad === 'node_modules' || ad === '.next') continue
      const yol = `${dizin}/${ad}`
      if (statSync(join(KOK, yol)).isDirectory()) gez(yol, cikti)
      else if (/\.(ts|tsx|mjs|mts)$/.test(ad) && !/\.test\.tsx?$/.test(ad)) cikti.push(yol)
    }
    return cikti
  }
  // The kit: everything under lib/ulke, components/ulke and countries (but the pre-split application's own pack), and
  // every country route (*.ulke.*). Comments are not code.
  const dosyalar = [...DIZINLER.flatMap((d) => gez(d)), 'middleware.ulke.ts'].filter((f) => (f.startsWith('app/') ? /\.ulke\.(ts|tsx)$/.test(f) : !f.startsWith('countries/tr/')))
  const kod = (f: string) => readFileSync(join(KOK, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')

  it('the kit is what is scanned: its three folders and the country routes', () => {
    assert.ok(dosyalar.length > 150, String(dosyalar.length))
    for (const f of ['lib/ulke/araclar/girdi.ts', 'components/ulke/portal/HastaFormu.tsx', 'components/ulke/uygulama/Takvim.tsx', 'app/portal/page.ulke.tsx', 'countries/_dil/en/uygulama.ts']) assert.ok(dosyalar.includes(f), f)
  })

  it('no comma is turned into a point, and nothing is parsed with parseFloat: a typed number goes through lib/ulke/arayuz/sayiOkuma.ts', () => {
    for (const f of dosyalar) {
      const k = kod(f)
      assert.doesNotMatch(k, /\.replace\(\s*(['"`],['"`]|\/,\/g?)\s*,\s*['"`]\.['"`]\s*\)/, `${f}: turns a comma into a point — read a typed number with sayiCozKuralla`)
      assert.doesNotMatch(k, /\bparseFloat\s*\(/, `${f}: parseFloat reads "1,500" as 1 — read a typed number with sayiCozKuralla`)
    }
  })

  it('no browser date, time or date-and-time field: a day and a time are typed in components/ulke/girdi/, in the pack\'s order and clock', () => {
    for (const f of dosyalar) assert.doesNotMatch(kod(f), /type\s*[=:]\s*\{?\s*['"`](date|time|datetime-local|month|week)['"`]/, `${f}: a browser's own date or time field follows the browser's language, not the country`)
  })

  it('a field with the decimal keypad is the kit\'s one number field', () => {
    const olanlar = dosyalar.filter((f) => /inputMode=["']decimal["']/.test(kod(f)))
    assert.deepEqual(olanlar, ['components/ulke/girdi/SayiGirisi.tsx'])
  })
})
