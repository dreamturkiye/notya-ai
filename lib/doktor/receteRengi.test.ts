import { test } from 'node:test'
import assert from 'node:assert/strict'
import { receteRengi, receteGruplari, belirsizKontrol } from './receteRengi'

test('kırmızı: uyuşturucu maddeler', () => {
  assert.equal(receteRengi('Morfin sülfat'), 'kirmizi')
  assert.equal(receteRengi('Fentanil'), 'kirmizi')
  assert.equal(receteRengi('Metilfenidat HCl', 'Concerta 36 mg'), 'kirmizi')
  assert.equal(receteRengi('', 'Oksikodon 10 mg tablet'), 'kirmizi')
})

test('yeşil: psikotrop maddeler, Türkçe karakter ve büyük harf toleransı', () => {
  assert.equal(receteRengi('ALPRAZOLAM'), 'yesil')
  assert.equal(receteRengi('Tramadol HCl'), 'yesil')
  assert.equal(receteRengi('Parasetamol + Tramadol'), 'yesil')
  assert.equal(receteRengi('Pregabalin'), 'yesil')
  assert.equal(receteRengi('Zolpidem tartarat'), 'yesil')
})

test('normal: benzer isimler yanlış yakalanmaz', () => {
  assert.equal(receteRengi('Apomorfin'), 'normal') // Parkinson — morfin değil
  assert.equal(receteRengi('Amoksisilin + klavulanik asit'), 'normal')
  assert.equal(receteRengi('Parasetamol'), 'normal')
  assert.equal(receteRengi('İbuprofen'), 'normal')
})

test('belirsiz: yalnız ekran notu', () => {
  assert.equal(belirsizKontrol('Parasetamol + Kodein'), 'kodein')
  assert.equal(belirsizKontrol('Parasetamol'), null)
  assert.equal(receteRengi('Parasetamol + Kodein'), 'normal') // sayfa ayrılmaz
})

test('gruplama: sıra normal → yeşil → kırmızı, orijinal indeks korunur, boş grup yok', () => {
  const rows = [
    { ilacAdi: 'Xanax', etkenMadde: 'Alprazolam' },
    { ilacAdi: 'Augmentin', etkenMadde: 'Amoksisilin' },
    { ilacAdi: 'Contramal', etkenMadde: 'Tramadol' },
    { ilacAdi: 'MST', etkenMadde: 'Morfin' },
  ]
  const g = receteGruplari(rows)
  assert.deepEqual(g.map((x) => x.renk), ['normal', 'yesil', 'kirmizi'])
  assert.deepEqual(g[0].satirlar.map((x) => x.i), [1])
  assert.deepEqual(g[1].satirlar.map((x) => x.i), [0, 2])
  assert.deepEqual(g[2].satirlar.map((x) => x.i), [3])
  assert.deepEqual(receteGruplari([]).map((x) => x.renk), ['normal'])
})
