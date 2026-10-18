import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ozelPromptMetni, ozelSoapMetni } from '@/lib/klinik/ozelPrompt'
import { soapSistemPromptu } from '@/lib/doktor/soapUret'
import { STUDYO_KILIT } from '../ui/sonuc'

describe('fizyoterapi kilit', () => {
  it('system ve soap ayrıdır; SOAP notu kendi başlığını taşır', () => {
    const sistem = ozelPromptMetni('fizyoterapi')
    const soap = ozelSoapMetni('fizyoterapi')
    assert.match(sistem, /Doz yazılmaz/)
    assert.match(sistem, /Tanı kilitlemez/)
    assert.match(soap, /^SOAP — /)
    assert.doesNotMatch(sistem, /^SOAP — /m)
    const not = soapSistemPromptu({ transcript: '', specialty: 'fizyoterapi' })
    assert.match(not, /SOAP — fizyoterapi/)
    assert.doesNotMatch(soapSistemPromptu({ transcript: '', specialty: 'dermatoloji' }), /SOAP — fizyoterapi/)
    assert.doesNotMatch(soapSistemPromptu({ transcript: '', specialty: 'pediatri' }), /SOAP — fizyoterapi/)
    assert.ok(STUDYO_KILIT.length > 20)
  })
})
