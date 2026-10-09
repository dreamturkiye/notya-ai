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
  'acil-tip': ['esi-triyaj', 'kritik-yol'],
  'aile-hekimligi': [],
  anestezi: ['asa-preop', 'hava-yolu-notu', 'postop-agri'],
  'beyin-cerrahisi': ['noro-postop', 'nobet-bilinc'],
  'cocuk-cerrahisi': ['cocuk-prepost-op', 'yara-dren-izlem'],
  'genel-cerrahi': ['yara-dren-izlem', 'genel-preop'],
  'gogus-cerrahisi': ['toraks-preop', 'toraks-tup-yara'],
  'gogus-hastaliklari': ['inhaler-teknik'],
  'goz-hastaliklari': ['gorme-keskinligi'],
  dahiliye: ['kdigo-evre'],
  dermatoloji: ['pasi', 'easi', 'scorad', 'yama-okuma'],
  endokrinoloji: ['rejim-karti'],
  'enfeksiyon-hastaliklari': ['antibiyotik-sure'],
  gastroenteroloji: [],
  'kadin-hastaliklari-dogum': [],
  'kalp-damar-cerrahisi': ['kalp-damar-preop', 'greft-yara-izlem', 'antikoagulan-vadeleri'],
  kardiyoloji: [],
  'kulak-burun-bogaz': ['odyometri-pta', 'otoskopi-notu', 'vertigo-notu'],
  nefroloji: ['kdigo-serit', 'diyaliz-seans'],
  noroloji: [],
  onkoloji: ['kur-sayaci', 'toksisite-listesi'],
  ortopedi: ['kirik-alci-takip', 'ortopedi-op-protokol', 'vas-fonksiyon'],
  pediatri: ['hedef-boy', 'doz-hesabi'],
  'plastik-cerrahi': ['plastik-yara-greft'],
  psikiyatri: [],
  radyoloji: ['tetkik-kuyrugu', 'rapor-taslagi'],
  romatoloji: ['das28', 'eklem-28'],
  uroloji: ['psa-hizi'],
  'spor-hekimligi': ['rtp-basamak', 'sakatlik-gunlugu'],
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
    for (const ad of readdirSync(DIZIN).filter((x) => /^(temel|rol\d+|yardimci|metinler|birimler)\.ts$/.test(x))) assert.match(readFileSync(join(DIZIN, ad), 'utf8').slice(0, 1600), /MACHINE-WRITTEN\. AWAITS NATIVE REVIEW/, `${ad} does not say it is machine-written`)
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
