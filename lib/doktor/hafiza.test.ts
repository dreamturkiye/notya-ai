/**
 * NOTYA-OGRENME-05 — doktor_soyledi anında uygulanır; eski aday satırları normalize.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  asamaBul,
  durumHesapla,
  kayitNormalize,
  ogrenmeyeDeger,
  hafizaBloguSohbet,
  hafizaBloguSes,
  type HafizaKayit,
  type HafizaOzeti,
  type DoktorIliski,
} from './hafiza'

describe('NOTYA-OGRENME-05 durumHesapla', () => {
  it('doktor_soyledi → uygulanir (tek kanıt, kesin olsun olmasın)', () => {
    assert.equal(durumHesapla('doktor_soyledi', true), 'uygulanir')
    assert.equal(durumHesapla('doktor_soyledi', false), 'uygulanir')
  })
  it('gözlem/düzeltme yalnız kesin ise uygulanir', () => {
    assert.equal(durumHesapla('gozlem', false), 'aday')
    assert.equal(durumHesapla('duzeltme', false), 'aday')
    assert.equal(durumHesapla('duzeltme', true), 'uygulanir')
  })
})

describe('NOTYA-OGRENME-05 kayitNormalize', () => {
  const kahve: HafizaKayit = {
    kategori: 'kisisel',
    anahtar: 'kahve-tercihi',
    deger: 'Kahveyi çok sütlü ve çok şekerli sever.',
    kaynak: 'doktor_soyledi',
    kanit_sayisi: 1,
    kesin: true,
    aktif: true,
    durum: 'aday', // bug: DB default after 106
  }
  const hocam: HafizaKayit = {
    kategori: 'iletisim',
    anahtar: 'hitap-sekli',
    deger: "Doktor kendisine 'Hocam' diye hitap edilmesini tercih ediyor",
    kaynak: 'doktor_soyledi',
    kanit_sayisi: 3,
    kesin: true,
    aktif: true,
    durum: 'uygulanir',
  }

  it('kahve aday + doktor_soyledi → uygulanir', () => {
    const n = kayitNormalize(kahve)
    assert.equal(n.durum, 'uygulanir')
    assert.equal(n.kesin, true)
  })
  it('hocam uygulanir kalır', () => {
    assert.equal(kayitNormalize(hocam).durum, 'uygulanir')
  })
  it('kapalı korunur', () => {
    const k = kayitNormalize({ ...kahve, durum: 'kapali', aktif: false })
    assert.equal(k.durum, 'kapali')
    assert.equal(k.aktif, false)
  })
  it('duzeltme kesin+aday → uygulanir (106 backfill niyeti)', () => {
    const n = kayitNormalize({
      kategori: 'uslup', anahtar: 'kisa', deger: 'Kısa yaz', kaynak: 'duzeltme',
      kanit_sayisi: 2, kesin: true, aktif: true, durum: 'aday',
    })
    assert.equal(n.durum, 'uygulanir')
  })
})

describe('NOTYA-OGRENME-05 ogrenmeyeDeger kişisel', () => {
  it('kahve tercihi öğrenmeye değer', () => {
    assert.equal(ogrenmeyeDeger('Kahveyi çok sütlü ve çok şekerli severim.'), true)
  })
  it('hitap tercihi öğrenmeye değer', () => {
    assert.equal(ogrenmeyeDeger('Bana Hocam diye hitap et lütfen.'), true)
  })
})

describe('NOTYA-OGRENME-05 asama + prompt', () => {
  it('10. seans meslektas', () => {
    assert.equal(asamaBul(9), 'alisma')
    assert.equal(asamaBul(10), 'meslektas')
  })

  const iliski: DoktorIliski = {
    doctor_id: 'd1', seans_sayisi: 10, ilk_seans_gunu: '2026-09-01', son_seans_gunu: '2026-10-03',
    toplam_not: 20, toplam_sohbet: 40, toplam_duzeltme: 5, rutin: { gunBasinaOrtHasta: 12, tipikBaslangicSaati: '09:00', tipikBitisSaati: '17:00' },
    ozet: 'Hitap olarak Hocam ister; kahvesini sütlü ve şekerli sever.', ozet_seans: 8,
  }
  const kesin: HafizaKayit[] = [
    kayitNormalize({
      kategori: 'iletisim', anahtar: 'hitap', deger: "Kendisine 'Hocam' denmesini ister",
      kaynak: 'doktor_soyledi', kanit_sayisi: 3, kesin: true, aktif: true, durum: 'uygulanir',
    }),
    kayitNormalize({
      kategori: 'kisisel', anahtar: 'kahve', deger: 'Kahveyi çok sütlü ve çok şekerli sever',
      kaynak: 'doktor_soyledi', kanit_sayisi: 1, kesin: true, aktif: true, durum: 'aday',
    }),
  ]
  const h: HafizaOzeti = {
    iliski, asama: 'meslektas', kesinKayitlar: kesin.filter((k) => k.durum === 'uygulanir'),
    belirsizKayitlar: [], stilProfili: '',
  }

  it('sohbet bloğu kişisel + hitap uygula der', () => {
    const b = hafizaBloguSohbet(h)
    assert.match(b, /MESLEKTAŞ/)
    assert.match(b, /SORMADAN uygula/)
    assert.match(b, /Kahveyi/)
    assert.match(b, /Hocam/)
  })
  it('ses bloğu Bildiklerin UYGULA', () => {
    const b = hafizaBloguSes(h)
    assert.match(b, /UYGULA/)
    assert.match(b, /Kahveyi|Hocam/)
  })
})
