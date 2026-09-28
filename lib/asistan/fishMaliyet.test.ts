/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 / SADECE-01 — dakika başı maliyet: sentetik kullanım → rakam; oranı olmayan kalem TODO,
 * uydurma yok. Kalemler: Fish ASR + Fish TTS + model (başka satıcı yok). Gecikme özeti.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ASR_GECIKME_SINIRI_MS, DOGRULANMIS_ORANLAR, gecikmeOzeti, maliyetHesapla, maliyetRaporuMetni, type OturumKullanimi } from './fishMaliyet'

const KULLANIM: OturumKullanimi = {
  oturumSaniye: 600,
  asrSaniye: 300,
  asrModel: 'transcribe-1',
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
  // Fish ASR 300 sn = 1/12 saat × 0.36 = 0.03 · Fish TTS 0.02 M bayt × 15 = 0.3 · model (80 000 + 16 000 + 15 000) / 1e6 = 0.111
  assert.equal(r.dakika, 10)
  assert.deepEqual(r.kalemler.map((k) => k.ad), ['fish_asr', 'fish', 'model'], 'başka satıcı kalemi yok')
  assert.equal(r.kalemler.find((k) => k.ad === 'fish_asr')?.usd, 0.03)
  assert.equal(r.kalemler.find((k) => k.ad === 'fish')?.usd, 0.3)
  assert.equal(r.kalemler.find((k) => k.ad === 'model')?.usd, 0.111)
  assert.equal(r.toplamUsd, 0.441)
  assert.equal(r.dakikaBasiUsd, 0.0441)
  assert.equal(r.elevenlabsTabanDakikaUsd, 0.0429)
  assert.deepEqual(r.todo, [])
})

test('oranı olmayan kalem uydurulmaz: toplam null, bilinen ayrı, TODO yazılır', () => {
  const r = maliyetHesapla(KULLANIM)
  assert.equal(r.kalemler.find((k) => k.ad === 'model')?.usd, null)
  assert.match(r.kalemler.find((k) => k.ad === 'model')!.miktar, /40000/)
  assert.equal(r.toplamUsd, null)
  assert.equal(r.dakikaBasiUsd, null)
  assert.equal(r.bilinenUsd, 0.33)
  assert.equal(r.bilinenDakikaBasiUsd, 0.033)
  assert.equal(r.elevenlabsTabanDakikaUsd, null)
  assert.ok(r.todo.some((t) => /Model/.test(t)))
  assert.ok(r.todo.some((t) => /ElevenLabs/.test(t) && /429/.test(t)))
  const metin = maliyetRaporuMetni('00000000-0000-0000-0000-000000000000', KULLANIM, r)
  assert.match(metin, /TODO/)
  assert.doesNotMatch(metin, /NaN|undefined/)
})

test('bilinmeyen Fish TTS / ASR modeli ham kullanımıyla kalır; ücretsiz model 0', () => {
  const r = maliyetHesapla({ ...KULLANIM, fishModel: 'bilinmeyen-model', asrModel: 'bilinmeyen-asr' })
  assert.equal(r.kalemler.find((k) => k.ad === 'fish')?.usd, null)
  assert.equal(r.kalemler.find((k) => k.ad === 'fish_asr')?.usd, null)
  assert.equal(r.todo.filter((t) => /Fish/.test(t)).length, 2)
  const bedava = maliyetHesapla({ ...KULLANIM, fishModel: 's2.1-pro-free' })
  assert.equal(bedava.kalemler.find((k) => k.ad === 'fish')?.usd, 0)
})

test('gecikme özeti: aşama başına n / p50 / p90; ASR adımı 1 sn\'yi aşarsa rapor açıkça uyarır', () => {
  const satir = (olcu: string, ...d: number[]) => d.map((miktar) => ({ olcu, miktar }))
  const g = gecikmeOzeti([...satir('toplam_ms', 2400, 1900, 3100, 2000), ...satir('dinle_ms', 1300, 1100, 1250, 900), ...satir('soz_sonu_ms', 500, 520)])
  assert.deepEqual(g.map((x) => x.olcu), ['soz_sonu_ms', 'dinle_ms', 'toplam_ms'], 'boru hattı sırası')
  assert.deepEqual(g.find((x) => x.olcu === 'toplam_ms'), { olcu: 'toplam_ms', n: 4, p50: 2000, p90: 3100, enCok: 3100 })
  const metin = maliyetRaporuMetni('00000000-0000-0000-0000-000000000000', KULLANIM, maliyetHesapla(KULLANIM), { gecikme: g })
  assert.match(metin, /Tur gecikmesi/)
  assert.match(metin, new RegExp(`UYARI.*${ASR_GECIKME_SINIRI_MS}`))
  const hizli = maliyetRaporuMetni('x', KULLANIM, maliyetHesapla(KULLANIM), { gecikme: gecikmeOzeti(satir('dinle_ms', 400, 600)) })
  assert.doesNotMatch(hizli, /UYARI/)
})
