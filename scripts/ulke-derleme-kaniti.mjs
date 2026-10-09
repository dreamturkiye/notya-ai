#!/usr/bin/env node
/**
 * NOTYA-ULKE-01 — proof, on the BUILD OUTPUT, that a build holds one country's pack and no other.
 * Runs after every COUNTRY build: `npm run build:ulke` (scripts/ulke-derle.mjs) builds and then runs this, and a bare
 * `next build` for a country is refused (scripts/ulke-derleme-kapisi.mjs). It can also be run by hand after any build.
 * It is not a `postbuild` in package.json: a build with no country set runs what main runs, nothing more.
 *
 *   node scripts/ulke-derleme-kaniti.mjs [--dizin .next]
 *
 * Every pack carries a unique marker string (`iz` in countries/<kod>/index.ts). After a build for country X:
 *   - X's marker MUST be in the output (positive control: proves the scan looks where packs land), and
 *   - no other country's marker may be anywhere in it.
 * `.next/cache` is not scanned: it is the compiler's private cache, never served, and may hold older builds.
 * No build output at all (script run before a build) is reported and passes: there is nothing to prove yet.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'))
const argv = process.argv.slice(2)
const CIKTI = resolve(KOK, argv.includes('--dizin') ? argv[argv.indexOf('--dizin') + 1] : '.next')
const AKTIF = process.env.NOTYA_COUNTRY || 'tr'

function izler() {
  const d = join(KOK, 'countries')
  const out = {}
  for (const kod of readdirSync(d)) {
    const index = join(d, kod, 'index.ts')
    if (kod === 'active' || !existsSync(index)) continue
    const m = /\biz:\s*'([^']+)'/.exec(readFileSync(index, 'utf8'))
    if (!m) throw new Error(`countries/${kod}/index.ts has no marker (iz)`)
    out[kod] = m[1]
  }
  return out
}

function gez(dizin, cikti = []) {
  if (!existsSync(dizin)) return cikti
  for (const ad of readdirSync(dizin)) {
    const yol = join(dizin, ad)
    const st = statSync(yol)
    if (st.isDirectory()) gez(yol, cikti)
    else if (st.size > 0) cikti.push(yol)
  }
  return cikti
}

export function derlemeKaniti() {
  const iz = izler()
  if (!iz[AKTIF]) throw new Error(`NOTYA_COUNTRY="${AKTIF}" has no pack in countries/`)
  const dosyalar = [...gez(join(CIKTI, 'server')), ...gez(join(CIKTI, 'static'))]
  const bulunan = Object.fromEntries(Object.keys(iz).map((k) => [k, []]))
  for (const yol of dosyalar) {
    const icerik = readFileSync(yol)
    for (const [kod, isaret] of Object.entries(iz)) {
      if (icerik.includes(isaret)) bulunan[kod].push(relative(KOK, yol))
    }
  }
  return { aktif: AKTIF, taranan: dosyalar.length, bulunan }
}

const dogrudan = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (dogrudan) {
  const { aktif, taranan, bulunan } = derlemeKaniti()
  if (!taranan) {
    console.log(`[ulke-derleme-kaniti] no build output under ${relative(KOK, CIKTI) || '.'} — nothing to check`)
    process.exit(0)
  }
  const yabanci = Object.entries(bulunan).filter(([kod, d]) => kod !== aktif && d.length)
  if (yabanci.length) {
    console.error(`[ulke-derleme-kaniti] FAILED — a build for "${aktif}" contains another country's pack:`)
    for (const [kod, d] of yabanci) console.error(`  ${kod}: ${d.length} file(s), e.g. ${d.slice(0, 5).join(', ')}`)
    console.error('  countries/active/ must select packs inside constant NOTYA_COUNTRY branches (scripts/ulke-duvarlari.mjs, rule D4).')
    process.exit(1)
  }
  if (!bulunan[aktif].length) {
    console.error(`[ulke-derleme-kaniti] FAILED — the "${aktif}" pack's own marker is nowhere in the build output, so the absence of the others proves nothing.`)
    process.exit(1)
  }
  console.log(`[ulke-derleme-kaniti] ok — ${taranan} output files: "${aktif}" pack present (${bulunan[aktif].length} file(s)), no other country's pack`)
}
