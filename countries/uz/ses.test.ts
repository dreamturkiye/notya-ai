/**
 * Uzbekistan: the pack speaks with eleven_v4 — a cross-lingual Uzbek attempt (Brian/Alice), not a native
 * Uzbek voice. See ses.ts header for why, and for the audio-quality confirmation this is still pending.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sesIstegi } from '@/lib/ulke/uygulama/sesSentez'
import { UZ_KLINIK } from './klinik'
import { UZ_SES } from './ses'

describe('uz speech', () => {
  it('the clinical half speaks with the eleven_v4 cross-lingual attempt, not a native Uzbek voice', () => {
    assert.equal(UZ_KLINIK.ses, UZ_SES)
    assert.deepEqual(UZ_SES.sesler.erkek, { ad: 'Brian', id: 'nPczCjzI2devNBz1zQrb' })
    assert.deepEqual(UZ_SES.sesler.kadin, { ad: 'Alice', id: 'Xb7hH8MSUJpSbSDYk0k2' })
    assert.equal(UZ_SES.model, 'eleven_v4')
    // Deliberately 'uz' now — eleven_v4 is the first model this pack has used that actually lists Uzbek.
    // See ses.ts header for the model that does, and does not, support it.
    assert.equal(UZ_SES.dilKodu, 'uz')
    assert.equal(UZ_SES.yerel, 'uz-Latn-UZ')
    const istek = sesIstegi(UZ_SES, 'Xayrli tong.', 'erkek')
    assert.equal(istek.tamam && istek.adres, 'https://api.elevenlabs.io/v1/text-to-speech/nPczCjzI2devNBz1zQrb')
    assert.equal(istek.tamam && istek.govde.model_id, 'eleven_v4')
    assert.equal(istek.tamam && istek.govde.language_code, 'uz')
  })
})
