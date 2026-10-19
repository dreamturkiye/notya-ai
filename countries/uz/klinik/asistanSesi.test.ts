/**
 * NOTYA-ASISTAN-PERSONA-SES-01 — asistanSesi.ts copies ElevenLabs voice ids as literal strings instead of
 * importing TR_VOICES (lib/asistan/elevenVoices.ts) — see that file's header for why (Turkish-text leak into
 * the always-loaded Uzbekistan pack entry point). This test is the guard that the copies stay equal to the
 * real catalogue: it reads elevenVoices.ts as TEXT (never imports it, so this test file itself does not put
 * Turkish text back on an import path), the same technique ./asistanAdlari.test.ts already uses
 * (`turkUnvanlari()`) to compare against a TR file without importing it.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { UZ_ASISTAN_ADLARI } from './asistanAdlari'
import { UZ_ASISTAN_SESLERI } from './asistanSesi'

const KOK = resolve(__dirname, '../../..')

/** TR_VOICES[key].voiceId, read as text from lib/asistan/elevenVoices.ts — never imported. */
function trVoiceIdsGercek(): Map<string, string> {
  const kaynak = readFileSync(join(KOK, 'lib/asistan/elevenVoices.ts'), 'utf8')
  const sonuc = new Map<string, string>()
  for (const m of kaynak.matchAll(/^\s{2}(\w+): \{\s*\n(?:\s*\/\/[^\n]*\n)?\s*voiceId: '([^']+)'/gm)) sonuc.set(m[1], m[2])
  return sonuc
}

test('asistanSesi.ts does not import TR_VOICES — only literal id strings', () => {
  const kaynak = readFileSync(join(__dirname, 'asistanSesi.ts'), 'utf8')
  assert.doesNotMatch(kaynak, /from '@\/lib\/asistan\/elevenVoices'/, 'importing TR_VOICES here leaks Turkish label text into the always-loaded uz pack entry point')
})

test('every literal voice id in asistanSesi.ts matches the real TR_VOICES catalogue — none invented', () => {
  const gercek = trVoiceIdsGercek()
  const KOPYALANAN: Readonly<Record<string, string>> = {
    gulrizElif: '7i5J4Bl0THYWdNcoKRl6', gunnurDilek: '58oUR7g9xaf9pbxNCyws', pinarZeynep: 'TLSC2qq8RlDdm7tETUHz',
    tugbaSelin: 'D6QpOJ61ltQ3whot6iJZ', asli: '58oUR7g9xaf9pbxNCyws', leyla: 'ir8YO3t6kXwbDO3roXIT',
    ece: '5MSp7yE6sGgawegWrMgt', ayseHanim: 'ir8YO3t6kXwbDO3roXIT', abdulkadir: 'pGMp7Agf4sG0hyhiiGiw',
    ertanHaluk: 'goDh3UOD7uY8nX9JmLnv', gokhan: 'aF3NZfADeIc6RJO5v5Ia', serhat: 'vhKOmda0rMxo3o60S4G5',
    bahadir: 'pGMp7Agf4sG0hyhiiGiw', eyup: 'YRAJxpPvdBUTgvjBUHlB', halil: 'YRAJxpPvdBUTgvjBUHlB',
  }
  for (const [anahtar, id] of Object.entries(KOPYALANAN)) {
    assert.ok(gercek.has(anahtar), `TR_VOICES.${anahtar} not found in elevenVoices.ts any more — asistanSesi.ts's copy is stale`)
    assert.equal(id, gercek.get(anahtar), `TR_VOICES.${anahtar}.voiceId changed in elevenVoices.ts — asistanSesi.ts's copy (${id}) is stale`)
  }
})

test('UZ_ASISTAN_SESLERI.bransaGore covers all 30 Doktor branşlar, every voiceId is one of the copied ids, none null', () => {
  const dogruIdler = new Set(Object.values({
    gulrizElif: '7i5J4Bl0THYWdNcoKRl6', gunnurDilek: '58oUR7g9xaf9pbxNCyws', pinarZeynep: 'TLSC2qq8RlDdm7tETUHz',
    tugbaSelin: 'D6QpOJ61ltQ3whot6iJZ', asli: '58oUR7g9xaf9pbxNCyws', leyla: 'ir8YO3t6kXwbDO3roXIT',
    ece: '5MSp7yE6sGgawegWrMgt', ayseHanim: 'ir8YO3t6kXwbDO3roXIT', abdulkadir: 'pGMp7Agf4sG0hyhiiGiw',
    ertanHaluk: 'goDh3UOD7uY8nX9JmLnv', gokhan: 'aF3NZfADeIc6RJO5v5Ia', serhat: 'vhKOmda0rMxo3o60S4G5',
    bahadir: 'pGMp7Agf4sG0hyhiiGiw', eyup: 'YRAJxpPvdBUTgvjBUHlB', halil: 'YRAJxpPvdBUTgvjBUHlB',
  }))
  const doktorAnahtarlari = UZ_ASISTAN_ADLARI.filter((a) => a.taraf === 'doktor').map((a) => a.bransAnahtari)
  assert.equal(doktorAnahtarlari.length, 30)
  const bransaGore = UZ_ASISTAN_SESLERI.bransaGore ?? {}
  for (const anahtar of doktorAnahtarlari) {
    const girdi = bransaGore[anahtar]
    assert.ok(girdi, `${anahtar}: no entry in UZ_ASISTAN_SESLERI.bransaGore`)
    assert.ok(girdi!.voiceId, `${anahtar}: voiceId is null`)
    assert.ok(dogruIdler.has(girdi!.voiceId!), `${anahtar}: "${girdi!.voiceId}" is not one of the copied TR voice ids`)
  }
})
