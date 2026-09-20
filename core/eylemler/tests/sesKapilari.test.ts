/**
 * NOTYA-EYLEM-19 — spoken affirm / reject gates and DOB fill for voice commit.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  dogumdaTarihDoldur,
  sesCiddiUyariEngeli,
  sesEksikAlanEngeli,
  sesOnayMetniGecerliMi,
  sesOzetMetni,
  sesVazgecMetniMi,
} from '@/core/eylemler/sesKapilari'
import type { IlacUyarisi } from '@/core/eylemler/ilacUyari'

describe('ses kapıları — onay / vazgeç metni', () => {
  it('net Evet / Onaylıyorum / Kaydet geçer', () => {
    assert.equal(sesOnayMetniGecerliMi('Evet'), true)
    assert.equal(sesOnayMetniGecerliMi('evet hocam'), true)
    assert.equal(sesOnayMetniGecerliMi('Onaylıyorum'), true)
    assert.equal(sesOnayMetniGecerliMi('Kaydet'), true)
    assert.equal(sesOnayMetniGecerliMi('Tamam'), true)
  })

  it('belirsiz veya uzun cümle geçmez', () => {
    assert.equal(sesOnayMetniGecerliMi(''), false)
    assert.equal(sesOnayMetniGecerliMi('hmm'), false)
    assert.equal(sesOnayMetniGecerliMi('belki'), false)
    assert.equal(sesOnayMetniGecerliMi('evet ama dozu iki yap'), false)
  })

  it('Hayır / vazgeç tanınır', () => {
    assert.equal(sesVazgecMetniMi('Hayır'), true)
    assert.equal(sesVazgecMetniMi('vazgeç'), true)
    assert.equal(sesVazgecMetniMi('iptal'), true)
    assert.equal(sesVazgecMetniMi('evet'), false)
  })
})

describe('ses kapıları — ciddi uyarı ve eksik alan', () => {
  it('ciddi ilaç uyarısı ses commit’i engeller', () => {
    const u: IlacUyarisi[] = [
      { tur: 'alerji', siddet: 'ciddi', baslik: 'Alerji', metin: 'Penisilin', kaynak: 'dosya' },
    ]
    assert.match(sesCiddiUyariEngeli(u) || '', /Ciddi/)
    assert.equal(sesCiddiUyariEngeli([]), null)
  })

  it('zorunlu boş alan engeli Türkçe etiketle döner', () => {
    const msg = sesEksikAlanEngeli(
      ['asi_adi', 'uygulama_tarihi'],
      { asi_adi: 'Hepatit B' },
      [
        { anahtar: 'asi_adi', etiket: 'Aşı', tip: 'metin' },
        { anahtar: 'uygulama_tarihi', etiket: 'Uygulama tarihi', tip: 'tarih' },
      ]
    )
    assert.match(msg || '', /Uygulama tarihi/)
    assert.equal(
      sesEksikAlanEngeli(['asi_adi'], { asi_adi: 'Hepatit B' }, [{ anahtar: 'asi_adi', etiket: 'Aşı', tip: 'metin' }]),
      null
    )
  })
})

describe('ses kapıları — doğumda tarih + özet', () => {
  it('doğumda alıntısı + DOB → uygulama_tarihi dolar', () => {
    const v = dogumdaTarihDoldur(
      { asi_adi: 'Hepatit B' },
      { asi_adi: { kaynak: 'dosyadan', alinti: 'doğumda Hep B yapıldı' } },
      '2026-09-01'
    )
    assert.equal(v.uygulama_tarihi, '2026-09-01')
  })

  it('tarih zaten varsa dokunulmaz', () => {
    const v = dogumdaTarihDoldur(
      { asi_adi: 'Hepatit B', uygulama_tarihi: '2026-08-15' },
      { asi_adi: { kaynak: 'dosyadan', alinti: 'doğumda' } },
      '2026-09-01'
    )
    assert.equal(v.uygulama_tarihi, '2026-08-15')
  })

  it('özet kaydedildi demez; onay sorar', () => {
    const m = sesOzetMetni({
      etiket: 'Aşı kaydı',
      hastaAd: 'Ali Yılmaz',
      veri: { asi_adi: 'Hepatit B', uygulama_tarihi: '2026-09-01' },
      alanlar: [
        { anahtar: 'asi_adi', etiket: 'Aşı', tip: 'metin' },
        { anahtar: 'uygulama_tarihi', etiket: 'Uygulama tarihi', tip: 'tarih' },
      ],
      eksik: [],
    })
    assert.match(m, /Onaylıyor musunuz/)
    assert.ok(!/kaydedildi/i.test(m))
  })
})
