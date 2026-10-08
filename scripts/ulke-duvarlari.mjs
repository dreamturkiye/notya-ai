#!/usr/bin/env node
/**
 * NOTYA-ULKE-01 — the walls between countries (docs/COUNTRY-PACK-CHECKLIST.md, "Rules that stop one country leaking").
 * Runs in `prebuild` (a violation stops the build) and in `npm test` (lib/ulke/ulkeDuvarlari.test.ts).
 *
 *   node scripts/ulke-duvarlari.mjs [--kok <dir>]
 *
 * Rules, checked on every import / export-from / require / dynamic import in the repository:
 *   D1  Code outside countries/ reaches a pack ONLY through countries/active (and countries/active/<file>).
 *       One exception: next.config.mjs loads countries/<kod>/derleme.mjs of the country it builds.
 *   D2  countries/tumu (every pack side by side) is for tests and scripts only: *.test.ts(x), lib/ulke/testing/, scripts/.
 *   D3  countries/<a>/ never imports countries/<b>/, and a pack never imports countries/active or countries/tumu.
 *       A pack may import core.
 *   D4  countries/active/* selects at build time: a pack may be `require`d only inside the
 *       `if (process.env.NOTYA_COUNTRY === '<kod>')` branch of its own code, never imported statically
 *       (`import type` is fine: types are erased).
 *   D5  Core code does not read NOTYA_COUNTRY or compare aktifUlke() with a country code itself — it asks the pack
 *       (ozellikAcik, ulkePaketi). Allowed readers: countries/active/, next.config.mjs, scripts/, tests.
 *   D6  Every country folder has the same parts: index.ts, derleme.mjs, sizintiTerimleri.ts.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const argv = process.argv.slice(2)
const KOK = resolve(argv.includes('--kok') ? argv[argv.indexOf('--kok') + 1] : join(dirname(fileURLToPath(import.meta.url)), '..'))
const ATLA = new Set(['node_modules', '.next', '.git', 'public', 'backups', 'docs', '.vercel', 'canvases'])
const UZANTI = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/
const ULKELER_DIZINI = 'countries'
const GIRIS = 'active'
const TUMU = 'tumu'

const goreli = (p) => relative(KOK, p).split(sep).join('/')

function dosyalar(dizin, cikti = []) {
  for (const ad of readdirSync(dizin)) {
    if (ATLA.has(ad)) continue
    const yol = join(dizin, ad)
    const st = statSync(yol)
    if (st.isDirectory()) dosyalar(yol, cikti)
    else if (UZANTI.test(ad) && !ad.endsWith('.d.ts')) cikti.push(yol)
  }
  return cikti
}

/** Comments out, so a sentence ABOUT an import is not read as one. Strings are kept (specifiers live in them). */
function yorumsuz(kaynak) {
  return kaynak
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, on) => on + ' '.repeat(m.length - on.length))
}

const IMPORT_DESENLERI = [
  /\bimport\s+(type\s+)?[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g,
  /\bexport\s+(type\s+)?[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*()['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*()['"`]([^'"`]+)['"`]/g,
  /\brequire\s*\(\s*()['"`]([^'"`]+)['"`]/g,
]

/** → repo-relative path the specifier points at (no extension resolution needed: only the folder matters). */
function hedef(dosya, belirtec) {
  if (belirtec.startsWith('@/')) return belirtec.slice(2)
  if (belirtec.startsWith('.')) return goreli(resolve(dirname(dosya), belirtec))
  return null
}

function ulkeKlasorleri() {
  const d = join(KOK, ULKELER_DIZINI)
  if (!existsSync(d)) return []
  return readdirSync(d).filter((ad) => statSync(join(d, ad)).isDirectory() && ad !== GIRIS).sort()
}

const testMi = (g) => /\.test\.(ts|tsx|mts)$/.test(g)
const tumuKullanabilir = (g) => testMi(g) || g.startsWith('lib/ulke/testing/') || g.startsWith('scripts/')
const ulkeOkuyabilir = (g) =>
  g.startsWith(`${ULKELER_DIZINI}/${GIRIS}/`) || g === 'next.config.mjs' || g.startsWith('scripts/') || testMi(g) || g.startsWith('lib/ulke/testing/')

export function duvarlariDenetle() {
  const ihlaller = []
  const ulkeler = ulkeKlasorleri()
  const ekle = (kural, dosya, mesaj) => ihlaller.push({ kural, dosya, mesaj })

  for (const kod of ulkeler) {
    for (const parca of ['index.ts', 'derleme.mjs', 'sizintiTerimleri.ts']) {
      if (!existsSync(join(KOK, ULKELER_DIZINI, kod, parca))) ekle('D6', `${ULKELER_DIZINI}/${kod}/`, `missing ${parca}`)
    }
  }

  for (const dosya of dosyalar(KOK)) {
    const g = goreli(dosya)
    const ham = readFileSync(dosya, 'utf8')
    const kaynak = yorumsuz(ham)
    const icinde = g.startsWith(`${ULKELER_DIZINI}/`) ? g.split('/')[1] : null // 'active' | 'tumu.ts' | '<kod>'
    const paketIcinde = icinde && ulkeler.includes(icinde) ? icinde : null
    const giristeMi = icinde === GIRIS

    for (const desen of IMPORT_DESENLERI) {
      desen.lastIndex = 0
      let m
      while ((m = desen.exec(kaynak))) {
        const tipMi = Boolean(m[1])
        const h = hedef(dosya, m[2])
        if (!h || !(h === ULKELER_DIZINI || h.startsWith(`${ULKELER_DIZINI}/`))) continue
        const bolum = h.split('/')[1] || ''
        const hedefUlke = ulkeler.includes(bolum) ? bolum : null
        const hedefGiris = bolum === GIRIS
        const hedefTumu = bolum === TUMU || bolum === `${TUMU}.ts`

        if (paketIcinde) {
          if (hedefUlke && hedefUlke !== paketIcinde) ekle('D3', g, `pack "${paketIcinde}" imports pack "${hedefUlke}" (${m[2]})`)
          if (hedefGiris || hedefTumu) ekle('D3', g, `a pack must not import ${h} (${m[2]})`)
          continue
        }
        if (giristeMi) {
          if (hedefUlke && !tipMi && !/\brequire\s*\(/.test(m[0])) ekle('D4', g, `static import of pack "${hedefUlke}" — packs are selected with require inside their own NOTYA_COUNTRY branch`)
          if (hedefTumu) ekle('D4', g, `the entry point must not import ${h}`)
          continue
        }
        if (g === `${ULKELER_DIZINI}/${TUMU}.ts`) continue // the test-only registry is the one file that lists every pack
        // outside countries/
        if (hedefGiris) continue
        if (hedefTumu) {
          if (!tumuKullanabilir(g)) ekle('D2', g, `${h} is for tests and scripts only (${m[2]})`)
          continue
        }
        if (!hedefUlke) continue // not a pack: a data file beside the packs, or a folder that does not exist
        if (testMi(g) && tipMi) continue
        // The build config loads the build-level facts of the ONE country it builds, by a path made from NOTYA_COUNTRY.
        if (g === 'next.config.mjs' && /^countries\/[^/]+\/derleme\.mjs$/.test(h)) continue
        ekle('D1', g, `imports ${h} directly — core reaches a pack only through ${ULKELER_DIZINI}/${GIRIS} (${m[2]})`)
      }
    }

    if (giristeMi) {
      // D4: every require of a pack sits in the branch of its own code.
      const satirlar = kaynak.split('\n')
      let dal = null
      for (const satir of satirlar) {
        const kosul = /process\.env\.NOTYA_COUNTRY\s*===\s*'([a-z]{2})'/.exec(satir)
        if (/^\s*(}\s*else\s+)?if\s*\(/.test(satir)) dal = kosul ? kosul[1] : null
        else if (/^\s*}\s*else\s*{/.test(satir)) dal = null
        const r = /\brequire\s*\(\s*['"]\.\.\/([a-z]{2})\//.exec(satir)
        if (r && r[1] !== dal) ekle('D4', g, `require of pack "${r[1]}" outside its own NOTYA_COUNTRY === '${r[1]}' branch`)
      }
      for (const kod of ulkeler) {
        if (!new RegExp(`process\\.env\\.NOTYA_COUNTRY\\s*===\\s*'${kod}'`).test(kaynak)) ekle('D4', g, `no branch for country "${kod}"`)
      }
    } else if (!ulkeOkuyabilir(g) && !paketIcinde && g !== `${ULKELER_DIZINI}/${TUMU}.ts`) {
      if (/\bNOTYA_COUNTRY\b/.test(kaynak)) ekle('D5', g, 'reads NOTYA_COUNTRY — ask lib/ulke/ulke.ts (aktifUlke, ozellikAcik) instead')
      if (!g.startsWith('lib/ulke/') && /\baktifUlke\(\)\s*[!=]==?\s*['"`]|['"`][a-z]{2}['"`]\s*[!=]==?\s*aktifUlke\(\)|\bAKTIF_PAKET\.kod\s*[!=]==?\s*['"`]/.test(kaynak)) {
        ekle('D5', g, 'compares the active country with a code — ask the pack (ozellikAcik / ulkePaketi) instead')
      }
    }
  }
  return { ulkeler, ihlaller }
}

const dogrudan = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (dogrudan) {
  const { ulkeler, ihlaller } = duvarlariDenetle()
  if (ihlaller.length) {
    console.error(`[ulke-duvarlari] ${ihlaller.length} wall violation(s):`)
    for (const i of ihlaller) console.error(`  ${i.kural}  ${i.dosya}: ${i.mesaj}`)
    console.error('Rules: scripts/ulke-duvarlari.mjs header · docs/COUNTRY-PACK-CHECKLIST.md')
    process.exit(1)
  }
  console.log(`[ulke-duvarlari] walls hold — countries: ${ulkeler.join(', ') || '(none)'}`)
}
