import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fishBirlestir, fishYeniCumleler } from './fishCalar'

test('ilk bitmiş cümle hemen söylenir, yarım cümle bekler, tam metin tekrar söylenmez', () => {
  const a = fishYeniCumleler('', 'Gerçekten kahve içemem', false)
  assert.deepEqual(a.soyle, [])
  const b = fishYeniCumleler(a.islenen, 'Gerçekten kahve içemem. Ama sohbet ederiz', false)
  assert.deepEqual(b.soyle, ['Gerçekten kahve içemem.'])
  const c = fishYeniCumleler(b.islenen, 'Gerçekten kahve içemem. Ama sohbet ederiz.', true)
  assert.deepEqual(c.soyle, ['Ama sohbet ederiz.'])
  const d = fishYeniCumleler(c.islenen, 'Gerçekten kahve içemem. Ama sohbet ederiz.', true)
  assert.deepEqual(d.soyle, [])
})

test('parça gelmeden biten tur tek klip kalır', () => {
  const t = fishYeniCumleler('', 'Bir. İki.', true)
  assert.deepEqual(t.soyle, ['Bir. İki.'])
})

test('delta ya parça ya da biriken metnin tamamıdır', () => {
  assert.equal(fishBirlestir('Gerçekten ', 'kahve'), 'Gerçekten kahve')
  assert.equal(fishBirlestir('Gerçekten kahve', 'Gerçekten kahve içemem.'), 'Gerçekten kahve içemem.')
  assert.equal(fishBirlestir('Gerçekten kahve', 'kahve'), 'Gerçekten kahve')
})

test('caliyorMu yalnız çalan PCM — kuyruktaki TTS fetch dinlemeyi kilitlemez', () => {
  const kaynak = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fishCalar.ts'), 'utf8')
  assert.match(kaynak, /caliyorMu:\s*\(\)\s*=>\s*calisiyor\s*,/)
  assert.doesNotMatch(kaynak, /caliyorMu:\s*\(\)\s*=>\s*calisiyor\s*\|\|/)
})

test('jitter buffer: first source waits for ≈40 ms of PCM, then chunks append back to back, underrun re-buffers', async () => {
  const { tamponKarari, FISH_TAMPON_MS, FISH_TAMPON_YENIDEN_MS } = await import('./fishCalar')
  // before start: below the buffer → hold; at/above → start
  assert.equal(tamponKarari({ bekleyenMs: 20, basladi: false, planSonu: 0, simdi: 0, bitti: false }), false)
  assert.equal(tamponKarari({ bekleyenMs: FISH_TAMPON_MS, basladi: false, planSonu: 0, simdi: 0, bitti: false }), true)
  // stream ended with a short tail: play it regardless
  assert.equal(tamponKarari({ bekleyenMs: 20, basladi: false, planSonu: 0, simdi: 0, bitti: true }), true)
  assert.equal(tamponKarari({ bekleyenMs: 0, basladi: false, planSonu: 0, simdi: 0, bitti: true }), false)
  // started, schedule ahead of the clock: any chunk goes straight on (no inter-sentence gap)
  assert.equal(tamponKarari({ bekleyenMs: 10, basladi: true, planSonu: 5.5, simdi: 5.0, bitti: false }), true)
  // started, clock passed the plan (underrun): wait for the re-buffer amount
  assert.equal(tamponKarari({ bekleyenMs: 30, basladi: true, planSonu: 5.0, simdi: 5.2, bitti: false }), false)
  assert.equal(tamponKarari({ bekleyenMs: FISH_TAMPON_YENIDEN_MS, basladi: true, planSonu: 5.0, simdi: 5.2, bitti: false }), true)
})

test('push source (akisAc): chunks queue like a sentence; kes() marks it cut and later writes are dropped', async () => {
  const { fishCalarOlustur } = await import('./fishCalar')
  const calar = fishCalarOlustur(async () => null, {}, null)
  const y = calar.akisAc()
  assert.equal(y.kesildiMi(), false)
  y.yaz(new Uint8Array([1, 2]))
  calar.kes()
  assert.equal(y.kesildiMi(), true)
  y.yaz(new Uint8Array([3, 4])) // no throw after cut
  y.bitir()
  const z = calar.akisAc()
  z.bitir()
  assert.equal(z.kesildiMi(), false)
  calar.kapat()
})

test('NOTYA-SES-TUR-01: caliyorMu drops at her last voiced sample (+120 ms), not when Fish\'s trailing padding drains', async () => {
  const { sonSesliOrnek, calmaSonu, FISH_SES_SONU_PAYI_SN } = await import('./fishCalar')
  const kanal = new Float32Array(24000) // 1 s
  kanal.fill(0.3, 0, 12000) // voice in the first 500 ms, 500 ms of padding after
  assert.equal(sonSesliOrnek(kanal), 11999)
  assert.equal(sonSesliOrnek(new Float32Array(100)), -1)
  const bitis = 10 + 1
  const sesSonu = 10 + 0.5
  assert.equal(calmaSonu(bitis, sesSonu), 10.5 + FISH_SES_SONU_PAYI_SN)
  assert.equal(calmaSonu(bitis, -1), bitis)
  assert.equal(calmaSonu(10.05, sesSonu), 10.05) // voice runs to the end: buffer end wins
})
