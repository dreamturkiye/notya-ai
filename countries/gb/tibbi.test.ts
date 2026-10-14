/**
 * UNITED KINGDOM — the medical rows added on 2026-10-14, checked against the files and pages they were taken from.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bicimYazimSorunlari } from '../_dil/en/testing/yazimDenetimi'
import { aracCalistir } from '@/lib/ulke/araclar/paket'
import { GB_ARACLAR } from './araclar'
import { GB_ARAYUZ } from './arayuz'
import { gbFhirTaslak } from './kayit/fhirTaslak'
import { GB_KAYIT_SISTEMLERI } from './kayit/sistemler'
import { GB_ILACLAR, gbIlacAnahtari } from './referans/ilaclar'
import { GB_ETKILESIM } from './kayit/etkilesim'
import { GB_LABORATUVAR } from './kayit/laboratuvar'
import { GB_TANI } from './kayit/tani'
import { GB_ASI_ANAHTARLARI, GB_BILDIRIM, GB_EPS_ADRESI, GB_HASTALIK_ANAHTARLARI, GB_ILAC_LISTESI, GB_RECETE_NOTU } from './tibbiAraclar'

const A = GB_ARAYUZ.araclar!
const BUGUN = '2026-10-14'
const calistir = (anahtar: string, g: Record<string, string | number | boolean | null>) => {
  const p = A.araclar.find((x) => x.anahtar === anahtar)!
  const tanim = (A.kendiAraclari ?? []).find((t) => t.anahtar === anahtar)!
  return aracCalistir({ tanim, paket: p }, g, BUGUN, A)
}

describe('gb medicines: NHSBSA Prescription Cost Analysis 2025/26', () => {
  it('250 chemical substances, chapters 1 to 15, and the published top of the table', () => {
    assert.equal(GB_ILACLAR.length, 250)
    assert.deepEqual([...new Set(GB_ILACLAR.map((r) => r.chapter))].sort(), ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'])
    assert.equal(GB_ILACLAR[0].generic, 'Atorvastatin')
    assert.equal(GB_ILACLAR[0].count, 78042871)
    assert.equal(GB_ILACLAR[0].presentation, 'Atorvastatin 20mg tablets')
    assert.equal(GB_ILACLAR[9].generic, 'Sertraline hydrochloride')
    assert.equal(GB_ILACLAR[249].rank, 250)
    assert.ok(GB_ILACLAR.every((r) => r.schedule === null && r.strength === null))
  })

  it('choosing atorvastatin returns its rank and never a dose or an item count', () => {
    const s = calistir('gb-medicine-list', { kimyasal: 'sira_001' })
    assert.equal(s.tamam, true)
    assert.equal(s.sayilar[0].deger, 1)
    assert.equal(s.bant, 'sira_001')
    assert.deepEqual(s.uyarilar, ['takvim_yok'])
    assert.equal(JSON.stringify(s).includes('78042871'), false)
    assert.equal(calistir('gb-medicine-list', { kimyasal: null }).tamam, false)
    assert.equal(GB_ILAC_LISTESI.hesapla({ kimyasal: 'yok' }, { bugun: BUGUN, p: {} }).tamam, false)
  })

  it('a prescription note is the same row, and it says it was not sent', () => {
    const s = calistir('gb-prescription-note', { kimyasal: gbIlacAnahtari(2), miktar: 28, yon: 'once daily' })
    assert.equal(s.sayilar[0].deger, 2)
    assert.deepEqual([...s.uyarilar], ['takvim_yok', 'iletilmedi'])
    assert.equal(s.sayilar.some((x) => x.anahtar === 'miktar'), false, 'the quantity is not a result the tool worked out')
    assert.equal(GB_RECETE_NOTU.hesapla({ kimyasal: null, miktar: 28, yon: 'once daily' }, { bugun: BUGUN, p: {} }).tamam, false)
  })
})

describe('gb immunisation and notification lists', () => {
  it('routine, selective and additional rows from the same page, and a tick is a record', () => {
    assert.equal(GB_ASI_ANAHTARLARI.length, 41)
    assert.equal(GB_ASI_ANAHTARLARI[19], 'child_flu')
    assert.equal(GB_ASI_ANAHTARLARI[20], 'hepb_birth')
    assert.ok(GB_ASI_ANAHTARLARI.includes('complement'))
    assert.equal(GB_ASI_ANAHTARLARI.at(-1), 'homeless')
    const g = Object.fromEntries(GB_ASI_ANAHTARLARI.map((k) => [k, k === 'w8_hex']))
    const s = calistir('gb-immunisation-schedule', g)
    assert.equal(s.sayilar[0].deger, 1)
    assert.deepEqual(s.uyarilar, ['kayit'])
    assert.equal(calistir('gb-immunisation-schedule', Object.fromEntries(GB_ASI_ANAHTARLARI.map((k) => [k, false]))).tamam, false)
  })

  it('forty-three diseases: urgent outranks a conditional row', () => {
    assert.equal(GB_HASTALIK_ANAHTARLARI.length, 43)
    const bos = Object.fromEntries(GB_HASTALIK_ANAHTARLARI.map((k) => [k, false]))
    assert.equal(GB_BILDIRIM.hesapla({ ...bos, measles: true }, { bugun: BUGUN, p: {} }).bant, 'acil')
    assert.equal(GB_BILDIRIM.hesapla({ ...bos, mumps: true }, { bugun: BUGUN, p: {} }).bant, 'rutin')
    const karisik = GB_BILDIRIM.hesapla({ ...bos, malaria: true, measles: true }, { bugun: BUGUN, p: {} })
    assert.equal(karisik.bant, 'acil')
    assert.deepEqual([...karisik.uyarilar], ['yirmi_dort_saat', 'kosulu_oku'])
    assert.equal(GB_BILDIRIM.hesapla({ ...bos, whooping_cough: true }, { bugun: BUGUN, p: {} }).bant, 'kosullu')
  })
})

describe('gb record services: configured, not connected', () => {
  it('every service is explicitly unconnected, and the prescription link is the page that was read', () => {
    assert.ok(GB_KAYIT_SISTEMLERI.length >= 5)
    for (const s of GB_KAYIT_SISTEMLERI) {
      assert.equal(s.bagli, false)
      assert.match(s.adres, /^https:\/\//)
      assert.ok(s.kayit.length > 0, s.anahtar)
    }
    assert.equal(GB_EPS_ADRESI, 'https://digital.nhs.uk/services/electronic-prescription-service')
    assert.equal(A.araclar.find((p) => p.anahtar === 'gb-eps-link')?.baglanti?.adres, GB_EPS_ADRESI)
  })

  it('a FHIR draft carries the medicine name, status draft, and no patient', () => {
    assert.equal(gbFhirTaslak({ ad: '  ' }), null)
    const b = gbFhirTaslak({ ad: 'Atorvastatin 20mg tablets', miktar: 28, yon: 'once daily' })!
    assert.equal(b.resourceType, 'Bundle')
    const kaynak = (b.entry as { resource: Record<string, unknown> }[])[0].resource
    assert.equal(kaynak.status, 'draft')
    assert.equal((kaynak.medicationCodeableConcept as { text: string }).text, 'Atorvastatin 20mg tablets')
    assert.equal(JSON.stringify(b).includes('patient'), false)
    assert.match(JSON.stringify(b), /Not submitted/)
  })

  it('no interaction pair, no diagnosis code, and no laboratory range was added', () => {
    assert.equal(GB_ETKILESIM.bagli, false)
    assert.deepEqual([...GB_ETKILESIM.juftlar], [])
    assert.deepEqual([...GB_TANI.satirlar], [])
    assert.equal(GB_LABORATUVAR.birimler.kreatinin, 'umol/L')
    assert.equal(GB_LABORATUVAR.birimler.hemoglobin, 'g/L')
    assert.deepEqual([...GB_LABORATUVAR.paneller], [])
    assert.deepEqual([...GB_LABORATUVAR.araliklar], [])
  })
})

describe('gb medical screen text: British spelling', () => {
  it('the new tools show no spelling of another form of English', () => {
    const anahtarlar = ['gb-medicine-list', 'gb-prescription-note', 'gb-immunisation-schedule', 'gb-notifiable-diseases', 'gb-eps-link']
    const metinler = anahtarlar.flatMap((k) => {
      const p = A.araclar.find((x) => x.anahtar === k)!
      const dizi: string[] = []
      const yuru = (v: unknown) => {
        if (typeof v === 'string') dizi.push(v)
        else if (v && typeof v === 'object') for (const x of Object.values(v)) yuru(x)
      }
      yuru(p.metin)
      yuru(p.lisans)
      return dizi
    })
    assert.deepEqual(metinler.flatMap((m) => bicimYazimSorunlari(m, 'en-GB')), [])
  })
})
