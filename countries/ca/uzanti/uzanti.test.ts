import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { faturaToplami } from '@/lib/ulke/fatura/hesap'
import { CA_FATURA } from './fatura'
import { CA_UZANTI } from './index'
import { CA_PAKETI } from '../index'

describe('ca: invoices and bring-your-own payments', () => {
  it('the pack wires the extension: CAD, GST 5%, Stripe only (Tyro is Australian)', () => {
    assert.equal(CA_PAKETI.uzanti, CA_UZANTI)
    assert.equal(CA_FATURA.paraKodu, 'CAD')
    assert.equal(CA_FATURA.oranYuzde, 5)
    assert.equal(CA_FATURA.varsayilanMuaf, true)
    assert.deepEqual([...(CA_FATURA.saglayicilar ?? [])], ['stripe'])
  })
  it('the arithmetic uses the pack rate: a taxable line adds 5% once, a tax-free line adds none', () => {
    assert.deepEqual(faturaToplami([{ tutarKurus: 10000, muaf: true }], 5), { altToplamKurus: 10000, vergiKurus: 0, toplamKurus: 10000 })
    assert.equal(faturaToplami([{ tutarKurus: 10000, muaf: false }], CA_FATURA.oranYuzde).vergiKurus, 500)
  })
  it('the texts carry the draft label, no Australian or Turkish words, and name the live safeguards', () => {
    const hepsi = JSON.stringify(CA_FATURA.metin)
    assert.match(hepsi, /Initial compliance draft – external legal review later\./)
    assert.doesNotMatch(hepsi, /Medicare|ABN|Tyro|AUD|Türkiye|Turkish|KVKK/)
    assert.match(CA_FATURA.metin.modEtiketCanli, /LIVE/)
    assert.match(CA_FATURA.metin.sirAnahtar, /sk_/)
    assert.match(CA_FATURA.metin.izinler, /Checkout Sessions: Write; Payment Intents: Read; Refunds: Write; Charges: Read/)
  })
})
