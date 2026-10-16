import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { baslangicSecimi, dugmeMetni, eksikAlanlar, hazirMi, sayim, topluGovde, TOPLU_METIN_TR, type TopluMetin, type TopluOneri } from './topluSecim'

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
  it('button label states ready and needs-fields counts', () => {
    assert.equal(dugmeMetni({ secilen: 3, hazir: 1, eksikli: 2, uyariBekleyen: 0 }), 'Seçilenleri kaydet (1 hazır, 2 kayıtta eksik alan var)')
    assert.equal(dugmeMetni({ secilen: 0, hazir: 0, eksikli: 0, uyariBekleyen: 0 }), 'Seçilenleri kaydet (0 hazır)')
  })
})

/** NOTYA-ULKE-PARITE: the six country builds (us gb ca au nz uz) carry this same card, so the gating must not
 *  depend on Turkish field keys or Turkish copy. */
describe('topluSecim — country builds', () => {
  const EN: TopluMetin = {
    hazir: (n) => `${n} ready`,
    eksikli: (n) => `${n} with missing fields`,
    uyariBekleyen: (n) => `${n} awaiting warning acknowledgement`,
    dugme: (p) => `Save selected (${p.join(', ')})`,
    eksikAciklama: 'Required fields are empty. Enter them below.',
    seciliEksik: (a) => `Selected — will be added once ${a.join(', ')} is filled in.`,
  }
  const enAlanlar = [
    { anahtar: 'drug_name', etiket: 'Drug' },
    { anahtar: 'dose', etiket: 'Dose' },
    { anahtar: 'frequency', etiket: 'Frequency' },
  ]
  const enZorunlu = ['drug_name', 'dose', 'frequency']
  const enEksik: TopluOneri = { id: 'x', alanlar: enAlanlar, zorunlu: enZorunlu, veri: { drug_name: 'Metformin' } }

  it('gating works for any required-field keys, not just ilac_adi/doz/kullanim_sikli', () => {
    assert.deepEqual(eksikAlanlar(enEksik), ['dose', 'frequency'])
    assert.deepEqual(baslangicSecimi([enEksik]), { x: false })
    const g = topluGovde([enEksik], { x: true }, { x: { dose: '500 mg', frequency: 'twice daily' } }, {})
    assert.deepEqual(g.oneriIdler, ['x'])
    assert.deepEqual(g.duzeltmeler, { x: { dose: '500 mg', frequency: 'twice daily' } })
  })
  it('an incomplete ticked row is never sent', () => {
    assert.deepEqual(topluGovde([enEksik], { x: true }, {}, {}).oneriIdler, [])
  })
  it('button copy comes from the injected strings; Turkish stays the default', () => {
    const s = sayim([enEksik], { x: true }, {}, {})
    assert.equal(dugmeMetni(s, EN), 'Save selected (0 ready, 1 with missing fields)')
    assert.equal(dugmeMetni(s), dugmeMetni(s, TOPLU_METIN_TR))
    assert.match(dugmeMetni(s), /^Seçilenleri kaydet/)
    assert.doesNotMatch(dugmeMetni(s, EN), /[çğıöşüÇĞİÖŞÜ]/)
  })
})
