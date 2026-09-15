import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mchatPuanla, MCHAT_R_SORULARI } from './mchatR'

describe('mchatR', () => {
  it('scores 0 (düşük risk) when every item passes', () => {
    const cevaplar: Record<number, boolean> = {}
    for (const s of MCHAT_R_SORULARI) cevaplar[s.no] = ![2, 5, 12].includes(s.no)
    const sonuc = mchatPuanla(cevaplar)
    assert.equal(sonuc.toplamPuan, 0)
    assert.equal(sonuc.riskSeviyesi, 'dusuk')
    assert.equal(sonuc.sonucMetni, 'Otizm özelliği yok')
  })

  it('scores 20 (yüksek risk) when every item fails', () => {
    const cevaplar: Record<number, boolean> = {}
    for (const s of MCHAT_R_SORULARI) cevaplar[s.no] = [2, 5, 12].includes(s.no)
    const sonuc = mchatPuanla(cevaplar)
    assert.equal(sonuc.toplamPuan, 20)
    assert.equal(sonuc.riskSeviyesi, 'yuksek')
    assert.equal(sonuc.sonucMetni, 'İleri araştırma gerekir')
  })

  it('reverse-scores items 2, 5, 12 (Evet = risk point)', () => {
    const cevaplar: Record<number, boolean> = {}
    for (const s of MCHAT_R_SORULARI) cevaplar[s.no] = ![2, 5, 12].includes(s.no)
    cevaplar[2] = true // ters madde: Evet = risk
    const sonuc = mchatPuanla(cevaplar)
    assert.equal(sonuc.toplamPuan, 1)
  })

  it('sits exactly on the orta-risk boundary at 3 points', () => {
    const cevaplar: Record<number, boolean> = {}
    for (const s of MCHAT_R_SORULARI) cevaplar[s.no] = ![2, 5, 12].includes(s.no)
    cevaplar[1] = false; cevaplar[6] = false; cevaplar[10] = false
    const sonuc = mchatPuanla(cevaplar)
    assert.equal(sonuc.toplamPuan, 3)
    assert.equal(sonuc.riskSeviyesi, 'orta')
    assert.equal(sonuc.sonucMetni, 'İleri araştırma gerekir')
  })
})
