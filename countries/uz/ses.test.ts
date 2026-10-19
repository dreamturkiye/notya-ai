/**
 * Uzbekistan: the pack speaks with a RUSSIAN FALLBACK pair (Nikolay/Elena), Flash v2.5 — not native Uzbek.
 * See ses.ts header for why: eleven_flash_v2_5 does not support Uzbek as a TTS language at all.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sesIstegi } from '@/lib/ulke/uygulama/sesSentez'
import { UZ_KLINIK } from './klinik'
import { UZ_SES } from './ses'

describe('uz speech', () => {
  it('the clinical half speaks with the Russian fallback voices, not native Uzbek', () => {
    assert.equal(UZ_KLINIK.ses, UZ_SES)
    assert.deepEqual(UZ_SES.sesler.erkek, { ad: 'Nikolay', id: '3EuKHIEZbSzrHGNmdYsx' })
    assert.deepEqual(UZ_SES.sesler.kadin, { ad: 'Elena', id: '8oyYKsAD3g8uVOXOQB4Z' })
    assert.equal(UZ_SES.model, 'eleven_flash_v2_5')
    // Deliberately 'ru', not 'uz' — see ses.ts header. This is the one assertion that would catch someone
    // "fixing" this file back to a fabricated Uzbek language code.
    assert.equal(UZ_SES.dilKodu, 'ru')
    assert.equal(UZ_SES.yerel, 'ru-UZ')
    const istek = sesIstegi(UZ_SES, 'Доброе утро.', 'erkek')
    assert.equal(istek.tamam && istek.adres, 'https://api.elevenlabs.io/v1/text-to-speech/3EuKHIEZbSzrHGNmdYsx')
  })
})
