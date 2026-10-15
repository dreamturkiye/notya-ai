import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cozgerDurumGecerliMi, COZGER_DURUMLARI, COZGER_UYARI_METNI, OKGV_BENZERI_DUZEYLER } from './cozgerTakip'

describe('cozgerDurumGecerliMi', () => {
  it('kataloğdaki beş durum geçerli', () => {
    for (const d of COZGER_DURUMLARI) assert.equal(cozgerDurumGecerliMi(d.id), true)
  })
  it('bilinmeyen durum geçersiz', () => {
    assert.equal(cozgerDurumGecerliMi('onaylandi'), false)
    assert.equal(cozgerDurumGecerliMi(''), false)
  })
})

describe('COZGER_UYARI_METNI / OKGV_BENZERI_DUZEYLER — resmi rapor değildir, % oranı yazılmaz', () => {
  it('uyarı metni Çocuk Sağlık Kurulu\'na atıf yapar', () => {
    assert.match(COZGER_UYARI_METNI, /resmi ÇÖZGER raporu değildir/)
    assert.match(COZGER_UYARI_METNI, /Çocuk Sağlık Kurulu/)
  })
  it('düzey kataloğu metinseldir, sayısal/yüzde ifadesi içermez', () => {
    assert.ok(OKGV_BENZERI_DUZEYLER.length >= 4)
    for (const d of OKGV_BENZERI_DUZEYLER) assert.doesNotMatch(d, /%|\d/)
  })
})
