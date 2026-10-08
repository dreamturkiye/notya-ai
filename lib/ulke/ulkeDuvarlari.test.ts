/**
 * NOTYA-ULKE-01 — the walls between countries hold, and the checker really catches a breach.
 *
 *   1. The repository as it is: zero violations (the same script runs in `prebuild`, so a breach stops the build).
 *   2. Synthetic repositories with one breach each: every rule D1–D6 fires.
 *   3. The entry point has the shape the bundler needs to drop the other packs (constant branches, require inside).
 *   4. Import graph: starting from the active entry point of country X, no file of another country is reachable.
 */
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

  it('the check runs before every build', () => {
    const pkg = JSON.parse(readFileSync(join(KOK, 'package.json'), 'utf8'))
    assert.match(pkg.scripts.prebuild, /node scripts\/ulke-duvarlari\.mjs/)
    assert.match(pkg.scripts.postbuild, /node scripts\/ulke-derleme-kaniti\.mjs/)
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
        if (existsSync(aday) && statSync(aday).isFile()) return aday
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
    for (const ulke of ULKE_KODLARI) {
      if (ulke === 'tr') continue
      const turkceli = [...new Set(girisler.flatMap((g) => [...erisilen(g, ulke)]))]
        .filter((d) => /[çğıöşüİĞŞÇÖÜ]/.test(yorumsuz(readFileSync(d, 'utf8'))))
        .map((d) => relative(KOK, d).split(sep).join('/'))
      assert.deepEqual(turkceli, [], `a ${ulke} build pulls Turkish text in through these files (outside comments)`)
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
