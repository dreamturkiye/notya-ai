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
  tarihOkunusu,
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

  it('NOTYA-AYSE-GERI-04: doğum tarihi yalnız açık "doğumda" için dolar — "yenidoğan" / "postnatal" tahmindir', () => {
    const doldur = (alinti: string, veri: Record<string, unknown> = {}) =>
      dogumdaTarihDoldur({ asi_adi: 'Hepatit B', ...veri }, { asi_adi: { kaynak: 'dosyadan', alinti } }, '2024-02-28').uygulama_tarihi
    for (const a of ['doğumda Hep B yapıldı', 'Doğum anında uygulanmış', 'doğar doğmaz yapılmış', 'Doğumhanede Hepatit B yapıldı']) assert.equal(doldur(a), '2024-02-28', a)
    for (const a of ['yenidoğan döneminde yapıldı', 'postnatal 1. ayda yapıldı', 'prenatal takipleri tam', 'doğum sonrası kontrolde yapıldı', '']) assert.equal(doldur(a), undefined, a)
  })

  it('NOTYA-AYSE-GERI-04: aynı metin başka bir gün söylüyorsa doğum tarihi yazılmaz ("bugün" için 28.02.2024 hatası)', () => {
    const doldur = (alinti: string, notlar = '') =>
      dogumdaTarihDoldur({ asi_adi: 'Hepatit B', notlar }, { asi_adi: { kaynak: 'doktor_soyledi', alinti } }, '2024-02-28').uygulama_tarihi
    for (const a of [
      'doğumda Hepatit B yapılmış, ikinci doz bugün yapıldı',
      'doğumda ilk doz, dün ikinci doz yapıldı',
      'doğumda yapılmamış, 2. ayda yapıldı',
      'doğumda değil 15.03.2024 tarihinde yapıldı',
      'doğumda yapılamadı, az önce yaptık',
    ]) assert.equal(doldur(a), undefined, a)
    assert.equal(doldur('doğumda yapıldı', 'bugün kontrolde söylendi'), undefined)
  })

  it('NOTYA-AYSE-GERI-04: tarih onay sorusundan önce sözle okunur — "bugün / dün / yarın" ile', () => {
    assert.equal(tarihOkunusu('2026-10-01', '2026-10-01'), 'bugün, 1 Ekim 2026 Perşembe')
    assert.equal(tarihOkunusu('2026-09-30', '2026-10-01'), 'dün, 30 Eylül 2026 Çarşamba')
    assert.equal(tarihOkunusu('2026-10-02', '2026-10-01'), 'yarın, 2 Ekim 2026 Cuma')
    assert.equal(tarihOkunusu('2024-02-28', '2026-10-01'), '28 Şubat 2024 Çarşamba')
    assert.equal(tarihOkunusu('2026-10-01'), '1 Ekim 2026 Perşembe')
    assert.equal(tarihOkunusu('bozuk'), 'bozuk')
    const m = sesOzetMetni({
      etiket: 'Aşı kaydı', hastaAd: 'Ali Yılmaz', bugun: '2026-10-01',
      veri: { asi_adi: 'Hepatit B', uygulama_tarihi: '2026-10-01', gizli_alan: 'x' },
      alanlar: [
        { anahtar: 'asi_adi', etiket: 'Aşı', tip: 'metin' },
        { anahtar: 'uygulama_tarihi', etiket: 'Uygulama tarihi', tip: 'tarih' },
        { anahtar: 'gizli_alan', etiket: 'Kayıt', tip: 'metin', gizli: true },
      ],
      eksik: [],
    })
    assert.equal(m, 'Ali Yılmaz için Aşı kaydı hazırladım. Aşı: Hepatit B. Uygulama tarihi: bugün, 1 Ekim 2026 Perşembe. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz?')
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
