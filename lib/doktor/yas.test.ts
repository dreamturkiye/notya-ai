import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { yasHesapla, yasYilAy } from './yas'

describe('yasHesapla', () => {
  it('bir ayın altında gün olarak yazar', () => {
    const bugun = new Date()
    const d = new Date(bugun)
    d.setDate(d.getDate() - 12)
    assert.equal(yasHesapla(d.toISOString()), '12 günlük')
  })

  it('12-24 ay arası aylık yazar', () => {
    const bugun = new Date()
    const d = new Date(bugun)
    d.setMonth(d.getMonth() - 18)
    assert.equal(yasHesapla(d.toISOString()), '18 aylık')
  })

  it('24 ay ve üzeri yaşında yazar', () => {
    const bugun = new Date()
    const d = new Date(bugun)
    d.setFullYear(d.getFullYear() - 5)
    assert.equal(yasHesapla(d.toISOString()), '5 yaşında')
  })

  it('geçersiz tarihte boş döner', () => {
    assert.equal(yasHesapla('not-a-date'), '')
  })
})

describe('yasYilAy — NOTYA-HASTA-RAPORLARI-UNIFIED-01 resmî belge yaş biçimi', () => {
  it('4 yaş 4 ay gibi yazar', () => {
    assert.equal(yasYilAy('2022-06-10', '2026-10-15'), '4 yaş 4 ay')
  })

  it('1 yaşın altı: 0 yaş N ay', () => {
    assert.equal(yasYilAy('2026-03-01', '2026-10-15'), '0 yaş 7 ay')
  })

  it('tam yıl dönümünde ay dönümü henüz gelmemişse bir ay düşer', () => {
    // doğum 2024-10-20, "şimdi" 2026-10-15 → henüz 20'sine gelmedi, 23 ay (1 yaş 11 ay)
    assert.equal(yasYilAy('2024-10-20', '2026-10-15'), '1 yaş 11 ay')
  })

  it('geçersiz tarihte boş döner', () => {
    assert.equal(yasYilAy('not-a-date', '2026-10-15'), '')
    assert.equal(yasYilAy('2026-01-01', 'not-a-date'), '')
  })

  it('ileri tarihli doğum (henüz doğmamış/gelecek tarih) boş döner', () => {
    assert.equal(yasYilAy('2027-01-01', '2026-10-15'), '')
  })
})
