import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { katilimSonucuDogrula, katilimTuruGecerliMi, KATILIM_RAPORU_TURLERI } from './katilimRaporu'

describe('katilimTuruGecerliMi', () => {
  it('spor / kres / erteleme geçerli; başka değer değil', () => {
    for (const t of KATILIM_RAPORU_TURLERI) assert.equal(katilimTuruGecerliMi(t.id), true)
    assert.equal(katilimTuruGecerliMi('ucan-sinif'), false)
    assert.equal(katilimTuruGecerliMi(''), false)
  })
})

describe('katilimSonucuDogrula — spor', () => {
  it('sakinca yok/var kabul edilir', () => {
    assert.deepEqual(katilimSonucuDogrula('spor', { sakinca: 'yok' }), { sakinca: 'yok', not: undefined })
    assert.deepEqual(katilimSonucuDogrula('spor', { sakinca: 'var', not: 'Kalp üfürümü' }), { sakinca: 'var', not: 'Kalp üfürümü' })
  })
  it('sakinca eksik/geçersiz → null (reddedilir)', () => {
    assert.equal(katilimSonucuDogrula('spor', {}), null)
    assert.equal(katilimSonucuDogrula('spor', { sakinca: 'belki' }), null)
  })
})

describe('katilimSonucuDogrula — kres (aşı takvimi aşı modülünden okunur, elle girilmez)', () => {
  it('bulasiciTaramaBulgusu zorunlu; asiTakvimiTamMi sunucudan gelen değeri taşır', () => {
    const r = katilimSonucuDogrula('kres', { bulasiciTaramaBulgusu: 'Normal', asiTakvimiTamMi: true })
    assert.deepEqual(r, { bulasiciTaramaBulgusu: 'Normal', asiTakvimiTamMi: true, asiNotu: undefined })
  })
  it('bulgu eksikse null', () => {
    assert.equal(katilimSonucuDogrula('kres', { asiTakvimiTamMi: true }), null)
  })
  it('asiTakvimiTamMi bilinmiyorsa null taşınır (iddia edilmez)', () => {
    const r = katilimSonucuDogrula('kres', { bulasiciTaramaBulgusu: 'Normal', asiTakvimiTamMi: null })
    assert.equal(r && 'asiTakvimiTamMi' in r ? (r as { asiTakvimiTamMi: unknown }).asiTakvimiTamMi : undefined, null)
  })
})

describe('katilimSonucuDogrula — erteleme', () => {
  it('gerekçe zorunlu; onerilenErteleme boolean', () => {
    const r = katilimSonucuDogrula('erteleme', { gerekce: 'Gelişimsel olgunlaşma', onerilenErteleme: true })
    assert.deepEqual(r, { gerekce: 'Gelişimsel olgunlaşma', onerilenErteleme: true })
  })
  it('gerekçe eksikse null', () => {
    assert.equal(katilimSonucuDogrula('erteleme', { onerilenErteleme: true }), null)
  })
})
