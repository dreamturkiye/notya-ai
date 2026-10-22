import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { faturaToplami } from '@/lib/ulke/fatura/hesap'
import { US_FATURA } from './fatura'
import { US_UZANTI } from './index'
import { US_PAKETI } from '../index'

describe('us: invoices and bring-your-own payments', () => {
  it('the pack wires the extension: USD, Sales tax 0%, Stripe only (Tyro is Australian)', () => {
    assert.equal(US_PAKETI.uzanti, US_UZANTI)
    assert.equal(US_FATURA.paraKodu, 'USD')
    assert.equal(US_FATURA.oranYuzde, 0)
    assert.equal(US_FATURA.varsayilanMuaf, true)
    assert.deepEqual([...(US_FATURA.saglayicilar ?? [])], ['stripe'])
  })
  it('the arithmetic uses the pack rate: a taxable line adds 0% once, a tax-free line adds none', () => {
    assert.deepEqual(faturaToplami([{ tutarKurus: 10000, muaf: true }], 0), { altToplamKurus: 10000, vergiKurus: 0, toplamKurus: 10000 })
    assert.equal(faturaToplami([{ tutarKurus: 10000, muaf: false }], US_FATURA.oranYuzde).vergiKurus, 0)
  })
  it('the texts carry the draft label, no Australian or Turkish words, and name the live safeguards', () => {
    const hepsi = JSON.stringify(US_FATURA.metin)
    assert.match(hepsi, /Initial compliance draft – external legal review later\./)
    assert.doesNotMatch(hepsi, /Medicare|ABN|Tyro|AUD|Türkiye|Turkish|KVKK/)
    assert.match(US_FATURA.metin.modEtiketCanli, /LIVE/)
    assert.match(US_FATURA.metin.sirAnahtar, /sk_/)
    assert.match(US_FATURA.metin.izinler, /Checkout Sessions: Write; Payment Intents: Read; Refunds: Write; Charges: Read/)
  })
})
