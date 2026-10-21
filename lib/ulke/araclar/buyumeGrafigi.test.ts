/**
 * AU-ARAC-GORUNUM-01 — unit tests for ./buyumeGrafigi.ts, the growth-chart's pure logic. Fixtures are synthetic
 * `AracKaydi` rows of the kit's own `buyume-persentili` tool; no WHO number is asserted against a hand-typed value
 * here (that belongs to whoBuyumeLms.ts / buyumeEgrisi.ts's own tests) — only that this file reads the right
 * fields, in the right shape, and feeds the WHO table through unchanged.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { BUYUME_PERSENTILI_ANAHTARI, buyumeCinsiyeti, buyumeEgrileriWho, buyumeNoktalari } from './buyumeGrafigi'
import type { AracKaydi } from './kayitTipleri'

function kayit(p: { parametre: string; deger_alani: string; deger: number; ay: number; olcum_tarihi: string; cinsiyet?: 'male' | 'female'; id?: string }): AracKaydi {
  return {
    id: p.id ?? 'k',
    arac: BUYUME_PERSENTILI_ANAHTARI,
    olusturuldu: '2026-01-01T00:00:00Z',
    gun: '2026-01-01',
    takipTarihi: null,
    kapandi: null,
    girdiler: { parametre: p.parametre, cinsiyet: p.cinsiyet ?? 'male', olcum_tarihi: p.olcum_tarihi, [p.deger_alani]: p.deger },
    sonuc: { tamam: true, sayilar: [{ anahtar: 'ay', deger: p.ay, ondalik: 1 }, { anahtar: 'persentil', deger: 50, ondalik: 0 }, { anahtar: 'z', deger: 0, ondalik: 2 }], bant: null, uyarilar: [], tarihler: [] },
  }
}

describe('buyumeNoktalari', () => {
  it('reads this parameter only, oldest first, from kept results that have a full result', () => {
    const b = kayit({ id: 'b', parametre: 'kilo', deger_alani: 'deger_kilo', deger: 8.2, ay: 6, olcum_tarihi: '2026-06-01' })
    const a = kayit({ id: 'a', parametre: 'kilo', deger_alani: 'deger_kilo', deger: 4.1, ay: 1, olcum_tarihi: '2026-01-01' })
    const noktalar = buyumeNoktalari([b, a], 'kilo')
    assert.deepEqual(noktalar, [{ ay: 1, deger: 4.1, tarih: '2026-01-01' }, { ay: 6, deger: 8.2, tarih: '2026-06-01' }])
  })

  it('skips a kept result of a different parameter of the same tool', () => {
    const boy = kayit({ parametre: 'boy', deger_alani: 'deger_boy', deger: 60, ay: 2, olcum_tarihi: '2026-02-01' })
    assert.deepEqual(buyumeNoktalari([boy], 'kilo'), [])
  })

  it('skips a kept result of another tool entirely', () => {
    const k = kayit({ parametre: 'kilo', deger_alani: 'deger_kilo', deger: 5, ay: 2, olcum_tarihi: '2026-02-01' })
    assert.deepEqual(buyumeNoktalari([{ ...k, arac: 'baska-arac' }], 'kilo'), [])
  })

  it('skips a result that is not complete (tamam: false) or missing', () => {
    const k = kayit({ parametre: 'kilo', deger_alani: 'deger_kilo', deger: 5, ay: 2, olcum_tarihi: '2026-02-01' })
    assert.deepEqual(buyumeNoktalari([{ ...k, sonuc: { ...k.sonuc!, tamam: false } }], 'kilo'), [])
    assert.deepEqual(buyumeNoktalari([{ ...k, sonuc: null }], 'kilo'), [])
  })

  it('skips a row with no readable measurement date', () => {
    const k = kayit({ parametre: 'kilo', deger_alani: 'deger_kilo', deger: 5, ay: 2, olcum_tarihi: '2026-02-01' })
    assert.deepEqual(buyumeNoktalari([{ ...k, girdiler: { ...k.girdiler, olcum_tarihi: null } }], 'kilo'), [])
  })
})

describe('buyumeCinsiyeti', () => {
  it('reads the most recent kept result that states a sex, scanning from the end', () => {
    const erken = kayit({ id: 'a', parametre: 'kilo', deger_alani: 'deger_kilo', deger: 4, ay: 1, olcum_tarihi: '2026-01-01', cinsiyet: 'male' })
    const son = kayit({ id: 'b', parametre: 'kilo', deger_alani: 'deger_kilo', deger: 8, ay: 6, olcum_tarihi: '2026-06-01', cinsiyet: 'female' })
    assert.equal(buyumeCinsiyeti([erken, son]), 'female')
  })
  it('null when nothing kept states a sex', () => {
    const k = kayit({ parametre: 'kilo', deger_alani: 'deger_kilo', deger: 4, ay: 1, olcum_tarihi: '2026-01-01' })
    assert.equal(buyumeCinsiyeti([{ ...k, girdiler: { ...k.girdiler, cinsiyet: null } }]), null)
  })
  it('null for an empty list', () => {
    assert.equal(buyumeCinsiyeti([]), null)
  })
})

describe('buyumeEgrileriWho', () => {
  it('returns the standard WHO percentile set (3,10,25,50,75,90,97), each with points starting at month 0', () => {
    const series = buyumeEgrileriWho('kilo', 'male')
    assert.deepEqual(series.map((s) => s.persentil).sort((a, b) => a - b), [3, 10, 25, 50, 75, 90, 97])
    for (const s of series) {
      assert.ok(s.noktalar.length > 1)
      assert.equal(s.noktalar[0].ay, 0)
    }
  })

  it('covers at least up to the oldest measurement even past the table default', () => {
    const series = buyumeEgrileriWho('boy', 'female', 200)
    const maxAy = Math.max(...series.flatMap((s) => s.noktalar.map((n) => n.ay)))
    assert.ok(maxAy >= 200)
  })

  it('male and female use different tables (the 50th percentile differs at the same age for at least one measurement past birth)', () => {
    const erkek = buyumeEgrileriWho('kilo', 'male').find((s) => s.persentil === 50)!
    const kiz = buyumeEgrileriWho('kilo', 'female').find((s) => s.persentil === 50)!
    const noktaErkek = erkek.noktalar.find((n) => n.ay === 12)!
    const noktaKiz = kiz.noktalar.find((n) => n.ay === 12)!
    assert.notEqual(noktaErkek.deger, noktaKiz.deger)
  })
})
