import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { faturaToplami } from '@/lib/ulke/fatura/hesap'
import { NZ_FATURA } from './fatura'
import { NZ_UZANTI } from './index'
import { NZ_PAKETI } from '../index'

describe('nz: invoices and bring-your-own payments', () => {
  it('the pack wires the extension: NZD, GST 15%, Stripe only (Tyro is Australian)', () => {
    assert.equal(NZ_PAKETI.uzanti, NZ_UZANTI)
    assert.equal(NZ_FATURA.paraKodu, 'NZD')
    assert.equal(NZ_FATURA.oranYuzde, 15)
    assert.equal(NZ_FATURA.varsayilanMuaf, false)
    assert.deepEqual([...(NZ_FATURA.saglayicilar ?? [])], ['stripe'])
  })
  it('the arithmetic uses the pack rate: a taxable line adds 15% once, a tax-free line adds none', () => {
    assert.deepEqual(faturaToplami([{ tutarKurus: 10000, muaf: true }], 15), { altToplamKurus: 10000, vergiKurus: 0, toplamKurus: 10000 })
    assert.equal(faturaToplami([{ tutarKurus: 10000, muaf: false }], NZ_FATURA.oranYuzde).vergiKurus, 1500)
  })
  it('the texts carry the draft label, no Australian or Turkish words, and name the live safeguards', () => {
    const hepsi = JSON.stringify(NZ_FATURA.metin)
    assert.match(hepsi, /Initial compliance draft – external legal review later\./)
    assert.doesNotMatch(hepsi, /Medicare|ABN|Tyro|AUD|Türkiye|Turkish|KVKK/)
    assert.match(NZ_FATURA.metin.modEtiketCanli, /LIVE/)
    assert.match(NZ_FATURA.metin.sirAnahtar, /sk_/)
    assert.match(NZ_FATURA.metin.izinler, /Checkout Sessions: Write; Payment Intents: Read; Refunds: Write; Charges: Read/)
  })
})
