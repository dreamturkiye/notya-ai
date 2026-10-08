/**
 * NOTYA-ULKE-01 — Doktor Araçları and countries.
 *
 *   1. TÜRKİYE IS UNCHANGED: for every specialty (and every raw spelling the app sees) the tool list, the groups and
 *      the deep-link guard are identical to what main produced on 2026-10-08, captured BEFORE the registry was touched
 *      (countries/tr/testing/doktor-araclari-anlik.json). A deliberate Türkiye tool change regenerates the snapshot in
 *      the same commit: `npm run ulke:arac-anlik`.
 *   2. Every tool declares its countries (required field, never empty), and the Türkiye pack lists exactly the routes
 *      that name Türkiye — the two locks agree.
 *   3. The gate text the skill and the rule carry now asks "which countries?".
 *
 * An Uzbekistan build sees no tool at all: lib/ulke/ulke.uz.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  BRANS_DOKTOR_ARACLARI,
  ORTAK_DOKTOR_ARACLARI,
  TUM_DOKTOR_ARACLARI,
  doktorAraciBransaUygun,
  doktorAraciUlkedeGecerli,
  doktorAraclariGruplu,
  doktorAraclariListesi,
  doktorAracYoluUlkedeAcik,
  type DoktorArac,
} from './doktorAraclari'
import { BRANS_ETIKETLERI } from '../intake/bransSorulari'
import { ULKE_KODLARI } from '../ulke/tipler'
import { ulkePaketi } from '../ulke/ulke'

const KOK = resolve(__dirname, '../..')
type AnlikArac = Omit<DoktorArac, 'ulkeler'>
type Anlik = {
  kaynak: string
  araclar: AnlikArac[]
  branslar: Record<string, { liste: string[]; gruplar: { anahtar: string; baslik: string; aciklama: string; rotalar: string[] }[]; derinBaglanti: string[] }>
}
const anlik = JSON.parse(readFileSync(join(KOK, 'countries/tr/testing/doktor-araclari-anlik.json'), 'utf8')) as Anlik
const ham = (anahtar: string): string | null => (anahtar === '(null)' ? null : anahtar === '(bos)' ? '' : anahtar)
const ulkesiz = ({ ulkeler: _u, ...gerisi }: DoktorArac): AnlikArac => gerisi

describe('Türkiye: tool lists identical to main (snapshot taken before the change)', () => {
  it('the snapshot covers all 30 specialties plus the raw spellings and the empty cases', () => {
    assert.match(anlik.kaynak, /^main@9891987/)
    assert.equal(anlik.araclar.length, 144)
    for (const b of Object.keys(BRANS_ETIKETLERI)) assert.ok(b in anlik.branslar, b)
    assert.equal(Object.keys(BRANS_ETIKETLERI).length, 30)
    for (const ek of ['kadin-dogum', 'Kadın Hastalıkları ve Doğum', 'Çocuk Sağlığı ve Hastalıkları', 'İç Hastalıkları', 'genel', 'sac-ekimi', '(bos)', '(null)']) assert.ok(ek in anlik.branslar, ek)
  })

  it('the registry: same tools, same order, same fields — only `ulkeler` was added', () => {
    assert.deepEqual(TUM_DOKTOR_ARACLARI.map(ulkesiz), anlik.araclar)
    assert.equal(ORTAK_DOKTOR_ARACLARI.length + BRANS_DOKTOR_ARACLARI.length, 144)
  })

  const rotayaGore = new Map(anlik.araclar.map((a) => [a.route, a]))
  for (const [anahtar, beklenen] of Object.entries(anlik.branslar)) {
    it(`${anahtar}: list, groups and deep-link guard`, () => {
      const h = ham(anahtar)
      assert.deepEqual(doktorAraclariListesi(h).map(ulkesiz), beklenen.liste.map((r) => rotayaGore.get(r)))
      assert.deepEqual(
        doktorAraclariGruplu(h).map((g) => ({ anahtar: g.anahtar, baslik: g.baslik, aciklama: g.aciklama, rotalar: g.araclar.map((a) => a.route) })),
        beklenen.gruplar,
      )
      assert.deepEqual(TUM_DOKTOR_ARACLARI.filter((a) => doktorAraciBransaUygun(a.route, h)).map((a) => a.route), beklenen.derinBaglanti)
    })
  }

  it('paths that are not tiles keep opening (hatirlatma and friends use their own gates)', () => {
    for (const yol of ['/doktor-tools', '/doktor-tools/hatirlatma', '/doktor-tools/bekleyen-konsultasyonlar']) {
      assert.equal(doktorAracYoluUlkedeAcik(yol), true, yol)
      assert.equal(doktorAraciBransaUygun(yol, 'pediatri'), true, yol)
    }
  })
})

describe('every tool declares its countries', () => {
  it('`ulkeler` is present, non-empty and holds known country codes — for all 144', () => {
    for (const a of TUM_DOKTOR_ARACLARI) {
      assert.ok(Array.isArray(a.ulkeler) && a.ulkeler.length > 0, `${a.route}: ulkeler missing or empty`)
      for (const u of a.ulkeler) assert.ok((ULKE_KODLARI as readonly string[]).includes(u), `${a.route}: unknown country ${u}`)
      assert.equal(new Set(a.ulkeler).size, a.ulkeler.length, `${a.route}: duplicate country`)
    }
  })

  it('today every tool is Türkiye only — another country is added after its audit, one tool at a time', () => {
    for (const a of TUM_DOKTOR_ARACLARI) assert.deepEqual([...a.ulkeler], ['tr'], a.route)
  })

  it('source lock: every registry line carries the field (a new tile cannot be added without answering "which countries?")', () => {
    const kaynak = readFileSync(join(KOK, 'lib/doktor/doktorAraclari.ts'), 'utf8')
    const satirlar = kaynak.split('\n').filter((s) => /route: '\/doktor-tools\//.test(s))
    assert.equal(satirlar.length, 144)
    for (const s of satirlar) assert.match(s, /branslar: (null|\[[^\]]+\]), ulkeler: [A-Z_]+ \}/, s.slice(0, 80))
    assert.match(kaynak, /ulkeler: readonly UlkeKodu\[\]\n\}/, 'the field must be required in the type')
  })

  it('the two locks agree: the Türkiye pack lists exactly the routes that name Türkiye', () => {
    const adlandiran = TUM_DOKTOR_ARACLARI.filter((a) => a.ulkeler.includes('tr')).map((a) => a.route)
    assert.deepEqual([...ulkePaketi().araclar], adlandiran)
    for (const a of TUM_DOKTOR_ARACLARI) assert.equal(doktorAraciUlkedeGecerli(a), true, a.route)
  })

  it('a tool for another country only: hidden here, closed by deep link', () => {
    assert.equal(doktorAraciUlkedeGecerli({ route: '/doktor-tools/erecete', ulkeler: ['uz'] }), false)
    assert.equal(doktorAraciUlkedeGecerli({ route: '/doktor-tools/uz-yangi', ulkeler: ['tr', 'uz'] }), false, 'named by the tool but not listed by the pack')
  })
})

describe('the gate asks "which countries?"', () => {
  it('skill and rule carry the question and the two locks', () => {
    const skill = readFileSync(join(KOK, '.cursor/skills/specialty-doktor-araclari/SKILL.md'), 'utf8')
    const kural = readFileSync(join(KOK, '.cursor/rules/specialty-doktor-araclari.mdc'), 'utf8')
    for (const metin of [skill, kural]) {
      assert.match(metin, /which countries\?/i)
      assert.match(metin, /ulkeler/)
    }
    assert.match(skill, /countries\/<kod>\/araclar\.ts/)
    assert.match(skill, /COUNTRY-PACK-CHECKLIST\.md/)
  })
})
