/** United States: the pack speaks with Brian and Jessica, Flash v2.5, English. */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sesIstegi } from '@/lib/ulke/uygulama/sesSentez'
import { US_KLINIK } from './klinik'
import { US_SES } from './ses'

describe('us speech', () => {
  it('the clinical half speaks with the United States voices', () => {
    assert.equal(US_KLINIK.ses, US_SES)
    assert.deepEqual(US_SES.sesler.erkek, { ad: 'Brian', id: 'nPczCjzI2devNBz1zQrb' })
    assert.deepEqual(US_SES.sesler.kadin, { ad: 'Jessica', id: 'cgSgspJ2msm6clMCkdW9' })
    assert.equal(US_SES.model, 'eleven_flash_v2_5')
    assert.equal(US_SES.dilKodu, 'en')
    assert.equal(US_SES.yerel, 'en-US')
    const istek = sesIstegi(US_SES, 'Good morning.', 'erkek')
    assert.equal(istek.tamam && istek.adres, 'https://api.elevenlabs.io/v1/text-to-speech/nPczCjzI2devNBz1zQrb')
  })
})
