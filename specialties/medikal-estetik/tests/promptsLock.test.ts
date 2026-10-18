import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ozelPromptMetni, ozelSoapMetni } from '@/lib/klinik/ozelPrompt'
import { soapSistemPromptu } from '@/lib/doktor/soapUret'
import { STUDYO_KILIT } from '../ui/sonuc'

describe('medikal-estetik kilit', () => {
  it('system ve soap ayrıdır; SOAP notu kendi başlığını taşır', () => {
    const sistem = ozelPromptMetni('medikal-estetik')
    const soap = ozelSoapMetni('medikal-estetik')
    assert.match(sistem, /Doz yazılmaz/)
    assert.match(sistem, /Tanı kilitlemez/)
    assert.match(soap, /^SOAP — /)
    assert.doesNotMatch(sistem, /^SOAP — /m)
    const not = soapSistemPromptu({ transcript: '', specialty: 'medikal-estetik' })
    assert.match(not, /SOAP — medikal estetik/)
    assert.doesNotMatch(soapSistemPromptu({ transcript: '', specialty: 'dermatoloji' }), /SOAP — medikal estetik/)
    assert.doesNotMatch(soapSistemPromptu({ transcript: '', specialty: 'pediatri' }), /SOAP — medikal estetik/)
    assert.ok(STUDYO_KILIT.length > 20)
  })
})
