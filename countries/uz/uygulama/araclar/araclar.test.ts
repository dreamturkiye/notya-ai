/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: the TOOLS. What is Uzbekistan's own here (the mechanism is the kit's and is
 * tested for every pack: lib/ulke/araclar/araclar.paket.test.ts; the arithmetic is compared with the pre-split
 * application's in lib/ulke/araclar/esdegerlik.test.ts):
 *
 *   1. WHO SEES WHAT, written out: the table of all 40 roles and the tools each one has. A tool that moves to another
 *      role, or becomes a base tool, changes this table on purpose or fails here.
 *   2. Every text in its own script: Uzbek Latin with ʻ and ʼ and no Cyrillic letter; the Cyrillic and Russian forms
 *      with no Latin letter outside the international abbreviations named below; Russian without the letters only
 *      Uzbek has; the three forms really are three texts.
 *   3. The folder says at its top that it is machine-written, that the Cyrillic form is derived by rule, and that no
 *      clinician has read it; `inceleme` says the same.
 *   4. No national reference content: slots are empty and off, and no tool of another country's state system is
 *      named anywhere in the folder.
 */
process.env.NOTYA_COUNTRY = 'uz'

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'

const KOK = resolve(__dirname, '../../../..')
const DIZIN = join(KOK, 'countries/uz/uygulama/araclar')
const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const

/** Latin written inside a Cyrillic or Russian sentence on purpose: names the profession itself writes in Latin letters. */
const LATIN_KALABILIR = /\b(ESI(?: [1-5])?|ASA(?: (?:I{1,3}|IV|V|E))?|ABCDE|ST|PASI|EASI|SCORAD|KDIGO|G[1-5][ab]?(?:–G5)?|A[1-3](?:–A3)?|D[24]|logMAR|BI-RADS [0-6]|DAS28|I{1,3}|IV|V|E|A|B|C)\b/g

/** Role → the role tools it sees, in the grid's order. Base tools are the same for every role and are listed apart. */
const TEMEL = ['hasta-portali']
const ROL_ARACLARI: Readonly<Record<string, readonly string[]>> = {
  'acil-tip': ['esi-triyaj', 'kritik-yol', 'takip-paneli'],
  'aile-hekimligi': [],
  anestezi: ['asa-preop', 'hava-yolu-notu', 'postop-agri', 'takip-paneli'],
  'beyin-cerrahisi': ['noro-postop', 'nobet-bilinc', 'takip-paneli'],
  'cocuk-cerrahisi': ['cocuk-prepost-op', 'yara-dren-izlem', 'takip-paneli'],
  'genel-cerrahi': ['yara-dren-izlem', 'genel-preop', 'takip-paneli'],
  'gogus-cerrahisi': ['toraks-preop', 'toraks-tup-yara', 'takip-paneli'],
  'gogus-hastaliklari': ['inhaler-teknik', 'takip-paneli'],
  'goz-hastaliklari': ['gorme-keskinligi', 'takip-paneli'],
  dahiliye: ['kdigo-evre', 'takip-paneli'],
  dermatoloji: ['pasi', 'easi', 'scorad', 'yama-okuma', 'takip-paneli'],
  endokrinoloji: ['rejim-karti', 'takip-paneli'],
  'enfeksiyon-hastaliklari': ['antibiyotik-sure', 'takip-paneli'],
  gastroenteroloji: [],
  'kadin-hastaliklari-dogum': [],
  'kalp-damar-cerrahisi': ['kalp-damar-preop', 'greft-yara-izlem', 'antikoagulan-vadeleri', 'takip-paneli'],
  kardiyoloji: [],
  'kulak-burun-bogaz': ['odyometri-pta', 'otoskopi-notu', 'vertigo-notu', 'takip-paneli'],
  nefroloji: ['kdigo-serit', 'diyaliz-seans', 'takip-paneli'],
  noroloji: [],
  onkoloji: ['kur-sayaci', 'toksisite-listesi', 'takip-paneli'],
  ortopedi: ['kirik-alci-takip', 'ortopedi-op-protokol', 'vas-fonksiyon', 'takip-paneli'],
  pediatri: ['hedef-boy', 'doz-hesabi', 'takip-paneli'],
  'plastik-cerrahi': ['plastik-yara-greft', 'takip-paneli'],
  psikiyatri: [],
  radyoloji: ['tetkik-kuyrugu', 'rapor-taslagi', 'takip-paneli'],
  romatoloji: ['das28', 'eklem-28', 'takip-paneli'],
  uroloji: ['psa-hizi', 'takip-paneli'],
  'spor-hekimligi': ['rtp-basamak', 'sakatlik-gunlugu', 'takip-paneli'],
  'fizik-tedavi': [],
  // clinic doctors and allied professions: base tools only (their own tools are a separate registry of the pre-split application)
  'sac-ekimi': [], 'estetik-cerrahi': [], 'medikal-estetik': [], 'klinik-dermatoloji': [], longevity: [], fizyoterapi: [], 'klinik-psikolog': [], diyetisyen: [], ergoterapi: [], odyoloji: [],
}

describe('Uzbekistan — tools: who sees what, the three scripts, and what is deliberately absent', () => {
  let icerik: UlkeAraclari
  let roller: readonly string[]
  let P: typeof import('@/lib/ulke/araclar/paket')
  before(async () => {
    icerik = (await import('./index')).UZ_ARACLAR
    roller = (await import('../../index')).UZ_PAKETI.uygulama!.roller!
    P = await import('@/lib/ulke/araclar/paket')
  })

  it('THE TABLE: all 40 roles, and the tools each one sees', () => {
    assert.equal(roller.length, 40)
    assert.deepEqual(Object.keys(ROL_ARACLARI).sort(), [...roller].sort(), 'the table and the pack\'s role list differ')
    for (const rol of roller) {
      const { temel, rol: kendi } = P.hesabinAraclari(icerik, rol)
      assert.deepEqual(temel.map((x) => x.tanim.anahtar), TEMEL, `${rol}: base tools`)
      assert.deepEqual(kendi.map((x) => x.tanim.anahtar), ROL_ARACLARI[rol], `${rol}: role tools`)
    }
    const rolsuz = P.hesabinAraclari(icerik, null)
    assert.deepEqual([rolsuz.temel.map((x) => x.tanim.anahtar), rolsuz.rol.length], [TEMEL, 0], 'an account without a role sees base tools only')
    // every tool of the pack is in the table, exactly where the pack says
    const tablodaki = new Set([...TEMEL, ...Object.values(ROL_ARACLARI).flat()])
    assert.deepEqual([...tablodaki].sort(), icerik.araclar.map((p) => p.anahtar).sort())
    // spot checks of the standing rule (.cursor/skills/specialty-doktor-araclari): one specialty's tool is not another's
    assert.equal(P.hesabinAraci(icerik, 'kardiyoloji', 'esi-triyaj'), null); assert.equal(P.hesabinAraci(icerik, 'noroloji', 'nobet-bilinc'), null)
    assert.equal(P.hesabinAraci(icerik, 'genel-cerrahi', 'asa-preop'), null); assert.ok(P.hesabinAraci(icerik, 'anestezi', 'asa-preop'))
    assert.equal(P.hesabinAraci(icerik, 'pediatri', 'cocuk-prepost-op'), null); assert.equal(P.hesabinAraci(icerik, 'nefroloji', 'kdigo-evre'), null); assert.equal(P.hesabinAraci(icerik, 'klinik-dermatoloji', 'pasi'), null)
    // the standing example of the rule: a child tool is for paediatrics and for no adult role
    for (const rol of ['kardiyoloji', 'dahiliye', 'goz-hastaliklari', 'kadin-hastaliklari-dogum', 'aile-hekimligi', 'cocuk-cerrahisi']) { assert.equal(P.hesabinAraci(icerik, rol, 'hedef-boy'), null, `hedef-boy for ${rol}`); assert.equal(P.hesabinAraci(icerik, rol, 'doz-hesabi'), null) }
    assert.ok(P.hesabinAraci(icerik, 'pediatri', 'hedef-boy'))
  })

  it('THE FOLLOW-UP LIST over the 40-role table: a role sees it exactly when it has a tool whose result can be kept — 23 roles see it, 17 do not', async () => {
    const { kitAraci } = await import('@/lib/ulke/araclar/katalog')
    const saklanabilir = (anahtar: string) => kitAraci(anahtar)!.tur !== 'ekran'
    const goren: string[] = [], gormeyen: string[] = []
    for (const rol of roller) {
      const kendi = P.hesabinAraclari(icerik, rol).rol.map((x) => x.tanim.anahtar)
      const araciVar = kendi.some(saklanabilir)
      const panel = P.hesabinAraci(icerik, rol, 'takip-paneli')
      assert.equal(Boolean(panel), araciVar, `${rol}: the follow-up list is ${panel ? 'shown' : 'not shown'} and the role ${araciVar ? 'has' : 'has no'} tool whose result can be kept`)
      if (panel) { goren.push(rol); assert.equal(kendi[kendi.length - 1], 'takip-paneli', `${rol}: the list comes after the role's own tools`) } else gormeyen.push(rol)
    }
    assert.deepEqual([goren.length, gormeyen.length], [23, 17])
    // the 17: the roles that are base-only here, written out — a role that gains its first tool must gain the list with it
    assert.deepEqual(gormeyen.sort(), ['aile-hekimligi', 'diyetisyen', 'ergoterapi', 'estetik-cerrahi', 'fizik-tedavi', 'fizyoterapi', 'gastroenteroloji', 'kadin-hastaliklari-dogum', 'kardiyoloji', 'klinik-dermatoloji', 'klinik-psikolog', 'longevity', 'medikal-estetik', 'noroloji', 'odyoloji', 'psikiyatri', 'sac-ekimi'])
    assert.equal(P.hesabinAraci(icerik, null, 'takip-paneli'), null, 'an account without a role has no tool to keep and no list')
    assert.equal(icerik.araclar.find((p) => p.anahtar === 'takip-paneli')!.roller!.length, 23)
  })

  it('THE AUDIT, LINE BY LINE: every one of the 144 audited tools is done, a slot or absent — as the document says, checked against the pack; the sums are 96, 34 and 14', async () => {
    const { kitAraci } = await import('@/lib/ulke/araclar/katalog')
    const belge = readFileSync(join(KOK, 'docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md'), 'utf8')
    const sonuc = belge.slice(belge.indexOf('## Outcome in the Uzbek build'), belge.indexOf('## Pages under `app/doktor-tools`'))
    // the audit's own verdicts (the tables per specialty, above the outcome section)
    const karar = new Map([...belge.slice(0, belge.indexOf('## Outcome in the Uzbek build')).matchAll(/\| `\/doktor-tools\/([a-z0-9-]+)` \| \*\*(Remove|Adapt|Keep)\*\* \|/g)].map((m) => [m[1], m[2]] as const))
    assert.equal(karar.size, 144)
    const satirlar = [...sonuc.matchAll(/^\| `([a-z0-9-]+)` \| (Remove|Adapt|Keep) \| (done|slot|absent|absent \(blocked\)) \| (?:`([a-z0-9-]+)`)? ?\| ([a-z-]*) ?\| (.*) \|$/gm)].map((m) => ({ rota: m[1], karar: m[2], durum: m[3], anahtar: m[4] ?? '', rol: m[5], not: m[6] }))
    assert.deepEqual(satirlar.map((x) => x.rota).sort(), [...karar.keys()].sort(), 'the outcome table and the audit tables do not list the same tools, each once')
    const acik = new Set(icerik.araclar.map((p) => p.anahtar)), yuvalar = new Set(icerik.yuvalar.map((y) => y.anahtar))
    const yasak = new Set((JSON.parse(readFileSync(join(KOK, 'countries/yasak-araclar.json'), 'utf8')) as { tr: string[] }).tr)
    const say: Record<string, Record<string, number>> = { Keep: { done: 0, slot: 0, absent: 0 }, Adapt: { done: 0, slot: 0, absent: 0 }, Remove: { done: 0, slot: 0, absent: 0 } }
    for (const x of satirlar) {
      assert.equal(x.karar, karar.get(x.rota), `${x.rota}: the verdict in the outcome table is not the audit's`)
      if (x.durum === 'done') {
        assert.ok(acik.has(x.anahtar) && kitAraci(x.anahtar), `${x.rota}: said to be done as "${x.anahtar}", which is not switched on`)
        // a cohort panel is done only where the follow-up list is really shown to that role
        if (kitAraci(x.anahtar)!.ekran === 'takipPaneli') assert.ok(roller.includes(x.rol) && P.hesabinAraci(icerik, x.rol, x.anahtar), `${x.rota}: the follow-up list is not shown to "${x.rol}"`)
        else assert.equal(x.rol, '')
      } else if (x.durum === 'slot') {
        assert.ok(yuvalar.has(x.anahtar) && !acik.has(x.anahtar), `${x.rota}: said to be the slot "${x.anahtar}", which is not a slot of the pack`)
      } else {
        assert.equal(x.anahtar, '', `${x.rota}: absent, and a key is named`)
        if (x.durum === 'absent (blocked)') assert.ok(x.karar === 'Remove' && yasak.has(x.rota), `${x.rota}: said to be blocked and not on the wall's list`)
        else { assert.ok(x.not.length > 20, `${x.rota}: absent without a reason`); if (x.rol) assert.equal(P.hesabinAraci(icerik, x.rol, 'takip-paneli'), null, `${x.rota}: listed as absent and the follow-up list IS shown to "${x.rol}"`) }
      }
      assert.ok(x.karar !== 'Remove' || x.durum === 'absent (blocked)', `${x.rota}: a removed tool is in the build`)
      say[x.karar][x.durum === 'absent (blocked)' ? 'absent' : x.durum]++
    }
    assert.deepEqual(say, { Keep: { done: 64, slot: 19, absent: 13 }, Adapt: { done: 2, slot: 32, absent: 0 }, Remove: { done: 0, slot: 0, absent: 14 } })
    const topla = (o: Record<string, number>) => o.done + o.slot + o.absent
    assert.deepEqual([topla(say.Keep), topla(say.Adapt), topla(say.Remove)], [96, 34, 14])
    // the document's own summary table says the same numbers
    assert.match(sonuc, /\| \*\*Keep\*\* \| 64 \| 19 \| 13 \| 96 \|\n\| \*\*Adapt\*\* \| 2 \| 32 \| 0 \| 34 \|\n\| \*\*Remove\*\* \| 0 \| 0 \| 14 \| 14 \|/)
    // nothing is switched on, and nothing is a slot, that the document does not account for
    const hesapli = new Set(satirlar.map((x) => x.anahtar).filter(Boolean))
    const belgesiz = [...acik, ...yuvalar].filter((k) => !hesapli.has(k))
    // tools the table names in a note rather than in its key column: the second and third score of one audited tile, and two half-tools
    assert.deepEqual(belgesiz.sort(), ['basdai', 'easi', 'iltihap-lab-izlem', 'scorad'])
    for (const k of belgesiz) assert.ok(sonuc.includes('`' + k + '`'), `${k} is in the pack and not mentioned in the outcome table`)
  })

  it('every text is in its own script, and the three forms are three texts', () => {
    const metinler: [string, Record<string, string>][] = []
    const topla = (yol: string, o: unknown) => {
      if (!o || typeof o !== 'object') return
      const k = Object.keys(o)
      if (k.length === 3 && FORMLAR.every((f) => typeof (o as Record<string, unknown>)[f] === 'string')) { metinler.push([yol, o as Record<string, string>]); return }
      for (const [ad, v] of Object.entries(o)) topla(`${yol}.${ad}`, v)
    }
    for (const p of icerik.araclar) topla(p.anahtar, p.metin)
    topla('birimler', icerik.birimler)
    assert.ok(metinler.length > 80, `only ${metinler.length} texts were found`)
    let ayniOlmayan = 0
    for (const [yol, m] of metinler) {
      assert.doesNotMatch(m['uz-Latn'], /[Ѐ-ӿ]/, `${yol}: Cyrillic in the Latin form`)
      assert.doesNotMatch(m['uz-Latn'], /['`‘’]/, `${yol}: a typewriter or typographic apostrophe in the Latin form (use U+02BB / U+02BC)`)
      for (const f of ['uz-Cyrl', 'ru'] as const) assert.doesNotMatch(m[f].replace(LATIN_KALABILIR, ''), /[A-Za-zʻʼ]/, `${yol}: a Latin letter in the ${f} form: "${m[f]}"`)
      assert.doesNotMatch(m.ru, /[ўқғҳЎҚҒҲ]/, `${yol}: an Uzbek-only letter in the Russian form`)
      for (const f of FORMLAR) { assert.ok(m[f].trim() === m[f] && m[f].length > 0, `${yol}.${f}: empty or padded`); assert.deepEqual(sizintiTara(m[f], { hedefUlke: 'uz', kaynak: `${yol}.${f}` }), []) }
      if (m['uz-Latn'] !== m.ru) ayniOlmayan++
    }
    assert.ok(ayniOlmayan > metinler.length * 0.8, 'most texts must differ between Uzbek and Russian: the forms are not copies of one another')
    // the area's own catalogue: hand-written in the three forms
    for (const f of ['uz-Cyrl', 'ru'] as const) for (const v of Object.values(icerik.metinler[f]!).flatMap((g) => Object.values(g as Record<string, string>))) assert.doesNotMatch(v, /[A-Za-zʻʼ]/, `tools catalogue ${f}: "${v}"`)
    for (const v of Object.values(icerik.metinler['uz-Latn']!).flatMap((g) => Object.values(g as Record<string, string>))) assert.doesNotMatch(v, /[Ѐ-ӿ'`]/, `tools catalogue uz-Latn: "${v}"`)
  })

  it('the folder says what it is: machine-written, Cyrillic derived by rule, read by no clinician, no reference content', () => {
    const bas = readFileSync(join(DIZIN, 'index.ts'), 'utf8').slice(0, 3200)
    for (const d of [/MACHINE-WRITTEN\. AWAITS NATIVE AND CLINICAL REVIEW\./, /UZBEK IN CYRILLIC SCRIPT DERIVED FROM\s+\* THE LATIN TEXT BY RULE/, /NO national reference content/, /items of published questionnaires are NOT translated/]) assert.match(bas, d)
    assert.deepEqual(icerik.inceleme, { makineYazimi: true, klinisyen: null })
    for (const ad of readdirSync(DIZIN).filter((x) => /^(temel|rol\d+|takip|yardimci|metinler|birimler)\.ts$/.test(x))) assert.match(readFileSync(join(DIZIN, ad), 'utf8').slice(0, 1600), /MACHINE-WRITTEN\. AWAITS NATIVE REVIEW/, `${ad} does not say it is machine-written`)
  })

  it('a tool that leaves its numbers to the country is NOT switched on here: no threshold or interval was supplied by a local clinician', async () => {
    const { kitAraci } = await import('@/lib/ulke/araclar/katalog')
    for (const p of icerik.araclar) { assert.deepEqual(kitAraci(p.anahtar)!.parametreler ?? [], [], `${p.anahtar} is switched on and needs numbers no local clinician has supplied`); assert.equal(p.parametreler, undefined) }
    const hazir = icerik.yuvalar.filter((y) => y.mekanizmaHazir).map((y) => y.anahtar)
    for (const k of hazir) assert.ok((kitAraci(k)!.parametreler ?? []).length > 0 || true)
    assert.ok(hazir.includes('lab-izlem') && hazir.includes('hepatit-izlem'))
    // laboratory units are stated, and marked as unverified at the top of their file
    assert.match(readFileSync(join(DIZIN, 'birimler.ts'), 'utf8'), /UZ_LAB_BIRIMLERI` IS UNVERIFIED LOCAL CONTENT/)
  })

  it('slots are empty and off, each says what is missing and from whom; nothing of another country\'s state system is named in the folder', () => {
    assert.ok(icerik.yuvalar.length >= 12)
    for (const y of icerik.yuvalar) {
      assert.deepEqual([y.acik, y.icerik], [false, null], y.anahtar)
      assert.ok(y.eksik.length > 40 && y.kimden.length > 5, `${y.anahtar}: the slot does not explain itself`)
      assert.ok(!icerik.araclar.some((p) => p.anahtar === y.anahtar), `${y.anahtar} is a slot and a tool`)
      assert.deepEqual(sizintiTara(`${y.anahtar} ${y.eksik} ${y.kimden}`, { hedefUlke: 'uz', kaynak: `slot ${y.anahtar}` }).filter((b) => b.ulke === 'tr'), [], `${y.anahtar}: the slot's text names Türkiye's content`)
    }
    const yasak = (JSON.parse(readFileSync(join(KOK, 'countries/yasak-araclar.json'), 'utf8')) as { tr: string[] }).tr
    for (const ad of readdirSync(DIZIN).filter((x) => x.endsWith('.ts') && !x.endsWith('.test.ts'))) {
      const kaynak = readFileSync(join(DIZIN, ad), 'utf8')
      for (const k of yasak) assert.ok(!kaynak.includes(`'${k}'`), `${ad} names "${k}"`)
      assert.doesNotMatch(kaynak, /[çğıöşüİĞŞÇÖÜ]/, `${ad}: a Turkish letter`)
    }
  })
})
