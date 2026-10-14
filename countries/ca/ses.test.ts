/** Canada: the pack speaks with Darren and Danielle, Flash v2.5, English. */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sesIstegi } from '@/lib/ulke/uygulama/sesSentez'
import { CA_KLINIK } from './klinik'
import { CA_SES } from './ses'

describe('ca speech', () => {
  it('the clinical half speaks with the Canadian voices', () => {
    assert.equal(CA_KLINIK.ses, CA_SES)
    assert.deepEqual(CA_SES.sesler.erkek, { ad: 'Darren', id: 'pExXCSeVFtFLETPgZoWn' })
    assert.deepEqual(CA_SES.sesler.kadin, { ad: 'Danielle', id: 'FVQMzxJGPUBtfz1Azdoy' })
    assert.equal(CA_SES.model, 'eleven_flash_v2_5')
    assert.equal(CA_SES.dilKodu, 'en')
    assert.equal(CA_SES.yerel, 'en-CA')
    const istek = sesIstegi(CA_SES, 'Good morning.', 'erkek')
    assert.equal(istek.tamam && istek.adres, 'https://api.elevenlabs.io/v1/text-to-speech/pExXCSeVFtFLETPgZoWn')
  })
})