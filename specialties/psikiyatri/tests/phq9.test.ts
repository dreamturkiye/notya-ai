import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  skorla, degisim, sonrakiOlcumGun,
  PHQ9_MADDELER, PHQ9_SIKLIK, PHQ9_BANT_ARALIK, PHQ9_BANT_AD, PHQ9_ENUST, PHQ9_MADDE_SAYISI,
} from '../engines/phq9'

const doldur = (v: number) => Array(9).fill(v)

describe('PSIK-EXCEPTIONAL-01 PHQ-9', () => {
  it('has 9 items and a 0–3 frequency scale', () => {
    assert.equal(PHQ9_MADDELER.length, PHQ9_MADDE_SAYISI)
    assert.equal(PHQ9_MADDELER.length, 9)
    assert.deepEqual(PHQ9_SIKLIK.map((s) => s.deger), [0, 1, 2, 3])
    assert.equal(new Set(PHQ9_MADDELER).size, 9, 'madde metinleri tekil olmalı')
    for (const m of PHQ9_MADDELER) assert.ok(m.length > 10, `madde metni eksik: ${m}`)
  })

  it('9th item is the self-harm / death item (safety gate depends on order)', () => {
    assert.match(PHQ9_MADDELER[8], /ölmek|ölse|kendinize zarar|zarar ver/i)
  })

  it('total is 0–27 and bands follow 5/10/15/20 cut-offs', () => {
    assert.equal(skorla(doldur(0)).toplam, 0)
    assert.equal(skorla(doldur(3)).toplam, PHQ9_ENUST)
    assert.equal(skorla(doldur(3)).toplam, 27)
    const bant = (t: number) => PHQ9_BANT_ARALIK.find((a) => t >= a.alt && t <= a.ust)!.bant
    assert.equal(bant(4), 'yok')
    assert.equal(bant(5), 'hafif')
    assert.equal(bant(9), 'hafif')
    assert.equal(bant(10), 'orta')
    assert.equal(bant(14), 'orta')
    assert.equal(bant(15), 'orta_siddetli')
    assert.equal(bant(19), 'orta_siddetli')
    assert.equal(bant(20), 'siddetli')
    assert.equal(bant(27), 'siddetli')
  })

  it('scores a real sheet', () => {
    const s = skorla([2, 2, 1, 3, 1, 0, 1, 0, 0])
    assert.equal(s.toplam, 10)
    assert.equal(s.bant, 'orta')
    assert.equal(s.bantAd, PHQ9_BANT_AD.orta)
    assert.equal(s.tamamMi, true)
    assert.equal(s.eksikMadde, 0)
    assert.equal(s.ozkıyımMadde9, false)
  })

  it('item 9 ≥1 raises the suicide-ideation flag', () => {
    assert.equal(skorla([0, 0, 0, 0, 0, 0, 0, 0, 1]).ozkıyımMadde9, true)
    assert.equal(skorla([0, 0, 0, 0, 0, 0, 0, 0, 3]).ozkıyımMadde9, true)
    assert.equal(skorla([3, 3, 3, 3, 3, 3, 3, 3, 0]).ozkıyımMadde9, false)
  })

  it('missing or out-of-range answers are NOT counted as 0 — partial totals are not interpreted', () => {
    const eksik = skorla([2, 2, null, 3, 1, 0, 1, 0, 0])
    assert.equal(eksik.tamamMi, false)
    assert.equal(eksik.eksikMadde, 1)
    assert.equal(eksik.toplam, 9)
    assert.match(eksik.ozet, /kısmi|yorumlanmaz/)
    const bozuk = skorla([9, -1, 2, 2, 2, 2, 2, 2, 2])
    assert.equal(bozuk.eksikMadde, 2)
    assert.equal(bozuk.tamamMi, false)
    assert.equal(skorla([]).eksikMadde, 9)
  })

  it('severity wording is decision support, never a diagnosis', () => {
    const s = skorla(doldur(3))
    assert.match(s.ozet, /karar desteği/i)
    assert.doesNotMatch(s.ozet, /tanı(sı)?dır|major depres|DSM/i)
    assert.match(s.dipnot.not, /tanısı değildir|değildir/i)
  })

  it('degisim reads response and remission as a draft, not a verdict', () => {
    assert.equal(degisim(null, 12).fark, null)
    const yanit = degisim(20, 9)
    assert.equal(yanit.fark, -11)
    assert.equal(yanit.yuzde, 55)
    assert.match(yanit.not, /yanıt|hekim/i)
    assert.match(degisim(10, 16).not, /artış/)
    assert.match(degisim(10, 3).not, /minimal/)
  })

  it('follow-up interval shortens as severity rises', () => {
    assert.ok(sonrakiOlcumGun('siddetli') <= sonrakiOlcumGun('orta'))
    assert.ok(sonrakiOlcumGun('orta') <= sonrakiOlcumGun('hafif'))
    assert.ok(sonrakiOlcumGun('yok') >= sonrakiOlcumGun('hafif'))
  })
})
