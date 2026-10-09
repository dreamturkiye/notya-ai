/**
 * NOTYA-ULKE-SABLON-01 — THE SCAFFOLD (scripts/ulke-yeni.mjs), run for a throwaway country in a temporary folder.
 * Nothing in the repository is written: the command is given another root (--kok).
 *
 *   1. It creates a pack that is complete in shape and marked "to be supplied" throughout, and says how much.
 *   2. It registers the code in every place a country must be named, and nowhere else.
 *   3. The new country starts closed: sign-up by invitation only, hidden from search.
 *   4. It copies no text of any existing country.
 *   5. The country's own record is the checklist with every gate unticked.
 *   6. It refuses a second run, a malformed code, language or path — and then changes nothing.
 * That the new pack COMPILES and then cannot be BUILT is proved on a full copy of the repository (the scaffold proof,
 * docs/COUNTRY-PACK-HOWTO.md); the type check is too slow for this suite.
 */
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { TUM_ULKELER } from '@/countries/tumu'
import { ULKE_KODLARI } from './tipler'

const KOK = resolve(__dirname, '../..')
const BETIK = join(KOK, 'scripts/ulke-yeni.mjs')
/** A throwaway code that is no country of this repository (ZZ and its neighbours are ISO's user-assigned codes). */
const K = ['zz', 'zy', 'zx', 'zw'].find((k) => !(ULKE_KODLARI as readonly string[]).includes(k)) as string
const B = K.toUpperCase()
let gecici = ''
const kos = (...argv: string[]) => spawnSync('node', [BETIK, ...argv, '--kok', gecici], { encoding: 'utf8' })
const oku = (g: string) => readFileSync(join(gecici, g), 'utf8')
function hepsi(dizin: string, cikti: string[] = []): string[] {
  for (const ad of readdirSync(dizin)) { const yol = join(dizin, ad); if (statSync(yol).isDirectory()) hepsi(yol, cikti); else cikti.push(yol) }
  return cikti
}
const anlik = () => JSON.stringify(hepsi(gecici).sort().map((f) => [f, readFileSync(f, 'utf8')]))

before(() => {
  gecici = mkdtempSync(join(tmpdir(), 'ulke-yeni-'))
  for (const g of ['countries/active', 'countries/tumu.ts', 'lib/ulke/tipler.ts', 'docs/COUNTRY-PACK-CHECKLIST.md']) {
    mkdirSync(join(gecici, g, '..'), { recursive: true })
    cpSync(join(KOK, g), join(gecici, g), { recursive: true })
  }
})
after(() => { if (gecici) rmSync(gecici, { recursive: true, force: true }) })

describe('scripts/ulke-yeni.mjs — a new country from the template', () => {
  it('refuses a malformed code, language or path, an existing country, and a missing argument — and changes nothing', () => {
    const once = anlik()
    for (const argv of [['GB', '--dil', 'en', '--yol', '/uk'], ['gbr', '--dil', 'en', '--yol', '/uk'], ['gb', '--dil', 'English', '--yol', '/uk'], ['gb', '--dil', 'en', '--yol', 'uk'], ['gb', '--dil', 'en', '--yol', '/a/b'], ['gb', '--dil', 'en'], ['gb', '--yol', '/uk'], ['active', '--dil', 'en', '--yol', '/x']]) {
      const r = kos(...argv)
      assert.equal(r.status, 1, `expected a refusal for: ${argv.join(' ')}\n${r.stdout}${r.stderr}`)
    }
    assert.equal(anlik(), once)
  })

  it('creates the pack, registers the code, and says exactly how much is still to supply', async () => {
    const r = kos(K, '--dil', 'en', '--yol', `/${K}`)
    assert.equal(r.status, 0, r.stdout + r.stderr)
    for (const f of ['index.ts', 'derleme.mjs', 'sizintiTerimleri.ts', 'metinler.ts', 'arayuz.ts', 'ayarlar.ts', 'uygulama/metinler.ts', 'uygulama/randevuMetinleri.ts', 'acilis/icerik.ts', 'klinik/index.ts', 'klinik/roller.ts', 'klinik/asistanlar.ts', 'klinik/notSablonlari.ts', 'klinik/talimatlar.ts']) assert.ok(existsSync(join(gecici, 'countries', K, f)), `countries/${K}/${f} was not written`)
    // registration: the code list, the language, one branch per door, the side-by-side list
    assert.match(oku('lib/ulke/tipler.ts'), new RegExp(`export const ULKE_KODLARI = \\[[^\\]]*'${K}'\\] as const`))
    assert.match(oku('lib/ulke/tipler.ts'), /export type DilKodu = [^\n]*\| 'en'/)
    for (const [dosya, ad] of [['index.ts', `${B}_PAKETI`], ['klinik.ts', `${B}_KLINIK`], ['arayuz.ts', `${B}_ARAYUZ`]]) {
      const kaynak = oku(`countries/active/${dosya}`)
      assert.match(kaynak, new RegExp(`\\} else if \\(process\\.env\\.NOTYA_COUNTRY === '${K}'\\) \\{\\n  \\w+ = require\\('\\.\\./${K}/[a-z/]+'\\)\\.${ad}\\n\\} else if \\(process\\.env\\.NOTYA_COUNTRY === 'tr' \\|\\| !process\\.env\\.NOTYA_COUNTRY\\)`), `${dosya}: the branch for "${K}" must sit before the pre-split application's, with its require inside it`)
      // every other country's branch is exactly as it was
      assert.equal(kaynak.replace(new RegExp(`\\} else if \\(process\\.env\\.NOTYA_COUNTRY === '${K}'\\) \\{\\n[^\\n]+\\n`), ''), readFileSync(join(KOK, 'countries/active', dosya), 'utf8'))
    }
    assert.ok(oku('countries/tumu.ts').includes(`  ${K}: { paket: ${B}_PAKETI, sizintiTerimleri: ${B}_SIZINTI_TERIMLERI, sizintiHarfleri: ${B}_SIZINTI_HARFLERI },\n}`))
    // the list: the same count the command printed, texts and settings, each with a hint
    const { eksikleriBul } = await import(pathToFileURL(join(KOK, 'scripts/ulke-paket-denetimi.mjs')).href) as { eksikleriBul: (kod: string, kok: string) => { dosya: string; satir: number; tur: string; ipucu: string }[] }
    const eksikler = eksikleriBul(K, gecici)
    const yazilan = /TO SUPPLY before the country can be built: (\d+) items — (\d+) texts, (\d+) settings/.exec(r.stdout)
    assert.ok(yazilan, r.stdout)
    assert.equal(eksikler.length, Number(yazilan[1]))
    assert.equal(eksikler.filter((e) => e.tur === 'text').length, Number(yazilan[2]))
    assert.ok(eksikler.length > 500 && eksikler.every((e) => e.ipucu.length > 5), 'every item needs a hint that says what belongs there')
    // every catalogue key of the kit is in the new pack
    const sekil = JSON.parse(readFileSync(join(KOK, 'scripts/ulke-sablon/sekil.json'), 'utf8')) as { cekirdek: Record<string, string[]>; uygulama: Record<string, unknown> }
    for (const [yuzey, anahtarlar] of Object.entries(sekil.cekirdek)) for (const k of anahtarlar) assert.ok(eksikler.some((e) => e.ipucu.includes(`${yuzey}.${k}`)), `core surface key ${yuzey}.${k} is missing from the new pack`)
    for (const grup of Object.keys(sekil.uygulama)) assert.match(oku(`countries/${K}/uygulama/metinler.ts`), new RegExp(`^  ${grup}: `, 'm'))
  })

  it('the new country starts closed: invitation only, hidden from search, and with the scan in its own build file', () => {
    const index = oku(`countries/${K}/index.ts`)
    assert.match(index, /^\s+kayitAcik: false,$/m)
    assert.match(index, /^\s+aramaMotorlarinaGizli: true,$/m)
    assert.ok(index.includes(`yolOnEki: '/${K}'`))
    assert.match(index, /araclar: \[\]/)
    for (const kapali of ['doktorAraclari', 'asistan', 'sesProfili', 'goruntuDegerlendirme', 'bolunmemisUygulama']) assert.doesNotMatch(index, new RegExp(`\\b${kapali}: true`), `${kapali} must be off in a new country`)
    assert.match(oku(`countries/${K}/derleme.mjs`), new RegExp(`^ulkeDerlemeKapisi\\('${K}'\\)$`, 'm'))
    assert.ok(oku(`countries/${K}/derleme.mjs`).includes(`yolOnEki: '/${K}'`))
    assert.match(oku(`countries/${K}/klinik/index.ts`), /hukukcuInceledi: false/)
  })

  it('copies no text of any existing country: none of their leak terms or letters is in the new folder', () => {
    // The record (docs/COUNTRY-PACK-<CODE>.md) is the checklist's own wording, which names Türkiye in its rules; the pack folder is what must be clean.
    const dosyalar = hepsi(join(gecici, 'countries', K))
    for (const [kod, u] of Object.entries(TUM_ULKELER)) {
      for (const f of dosyalar) {
        const icerik = readFileSync(f, 'utf8')
        for (const t of u.sizintiTerimleri) {
          const var_ = t.eslesme === 'kelime' ? new RegExp(`(?<![\\p{L}\\p{N}])${t.terim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, t.buyukKucukDuyarli ? 'u' : 'iu').test(icerik) : icerik.toLowerCase().includes(t.terim.toLowerCase())
          assert.ok(!var_, `${f.slice(gecici.length + 1)} carries "${t.terim}", a term of "${kod}"`)
        }
        // Türkiye's letters are also the letters of the kit's own internal names (keys are Turkish words in ASCII); a pack's
        // own letters must not appear in what the scaffold writes.
        if (u.sizintiHarfleri) assert.doesNotMatch(icerik, new RegExp(`[${u.sizintiHarfleri}]`, 'u'), `${f.slice(gecici.length + 1)} carries a letter of "${kod}"`)
      }
    }
  })

  it('the country\'s record is the checklist with every gate unticked, and says what building does not prove', () => {
    const kayit = oku(`docs/COUNTRY-PACK-${B}.md`)
    const kutu = (s: string) => s.split('\n').filter((x) => /^- \[.\]/.test(x))
    const liste = kutu(readFileSync(join(KOK, 'docs/COUNTRY-PACK-CHECKLIST.md'), 'utf8'))
    assert.equal(kutu(kayit).length, liste.length)
    assert.ok(kutu(kayit).every((x) => x.startsWith('- [ ]')), 'every gate starts unticked')
    assert.deepEqual(kutu(kayit).map((x) => x.slice(6)), liste.map((x) => x.slice(6)))
    assert.match(kayit, /What building the pack does NOT prove/)
    assert.match(kayit, /Sign-up is closed/)
  })

  it('refuses to run twice for the same country, and changes nothing the second time', () => {
    const once = anlik()
    const r = kos(K, '--dil', 'en', '--yol', `/${K}`)
    assert.equal(r.status, 1)
    assert.match(r.stderr, /already exists/)
    assert.equal(anlik(), once)
  })
})
