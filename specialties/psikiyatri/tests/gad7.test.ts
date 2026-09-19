import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  skorla, degisim, sonrakiOlcumGun,
  GAD7_MADDELER, GAD7_BANT_ARALIK, GAD7_BANT_AD, GAD7_ENUST, GAD7_MADDE_SAYISI, GAD7_TARAMA_ESIGI,
} from '../engines/gad7'
import { PHQ9_SIKLIK } from '../engines/phq9'

const doldur = (v: number) => Array(7).fill(v)

describe('PSIK-EXCEPTIONAL-01 GAD-7', () => {
  it('has 7 items and reuses the shared 0–3 frequency set', () => {
    assert.equal(GAD7_MADDELER.length, GAD7_MADDE_SAYISI)
    assert.equal(GAD7_MADDELER.length, 7)
    assert.equal(new Set(GAD7_MADDELER).size, 7)
    assert.deepEqual(PHQ9_SIKLIK.map((s) => s.deger), [0, 1, 2, 3])
    for (const m of GAD7_MADDELER) assert.ok(m.length > 10, `madde metni eksik: ${m}`)
  })

  it('total is 0–21 and bands follow 5/10/15 cut-offs', () => {
    assert.equal(skorla(doldur(0)).toplam, 0)
    assert.equal(skorla(doldur(3)).toplam, GAD7_ENUST)
    assert.equal(skorla(doldur(3)).toplam, 21)
    const bant = (t: number) => GAD7_BANT_ARALIK.find((a) => t >= a.alt && t <= a.ust)!.bant
    assert.equal(bant(4), 'yok')
    assert.equal(bant(5), 'hafif')
    assert.equal(bant(9), 'hafif')
    assert.equal(bant(10), 'orta')
    assert.equal(bant(14), 'orta')
    assert.equal(bant(15), 'siddetli')
    assert.equal(bant(21), 'siddetli')
  })

  it('scores a real sheet', () => {
    const s = skorla([2, 2, 2, 1, 1, 1, 1])
    assert.equal(s.toplam, 10)
    assert.equal(s.bant, 'orta')
    assert.equal(s.bantAd, GAD7_BANT_AD.orta)
    assert.equal(s.tamamMi, true)
  })

  it('screening threshold is 10 and only set on a complete sheet', () => {
    assert.equal(GAD7_TARAMA_ESIGI, 10)
    assert.equal(skorla([2, 2, 2, 1, 1, 1, 1]).esikUstu, true)
    assert.equal(skorla([1, 1, 1, 1, 1, 1, 1]).esikUstu, false)
    // eksik madde varken toplam 10'u geçse bile eşik iddiası yapılmaz
    assert.equal(skorla([3, 3, 3, 3, null, 0, 0]).esikUstu, false)
  })

  it('missing or out-of-range answers are NOT counted as 0', () => {
    const eksik = skorla([2, 2, null, 1, 1, 1, 1])
    assert.equal(eksik.tamamMi, false)
    assert.equal(eksik.eksikMadde, 1)
    assert.equal(eksik.toplam, 8)
    assert.match(eksik.ozet, /kısmi|yorumlanmaz/)
    assert.equal(skorla([4, 2, 2, 2, 2, 2, 2]).eksikMadde, 1)
    assert.equal(skorla([]).eksikMadde, 7)
  })

  it('severity wording is decision support, never a diagnosis', () => {
    const s = skorla(doldur(3))
    assert.match(s.ozet, /karar desteği/i)
    assert.doesNotMatch(s.ozet, /tanı(sı)?dır|yaygın anksiyete bozukluğudur|DSM/i)
    assert.match(s.dipnot.not, /tanı değildir|değildir/i)
  })

  it('degisim and follow-up interval stay physician-framed drafts', () => {
    assert.equal(degisim(null, 12).fark, null)
    const yanit = degisim(16, 7)
    assert.equal(yanit.fark, -9)
    assert.match(yanit.not, /yanıt|hekim/i)
    assert.match(degisim(8, 14).not, /artış/)
    assert.ok(sonrakiOlcumGun('siddetli') <= sonrakiOlcumGun('orta'))
    assert.ok(sonrakiOlcumGun('orta') <= sonrakiOlcumGun('hafif'))
  })
})
