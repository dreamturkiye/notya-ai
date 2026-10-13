#!/usr/bin/env node
/**
 * NOTYA-ULKE-01 — issue invitation codes for a country whose sign-up is by invitation only.
 *
 *   node scripts/ulke-davet-kodu.mjs --ulke uz [--adet 5] [--not "Pilot, Tashkent"] [--gun 30]
 *
 * Prints each code ONCE (give it to the doctor) and the SQL that stores its hash. Run that SQL in the SQL editor of
 * THAT COUNTRY's database. This script connects to nothing and stores nothing: the code itself is never saved
 * anywhere, only its SHA-256 hash (table davet_kodlari, migration 129).
 * Do not issue a code for a country before its consent text is on the sign-up form (checklist I1).
 */
import { createHash, randomInt } from 'node:crypto'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const argv = process.argv.slice(2)
const al = (ad, varsayilan) => (argv.includes(ad) ? argv[argv.indexOf(ad) + 1] : varsayilan)
const ulke = al('--ulke')
const adet = Math.max(1, Math.min(200, Number(al('--adet', '1')) || 1))
const not = String(al('--not', '')).replace(/'/g, "''").slice(0, 200)
const gun = Number(al('--gun', '0')) || 0
const kok = join(dirname(fileURLToPath(import.meta.url)), '..')
if (!ulke || !/^[a-z]{2}$/.test(ulke) || !existsSync(join(kok, 'countries', ulke, 'index.ts'))) {
  console.error('usage: node scripts/ulke-davet-kodu.mjs --ulke <country code with a folder under countries/> [--adet n] [--not "text"] [--gun days]')
  process.exit(1)
}

// Same alphabet, length and normalisation as lib/ulke/davet.ts (lib/ulke/davet.test.ts keeps the two in step).
const ALFABE = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const uret = () => Array.from({ length: 16 }, () => ALFABE[randomInt(ALFABE.length)]).join('')
const hash = (kod) => createHash('sha256').update(kod).digest('hex')

const satirlar = []
console.log(`-- ${adet} invitation code(s) for "${ulke}". Give each code to one person; it is not shown again.\n`)
for (let i = 0; i < adet; i++) {
  const kod = uret()
  console.log(`   ${kod.replace(/(.{4})(?=.)/g, '$1-')}`)
  satirlar.push(`('${hash(kod)}', '${ulke}', ${not ? `'${not}'` : 'null'}, ${gun > 0 ? `now() + interval '${Math.floor(gun)} days'` : 'null'})`)
}
console.log(`\n-- Run in the SQL editor of the "${ulke}" database:\ninsert into public.davet_kodlari (kod_hash, ulke, aciklama, son_gecerlilik) values\n  ${satirlar.join(',\n  ')};`)
