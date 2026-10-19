/** New Zealand: the pack speaks with Harry and Kylee, Flash v2.5, English. */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sesIstegi } from '@/lib/ulke/uygulama/sesSentez'
import { NZ_KLINIK } from './klinik'
import { NZ_SES } from './ses'

describe('nz speech', () => {
  it('the clinical half speaks with the New Zealand voices', () => {
    assert.equal(NZ_KLINIK.ses, NZ_SES)
    assert.deepEqual(NZ_SES.sesler.erkek, { ad: 'Harry', id: '4sEMFD9vANmoOjtPLvW8' })
    assert.deepEqual(NZ_SES.sesler.kadin, { ad: 'Kylee', id: 'pcKdPWtbF6bM9o7NHjCI' })
    assert.equal(NZ_SES.model, 'eleven_flash_v2_5')
    assert.equal(NZ_SES.dilKodu, 'en')
    assert.equal(NZ_SES.yerel, 'en-NZ')
    const istek = sesIstegi(NZ_SES, 'Good morning.', 'kadin')
    assert.equal(istek.tamam && istek.adres, 'https://api.elevenlabs.io/v1/text-to-speech/pcKdPWtbF6bM9o7NHjCI')
  })
})
