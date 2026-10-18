import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ozelPromptMetni, ozelSoapMetni } from '@/lib/klinik/ozelPrompt'
import { soapSistemPromptu } from '@/lib/doktor/soapUret'
import { STUDYO_KILIT } from '../ui/sonuc'

describe('klinik-dermatoloji kilit', () => {
  it('system ve soap ayrıdır; SOAP notu kendi başlığını taşır', () => {
    const sistem = ozelPromptMetni('klinik-dermatoloji')
    const soap = ozelSoapMetni('klinik-dermatoloji')
    assert.match(sistem, /Doz yazılmaz/)
    assert.match(sistem, /Tanı kilitlemez/)
    assert.match(soap, /^SOAP — /)
    assert.doesNotMatch(sistem, /^SOAP — /m)
    const not = soapSistemPromptu({ transcript: '', specialty: 'klinik-dermatoloji' })
    assert.match(not, /SOAP — klinik dermatoloji/)
    assert.doesNotMatch(soapSistemPromptu({ transcript: '', specialty: 'dermatoloji' }), /SOAP — klinik dermatoloji/)
    assert.doesNotMatch(soapSistemPromptu({ transcript: '', specialty: 'pediatri' }), /SOAP — klinik dermatoloji/)
    assert.ok(STUDYO_KILIT.length > 20)
  })
})
