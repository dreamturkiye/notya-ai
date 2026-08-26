#!/usr/bin/env node
/**
 * NOTYA-PSEUDO-05 — build lib/security/tr-sozluk.json
 *
 * Source: Vikisözlük's Turkish word list, mirrored at github.com/mertemin/turkish-word-list
 * (collector.py in that repo pulls it from tr.wiktionary.org; content is CC BY-SA 3.0).
 *
 * Kept: single tokens, letters only, 4+ characters, lowercased in Turkish locale.
 *   - multi-word entries ("aba güreşi") are dropped — pseudonymize works on single name tokens
 *   - 1–3 letter words are dropped — pseudonymize already never substitutes tokens under 4 chars
 * Output is a sorted, deduplicated JSON array so the diff is readable when the list is rebuilt.
 *
 * Usage:  node scripts/build-tr-sozluk.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'https://raw.githubusercontent.com/mertemin/turkish-word-list/master/words.txt'
const OUT = path.join(process.cwd(), 'lib', 'security', 'tr-sozluk.json')

const res = await fetch(SRC)
if (!res.ok) throw new Error(`${SRC} -> ${res.status}`)
const text = await res.text()

const kelimeler = new Set()
for (const satir of text.split('\n')) {
  const k = satir.trim().toLocaleLowerCase('tr')
  if (!k || k.includes(' ') || k.length < 4) continue
  if (!/^\p{L}+$/u.test(k)) continue
  kelimeler.add(k)
}

const liste = [...kelimeler].sort((a, b) => a.localeCompare(b, 'tr'))
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(liste))
console.log(`${liste.length} kelime -> ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`)

// Smoke test: the collisions that motivated this file must be present, and common given names
// that are NOT dictionary words must be absent — otherwise they would stop being redacted.
const olmali = ['demir', 'sedef', 'ateş', 'şeker', 'uzun', 'küçük', 'beyaz', 'yüksek', 'damla', 'kaliteli', 'deniz', 'umut', 'duru', 'esen']
const olmamali = ['mehmet', 'ayşe', 'fatma', 'mustafa', 'zeynep', 'nurofen']
const eksik = olmali.filter((k) => !kelimeler.has(k))
const fazla = olmamali.filter((k) => kelimeler.has(k))
if (eksik.length || fazla.length) {
  console.error('SMOKE TEST FAILED', { eksik, fazla })
  process.exit(1)
}
console.log('smoke test ok')
