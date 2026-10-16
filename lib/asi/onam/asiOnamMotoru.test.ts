/**
 * NOTYA-ASI-ONAM-01 — pure-logic tests for the vaccine consent engine (asiOnamMotoru.ts).
 * Covers: empty selection, unknown vaccine name (must never invent content), dedup, and the
 * method/status/onayEden validators every write path (in-clinic, remote, paper) relies on.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ASI_ONAM_ICERIGI, ASI_ONAM_ICERIGI_ADLARI, asiOnamIcerigiBul } from './asiOnamIcerigi'
import {
  ASI_ONAM_DURUMLARI,
  ASI_ONAM_YONTEMLERI,
  asiOnamDurumuGecerliMi,
  asiOnamIcerigiGoster,
  asiOnamIstegiHazirla,
  asiOnamOnayEdenGecerliMi,
  asiOnamOzetMetni,
  asiOnamYontemiGecerliMi,
  TURKIYE_ASI_ONAM_PAKETI,
} from './asiOnamMotoru'

const BIR_ASI = ASI_ONAM_ICERIGI_ADLARI[0]
const IKI_ASI = ASI_ONAM_ICERIGI_ADLARI[1]

describe('NOTYA-ASI-ONAM-01 · asiOnamIstegiHazirla (the one snapshot function every write path calls)', () => {
  it('boş seçim reddedilir', () => {
    for (const bos of [[], null, undefined, 'tek-string-dizi-değil', {}]) {
      const sonuc = asiOnamIstegiHazirla(bos)
      assert.equal(sonuc.ok, false)
      if (!sonuc.ok) assert.match(sonuc.hata, /en az bir aşı/i)
    }
  })

  it('bilinmeyen aşı adı reddedilir — içerik asla icat edilmez', () => {
    const sonuc = asiOnamIstegiHazirla(['Bu Veri Setinde Olmayan Bir Aşı 12345'])
    assert.equal(sonuc.ok, false)
    if (!sonuc.ok) assert.match(sonuc.hata, /onam içeriği bulunamadı/i)
  })

  it('tek geçerli aşı → ok + tam içerik anlık görüntüsü (ad, korur, yanEtkiler, onamCumlesi, kaynak)', () => {
    const sonuc = asiOnamIstegiHazirla([BIR_ASI])
    assert.equal(sonuc.ok, true)
    if (sonuc.ok) {
      assert.deepEqual(sonuc.asilar, [BIR_ASI])
      assert.equal(sonuc.icerikAnlikGoruntu.length, 1)
      const i = sonuc.icerikAnlikGoruntu[0]
      assert.equal(i.ad, BIR_ASI)
      assert.ok(i.korur.length > 0)
      assert.ok(Array.isArray(i.yanEtkiler) && i.yanEtkiler.length > 0)
      assert.ok(i.onamCumlesi.length > 0)
      assert.ok(i.kaynak.length > 0)
    }
  })

  it('aynı aşı iki kez seçilirse tekilleştirilir (dedup)', () => {
    const sonuc = asiOnamIstegiHazirla([BIR_ASI, BIR_ASI, `  ${BIR_ASI}  `])
    assert.equal(sonuc.ok, true)
    if (sonuc.ok) assert.deepEqual(sonuc.asilar, [BIR_ASI])
  })

  it('birkaç geçerli aşı birlikte → hepsi görüntüde, sırayla', () => {
    const sonuc = asiOnamIstegiHazirla([BIR_ASI, IKI_ASI])
    assert.equal(sonuc.ok, true)
    if (sonuc.ok) {
      assert.deepEqual(sonuc.asilar, [BIR_ASI, IKI_ASI])
      assert.deepEqual(sonuc.icerikAnlikGoruntu.map((i) => i.ad), [BIR_ASI, IKI_ASI])
    }
  })

  it('bir geçerli + bir geçersiz aşı birlikte seçilirse TÜMÜ reddedilir (yarım onam içeriği yok)', () => {
    const sonuc = asiOnamIstegiHazirla([BIR_ASI, 'Olmayan Aşı Adı'])
    assert.equal(sonuc.ok, false)
  })
})

describe('NOTYA-ASI-ONAM-01 · asiOnamIcerigiGoster / veri seti tutarlılığı', () => {
  it('veri setindeki her aşı adı kendi üzerinden çözülebilir (ASI_ONAM_ICERIGI_ADLARI ile asiOnamIcerigiBul eşleşir)', () => {
    assert.ok(ASI_ONAM_ICERIGI.length >= 10, `beklenenden az aşı (${ASI_ONAM_ICERIGI.length}) — veri seti eksik olabilir`)
    for (const ad of ASI_ONAM_ICERIGI_ADLARI) {
      assert.ok(asiOnamIcerigiBul(ad), `${ad} kendi listesinden bulunamadı`)
      assert.ok(asiOnamIcerigiGoster(ad), `${ad} için gösterim üretilemedi`)
    }
  })

  it('bilinmeyen ad için null döner (icat edilmiş içerik yok)', () => {
    assert.equal(asiOnamIcerigiGoster('Bu Veri Setinde Olmayan Bir Aşı 12345'), null)
    assert.equal(asiOnamIcerigiBul('Bu Veri Setinde Olmayan Bir Aşı 12345'), null)
  })

  it('ad eşleşmesi boşluk/büyük-küçük harfe duyarsız (TR locale)', () => {
    const ad = BIR_ASI
    assert.ok(asiOnamIcerigiGoster(`  ${ad.toLocaleUpperCase('tr-TR')}  `))
  })

  it('TURKIYE_ASI_ONAM_PAKETI.pediatriBransi pediatri — Phase 2 ülke paketleri kendi branşını taşır', () => {
    assert.equal(TURKIYE_ASI_ONAM_PAKETI.pediatriBransi, 'pediatri')
    assert.equal(TURKIYE_ASI_ONAM_PAKETI.dil, 'tr')
  })
})

describe('NOTYA-ASI-ONAM-01 · yöntem / durum / onayEden doğrulayıcıları', () => {
  it('ASI_ONAM_YONTEMLERI tüm beklenen 5 akışı kapsar (klinik, uzaktan-eposta, uzaktan-whatsapp, uzaktan-portal, kagit)', () => {
    assert.deepEqual([...ASI_ONAM_YONTEMLERI].sort(), ['kagit', 'klinik', 'uzaktan-eposta', 'uzaktan-portal', 'uzaktan-whatsapp'].sort())
    for (const y of ASI_ONAM_YONTEMLERI) assert.equal(asiOnamYontemiGecerliMi(y), true)
    for (const kötü of ['sms', 'telefon', '', null, undefined, 42]) assert.equal(asiOnamYontemiGecerliMi(kötü), false)
  })

  it('ASI_ONAM_DURUMLARI sadece alindi/reddedildi', () => {
    assert.deepEqual([...ASI_ONAM_DURUMLARI].sort(), ['alindi', 'reddedildi'])
    for (const d of ASI_ONAM_DURUMLARI) assert.equal(asiOnamDurumuGecerliMi(d), true)
    for (const kötü of ['beklemede', '', null, undefined]) assert.equal(asiOnamDurumuGecerliMi(kötü), false)
  })

  it('asiOnamOnayEdenGecerliMi — ad zorunlu, yakinlik/telefon serbest', () => {
    assert.equal(asiOnamOnayEdenGecerliMi({ ad: 'Ayşe Yılmaz', yakinlik: 'anne', telefon: '0555...' }), true)
    assert.equal(asiOnamOnayEdenGecerliMi({ ad: 'Ayşe Yılmaz' }), true)
    assert.equal(asiOnamOnayEdenGecerliMi({ ad: '   ' }), false)
    assert.equal(asiOnamOnayEdenGecerliMi({ ad: 42 }), false)
    for (const kötü of [null, undefined, 'string', 42, []]) assert.equal(asiOnamOnayEdenGecerliMi(kötü), false)
  })
})

describe('NOTYA-ASI-ONAM-01 · asiOnamOzetMetni', () => {
  it('seçilen aşı adlarını virgülle birleştirir', () => {
    const sonuc = asiOnamIstegiHazirla([BIR_ASI, IKI_ASI])
    assert.equal(sonuc.ok, true)
    if (sonuc.ok) assert.equal(asiOnamOzetMetni(sonuc.icerikAnlikGoruntu), `${BIR_ASI}, ${IKI_ASI}`)
  })
})
