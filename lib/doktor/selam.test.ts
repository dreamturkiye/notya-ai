import { test } from 'node:test'
import assert from 'node:assert/strict'
import { selamla, yerelSaat, saatDizesi, saatDilimiGecerliMi } from './selam'
import { gunKickerTRT } from './chromeTheme'

test('NOTYA-SELAM-SAAT-01: tek bant, kenarlar', () => {
  assert.equal(selamla(4), 'İyi geceler'); assert.equal(selamla(5), 'Günaydın'); assert.equal(selamla(10), 'Günaydın')
  assert.equal(selamla(11), 'İyi günler'); assert.equal(selamla(17), 'İyi günler'); assert.equal(selamla(18), 'İyi akşamlar')
  assert.equal(selamla(22), 'İyi akşamlar'); assert.equal(selamla(23), 'İyi geceler'); assert.equal(selamla(0), 'İyi geceler')
})
test('NOTYA-SELAM-SAAT-01: aynı an, İstanbul akşam / Baltimore öğleden sonra — üst ve alt aynı bant', () => {
  const an = new Date('2026-09-27T18:30:00Z')
  assert.equal(yerelSaat(an, 'Europe/Istanbul'), 21); assert.equal(yerelSaat(an, 'America/New_York'), 14)
  assert.equal(gunKickerTRT(an, 'Europe/Istanbul'), 'İyi akşamlar'); assert.equal(selamla(yerelSaat(an, 'Europe/Istanbul')), 'İyi akşamlar')
  assert.equal(gunKickerTRT(an, 'America/New_York'), 'İyi günler'); assert.equal(selamla(yerelSaat(an, 'America/New_York')), 'İyi günler')
  assert.equal(saatDizesi(an, 'America/New_York'), '14:30')
  // 01:30 TRT (İyi geceler) = 18:30 NY (İyi akşamlar) — eski kod bu durumda üstte geceler, altta günaydın diyordu
  const gece = new Date('2026-09-27T22:30:00Z')
  assert.equal(gunKickerTRT(gece, 'Europe/Istanbul'), 'İyi geceler'); assert.equal(gunKickerTRT(gece, 'America/New_York'), 'İyi akşamlar')
})
test('NOTYA-SELAM-SAAT-01: geçersiz dilim TRT\'ye düşer', () => {
  assert.equal(saatDilimiGecerliMi('Mars/Olympus'), false); assert.equal(saatDilimiGecerliMi('America/New_York'), true)
  assert.equal(yerelSaat(new Date('2026-09-27T18:30:00Z'), 'x;y'), 21)
})
