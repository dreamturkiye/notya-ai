import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TR_VOICES, AVUKAT_VOICE_BY_PERSONA, voiceIdForMali } from './elevenVoices'
import { PERSONAS } from './personaEngine'
import { KlinikUzmanPersonas } from '../ai/personas/klinik_uzmanlar'

// 2026-09-17 (Kaan): Fatma Çelik sesli asistanı "Voices with live moderation enabled cannot be used
// for agents" ile açılmadı. Bu sesler ElevenLabs'te sahibi tarafından live moderation'a kilitli —
// agent oturumu 1008 ile kapanıyor (canlı doğrulandı). Asıl API kontrolü:
//   npx tsx scripts/elevenlabs-ses-denetimi.ts --canli
const LIVE_MODERATION_SESLER: Record<string, string> = {
  HZh2tWL1clJO95e2qMt2: 'Aslı',
  LIayCu3NIwyEyDw2fhqs: 'Bahadır',
  '6U25IshsKGd7nVhRbPOT': 'Halil Aykut',
}

test('hiçbir TR_VOICES girdisi live moderation açık bir sese işaret etmez', () => {
  for (const [k, v] of Object.entries(TR_VOICES)) {
    assert.ok(!(v.voiceId in LIVE_MODERATION_SESLER), `${k} → ${LIVE_MODERATION_SESLER[v.voiceId]}`)
  }
})

test('doktor, avukat, mali ve klinik personaları agent-uyumlu seslerde', () => {
  const kullanilan = [
    ...Object.values(PERSONAS).map((p) => [p.id, p.voiceId]),
    ...Object.entries(AVUKAT_VOICE_BY_PERSONA).map(([k, v]) => [`avukat:${k}`, v.voiceId]),
    ['mali', voiceIdForMali()],
    ...Object.entries(KlinikUzmanPersonas).map(([k, p]) => [`klinik:${k}`, p.voiceId]),
  ]
  for (const [kim, voiceId] of kullanilan) {
    assert.ok(!(voiceId in LIVE_MODERATION_SESLER), `${kim} → ${LIVE_MODERATION_SESLER[voiceId]}`)
  }
  assert.equal(PERSONAS.fatmacelik.voiceId, TR_VOICES.gunnurDilek.voiceId)
})

test('avukat kadrosunda iki persona aynı sesi paylaşmaz', () => {
  const ids = Object.values(AVUKAT_VOICE_BY_PERSONA).map((v) => v.voiceId)
  assert.equal(new Set(ids).size, ids.length)
})
