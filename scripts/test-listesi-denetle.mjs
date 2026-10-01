#!/usr/bin/env node
/**
 * NOTYA-AYSE-GERI-00 — which *.test.ts files are NOT run by `npm test`?
 *
 * The audit found ten assistant test files that existed but were never listed in package.json, so they could go
 * red without anyone noticing. Prints the unlisted files under the given roots (default: lib/asistan lib/ai
 * lib/randevu lib/doktor core/eylemler) and exits 1 when there are any.
 *
 *   node scripts/test-listesi-denetle.mjs [kök ...]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const kokler = process.argv.slice(2).length ? process.argv.slice(2) : ['lib/asistan', 'lib/ai', 'lib/randevu', 'lib/doktor', 'core/eylemler']
const komut = JSON.parse(readFileSync('package.json', 'utf8')).scripts.test
const listede = new Set(komut.split(/\s+/).filter((p) => p.endsWith('.test.ts')))
const globlar = [...listede].filter((p) => p.includes('*')).map((p) => new RegExp('^' + p.replace(/[.]/g, '\\.').replace(/\*/g, '[^/]*') + '$'))

function gez(dizin, cikti) {
  for (const ad of readdirSync(dizin)) {
    const yol = join(dizin, ad)
    if (statSync(yol).isDirectory()) gez(yol, cikti)
    else if (ad.endsWith('.test.ts')) cikti.push(yol)
  }
  return cikti
}

const eksik = kokler.flatMap((k) => gez(k, [])).filter((d) => !listede.has(d) && !globlar.some((g) => g.test(d))).sort()
if (eksik.length) {
  console.log(`npm test listesinde olmayan ${eksik.length} test dosyası:`)
  for (const d of eksik) console.log(`  ${d}`)
  process.exit(1)
}
console.log('Bütün test dosyaları npm test listesinde.')
