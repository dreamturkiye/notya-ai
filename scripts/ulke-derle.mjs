#!/usr/bin/env node
/**
 * NOTYA-ULKE-SABLON-01 — BUILD ONE COUNTRY. `NOTYA_COUNTRY=<code> npm run build:ulke`
 *
 * The ordinary build (`npm run build`: `prebuild`, `next build`) and then, on its output, the proof that the build
 * holds this country's pack and no other (scripts/ulke-derleme-kaniti.mjs). Before anything compiles, the country's
 * own build file runs the pack scan and the wall check (scripts/ulke-derleme-kapisi.mjs).
 *
 * This is the build command of a COUNTRY deployment. A build with no country set (Türkiye) does not use it:
 * `npm run build` there is exactly what it is on main.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const kod = process.env.NOTYA_COUNTRY || ''
const dur = (mesaj) => { console.error(`[ulke-derle] ${mesaj}`); process.exit(1) }
if (!/^[a-z]{2}$/.test(kod)) dur('set NOTYA_COUNTRY to the country to build:  NOTYA_COUNTRY=<code> npm run build:ulke')
const dosya = join(KOK, 'countries', kod, 'derleme.mjs')
if (!existsSync(dosya)) dur(`countries/${kod}/ is not a country pack`)
let derleme
try { derleme = (await import(pathToFileURL(dosya).href)).default } catch (e) { console.error(String(e?.message ?? e)); process.exit(1) }
if (derleme.bolunmemisUygulama) dur(`"${kod}" is the pre-split application: it is built with "npm run build", as on main`)

const kos = (komut, argv, ortam = {}) => spawnSync(komut, argv, { cwd: KOK, stdio: 'inherit', env: { ...process.env, ...ortam } }).status ?? 1
const derlemeKodu = kos('npm', ['run', 'build'], { NOTYA_ULKE_DERLEME: '1' })
if (derlemeKodu !== 0) process.exit(derlemeKodu)
process.exit(kos('node', ['scripts/ulke-derleme-kaniti.mjs']))
