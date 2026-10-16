import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  COZGER_DUZEYLERI,
  COZGER_GECERLILIK_TIPLERI,
  COZGER_UYARI_METNI,
  cozgerDurumGecerliMi,
  cozgerDuzeyiGecerliMi,
  cozgerGecerlilikTipiGecerliMi,
  cozgerKalanGun,
  cozgerYenilemeUyarisiGerekliMi,
  cozgerYonlendirmeNotuMetni,
} from './cozgerTakip'

describe('cozgerTakip — durum/düzey/geçerlilik katalogları', () => {
  it('geçerli durum id’lerini kabul eder, geçersizi reddeder', () => {
    assert.equal(cozgerDurumGecerliMi('hazirlik'), true)
    assert.equal(cozgerDurumGecerliMi('sonuclandi'), true)
    assert.equal(cozgerDurumGecerliMi('bilinmeyen'), false)
    assert.equal(cozgerDurumGecerliMi(null), false)
    assert.equal(cozgerDurumGecerliMi(undefined), false)
  })

  it('düzey kataloğu madde 15/1 metinsel düzeyleri + "saptanmadı" içerir, "%" oranı yok', () => {
    for (const d of COZGER_DUZEYLERI) assert.doesNotMatch(d, /%/)
    assert.equal(cozgerDuzeyiGecerliMi('Belirgin ÖGV'), true)
    assert.equal(cozgerDuzeyiGecerliMi('Çok ileri düzeyde ÖGV'), true)
    assert.equal(cozgerDuzeyiGecerliMi('Özel koşul gereksinimi var (ÖKGV)'), true)
    assert.equal(cozgerDuzeyiGecerliMi('Özel gereksinim saptanmadı'), true)
    assert.equal(cozgerDuzeyiGecerliMi('%40'), false)
    assert.equal(cozgerDuzeyiGecerliMi('40'), false)
    assert.equal(cozgerDuzeyiGecerliMi(null), false)
  })

  it('geçerlilik tipi sadece sureli/surekli', () => {
    assert.deepEqual([...COZGER_GECERLILIK_TIPLERI], ['sureli', 'surekli'])
    assert.equal(cozgerGecerlilikTipiGecerliMi('sureli'), true)
    assert.equal(cozgerGecerlilikTipiGecerliMi('surekli'), true)
    assert.equal(cozgerGecerlilikTipiGecerliMi('kalici'), false)
  })

  it('uyarı metni resmi rapor olmadığını ve kurul gerekliliğini açıkça belirtir', () => {
    assert.match(COZGER_UYARI_METNI, /resmi ÇÖZGER raporu değildir/i)
    assert.match(COZGER_UYARI_METNI, /sağlık kurulu/i)
  })
})

describe('cozgerTakip — yenileme hesaplama (madde 11: süreli/sürekli)', () => {
  const NOW = new Date('2026-10-15T12:00:00Z').getTime()

  it('sürekli raporda kalan gün/yenileme uyarısı hep null/false', () => {
    assert.equal(cozgerKalanGun('surekli', '2027-01-01', NOW), null)
    assert.equal(cozgerYenilemeUyarisiGerekliMi('surekli', '2027-01-01', NOW), false)
  })

  it('tarih yoksa null/false', () => {
    assert.equal(cozgerKalanGun('sureli', null, NOW), null)
    assert.equal(cozgerYenilemeUyarisiGerekliMi('sureli', null, NOW), false)
  })

  it('süreli, eşik (60 gün) dışındaysa uyarı gerekmez', () => {
    // 2026-10-15 + 90 gün ≈ 2027-01-13
    assert.equal(cozgerYenilemeUyarisiGerekliMi('sureli', '2027-01-13', NOW), false)
    assert.ok((cozgerKalanGun('sureli', '2027-01-13', NOW) || 0) > 60)
  })

  it('süreli, eşik (60 gün) içindeyse uyarı gerekir', () => {
    assert.equal(cozgerYenilemeUyarisiGerekliMi('sureli', '2026-11-20', NOW), true)
    const kalan = cozgerKalanGun('sureli', '2026-11-20', NOW)
    assert.ok(kalan !== null && kalan <= 60 && kalan >= 0)
  })

  it('süreli, süresi geçmişse (negatif gün) uyarı hep gerekir', () => {
    assert.equal(cozgerYenilemeUyarisiGerekliMi('sureli', '2026-09-01', NOW), true)
    const kalan = cozgerKalanGun('sureli', '2026-09-01', NOW)
    assert.ok(kalan !== null && kalan < 0)
  })
})

describe('cozgerTakip — yönlendirme notu metni (VELI-YASAL-ONAM: yaş, branş değil)', () => {
  const NOW = new Date('2026-10-15T12:00:00Z').getTime()

  it('reşit olmayan hastada "çocuğun" ifadesi kullanılır', () => {
    const metin = cozgerYonlendirmeNotuMetni(
      { adSoyad: 'Test Çocuk', dogumTarihiIso: '2018-01-01' },
      { durum: 'heyet_tarihi_belli', kurumAdi: 'Örnek Devlet Hastanesi', heyetTarihi: '2026-12-01' },
      NOW
    )
    assert.match(metin, /çocuğun/)
    assert.match(metin, /Örnek Devlet Hastanesi/)
    assert.match(metin, /01\.12\.2026/)
    assert.match(metin, /Heyet değerlendirme tarihi belli/)
  })

  it('18 yaş üstü (bilinen) hastada "hastanın" ifadesi kullanılır (VELI-YASAL-ONAM)', () => {
    const metin = cozgerYonlendirmeNotuMetni(
      { adSoyad: 'Test Yetişkin', dogumTarihiIso: '2000-01-01' },
      { durum: 'hazirlik', kurumAdi: null, heyetTarihi: null },
      NOW
    )
    assert.match(metin, /hastanın/)
    assert.doesNotMatch(metin, /çocuğun/)
  })

  it('kurum/heyet tarihi yoksa o cümleler eklenmez', () => {
    const metin = cozgerYonlendirmeNotuMetni(
      { adSoyad: 'Test', dogumTarihiIso: '2018-01-01' },
      { durum: 'basvuru_yapildi', kurumAdi: null, heyetTarihi: null },
      NOW
    )
    assert.doesNotMatch(metin, /Yönlendirilen kurum/)
    assert.doesNotMatch(metin, /Heyet değerlendirme tarihi:/)
    assert.match(metin, /Başvuru yapıldı/)
  })
})
