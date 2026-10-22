import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { faturaToplami } from '@/lib/ulke/fatura/hesap'
import { GB_FATURA } from './fatura'
import { GB_UZANTI } from './index'
import { GB_PAKETI } from '../index'

describe('gb: invoices and bring-your-own payments', () => {
  it('the pack wires the extension: GBP, VAT 20%, Stripe only (Tyro is Australian)', () => {
    assert.equal(GB_PAKETI.uzanti, GB_UZANTI)
    assert.equal(GB_FATURA.paraKodu, 'GBP')
    assert.equal(GB_FATURA.oranYuzde, 20)
    assert.equal(GB_FATURA.varsayilanMuaf, true)
    assert.deepEqual([...(GB_FATURA.saglayicilar ?? [])], ['stripe'])
  })
  it('the arithmetic uses the pack rate: a taxable line adds 20% once, a tax-free line adds none', () => {
    assert.deepEqual(faturaToplami([{ tutarKurus: 10000, muaf: true }], 20), { altToplamKurus: 10000, vergiKurus: 0, toplamKurus: 10000 })
    assert.equal(faturaToplami([{ tutarKurus: 10000, muaf: false }], GB_FATURA.oranYuzde).vergiKurus, 2000)
  })
  it('the texts carry the draft label, no Australian or Turkish words, and name the live safeguards', () => {
    const hepsi = JSON.stringify(GB_FATURA.metin)
    assert.match(hepsi, /Initial compliance draft – external legal review later\./)
    assert.doesNotMatch(hepsi, /Medicare|ABN|Tyro|AUD|Türkiye|Turkish|KVKK/)
    assert.match(GB_FATURA.metin.modEtiketCanli, /LIVE/)
    assert.match(GB_FATURA.metin.sirAnahtar, /sk_/)
    assert.match(GB_FATURA.metin.izinler, /Checkout Sessions: Write; Payment Intents: Read; Refunds: Write; Charges: Read/)
  })
})
