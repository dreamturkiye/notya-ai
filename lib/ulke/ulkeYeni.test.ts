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
    // the command says, as a step of its own, that the country needs a database of its own and which file makes it
    assert.match(r.stdout, /THE COUNTRY'S OWN DATABASE[\s\S]*the owner creates a new, EMPTY database[\s\S]*000_yeni_ulke_veritabani\.sql on it, once/)
    for (const f of ['index.ts', 'derleme.mjs', 'sizintiTerimleri.ts', 'metinler.ts', 'arayuz.ts', 'ayarlar.ts', 'uygulama/metinler.ts', 'uygulama/randevuMetinleri.ts', 'uygulama/portalMetinleri.ts', 'uygulama/araclar.ts', 'uygulama/mesajMetinleri.ts', 'uygulama/sablonMetinleri.ts', 'uygulama/konsultasyonMetinleri.ts', 'uygulama/klinikMetinleri.ts', 'acilis/icerik.ts', 'klinik/index.ts', 'klinik/roller.ts', 'klinik/asistanlar.ts', 'klinik/notSablonlari.ts', 'klinik/talimatlar.ts']) assert.ok(existsSync(join(gecici, 'countries', K, f)), `countries/${K}/${f} was not written`)
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
    // NOTYA-ULKE-PORTAL-01: the patient portal is part of what a new country is given — its catalogue (every group),
    // its page, how long a link stays valid (to be decided), and the instruction for the summary (to be written).
    const portalSekli = (JSON.parse(readFileSync(join(KOK, 'scripts/ulke-sablon/sekil.json'), 'utf8')) as { portal: Record<string, unknown> }).portal
    assert.deepEqual(Object.keys(portalSekli).sort(), ['erisim', 'giris', 'istek', 'ozet', 'sayfa'])
    for (const grup of Object.keys(portalSekli)) assert.match(oku(`countries/${K}/uygulama/portalMetinleri.ts`), new RegExp(`^  ${grup}: `, 'm'))
    assert.match(oku(`countries/${K}/uygulama/portalMetinleri.ts`), /^    \/\/ saatDilimi: '…',   ← REQUIRED if the country has more than one time zone/m)
    const yeniIndex = oku(`countries/${K}/index.ts`)
    assert.match(yeniIndex, /^\s+hastaPortali: true,$/m)
    assert.match(yeniIndex, /'\/calendar', '\/portal', '\/tools', '\/clinic', '\/desk'\]/)
    // NOTYA-ULKE-ARACLAR-01: the tools area is part of what a new country is given — its own words (every group), the
    // patient page's tile as the one base tool, and NO other tool: which of the kit's tools a country has, and for
    // which roles, is decided there with a clinician. No tool text of any country is copied.
    assert.match(yeniIndex, /^\s+araclar: true,$/m)
    const aracSekli = (JSON.parse(readFileSync(join(KOK, 'scripts/ulke-sablon/sekil.json'), 'utf8')) as { araclar: Record<string, unknown> }).araclar
    assert.deepEqual(Object.keys(aracSekli).sort(), ['arac', 'izgara', 'kabuk', 'kayit', 'portal', 'takip'])
    const yeniAraclar = oku(`countries/${K}/uygulama/araclar.ts`)
    for (const grup of Object.keys(aracSekli)) assert.match(yeniAraclar, new RegExp(`^  ${grup}: `, 'm'))
    assert.deepEqual([...yeniAraclar.matchAll(/anahtar: '([a-z0-9-]+)'/g)].map((m) => m[1]), ['hasta-portali', 'sablonlarim', 'konsultasyonlar'], 'a new country starts with the three base tiles that hold no clinical content, and no other tool')
    for (const kutu of ['hasta-portali', 'sablonlarim', 'konsultasyonlar']) assert.match(yeniAraclar, new RegExp(`anahtar: '${kutu}', roller: null,`))
    assert.match(yeniAraclar, /^  yuvalar: \[\],\n  inceleme: eksikAyar\('tools: who wrote the tool texts and who read them/m)
    assert.match(oku(`countries/${K}/arayuz.ts`), new RegExp(`^  araclar: ${B}_ARACLAR,$`, 'm'))
    // NOTYA-ULKE-MESAJ-01: messages, "my templates" and consultation are part of what a new country is given — every
    // word to supply, no text of any country copied; the outbound channel as a switched-off slot; both consultation
    // periods and the consent stamp as decisions still to make; the consent sentence not read by a lawyer.
    for (const ozellik of ['hastaMesajlari', 'hekimSablonlari', 'konsultasyon']) assert.match(yeniIndex, new RegExp(`^\\s+${ozellik}: true,$`, 'm'))
    assert.match(yeniIndex, /mesaj: \{\n\s+disBildirim: \{\n\s+acik: false, saglayici: null,\n\s+eksik: '[^'\n]{40,}',\n\s+kimden: '[^'\n]{20,}',/)
    assert.match(yeniIndex, /konsultasyon: \{\n\s+acikGun: eksikAyar\('consultation: days a consultation may stay open[^\n]*\n\s+kapanisSonrasiGun: eksikAyar\('consultation: days the colleague may still read/)
    assert.doesNotMatch(yeniIndex, /acikGun: \d|kapanisSonrasiGun: \d/, 'the scaffold writes no period: both are the country\'s decision')
    assert.match(oku(`countries/${K}/klinik/index.ts`), /konsultasyonRizasi: \{ surum: eksik\('consultation: a version stamp for the consent sentence[^\n]*, hukukcuInceledi: false \},/)
    const sekilDosyasi = JSON.parse(readFileSync(join(KOK, 'scripts/ulke-sablon/sekil.json'), 'utf8')) as Record<string, Record<string, unknown>>
    for (const [bolum, dosya, sabit, gruplar] of [['mesaj', 'mesajMetinleri', 'MESAJ', ['hasta', 'hekim']], ['konsultasyon', 'konsultasyonMetinleri', 'KONSULTASYON', ['gelen', 'giden', 'iste', 'kod']]] as const) {
      assert.deepEqual(Object.keys(sekilDosyasi[bolum]).sort(), [...gruplar])
      const yeni = oku(`countries/${K}/uygulama/${dosya}.ts`)
      for (const grup of gruplar) assert.match(yeni, new RegExp(`^  ${grup}: \\{$`, 'm'))
      assert.match(oku(`countries/${K}/arayuz.ts`), new RegExp(`^  ${dosya}: ${B}_${sabit}_METINLERI,$`, 'm'))
      assert.doesNotMatch(yeni.replace(/\/\*[\s\S]*?\*\//, ''), /\d{3}/, `the new ${bolum} catalogue carries a number`)
    }
    assert.match(oku(`countries/${K}/arayuz.ts`), new RegExp(`^  sablonMetinleri: ${B}_SABLON_METINLERI,$`, 'm'))
    for (const [dosya, ad, yol] of [['mesajMetinleri', 'messages', 'hasta.acil'], ['mesajMetinleri', 'messages', 'hasta.acilNumara (keep the placeholders %)'], ['mesajMetinleri', 'messages', 'hasta.yok'], ['sablonMetinleri', 'my templates', 'uyari'], ['konsultasyonMetinleri', 'consultation', 'iste.riza'], ['konsultasyonMetinleri', 'consultation', 'giden.durumKapali (keep the placeholders %1 %2)']] as const) assert.ok(eksikler.some((e) => e.dosya.endsWith(`uygulama/${dosya}.ts`) && e.ipucu.includes(`${ad}: ${yol}`)), `${dosya} key ${yol} is missing from the new pack`)
    assert.match(yeniIndex, /portal: \{\n\s+baglantiGecerlilikGun: eksikAyar\('patient portal: days a patient\\'s link stays valid/)
    // The ambulance number is local content with NO default: the scaffold writes no number, only the decision to make.
    assert.match(yeniIndex, /^\s+acilNumara: eksikAyar\('patient portal: the number a patient dials for an ambulance[^\n]*confirmed by a local source; or null/m)
    assert.doesNotMatch(oku(`countries/${K}/uygulama/portalMetinleri.ts`).replace(/\/\*[\s\S]*?\*\//, ''), /\d{3}/, 'the new catalogue carries a number')
    assert.match(oku(`countries/${K}/arayuz.ts`), new RegExp(`portalMetinleri: ${B}_PORTAL_METINLERI,`))
    assert.match(oku(`countries/${K}/klinik/index.ts`), new RegExp(`hastaOzetiTalimati: ${K}HastaOzetiTalimati,\\n\\s+hastaOzetiGirdisi: ${K}HastaOzetiGirdisi,`))
    assert.match(oku(`countries/${K}/klinik/talimatlar.ts`), /ozet: eksik\('instructions: the full instruction to the model for a short plain-language summary of an APPROVED note/)
    for (const yol of ['giris.pinYanlis', 'sayfa.acil', 'sayfa.acilNumara (keep the placeholders %)', 'sayfa.istekKabul', 'erisim.olay.geriAlma', 'ozet.paylas', 'istek.sec']) assert.ok(eksikler.some((e) => e.dosya.endsWith('uygulama/portalMetinleri.ts') && e.ipucu.includes(`patient portal: ${yol}`)), `portal key ${yol} is missing from the new pack`)
  })

  it('NOTYA-ULKE-KLINIK-01: a new country is given clinic accounts — the catalogue (every group), the two screens, and settings that start on the narrow side', async () => {
    const yeniIndex = oku(`countries/${K}/index.ts`)
    assert.match(yeniIndex, /^\s+klinikHesaplari: true,$/m)
    const klinikSekli = (JSON.parse(readFileSync(join(KOK, 'scripts/ulke-sablon/sekil.json'), 'utf8')) as { klinik: Record<string, unknown> }).klinik
    assert.deepEqual(Object.keys(klinikSekli).sort(), ['davet', 'giris', 'kabuk', 'kayit', 'klinik', 'konum', 'onBuro', 'paylasilan', 'takvim', 'yetki', 'yetkiAciklama', 'yetkiTuru'])
    const yeniKlinik = oku(`countries/${K}/uygulama/klinikMetinleri.ts`)
    for (const grup of Object.keys(klinikSekli)) assert.match(yeniKlinik, new RegExp(`^  ${grup}: `, 'm'))
    assert.match(yeniKlinik, new RegExp(`^const EN: KlinikMetni = \\{$`, 'm'))
    assert.match(oku(`countries/${K}/arayuz.ts`), new RegExp(`^  klinikMetinleri: ${B}_KLINIK_METINLERI,$`, 'm'))
    // THE SETTINGS. Decided by the country: which permissions exist, which allied roles may read a share, the two
    // periods, who read the answers. WRITTEN by the scaffold, on the narrow side, and not open to "to be decided":
    // a clinic's owner may not enter a permission for a doctor, and record retention is a slot that stays empty.
    const ayarlar = /\n    klinikHesaplari: \{\n([\s\S]*?)\n    \},\n/.exec(yeniIndex)?.[1] ?? ''
    for (const k of ['yetkiTurleri', 'paylasimRolleri', 'davetGecerlilikGun', 'vekaletAzamiGun', 'inceleme']) assert.match(ayarlar, new RegExp(`^      ${k}: eksikAyar\\('clinic accounts: `, 'm'), `${k} must be left for the country to decide`)
    assert.match(ayarlar, /^      sahipHekimAdinaVerebilir: false,$/m)
    assert.match(ayarlar, /^      kayitSaklama: null,$/m)
    assert.doesNotMatch(ayarlar.replace(/^\s*\/\/.*$/gm, '').replace(/eksikAyar\('(?:[^'\\]|\\.)*'\)/g, ''), /\d/, 'the scaffold decides no number for a country')
    // the hint for the permissions says, where the country decides, that the portal permission shows the link and PIN
    assert.match(ayarlar, /'on-buro-portal\\' \(front desk: hand a patient the link and PIN of their page — that person sees both\)/)
    // every key of the catalogue is an item to supply, and the sentences that carry a value say which placeholders
    const { eksikleriBul } = await import(pathToFileURL(join(KOK, 'scripts/ulke-paket-denetimi.mjs')).href) as { eksikleriBul: (kod: string, kok: string) => { dosya: string; satir: number; tur: string; ipucu: string }[] }
    const eksikler = eksikleriBul(K, gecici)
    const klinikte = eksikler.filter((e) => e.dosya.endsWith('uygulama/klinikMetinleri.ts'))
    const say = (x: unknown): number => (typeof x === 'string' ? 1 : x && typeof x === 'object' ? Object.values(x).reduce((n: number, y) => n + say(y), 0) : 0)
    assert.equal(klinikte.length, say(klinikSekli))
    assert.ok(klinikte.every((e) => e.tur === 'text'))
    for (const yol of ['yetkiAciklama.on-buro-portal', 'konum.on-buro', 'kayit.olay.geri-alindi (keep the placeholders %1 %2)', 'klinik.konumAciklama', 'onBuro.pin', 'paylasilan.saltOkunur']) assert.ok(klinikte.some((e) => e.ipucu.includes(`clinic accounts: ${yol}`)), `clinic key ${yol} is missing from the new pack`)
    assert.equal(eksikler.filter((e) => e.dosya.endsWith(`countries/${K}/index.ts`) && e.ipucu.startsWith('clinic accounts: ')).length, 5)
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

  it('every file it writes PARSES (a hint with an unescaped apostrophe would only be found by the slow type check)', async () => {
    const ts = (await import('typescript')).default
    for (const f of hepsi(join(gecici, 'countries', K)).filter((x) => x.endsWith('.ts'))) {
      const r = ts.transpileModule(readFileSync(f, 'utf8'), { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } })
      assert.deepEqual((r.diagnostics ?? []).map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')), [], `${f.slice(gecici.length + 1)} does not parse`)
    }
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
    // One database per country: the record says no database exists yet, names the baseline, and carries the steps as gates.
    assert.match(kayit, /no database exists for this country yet/)
    assert.match(kayit, /lib\/db\/ulke\/000_yeni_ulke_veritabani\.sql/)
    assert.match(kayit, /^- \[ \] M1 The country's own database exists/m)
    assert.match(kayit, /^- \[ \] M6 No script of this country was run on any other database/m)
    assert.doesNotMatch(kayit, /every country shares one database|No migration is needed/)
  })

  it('refuses to run twice for the same country, and changes nothing the second time', () => {
    const once = anlik()
    const r = kos(K, '--dil', 'en', '--yol', `/${K}`)
    assert.equal(r.status, 1)
    assert.match(r.stderr, /already exists/)
    assert.equal(anlik(), once)
  })
})
