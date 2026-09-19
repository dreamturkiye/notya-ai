/**
 * MD-TABLO-FIX — hekim ekranda ASLA ham pipe gormemeli.
 *
 * Kaan (2026-09-19), Dr. Gokhan'in canli gorusmesinden: "yazili txt bolumunde birkac kere extra
 * IIIII IIIII gibi yazilar cikti (anlamsiz isaretler)". Tespit: tabloBasiMi, baslik ve ayirici
 * satirlarin HUCRE SAYISI ESIT degilse tabloyu tanimiyordu; bu durumda ham "|---|---|" satiri
 * duz metin olarak basiliyor ve ekranda "IIIII IIIII" gibi gorunuyordu. Model tabloyu kusurlu
 * yazabilir ya da max_tokens tabloyu ortadan kesebilir - ikisi de normaldir.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { tabloBasiMi, tabloOku, ayiriciMi } from './markdownTablo'

test('sutun sayisi tutmayan tablo YINE DE tablo olarak taninir (IIIII regresyonu)', () => {
  // baslik 3 hucre, ayirici 2 hucre - eskiden false donuyordu, ham pipe basiliyordu
  const satirlar = ['| SB | ACOG | Not |', '|---|---|', '| a | b | c |']
  assert.equal(tabloBasiMi(satirlar, 0), true)
  const { tablo } = tabloOku(satirlar, 0)
  assert.deepEqual(tablo.baslik, ['SB', 'ACOG', 'Not'])
  assert.equal(tablo.satirlar.length, 1)
})

test('max_tokens tabloyu kesse bile govde satiri hizalanir, ham pipe kalmaz', () => {
  const satirlar = ['| Ilac | Doz |', '|---|---|', '| Amoksisilin |']
  assert.equal(tabloBasiMi(satirlar, 0), true)
  const { tablo } = tabloOku(satirlar, 0)
  assert.deepEqual(tablo.satirlar[0], ['Amoksisilin', ''])
})

test('yalniz ayiractan ibaret satir ayirici sayilir (duz metin olarak basilmamali)', () => {
  for (const s of ['|---|---|', '| --- | --- |', '|:--|--:|', '|-|-|']) {
    assert.equal(ayiriciMi(s), true, `${s} ayirici sayilmali`)
  }
})

test('gercek metin yanlislikla ayirici sayilmaz', () => {
  for (const s of ['| SB | ACOG |', 'merhaba', '| a |']) {
    assert.equal(ayiriciMi(s), false, `${s} ayirici SAYILMAMALI`)
  }
})

test('ayirici satiri olmayan pipe metni tablo sayilmaz (yanlis pozitif yok)', () => {
  assert.equal(tabloBasiMi(['| bir | iki |', 'duz metin'], 0), false)
})
