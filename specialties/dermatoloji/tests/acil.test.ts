import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DERM_ACIL_EYLEM_LISTESI,
  DERM_ACIL_KODLARI,
  HASTA_ACIL_METNI,
  INTAKE_ACIL_SECENEKLERI,
  acilBandMetni,
  dermAcilTara,
  intakeAcilKodlari,
  type DermAcilKod,
} from '../engines/acil'
import { BRANS_SORULARI } from '../../../lib/intake/bransSorulari'

// DERM-EXCEPTIONAL-01 · madde 12 — acil kırmızı bayrak kapısı (göz engines/acil.ts deseni).
// Kural: tanı koymaz, doz / ilaç / ölçülü hedef yazmaz, sevk kararını hekime bırakır.

describe('derm acil — metinden bayrak', () => {
  it('SJS/TEN: ağız ve gözde erozyonla döküntü yakalanır ve "hemen" önceliklidir', () => {
    const b = dermAcilTara(['Ağızda ve gözde erozyon var, ilaç sonrası yaygın döküntü başladı.'])
    const kodlar = b.map((x) => x.kod)
    assert.ok(kodlar.includes('sjs_ten'))
    assert.equal(b[0].oncelik, 'hemen')
  })

  it('anjioödem hava yolu ve nekrotizan fasiit "hemen", eritrodermi "aynı gün"', () => {
    assert.equal(dermAcilTara(['dilde şişlik ve nefes darlığı'])[0].kod, 'anjiodem_hava_yolu')
    assert.equal(dermAcilTara(['bulgularla uyumsuz şiddetli ağrı, krepitasyon'])[0].kod, 'nekrotizan_fasiit')
    const e = dermAcilTara(['eritrodermi tablosu'])
    assert.equal(e[0].kod, 'eritrodermi')
    assert.equal(e[0].oncelik, 'ayni_gun')
  })

  it('hemen olan bayraklar aynı gün olanlardan önce sıralanır', () => {
    const b = dermAcilTara(['vücuda yayılan yaygın bül var', 'dil şişliği ve hırıltı'])
    assert.deepEqual(b.map((x) => x.oncelik), ['hemen', 'ayni_gun'])
  })

  it('temiz metin bayrak üretmez, band boş kalır', () => {
    const b = dermAcilTara(['Sırtta 3 aydır kaşıntılı plak, yeni ilaç yok.'])
    assert.deepEqual(b, [])
    assert.deepEqual(acilBandMetni(b), [])
  })

  it('hekimin elle işaretlediği kod metin eşleşmese de bayrak olur ve tekrarlanmaz', () => {
    const b = dermAcilTara(['şikâyet yok'], ['yaygin_bul'])
    assert.deepEqual(b.map((x) => x.kod), ['yaygin_bul'])
    const c = dermAcilTara(['vücutta yaygın bül'], ['yaygin_bul'])
    assert.equal(c.filter((x) => x.kod === 'yaygin_bul').length, 1)
  })
})

describe('derm acil — intake kapısı', () => {
  it('intake seçenek etiketleri dermatoloji intake formundaki kutucuklarla birebir aynı', () => {
    const alan = BRANS_SORULARI.dermatoloji.alanlar.find((a) => a.id === 'acilBelirtilerDerm')
    assert.ok(alan, 'acilBelirtilerDerm alanı yok')
    const secenekler = (alan as { secenekler?: string[] }).secenekler || []
    for (const s of INTAKE_ACIL_SECENEKLERI) assert.ok(secenekler.includes(s.etiket), s.etiket)
    assert.ok(secenekler.includes('Yok'))
  })

  it('intake işaretlerinden kod üretir; "Yok" kod üretmez', () => {
    assert.deepEqual(intakeAcilKodlari(['Yok']), [])
    assert.deepEqual(intakeAcilKodlari(['Vücutta yaygın su toplaması (bül)']), ['yaygin_bul'])
    assert.deepEqual(intakeAcilKodlari(null), [])
  })

  it('intake yardım metni 112 yönlendirmesi taşır, tanı dili taşımaz', () => {
    const alan = BRANS_SORULARI.dermatoloji.alanlar.find((a) => a.id === 'acilBelirtilerDerm') as { yardim?: string }
    assert.match(String(alan.yardim), /112/)
    assert.doesNotMatch(String(alan.yardim), /Stevens|toksik epidermal|pemfigus|nekrotizan/i)
  })
})

describe('derm acil — eylem listesi ve hasta metni kilitleri', () => {
  it('her kod için eylem listesi var ve doz / ilaç adı / süre hedefi içermez', () => {
    for (const { kod } of DERM_ACIL_KODLARI) {
      const liste = DERM_ACIL_EYLEM_LISTESI[kod as DermAcilKod]
      assert.ok(liste.length >= 4, kod)
      for (const satir of liste) {
        assert.doesNotMatch(satir, /\d+\s*(mg|mg\/kg|ml|mL|IU|J\/cm²)/i, `${kod}: doz yazılmış`)
        assert.doesNotMatch(satir, /prednizolon|adrenalin|siklosporin|IVIG|antihistaminik/i, `${kod}: ilaç adı yazılmış`)
      }
    }
  })

  it('eylem satırları kararı hekime bırakır (tanı koymaz)', () => {
    const hepsi = Object.values(DERM_ACIL_EYLEM_LISTESI).flat().join(' ')
    assert.match(hepsi, /hekim/i)
    assert.doesNotMatch(hepsi, /tanı (konur|koyulur|kesinleşti)/i)
  })

  it('hasta yüzü metni yönlendirir, tanı ve doz yazmaz', () => {
    assert.match(HASTA_ACIL_METNI, /112/)
    assert.doesNotMatch(HASTA_ACIL_METNI, /Stevens|TEN|pemfigus|eritrodermi|mg/i)
  })
})
