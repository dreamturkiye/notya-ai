/**
 * ULKE-BRANS-DERINLIK-01 — Australia's specialty clinical tools: every worked example of every row (from its published
 * source), the shape of every row, and the leak gate both ways (the owning roles see the tool; no other role does).
 * Run: NOTYA_COUNTRY=au npx tsx --test countries/au/araclar/uzmanlik/uzmanlik.test.ts
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AU_UZMANLIK_SATIRLARI, AU_UZMANLIK_TANIMLAR, auUzmanlikAraclari } from './index'
import { anahtarOf, tanimOf } from './motor'
import { AU_ONAM_SATIRLARI, AU_ONAM_TANIMLAR, anahtar as onamAnahtari } from './onam'
import { AU_RAPOR_SATIRLARI, AU_RAPOR_TANIMLAR } from './rapor'
import { AKTIF_ARAYUZ } from '@/countries/active/arayuz'

const ORTAM = { bugun: '2026-11-08', p: {} }
const ROLLER: string[] = (AKTIF_ARAYUZ?.roller ?? []).map((r) => r.anahtar)

it('the active pack is Australia (44 roles)', () => assert.equal(ROLLER.length, 44))

describe('AU specialty tools — worked examples from each source', () => {
  for (const s of AU_UZMANLIK_SATIRLARI) {
    it(`${anahtarOf(s)}: ${s.ornekler.length} worked example(s)`, () => {
      assert.ok(s.ornekler.length >= 1, 'every tool has at least one worked example')
      const tanim = tanimOf(s)
      for (const o of s.ornekler) {
        const r = tanim.hesapla(o.girdi, ORTAM)
        const etiket = JSON.stringify(o.girdi)
        if (o.tamam === false) { assert.equal(r.tamam, false, etiket); continue }
        assert.equal(r.tamam, true, etiket)
        if (o.toplam !== undefined) assert.equal(r.sayilar.find((x) => x.anahtar === 'toplam')?.deger, o.toplam, etiket)
        for (const [k, v] of Object.entries(o.sayilar ?? {})) assert.equal(r.sayilar.find((x) => x.anahtar === k)?.deger, v, `${etiket} ${k}`)
        if (o.bant !== undefined) assert.equal(r.bant, o.bant, etiket)
        if (o.uyarilar) assert.deepEqual([...r.uyarilar].sort(), [...o.uyarilar].sort(), etiket)
      }
    })
  }
})

describe('AU specialty tools — shape, sources and classification', () => {
  it('keys are unique, Australian-prefixed and never a templated structural key', () => {
    const k = AU_UZMANLIK_SATIRLARI.map(anahtarOf)
    assert.equal(new Set(k).size, k.length)
    for (const x of k) {
      assert.match(x, /^au-[a-z0-9-]+$/)
      assert.doesNotMatch(x, /-(review|flags|care-plan|between-visit-log|care-goals|visit-prep|plan)$/)
    }
  })
  it('every tool names 1–3 offered roles (specialty-only, never base) and cites a source', () => {
    for (const s of AU_UZMANLIK_SATIRLARI) {
      assert.ok(s.roller.length >= 1 && s.roller.length <= 3, anahtarOf(s))
      for (const r of s.roller) assert.ok(ROLLER.includes(r), `${anahtarOf(s)}: ${r} is not an offered AU role`)
      assert.ok(s.kaynak.length > 40, `${anahtarOf(s)}: source`)
    }
  })
  it('every band, warning and number the arithmetic can return is worded', () => {
    const paketler = new Map(auUzmanlikAraclari().map((p) => [p.anahtar, p]))
    for (const t of AU_UZMANLIK_TANIMLAR) {
      const p = paketler.get(t.anahtar)!
      for (const k of t.cikti.sayilar) assert.ok(p.metin.sayilar?.[k], `${t.anahtar} number ${k}`)
      for (const k of t.cikti.bantlar) assert.ok(p.metin.bantlar?.[k], `${t.anahtar} band ${k}`)
      for (const k of t.cikti.uyarilar) assert.ok(p.metin.uyarilar?.[k], `${t.anahtar} warning ${k}`)
      for (const a of t.alanlar) if (!a.numarali) assert.ok(p.metin.alanlar[a.anahtar], `${t.anahtar} field ${a.anahtar}`)
    }
  })
  it('a required choice left empty gives no result (nothing interpreted)', () => {
    for (const t of AU_UZMANLIK_TANIMLAR) {
      if (!t.alanlar.some((a) => (a.tur === 'secim' || a.tur === 'sayi' || a.tur === 'puan') && !a.istege)) continue
      assert.equal(t.hesapla({}, ORTAM).tamam, false, t.anahtar)
    }
  })
})

describe('AU specialty tools — leak gate both directions', () => {
  it('each tool is visible to its own roles and to no other role', () => {
    for (const p of auUzmanlikAraclari()) {
      assert.ok(Array.isArray(p.roller) && p.roller.length > 0, p.anahtar)
      const yabanci = ROLLER.filter((r) => !p.roller!.includes(r))
      assert.ok(yabanci.length >= ROLLER.length - 3, p.anahtar)
    }
  })
  it('every offered role reaches its own specialty tools', () => {
    const say = new Map<string, number>()
    for (const p of auUzmanlikAraclari()) for (const r of p.roller ?? []) say.set(r, (say.get(r) ?? 0) + 1)
    for (const r of say.keys()) assert.ok(ROLLER.includes(r))
  })
})

describe('AU consent discussion record — one per role, gated to that role', () => {
  it('every offered role has its own consent record, and no other role sees it', () => {
    assert.deepEqual(AU_ONAM_SATIRLARI.map((x) => x.rol).sort(), [...ROLLER].sort())
    const paketler = new Map(auUzmanlikAraclari().map((p) => [p.anahtar, p]))
    for (const r of ROLLER) assert.deepEqual(paketler.get(onamAnahtari(r as never))?.roller, [r])
  })
  it('core elements recorded → no warning; core missing → warning; nothing ticked → no result; prints', () => {
    for (const t of AU_ONAM_TANIMLAR) {
      assert.equal(t.yazdirilir, true, t.anahtar)
      assert.equal(t.hesapla({}, ORTAM).tamam, false, t.anahtar)
      const tam = t.hesapla({ nitelik: true, riskler: true, alternatifler: true, sorular: true, kapasite: true }, ORTAM)
      assert.deepEqual([tam.tamam, tam.uyarilar], [true, []], t.anahtar)
      assert.deepEqual(t.hesapla({ nitelik: true }, ORTAM).uyarilar, ['eksik'], t.anahtar)
    }
  })
})

describe('AU specialty report — one per role, printable with a document number, gated to that role', () => {
  it('every offered role has its own report; only that role sees it', () => {
    assert.deepEqual(AU_RAPOR_SATIRLARI.map((x) => x.rol).sort(), [...ROLLER].sort())
    const paketler = new Map(auUzmanlikAraclari().map((p) => [p.anahtar, p]))
    for (const r of ROLLER) assert.deepEqual(paketler.get(`au-${r}-report`)?.roller, [r])
  })
  it('prints; empty gives no result; an impression clears the warning', () => {
    for (const t of AU_RAPOR_TANIMLAR) {
      assert.equal(t.yazdirilir, true, t.anahtar)
      assert.equal(t.hesapla({}, ORTAM).tamam, false, t.anahtar)
      const ilk = t.alanlar.find((a) => a.uzun && a.anahtar !== 'sonuc' && a.anahtar !== 'oneri')!.anahtar
      assert.deepEqual(t.hesapla({ [ilk]: 'Finding written by the clinician.' }, ORTAM).uyarilar, ['sonuc_yok'], t.anahtar)
      assert.deepEqual(t.hesapla({ [ilk]: 'x', sonuc: 'Impression.' }, ORTAM).uyarilar, [], t.anahtar)
    }
  })
})

describe('ULKE-BRANS-DERINLIK-11 — the GPCCMP and MHTP records (general practice only)', () => {
  it('GPCCMP: the six required parts, consent and a review date; the MHTP referral: four requirements and the six-service initial course', async () => {
    const { AU_GPCCMP, AU_MHTP, auMbsAraclari } = await import('./mbs')
    const O = { bugun: '2026-11-08', p: {} }
    const tam = { kalem: 'p965', kosul: 'a', ihtiyac: 'b', hedef: 'c', eylem: 'd', tedavi: 'e', gozden_gecirme: 'f', gozden_gecirme_tarihi: '2027-02-08', onay: true }
    assert.deepEqual(AU_GPCCMP.hesapla(tam, O).uyarilar, [])
    assert.deepEqual([...AU_GPCCMP.hesapla({ kalem: 'r967', kosul: 'a' }, O).uyarilar].sort(), ['icerik_eksik', 'onay_yok', 'tarih_yok'])
    assert.deepEqual(AU_MHTP.hesapla({ kalem: 'i2700', belirti: true, ilaclar: true, plan_beyani: true, hizmet: 6, hizmet_yazildi: true, onay: true }, O).uyarilar, [])
    assert.ok(AU_MHTP.hesapla({ kalem: 'i2700', hizmet: 8, onay: true }, O).uyarilar.includes('ilk_kurs'))
    for (const p of auMbsAraclari()) assert.deepEqual(p.roller, ['family-medicine'])
    assert.equal(AU_GPCCMP.yazdirilir, true); assert.equal(AU_MHTP.yazdirilir, true)
  })
})

describe('ULKE-BRANS-K9-MUTTEFIK — AU podiatry dose tool (endorsement for scheduled medicines)', () => {
  it('podiatry has its own clinician-entered dose tool, for endorsed podiatrists only; the six non-prescribing allied professions have none', async () => {
    const { auDozSiparisAraclari, auDozAnahtari } = await import('./dozSiparis')
    const paketler = auDozSiparisAraclari()
    const pod = paketler.find((p) => p.anahtar === auDozAnahtari('podiatry'))
    assert.ok(pod, 'podiatry dose tool')
    assert.deepEqual(pod!.roller, ['podiatry'])
    assert.match(String(pod!.metin.not?.['en-AU'] ?? ''), /endorsement for scheduled medicines/)
    for (const rol of ['physiotherapy', 'clinical-psychology', 'dietetics', 'occupational-therapy', 'audiology', 'speech-pathology']) {
      assert.equal(paketler.some((p) => p.anahtar === auDozAnahtari(rol)), false, rol)
    }
    // Another medical role's note carries no endorsement line.
    assert.doesNotMatch(String(paketler.find((p) => p.anahtar === auDozAnahtari('dermatology'))!.metin.not?.['en-AU'] ?? ''), /endorsement/)
  })
})
