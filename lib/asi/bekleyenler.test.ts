import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { asiBekleyenleriHesapla, type AsiSatiri } from './bekleyenler'

const satir = (p: string, asi: string, uygulama: string, sonrakiDoz: string | null): AsiSatiri => ({
  patient_id: p,
  asi_adi: asi,
  uygulama_tarihi: uygulama,
  sonraki_doz_tarihi: sonrakiDoz,
})

describe('asiBekleyenleriHesapla — hasta aşı bekleme listesi hesaplaması', () => {
  it('sonraki_doz_tarihi olan en güncel satır varsa hasta bekleyen sayılır', () => {
    const satirlar = [satir('p1', 'KKK', '2026-01-10', '2026-07-10')]
    assert.deepEqual(asiBekleyenleriHesapla(satirlar), [{ patientId: 'p1', sonrakiDozTarihi: '2026-07-10' }])
  })

  it('sonraki_doz_tarihi yoksa (örn. son doz) hasta listede yer almaz', () => {
    const satirlar = [satir('p1', 'KKK', '2026-01-10', null)]
    assert.deepEqual(asiBekleyenleriHesapla(satirlar), [])
  })

  it('aynı hasta+aşı için DESC sıradaki EN YENİ satır kazanır — eski planlanan doz zaten verilmişse artık beklenmez', () => {
    // DESC order: en yeni ilk. En yeni satırın kendisi "bir sonraki doz" planlıyor olabilir ya da olmayabilir.
    const satirlar = [
      satir('p1', 'KKK', '2026-07-10', null), // en güncel: bu doz verildi, yeni plan yok → beklemiyor
      satir('p1', 'KKK', '2026-01-10', '2026-07-10'), // eski satır: aynı pair, yok sayılmalı
    ]
    assert.deepEqual(asiBekleyenleriHesapla(satirlar), [])
  })

  it('farklı hasta/aşı çiftleri birbirinden bağımsız hesaplanır', () => {
    const satirlar = [
      satir('p1', 'KKK', '2026-01-10', '2026-07-10'),
      satir('p2', 'Hepatit B', '2026-02-01', '2026-08-01'),
      satir('p1', 'Hepatit B', '2026-03-01', null),
    ]
    const sonuc = asiBekleyenleriHesapla(satirlar)
    assert.equal(sonuc.length, 2)
    assert.ok(sonuc.some((s) => s.patientId === 'p1' && s.sonrakiDozTarihi === '2026-07-10'))
    assert.ok(sonuc.some((s) => s.patientId === 'p2' && s.sonrakiDozTarihi === '2026-08-01'))
  })

  it('boş liste için boş sonuç döner', () => {
    assert.deepEqual(asiBekleyenleriHesapla([]), [])
  })
})
