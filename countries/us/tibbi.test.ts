/**
 * UNITED STATES — the medical rows added on 2026-10-14, checked against the files and pages they were taken from.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aracCalistir } from '@/lib/ulke/araclar/paket'
import { US_ASI, US_ASI_ANAHTARLARI } from './araclar/asilar'
import { US_ARAYUZ } from './arayuz'
import { usFhirTaslak } from './kayit/fhirTaslak'
import { US_KAYIT_SISTEMLERI } from './kayit/sistemler'
import { US_ILACLAR, usIlacAnahtari } from './referans/ilaclar'
import { US_BLUE_BUTTON_ADRESI, US_PART_D, US_RECETE } from './araclar/partD'

const A = US_ARAYUZ.araclar!
const BUGUN = '2026-10-14'
const calistir = (anahtar: string, g: Record<string, string | number | boolean | null>) => {
  const p = A.araclar.find((x) => x.anahtar === anahtar)!
  const tanim = (A.kendiAraclari ?? []).find((t) => t.anahtar === anahtar)!
  return aracCalistir({ tanim, paket: p }, g, BUGUN, A)
}

describe('us medicines: Medicare Part D claims, 2024', () => {
  it('250 overall rows, and the published top and bottom of the extract', () => {
    assert.equal(US_ILACLAR.length, 250)
    assert.equal(US_ILACLAR[0].generic, 'Atorvastatin Calcium')
    assert.equal(US_ILACLAR[0].count, 73349032)
    assert.equal(US_ILACLAR[0].brand, null)
    assert.equal(US_ILACLAR[10].generic, 'Apixaban')
    assert.equal(US_ILACLAR[10].brand, 'Eliquis')
    assert.equal(US_ILACLAR[249].generic, 'Omega-3 Acid Ethyl Esters')
    assert.equal(US_ILACLAR[249].count, 947283)
    assert.ok(US_ILACLAR.every((r) => r.schedule === null && r.strength === null && r.form === null))
  })

  it('choosing atorvastatin returns its rank and never the claim count', () => {
    const s = calistir('us-part-d-medicines', { ilac: 'sira_001' })
    assert.equal(s.tamam, true)
    assert.equal(s.sayilar[0].deger, 1)
    assert.equal(s.bant, 'sira_001')
    assert.deepEqual(s.uyarilar, ['takvim_yok'])
    assert.equal(JSON.stringify(s).includes('73349032'), false)
    assert.equal(US_PART_D.hesapla({ ilac: 'yok' }, { bugun: BUGUN, p: {} }).tamam, false)
  })

  it('a prescription note is the same row, and it says it was not sent', () => {
    const s = calistir('us-prescription-note', { ilac: usIlacAnahtari(2), miktar: 30, yon: 'once daily' })
    assert.equal(s.sayilar[0].deger, 2)
    assert.deepEqual([...s.uyarilar], ['takvim_yok', 'iletilmedi'])
    assert.equal(s.sayilar.some((x) => x.anahtar === 'miktar'), false)
    assert.equal(US_RECETE.hesapla({ ilac: null, miktar: 30, yon: 'once daily' }, { bugun: BUGUN, p: {} }).tamam, false)
  })
})

describe('us immunization record', () => {
  it('the age-table rows, and a tick is a record', () => {
    assert.equal(US_ASI_ANAHTARLARI.length, 34)
    const g = Object.fromEntries(US_ASI_ANAHTARLARI.map((k) => [k, k === 'birth_hepb']))
    const s = calistir('us-immunization-schedule', g)
    assert.equal(s.sayilar[0].deger, 1)
    assert.deepEqual([...s.uyarilar], ['kayit', 'notlar'])
    assert.equal(US_ASI.hesapla(Object.fromEntries(US_ASI_ANAHTARLARI.map((k) => [k, false])), { bugun: BUGUN, p: {} }).tamam, false)
  })
})

describe('us record services: configured, not connected', () => {
  it('every service is explicitly unconnected, and the Blue Button link is the page that was read', () => {
    assert.deepEqual(US_KAYIT_SISTEMLERI.map((s) => s.anahtar), ['blue-button', 'tefca'])
    for (const s of US_KAYIT_SISTEMLERI) {
      assert.equal(s.bagli, false)
      assert.match(s.adres, /^https:\/\//)
      assert.ok(s.kayit.length > 0, s.anahtar)
    }
    assert.equal(US_BLUE_BUTTON_ADRESI, 'https://bluebutton.cms.gov/')
    assert.equal(A.araclar.find((p) => p.anahtar === 'us-blue-button-link')?.baglanti?.adres, US_BLUE_BUTTON_ADRESI)
  })

  it('a FHIR draft carries the medicine name, status draft, and no patient', () => {
    assert.equal(usFhirTaslak({ ad: '  ' }), null)
    const b = usFhirTaslak({ ad: 'Atorvastatin Calcium', miktar: 30, yon: 'once daily' })!
    assert.equal(b.resourceType, 'Bundle')
    const kaynak = (b.entry as { resource: Record<string, unknown> }[])[0].resource
    assert.equal(kaynak.status, 'draft')
    assert.equal((kaynak.medicationCodeableConcept as { text: string }).text, 'Atorvastatin Calcium')
    assert.equal(JSON.stringify(b).includes('patient'), false)
    assert.match(JSON.stringify(b), /Not submitted/)
  })
})
