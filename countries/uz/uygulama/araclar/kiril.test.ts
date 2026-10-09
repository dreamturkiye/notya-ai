/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: THE CYRILLIC FORM OF THE TOOL TEXTS CAN BE MADE AGAIN.
 *
 * The Uzbek Cyrillic text of every tool is derived from its Latin text by rule (scripts/uz-kiril.mjs), stored
 * static, and marked machine-written. This test holds the two together: every stored Cyrillic text of a tool, and
 * every unit name, is exactly what the rule gives for its Latin text today. A text corrected by a native reader
 * will differ from the rule on purpose — then it is named in ELLE_DUZELTILEN below, with who corrected it.
 */
process.env.NOTYA_COUNTRY = 'uz'

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { dosyayiDoldur, kirill } from '../../../../scripts/uz-kiril.mjs'
import { UZ_ARACLAR } from './index'

const KOK = resolve(__dirname, '../../../..')
/** path of a text → who corrected its Cyrillic form by hand. Empty: no native reader has read the texts yet. */
const ELLE_DUZELTILEN: Readonly<Record<string, string>> = {}

describe('Uzbek tools — Latin to Cyrillic by rule', () => {
  it('the rule: the letters of the 1995 Latin alphabet, the digraphs, the two apostrophes, e and the yo/yu/ya pairs', () => {
    const ornekler: [string, string][] = [
      ['Oʻzbekiston', 'Ўзбекистон'], ['gʻoz', 'ғоз'], ['shifokor', 'шифокор'], ['chap', 'чап'], ['qon', 'қон'], ['hafta', 'ҳафта'], ['xulosa', 'хулоса'],
      ['maʼlumot', 'маълумот'], ['yoʻq', 'йўқ'], ['yordam', 'ёрдам'], ['yurak', 'юрак'], ['yaxshi', 'яхши'], ['yetarli', 'етарли'],
      ['emas', 'эмас'], ['bemor', 'бемор'], ['aeroport', 'аэропорт'], ['Bemor sahifasi', 'Бемор саҳифаси'], ['Keyingi nazorat', 'Кейинги назорат'],
    ]
    for (const [latin, kiril] of ornekler) assert.equal(kirill(latin), kiril, latin)
  })

  it('loan words the rule alone would misspell are spelled from the list, and abbreviations the profession writes in Latin letters stay', () => {
    assert.equal(kirill('infeksiya'), 'инфекция')
    assert.equal(kirill('konsultatsiya'), 'консультация')
    assert.equal(kirill('Dializ sikli'), 'Диализ цикли')
    assert.equal(kirill('C-reaktiv oqsil'), 'С-реактив оқсил')
    assert.equal(kirill('KDIGO G3a, ASA III, DAS28'), 'KDIGO G3a, ASA III, DAS28')
    assert.equal(kirill('30 mg/g dan past'), '30 мг/г дан паст')
    assert.doesNotMatch(kirill('Belgilangan bandlar va keyingi nazorat sanasi'), /[A-Za-z]/)
  })

  it('EVERY stored Cyrillic text of a tool and every unit name is what the rule gives for its Latin text', () => {
    let sayi = 0
    const farkli: string[] = []
    const gez = (x: unknown, yol: string) => {
      if (!x || typeof x !== 'object') return
      const o = x as Record<string, unknown>
      if (typeof o['uz-Latn'] === 'string' && typeof o['uz-Cyrl'] === 'string') {
        sayi++
        if (kirill(o['uz-Latn']) !== o['uz-Cyrl'] && !ELLE_DUZELTILEN[yol]) farkli.push(`${yol}: stored "${o['uz-Cyrl']}", the rule gives "${kirill(o['uz-Latn'])}"`)
        return
      }
      for (const [k, v] of Object.entries(o)) gez(v, `${yol}.${k}`)
    }
    for (const a of UZ_ARACLAR.araclar) gez(a.metin, a.anahtar)
    gez(UZ_ARACLAR.birimler, 'birimler')
    assert.ok(sayi > 500, `only ${sayi} texts were compared`)
    assert.deepEqual(farkli, [])
  })

  it('filling a file: only an EMPTY Cyrillic argument is written; a text that is already there is never overwritten', () => {
    const once = `x: u('Keyingi nazorat', '', 'Следующий контроль'),\ny: u('Bemor', 'ЭЛДА ЁЗИЛГАН', 'Пациент'),\nz: vazifa('yara nazorati', '', 'контроль раны'),`
    const { yeni, n } = dosyayiDoldur(once)
    assert.equal(n, 2)
    assert.equal(yeni, `x: u('Keyingi nazorat', 'Кейинги назорат', 'Следующий контроль'),\ny: u('Bemor', 'ЭЛДА ЁЗИЛГАН', 'Пациент'),\nz: vazifa('yara nazorati', 'яра назорати', 'контроль раны'),`)
    assert.deepEqual(dosyayiDoldur(yeni), { yeni, n: 0 }, 'a second run changes nothing')
  })

  it('the pack\'s own files have no empty Cyrillic argument left', () => {
    const dizin = join(KOK, 'countries/uz/uygulama/araclar')
    for (const d of readdirSync(dizin).filter((x) => x.endsWith('.ts') && !x.endsWith('.test.ts'))) assert.equal(dosyayiDoldur(readFileSync(join(dizin, d), 'utf8')).n, 0, `${d} still has a text without its Cyrillic form`)
  })

  // NOTYA-ULKE-ASISTAN-01: a TEST of this pack may read the rule (it holds a file's stored Cyrillic text to it, as this
  // file does for the tools). A test is neither a build step nor an application file; everything else stays refused.
  it('COUNTRY TOOLING ONLY: no build step, no application file and no other script imports or runs it', () => {
    const pkg = readFileSync(join(KOK, 'package.json'), 'utf8')
    assert.doesNotMatch(pkg, /uz-kiril/)
    const gez = (dizin: string, cikti: string[] = []): string[] => {
      for (const ad of readdirSync(join(KOK, dizin), { withFileTypes: true })) {
        if (ad.name === 'node_modules' || ad.name.startsWith('.')) continue
        const yol = `${dizin}/${ad.name}`
        if (ad.isDirectory()) gez(yol, cikti)
        else if (/\.(ts|tsx|mjs|mts|js)$/.test(ad.name)) cikti.push(yol)
      }
      return cikti
    }
    const okuyan = ['app', 'components', 'lib', 'countries', 'scripts'].flatMap((d) => gez(d)).filter((d) => !/uz-kiril\.(mjs|d\.mts)$/.test(d) && !(d.startsWith('countries/uz/') && d.endsWith('.test.ts')) && /(from\s*|import\(\s*|require\(\s*|spawn\w*\([^)]*)['"`][^'"`]*uz-kiril/.test(readFileSync(join(KOK, d), 'utf8')))
    assert.deepEqual(okuyan, [])
  })
})
