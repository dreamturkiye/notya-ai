import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { ayiriciMi, hucreler, tabloBasiMi, tabloOku } from './markdownTablo'

// MD-TABLO — shapes taken from real KD chat answers (smoke-out/kd-kaynak-kilidi-*.json): leading empty header cell,
// trailing spaces after the separator, bold in cells, table directly under a heading.
const CEVAP = [
  '### 2. Latency Antibiyotiği',
  '',
  '| | SB Riskli Gebelikler Rehberi | ACOG önerileri |',
  '|---|---|---|  ',
  '| **Amaç** | Latency süresini uzatmak | Aynı |',
  '| **Önerilen rejim** | Ampisilin + eritromisin — doz hekim | Aynı |',
  '',
  'Devam edeyim mi Hocam?',
]

test('real answer: header with an empty first cell, separator with trailing spaces, two body rows; parsing stops at the blank line', () => {
  assert.ok(!tabloBasiMi(CEVAP, 0)); assert.ok(tabloBasiMi(CEVAP, 2))
  const { tablo, sonraki } = tabloOku(CEVAP, 2)
  assert.deepEqual(tablo.baslik, ['', 'SB Riskli Gebelikler Rehberi', 'ACOG önerileri'])
  assert.equal(tablo.satirlar.length, 2)
  assert.deepEqual(tablo.satirlar[0], ['**Amaç**', 'Latency süresini uzatmak', 'Aynı'])
  assert.equal(sonraki, 6)
})

test('alignment colons, rows without outer pipes, short / long rows, escaped pipe', () => {
  const s = ['Konu | ACOG | DÖBYR', ':--- | :---: | ---:', 'a | b', 'x | y | z | fazla', 'p \\| q | r | s']
  assert.ok(tabloBasiMi(s, 0))
  const { tablo } = tabloOku(s, 0)
  assert.deepEqual(tablo.hizalar, ['sol', 'orta', 'sag'])
  assert.deepEqual(tablo.satirlar, [['a', 'b', ''], ['x', 'y', 'z | fazla'], ['p | q', 'r', 's']])
})

test('not a table: a lone pipe line, a separator with a different column count, horizontal rule, plain text with a pipe', () => {
  assert.ok(!tabloBasiMi(['| sadece satır |', 'devam'], 0))
  // MD-TABLO-FIX (Kaan, 2026-09-19): bu satir eskiden 'tablo DEGIL' diye dogrulaniyordu.
  // Uretimde hataya yol acti: sutun sayisi tutmayinca tablo taninmiyor, ham '|---|---|'
  // satiri duz metin basiliyor ve hekim ekranda "IIIII IIIII" goruyordu (Dr. Gokhan bildirdi).
  // Model tabloyu kusurlu yazabilir / max_tokens ortadan kesebilir - ikisi de normaldir.
  // Karar: sutun sayisi esitligi ARANMAZ; tabloOku hucreleri hizalar. Yanlis pozitif riski
  // dusuk, cunku hemen ardindan GERCEK bir ayirici satiri sart (duz metinde nadir).
  assert.ok(tabloBasiMi(['| a | b | c |', '|---|---|'], 0), 'sutun sayisi tutmasa da tablo')
  assert.ok(!tabloBasiMi(['---', '---'], 0), 'a markdown rule is not a table')
  assert.ok(ayiriciMi('|:--|--:|'))
  assert.ok(!tabloBasiMi(['TA 150/95 | nabız 88', 'Plan: kontrol'], 0))
  assert.deepEqual(hucreler('|a|b|'), ['a', 'b'])
})

test('HafifMarkdown renders tables (scroll wrapper, no page overflow), headings and rules through the parser', () => {
  const src = fs.readFileSync(path.join(import.meta.dirname, '..', '..', 'components', 'asistan', 'HafifMarkdown.tsx'), 'utf8')
  assert.ok(src.includes("from '@/lib/asistan/markdownTablo'"))
  assert.ok(src.includes('<table') && src.includes("overflowX: 'auto'"))
  assert.ok(/#{1,3}/.test(src) && src.includes('<hr'))
})

test('HafifMarkdown label rows cannot widen the chat panel on a phone (MOBILE-REVIEW)', () => {
  const src = fs.readFileSync(path.join(import.meta.dirname, '..', '..', 'components', 'asistan', 'HafifMarkdown.tsx'), 'utf8')
  // A max-content label track with nowrap made a long "**Label:** value" row the panel's min width (445px on a 360px screen).
  assert.ok(src.includes("gridTemplateColumns: 'fit-content(45%) minmax(0, 1fr)'"))
  assert.ok(!src.includes("gridTemplateColumns: 'max-content 1fr'"))
  assert.ok(!/etiketRenk, fontWeight: 600, whiteSpace: 'nowrap'/.test(src))
  assert.ok(src.includes("lineHeight: 1.55, overflowWrap: 'anywhere'"), 'unbroken tokens wrap inside every host bubble')
})
