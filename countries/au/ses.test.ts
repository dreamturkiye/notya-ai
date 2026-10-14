/** Australia: the pack speaks with Charlie and Clara, Flash v2.5, English. */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sesIstegi } from '@/lib/ulke/uygulama/sesSentez'
import { AU_KLINIK } from './klinik'
import { AU_SES } from './ses'

describe('au speech', () => {
  it('the clinical half speaks with the Australian voices', () => {
    assert.equal(AU_KLINIK.ses, AU_SES)
    assert.deepEqual(AU_SES.sesler.erkek, { ad: 'Charlie', id: 'IKne3meq5aSn9XLyUdCD' })
    assert.deepEqual(AU_SES.sesler.kadin, { ad: 'Clara', id: 'tyepWYJJwJM9TTFIg5U7' })
    assert.equal(AU_SES.model, 'eleven_flash_v2_5')
    assert.equal(AU_SES.dilKodu, 'en')
    assert.equal(AU_SES.yerel, 'en-AU')
    const istek = sesIstegi(AU_SES, 'Good morning.', 'kadin')
    assert.equal(istek.tamam && istek.adres, 'https://api.elevenlabs.io/v1/text-to-speech/tyepWYJJwJM9TTFIg5U7')
  })
})
