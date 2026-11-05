/**
 * HASTA-DISA-AKTAR-01 (2026-11-05) — the country export's FHIR R4 Bundle: its shape, and what it never carries. Invented
 * values only; no patient data.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fhirBundle, type UlkeDisaAktarim } from './sunucu'

const V: UlkeDisaAktarim = {
  hasta: { id: '11111111-1111-4111-8111-111111111111', ad: 'Test Patient', dogumTarihi: '1990-01-01', cinsiyet: 'female' },
  notlar: [{ id: '22222222-2222-4222-8222-222222222222', tarih: '2026-11-01T10:00:00Z', dil: 'en-GB', bolumler: [['s', 'Headache <2 days> & nausea'], ['p', 'Review']], ek: '' }],
  araclar: [{ id: '33333333-3333-4333-8333-333333333333', arac: 'caprini', tarih: '2026-11-01T10:05:00Z', sonuc: { sayilar: [{ anahtar: 'toplam', deger: 5 }] } }],
  olusturuldu: '2026-11-05T09:00:00Z',
}

describe('country patient export: FHIR R4 collection Bundle', () => {
  it('is a collection with the Patient, an Encounter and a Composition per note, and an Observation per kept result', () => {
    const b = fhirBundle(V) as { resourceType: string; type: string; entry: { resource: { resourceType: string } }[] }
    assert.equal(b.resourceType, 'Bundle'); assert.equal(b.type, 'collection')
    assert.deepEqual(b.entry.map((e) => e.resource.resourceType), ['Patient', 'Encounter', 'Composition', 'Observation'])
  })
  it('escapes the note text inside the narrative, and carries no national ID or telephone', () => {
    const j = JSON.stringify(fhirBundle(V))
    assert.match(j, /Headache &lt;2 days&gt; &amp; nausea/)
    assert.doesNotMatch(j, /identifier|telecom/)
  })
})
