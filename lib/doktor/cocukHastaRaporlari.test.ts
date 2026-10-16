import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  COCUK_RAPOR_TIPLERI,
  cocukRaporTipiById,
  cocukRaporuMetniUret,
  istirahatBitisTarihi,
  istirahatGunSinirla,
  istirahatRaporuMetni,
  kreseRaporuMetni,
  okulRaporuMetni,
  sporRaporuMetni,
  veliGerekliMi,
  type CocukRaporHasta,
} from './cocukHastaRaporlari'

const NOW = new Date('2026-10-15T12:00:00Z').getTime()

describe('COCUK_RAPOR_TIPLERI — katalog', () => {
  it('tam olarak 4 tip: istirahat, spor, krese, okul', () => {
    assert.deepEqual(COCUK_RAPOR_TIPLERI.map((t) => t.id).sort(), ['istirahat', 'krese', 'okul', 'spor'])
  })

  it('her tipin benzersiz bir belgeTuru (vault category) etiketi var', () => {
    const turler = COCUK_RAPOR_TIPLERI.map((t) => t.belgeTuru)
    assert.equal(new Set(turler).size, turler.length)
  })

  it('yalnız istirahat gün ayarlanabilir', () => {
    for (const t of COCUK_RAPOR_TIPLERI) {
      assert.equal(t.gunAyarlanabilir, t.id === 'istirahat', t.id)
    }
  })

  it('cocukRaporTipiById bilinmeyen id için undefined döner', () => {
    assert.equal(cocukRaporTipiById('yok-boyle-bir-sey'), undefined)
    assert.equal(cocukRaporTipiById('spor')?.label, 'Spor Yapabilir Raporu')
  })
})

describe('istirahatGunSinirla / istirahatBitisTarihi', () => {
  const tip = cocukRaporTipiById('istirahat')!

  it('aralık dışı değerleri sınırlar', () => {
    assert.equal(istirahatGunSinirla(tip, 0), tip.gunMin)
    assert.equal(istirahatGunSinirla(tip, 999), tip.gunMax)
    assert.equal(istirahatGunSinirla(tip, 5), 5)
  })

  it('geçersiz sayı varsayılana düşer', () => {
    assert.equal(istirahatGunSinirla(tip, NaN), tip.gunVarsayilan)
  })

  it('bitiş tarihi başlangıç + (gün-1)', () => {
    assert.equal(istirahatBitisTarihi('2026-10-15', 3), '2026-10-17')
    assert.equal(istirahatBitisTarihi('2026-10-15', 1), '2026-10-15')
  })
})

describe('veliGerekliMi — VELI-YASAL-ONAM (yaş bazlı, branş değil)', () => {
  it('18 yaşından küçük hasta için true', () => {
    const cocuk: CocukRaporHasta = { adSoyad: 'Test Çocuk', dogumTarihiIso: '2020-01-01' }
    assert.equal(veliGerekliMi(cocuk, NOW), true)
  })

  it('18 yaş ve üzeri hasta için false', () => {
    const yetiskin: CocukRaporHasta = { adSoyad: 'Test Yetişkin', dogumTarihiIso: '2000-01-01' }
    assert.equal(veliGerekliMi(yetiskin, NOW), false)
  })

  it('doğum tarihi bilinmiyorsa false (branş varsayımı yapılmaz)', () => {
    assert.equal(veliGerekliMi({ adSoyad: 'Bilinmiyor', dogumTarihiIso: null }, NOW), false)
  })
})

describe('karar metinleri — "çocuğun" (minör) vs "hastanın" (yetişkin)', () => {
  const cocuk: CocukRaporHasta = { adSoyad: 'Ayşe Yılmaz', dogumTarihiIso: '2020-01-01' }
  const yetiskin: CocukRaporHasta = { adSoyad: 'Mehmet Yılmaz', dogumTarihiIso: '2000-01-01' }

  it('istirahatRaporuMetni: tarihinden … tarihine kadar istirahatlidir, gün sayısıyla', () => {
    const metin = istirahatRaporuMetni(cocuk, { baslangicTarihi: '2026-10-15', gunSayisi: 3 }, NOW)
    assert.match(metin, /çocuğun/)
    assert.match(metin, /15\.10\.2026 tarihinden 17\.10\.2026 tarihine kadar \(3 gün\) istirahatlidir\.$/)
  })

  it('istirahatRaporuMetni yetişkin hastada "hastanın" der', () => {
    const metin = istirahatRaporuMetni(yetiskin, { baslangicTarihi: '2026-10-15', gunSayisi: 3 }, NOW)
    assert.match(metin, /hastanın/)
    assert.doesNotMatch(metin, /çocuğun/)
  })

  it('sporRaporuMetni: spor yapmasında … tıbbi bir sakınca yoktur', () => {
    const metin = sporRaporuMetni(cocuk, { tarih: '2026-10-15' }, NOW)
    assert.match(metin, /spor yapmasında ve spor faaliyetlerine katılmasında tıbbi bir sakınca yoktur\.$/)
  })

  it('kreseRaporuMetni: kreşe / gündüz bakım evine başlamasında tıbbi bir sakınca yoktur', () => {
    const metin = kreseRaporuMetni(cocuk, { tarih: '2026-10-15' }, NOW)
    assert.match(metin, /kreşe \/ gündüz bakım evine başlamasında tıbbi bir sakınca yoktur\.$/)
  })

  it('okulRaporuMetni: okula, derslere ve okul faaliyetlerine katılmasında tıbbi bir sakınca yoktur', () => {
    const metin = okulRaporuMetni(cocuk, { tarih: '2026-10-15' }, NOW)
    assert.match(metin, /okula, derslere ve okul faaliyetlerine katılmasında tıbbi bir sakınca yoktur\.$/)
  })

  it('cocukRaporuMetniUret her tip için doğru üreticiyi çağırır', () => {
    for (const t of COCUK_RAPOR_TIPLERI) {
      const d = t.gunAyarlanabilir ? { baslangicTarihi: '2026-10-15', gunSayisi: 3 } : { tarih: '2026-10-15' }
      const metin = cocukRaporuMetniUret(t, cocuk, d, NOW)
      assert.ok(metin.length > 0, t.id)
      assert.match(metin, /çocuğun/, t.id)
    }
  })
})
