/**
 * NOTYA-ULKE-01 — the walls between countries hold, and the checker really catches a breach.
 *
 *   1. The repository as it is: zero violations (the same check runs before every country build, so a breach stops it).
 *   2. Synthetic repositories with one breach each: every rule D1–D6 fires, and D8 (language sets, NOTYA-ULKE-EN-01).
 *   3. The entry point has the shape the bundler needs to drop the other packs (constant branches, require inside).
 *   4. Import graph: starting from the active entry point of country X, no file of another country is reachable.
 */
import { pathToFileURL } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { ULKE_KODLARI } from './tipler'

const KOK = resolve(__dirname, '../..')
const BETIK = join(KOK, 'scripts', 'ulke-duvarlari.mjs')
const kos = (kok: string) => spawnSync('node', [BETIK, '--kok', kok], { encoding: 'utf8' })

function sahteDepo(dosyalar: Record<string, string>): string {
  const kok = mkdtempSync(join(tmpdir(), 'notya-duvar-'))
  const temel: Record<string, string> = {
    'countries/active/index.ts': "let p\nif (process.env.NOTYA_COUNTRY === 'aa') {\n  p = require('../aa/index').P\n} else if (process.env.NOTYA_COUNTRY === 'bb') {\n  p = require('../bb/index').P\n}\nexport const AKTIF_PAKET = p\n",
    'countries/aa/index.ts': "import { x } from '@/lib/cekirdek'\nexport const P = { kod: 'aa', x }\n",
    'countries/aa/derleme.mjs': 'export default {}\n',
    'countries/aa/sizintiTerimleri.ts': 'export const T = []\n',
    'countries/bb/index.ts': "export const P = { kod: 'bb' }\n",
    'countries/bb/derleme.mjs': 'export default {}\n',
    'countries/bb/sizintiTerimleri.ts': 'export const T = []\n',
    'countries/tumu.ts': "import { P as A } from './aa/index'\nimport { P as B } from './bb/index'\nexport const TUMU = { A, B }\n",
    'lib/cekirdek.ts': "import { AKTIF_PAKET } from '@/countries/active'\nexport const x = 1\nexport const kod = () => AKTIF_PAKET.kod\n",
    'lib/a.test.ts': "import { TUMU } from '../countries/tumu'\nexport const t = TUMU\n",
    'next.config.mjs': "const U = process.env.NOTYA_COUNTRY || 'aa'\nconst d = await import(`./countries/${U}/derleme.mjs`)\nexport default d\n",
  }
  for (const [yol, icerik] of Object.entries({ ...temel, ...dosyalar })) {
    mkdirSync(dirname(join(kok, yol)), { recursive: true })
    writeFileSync(join(kok, yol), icerik)
  }
  return kok
}

describe('walls: the repository', () => {
  it('holds — zero violations', () => {
    const r = kos(KOK)
    assert.equal(r.status, 0, r.stderr || r.stdout)
    assert.match(r.stdout, new RegExp(`walls hold — countries: ${[...ULKE_KODLARI].sort().join(', ')}`))
  })

  it('the check runs before every COUNTRY build and the build proof after it; a build with no country set runs neither', async () => {
    const pkg = JSON.parse(readFileSync(join(KOK, 'package.json'), 'utf8'))
    // Türkiye's build is what it is on main: nothing of the country side in prebuild / build / postbuild.
    for (const ad of ['prebuild', 'build', 'postbuild']) assert.doesNotMatch(pkg.scripts[ad] ?? '', /ulke/)
    assert.equal(pkg.scripts['build:ulke'], 'node scripts/ulke-derle.mjs')
    assert.match(readFileSync(join(KOK, 'scripts/ulke-derle.mjs'), 'utf8'), /kos\('npm', \['run', 'build'\], \{ NOTYA_ULKE_DERLEME: '1' \}\)[\s\S]*scripts\/ulke-derleme-kaniti\.mjs/)
    assert.doesNotMatch(readFileSync(join(KOK, 'countries/tr/derleme.mjs'), 'utf8'), /^import /m)
    // The gate a country's build file calls: walls, then the refusal of a bare `next build`.
    const { ulkeDerlemeKapisi, nextDerlemesiMi } = await import(pathToFileURL(join(KOK, 'scripts/ulke-derleme-kapisi.mjs')).href) as { ulkeDerlemeKapisi: (kod: string, s?: { argv?: string[]; ortam?: Record<string, string | undefined> }) => void; nextDerlemesiMi: (argv: string[]) => boolean }
    assert.equal(nextDerlemesiMi(['node', '/x/node_modules/.bin/next', 'build']), true)
    for (const argv of [['node', '/x/node_modules/.bin/next', 'start'], ['node', '/x/node_modules/.bin/next', 'dev'], ['node', '/x/jest-worker/processChild.js'], ['node', '/x/scripts/ulke-derle.mjs'], ['node']]) assert.equal(nextDerlemesiMi(argv), false, argv.join(' '))
    const derle = ['node', '/x/node_modules/.bin/next', 'build']
    assert.throws(() => ulkeDerlemeKapisi('uz', { argv: derle, ortam: {} }), /npm run build:ulke[\s\S]*refused/)
    assert.doesNotThrow(() => ulkeDerlemeKapisi('uz', { argv: derle, ortam: { NOTYA_ULKE_DERLEME: '1' } }))
    assert.doesNotThrow(() => ulkeDerlemeKapisi('uz', { argv: ['node', '/x/node_modules/.bin/next', 'start'], ortam: {} }))
  })
})

describe('walls: every rule catches its breach', () => {
  const beklenen: [string, string, Record<string, string>][] = [
    ['clean synthetic repository', '', {}],
    ['D1', 'core imports a pack directly (alias)', { 'lib/sizinti.ts': "import { P } from '@/countries/aa/index'\nexport const p = P\n" }],
    ['D1', 'core imports a pack directly (relative)', { 'app/x/page.tsx': "import { P } from '../../countries/bb'\nexport default function X() { return P.kod }\n" }],
    ['D1', 'core requires a pack', { 'lib/sizinti.ts': "export const p = require('@/countries/aa/araclar')\n" }],
    ['D1', 'core dynamically imports a pack', { 'lib/sizinti.ts': "export const p = () => import('@/countries/bb/index')\n" }],
    ['D2', 'application code imports the all-packs registry', { 'lib/sizinti.ts': "import { TUMU } from '@/countries/tumu'\nexport const t = TUMU\n" }],
    ['D3', 'one pack imports another', { 'countries/bb/index.ts': "import { P as A } from '../aa/index'\nexport const P = { kod: 'bb', a: A }\n" }],
    ['D3', 'one pack imports another (alias)', { 'countries/bb/metin.ts': "import { P } from '@/countries/aa'\nexport const m = P\n" }],
    ['D3', 'a pack imports the entry point', { 'countries/aa/index.ts': "import { AKTIF_PAKET } from '../active'\nexport const P = { kod: 'aa', a: AKTIF_PAKET }\n" }],
    ['D4', 'the entry point imports a pack statically', { 'countries/active/index.ts': "import { P } from '../aa/index'\nlet p = P\nif (process.env.NOTYA_COUNTRY === 'aa') {\n  p = require('../aa/index').P\n} else if (process.env.NOTYA_COUNTRY === 'bb') {\n  p = require('../bb/index').P\n}\nexport const AKTIF_PAKET = p\n" }],
    ['D4', 'a pack required in another country branch', { 'countries/active/index.ts': "let p\nif (process.env.NOTYA_COUNTRY === 'aa') {\n  p = require('../bb/index').P\n} else if (process.env.NOTYA_COUNTRY === 'bb') {\n  p = require('../bb/index').P\n}\nexport const AKTIF_PAKET = p\n" }],
    ['D4', 'a pack required outside any branch', { 'countries/active/index.ts': "let p\nif (process.env.NOTYA_COUNTRY === 'aa') {\n  p = require('../aa/index').P\n} else if (process.env.NOTYA_COUNTRY === 'bb') {\n  p = require('../bb/index').P\n} else {\n  p = require('../aa/index').P\n}\nexport const AKTIF_PAKET = p\n" }],
    ['D4', 'a country without a branch', { 'countries/cc/index.ts': "export const P = { kod: 'cc' }\n", 'countries/cc/derleme.mjs': 'export default {}\n', 'countries/cc/sizintiTerimleri.ts': 'export const T = []\n' }],
    ['D5', 'core reads the country variable itself', { 'lib/sizinti.ts': "export const tr = process.env.NOTYA_COUNTRY === 'aa'\n" }],
    ['D5', 'core compares the active country with a code', { 'components/X.tsx': "import { aktifUlke } from '@/lib/ulke/ulke'\nexport const X = () => (aktifUlke() === 'aa' ? 1 : 2)\n" }],
    ['D6', 'a country folder without its leak terms', { 'countries/dd/index.ts': "export const P = { kod: 'dd' }\n", 'countries/dd/derleme.mjs': 'export default {}\n', 'countries/active/index.ts': "let p\nif (process.env.NOTYA_COUNTRY === 'aa') {\n  p = require('../aa/index').P\n} else if (process.env.NOTYA_COUNTRY === 'bb') {\n  p = require('../bb/index').P\n} else if (process.env.NOTYA_COUNTRY === 'dd') {\n  p = require('../dd/index').P\n}\nexport const AKTIF_PAKET = p\n" }],
    // NOTYA-ULKE-EN-01 — language sets (countries/_dil/<language>/)
    ['D8', 'a language set imports a pack', { 'countries/_dil/xx/metin.ts': "import { P } from '../../aa/index'\nexport const m = P\n" }],
    ['D8', 'a language set imports a pack (alias)', { 'countries/_dil/xx/metin.ts': "import { P } from '@/countries/bb/index'\nexport const m = P\n" }],
    ['D8', 'a language set imports the entry point', { 'countries/_dil/xx/metin.ts': "import { AKTIF_PAKET } from '@/countries/active'\nexport const m = AKTIF_PAKET\n" }],
    ['D8', 'a language set imports the all-packs registry', { 'countries/_dil/xx/metin.ts': "import { TUMU } from '../../tumu'\nexport const m = TUMU\n" }],
    ['D8', 'a language set imports another language set', { 'countries/_dil/xx/metin.ts': "import { y } from '../yy/metin'\nexport const m = y\n", 'countries/_dil/yy/metin.ts': 'export const y = 1\n' }],
    ['D8', 'core imports a language set directly', { 'countries/_dil/xx/metin.ts': 'export const m = 1\n', 'lib/sizinti.ts': "import { m } from '@/countries/_dil/xx/metin'\nexport const s = m\n" }],
    ['D8', 'a route imports a language set directly', { 'countries/_dil/xx/metin.ts': 'export const m = 1\n', 'app/x/page.tsx': "import { m } from '../../countries/_dil/xx/metin'\nexport default function X() { return m }\n" }],
    ['D8', 'the entry point imports a language set', { 'countries/_dil/xx/metin.ts': 'export const m = 1\n', 'countries/active/index.ts': "import { m } from '../_dil/xx/metin'\nlet p\nif (process.env.NOTYA_COUNTRY === 'aa') {\n  p = require('../aa/index').P\n} else if (process.env.NOTYA_COUNTRY === 'bb') {\n  p = require('../bb/index').P\n}\nexport const AKTIF_PAKET = p ?? m\n" }],
    ['D8', 'a language set carries a pack marker', { 'countries/_dil/xx/metin.ts': "export const iz = 'notya-ulke-paketi:xx:0000000000'\n" }],
    ['D5', 'a language set reads the country variable', { 'countries/_dil/xx/metin.ts': "export const m = process.env.NOTYA_COUNTRY === 'aa' ? 1 : 2\n" }],
  ]
  for (const [kural, ad, dosyalar] of beklenen) {
    it(kural === 'clean synthetic repository' ? kural : `${kural} — ${ad}`, () => {
      const kok = sahteDepo(dosyalar)
      try {
        const r = kos(kok)
        if (!ad) { assert.equal(r.status, 0, r.stderr); return }
        assert.equal(r.status, 1, `expected a violation, got: ${r.stdout}`)
        assert.match(r.stderr, new RegExp(`^\\s+${kural}\\s`, 'm'), r.stderr)
      } finally { rmSync(kok, { recursive: true, force: true }) }
    })
  }

  it('D8 — a pack takes a language set, two packs take the same one, a set leans on core, a test looks at one: all allowed, and a set is not a country', () => {
    const kok = sahteDepo({
      'countries/_dil/xx/metin.ts': "import { x } from '@/lib/cekirdek'\nimport { y } from './yazim'\nexport const m = [x, y]\n",
      'countries/_dil/xx/yazim.ts': 'export const y = 1\n',
      'countries/_dil/xx/yazim.test.ts': "import { y } from './yazim'\nexport const t = y\n",
      'countries/aa/metin.ts': "import { m } from '../_dil/xx/metin'\nexport const a = m\n",
      'countries/bb/metin.ts': "import { m } from '@/countries/_dil/xx/metin'\nexport const b = m\n",
      'countries/bb/metin.test.ts': "import { y } from '../_dil/xx/yazim'\nexport const t = y\n",
      'lib/set.test.ts': "import { m } from '@/countries/_dil/xx/metin'\nexport const t = m\n",
      'scripts/say.mjs': "import { m } from '../countries/_dil/xx/metin'\nexport const s = m\n",
    })
    try {
      const r = kos(kok)
      assert.equal(r.status, 0, r.stderr)
      // the folder of language sets is not a country: no branch is asked of the entry point for it, no build file, no leak list
      assert.match(r.stdout, /walls hold — countries: aa, bb\n/)
    } finally { rmSync(kok, { recursive: true, force: true }) }
  })

  it('a sentence about an import in a comment is not an import', () => {
    const kok = sahteDepo({ 'lib/yorum.ts': "// never write: import { P } from '@/countries/aa/index'\n/* nor require('@/countries/bb/index') */\nexport const y = 1\n" })
    try { assert.equal(kos(kok).status, 0) } finally { rmSync(kok, { recursive: true, force: true }) }
  })
})

describe('build-time selection: the entry point and the import graph', () => {
  const giris = readFileSync(join(KOK, 'countries/active/index.ts'), 'utf8')

  it('one constant branch per country, each requiring only its own pack', () => {
    for (const kod of ULKE_KODLARI) {
      const dal = new RegExp(`if \\(process\\.env\\.NOTYA_COUNTRY === '${kod}'[^)]*\\) \\{\\n\\s+paket = require\\('\\.\\./${kod}/index'\\)\\.[A-Z]{2}_PAKETI\\n\\s*\\}`)
      assert.match(giris, dal, `branch for ${kod}`)
    }
    assert.equal((giris.match(/\brequire\(/g) || []).length, ULKE_KODLARI.length)
    assert.doesNotMatch(giris.replace(/^import type .*$/gm, ''), /^import /m, 'no static import in the entry point')
    assert.match(giris, /throw new Error\(`NOTYA_COUNTRY=/)
  })

  it('the build inlines the country so those branches are constant', () => {
    const config = readFileSync(join(KOK, 'next.config.mjs'), 'utf8')
    assert.match(config, /env: \{[\s\S]*?NOTYA_COUNTRY: ULKE,/)
  })

  /** Static import graph from a file, following relative and '@/' specifiers, with NOTYA_COUNTRY folded to `ulke`. */
  function erisilen(baslangic: string, ulke: string): Set<string> {
    const gorulen = new Set<string>()
    const coz = (tabandan: string, b: string): string | null => {
      const ham = b.startsWith('@/') ? join(KOK, b.slice(2)) : b.startsWith('.') ? resolve(dirname(tabandan), b) : null
      if (!ham) return null
      for (const aday of [ham, `${ham}.ts`, `${ham}.tsx`, `${ham}.mjs`, join(ham, 'index.ts'), join(ham, 'index.tsx')]) {
        // Code only: an imported photograph or stylesheet is not text a build could show (NOTYA-UZ-ACILIS-02).
        if (existsSync(aday) && statSync(aday).isFile() && /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(aday)) return aday
      }
      return null
    }
    const gez = (dosya: string) => {
      if (gorulen.has(dosya)) return
      gorulen.add(dosya)
      // Type-only imports are erased by the compiler: they put nothing into a build.
      let kaynak = readFileSync(dosya, 'utf8').replace(/^\s*(import|export)\s+type\b[^\n]*$/gm, '')
      if (relative(KOK, dosya).split(sep).join('/').startsWith('countries/active/')) {
        // What the bundler does with the inlined constant: keep the branch of `ulke`, drop the others.
        kaynak = kaynak.split('\n').filter((satir) => {
          const r = /require\('\.\.\/([a-z]{2})\//.exec(satir)
          return !r || r[1] === ulke
        }).join('\n')
      }
      const desen = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g
      let m: RegExpExecArray | null
      while ((m = desen.exec(kaynak))) {
        const hedef = coz(dosya, m[1])
        if (hedef) gez(hedef)
      }
    }
    gez(baslangic)
    return gorulen
  }

  it('from the entry point of one country, no file of another country is reachable', () => {
    const girisler = readdirSync(join(KOK, 'countries/active')).filter((d) => /\.(ts|tsx)$/.test(d)).map((d) => join(KOK, 'countries/active', d))
    assert.ok(girisler.length >= 1)
    for (const ulke of ULKE_KODLARI) {
      const dosyalar = [...new Set(girisler.flatMap((g) => [...erisilen(g, ulke)]))].map((d) => relative(KOK, d).split(sep).join('/'))
      assert.ok(dosyalar.some((d) => d.startsWith(`countries/${ulke}/`)), `${ulke}: own pack not reached — the graph walk is broken`)
      for (const diger of ULKE_KODLARI) {
        if (diger === ulke) continue
        const sizan = dosyalar.filter((d) => d.startsWith(`countries/${diger}/`))
        assert.deepEqual(sizan, [], `a ${ulke} build reaches ${diger} files`)
      }
      assert.ok(!dosyalar.includes('countries/tumu.ts'), `${ulke}: the all-packs registry is reachable from the entry point`)
    }
  })

  /**
   * NOTYA-UZ-MUAYENE-01 — SHARED INFRASTRUCTURE a country build is allowed to reuse although the file still carries
   * Turkish text outside comments. Reuse is deliberate: copying the patient-data cipher or the model gateway into a
   * second implementation would be the larger risk (two ciphers drift apart and data stops decrypting; the model
   * policy allows exactly one gateway). And the files are NOT edited to remove the text, because the Turkish
   * product is in beta and nothing it runs on is touched (Kaan, 2026-10-08).
   *
   * What makes each entry safe is stated per file, and checked below: the Turkish text is an internal error or log
   * line (or a classifier of Turkish input) that no country route shows to anyone. `azamiSatir` is a ratchet.
   * Removing these exceptions is docs/COUNTRY-PACK-SPLIT-PLAN.md, job 5 ("server messages as codes").
   */
  const PAYLASILAN_ALTYAPI: Record<string, { neden: string; azamiSatir: number }> = {
    'lib/security/encryption.ts': {
      neden: 'The one cipher for patient data (AES-256-GCM). Its only Turkish text is the error thrown when the deployment has no master key — a configuration fault that ends in a 500 with a machine code, never in an answer.',
      azamiSatir: 1,
    },
    // The model gateway (.cursor/skills/ai-model-politikasi/SKILL.md: every call to a model goes through ONE door).
    // Reached from lib/ulke/uygulama/notModeli.ts only. A second gateway for another country would break the policy
    // (model choice, fallback gates, usage rows, "do not train on this" header) — so the one gateway is reused as it is.
    // What its Turkish text is, file by file, and why none of it reaches a doctor: notModeli.ts catches everything the
    // gateway throws and returns null; the route answers with a code (tested: countries/uz/uygulama/not.test.ts).
    'lib/ai/cagir.ts': {
      neden: 'The gateway itself. Turkish text: two messages of errors it throws (no key configured, time budget used up) and one console line about a broken stream. Thrown errors are caught in notModeli.ts; console lines stay in the server log.',
      azamiSatir: 3,
    },
    'lib/ai/saglayici.ts': {
      neden: 'Transport to the provider. Turkish text: the messages of the transport errors it throws (timeout, network, empty body, broken stream). All of them are AiCagriHatasi, caught in notModeli.ts, which logs only the HTTP status.',
      azamiSatir: 7,
    },
    'lib/ai/modeller.ts': {
      neden: 'The model policy table. Turkish text: word lists that CLASSIFY Turkish chat input (safety words, small talk, application terms) for the assistant, one error message for an unknown task name, and reason labels written to logs. None of it is output; a country note call uses only the task-to-model lookup.',
      azamiSatir: 17,
    },
    'lib/ai/kullanim.ts': {
      neden: 'Writes the usage row of every model call (token counts, model, task, doctor id — never content). Turkish text: one console warning when the row cannot be written.',
      azamiSatir: 1,
    },
  }

  // Every route file of a build that is not the pre-split application: the *.ulke.* files under app/, the root
  // not-found page (app/not-found.mjs — the one route file with a single extension) and middleware.ulke.ts.
  function ulkeRotaDosyalari(): string[] {
    const out: string[] = existsSync(join(KOK, 'middleware.ulke.ts')) ? [join(KOK, 'middleware.ulke.ts')] : []
    const gez = (dizin: string) => {
      for (const ad of readdirSync(dizin)) {
        const yol = join(dizin, ad)
        if (statSync(yol).isDirectory()) gez(yol)
        else if (/\.ulke\.(ts|tsx)$/.test(ad) || yol === join(KOK, 'app', 'not-found.mjs')) out.push(yol)
      }
    }
    gez(join(KOK, 'app'))
    return out
  }

  it('a build that is not Türkiye: nothing reachable from its route files or its pack carries Turkish text', () => {
    // Start from everything such a build compiles: its route files (*.ulke.*), its middleware, and the pack doors.
    const girisler = [...ulkeRotaDosyalari(), ...readdirSync(join(KOK, 'countries/active')).filter((d) => /\.(ts|tsx)$/.test(d)).map((d) => join(KOK, 'countries/active', d))]
    assert.ok(girisler.some((g) => g.endsWith('middleware.ulke.ts')), 'middleware.ulke.ts must be among the starting points')
    assert.ok(girisler.includes(join(KOK, 'app', 'not-found.mjs')), 'app/not-found.mjs must be among the starting points')
    const yorumsuz = (k: string) => k.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
    const turkceSatirlar = (d: string) => yorumsuz(readFileSync(d, 'utf8')).split('\n').filter((satir) => /[çğıöşüİĞŞÇÖÜ]/.test(satir)).length
    for (const ulke of ULKE_KODLARI) {
      if (ulke === 'tr') continue
      const erisilenler = [...new Set(girisler.flatMap((g) => [...erisilen(g, ulke)]))]
      const goreli = (d: string) => relative(KOK, d).split(sep).join('/')
      const turkceli = erisilenler.filter((d) => turkceSatirlar(d) > 0).map(goreli)
      assert.deepEqual(turkceli.filter((d) => !(d in PAYLASILAN_ALTYAPI)), [], `a ${ulke} build pulls Turkish text in through these files (outside comments)`)
      // The exceptions are a short, reasoned list — and a ratchet: a file on it may not gain Turkish lines, and an
      // entry nobody reaches any more must be removed.
      const ulasilan = new Set(erisilenler.map(goreli))
      for (const [dosya, k] of Object.entries(PAYLASILAN_ALTYAPI)) {
        assert.ok(ulasilan.has(dosya), `stale exception: ${dosya} is no longer reachable from a ${ulke} build — remove it from PAYLASILAN_ALTYAPI`)
        assert.ok(k.neden.length > 40, `${dosya}: say why this shared file is allowed`)
        const n = turkceSatirlar(join(KOK, dosya))
        assert.ok(n <= k.azamiSatir, `${dosya} now carries ${n} lines with Turkish text (allowed: ${k.azamiSatir}). New Turkish text in shared infrastructure reaches every country's build.`)
      }
    }
  })

  /**
   * NOTYA-UZ-ACILIS-02 — SHARED VISUAL COMPONENTS of the Turkish landing pages that another country's landing page
   * may reuse, BY NAME. The Uzbek landing page mirrors the Turkish one (Kaan, 2026-10-08); these files are reused as
   * they are — never edited for another country — because they are presentational: every word they show arrives as
   * a property. Anything else under the Turkish landing folders (their content file, the bar, the hero, the forms,
   * the price table — all of which hold Turkish text or Türkiye-only content) must not be reachable from such a build.
   */
  const PAYLASILAN_GORSEL_BILESENLER: Record<string, string> = {
    'components/doktor-landing/cn.ts': 'Joins class names. No text.',
    'components/doktor-landing/button.tsx': 'A link or button in the landing style. Its label is its children.',
    'components/doktor-landing/icons.tsx': 'Three line icons (arrow, menu, close), hidden from assistive technology. No text.',
    'components/doktor-landing/feature.tsx': 'The section pattern and the typographic card. Every string is a property.',
  }
  const TURKIYE_ACILIS_KLASORLERI = ['components/doktor-landing/', 'components/klinik-landing/', 'app/doktor/', 'app/klinik/']

  it('a build that is not Türkiye reaches the Turkish landing folders only through the presentational components named here', () => {
    const girisler = [...ulkeRotaDosyalari(), ...readdirSync(join(KOK, 'countries/active')).filter((d) => /\.(ts|tsx)$/.test(d)).map((d) => join(KOK, 'countries/active', d))]
    const yorumsuz = (k: string) => k.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
    for (const ulke of ULKE_KODLARI) {
      if (ulke === 'tr') continue
      const erisilenler = [...new Set(girisler.flatMap((g) => [...erisilen(g, ulke)]))].map((d) => relative(KOK, d).split(sep).join('/'))
      const acilistan = erisilenler.filter((d) => TURKIYE_ACILIS_KLASORLERI.some((k) => d.startsWith(k)))
      assert.deepEqual(acilistan.filter((d) => !(d in PAYLASILAN_GORSEL_BILESENLER)), [], `a ${ulke} build reaches Turkish landing files that are not on the list`)
      for (const [dosya, neden] of Object.entries(PAYLASILAN_GORSEL_BILESENLER)) {
        assert.ok(acilistan.includes(dosya), `stale entry: ${dosya} is no longer reachable from a ${ulke} build — remove it from PAYLASILAN_GORSEL_BILESENLER`)
        assert.ok(neden.length > 10, dosya)
        const ham = readFileSync(join(KOK, dosya), 'utf8')
        const kaynak = yorumsuz(ham)
        // Presentational: no Turkish letter anywhere in the code, no landing content, nothing of the application.
        assert.doesNotMatch(kaynak, /[çğıöşüİĞŞÇÖÜ]/, `${dosya} now holds Turkish text — it can no longer be shared; write the other country its own component`)
        const ithal = [...kaynak.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1])
        for (const i of ithal) assert.match(i, /^(react|\.\/cn)$/, `${dosya} imports ${i} — a shared presentational component imports nothing but React and cn`)
        // No sentence of its own: text between tags, or a quoted label / alt / title / placeholder.
        assert.doesNotMatch(kaynak, />\s*[A-Za-z][a-z]+ [a-z]+[^<{]*</, `${dosya} now shows words of its own`)
        assert.doesNotMatch(kaynak, /\b(aria-label|alt|title|placeholder)=["'][^"']/, `${dosya} now carries a fixed label`)
      }
    }
  })

  it('no route of such a build hands a shared module\'s error text to the caller', () => {
    const yorumsuz = (k: string) => k.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
    // The exceptions above are safe only while their Turkish sentences stay inside the server: thrown errors and log
    // lines. A country route answers with machine codes (lib/ulke/uygulama/cevap.ts) and never forwards `.message`.
    for (const yol of ulkeRotaDosyalari().filter((d) => /[\\/]route\.ulke\.ts$/.test(d))) {
      const kaynak = yorumsuz(readFileSync(yol, 'utf8'))
      assert.doesNotMatch(kaynak, /\.message\b|String\(\s*(e|err|error|hata)\s*\)/, `${relative(KOK, yol)} may put an error's own text into its answer`)
    }
    // The Turkish sentences that ARE exported for showing to a person must never be imported on this side.
    for (const ulke of ULKE_KODLARI) {
      if (ulke === 'tr') continue
      for (const d of new Set(ulkeRotaDosyalari().flatMap((g) => [...erisilen(g, ulke)]))) {
        assert.doesNotMatch(readFileSync(d, 'utf8'), /\b(OTURUM_YOK|KOTA_MESAJI)\b\s*[,}]\s*(from|\})|import\s*\{[^}]*\b(KOTA_MESAJI)\b/, `${relative(KOK, d)} imports a Turkish sentence`)
      }
    }
  })

  it('the build-output proof script finds a planted foreign pack and passes a clean output', () => {
    const betik = join(KOK, 'scripts/ulke-derleme-kaniti.mjs')
    const iz = (kod: string) => /\biz:\s*'([^']+)'/.exec(readFileSync(join(KOK, 'countries', kod, 'index.ts'), 'utf8'))![1]
    const cikti = mkdtempSync(join(tmpdir(), 'notya-derleme-'))
    try {
      mkdirSync(join(cikti, 'server/app'), { recursive: true })
      mkdirSync(join(cikti, 'static/chunks'), { recursive: true })
      mkdirSync(join(cikti, 'cache'), { recursive: true })
      const kosKanit = (ulke: string) => spawnSync('node', [betik, '--dizin', cikti], { encoding: 'utf8', env: { ...process.env, NOTYA_COUNTRY: ulke } })
      assert.equal(kosKanit('uz').status, 0, 'no output yet: nothing to check')
      writeFileSync(join(cikti, 'server/app/page.js'), `module.exports={iz:"${iz('uz')}"}`)
      writeFileSync(join(cikti, 'cache/eski.pack'), `{iz:"${iz('tr')}"}`) // the compiler cache is not output
      const temiz = kosKanit('uz')
      assert.equal(temiz.status, 0, temiz.stderr)
      assert.match(temiz.stdout, /"uz" pack present/)
      writeFileSync(join(cikti, 'static/chunks/x.js'), `self.x={iz:"${iz('tr')}"}`)
      const kirli = kosKanit('uz')
      assert.equal(kirli.status, 1)
      assert.match(kirli.stderr, /contains another country's pack[\s\S]*tr: 1 file/)
      // Without the active pack's own marker the absence of the others proves nothing.
      rmSync(join(cikti, 'static/chunks/x.js'))
      const bos = kosKanit('tr')
      assert.equal(bos.status, 1)
    } finally { rmSync(cikti, { recursive: true, force: true }) }
  })
})
