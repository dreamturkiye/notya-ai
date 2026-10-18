import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ozelPromptMetni, ozelSoapMetni } from '@/lib/klinik/ozelPrompt'
import { soapSistemPromptu } from '@/lib/doktor/soapUret'
import { STUDYO_KILIT } from '../ui/sonuc'

describe('odyoloji kilit', () => {
  it('system ve soap ayrıdır; SOAP notu kendi başlığını taşır', () => {
    const sistem = ozelPromptMetni('odyoloji')
    const soap = ozelSoapMetni('odyoloji')
    assert.match(sistem, /Doz yazılmaz/)
    assert.match(sistem, /Tanı kilitlemez/)
    assert.match(soap, /^SOAP — /)
    assert.doesNotMatch(sistem, /^SOAP — /m)
    const not = soapSistemPromptu({ transcript: '', specialty: 'odyoloji' })
    assert.match(not, /SOAP — odyoloji/)
    assert.doesNotMatch(soapSistemPromptu({ transcript: '', specialty: 'dermatoloji' }), /SOAP — odyoloji/)
    assert.doesNotMatch(soapSistemPromptu({ transcript: '', specialty: 'pediatri' }), /SOAP — odyoloji/)
    assert.ok(STUDYO_KILIT.length > 20)
  })
})
