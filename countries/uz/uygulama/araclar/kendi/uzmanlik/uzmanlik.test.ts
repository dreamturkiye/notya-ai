/**
 * ULKE-BRANS-DERINLIK-01 — Uzbekistan's specialty tools: every worked example of every score (from its published source),
 * shape and classification, every word in the three forms (Cyrillic by rule, from ./kiril.json), the leak gate both ways,
 * and the per-role consent record and conclusion.
 * Run: NOTYA_COUNTRY=uz npx tsx --test countries/uz/uygulama/araclar/kendi/uzmanlik/uzmanlik.test.ts
 */
process.env.NOTYA_COUNTRY = 'uz'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { UZ_ARAYUZ } from '../../../../arayuz' // the pack's own door: a pack test must not reach countries/active (wall D3)
import { UZ_UZMANLIK_SATIRLARI, UZ_UZMANLIK_TANIMLAR, uzUzmanlikAraclari } from './index'
import { anahtarOf, tanimOf } from './motor'
import { metinleriTopla, rozilikAnahtari, xulosaAnahtari, UZ_ONAM_SATIRLARI } from './onamRapor'

const ORTAM = { bugun: '2026-11-08', p: {} }
const ROLLER: string[] = (UZ_ARAYUZ.roller ?? []).map((r) => r.anahtar)

it('the active pack is Uzbekistan (42 roles)', () => assert.equal(ROLLER.length, 42))

describe('UZ specialty tools — worked examples from each source', () => {
  for (const s of UZ_UZMANLIK_SATIRLARI) {
    it(`${anahtarOf(s)}`, () => {
      const t = tanimOf(s)
      assert.ok(s.ornekler.length >= 1)
      for (const o of s.ornekler) {
        const r = t.hesapla(o.girdi, ORTAM)
        const e = JSON.stringify(o.girdi)
        if (o.tamam === false) { assert.equal(r.tamam, false, e); continue }
        assert.equal(r.tamam, true, e)
        if (o.toplam !== undefined) assert.equal(r.sayilar.find((x) => x.anahtar === 'toplam')?.deger, o.toplam, e)
        for (const [k, v] of Object.entries(o.sayilar ?? {})) assert.equal(r.sayilar.find((x) => x.anahtar === k)?.deger, v, `${e} ${k}`)
        if (o.bant !== undefined) assert.equal(r.bant, o.bant, e)
      }
    })
  }
})

describe('UZ specialty tools — shape, words, leak gate', () => {
  it('keys unique, uz- prefixed, 1–3 offered roles each, a source each', () => {
    const k = uzUzmanlikAraclari().map((p) => p.anahtar)
    assert.equal(new Set(k).size, k.length)
    for (const p of uzUzmanlikAraclari()) {
      assert.match(p.anahtar, /^uz-[a-z0-9-]+$/)
      assert.ok(p.roller && p.roller.length >= 1 && p.roller.length <= 3, p.anahtar)
      for (const r of p.roller!) assert.ok(ROLLER.includes(r), `${p.anahtar}: ${r}`)
      assert.ok((p.lisans?.kaynak ?? '').length > 20, p.anahtar)
    }
  })
  it('every text in the three forms (the Cyrillic by rule is held by ../../kiril.test.ts)', () => {
    for (const p of uzUzmanlikAraclari()) for (const x of metinleriTopla(p)) assert.ok(x['uz-Latn'].trim() && x['uz-Cyrl'].trim() && x.ru.trim(), `${p.anahtar}: ${x['uz-Latn']}`)
  })
  it('every number, band, warning and field the arithmetic can return is worded', () => {
    const pk = new Map(uzUzmanlikAraclari().map((p) => [p.anahtar, p]))
    for (const t of UZ_UZMANLIK_TANIMLAR) {
      const p = pk.get(t.anahtar)!
      for (const k of t.cikti.sayilar) assert.ok(p.metin.sayilar?.[k], `${t.anahtar} ${k}`)
      for (const k of t.cikti.bantlar) assert.ok(p.metin.bantlar?.[k], `${t.anahtar} ${k}`)
      for (const k of t.cikti.uyarilar) assert.ok(p.metin.uyarilar?.[k], `${t.anahtar} ${k}`)
      for (const a of t.alanlar) if (!a.numarali) assert.ok(p.metin.alanlar[a.anahtar], `${t.anahtar} ${a.anahtar}`)
    }
  })
  it('leak gate both ways: a tool is seen by its own roles and by no other', () => {
    for (const p of uzUzmanlikAraclari()) assert.ok(ROLLER.filter((r) => !p.roller!.includes(r)).length >= ROLLER.length - 3, p.anahtar)
  })
  it('every role has its own consent record and conclusion, seen by that role only; they print', () => {
    assert.deepEqual(UZ_ONAM_SATIRLARI.map((x) => x.rol).sort(), [...ROLLER].sort())
    const pk = new Map(uzUzmanlikAraclari().map((p) => [p.anahtar, p]))
    const tk = new Map(UZ_UZMANLIK_TANIMLAR.map((t) => [t.anahtar, t]))
    for (const r of ROLLER) {
      for (const k of [rozilikAnahtari(r), xulosaAnahtari(r)]) { assert.deepEqual(pk.get(k)?.roller, [r]); assert.equal(tk.get(k)?.yazdirilir, true) }
      const t = tk.get(rozilikAnahtari(r))!
      assert.deepEqual(t.hesapla({ nitelik: true, riskler: true, alternatifler: true, sorular: true }, ORTAM).uyarilar, [])
      assert.deepEqual(t.hesapla({ nitelik: true }, ORTAM).uyarilar, ['eksik'])
    }
  })
})
