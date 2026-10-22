import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { abnGecerli, ahpraNoBicimi, postaKoduBicimi, postaKoduEyalette, providerNoBicimi } from '../kimlik'
import { AU_MUAYENEHANE, auMuayenehaneDogrula } from './muayenehane'
import { AU_YASAL_SATIRLARI, AU_YASAL_NOTLARI } from './acilis'
import { AU_GIZLILIK, AU_TASLAK_ETIKETI } from './gizlilik'
import { AU_UZANTI, AU_EK_NOT } from './index'
import { AU_FATURA } from './fatura'
import { AU_REFERANS_ARAMALARI, AU_REFERANS_BOLUMLERI } from './referans'
import { AU_DATA_BREACH } from './veriIhlali'
import { AU_YASAL } from '../yasal'
import { AU_PAKETI } from '../index'

describe('ABN (ABR weighting check, read 2026-10-22)', () => {
  it('accepts the ABR worked example and ignores spaces', () => {
    assert.equal(abnGecerli('51 824 753 556'), true)
    assert.equal(abnGecerli('51824753556'), true)
  })
  it('rejects a changed digit, wrong length, letters and empty', () => {
    assert.equal(abnGecerli('51 824 753 557'), false)
    assert.equal(abnGecerli('5182475355'), false)
    assert.equal(abnGecerli('ABCDEFGHIJK'), false)
    assert.equal(abnGecerli(''), false)
    assert.equal(abnGecerli(null), false)
  })
})

describe('AHPRA registration number (3 letters + 10 digits, format only)', () => {
  it('accepts the FHIR example, normalising case and spaces', () => {
    assert.equal(ahpraNoBicimi('MED0000932846'), 'MED0000932846')
    assert.equal(ahpraNoBicimi(' med 0001234567 '), 'MED0001234567')
  })
  it('rejects wrong shapes', () => {
    for (const x of ['MED000093284', 'ME00000932846', 'MED00009328466', '1234567890123', '', 'MED000093284X']) assert.equal(ahpraNoBicimi(x), null, x)
  })
})

describe('Medicare provider number (format only) and postcode', () => {
  it('accepts six digits, a location character and a check letter', () => {
    assert.equal(providerNoBicimi('2447781L'), '2447781L')
    assert.equal(providerNoBicimi('244778 1l'), '2447781L')
  })
  it('rejects a forbidden location character, a bad check letter, a short number', () => {
    assert.equal(providerNoBicimi('2447780L'), null)
    assert.equal(providerNoBicimi('244778IL'), null)
    assert.equal(providerNoBicimi('2447781Z'), null)
    assert.equal(providerNoBicimi('447781L'), null)
  })
  it('postcode: four digits; state ranges are a warning input only', () => {
    assert.equal(postaKoduBicimi('2000'), '2000')
    assert.equal(postaKoduBicimi('0800'), '0800')
    assert.equal(postaKoduBicimi('200'), null)
    assert.equal(postaKoduBicimi('20000'), null)
    assert.equal(postaKoduEyalette('2000', 'NSW'), true)
    assert.equal(postaKoduEyalette('2600', 'ACT'), true)
    assert.equal(postaKoduEyalette('2600', 'NSW'), false)
    assert.equal(postaKoduEyalette('3000', 'VIC'), true)
    assert.equal(postaKoduEyalette('0800', 'NT'), true)
    assert.equal(postaKoduEyalette('3000', 'WA'), false)
  })
})

describe('practice details: empty is valid, invalid shows a sentence and is not kept', () => {
  it('empty and non-object input never break', () => {
    for (const x of [{}, null, undefined, 'x', 5, []] as unknown[]) {
      const r = auMuayenehaneDogrula(x as Record<string, unknown>)
      assert.deepEqual(r.hatalar, {})
      assert.deepEqual(r.temiz, {})
    }
  })
  it('a full valid set is normalised', () => {
    const r = auMuayenehaneDogrula({ adi: ' Harbour Clinic ', abn: '51824753556', ahpra: 'med0001234567', saglayici: '2447781L', sokak: '1 George St', banliyo: 'Sydney', eyalet: 'nsw', postakodu: '2000' })
    assert.deepEqual(r.hatalar, {})
    assert.equal(r.temiz.abn, '51 824 753 556')
    assert.equal(r.temiz.ahpra, 'MED0001234567')
    assert.equal(r.temiz.eyalet, 'NSW')
    assert.deepEqual(r.uyarilar, {})
  })
  it('invalid fields give a sentence each and are left out', () => {
    const r = auMuayenehaneDogrula({ abn: '12345', ahpra: 'x', saglayici: 'y', eyalet: 'XX', postakodu: '12' })
    assert.deepEqual(Object.keys(r.hatalar).sort(), ['abn', 'ahpra', 'eyalet', 'postakodu', 'saglayici'])
    assert.deepEqual(r.temiz, {})
    for (const m of Object.values(r.hatalar)) assert.ok(m.length > 20)
  })
  it('a postcode outside the state range is kept with a warning', () => {
    const r = auMuayenehaneDogrula({ eyalet: 'WA', postakodu: '3000' })
    assert.deepEqual(r.hatalar, {})
    assert.equal(r.temiz.postakodu, '3000')
    assert.match(r.uyarilar.postakodu, /not in the ranges/)
  })
  it('every defined field has a label and the pack wires the validator', () => {
    assert.deepEqual(AU_MUAYENEHANE.alanlar.map((a) => a.anahtar), ['adi', 'abn', 'ahpra', 'saglayici', 'sokak', 'banliyo', 'eyalet', 'postakodu'])
    assert.equal(AU_PAKETI.uzanti, AU_UZANTI)
  })
})

describe('landing disclaimers, labels and honesty', () => {
  it('the four owner disclaimers are verbatim', () => {
    assert.deepEqual([...AU_YASAL_SATIRLARI], [
      'Notya is a practice management and clinical documentation tool. It does not provide medical advice, diagnosis, or treatment. Clinical decisions remain the responsibility of the registered practitioner.',
      'Health information is handled in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles. By using Notya you consent to the collection and use of health information for the purpose of providing the service.',
      'Clinical content is based on publicly available Australian guidelines (RACGP, RCH Melbourne, PBS, WHO). It is an initial compliance and clinical draft. External clinician and legal review is planned after the first customers.',
      'Notya is not a substitute for professional medical advice. Always consult a registered Australian health practitioner for medical concerns.',
    ])
    assert.deepEqual([...AU_YASAL_NOTLARI.satirlar], [...AU_YASAL_SATIRLARI])
  })
  it('the non-blocking note is exact', () => {
    assert.equal(AU_EK_NOT, 'Initial Australian compliance and clinical content based on public guidelines. External clinician and legal review planned after first customers.')
    assert.equal(AU_UZANTI.ekNot, AU_EK_NOT)
  })
  it('the privacy and clinical groups carry their draft labels', () => {
    assert.equal(AU_TASLAK_ETIKETI, 'Initial compliance draft – external legal review later.')
    assert.equal(AU_GIZLILIK.taslakEtiketi, AU_TASLAK_ETIKETI)
    for (const b of AU_REFERANS_BOLUMLERI) assert.equal(b.taslakEtiketi, 'Initial clinical draft – external clinician review later.')
    for (const d of [...AU_YASAL.diller[0].belgeler, AU_DATA_BREACH]) assert.match(d.inceleme, /Initial compliance draft – external legal review later\./)
  })
  it('no text claims compliance, certification or review', () => {
    const hepsi = JSON.stringify([AU_GIZLILIK, AU_FATURA, AU_UZANTI.referansBolumleri, AU_DATA_BREACH, AU_YASAL.diller[0].belgeler.filter((b) => ['privacy', 'security', 'data-request'].includes(b.anahtar))])
    assert.doesNotMatch(hepsi, /\b(is|are) (fully )?compliant\b|\bcertified\b|\bHIPAA\b|reviewed by (a|our) (lawyer|clinician)/i)
  })
  it('the notice states overseas disclosure and names the providers the code really calls', () => {
    const metin = JSON.stringify(AU_GIZLILIK.bildirim)
    for (const x of ['Overseas disclosure', 'Frankfurt', 'ElevenLabs', 'OpenRouter', 'Supabase', 'Vercel', 'APP 12', 'APP 13']) assert.ok(metin.includes(x), x)
  })
  it('explicit consent is a separate, un-ticked action with a version', () => {
    assert.match(AU_GIZLILIK.riza.kutu, /consent/)
    assert.match(AU_GIZLILIK.surum, /^au-\d{4}-\d{2}-\d{2}-draft-\d+$/)
  })
  it('invoices: GST 10%, tax-free by default, ABN printed from the practice details', () => {
    assert.equal(AU_FATURA.oranYuzde, 10)
    assert.equal(AU_FATURA.varsayilanMuaf, true)
    assert.equal(AU_FATURA.saticiKimlikAlani, 'abn')
  })
  it('the PBS lookup is a link-out to the verified search pattern and carries a source line', () => {
    const p = AU_REFERANS_ARAMALARI[0]
    assert.equal(p.adresSablonu, 'https://www.pbs.gov.au/search?term={q}&analyse=false&search-type=medicines')
    assert.match(p.kaynak, /2026-10-22/)
    assert.equal(AU_UZANTI.kayitSistemi?.durum.bagli, false)
  })
  it('routes for the new screens and pages are listed', () => {
    for (const r of ['/billing', '/privacy-requests', '/data-breach', '/privacy', '/data-request']) assert.ok(AU_PAKETI.rotalar !== 'hepsi' && AU_PAKETI.rotalar.sayfalar.includes(r), r)
  })
})
