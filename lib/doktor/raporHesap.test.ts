import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  aralikHesapla,
  aralikSiniri,
  raporPencereleri,
  sureYazi,
  trtAn,
  type NotSatiri,
  type SeansSatiri,
} from './raporHesap'

const SIMDI = trtAn(2026, 9, 26, 15)

describe('NOTYA-RAPORLAR-01 pencereler', () => {
  it('cumartesi günü hafta pazartesiden başlar, ay ve 3 ay takvim ayıdır', () => {
    const p = raporPencereleri(SIMDI)
    assert.equal(p.hafta.bas, trtAn(2026, 9, 21).toISOString())
    assert.equal(p.hafta.son, trtAn(2026, 9, 28).toISOString())
    assert.equal(p.gecenHafta.bas, trtAn(2026, 9, 14).toISOString())
    assert.equal(p.ay.bas, trtAn(2026, 9, 1).toISOString())
    assert.equal(p.ay.son, trtAn(2026, 10, 1).toISOString())
    assert.equal(p.gecenAy.bas, trtAn(2026, 8, 1).toISOString())
    assert.equal(p.ucAy.bas, trtAn(2026, 7, 1).toISOString())
    assert.equal(p.oncekiUcAy.bas, trtAn(2026, 4, 1).toISOString())
    assert.equal(p.oncekiUcAy.son, trtAn(2026, 7, 1).toISOString())
    assert.equal(p.bugun.bas, trtAn(2026, 9, 26).toISOString())
    assert.equal(p.bugun.son, trtAn(2026, 9, 27).toISOString())
  })

  it('ocakta son 3 ay önceki yılın kasımından başlar', () => {
    const p = raporPencereleri(trtAn(2026, 1, 15, 9))
    assert.equal(p.ucAy.bas, trtAn(2025, 11, 1).toISOString())
    assert.equal(p.ucAy.son, trtAn(2026, 2, 1).toISOString())
  })

  it('yıl aralığı ocaktan içinde bulunulan ayın sonuna kadardır', () => {
    const s = aralikSiniri('yil', SIMDI)
    assert.equal(s.bas, trtAn(2026, 1, 1).toISOString())
    assert.equal(s.son, trtAn(2026, 10, 1).toISOString())
  })
})

describe('NOTYA-RAPORLAR-01 günlük sayı, süre, koltuk', () => {
  const seanslar: SeansSatiri[] = [
    { started_at: trtAn(2026, 9, 22, 9).toISOString(), session_type: 'muayene', duration_seconds: 18 * 60, specialty: 'dahiliye' },
    { started_at: trtAn(2026, 9, 22, 10).toISOString(), session_type: 'kontrol', duration_seconds: 18 * 60, specialty: 'dahiliye' },
    { started_at: trtAn(2026, 9, 24, 11).toISOString(), session_type: 'muayene', duration_seconds: 11 * 60, specialty: 'pediatri' },
    { started_at: trtAn(2026, 9, 24, 12).toISOString(), session_type: 'telesaglik', duration_seconds: 0, specialty: 'pediatri' },
    { started_at: trtAn(2026, 9, 24, 13).toISOString(), session_type: 'konsültasyon', duration_seconds: null, specialty: 'pediatri' },
  ]

  it('süresiz seans ortalamaya girmez; koltuk sayı çarpı ortalamadır', () => {
    const h = aralikHesapla('hafta', SIMDI, seanslar, [], false, () => 'gizli')
    const sal = h.gunler.find((g) => g.etiket === 'Sal')
    const per = h.gunler.find((g) => g.etiket === 'Per')
    const paz = h.gunler.find((g) => g.etiket === 'Paz')
    assert.equal(h.gunler.length, 7)
    assert.equal(sal?.sayi, 2)
    assert.equal(sal?.ortalamaDk, 18)
    assert.equal(sal?.koltukDk, 36)
    assert.equal(per?.sayi, 3)
    assert.equal(per?.ortalamaDk, 11)
    assert.equal(per?.koltukDk, 33)
    assert.equal(paz?.sayi, 0)
    assert.equal(paz?.ortalamaDk, null)
    assert.equal(h.enCok?.ad, 'Perşembe')
    assert.equal(h.enCok?.sayi, 3)
    assert.equal(h.enUzun?.ad, 'Salı')
    assert.equal(h.tartiliOrtalamaDk, 16)
    assert.match(h.okuma, /Perşembe, 3/)
    assert.match(h.okuma, /Salı/)
    assert.equal(h.branslar, null)
    assert.deepEqual(h.tipler.map((t) => t.sayi), [2, 1, 1, 1])
  })

  it('branş satırı yalnız izin verilince gelir', () => {
    const ad = (k: string | null) => (k === 'pediatri' ? 'Pediatri' : 'Dahiliye')
    const h = aralikHesapla('hafta', SIMDI, seanslar, [], true, ad)
    assert.deepEqual(h.branslar, [
      { ad: 'Pediatri', sayi: 3 },
      { ad: 'Dahiliye', sayi: 2 },
    ])
  })
})

describe('NOTYA-RAPORLAR-01 yakınma, tanı, ilaç', () => {
  const notlar: NotSatiri[] = [
    {
      note_type: 'soap',
      approved_at: '2026-09-22T12:00:00+03:00',
      basvuru_yakinmasi: 'Baş Ağrısı',
      icd10_codes: [{ code: 'R51', description_tr: 'Baş ağrısı', description: 'Headache' }],
      content_ilaclar: [{ ad: 'Parasetamol', doz: '500 mg', kullanim: 'günde 3' }],
    },
    {
      note_type: 'soap',
      approved_at: '2026-09-23T12:00:00+03:00',
      basvuru_yakinmasi: 'baş ağrısı',
      icd10_codes: [{ code: 'r51', description: 'Headache' }],
      content_ilaclar: [{ ad: 'parasetamol', doz: '1 g' }],
    },
    {
      note_type: 'epikriz',
      approved_at: null,
      basvuru_yakinmasi: '  Öksürük  ',
      icd10_codes: ['J06.9'],
      content_ilaclar: [{ ad: 'Gizli ilaç', doz: 'yok' }],
    },
  ]

  it('aynı yazım birleşir, tanı adı Türkçe kalır, doz ve onaysız ilaç sayılmaz', () => {
    const h = aralikHesapla('ay', SIMDI, [], notlar, false, () => '')
    assert.deepEqual(h.yakinmalar, [
      { ad: 'Baş Ağrısı', sayi: 2 },
      { ad: 'Öksürük', sayi: 1 },
    ])
    assert.deepEqual(h.tanilar[0], { kod: 'R51', ad: 'Baş ağrısı', sayi: 2 })
    assert.deepEqual(h.tanilar[1], { kod: 'J06.9', ad: '—', sayi: 1 })
    assert.deepEqual(h.ilaclar, [{ ad: 'Parasetamol', sayi: 2 }])
    assert.equal(h.onaylanan, 2)
    assert.equal(h.bekleyen, 1)
    assert.deepEqual(h.notTurleri, [
      { ad: 'SOAP', sayi: 2 },
      { ad: 'Epikriz', sayi: 1 },
    ])
    assert.equal(sureYazi(78), '1 sa 18 dk')
  })
})
