/** United Kingdom: the pack speaks with Daniel and Alice, Flash v2.5, English. */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sesIstegi } from '@/lib/ulke/uygulama/sesSentez'
import { GB_KLINIK } from './klinik'
import { GB_SES } from './ses'

describe('gb speech', () => {
  it('the clinical half speaks with the United Kingdom voices', () => {
    assert.equal(GB_KLINIK.ses, GB_SES)
    assert.deepEqual(GB_SES.sesler.erkek, { ad: 'Daniel', id: 'onwK4e9ZLuTAKqWW03F9' })
    assert.deepEqual(GB_SES.sesler.kadin, { ad: 'Alice', id: 'Xb7hH8MSUJpSbSDYk0k2' })
    assert.equal(GB_SES.model, 'eleven_flash_v2_5')
    assert.equal(GB_SES.dilKodu, 'en')
    assert.equal(GB_SES.yerel, 'en-GB')
    const istek = sesIstegi(GB_SES, 'Good morning.', 'erkek')
    assert.equal(istek.tamam && istek.adres, 'https://api.elevenlabs.io/v1/text-to-speech/onwK4e9ZLuTAKqWW03F9')
  })
})
