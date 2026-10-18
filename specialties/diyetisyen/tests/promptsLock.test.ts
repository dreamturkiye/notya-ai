import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ozelPromptMetni, ozelSoapMetni } from '@/lib/klinik/ozelPrompt'
import { soapSistemPromptu } from '@/lib/doktor/soapUret'
import { STUDYO_KILIT } from '../ui/sonuc'

describe('diyetisyen kilit', () => {
  it('system ve soap ayrıdır; SOAP notu kendi başlığını taşır', () => {
    const sistem = ozelPromptMetni('diyetisyen')
    const soap = ozelSoapMetni('diyetisyen')
    assert.match(sistem, /Doz yazılmaz/)
    assert.match(sistem, /Tanı kilitlemez/)
    assert.match(soap, /^SOAP — /)
    assert.doesNotMatch(sistem, /^SOAP — /m)
    const not = soapSistemPromptu({ transcript: '', specialty: 'diyetisyen' })
    assert.match(not, /SOAP — diyetisyen/)
    assert.doesNotMatch(soapSistemPromptu({ transcript: '', specialty: 'dermatoloji' }), /SOAP — diyetisyen/)
    assert.doesNotMatch(soapSistemPromptu({ transcript: '', specialty: 'pediatri' }), /SOAP — diyetisyen/)
    assert.ok(STUDYO_KILIT.length > 20)
  })
})
