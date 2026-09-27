import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hafizaGrupla, tarzCipiMetni, tarzPopoverSatirlari } from './gorunum'
import type { HafizaKayit } from '@/lib/doktor/hafiza'

test('chip ve popover gerçek kuralları listeler', () => {
  const kurallar = [
    { slug: 'terim-a', deger: '"gerektiğinde" yerine "Lüzumlu halde" yaz' },
    { slug: 'silme-b', deger: 'Şu kalıbı nottan çıkar: değerlendirilmedi' },
  ]
  assert.equal(tarzCipiMetni(kurallar.length), 'Sizin tarzınızla yazıldı · 2 kural')
  assert.deepEqual(tarzPopoverSatirlari(kurallar).map((k) => k.slug), ['terim-a', 'silme-b'])
})

test('hafıza sayfası kategoriye göre gruplar', () => {
  const kayitlar: HafizaKayit[] = [
    { kategori: 'klinik', anahtar: 'ilac-a', deger: 'Augmentin yaz', kaynak: 'duzeltme', kanit_sayisi: 3, kesin: true, aktif: true, durum: 'uygulanir' },
    { kategori: 'uslup', anahtar: 'terim-a', deger: 'Lüzumlu halde yaz', kaynak: 'duzeltme', kanit_sayisi: 2, kesin: true, aktif: true, durum: 'uygulanir' },
  ]
  const g = hafizaGrupla(kayitlar)
  assert.equal(g[0].kategori, 'uslup')
  assert.equal(g[1].kategori, 'klinik')
  assert.equal(g[0].kayitlar[0].deger.includes('Lüzumlu'), true)
})
