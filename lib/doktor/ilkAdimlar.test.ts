import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ILK_ADIM_SATIRLARI,
  kartGorunurMu,
  tumuTamam,
  yeniHesapMi,
  type IlkAdimlar,
} from './ilkAdimlar'

const hepsiTamam: IlkAdimlar = { profil: true, hasta: true, randevu: true, muayene: true, katalog: true, iletisim: true }
const hicbiri: IlkAdimlar = { profil: false, hasta: false, randevu: false, muayene: false, katalog: false, iletisim: false }

describe('ilkAdimlar', () => {
  it('altı kurulum satırı, her biri gerçek bir hedefe bağlanır', () => {
    assert.equal(ILK_ADIM_SATIRLARI.length, 6)
    const anahtarlar = ILK_ADIM_SATIRLARI.map((s) => s.anahtar)
    assert.deepEqual(anahtarlar, ['profil', 'hasta', 'randevu', 'muayene', 'katalog', 'iletisim'])
    for (const s of ILK_ADIM_SATIRLARI) {
      assert.ok(s.etiket.trim().length > 3, `${s.anahtar}: etiket boş`)
      assert.ok(s.aciklama.trim().length > 3, `${s.anahtar}: açıklama boş`)
      assert.ok(s.href.startsWith('/'), `${s.anahtar}: href mutlak değil: ${s.href}`)
    }
  })

  it('satır hedefleri doğru ekranlara gider (kurulumun tek kapısı)', () => {
    const href = Object.fromEntries(ILK_ADIM_SATIRLARI.map((s) => [s.anahtar, s.href]))
    assert.equal(href.hasta, '/dashboard/doktor/hasta-ekle')
    assert.equal(href.randevu, '/dashboard/doktor/randevular')
    assert.equal(href.katalog, '/dashboard/doktor/entegrasyonlar/faturalama?tab=katalog')
    assert.equal(href.iletisim, '/dashboard/doktor/ayarlar/iletisim')
  })

  it('tumuTamam: tek eksik satır bile kartı canlı tutar', () => {
    assert.equal(tumuTamam(hepsiTamam), true)
    assert.equal(tumuTamam({ ...hepsiTamam, katalog: false }), false)
  })

  it('yeniHesapMi: 3 nottan azı yeni hesaptır; çalışan muayenehane değildir', () => {
    assert.equal(yeniHesapMi(0), true)
    assert.equal(yeniHesapMi(2), true)
    assert.equal(yeniHesapMi(3), false)
    assert.equal(yeniHesapMi(250), false)
    assert.equal(yeniHesapMi(Number.NaN), false)
  })

  it('kart yalnız: yeni hesap + veri var + gizlenmedi + eksik adım varken görünür', () => {
    assert.equal(kartGorunurMu(true, hicbiri, false), true)
    assert.equal(kartGorunurMu(true, hepsiTamam, false), false) // her şey tamam → kaybolur
    assert.equal(kartGorunurMu(true, hicbiri, true), false) // doktor gizledi
    assert.equal(kartGorunurMu(false, hicbiri, false), false) // yerleşik hesap hiç görmez
    assert.equal(kartGorunurMu(true, null, false), false) // veri gelmedi → sessiz
  })
})
