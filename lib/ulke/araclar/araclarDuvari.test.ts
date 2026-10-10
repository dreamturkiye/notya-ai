/**
 * NOTYA-ULKE-ARACLAR-01 — WALL RULE D7 (scripts/ulke-duvarlari.mjs): a tool bound to one country's state or payer
 * system exists in no other country's build, and the country kit never loads the pre-split application's tool code.
 * The rule runs before every country build, so each breach below would stop that build.
 *
 *   1. the list of such tools (countries/yasak-araclar.json) holds every tool the audit removes, and no tool of the kit
 *   2. synthetic repositories with one breach each: the rule fires, by name
 *   3. the repository as it is: nothing of the kit reaches the other application's tool folders
 *   4. NOTYA-ULKE-OZEL-01 — the list is per country and holds a country's own tools too: its form is checked (one
 *      country per key; a key that carries a country's code is listed for that country), and the keys of the kit's
 *      test country are on it, so the rule itself proves that no real pack, language set or kit file names one
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { XX_OZEL_ARACLAR } from '../testing/ornekUlke/araclar'
import { KIT_ARACLARI } from './katalog'

const KOK = resolve(__dirname, '../../..')
const BETIK = join(KOK, 'scripts', 'ulke-duvarlari.mjs')
const YASAK = JSON.parse(readFileSync(join(KOK, 'countries/yasak-araclar.json'), 'utf8')) as Record<string, unknown>

function sahteDepo(dosyalar: Record<string, string>): string {
  const kok = mkdtempSync(join(tmpdir(), 'notya-arac-duvari-'))
  const temel: Record<string, string> = {
    'countries/active/index.ts': "let p\nif (process.env.NOTYA_COUNTRY === 'aa') {\n  p = require('../aa/index').P\n} else if (process.env.NOTYA_COUNTRY === 'bb') {\n  p = require('../bb/index').P\n}\nexport const AKTIF_PAKET = p\n",
    'countries/aa/index.ts': "export const P = { kod: 'aa', araclar: ['/x/aa-devlet'] }\n",
    'countries/aa/derleme.mjs': 'export default {}\n',
    'countries/aa/sizintiTerimleri.ts': 'export const T = []\n',
    'countries/bb/index.ts': "export const P = { kod: 'bb' }\n",
    'countries/bb/derleme.mjs': 'export default {}\n',
    'countries/bb/sizintiTerimleri.ts': 'export const T = []\n',
    'countries/yasak-araclar.json': JSON.stringify({ aciklama: 'x', aa: ['aa-devlet', 'aa-odeme'] }),
    'lib/ulke/araclar/katalog.ts': "export const KIT = [{ anahtar: 'olcek' }]\n",
    'specialties/x/engines/y.ts': 'export const y = 1\n',
    'next.config.mjs': 'export default {}\n',
  }
  for (const [yol, icerik] of Object.entries({ ...temel, ...dosyalar })) { mkdirSync(dirname(join(kok, yol)), { recursive: true }); writeFileSync(join(kok, yol), icerik) }
  return kok
}
const kos = (kok: string) => spawnSync('node', [BETIK, '--kok', kok], { encoding: 'utf8' })

describe('wall D7 — tools of one country\'s state or payer system', () => {
  it('the list holds the 14 tools the audit removes (and the two pages removed with them), and the kit holds none of them', () => {
    const tr = YASAK.tr as string[]
    for (const k of ['sgk-medula', 'enabiz', 'dahiliye-sgk', 'goz-sut-vegf', 'goz-sgk-rapor', 'goz-gil-kod', 'derm-biyolojik-sut', 'psik-sgk', 'kbb-sgk', 'kardio-sgk', 'gogus-sgk', 'nef-sgk', 'onko-sut', 'roma-biyolojik-sut']) assert.ok(tr.includes(k), `${k} is not on the list`)
    assert.equal(tr.length, 16); assert.equal(new Set(tr).size, 16)
    // every key on the list is a tool of the pre-split application (the list cannot go stale by a rename)
    for (const k of tr) assert.ok(existsSync(join(KOK, 'app/doktor-tools', k)) || existsSync(join(KOK, 'app/klinik-tools', k)), `${k} is on the list and is no tool page`)
    const kit = new Set(KIT_ARACLARI.map((t) => t.anahtar))
    for (const k of tr) assert.ok(!kit.has(k), `the kit holds "${k}"`)
    // audit and list agree: every "Remove" route of the audit is on the list
    const denetim = readFileSync(join(KOK, 'docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md'), 'utf8')
    const kaldirilan = [...denetim.matchAll(/`\/(?:doktor|klinik)-tools\/([a-z0-9-]+)` \|(?:[^|\n]*\|)? \*\*Remove\*\*/g)].map((m) => m[1])
    assert.ok(kaldirilan.length >= 14, `the audit's Remove rows were not found (${kaldirilan.length})`)
    for (const k of kaldirilan) assert.ok(tr.includes(k), `the audit removes "${k}" and the list does not hold it`)
  })

  it('the base repository of this test holds', () => {
    const kok = sahteDepo({})
    try { const r = kos(kok); assert.equal(r.status, 0, r.stderr || r.stdout) } finally { rmSync(kok, { recursive: true, force: true }) }
  })

  const IHLALLER: [string, Record<string, string>, RegExp][] = [
    ['the kit\'s catalogue names such a tool', { 'lib/ulke/araclar/katalog.ts': "export const KIT = [{ anahtar: 'aa-devlet' }]\n" }, /D7 {2}lib\/ulke\/araclar\/katalog\.ts: names "aa-devlet", a tool of "aa" only/],
    ['another country\'s pack switches it on', { 'countries/bb/araclar.ts': "export const A = [{ anahtar: 'aa-odeme', roller: null }]\n" }, /D7 {2}countries\/bb\/araclar\.ts: names "aa-odeme"/],
    ['a kit screen links to it', { 'components/ulke/uygulama/X.tsx': "export const yol = `/tools?arac=aa-devlet&x=1`\n" }, /D7 {2}components\/ulke\/uygulama\/X\.tsx: names "aa-devlet"/],
    ['a country route file names it', { 'app/tools/page.ulke.tsx': "export const a = \"aa-devlet\"\n" }, /D7 {2}app\/tools\/page\.ulke\.tsx: names "aa-devlet"/],
    ['a route folder carries its name', { 'app/tools/aa-devlet/page.ulke.tsx': 'export default function P() { return null }\n' }, /D7 {2}app\/tools\/aa-devlet\/: a route named after "aa-devlet"/],
    ['the kit imports a specialty engine of the other application', { 'lib/ulke/araclar/tanimlar/z.ts': "import { y } from '@/specialties/x/engines/y'\nexport const z = y\n" }, /D7 {2}lib\/ulke\/araclar\/tanimlar\/z\.ts: imports specialties\/x\/engines\/y/],
    ['a kit screen imports the other application\'s tool registry', { 'components/ulke/uygulama/X.tsx': "import { T } from '@/lib/doktor/doktorAraclari'\nexport const t = T\n", 'lib/doktor/doktorAraclari.ts': 'export const T = []\n' }, /D7 {2}components\/ulke\/uygulama\/X\.tsx: imports lib\/doktor\/doktorAraclari/],
    ['a pack that owns no such tool imports a tool page', { 'countries/bb/x.ts': "import P from '@/app/doktor-tools/olcek/page'\nexport const p = P\n", 'app/doktor-tools/olcek/page.tsx': 'export default function P() { return null }\n' }, /D7 {2}countries\/bb\/x\.ts: imports app\/doktor-tools\/olcek\/page/],
  ]
  for (const [ad, dosyalar, beklenen] of IHLALLER) {
    it(`fires: ${ad}`, () => {
      const kok = sahteDepo(dosyalar)
      try { const r = kos(kok); assert.equal(r.status, 1, `expected a violation:\n${r.stdout}`); assert.match(r.stderr, beklenen) } finally { rmSync(kok, { recursive: true, force: true }) }
    })
  }

  it('does not fire: the owning country names its own tool; a test of the kit compares with the other application; a type is imported', () => {
    const kok = sahteDepo({
      'countries/aa/araclar.ts': "export const A = ['aa-devlet', 'aa-odeme']\n",
      'lib/ulke/araclar/esdegerlik.test.ts': "import { y } from '@/specialties/x/engines/y'\nexport const z = y\n",
      'lib/ulke/araclar/t.ts': "import type { Y } from '@/specialties/x/engines/y'\nexport type Z = Y\n",
      'lib/ulke/araclar/yorum.ts': "// 'aa-devlet' is another country's and is named here only in a comment\nexport const x = 1\n",
    })
    try { const r = kos(kok); assert.equal(r.status, 0, r.stderr || r.stdout) } finally { rmSync(kok, { recursive: true, force: true }) }
  })

  // ── NOTYA-ULKE-OZEL-01: the list per country, and a country's own tools ──
  const LISTE_IHLALLERI: [string, unknown, RegExp][] = [
    ['a key listed for two countries', { aa: ['aa-devlet'], bb: ['aa-devlet'] }, /D7 {2}countries\/yasak-araclar\.json: "aa-devlet" is listed for "aa" and for "bb"/],
    ['a key that carries one country\'s code, listed for another', { aa: ['aa-devlet'], bb: ['aa-odeme'] }, /D7 {2}countries\/yasak-araclar\.json: "aa-odeme" carries the code "aa" and is listed for "bb"/],
    ['an entry that is no country', { aa: ['aa-devlet'], hepsi: ['x'] }, /D7 {2}countries\/yasak-araclar\.json: "hepsi": every entry is a country code with a list of tool keys/],
    ['an entry that is no list', { aa: 'aa-devlet' }, /D7 {2}countries\/yasak-araclar\.json: "aa": every entry is a country code with a list of tool keys/],
    ['a key that is no tool key', { aa: ['AA Devlet'] }, /D7 {2}countries\/yasak-araclar\.json: "aa": "AA Devlet" is not a tool key/],
    ['a key listed twice', { aa: ['aa-devlet', 'aa-devlet'] }, /D7 {2}countries\/yasak-araclar\.json: "aa": a key is listed twice/],
  ]
  for (const [ad, liste, beklenen] of LISTE_IHLALLERI) {
    it(`the list — fires: ${ad}`, () => {
      const kok = sahteDepo({ 'countries/aa/index.ts': "export const P = { kod: 'aa' }\n", 'countries/yasak-araclar.json': JSON.stringify({ aciklama: 'x', ...(liste as object) }) })
      try { const r = kos(kok); assert.equal(r.status, 1, `expected a violation:\n${r.stdout}`); assert.match(r.stderr, beklenen) } finally { rmSync(kok, { recursive: true, force: true }) }
    })
  }

  it('the list — does not fire: each country its own keys; a country with no folder (the kit\'s test country) may be listed; plain keys stay plain', () => {
    const kok = sahteDepo({ 'countries/yasak-araclar.json': JSON.stringify({ aciklama: 'x', aa: ['aa-devlet', 'aa-odeme', 'eski-anahtar'], bb: ['bb-devlet'], zz: ['zz-deneme'] }) })
    try { const r = kos(kok); assert.equal(r.status, 0, r.stderr || r.stdout) } finally { rmSync(kok, { recursive: true, force: true }) }
  })

  it('A COUNTRY\'S OWN TOOL IN ANOTHER COUNTRY: named by another pack, by a language set, by the kit — each fires; its own pack and a test may name it', () => {
    const liste = { 'countries/yasak-araclar.json': JSON.stringify({ aciklama: 'x', aa: ['aa-devlet', 'aa-odeme'], bb: ['bb-olcek'] }) }
    for (const [dosya, beklenen] of [
      ['countries/aa/araclar.ts', /D7 {2}countries\/aa\/araclar\.ts: names "bb-olcek", a tool of "bb" only/],
      ['countries/_dil/qq/araclar.ts', /D7 {2}countries\/_dil\/qq\/araclar\.ts: names "bb-olcek", a tool of "bb" only/],
      ['lib/ulke/araclar/tanimlar/x.ts', /D7 {2}lib\/ulke\/araclar\/tanimlar\/x\.ts: names "bb-olcek", a tool of "bb" only/],
    ] as const) {
      const kok = sahteDepo({ ...liste, [dosya]: "export const A = [{ anahtar: 'bb-olcek', roller: null }]\n" })
      try { const r = kos(kok); assert.equal(r.status, 1, `${dosya}: expected a violation:\n${r.stdout}`); assert.match(r.stderr, beklenen) } finally { rmSync(kok, { recursive: true, force: true }) }
    }
    const kok = sahteDepo({ ...liste, 'countries/bb/araclar.ts': "export const A = [{ anahtar: 'bb-olcek', roller: null }]\n", 'lib/ulke/araclar/x.test.ts': "export const k = 'bb-olcek'\n", 'lib/ulke/testing/ornek.ts': "export const k = 'bb-olcek'\n" })
    try { const r = kos(kok); assert.equal(r.status, 0, r.stderr || r.stdout) } finally { rmSync(kok, { recursive: true, force: true }) }
  })

  it('THE TEST COUNTRY\'S KEYS ARE ON THE LIST — so the wall, which holds, is the proof that no real pack, language set or kit file names one', () => {
    assert.deepEqual([...(YASAK.xx as string[])].sort(), [...XX_OZEL_ARACLAR].sort())
    for (const k of XX_OZEL_ARACLAR) assert.match(k, /^xx-/)
    // no folder of that code: it is in no build
    assert.equal(existsSync(join(KOK, 'countries/xx')), false)
    assert.equal(kos(KOK).status, 0)
    // …and the rule is not blind to them: planted in a copy of nothing but one real pack file, it fires
    const kok = sahteDepo({ 'countries/yasak-araclar.json': readFileSync(join(KOK, 'countries/yasak-araclar.json'), 'utf8'), 'countries/aa/araclar.ts': `export const A = ['${XX_OZEL_ARACLAR[0]}']\n` })
    try { const r = kos(kok); assert.equal(r.status, 1); assert.match(r.stderr, new RegExp(`names "${XX_OZEL_ARACLAR[0]}", a tool of "xx" only`)) } finally { rmSync(kok, { recursive: true, force: true }) }
  })

  it('the repository: the wall holds, and no file of the kit or of a country route reaches the other application\'s tool code', () => {
    const r = kos(KOK)
    assert.equal(r.status, 0, r.stderr || r.stdout)
    const gez = (d: string, cikti: string[] = []): string[] => { for (const ad of readdirSync(join(KOK, d), { withFileTypes: true })) { if (ad.isDirectory()) gez(`${d}/${ad.name}`, cikti); else if (/\.(ts|tsx)$/.test(ad.name) && !/\.test\.tsx?$/.test(ad.name)) cikti.push(`${d}/${ad.name}`) } return cikti }
    for (const d of [...gez('lib/ulke/araclar'), 'components/ulke/uygulama/Araclar.tsx', 'app/tools/page.ulke.tsx']) assert.doesNotMatch(readFileSync(join(KOK, d), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' '), /from '@\/(specialties|app\/doktor-tools|app\/klinik-tools|lib\/doktor\/doktorAraclari|lib\/klinik\/klinikAraclari)/, d)
  })
})
