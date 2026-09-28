/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 — dakika başı maliyet: sentetik kullanım → rakam; oranı olmayan kalem TODO, uydurma yok.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DOGRULANMIS_ORANLAR, maliyetHesapla, maliyetRaporuMetni, type OturumKullanimi } from './fishMaliyet'

const KULLANIM: OturumKullanimi = {
  oturumSaniye: 600,
  deepgramSesSaniye: 300,
  fishBayt: 20_000,
  fishModel: 's2.1-pro',
  model: { cagri: 8, input: 40_000, output: 2_000, cacheRead: 30_000, cacheCreation: 0 },
}

test('bütün oranlar varken dakika başı rakam çıkar', () => {
  const r = maliyetHesapla(KULLANIM, {
    ...DOGRULANMIS_ORANLAR,
    modelMilyonToken: { input: 2, output: 8, cacheRead: 0.5, cacheCreation: 2.5, kaynak: 'sentetik' },
    elevenlabsKredi: { usd: 0.0001, kaynak: 'sentetik' },
  })
  // Deepgram 5 dk × 0.0048 = 0.024 · Fish 0.02 M bayt × 15 = 0.3 · model (80 000 + 16 000 + 15 000) / 1e6 = 0.111
  assert.equal(r.dakika, 10)
  assert.equal(r.kalemler.find((k) => k.ad === 'deepgram')?.usd, 0.024)
  assert.equal(r.kalemler.find((k) => k.ad === 'fish')?.usd, 0.3)
  assert.equal(r.kalemler.find((k) => k.ad === 'model')?.usd, 0.111)
  assert.equal(r.toplamUsd, 0.435)
  assert.equal(r.dakikaBasiUsd, 0.0435)
  assert.equal(r.elevenlabsTabanDakikaUsd, 0.0429)
  assert.deepEqual(r.todo, [])
})

test('oranı olmayan kalem uydurulmaz: toplam null, bilinen ayrı, TODO yazılır', () => {
  const r = maliyetHesapla(KULLANIM)
  assert.equal(r.kalemler.find((k) => k.ad === 'model')?.usd, null)
  assert.match(r.kalemler.find((k) => k.ad === 'model')!.miktar, /40000/)
  assert.equal(r.toplamUsd, null)
  assert.equal(r.dakikaBasiUsd, null)
  assert.equal(r.bilinenUsd, 0.324)
  assert.equal(r.bilinenDakikaBasiUsd, 0.0324)
  assert.equal(r.elevenlabsTabanDakikaUsd, null)
  assert.ok(r.todo.some((t) => /Model/.test(t)))
  assert.ok(r.todo.some((t) => /ElevenLabs/.test(t) && /429/.test(t)))
  const metin = maliyetRaporuMetni('00000000-0000-0000-0000-000000000000', KULLANIM, r)
  assert.match(metin, /TODO/)
  assert.doesNotMatch(metin, /NaN|undefined/)
})

test('bilinmeyen Fish modeli ve eksik Deepgram oranı ham kullanımıyla kalır; ücretsiz model 0', () => {
  const r = maliyetHesapla({ ...KULLANIM, fishModel: 'bilinmeyen-model' }, { ...DOGRULANMIS_ORANLAR, deepgramDakika: null })
  assert.equal(r.kalemler.find((k) => k.ad === 'fish')?.usd, null)
  assert.equal(r.kalemler.find((k) => k.ad === 'deepgram')?.usd, null)
  assert.equal(r.todo.filter((t) => /Fish|Deepgram/.test(t)).length, 2)
  const bedava = maliyetHesapla({ ...KULLANIM, fishModel: 's2.1-pro-free' })
  assert.equal(bedava.kalemler.find((k) => k.ad === 'fish')?.usd, 0)
})
