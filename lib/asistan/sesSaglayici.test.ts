/**
 * NOTYA-SES-ELEVEN-GERI-01 — Ayşe's voice provider switch and her pinned ElevenLabs voice.
 *
 * (1) AYSE_SES_SAGLAYICI: ElevenLabs unless the variable says exactly `fish`; Fish also needs the key on the server;
 *     no other persona is ever Fish. (2) The page and the server read the same value (next.config inlines it).
 * (3) Ayşe's ElevenLabs voice id and TTS settings, as at f247ea1b (the merge point before the Fish changeover):
 *     a change here is a voice change Dr. Gökhan has to hear first.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { AYSE_SES_VARSAYILAN, ayseFishIstemcideMi, ayseSesSaglayici } from './sesSaglayici'
import { ayseFishTamMi } from './fishSes'
import { DOKTOR_VOICE_BY_PERSONA, TR_VOICES, voiceIdForDoktorPersona } from './elevenVoices'
import { SES_MODEL_ID, SES_TTS_KILIT, ttsKilitGerekli } from './sesMotoru'
import { AYSE_TTS_SETTINGS } from '@/lib/dr-ayse/tts'
import { SES_CALAR } from './sesCalar'
import { PERSONAS, getPersona } from './personaEngine'

/** Values read from lib/asistan/elevenVoices.ts and lib/asistan/sesMotoru.ts at f247ea1b. */
const AYSE_ELEVEN_SES_ID = 'ir8YO3t6kXwbDO3roXIT'
const AYSE_TTS_F247 = {
  model_id: 'eleven_flash_v2_5',
  expressive_mode: false,
  speed: 1,
  stability: 0.55,
  similarity_boost: 0.75,
  optimize_streaming_latency: 1,
  suggested_audio_tags: [],
}

test('sağlayıcı: değişken yoksa ya da fish değilse ElevenLabs', () => {
  assert.equal(AYSE_SES_VARSAYILAN, 'elevenlabs')
  for (const d of [undefined, null, '', '  ', 'elevenlabs', 'ElevenLabs', 'fish-audio', 'balik', '1', 'true']) {
    assert.equal(ayseSesSaglayici(d), 'elevenlabs', String(d))
  }
  for (const d of ['fish', 'FISH', ' Fish ']) assert.equal(ayseSesSaglayici(d), 'fish', d)
})

test('sağlayıcı: ortamdaki değişken okunur, boşken varsayılan', () => {
  const eski = process.env.AYSE_SES_SAGLAYICI
  try {
    delete process.env.AYSE_SES_SAGLAYICI
    assert.equal(ayseSesSaglayici(), 'elevenlabs')
    assert.equal(ayseFishIstemcideMi('aysekaya'), false, 'varsayılanda sayfa Fish yolunu açmaz')
    assert.equal(ayseFishTamMi('aysekaya', 'anahtar'), false, 'Fish anahtarı tek başına Ayşe’yi Fish yapmaz')
    process.env.AYSE_SES_SAGLAYICI = 'fish'
    assert.equal(ayseSesSaglayici(), 'fish')
    assert.equal(ayseFishIstemcideMi('aysekaya'), true)
    assert.equal(ayseFishTamMi('aysekaya', 'anahtar'), true)
    assert.equal(ayseFishTamMi('aysekaya', ''), false, 'anahtarsız Fish yok — ElevenLabs')
  } finally {
    if (eski === undefined) delete process.env.AYSE_SES_SAGLAYICI
    else process.env.AYSE_SES_SAGLAYICI = eski
  }
})

test('sağlayıcı: Fish yalnız Ayşe Kaya için, bayrak VE anahtarla; diğer 29 uzman asla', () => {
  assert.equal(ayseFishTamMi('aysekaya', 'anahtar', 'fish'), true)
  assert.equal(ayseFishTamMi('aysekaya', 'anahtar', 'elevenlabs'), false)
  assert.equal(ayseFishTamMi('aysekaya', 'anahtar', undefined), false)
  assert.equal(ayseFishTamMi('aysekaya', '  ', 'fish'), false)
  const digerleri = Object.keys(PERSONAS).filter((id) => id !== 'aysekaya')
  assert.ok(digerleri.length >= 29, `persona sayısı ${digerleri.length}`)
  for (const id of [...digerleri, '', null, undefined, 'AYSEKAYA']) {
    assert.equal(ayseFishTamMi(id, 'anahtar', 'fish'), false, String(id))
    assert.equal(ayseFishIstemcideMi(id, 'fish'), false, String(id))
  }
})

test('istemci seçimi: sayfa ve sunucu aynı değeri okur (next.config derlemede gömer)', () => {
  const kok = path.join(import.meta.dirname, '..', '..')
  const ayar = fs.readFileSync(path.join(kok, 'next.config.mjs'), 'utf8')
  assert.match(ayar, /AYSE_SES_SAGLAYICI:\s*process\.env\.AYSE_SES_SAGLAYICI/, 'tek değişken: sayfa da okur')
  const kaynak = fs.readFileSync(path.join(kok, 'lib/asistan/sesSaglayici.ts'), 'utf8')
  assert.doesNotMatch(kaynak, /^import /m, 'istemci paketine giren dosya sunucu modülü çekmez')
  assert.equal(ayseFishIstemcideMi('aysekaya', undefined), false)
  assert.equal(ayseFishIstemcideMi('aysekaya', 'fish'), true)
})

test('Ayşe’nin ElevenLabs sesi f247ea1b ile aynı (ses kimliği)', () => {
  assert.equal(TR_VOICES.ayseHanim.voiceId, AYSE_ELEVEN_SES_ID)
  assert.equal(DOKTOR_VOICE_BY_PERSONA.aysekaya.voiceId, AYSE_ELEVEN_SES_ID)
  assert.equal(voiceIdForDoktorPersona('aysekaya'), AYSE_ELEVEN_SES_ID)
  assert.equal(getPersona('aysekaya').voiceId, AYSE_ELEVEN_SES_ID, 'imzalı adres cevabındaki voice_id')
  assert.equal(PERSONAS.aysekaya.voiceId, AYSE_ELEVEN_SES_ID, 'sayfanın tts.voiceId override’ı')
})

test('Ayşe’nin ElevenLabs TTS ayarı f247ea1b ile aynı (Flash kilidi, sabit hız)', () => {
  assert.equal(SES_MODEL_ID, 'eleven_flash_v2_5')
  assert.deepEqual({ ...SES_TTS_KILIT }, AYSE_TTS_F247)
  assert.equal(AYSE_TTS_SETTINGS.stability, 0.55)
  assert.equal(AYSE_TTS_SETTINGS.similarity_boost, 0.75)
  assert.equal(AYSE_TTS_SETTINGS.style, 0)
  assert.equal(AYSE_TTS_SETTINGS.speed, 1)
  assert.equal(AYSE_TTS_SETTINGS.optimize_streaming_latency, 1)
  assert.equal(ttsKilitGerekli({ ...AYSE_TTS_F247 }), false, 'kilitli ajan yeniden yazılmaz')
  assert.deepEqual({ ...SES_CALAR.workletPaths }, { audioConcatProcessor: '/ses/ses-calar-islemcisi.js' }, 'hızı değiştiremeyen oynatıcı')
  assert.equal(SES_CALAR.libsampleratePath, '/ses/ornekleyici-kopru.js')
})
