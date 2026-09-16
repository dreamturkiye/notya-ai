import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rrsMetni, RRS_ADIMLARI, RRS_URL } from './rrs'

const satirlar = [
  { ilacAdi: 'Xanax 0.5 mg', etkenMadde: 'Alprazolam', dozMetni: '0.5 mg tablet', kullanimOzeti: '1x1, gece', kutu: 1 },
  { ilacAdi: 'Contramal', etkenMadde: 'Tramadol HCl', dozMetni: '50 mg kapsül', kullanimOzeti: '2x1', kutu: 2 },
]

test('rrsMetni: başlık, alan sırası, numaralama, adet', () => {
  const m = rrsMetni({ renk: 'yesil', hastaAd: 'Ali Veli', tarih: '2026-09-16T10:00:00Z', tanilar: ['F41.1'], satirlar })
  assert.match(m, /^REÇETEM \(RENKLİ REÇETE\) — YEŞİL REÇETE/)
  assert.match(m, /Hasta: Ali Veli/)
  assert.match(m, /Tarih: 16\.09\.2026/)
  assert.match(m, /Tanı \(ICD-10\): F41\.1/)
  assert.match(m, /1\) İlaç: Xanax 0\.5 mg — Etken madde: Alprazolam/)
  assert.match(m, /2\) İlaç: Contramal/)
  assert.match(m, /Adet: 2 kutu/)
  assert.match(m, /Kullanım: 2x1/)
})

test('rrsMetni: TC asla yer almaz, kutu en az 1', () => {
  const m = rrsMetni({ renk: 'kirmizi', hastaAd: 'X', tarih: 'bozuk', tanilar: [], satirlar: [{ ...satirlar[0], kutu: 0 }] })
  assert.doesNotMatch(m, /\b\d{11}\b/)
  assert.match(m, /TC kimlik no Reçetem'de girilir/)
  assert.match(m, /Adet: 1 kutu/)
  assert.match(m, /KIRMIZI REÇETE/)
})

test('adımlar ve adres', () => {
  assert.equal(RRS_ADIMLARI.length, 4)
  assert.match(RRS_URL, /^https:\/\/recetem\.enabiz\.gov\.tr/)
})
