import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { baslangicSecimi, dugmeMetni, eksikAlanlar, hazirMi, sayim, topluGovde, type TopluOneri } from './topluSecim'

const alanlar = [
  { anahtar: 'ilac_adi', etiket: 'İlaç' },
  { anahtar: 'doz', etiket: 'Doz' },
  { anahtar: 'kullanim_sikli', etiket: 'Kullanım' },
]
const zorunlu = ['ilac_adi', 'doz', 'kullanim_sikli']
const tam: TopluOneri = { id: 'a', alanlar, zorunlu, veri: { ilac_adi: 'Losartan', doz: '50 mg', kullanim_sikli: '1x1' } }
const eksik: TopluOneri = { id: 'b', alanlar, zorunlu, veri: { ilac_adi: 'Aspirin' } }
const ciddi: TopluOneri = { ...tam, id: 'c', uyari_detay: [{ siddet: 'ciddi' }] }

describe('topluSecim', () => {
  it('missing fields are listed, never guessed', () => {
    assert.deepEqual(eksikAlanlar(eksik), ['doz', 'kullanim_sikli'])
    assert.deepEqual(eksikAlanlar(tam), [])
  })
  it('doctor-typed values fill the gap; whitespace does not', () => {
    assert.deepEqual(eksikAlanlar(eksik, { b: { doz: '  ', kullanim_sikli: '2x1' } }), ['doz'])
    assert.deepEqual(eksikAlanlar(eksik, { b: { doz: '100 mg', kullanim_sikli: '1x1' } }), [])
  })
  it('initial ticks: only complete, non-serious rows', () => {
    assert.deepEqual(baslangicSecimi([tam, eksik, ciddi]), { a: true, b: false, c: false })
  })
  it('an incomplete row can be ticked but is not ready until filled', () => {
    const secili = { b: true }
    assert.equal(hazirMi(eksik, secili, {}, {}), false)
    assert.equal(hazirMi(eksik, secili, { b: { doz: '1', kullanim_sikli: '2' } }, {}), true)
  })
  it('serious warning needs acknowledgement even when complete', () => {
    assert.equal(hazirMi(ciddi, { c: true }, {}, {}), false)
    assert.equal(hazirMi(ciddi, { c: true }, {}, { c: true }), true)
  })
  it('counts ready vs needs-fields vs waiting-ack, ignoring unticked rows', () => {
    const s = sayim([tam, eksik, ciddi], { a: true, b: true, c: true }, {}, {})
    assert.deepEqual(s, { secilen: 3, hazir: 1, eksikli: 1, uyariBekleyen: 1 })
    assert.deepEqual(sayim([tam, eksik], { a: true }, {}, {}), { secilen: 1, hazir: 1, eksikli: 0, uyariBekleyen: 0 })
  })
  it('payload sends only ready rows and only doctor-typed values', () => {
    const duz = { b: { doz: ' 100 mg ', kullanim_sikli: '1x1' }, a: { doz: '' } }
    const g = topluGovde([tam, eksik], { a: true, b: true }, duz, {})
    assert.deepEqual(g.oneriIdler, ['a', 'b'])
    assert.deepEqual(g.duzeltmeler, { b: { doz: '100 mg', kullanim_sikli: '1x1' } })
  })
  it('payload leaves an unfilled ticked row out entirely (no silent write)', () => {
    const g = topluGovde([tam, eksik], { a: true, b: true }, {}, {})
    assert.deepEqual(g.oneriIdler, ['a'])
    assert.deepEqual(g.duzeltmeler, {})
  })
  it('server-resolved fields are never sent from the client', () => {
    const o: TopluOneri = { ...eksik, alanlar: [...alanlar, { anahtar: 'satir_id', etiket: 'Satır', sunucu: true }] }
    const g = topluGovde([o], { b: true }, { b: { doz: '1', kullanim_sikli: '2', satir_id: 'x' } }, {})
    assert.equal(g.duzeltmeler.b.satir_id, undefined)
  })
  it('button label states ready and needs-fields counts (wording comes from the injected copy, not from this file)', () => {
    const tr = { dugme: (x: { hazir: number; eksikli: number }) => `Seçilenleri kaydet (${x.hazir} hazır${x.eksikli ? `, ${x.eksikli} kayıtta eksik alan var` : ''})` }
    const en = { dugme: (x: { hazir: number; eksikli: number }) => `Save selected (${x.hazir} ready${x.eksikli ? `, ${x.eksikli} with missing fields` : ''})` }
    assert.equal(dugmeMetni({ secilen: 3, hazir: 1, eksikli: 2, uyariBekleyen: 0 }, tr), 'Seçilenleri kaydet (1 hazır, 2 kayıtta eksik alan var)')
    assert.equal(dugmeMetni({ secilen: 0, hazir: 0, eksikli: 0, uyariBekleyen: 0 }, tr), 'Seçilenleri kaydet (0 hazır)')
    assert.equal(dugmeMetni({ secilen: 3, hazir: 1, eksikli: 2, uyariBekleyen: 0 }, en), 'Save selected (1 ready, 2 with missing fields)')
  })
})
