import { test } from 'node:test'
import assert from 'node:assert/strict'
import { KESIK_YANIT_NOTU, asistanYanitiCoz } from './yanitCoz'

// KD-DERM-SAFETY-FINDINGS F3 — a long KD chat answer hit max_tokens mid-JSON and the doctor saw the raw ```json text.
const HAM_JSON = /```|\{\s*"speech"|"action"\s*:|"proactiveWarning"\s*:/

test('complete JSON, with fence and preamble', () => {
  const r = asistanYanitiCoz('Tabii Hocam.\n```json\n{"speech": "Anti-D 28. haftada — doz hekim tarafından belirlenir.", "action": null, "proactiveWarning": "IDC tekrar"}\n```', 'end_turn')
  assert.deepEqual(r, { speech: 'Anti-D 28. haftada — doz hekim tarafından belirlenir.', action: null, proactiveWarning: 'IDC tekrar', kesildi: false })
})

test('truncated at max_tokens inside speech: salvaged text + clear Turkish note, no raw JSON, no action', () => {
  const ham = '```json\n{\n  "speech": "Hocam, **antepartum profilaksi**:\\n1. Rh(−) IDC(−) gebede 28. haftada uygulanır.\\n2. Doğum sonrası bebeğin kan grubu Rh(+) ise 72 saat içinde tekrarlanır.\\n3. Sensitizasyon riski yaratan olaylarda (amniyosentez, travma, kanama'
  const r = asistanYanitiCoz(ham, 'max_tokens')
  assert.equal(r.kesildi, true); assert.equal(r.action, null)
  assert.ok(!HAM_JSON.test(r.speech), r.speech)
  assert.ok(r.speech.startsWith('Hocam, **antepartum profilaksi**:\n1. Rh(−)'))
  assert.ok(r.speech.includes('(amniyosentez, travma, kanama…'))
  assert.ok(r.speech.endsWith(KESIK_YANIT_NOTU))
})

test('cut inside an escape sequence or after speech closed but before the object closed', () => {
  for (const ham of ['{"speech": "Satır bir\\', '{"speech": "Değer \\u00', '{"speech": "Tam cümle.", "action": {"type": "ADD_PRESC']) {
    const r = asistanYanitiCoz(ham, 'max_tokens')
    assert.ok(!HAM_JSON.test(r.speech) && !r.speech.includes('\\'), r.speech)
    assert.equal(r.action, null, 'a half-written action never runs'); assert.equal(r.kesildi, true)
  }
})

test('cut before speech has any text: no raw object shown', () => {
  const r = asistanYanitiCoz('```json\n{\n  "act', 'max_tokens')
  assert.ok(!HAM_JSON.test(r.speech) && !r.speech.includes('{')); assert.ok(r.speech.includes(KESIK_YANIT_NOTU))
})

test('plain-text answers (format ignored) are shown as-is, braces in prose are not JSON', () => {
  assert.deepEqual(asistanYanitiCoz('Merhaba Hocam, nasıl yardımcı olabilirim?', 'end_turn'), { speech: 'Merhaba Hocam, nasıl yardımcı olabilirim?', action: null, proactiveWarning: null, kesildi: false })
  assert.equal(asistanYanitiCoz('Formül {kilo} / {boy}² şeklindedir.', 'end_turn').speech, 'Formül {kilo} / {boy}² şeklindedir.')
  const r = asistanYanitiCoz('Uzun düz metin yanıtı burada kesil', 'max_tokens')
  assert.ok(r.kesildi && r.speech.endsWith(KESIK_YANIT_NOTU))
})

test('complete JSON keeps the action', () => {
  const r = asistanYanitiCoz('{"speech": "Ekledim.", "action": {"type": "ADD_NOTE", "data": {"x": 1}}, "proactiveWarning": null}', 'end_turn')
  assert.deepEqual(r.action, { type: 'ADD_NOTE', data: { x: 1 } }); assert.equal(r.proactiveWarning, null)
})

test('chat route and written-chat panel both go through the parser; panel reads data.speech', async () => {
  const fs = await import('node:fs'); const path = await import('node:path')
  const kok = path.join(import.meta.dirname, '..', '..')
  const rota = fs.readFileSync(path.join(kok, 'app/api/asistan/chat/route.ts'), 'utf8')
  assert.ok(rota.includes('asistanYanitiCoz(rawResponse, response.stop_reason)')); assert.ok(!rota.includes('aiData = { speech: rawResponse'))
  const ui = fs.readFileSync(path.join(kok, 'components/asistan/YaziliSohbet.tsx'), 'utf8')
  assert.ok(ui.includes('asistanYanitiCoz(String(veri.speech ||'))
})

test('long answer = short JSON wrapper + markdown after it (the real KD failure shape): content kept, no fence, cut noted', () => {
  const ham = '```json\n{\n  "speech": "Kapsamlı bir konu Hocam — aşağıda derledim.",\n  "action": null,\n  "proactiveWarning": null\n}\n```\n\n---\n\n# Rh Negatif Gebe\n\n| Durum | SB | ACOG |\n|---|---|---|\n| 28. hafta | Anti-D | Anti-D |\n| Postpartum | 72 saat içinde | 72 saat içinde |\n| **Sensitizasyon olayı** | Olay sonrası ≤ 72 saat | Anti-D Ig'
  const r = asistanYanitiCoz(ham, 'max_tokens')
  assert.ok(!HAM_JSON.test(r.speech), r.speech)
  assert.ok(r.speech.startsWith('Kapsamlı bir konu Hocam — aşağıda derledim.\n\n# Rh Negatif Gebe'))
  assert.ok(r.speech.includes('| Postpartum | 72 saat içinde |')); assert.ok(r.speech.endsWith(KESIK_YANIT_NOTU)); assert.equal(r.kesildi, true); assert.equal(r.action, null)
  const tam = asistanYanitiCoz(ham.replace(/\| \*\*Sensitizasyon.*$/, ''), 'end_turn')
  assert.equal(tam.kesildi, false); assert.ok(tam.speech.endsWith('| 72 saat içinde |')); assert.ok(!HAM_JSON.test(tam.speech))
})
