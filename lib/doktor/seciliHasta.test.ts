/**
 * SECILI-HASTA-BASLIGI — seçili hasta adı BÜYÜK ve KALIN görünmeli.
 *
 * Kaan (2026-09-19): hasta seçildikten sonra adı yalnız açılır menünün içinde, sayfadaki her
 * şeyle aynı puntoda duruyordu; hekim hangi hastanın dosyasında çalıştığını göremiyordu. Artık
 * seçim yapılınca HastaSecici üstünde "SEÇİLİ HASTA" başlığı + 19px/800 ağırlıkta ad gösterilir.
 *
 * Bu bileşen 27+ aracın hepsinde ortak olduğu için tek yerde kırılırsa hepsi etkilenir — bu
 * yüzden kilit test.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const KAYNAK = readFileSync('lib/doktor/aracUi.tsx', 'utf8')
const SECICI = KAYNAK.slice(KAYNAK.indexOf('export function HastaSecici'))

test('seçili hasta adı büyük ve kalın gösterilir (küçük puntoya düşürülemez)', () => {
  assert.ok(SECICI.includes('SEÇİLİ HASTA'), 'SEÇİLİ HASTA başlığı kaldırılmış')
  assert.match(SECICI, /fontSize: 19[,\s]/, 'ad 19px olmalı — küçültülmüş')
  assert.match(SECICI, /fontWeight: 800/, 'ad 800 ağırlıkta olmalı — inceltilmiş')
})

test('seçili hasta yalnız gerçekten seçim varken gösterilir', () => {
  assert.ok(SECICI.includes('{secili && seciliAd &&'), 'koşul değişmiş: boşken de kutu render edilebilir')
})

test('hekim seçtiği hastayı tek dokunuşla değiştirebilir', () => {
  assert.ok(SECICI.includes('Değiştir'), 'Değiştir düğmesi kaldırılmış')
  assert.ok(SECICI.includes("sec('', '')"), 'Değiştir seçimi temizlemiyor')
})

test('ekran okuyucu seçim değişimini duyurur', () => {
  assert.ok(SECICI.includes('aria-live="polite"'), 'aria-live kaldırılmış')
})
