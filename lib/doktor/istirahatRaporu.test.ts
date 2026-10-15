import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  bitisTarihiHesapla,
  egitimYiliEtiketi,
  egitimYiliGecerliMi,
  egitimYiliToplamGun,
  gunSayisiSinirla,
  yillikLimitAsildiMi,
  ISTIRAHAT_TEK_RAPOR_MAX_GUN,
  ISTIRAHAT_YILLIK_LIMIT_GUN,
} from './istirahatRaporu'

describe('egitimYiliEtiketi', () => {
  it('Eylül ve sonrası → yeni eğitim yılının ilk yarısı', () => {
    assert.equal(egitimYiliEtiketi('2026-09-01'), '2026-2027')
    assert.equal(egitimYiliEtiketi('2026-12-20'), '2026-2027')
  })
  it('Ocak–Ağustos → önceki yılın ikinci yarısı', () => {
    assert.equal(egitimYiliEtiketi('2027-01-05'), '2026-2027')
    assert.equal(egitimYiliEtiketi('2027-06-30'), '2026-2027')
  })
  it('geçersiz tarih → boş', () => {
    assert.equal(egitimYiliEtiketi('not-a-date'), '')
  })
})

describe('egitimYiliGecerliMi', () => {
  it('ardışık yıl çifti geçerli', () => {
    assert.equal(egitimYiliGecerliMi('2026-2027'), true)
  })
  it('ardışık olmayan veya hatalı biçim geçersiz', () => {
    assert.equal(egitimYiliGecerliMi('2026-2028'), false)
    assert.equal(egitimYiliGecerliMi('2026/2027'), false)
    assert.equal(egitimYiliGecerliMi(''), false)
  })
})

describe('gunSayisiSinirla', () => {
  it('1–10 aralığına kilitler (tek hekim tek seferde en fazla 10 gün)', () => {
    assert.equal(gunSayisiSinirla(0), 1)
    assert.equal(gunSayisiSinirla(3), 3)
    assert.equal(gunSayisiSinirla(10), ISTIRAHAT_TEK_RAPOR_MAX_GUN)
    assert.equal(gunSayisiSinirla(40), ISTIRAHAT_TEK_RAPOR_MAX_GUN)
    assert.equal(gunSayisiSinirla(NaN), 1)
  })
})

describe('bitisTarihiHesapla', () => {
  it('N gün → başlangıç + (N-1)', () => {
    assert.equal(bitisTarihiHesapla('2026-10-01', 1), '2026-10-01')
    assert.equal(bitisTarihiHesapla('2026-10-01', 3), '2026-10-03')
    assert.equal(bitisTarihiHesapla('2026-10-29', 5), '2026-11-02') // ay sınırını aşar
  })
})

describe('egitimYiliToplamGun / yillikLimitAsildiMi — eğitim yılı başına biriken 20 günlük hak', () => {
  it('aynı eğitim yılındaki raporları toplar, diğer yılı saymaz', () => {
    const raporlar = [
      { gun_sayisi: 10, egitim_yili: '2026-2027' },
      { gun_sayisi: 8, egitim_yili: '2026-2027' },
      { gun_sayisi: 10, egitim_yili: '2025-2026' },
    ]
    assert.equal(egitimYiliToplamGun(raporlar, '2026-2027'), 18)
    assert.equal(egitimYiliToplamGun(raporlar, '2025-2026'), 10)
  })

  it('20 gün tam doluyken aşılmamış sayılır; 21. günde bilgi uyarısı tetiklenir (engelleme yok)', () => {
    assert.equal(yillikLimitAsildiMi(ISTIRAHAT_YILLIK_LIMIT_GUN), false)
    assert.equal(yillikLimitAsildiMi(ISTIRAHAT_YILLIK_LIMIT_GUN + 1), true)
  })
})
