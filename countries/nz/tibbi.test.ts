/**
 * NEW ZEALAND — the medical rows added on 2026-10-14.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aracCalistir } from '@/lib/ulke/araclar/paket'
import { NZ_NZEPS_ADRESI, NZ_RECETE, NZ_UST } from './araclar/pharmac'
import { NZ_ARAYUZ } from './arayuz'
import { nzFhirTaslak } from './kayit/fhirTaslak'
import { NZ_KAYIT_SISTEMLERI } from './kayit/sistemler'
import { NZ_TAKVIM, NZ_UST20, nzTakvimAnahtari } from './referans/ilaclar'

const A = NZ_ARAYUZ.araclar!
const BUGUN = '2026-10-14'
const calistir = (anahtar: string, g: Record<string, string | number | boolean | null>) => {
  const p = A.araclar.find((x) => x.anahtar === anahtar)!
  const tanim = (A.kendiAraclari ?? []).find((t) => t.anahtar === anahtar)!
  return aracCalistir({ tanim, paket: p }, g, BUGUN, A)
}

describe('nz medicines', () => {
  it('the Pharmac table has 20 ranks, and the Schedule extract has 250 file-order rows', () => {
    assert.equal(NZ_UST20.length, 20)
    assert.equal(NZ_UST20[0].generic, 'Paracetamol')
    assert.equal(NZ_UST20[0].count, 3720000)
    assert.equal(NZ_UST20[19].generic, 'Metformin hydrochloride')
    assert.equal(NZ_TAKVIM.length, 250)
    assert.equal(NZ_TAKVIM[0].generic, 'Alginic acid')
    assert.equal(NZ_TAKVIM[0].brand, 'Gaviscon Infant')
    assert.equal(NZ_TAKVIM[249].generic, 'Sodium Fusidate [fusidic acid]')
  })

  it('choosing paracetamol returns rank 1 and never the prescription count', () => {
    const s = calistir('nz-pharmac-top-20', { ilac: 'ust_01' })
    assert.equal(s.tamam, true)
    assert.equal(s.sayilar[0].deger, 1)
    assert.equal(JSON.stringify(s).includes('3720000'), false)
    assert.equal(NZ_UST.hesapla({ ilac: 'yok' }, { bugun: BUGUN, p: {} }).tamam, false)
  })

  it('a prescription note is a Schedule row, and it says it was not sent', () => {
    const s = calistir('nz-prescription-note', { ilac: nzTakvimAnahtari(1), miktar: 30, yon: 'as written' })
    assert.equal(s.sayilar[0].deger, 1)
    assert.deepEqual([...s.uyarilar], ['dosya_sirasi', 'iletilmedi'])
    assert.equal(s.sayilar.some((x) => x.anahtar === 'miktar'), false)
    assert.equal(NZ_RECETE.hesapla({ ilac: null }, { bugun: BUGUN, p: {} }).tamam, false)
  })
})

describe('nz record services: configured, not connected', () => {
  it('the ePrescription page is unconnected', () => {
    assert.deepEqual(NZ_KAYIT_SISTEMLERI.map((s) => s.anahtar), ['nzeps'])
    assert.equal(NZ_KAYIT_SISTEMLERI[0].bagli, false)
    assert.equal(NZ_NZEPS_ADRESI, NZ_KAYIT_SISTEMLERI[0].adres)
    assert.equal(A.araclar.find((p) => p.anahtar === 'nz-nzeps-link')?.baglanti?.adres, NZ_NZEPS_ADRESI)
  })

  it('a FHIR draft carries the medicine name, status draft, and no patient', () => {
    assert.equal(nzFhirTaslak({ ad: '  ' }), null)
    const b = nzFhirTaslak({ ad: 'Paracetamol', miktar: 30, yon: 'as written' })!
    assert.equal(b.resourceType, 'Bundle')
    const kaynak = (b.entry as { resource: Record<string, unknown> }[])[0].resource
    assert.equal(kaynak.status, 'draft')
    assert.equal(JSON.stringify(b).includes('patient'), false)
    assert.match(JSON.stringify(b), /Not submitted/)
  })
})
