/**
 * NEW ZEALAND — the medical rows added on 2026-10-14.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aracCalistir } from '@/lib/ulke/araclar/paket'
import { NZ_KONTROLLU, NZ_KONTROLLU_HER, NZ_NZEPS_ADRESI, NZ_RECETE, NZ_UST } from './araclar/pharmac'
import { NZ_ARAYUZ } from './arayuz'
import { NZ_ETKILESIM } from './kayit/etkilesim'
import { nzFhirTaslak } from './kayit/fhirTaslak'
import { NZ_LABORATUVAR } from './kayit/laboratuvar'
import { NZ_KAYIT_SISTEMLERI } from './kayit/sistemler'
import { NZ_TANI } from './kayit/tani'
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

describe('nz codes, interactions, and laboratory units', () => {
  it('no interaction pair, no diagnosis code, and no laboratory range was added', () => {
    assert.equal(NZ_ETKILESIM.bagli, false)
    assert.equal(NZ_ETKILESIM.sozlesmeGerekli, true)
    assert.deepEqual([...NZ_ETKILESIM.juftlar], [])
    assert.deepEqual([...NZ_TANI.satirlar], [])
    assert.equal(NZ_TANI.ekranda, false)
    assert.equal(NZ_LABORATUVAR.birimler.kreatinin, 'umol/L')
    assert.equal(NZ_LABORATUVAR.birimler.hemoglobin, 'g/L')
    assert.deepEqual([...NZ_LABORATUVAR.paneller], [])
    assert.deepEqual([...NZ_LABORATUVAR.araliklar], [])
  })

  it('the controlled-drug record starts with the six points that apply to every prescription', () => {
    assert.deepEqual(NZ_KONTROLLU.alanlar.slice(0, 6).map((a) => a.anahtar), [...NZ_KONTROLLU_HER])
    assert.equal(NZ_KONTROLLU.alanlar.length, 12)
    assert.equal(NZ_KONTROLLU.hesapla({}).tamam, false)
    const g = Object.fromEntries(NZ_KONTROLLU.alanlar.map((a) => [a.anahtar, true]))
    const s = NZ_KONTROLLU.hesapla(g)
    assert.equal(s.tamam, true)
    assert.equal(s.sayilar.find((x) => x.anahtar === 'isaretli')?.deger, 12)
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
