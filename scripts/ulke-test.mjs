#!/usr/bin/env node
/**
 * NOTYA-ULKE-SABLON-01 — the country test suite, found by itself. `npm run test:ulke`.
 *
 * Nobody lists a test file here. Two kinds are discovered on every run:
 *
 *   1. ORDINARY country tests — every `*.test.ts(x)` under lib/ulke, components/ulke and countries/ (a pack's own
 *      tests live in its folder), plus the Turkish tool-list test that guards the wall from Türkiye's side.
 *      Run once, in one test run.
 *   2. PACK-PARAMETERISED tests — every `*.paket.test.ts(x)` under lib/ulke and components/ulke. Each is written
 *      against "the active pack" and names no country. They are run ONCE PER COUNTRY FOLDER, with NOTYA_COUNTRY set
 *      to that folder's code: walls, leak scan, route lists, screens, the shared-database rules.
 *
 * So ADDING A COUNTRY ADDS ITS TESTS: a new folder under countries/ is picked up by (2) on the next run, and its own
 * tests by (1).
 *
 *   node scripts/ulke-test.mjs                 everything
 *   node scripts/ulke-test.mjs --paket uz      only the pack-parameterised tests, for one country
 *   node scripts/ulke-test.mjs --yalniz-paket  only the pack-parameterised tests, for every country
 *   node scripts/ulke-test.mjs --liste         print what would run, run nothing
 *
 * Exit code 0 = every run passed.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const al = (ad) => (argv.includes(ad) ? argv[argv.indexOf(ad) + 1] : null)
const goreli = (p) => relative(KOK, p).split(sep).join('/')

function gez(dizin, cikti = []) {
  if (!existsSync(dizin)) return cikti
  for (const ad of readdirSync(dizin).sort()) {
    if (ad === 'node_modules' || ad === '.next') continue
    const yol = join(dizin, ad)
    if (statSync(yol).isDirectory()) gez(yol, cikti)
    else if (/\.test\.tsx?$/.test(ad)) cikti.push(goreli(yol))
  }
  return cikti
}

/** Country codes: every folder under countries/ that is a pack (has an index.ts). */
export function ulkeKodlari() {
  const d = join(KOK, 'countries')
  return readdirSync(d).filter((ad) => /^[a-z]{2}$/.test(ad) && existsSync(join(d, ad, 'index.ts'))).sort()
}

const paketMi = (f) => /\.paket\.test\.tsx?$/.test(f)
const hepsi = [...gez(join(KOK, 'lib/ulke')), ...gez(join(KOK, 'components/ulke')), ...gez(join(KOK, 'countries'))]
export const PAKET_TESTLERI = hepsi.filter(paketMi)
export const OLAGAN_TESTLER = [...hepsi.filter((f) => !paketMi(f)), 'lib/doktor/doktorAraclariUlke.test.ts']

function kos(ad, dosyalar, ortam) {
  if (!dosyalar.length) return true
  console.log(`\n━━ ${ad} — ${dosyalar.length} file(s)`)
  const r = spawnSync('npx', ['--yes', 'tsx', '--experimental-test-module-mocks', '--test', ...dosyalar], { cwd: KOK, stdio: 'inherit', env: { ...process.env, ...ortam } })
  return r.status === 0
}

const dogrudan = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (dogrudan) {
  const tekUlke = al('--paket')
  const ulkeler = tekUlke ? [tekUlke] : ulkeKodlari()
  if (tekUlke && !ulkeKodlari().includes(tekUlke)) { console.error(`"${tekUlke}" is not a country folder under countries/`); process.exit(2) }
  const yalnizPaket = argv.includes('--yalniz-paket') || Boolean(tekUlke)

  if (argv.includes('--liste')) {
    console.log(`ordinary country tests (${OLAGAN_TESTLER.length}):\n  ${OLAGAN_TESTLER.join('\n  ')}`)
    console.log(`\npack-parameterised tests (${PAKET_TESTLERI.length}), each run for: ${ulkeler.join(', ')}\n  ${PAKET_TESTLERI.join('\n  ')}`)
    process.exit(0)
  }

  const sonuclar = []
  if (!yalnizPaket) {
    // NOTYA_COUNTRY is cleared for the ordinary run: each of those files fixes its own country, as before.
    const ortam = { ...process.env }; delete ortam.NOTYA_COUNTRY
    console.log(`\n━━ ordinary country tests — ${OLAGAN_TESTLER.length} file(s)`)
    const r = spawnSync('npx', ['--yes', 'tsx', '--experimental-test-module-mocks', '--test', ...OLAGAN_TESTLER], { cwd: KOK, stdio: 'inherit', env: ortam })
    sonuclar.push(['ordinary country tests', r.status === 0])
  }
  for (const kod of ulkeler) sonuclar.push([`pack-parameterised tests for "${kod}"`, kos(`pack-parameterised tests for "${kod}" (NOTYA_COUNTRY=${kod})`, PAKET_TESTLERI, { NOTYA_COUNTRY: kod })])

  console.log('\n━━ country test suite')
  for (const [ad, tamam] of sonuclar) console.log(`${tamam ? 'ok  ' : 'FAIL'} ${ad}`)
  process.exit(sonuclar.every(([, t]) => t) ? 0 : 1)
}
