/**
 * Uzbekistan — THE PACK AGAINST THE COUNTRY'S STANDARDS. Country audit of 2026-10-09: docs/COUNTRY-AUDIT-UZBEKISTAN.md
 * (the standards sheet with its sources is Part A there; the letters in the test names are its items).
 *
 * What this file holds: the settings the audit found to conform, so that none of them changes unnoticed; the
 * structure of the personal identification number as the state defines it; and the MECHANICAL conformity of every
 * text of the pack: script purity, the apostrophe letters of the Uzbek Latin alphabet, Russian typography basics,
 * numbers and dates inside sentences, and nothing left of another country's language.
 *
 * What it cannot hold: whether a sentence is good Uzbek or good Russian. Every text of the pack is machine-written
 * and has been read by no native speaker; a test can only say that the letters are the right letters.
 */
process.env.NOTYA_COUNTRY = 'uz'

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { UZ_PAKETI } from './index'
import { UZ_ARAYUZ } from './arayuz'
import * as KLINIK from './klinik/index'
import { uzJshshirNazoratRaqami, uzJshshirYapisiGecerliMi } from './kimlik'

type Bicim = 'uz-Latn' | 'uz-Cyrl' | 'ru'
type Metin = { yol: string; s: string }
const BICIMLER: readonly Bicim[] = ['uz-Latn', 'uz-Cyrl', 'ru']

/**
 * Every text of the pack, by the form it is written in. A text belongs to the form named by the FIRST form key on
 * its path (`metinler['uz-Latn'].…`, or a leaf `{ 'uz-Latn', 'uz-Cyrl', ru }`); a key `ru` further down a catalogue
 * is a word of that catalogue (the name of the Russian language), not a form.
 */
function metinleriTopla(): Record<Bicim, Metin[]> {
  const cikti: Record<Bicim, Metin[]> = { 'uz-Latn': [], 'uz-Cyrl': [], ru: [] }
  const gorulen = new Map<object, Set<string>>()
  const gez = (x: unknown, yol: string, bicim: Bicim | null) => {
    if (typeof x === 'string') { if (bicim) cikti[bicim].push({ yol, s: x }); return }
    if (!x || typeof x !== 'object') return
    const iz = gorulen.get(x) ?? new Set<string>()
    if (iz.has(bicim ?? '-')) return
    iz.add(bicim ?? '-'); gorulen.set(x, iz)
    for (const [k, v] of Object.entries(x)) gez(v, `${yol}.${k}`, bicim === null && (BICIMLER as readonly string[]).includes(k) ? (k as Bicim) : bicim)
  }
  gez(UZ_PAKETI, 'paket', null)
  gez(UZ_ARAYUZ, 'arayuz', null)
  gez(KLINIK, 'klinik', null)
  return cikti
}
const M = metinleriTopla()
const bul = (l: Metin[], re: RegExp) => l.filter((x) => re.test(x.s)).map((x) => `${x.yol}: ${JSON.stringify(x.s.slice(0, 120))}`)
/** Words that hold a Latin letter and a Cyrillic letter at once. */
const karisikSozler = (l: Metin[]) => l.flatMap((x) => (x.s.match(/[\p{L}\p{M}ʻʼ]+/gu) ?? []).filter((w) => /[A-Za-z]/.test(w) && /[Ѐ-ӿ]/.test(w)).map((w) => `${x.yol}: ${w}`))

describe('Uzbekistan — the settings the audit found to conform (docs/COUNTRY-AUDIT-UZBEKISTAN.md, Part A)', () => {
  it('A1, A3, A4, A5: day.month.year with dots, the 24-hour clock, weeks from Monday, decimal comma and a space between thousands', () => {
    assert.equal(UZ_PAKETI.bicim.tarihDeseni, 'DD.MM.YYYY')
    assert.equal(UZ_PAKETI.uygulama?.saatBicimi, 24)
    assert.equal(UZ_PAKETI.bicim.haftaBasi, 1)
    assert.equal(UZ_PAKETI.bicim.ondalikAyraci, ',')
    assert.equal(UZ_PAKETI.bicim.binlikAyraci, ' ')
  })

  it('A1: the hint a doctor reads beside a typed date has the pattern\'s own order and separator, in the letters of each form', () => {
    const r = UZ_ARAYUZ.randevuMetinleri
    assert.equal(r['uz-Latn'].form.tarihOrnek, 'KK.OO.YYYY') // kun, oy, yil
    assert.equal(r['uz-Cyrl'].form.tarihOrnek, 'КК.ОО.ЙЙЙЙ') // кун, ой, йил
    assert.equal(r.ru.form.tarihOrnek, 'ДД.ММ.ГГГГ') // день, месяц, год
    for (const b of BICIMLER) {
      assert.match(r[b].form.tarihOrnek, /^(.)\1\.(.)\2\.(.)\3\3\3$/u, b)
      assert.ok(r[b].form.tarihGecersiz.includes(r[b].form.tarihOrnek), `${b}: the error sentence names another pattern than the hint`)
    }
  })

  it('A2: seven weekday names in each form, Monday first, each in its own script', () => {
    const r = UZ_ARAYUZ.randevuMetinleri
    assert.deepEqual(Object.values(r['uz-Latn'].gunUzun), ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'])
    assert.deepEqual(Object.values(r['uz-Cyrl'].gunUzun), ['Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба', 'Якшанба'])
    assert.deepEqual(Object.values(r.ru.gunUzun), ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'])
    assert.deepEqual(Object.values(r.ru.gunKisa), ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'])
    for (const b of BICIMLER) assert.deepEqual(Object.keys(r[b].gunKisa), ['1', '2', '3', '4', '5', '6', '7'], b)
  })

  it('A6: the soʻm — code UZS, no decimals, and the word of each form on the price line', () => {
    assert.deepEqual(UZ_PAKETI.paraBirimi, { kod: 'UZS', simge: 'soʻm', ondalikHane: 0 })
    const a = UZ_ARAYUZ.acilis!.icerik
    assert.match(a['uz-Latn'].narx.oylik, /soʻm/)
    assert.match(a['uz-Cyrl'].narx.oylik, /сўм/)
    assert.match(a.ru.narx.oylik, /сум/)
  })

  it('A7: one time zone, five hours ahead of UTC all year (no daylight saving time in the zone data)', () => {
    assert.equal(UZ_PAKETI.saatDilimi, 'Asia/Tashkent')
    assert.deepEqual(UZ_PAKETI.uygulama?.saatDilimleri, ['Asia/Tashkent'])
    for (let ay = 0; ay < 12; ay++) {
      const ad = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tashkent', timeZoneName: 'longOffset' }).formatToParts(new Date(Date.UTC(2026, ay, 15, 12))).find((p) => p.type === 'timeZoneName')?.value
      assert.equal(ad, 'GMT+05:00', `month ${ay + 1}`)
    }
  })

  it('A8: kilograms, centimetres, degrees Celsius', () => {
    assert.deepEqual(UZ_PAKETI.uygulama?.birimler, { agirlik: 'kg', boy: 'cm', sicaklik: 'C' })
  })

  it('A10: the ambulance number is 103 and it stands in no sentence of any catalogue', () => {
    assert.equal(UZ_PAKETI.uygulama?.portal?.acilNumara, '103')
    for (const b of BICIMLER) assert.deepEqual(bul(M[b], /(?<![\d,.])(?:103|112)(?![\d,.])/), [], b)
  })

  it('A16: +998 and nine digits; the example is written +998 XX XXX XX XX and passes the pack\'s own rule', () => {
    assert.equal(UZ_PAKETI.telefon.ulkeOnEki, '+998')
    assert.equal(UZ_PAKETI.telefon.ulusalHane, 9)
    assert.match(UZ_PAKETI.telefon.ornek, /^\+998 \d{2} \d{3} \d{2} \d{2}$/)
    assert.equal(UZ_PAKETI.telefon.cepGecerliMi(UZ_PAKETI.telefon.ornek), true)
  })

  it('A14: family name and given name, then the patronymic in a field of its own, in the three forms', () => {
    assert.equal(UZ_PAKETI.uygulama?.adAlanlari.ikinciAd, true)
    const y = (b: Bicim) => UZ_ARAYUZ.metinler[b].yeniHasta
    assert.deepEqual([y('uz-Latn').ad, y('uz-Latn').otaIsmi], ['Familiyasi va ismi', 'Otasining ismi'])
    assert.deepEqual([y('uz-Cyrl').ad, y('uz-Cyrl').otaIsmi], ['Фамилияси ва исми', 'Отасининг исми'])
    assert.deepEqual([y('ru').ad, y('ru').otaIsmi], ['Фамилия и имя', 'Отчество'])
  })

  it('the runtime has the locale data the pack names (sorting a patient list uses it)', () => {
    assert.deepEqual(Intl.Collator.supportedLocalesOf([UZ_PAKETI.bicim.yerel, 'uz-Cyrl-UZ', 'ru']), ['uz-Latn-UZ', 'uz-Cyrl-UZ', 'ru'])
    // The Uzbek alphabet puts oʻ and gʻ after z, then sh and ch: the collation the pack's locale brings does so.
    assert.deepEqual(['shifo', 'oʻrik', 'zira', 'olma', 'gʻoza', 'chiroq', 'gul'].sort(new Intl.Collator(UZ_PAKETI.bicim.yerel).compare), ['gul', 'olma', 'zira', 'oʻrik', 'gʻoza', 'shifo', 'chiroq'])
  })
})

describe('Uzbekistan — the personal identification number as the state defines it (A13; https://lex.uz/docs/5955665)', () => {
  it('the regulation\'s own two examples have the structure, and their control digits are what the rule gives', () => {
    assert.equal(uzJshshirNazoratRaqami('3121093204024'), 7) // a man born 12 October 1993
    assert.equal(uzJshshirNazoratRaqami('4020190205001'), 0) // a woman born 2 January 1990
    assert.equal(uzJshshirYapisiGecerliMi('31210932040247'), true)
    assert.equal(uzJshshirYapisiGecerliMi('40201902050010'), true)
    assert.equal(uzJshshirYapisiGecerliMi(' 40201902050010 '), true)
  })

  it('a wrong control digit, a first digit outside 1–6, a date that does not exist, another length and anything that is not digits are refused', () => {
    for (const ham of ['31210932040248', '71210932040247', '03121093204024', '33102932040241', '3121093204024', '312109320402470', '3 121093 204 024 7', '3121093204024X', '', '10000000146']) assert.equal(uzJshshirYapisiGecerliMi(ham), false, ham)
    // 31 February: the digits are right for the weights, the day is not a day.
    const sahte = '3310290204024'
    assert.equal(uzJshshirYapisiGecerliMi(`${sahte}${uzJshshirNazoratRaqami(sahte)}`), false)
    assert.equal(uzJshshirYapisiGecerliMi(null), false)
  })

  it('the pack does NOT apply it: the number is stored as typed, and the pack\'s own rule is still "14 digits" (the owner\'s standing choice)', () => {
    assert.equal(UZ_PAKETI.uygulama?.kimlikNumarasi.dogrula, false)
    assert.equal(UZ_PAKETI.ulusalKimlik?.hane, 14)
    assert.equal(UZ_PAKETI.ulusalKimlik?.gecerliMi('12345678901234'), true)
    assert.equal(uzJshshirYapisiGecerliMi('12345678901234'), false)
    const y = (b: Bicim) => UZ_ARAYUZ.metinler[b].yeniHasta.ulusalKimlik
    assert.deepEqual([UZ_PAKETI.ulusalKimlik?.ad, y('uz-Latn'), y('uz-Cyrl'), y('ru')], ['JSHSHIR', 'JSHSHIR', 'ЖШШИР', 'ПИНФЛ'])
  })
})

describe('Uzbekistan — mechanical conformity of every text (A18; machine-written, read by no native speaker)', () => {
  it('there is something to check: more than two thousand texts in each form', () => {
    for (const b of BICIMLER) assert.ok(M[b].length > 2000, `${b}: ${M[b].length}`)
  })

  it('UZBEK LATIN: no Cyrillic letter; oʻ and gʻ with U+02BB and only there; the tutuq belgisi is U+02BC; no ASCII apostrophe, backtick or typographic quote stands in for either', () => {
    const l = M['uz-Latn']
    assert.deepEqual(bul(l, /[Ѐ-ӿ]/), [], 'a Cyrillic letter in Latin text')
    assert.deepEqual(bul(l, /['`´‘’]/), [], 'an apostrophe that is not one of the two letters')
    assert.deepEqual(bul(l, /(?<![oOgG])ʻ/), [], 'U+02BB after a letter other than o or g')
    assert.deepEqual(bul(l, /[oOgG]ʼ/), [], 'U+02BC where oʻ or gʻ is meant')
    assert.deepEqual(bul(l, /ʼ(?![\p{L}])|(?<![\p{L}])ʼ/u), [], 'a tutuq belgisi that is not inside a word')
    assert.ok(l.some((x) => /ʻ/.test(x.s)) && l.some((x) => /ʼ/.test(x.s)))
  })

  it('UZBEK LATIN: no letter of another alphabet (Turkish ç ş ğ ı İ ö ü, or accented letters)', () => {
    assert.deepEqual(bul(M['uz-Latn'], /[çşğıİöüÇŞĞÖÜâîûáéíóúñäßøå]/), [])
  })

  it('UZBEK CYRILLIC: no Latin apostrophe letter, and no word that mixes the two scripts', () => {
    const l = M['uz-Cyrl']
    assert.deepEqual(bul(l, /[ʻʼ'`´‘’]/), [])
    assert.deepEqual(karisikSozler(l), [])
    assert.ok(l.some((x) => /[ўқғҳ]/.test(x.s)))
  })

  it('RUSSIAN: none of the four letters only Uzbek has, no word that mixes the two scripts, «» and never straight quotes, a dash and never a spaced hyphen', () => {
    const l = M.ru
    assert.deepEqual(bul(l, /[ўқғҳЎҚҒҲ]/), [], 'an Uzbek letter in Russian text')
    assert.deepEqual(bul(l, /[ʻʼ]/), [])
    assert.deepEqual(karisikSozler(l), [])
    assert.deepEqual(bul(l, /["“”„]/), [], 'quotation marks other than «»')
    assert.deepEqual(bul(l, / - /), [], 'a spaced hyphen where a dash belongs')
  })

  it('EVERY FORM: no straight double quote, no spaced hyphen, no doubled space, no space before a comma or a full stop, no three dots typed as dots', () => {
    for (const b of BICIMLER) {
      assert.deepEqual(bul(M[b], /"/), [], `${b}: straight quote`)
      assert.deepEqual(bul(M[b], / - /), [], `${b}: spaced hyphen`)
      assert.deepEqual(bul(M[b], / {2,}|^\s|\s$/), [], `${b}: stray space`)
      assert.deepEqual(bul(M[b], /\S [,.;](?:\s|$)/), [], `${b}: space before punctuation`)
      assert.deepEqual(bul(M[b], /\.\.\./), [], `${b}: three dots`)
    }
  })

  it('EVERY FORM: numbers as the country writes them — a decimal comma and never a decimal point, no 12-hour clock, no date in another order', () => {
    for (const b of BICIMLER) {
      assert.deepEqual(bul(M[b], /\d\.\d/), [], `${b}: decimal point`)
      assert.deepEqual(bul(M[b], /\d,\d{3}(?!\d)/), [], `${b}: a comma between thousands`)
      assert.deepEqual(bul(M[b], /\b(?:AM|PM|a\.m\.|p\.m\.)\b/), [], `${b}: 12-hour clock`)
      assert.deepEqual(bul(M[b], /\d{1,4}[/-]\d{1,2}[/-]\d{2,4}/), [], `${b}: a date written with slashes or hyphens`)
    }
    assert.ok(M['uz-Latn'].some((x) => /\d,\d/.test(x.s)), 'no text with a decimal comma was found: the check above proves nothing')
  })

  it('EVERY FORM: nothing of the source country is left — no lira, no Turkish state system, no Turkish word for the country', () => {
    for (const b of BICIMLER) assert.deepEqual(bul(M[b], /₺|\bTL\b|\blira|лир[аыу]?\b|T\.?C\.? ?Kimlik|Türk|Turkiya|Турци|e-Nabız|\bSGK\b|MEDULA|\bMHRS\b|\bKVKK\b/i), [], b)
  })
})
