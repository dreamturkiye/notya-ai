#!/usr/bin/env node
/**
 * NOTYA-ULKE-01 — the walls between countries (docs/COUNTRY-PACK-CHECKLIST.md, "Rules that stop one country leaking").
 * Runs before every COUNTRY build (scripts/ulke-derleme-kapisi.mjs, called by countries/<code>/derleme.mjs: a
 * violation stops that build) and in the tests (lib/ulke/ulkeDuvarlari.test.ts, in `npm test` and `npm run test:ulke`).
 * It is not in package.json's `prebuild`: a build with no country set runs what main runs, nothing more.
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
 *   D7  NOTYA-ULKE-ARACLAR-01 — a tool bound to one country's state or payer system (countries/yasak-araclar.json,
 *       by key, per owning country) exists in no other country's build: its key is named by no file of the country
 *       kit (lib/ulke/, components/ulke/, any *.ulke.* route) and by no other country's pack, and no route folder
 *       under app/tools/ carries it. And the kit never imports the pre-split application's tool code
 *       (app/doktor-tools, app/klinik-tools, specialties/, lib/doktor/doktorAraclari, lib/klinik/klinikAraclari):
 *       what the two share is arithmetic, proven equal by test, never a module that carries one country's text.
 *       NOTYA-ULKE-OZEL-01 — the list is PER COUNTRY and holds, beside state and payer tools, every tool, link-out
 *       tile and placeholder that only one country's pack has. So the same rule keeps a country's own tools out of
 *       every other country. The list itself is held to its form: a code and a list of keys per country; a key is
 *       listed for ONE country; and a key that carries a country's code ("ca-…") is listed for that country.
 *   D8  NOTYA-ULKE-EN-01 — LANGUAGE SETS (countries/_dil/<language>/): the text a language has in common across the
 *       countries that speak it. A country pack MAY import a language set. A language set imports NO country pack,
 *       not countries/active, not countries/tumu and no other language set; it may import core. It reads no country
 *       code (D5 applies to it), carries no pack marker, and names no tool of D7. Code outside countries/ never
 *       imports a language set: it reaches a language's text only through the active pack (tests, scripts and
 *       lib/ulke/testing/ may). So a build still holds exactly ONE country's pack, plus the set that pack took.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const argv = process.argv.slice(2)
const KOK = resolve(argv.includes('--kok') ? argv[argv.indexOf('--kok') + 1] : join(dirname(fileURLToPath(import.meta.url)), '..'))
// `.claude` holds an agent's own files and, under `.claude/worktrees/`, OTHER WORKING COPIES of this repository (other
// branches, checked out by other jobs). The walls judge this repository's own files, not another working copy's:
// each of those is judged where it is the repository root.
const ATLA = new Set(['node_modules', '.next', '.git', 'public', 'backups', 'docs', '.vercel', 'canvases', '.claude'])
const UZANTI = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/
const ULKELER_DIZINI = 'countries'
const GIRIS = 'active'
const TUMU = 'tumu'
/** Language sets: countries/_dil/<language>/. Not a country: no pack, no build file, no leak list of its own. */
const DIL_SETLERI = '_dil'

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
  return readdirSync(d).filter((ad) => statSync(join(d, ad)).isDirectory() && ad !== GIRIS && ad !== DIL_SETLERI).sort()
}

/** The language a file of a language set belongs to ('en' for countries/_dil/en/…), or null. */
const dilSetiDili = (g) => (g.startsWith(`${ULKELER_DIZINI}/${DIL_SETLERI}/`) ? g.split('/')[2] || null : null)

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

  // D7: the keys that belong to one country only, per owning country.
  const yasakDosyasi = join(KOK, ULKELER_DIZINI, 'yasak-araclar.json')
  const yasak = existsSync(yasakDosyasi) ? JSON.parse(readFileSync(yasakDosyasi, 'utf8')) : {}
  const yasakAnahtarlar = Object.entries(yasak).filter(([kod, liste]) => /^[a-z]{2}$/.test(kod) && Array.isArray(liste)).map(([kod, liste]) => ({ kod, anahtarlar: liste.map(String) }))
  {
    // D7 — the list is well-formed: nothing in it can be read two ways.
    const LISTE = `${ULKELER_DIZINI}/yasak-araclar.json`
    for (const [kod, liste] of Object.entries(yasak)) {
      if (kod === 'aciklama') continue
      if (!/^[a-z]{2}$/.test(kod) || !Array.isArray(liste)) { ekle('D7', LISTE, `"${kod}": every entry is a country code with a list of tool keys`); continue }
      for (const k of liste) if (typeof k !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(k)) ekle('D7', LISTE, `"${kod}": ${JSON.stringify(k)} is not a tool key (lower-case letters and digits joined by hyphens)`)
      if (new Set(liste).size !== liste.length) ekle('D7', LISTE, `"${kod}": a key is listed twice`)
    }
    // A key belongs to ONE country; and a key that carries a country's code belongs to THAT country.
    const kodlar = new Set([...ulkeler, ...yasakAnahtarlar.map((y) => y.kod)])
    const sahibi = new Map()
    for (const y of yasakAnahtarlar) for (const k of y.anahtarlar) {
      if (sahibi.has(k) && sahibi.get(k) !== y.kod) ekle('D7', LISTE, `"${k}" is listed for "${sahibi.get(k)}" and for "${y.kod}": a tool is one country's alone`)
      sahibi.set(k, y.kod)
      const onEk = /^([a-z]{2})-/.exec(k)?.[1]
      if (onEk && onEk !== y.kod && kodlar.has(onEk)) ekle('D7', LISTE, `"${k}" carries the code "${onEk}" and is listed for "${y.kod}"`)
    }
  }
  const aracRotalari = join(KOK, 'app', 'tools')
  if (existsSync(aracRotalari)) for (const ad of readdirSync(aracRotalari)) for (const y of yasakAnahtarlar) if (y.anahtarlar.includes(ad)) ekle('D7', `app/tools/${ad}/`, `a route named after "${ad}", a tool of "${y.kod}" only`)
  const kitDosyasiMi = (g) => !testMi(g) && !g.startsWith('lib/ulke/testing/') && (g.startsWith('lib/ulke/') || g.startsWith('components/ulke/') || /\.ulke\.(ts|tsx)$/.test(g))
  const ONCEKI_ARAC_KODU = /^(app\/doktor-tools|app\/klinik-tools|specialties|lib\/doktor\/doktorAraclari|lib\/klinik\/klinikAraclari)(\/|$|\.)/

  for (const dosya of dosyalar(KOK)) {
    const g = goreli(dosya)
    const ham = readFileSync(dosya, 'utf8')
    const kaynak = yorumsuz(ham)
    {
      // D7 — the kit and every pack but the owner's never name such a key; the kit never imports the other application's tool code.
      const paketi = g.startsWith(`${ULKELER_DIZINI}/`) && ulkeler.includes(g.split('/')[1]) && !testMi(g) ? g.split('/')[1] : null
      const kit = kitDosyasiMi(g)
      const setDosyasi = Boolean(dilSetiDili(g)) && !testMi(g)
      if (setDosyasi && /notya-ulke-paketi:/.test(kaynak)) ekle('D8', g, 'a language set carries a pack marker — a set is no country\'s pack')
      if (kit || paketi || setDosyasi) {
        for (const y of yasakAnahtarlar) {
          if (paketi === y.kod) continue
          for (const k of y.anahtarlar) if (new RegExp(`['"\`/=]${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`/?&#]`).test(kaynak)) ekle('D7', g, `names "${k}", a tool of "${y.kod}" only: it does not exist in another country's build`)
        }
      }
      if (kit || setDosyasi || (paketi && !yasakAnahtarlar.some((y) => y.kod === paketi))) {
        for (const desen of IMPORT_DESENLERI) {
          desen.lastIndex = 0
          let m
          while ((m = desen.exec(kaynak))) {
            const h = hedef(dosya, m[2])
            if (h && !m[1] && ONCEKI_ARAC_KODU.test(h)) ekle('D7', g, `imports ${h} — the country kit does not load the pre-split application's tool code (${m[2]})`)
          }
        }
      }
    }
    const icinde = g.startsWith(`${ULKELER_DIZINI}/`) ? g.split('/')[1] : null // 'active' | 'tumu.ts' | '<kod>'
    const paketIcinde = icinde && ulkeler.includes(icinde) ? icinde : null
    const giristeMi = icinde === GIRIS
    const setDili = dilSetiDili(g)

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
        const hedefSet = bolum === DIL_SETLERI ? h.split('/')[2] || '' : null

        if (setDili) {
          // D8: a language set stands under every country that speaks the language, so it may lean on none of them.
          if (hedefUlke) ekle('D8', g, `the language set "${setDili}" imports pack "${hedefUlke}" (${m[2]})`)
          if (hedefGiris || hedefTumu) ekle('D8', g, `a language set must not import ${h} (${m[2]})`)
          if (hedefSet !== null && hedefSet !== setDili) ekle('D8', g, `the language set "${setDili}" imports the language set "${hedefSet}" (${m[2]})`)
          continue
        }
        if (hedefSet !== null) {
          // A pack takes a language set; nobody else does (tests and scripts may look at one).
          if (paketIcinde || testMi(g) || g.startsWith('lib/ulke/testing/') || g.startsWith('scripts/')) continue
          ekle('D8', g, `imports ${h} directly — a language set is reached only through the country pack that took it (${m[2]})`)
          continue
        }

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
