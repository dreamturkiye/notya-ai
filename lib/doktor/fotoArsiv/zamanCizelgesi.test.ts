/** FOTO-ARSIV-01 — zaman çizelgesi, filtre, arama, gün farkı, aynı bölge gezinmesi, zoom/pan matematiği, kalite, EXIF. */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  aralikMetni, bolgeSayilari, bolgedeKomsu, BOS_FILTRE, etiketOzeti, filtrele, gruplandir, gunBasligi, gunFarki, listedeKomsu,
  oncekiAyniBolge, yenidenEskiye, type FotoOge,
} from './zamanCizelgesi'
import {
  BASLANGIC_GORUNUMU, ciftDokunus, imlecteYakinlastir, kapsayicidanIceriye, kaydir, olcekSinirla, pinchUygula, sigdir, sinirla,
} from './gorunum'
import { kaliteKarari, kaliteOlc } from './goruntuKalitesi'
import { gorselMetaTemizle, jpegMetaTemizle, jpegMetaVarMi, pngMetaTemizle } from './metaTemizle'

let n = 0
const oge = (o: Partial<FotoOge>): FotoOge => ({
  belgeId: `b${++n}`, seansId: null, cekimAt: '2026-10-01T09:00:00Z', yuklenmeAt: '2026-10-01T09:05:00Z', dosyaAdi: 'f.jpg', mime: 'image/jpeg', boyut: 1000,
  bolge: null, bolgeKaynagi: null, favori: false, yildiz: 0, anahtar: false, etiketler: [], not: '', duzenlendi: false, notasyonSayisi: 0, kucukVar: false, aiVar: false, ...o,
})

describe('sıralama, gruplama, filtre, arama', () => {
  const liste = [
    oge({ belgeId: 'a', cekimAt: '2026-08-01T10:00:00Z', bolge: 'kol-sag', etiketler: ['Egzama'], not: 'Kuru ve çatlak' }),
    oge({ belgeId: 'b', cekimAt: '2026-09-17T10:00:00Z', bolge: 'kol-sag', favori: true, yildiz: 4, seansId: 's2' }),
    oge({ belgeId: 'c', cekimAt: '2026-09-17T14:00:00Z', bolge: 'yuz', anahtar: true, seansId: 's2' }),
    oge({ belgeId: 'd', cekimAt: '2026-09-17T15:00:00Z', bolge: 'yuz', seansId: 's3' }),
    oge({ belgeId: 'e', cekimAt: '2026-10-05T08:00:00Z', bolge: null }),
  ]
  it('yeniden eskiye; eşitlikte deterministik', () => {
    assert.deepEqual(yenidenEskiye(liste).map((x) => x.belgeId), ['e', 'd', 'c', 'b', 'a'])
    const ayni = [oge({ belgeId: 'z' }), oge({ belgeId: 'y' })]
    assert.deepEqual(yenidenEskiye(ayni).map((x) => x.belgeId), ['y', 'z'])
  })
  it('gün + muayene bazında gruplar; "Bugün" / "Dün" / tarih başlığı', () => {
    const g = gruplandir(liste, '2026-10-06T12:00:00Z')
    assert.deepEqual(g.map((x) => x.baslik), ['Dün', '17 Eylül 2026', '17 Eylül 2026', '1 Ağustos 2026'])
    assert.equal(g[0].ogeler[0].belgeId, 'e')
    assert.deepEqual(g[1].ogeler.map((x) => x.belgeId), ['d'])
    assert.deepEqual(g[2].ogeler.map((x) => x.belgeId), ['c', 'b'])
    assert.equal(gunBasligi('2026-10-06', '2026-10-06'), 'Bugün')
  })
  it('gün anahtarı Türkiye saatine göre (23:30 UTC ertesi gün)', () => {
    const g = gruplandir([oge({ cekimAt: '2026-09-17T22:30:00Z' }), oge({ cekimAt: '2026-09-17T20:30:00Z' })], '2026-10-06T12:00:00Z')
    assert.equal(g.length, 2, '22:30Z = 18 Eylül 01:30 TRT; 20:30Z = 17 Eylül 23:30 TRT')
  })
  it('bölge / favori / anahtar / yıldız / etiket / muayene / arama filtreleri', () => {
    assert.deepEqual(filtrele(liste, { ...BOS_FILTRE, bolge: 'kol-sag' }).map((x) => x.belgeId), ['a', 'b'])
    assert.deepEqual(filtrele(liste, { ...BOS_FILTRE, yalnizFavori: true }).map((x) => x.belgeId), ['b'])
    assert.deepEqual(filtrele(liste, { ...BOS_FILTRE, yalnizAnahtar: true }).map((x) => x.belgeId), ['c'])
    assert.deepEqual(filtrele(liste, { ...BOS_FILTRE, minYildiz: 4 }).map((x) => x.belgeId), ['b'])
    assert.deepEqual(filtrele(liste, { ...BOS_FILTRE, etiket: 'egzama' }).map((x) => x.belgeId), ['a'])
    assert.deepEqual(filtrele(liste, { ...BOS_FILTRE, seansId: 's2' }).map((x) => x.belgeId), ['b', 'c'])
    assert.deepEqual(filtrele(liste, { ...BOS_FILTRE, arama: 'ÇATLAK' }).map((x) => x.belgeId), ['a'], 'Türkçe büyük/küçük harf duyarsız')
    assert.deepEqual(filtrele(liste, { ...BOS_FILTRE, arama: 'göğüs' }).map((x) => x.belgeId), [])
    assert.equal(filtrele(liste, BOS_FILTRE).length, 5)
  })
  it('etiket özeti ve bölge sayıları', () => {
    assert.deepEqual(etiketOzeti(liste), [{ etiket: 'Egzama', adet: 1 }])
    assert.deepEqual(bolgeSayilari(liste), { 'kol-sag': 2, yuz: 2, _yok: 1 })
  })
})

describe('gün farkı ve "47 gün arayla"', () => {
  it('takvim günü farkı (saat değil)', () => {
    assert.equal(gunFarki('2026-08-01T10:00:00Z', '2026-09-17T10:00:00Z'), 47)
    assert.equal(gunFarki('2026-09-17T20:59:00Z', '2026-09-17T21:01:00Z'), 1, 'TRT gece yarısını geçti')
    assert.equal(gunFarki('2026-09-17T10:00:00Z', '2026-08-01T10:00:00Z'), -47)
  })
  it('metin biçimleri', () => {
    assert.equal(aralikMetni('2026-08-01T10:00:00Z', '2026-09-17T10:00:00Z'), '47 gün arayla')
    assert.equal(aralikMetni('2026-09-17T10:00:00Z', '2026-09-17T12:00:00Z'), 'Aynı gün')
    assert.equal(aralikMetni('2026-09-17T10:00:00Z', '2026-09-18T10:00:00Z'), '1 gün arayla')
    assert.match(aralikMetni('2026-01-01T10:00:00Z', '2026-04-01T10:00:00Z'), /^90 gün arayla \(≈ 3 ay\)$/)
    assert.match(aralikMetni('2025-01-01T10:00:00Z', '2026-07-01T10:00:00Z'), /gün arayla \(≈ 1,5 yıl\)$/)
    assert.equal(aralikMetni('2026-09-17T10:00:00Z', '2026-08-01T10:00:00Z'), '47 gün arayla', 'sıradan bağımsız')
  })
})

describe('aynı bölgede önceki / komşu', () => {
  const l = [
    oge({ belgeId: 'k1', cekimAt: '2026-08-01T10:00:00Z', bolge: 'kol-sag' }),
    oge({ belgeId: 'k2', cekimAt: '2026-09-01T10:00:00Z', bolge: 'kol-sag' }),
    oge({ belgeId: 'k3', cekimAt: '2026-10-01T10:00:00Z', bolge: 'kol-sag' }),
    oge({ belgeId: 'y1', cekimAt: '2026-09-15T10:00:00Z', bolge: 'yuz' }),
    oge({ belgeId: 'g1', cekimAt: '2026-09-20T10:00:00Z', bolge: 'genel' }),
    oge({ belgeId: 'g0', cekimAt: '2026-09-10T10:00:00Z', bolge: 'genel' }),
  ]
  it('önceki fotoğraf: aynı bölge, hedeften eski olanların en yenisi', () => {
    assert.equal(oncekiAyniBolge(l, l[2])?.belgeId, 'k2')
    assert.equal(oncekiAyniBolge(l, l[1])?.belgeId, 'k1')
    assert.equal(oncekiAyniBolge(l, l[0]), null)
    assert.equal(oncekiAyniBolge(l, l[3]), null, 'yüz için tek fotoğraf')
    assert.equal(oncekiAyniBolge(l, l[4]), null, '"genel" hiçbir şeyle eşleşmez')
    assert.equal(oncekiAyniBolge(l, oge({ bolge: null })), null)
  })
  it('bölgede sonraki / önceki', () => {
    assert.equal(bolgedeKomsu(l, l[1], 1)?.belgeId, 'k3')
    assert.equal(bolgedeKomsu(l, l[1], -1)?.belgeId, 'k1')
    assert.equal(bolgedeKomsu(l, l[2], 1), null)
    assert.equal(bolgedeKomsu(l, l[3], 1), null)
  })
  it('listede komşu', () => {
    const g = yenidenEskiye(l)
    assert.equal(listedeKomsu(g, g[1].belgeId, 1)?.belgeId, g[2].belgeId)
    assert.equal(listedeKomsu(g, g[0].belgeId, -1), null)
    assert.equal(listedeKomsu(g, 'yok', 1), null)
  })
})

describe('zoom / pan matematiği', () => {
  const kap = { w: 400, h: 800 }
  const icerik = sigdir(4000, 3000, kap) // 400 x 300
  it('sığdırma oranı korur', () => {
    assert.deepEqual(icerik, { w: 400, h: 300 })
    assert.deepEqual(sigdir(0, 10, kap), { w: 0, h: 0 })
  })
  it('ölçek 1..12 aralığında kalır', () => {
    assert.equal(olcekSinirla(0.2), 1)
    assert.equal(olcekSinirla(99), 12)
    assert.equal(olcekSinirla(NaN), 1)
  })
  it('imleç altındaki nokta sabit kalır', () => {
    const imlec = { x: 250, y: 420 }
    const once = kapsayicidanIceriye(BASLANGIC_GORUNUMU, imlec, kap, icerik)!
    const g = imlecteYakinlastir(BASLANGIC_GORUNUMU, imlec, 3, kap, icerik)
    assert.equal(g.olcek, 3)
    const sonra = kapsayicidanIceriye(g, imlec, kap, icerik)!
    assert.ok(Math.abs(sonra.x - once.x) < 1e-9 && Math.abs(sonra.y - once.y) < 1e-9)
  })
  it('kaydırma sınırı: yakınlaşınca kenar boşluk bırakmaz', () => {
    let g = imlecteYakinlastir(BASLANGIC_GORUNUMU, { x: 200, y: 400 }, 4, kap, icerik)
    g = kaydir(g, 99999, 99999, kap, icerik)
    const bosX = (kap.w - icerik.w) / 2, bosY = (kap.h - icerik.h) / 2
    assert.ok(bosX + g.x <= 1e-9 && bosY + g.y <= 1e-9, 'sol/üst kenar kapsayıcının dışında ya da hizalı')
    g = kaydir(g, -99999, -99999, kap, icerik)
    assert.ok(bosX + g.x + icerik.w * g.olcek >= kap.w - 1e-9)
  })
  it('1x\'te içerik ortalı kalır (kaydırma etkisiz)', () => {
    const g = kaydir(BASLANGIC_GORUNUMU, 120, -40, kap, icerik)
    assert.deepEqual({ x: g.x, y: g.y }, { x: 0, y: 0 })
  })
  it('iki parmak: açıldıkça yakınlaşır, orta nokta takip edilir', () => {
    const g = pinchUygula(BASLANGIC_GORUNUMU, [{ x: 150, y: 400 }, { x: 250, y: 400 }], [{ x: 100, y: 400 }, { x: 300, y: 400 }], kap, icerik)
    assert.ok(Math.abs(g.olcek - 2) < 1e-9)
    assert.equal(pinchUygula(BASLANGIC_GORUNUMU, [{ x: 1, y: 1 }, { x: 1, y: 1 }], [{ x: 0, y: 0 }, { x: 9, y: 9 }], kap, icerik).olcek, 1)
  })
  it('çift dokunuş: yakınlaştır / sıfırla', () => {
    const z = ciftDokunus(BASLANGIC_GORUNUMU, { x: 200, y: 400 }, kap, icerik)
    assert.equal(z.olcek, 2.5)
    assert.deepEqual(ciftDokunus(z, { x: 200, y: 400 }, kap, icerik), BASLANGIC_GORUNUMU)
  })
  it('içerik dışına dokunma null', () => {
    assert.equal(kapsayicidanIceriye(BASLANGIC_GORUNUMU, { x: 10, y: 10 }, kap, icerik), null)
    assert.ok(kapsayicidanIceriye(BASLANGIC_GORUNUMU, { x: 200, y: 400 }, kap, icerik))
  })
  it('sinirla tek başına geçerli bir dönüşüm döndürür', () => {
    const g = sinirla({ olcek: 0.1, x: 500, y: -500 }, kap, icerik)
    assert.equal(g.olcek, 1)
  })
})

describe('kalite kapısı (cihaz üstü, ücretsiz)', () => {
  const kare = (w: number, h: number, f: (x: number, y: number) => number) => {
    const v = new Uint8ClampedArray(w * h * 4)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; const l = f(x, y); v[i] = l; v[i + 1] = l * 0.9; v[i + 2] = l * 0.8; v[i + 3] = 255 }
    return v
  }
  it('keskin, iyi ışıklı sentetik desen iyi', () => {
    const w = 600, h = 600
    const k = kaliteKarari(kaliteOlc(kare(w, h, (x, y) => ((x >> 3) + (y >> 3)) % 2 ? 200 : 60), w, h), w, h)
    assert.equal(k.durum, 'iyi', JSON.stringify(k))
    assert.equal(k.oneri, null)
  })
  it('düz (bulanık) kare yetersiz → "Çekimi yenileyin"', () => {
    const w = 600, h = 600
    const k = kaliteKarari(kaliteOlc(kare(w, h, () => 128), w, h), w, h)
    assert.equal(k.durum, 'yetersiz')
    assert.ok(k.sorunlar.some((s) => s.kod === 'bulanik'))
    assert.match(k.oneri || '', /Çekimi yenileyin/)
  })
  it('çok karanlık ve çok parlak', () => {
    const w = 600, h = 600
    const desen = (a: number, b: number) => (x: number, y: number) => ((x >> 3) + (y >> 3)) % 2 ? a : b
    const kar = kaliteKarari(kaliteOlc(kare(w, h, desen(20, 5)), w, h), w, h)
    assert.ok(kar.sorunlar.some((s) => s.kod === 'karanlik' && s.agir))
    const par = kaliteKarari(kaliteOlc(kare(w, h, desen(255, 245)), w, h), w, h)
    assert.ok(par.sorunlar.some((s) => s.kod === 'asiri-parlak'))
  })
  it('küçük çözünürlük uyarı, çok küçük yetersiz', () => {
    const iyi = kaliteOlc(kare(300, 300, (x, y) => ((x >> 3) + (y >> 3)) % 2 ? 200 : 60), 300, 300)
    assert.equal(kaliteKarari(iyi, 300, 300).durum, 'uyari')
    assert.equal(kaliteKarari(iyi, 200, 200).durum, 'yetersiz')
  })
})

describe('meta veri temizleme (EXIF / GPS / XMP / yorum)', () => {
  const seg = (isaret: number, govde: Buffer) => Buffer.concat([Buffer.from([0xff, isaret, (govde.length + 2) >> 8, (govde.length + 2) & 255]), govde])
  const jpeg = (...segmentler: Buffer[]) => Buffer.concat([Buffer.from([0xff, 0xd8]), ...segmentler, Buffer.from([0xff, 0xda, 0x00, 0x08, 1, 1, 0, 0, 0x3f, 0, 0xde, 0xad, 0xbe, 0xef, 0xff, 0xd9])])
  const exif = seg(0xe1, Buffer.concat([Buffer.from('Exif\0\0'), Buffer.from('GPS:41.0,29.0 Marka:X')]))
  const jfif = seg(0xe0, Buffer.from('JFIF\0\x01\x01\0\0\x01\0\x01\0\0'))
  const dqt = seg(0xdb, Buffer.alloc(65, 3))
  it('EXIF/XMP/yorum atılır, JFIF ve kuantizasyon tabloları kalır, piksel verisi birebir', () => {
    const giris = jpeg(jfif, exif, seg(0xe1, Buffer.from('http://ns.adobe.com/xap/1.0/\0<xmp/>')), seg(0xfe, Buffer.from('hasta adı')), dqt)
    assert.equal(jpegMetaVarMi(giris), true)
    const cikis = jpegMetaTemizle(giris)!
    assert.ok(cikis)
    assert.equal(jpegMetaVarMi(cikis), false)
    assert.ok(!cikis.includes('GPS:41'))
    assert.ok(!cikis.includes('hasta adı'))
    assert.ok(cikis.includes(Buffer.from('JFIF')))
    assert.ok(cikis.includes(Buffer.from([0xde, 0xad, 0xbe, 0xef])), 'sıkıştırılmış piksel verisi aynen')
    assert.ok(cikis.length < giris.length)
  })
  it('ICC profili ve Adobe renk dönüşümü korunur', () => {
    const icc = seg(0xe2, Buffer.from('ICC_PROFILE\0\x01\x01renk'))
    const mpf = seg(0xe2, Buffer.from('MPF\0xx'))
    const cikis = jpegMetaTemizle(jpeg(icc, mpf, seg(0xee, Buffer.from('Adobe\0\x64\0\0\0\0\x01'))))!
    assert.ok(cikis.includes(Buffer.from('ICC_PROFILE')))
    assert.ok(!cikis.includes(Buffer.from('MPF')))
    assert.ok(cikis.includes(Buffer.from('Adobe')))
  })
  it('JPEG olmayan ya da bozuk girdi null (model\'e gitmez)', () => {
    assert.equal(jpegMetaTemizle(Buffer.from('merhaba')), null)
    assert.equal(jpegMetaTemizle(Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0xff])), null, 'segment uzunluğu dosyayı aşıyor')
    assert.equal(gorselMetaTemizle(Buffer.from('GIF89a....')), null)
  })
  it('PNG: eXIf, tEXt, tIME atılır; IHDR/IDAT/IEND kalır', () => {
    const chunk = (tur: string, veri: Buffer) => Buffer.concat([Buffer.from([(veri.length >>> 24) & 255, (veri.length >>> 16) & 255, (veri.length >>> 8) & 255, veri.length & 255]), Buffer.from(tur), veri, Buffer.alloc(4)])
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', Buffer.alloc(13)), chunk('eXIf', Buffer.from('GPS')), chunk('tEXt', Buffer.from('Author\0Dr')), chunk('tIME', Buffer.alloc(7)), chunk('IDAT', Buffer.from('pix')), chunk('IEND', Buffer.alloc(0))])
    const out = pngMetaTemizle(png)!
    assert.ok(out.includes(Buffer.from('IHDR')) && out.includes(Buffer.from('IDAT')) && out.includes(Buffer.from('IEND')))
    assert.ok(!out.includes(Buffer.from('eXIf')) && !out.includes(Buffer.from('tEXt')) && !out.includes(Buffer.from('tIME')))
    assert.equal(gorselMetaTemizle(png)?.mime, 'image/png')
  })
})
