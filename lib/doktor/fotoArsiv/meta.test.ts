/**
 * FOTO-ARSIV-01 — PATCH / batch validation, kill switches, image intake (size, format, EXIF) and the synthetic fixtures themselves.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { bosMeta, metaYamasiDogrula, TOPLU_AZAMI, topluIstekDogrula, topluYamaya, tarihGecerliMi, uuidMi, yamayiUygula } from './meta'
import { fotoAiAcikMi, fotoArsiviAcikMi } from './bayrak'
import { gorselCoz, TUREV_AZAMI_BAYT } from '../muayeneEk/foto/fotoServis'
import { jpegMetaTemizle, pngMetaTemizle } from './metaTemizle'
import { dataUrl, metaliPng, sentetikJpeg, sentetikPng } from './testGorselleri'

describe('PATCH doğrulama', () => {
  it('geçerli yamayı kabul eder, bilinmeyen anahtarı yok sayar', () => {
    const r = metaYamasiDogrula({ favori: true, yildiz: 4, bolge: 'yuz', etiketler: ['Kontrol', 'kontrol'], not: 'x', bilinmeyen: 1 })
    assert.ok(r.yama)
    assert.equal(r.yama!.favori, true)
    assert.equal(r.yama!.etiketler!.length, 1)
    assert.ok(!('bilinmeyen' in r.yama!))
  })
  it('geçersiz bilinen alan 400 sebebidir (sessizce atılmaz)', () => {
    for (const g of [{ yildiz: 6 }, { yildiz: 1.5 }, { favori: 'evet' }, { bolge: 'burun' }, { cekimTarihi: '31.12.2026' }, { cekimTarihi: '2026-02-30' }, { etiketler: 'a' }, { not: 5 }, { bolgeKaynagi: 'robot' }, {}, null, [], 'x']) {
      assert.ok(metaYamasiDogrula(g).hata, JSON.stringify(g))
    }
  })
  it('notu keser ve NUL karakterini atar; null bölge bölgeyi kaldırır', () => {
    const r = metaYamasiDogrula({ not: 'a\u0000b'.repeat(3) })
    assert.ok(!r.yama!.not!.includes('\u0000'))
    const m = yamayiUygula({ ...bosMeta('b'), bolge: 'yuz', bolgeKaynagi: 'hekim' }, metaYamasiDogrula({ bolge: null }).yama!)
    assert.equal(m.bolge, null)
    assert.equal(m.bolgeKaynagi, null)
  })
  it('Ayşe önerisi kaynağı olarak işaretlenebilir; hekim seçimi her zaman üstün gelir', () => {
    const a = yamayiUygula(bosMeta('b'), metaYamasiDogrula({ bolge: 'kol-sag', bolgeKaynagi: 'ayse' }).yama!)
    assert.equal(a.bolgeKaynagi, 'ayse')
    const h = yamayiUygula(a, metaYamasiDogrula({ bolge: 'kol-sol' }).yama!)
    assert.equal(h.bolgeKaynagi, 'hekim')
  })
  it('yama girdiyi değiştirmez', () => {
    const m = bosMeta('b'); const kopya = JSON.stringify(m)
    yamayiUygula(m, { favori: true, etiketler: ['a'] })
    assert.equal(JSON.stringify(m), kopya)
  })
  it('tarih doğrulama', () => {
    assert.ok(tarihGecerliMi('2026-10-16'))
    assert.ok(!tarihGecerliMi('2026-13-01') && !tarihGecerliMi('2026-02-30') && !tarihGecerliMi('16.10.2026'))
  })
})

describe('toplu işlem doğrulama', () => {
  const ids = (n: number) => Array.from({ length: n }, () => randomUUID())
  it('tüm işlemler geçerli girdiyle kabul edilir', () => {
    const b = ids(2)
    for (const g of [
      { islem: 'etiket-ekle', belgeIds: b, etiket: 'kontrol' }, { islem: 'etiket-cikar', belgeIds: b, etiket: 'kontrol' },
      { islem: 'favori', belgeIds: b, deger: true }, { islem: 'anahtar', belgeIds: b, deger: false }, { islem: 'gizle', belgeIds: b, deger: true },
      { islem: 'yildiz', belgeIds: b, deger: 3 }, { islem: 'bolge', belgeIds: b, deger: 'yuz' }, { islem: 'bolge', belgeIds: b, deger: null },
    ]) assert.ok(topluIstekDogrula(g).istek, JSON.stringify(g))
  })
  it('sınırlar: boş, çok fazla, geçersiz kimlik, yanlış tür; yinelenen kimlik birleşir', () => {
    assert.ok(topluIstekDogrula({ islem: 'favori', belgeIds: [], deger: true }).hata)
    assert.ok(topluIstekDogrula({ islem: 'favori', belgeIds: ids(TOPLU_AZAMI + 1), deger: true }).hata)
    assert.ok(topluIstekDogrula({ islem: 'favori', belgeIds: ['x'], deger: true }).hata)
    const k = randomUUID()
    assert.deepEqual(topluIstekDogrula({ islem: 'favori', belgeIds: [k, k], deger: true }).istek?.belgeIds, [k], 'yinelenen kimlik tek işlemde birleşir (idempotent)')
    assert.ok(topluIstekDogrula({ islem: 'sil', belgeIds: ids(1) }).hata)
    assert.ok(topluIstekDogrula({ islem: 'yildiz', belgeIds: ids(1), deger: 7 }).hata)
    assert.ok(topluIstekDogrula({ islem: 'bolge', belgeIds: ids(1), deger: 'burun' }).hata)
    assert.ok(topluIstekDogrula({ islem: 'favori', belgeIds: ids(1), deger: 'evet' }).hata)
    assert.ok(topluIstekDogrula({ islem: 'etiket-ekle', belgeIds: ids(1), etiket: '   ' }).hata)
    assert.ok(topluIstekDogrula(null).hata)
  })
  it('yama dönüşümü: etiket ekle/çıkar büyük-küçük harf duyarsız, tekrar yok', () => {
    const m = yamayiUygula(bosMeta('b'), { etiketler: ['Kontrol'] })
    const ekle = topluYamaya(topluIstekDogrula({ islem: 'etiket-ekle', belgeIds: [randomUUID()], etiket: 'kontrol' }).istek!, m)
    assert.deepEqual(ekle.etiketler, ['Kontrol'])
    const cikar = topluYamaya(topluIstekDogrula({ islem: 'etiket-cikar', belgeIds: [randomUUID()], etiket: 'KONTROL' }).istek!, m)
    assert.deepEqual(cikar.etiketler, [])
    assert.ok(uuidMi(randomUUID()) && !uuidMi('x') && !uuidMi(5))
  })
})

describe('kapalı anahtarlar', () => {
  it('varsayılan açık; kapalı sözcükleri tanır (Türkçe dahil)', () => {
    assert.equal(fotoArsiviAcikMi({}), true)
    assert.equal(fotoAiAcikMi({}), true)
    for (const v of ['off', 'OFF', '0', 'false', 'kapalı', 'kapali', 'hayır', 'disabled', ' no ']) {
      assert.equal(fotoArsiviAcikMi({ NOTYA_FOTO_ARSIVI: v }), false, v)
      assert.equal(fotoAiAcikMi({ NOTYA_FOTO_AI: v }), false, v)
    }
    assert.equal(fotoArsiviAcikMi({ NOTYA_FOTO_ARSIVI: 'on' }), true)
  })
  it('arşiv kapanınca AI de kapanır; AI kapanınca arşiv çalışır', () => {
    assert.equal(fotoAiAcikMi({ NOTYA_FOTO_ARSIVI: 'off' }), false)
    assert.equal(fotoArsiviAcikMi({ NOTYA_FOTO_AI: 'off' }), true)
  })
})

describe('görüntü alımı (modele gitmeden önce)', () => {
  it('PNG/JPEG data URL ve çıplak base64 kabul edilir; EXIF/metin parçaları atılır', () => {
    const png = gorselCoz(dataUrl(metaliPng('GPS-GIZLI')))
    assert.ok('gorsel' in png)
    if ('gorsel' in png) {
      assert.equal(png.gorsel.mime, 'image/png')
      assert.ok(!Buffer.from(png.gorsel.base64, 'base64').toString('latin1').includes('GPS-GIZLI'))
    }
    const jpg = gorselCoz(sentetikJpeg('piksel').toString('base64'))
    assert.ok('gorsel' in jpg)
    if ('gorsel' in jpg) {
      const metin = Buffer.from(jpg.gorsel.base64, 'base64').toString('latin1')
      assert.ok(metin.includes('piksel') && !metin.includes('Samsung') && !metin.includes('Exif'))
    }
  })
  it('reddedilenler: boş, JPEG/PNG olmayan, çok büyük, bozuk zincir', () => {
    for (const x of [undefined, null, 5, '', 'bu base64 değil ama gibi', Buffer.from('RIFFxxxxWEBPVP8 ').toString('base64'), Buffer.from('GIF89a....').toString('base64')]) {
      assert.ok('hata' in gorselCoz(x), String(x))
    }
    assert.ok('hata' in gorselCoz(Buffer.alloc(TUREV_AZAMI_BAYT + 10).toString('base64')))
    assert.ok('hata' in gorselCoz(Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00]).toString('base64')))
  })
})

describe('sentetik test görüntüleri', () => {
  it('PNG geçerli: imza, IHDR, meta parçaları temizlenir, piksel parçası korunur', () => {
    const p = sentetikPng(16, 12)
    assert.equal(p.subarray(1, 4).toString(), 'PNG')
    const temiz = pngMetaTemizle(metaliPng('X-GIZLI'))!
    assert.ok(temiz && !temiz.toString('latin1').includes('X-GIZLI') && temiz.toString('latin1').includes('IDAT'))
  })
  it('sentetik JPEG zinciri geçerli ve temizleme sonrası tarama verisi aynı', () => {
    const j = sentetikJpeg('TARAMA-VERISI')
    const t = jpegMetaTemizle(j)!
    assert.ok(t.toString('latin1').includes('TARAMA-VERISI'))
    assert.ok(t.length < j.length)
  })
})
