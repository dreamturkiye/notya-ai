/** FOTO-ARSIV-01 — non-destructive edit model: validation, geometry, measurement, pixel pipeline. */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ayarDegistiMi, ayarlariDogrula, cikisBoyutu, gorunumdenKaynaga, kaynaktanGorunume, kirpmaDogrula, mmPerPiksel,
  notasyonlariDogrula, olcumMetni, olcumMm, ozelDogrula, pikselUzunlugu, varsayilanAyarlar, tonDegistiMi, NOTASYON_AZAMI,
} from './duzenleme'
import { calismaBoyutu, kanalTablolari, tonuUygula } from './piksel'
import { bolgeIdMi, ayniBolgeMi, etiketleriTemizle } from './bolgeler'

describe('ayarlar', () => {
  it('varsayılan = orijinal; her değişiklik "orijinale dön"ü anlamlı yapar', () => {
    const a = varsayilanAyarlar()
    assert.equal(ayarDegistiMi(a), false)
    assert.equal(ayarDegistiMi({ ...a, parlaklik: 5 }), true)
    assert.equal(ayarDegistiMi({ ...a, dondur: 90 }), true)
    assert.equal(ayarDegistiMi({ ...a, kirp: { x: 0.1, y: 0.1, w: 0.5, h: 0.5 } }), true)
    assert.equal(tonDegistiMi({ ...a, dondur: 90 }), false)
  })
  it('sınırları zorlar, çöpü atar', () => {
    const a = ayarlariDogrula({ parlaklik: 900, kontrast: -900, pozlama: 'x', sicaklik: 33.6, doygunluk: NaN, dondur: 45, kirp: { x: 2, y: 2, w: 2, h: 2 } })
    assert.deepEqual(a, { parlaklik: 100, kontrast: -100, pozlama: 0, sicaklik: 34, doygunluk: 0, dondur: 0, kirp: null })
    assert.deepEqual(ayarlariDogrula(null), varsayilanAyarlar())
    assert.equal(ayarlariDogrula({ dondur: 270 }).dondur, 270)
  })
  it('kırpma: tam kare = kırpma yok, çok küçük = geçersiz, taşan kısım kesilir', () => {
    assert.equal(kirpmaDogrula({ x: 0, y: 0, w: 1, h: 1 }), null)
    assert.equal(kirpmaDogrula({ x: 0.2, y: 0.2, w: 0.01, h: 0.5 }), null)
    assert.deepEqual(kirpmaDogrula({ x: 0.8, y: 0.1, w: 0.5, h: 0.5 }), { x: 0.8, y: 0.1, w: 0.2, h: 0.5 })
  })
})

describe('geometri: döndürme + kırpma ve ters dönüşüm', () => {
  const durumlar = [0, 90, 180, 270] as const
  it('kaynak → görünüm → kaynak gidiş-dönüş (her açı, kırpmalı ve kırpmasız)', () => {
    for (const dondur of durumlar) {
      for (const kirp of [null, { x: 0.1, y: 0.2, w: 0.6, h: 0.5 }]) {
        for (const p of [{ x: 0.3, y: 0.4 }, { x: 0.15, y: 0.25 }, { x: 0.69, y: 0.69 }]) {
          const g = kaynaktanGorunume(p, { dondur, kirp })
          const geri = gorunumdenKaynaga(g, { dondur, kirp })
          assert.ok(Math.abs(geri.x - p.x) < 1e-9 && Math.abs(geri.y - p.y) < 1e-9, `${dondur} ${JSON.stringify(kirp)}`)
        }
      }
    }
  })
  it('90° saat yönü: sol-üst köşe sağ-üste gider', () => {
    const g = kaynaktanGorunume({ x: 0, y: 0 }, { dondur: 90, kirp: null })
    assert.deepEqual(g, { x: 1, y: 0 })
  })
  it('çıkış boyutu 90/270°de en-boy yer değiştirir', () => {
    assert.deepEqual(cikisBoyutu(4000, 3000, { dondur: 90, kirp: null }), { w: 3000, h: 4000 })
    assert.deepEqual(cikisBoyutu(4000, 3000, { dondur: 0, kirp: { x: 0, y: 0, w: 0.5, h: 0.5 } }), { w: 2000, h: 1500 })
  })
})

describe('notasyonlar (vektör, piksele basılmaz)', () => {
  it('geçerli tipleri korur, bozukları atar, koordinatı 0..1\'e sıkıştırır', () => {
    const n = notasyonlariDogrula([
      { id: 'a1', t: 'ok', a: { x: -1, y: 0.5 }, b: { x: 0.5, y: 2 }, renk: 'mavi' },
      { id: 'a2', t: 'daire', a: { x: 0.1, y: 0.1 }, b: { x: 0.3, y: 0.3 }, renk: 'bilinmeyen' },
      { id: 'a3', t: 'serbest', noktalar: [{ x: 0, y: 0 }] },
      { id: 'a4', t: 'metin', p: { x: 0.5, y: 0.5 }, metin: '  lezyon 1  ' },
      { id: 'a5', t: 'metin', p: { x: 0.5, y: 0.5 }, metin: '   ' },
      { id: 'a6', t: 'sihir', a: { x: 0, y: 0 } },
      'çöp', null, 7,
    ])
    assert.deepEqual(n.map((x) => x.t), ['ok', 'daire', 'metin'])
    assert.deepEqual((n[0] as { a: { x: number } }).a, { x: 0, y: 0.5 })
    assert.equal((n[1] as { renk: string }).renk, 'kirmizi')
    assert.equal((n[2] as { metin: string }).metin, 'lezyon 1')
  })
  it('en fazla bir ölçek çizgisi; mm pozitif; aynı kimlik tekilleşir; adet sınırı', () => {
    const n = notasyonlariDogrula([
      { id: 's', t: 'olcek', a: { x: 0, y: 0 }, b: { x: 0.1, y: 0 }, mm: 10 },
      { id: 's2', t: 'olcek', a: { x: 0, y: 0 }, b: { x: 0.2, y: 0 }, mm: 10 },
      { id: 's3', t: 'olcek', a: { x: 0, y: 0 }, b: { x: 0.2, y: 0 }, mm: -5 },
    ])
    assert.equal(n.length, 1)
    const cok = notasyonlariDogrula(Array.from({ length: 200 }, (_, i) => ({ id: 'x', t: 'ok', a: { x: 0, y: 0 }, b: { x: 1, y: 1 }, _i: i })))
    assert.equal(cok.length, NOTASYON_AZAMI)
    assert.equal(new Set(cok.map((x) => x.id)).size, NOTASYON_AZAMI)
  })
  it('serbest çizim nokta sayısı sınırlı', () => {
    const n = notasyonlariDogrula([{ id: 'f', t: 'serbest', noktalar: Array.from({ length: 2000 }, (_, i) => ({ x: (i % 100) / 100, y: 0.5 })) }])
    assert.equal((n[0] as { noktalar: unknown[] }).noktalar.length, 300)
  })
})

describe('ölçüm: tek dokunuşla ölçek kalibrasyonu', () => {
  const W = 4000, H = 3000
  it('10 mm\'lik cetvel 400 piksel ise 1 piksel = 0,025 mm; 80 piksel lezyon = 2 mm', () => {
    const notasyonlar = notasyonlariDogrula([{ id: 'c', t: 'olcek', a: { x: 0.1, y: 0.5 }, b: { x: 0.2, y: 0.5 }, mm: 10 }])
    const mmPx = mmPerPiksel(notasyonlar, W, H)!
    assert.ok(Math.abs(mmPx - 0.025) < 1e-9)
    // 80 px horizontal
    const mm = olcumMm({ x: 0.5, y: 0.5 }, { x: 0.5 + 80 / W, y: 0.5 }, W, H, mmPx)
    assert.ok(Math.abs(mm - 2) < 1e-9)
  })
  it('en-boy oranı hesaba girer (dikey çizgi yatay ile aynı piksel uzunluğunda aynı mm)', () => {
    assert.ok(Math.abs(pikselUzunlugu({ x: 0, y: 0 }, { x: 0, y: 0.1 }, W, H) - 300) < 1e-9)
    assert.ok(Math.abs(pikselUzunlugu({ x: 0, y: 0 }, { x: 0.075, y: 0 }, W, H) - 300) < 1e-9)
  })
  it('kalibre edilmemiş fotoğrafta ölçek yok', () => {
    assert.equal(mmPerPiksel([], W, H), null)
  })
  it('metin: mm < 100, cm ≥ 100; Türkçe ondalık virgül', () => {
    assert.equal(olcumMetni(12.34), '12,3 mm')
    assert.equal(olcumMetni(125), '12,5 cm')
    assert.equal(olcumMetni(NaN), '—')
  })
})

describe('FotoOzel belgesi', () => {
  it('etiketleri temizler, notu sınırlar, bozuk girdide boş belge verir', () => {
    const o = ozelDogrula({ etiketler: ['  Yara ', 'yara', 'x'.repeat(100), '#'], not: 'a'.repeat(5000), ayarlar: { parlaklik: 10 }, notasyonlar: 'x' })
    assert.equal(o.etiketler.length, 2)
    assert.equal(o.etiketler[1].length, 24)
    assert.equal(o.not.length, 2000)
    assert.equal(o.ayarlar.parlaklik, 10)
    assert.deepEqual(o.notasyonlar, [])
    assert.deepEqual(ozelDogrula(undefined).etiketler, [])
  })
})

describe('bölgeler', () => {
  it('kapalı sözlük; genel/diğer hiçbir şeyle eşleşmez', () => {
    assert.equal(bolgeIdMi('yuz'), true)
    assert.equal(bolgeIdMi('x'), false)
    assert.equal(ayniBolgeMi('kol-sag', 'kol-sag'), true)
    assert.equal(ayniBolgeMi('kol-sag', 'kol-sol'), false)
    assert.equal(ayniBolgeMi('genel', 'genel'), false)
    assert.equal(ayniBolgeMi(null, 'yuz'), false)
    assert.deepEqual(etiketleriTemizle('x'), [])
  })
})

describe('piksel hattı (tarayıcıdan bağımsız, saf)', () => {
  const kare = (r: number, g: number, b: number) => new Uint8ClampedArray([r, g, b, 255])
  it('sıfır ayar = birebir aynı piksel', () => {
    const v = kare(120, 80, 40)
    tonuUygula(v, { parlaklik: 0, kontrast: 0, pozlama: 0, sicaklik: 0, doygunluk: 0 })
    assert.deepEqual([...v], [120, 80, 40, 255])
  })
  it('parlaklık artırır, azaltır; 0-255 dışına taşmaz', () => {
    const a = kare(100, 100, 100); tonuUygula(a, { parlaklik: 50, kontrast: 0, pozlama: 0, sicaklik: 0, doygunluk: 0 })
    const b = kare(100, 100, 100); tonuUygula(b, { parlaklik: -50, kontrast: 0, pozlama: 0, sicaklik: 0, doygunluk: 0 })
    assert.ok(a[0] > 100 && b[0] < 100)
    const c = kare(250, 250, 250); tonuUygula(c, { parlaklik: 100, kontrast: 100, pozlama: 100, sicaklik: 0, doygunluk: 0 })
    assert.equal(c[0], 255)
  })
  it('pozlama +1 EV (pozlama 50) değeri ~ikiye katlar', () => {
    const v = kare(60, 60, 60); tonuUygula(v, { parlaklik: 0, kontrast: 0, pozlama: 50, sicaklik: 0, doygunluk: 0 })
    assert.ok(Math.abs(v[0] - 120) <= 1)
  })
  it('sıcaklık: + kırmızıyı artırıp maviyi azaltır, yeşile dokunmaz', () => {
    const v = kare(100, 100, 100); tonuUygula(v, { parlaklik: 0, kontrast: 0, pozlama: 0, sicaklik: 100, doygunluk: 0 })
    assert.ok(v[0] > 100 && v[2] < 100 && v[1] === 100)
  })
  it('doygunluk -100 gri üretir', () => {
    const v = kare(200, 50, 50); tonuUygula(v, { parlaklik: 0, kontrast: 0, pozlama: 0, sicaklik: 0, doygunluk: -100 })
    assert.ok(Math.abs(v[0] - v[1]) <= 1 && Math.abs(v[1] - v[2]) <= 1)
  })
  it('kontrast ortayı korur, uçları açar', () => {
    const t = kanalTablolari({ parlaklik: 0, kontrast: 50, pozlama: 0, sicaklik: 0, doygunluk: 0 }).g
    assert.equal(t[128], 128)
    assert.ok(t[200] > 200 && t[50] < 50)
  })
  it('çalışma boyutu: büyük fotoğraf küçülür, küçük olan büyümez', () => {
    assert.deepEqual(calismaBoyutu(6000, 4000), { w: 3072, h: 2048 })
    assert.deepEqual(calismaBoyutu(800, 600), { w: 800, h: 600 })
  })
})
