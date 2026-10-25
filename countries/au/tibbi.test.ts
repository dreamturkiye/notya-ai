/**
 * AUSTRALIA — the notifiable-disease rows and the unconnected adapters added on 2026-10-14.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aracCalistir } from '@/lib/ulke/araclar/paket'
import { AU_BILDIRIM, AU_BILDIRIM_SATIRLARI } from './araclar/bildirim'
import { AU_ETIKET, AU_SCHEDULE_8, AU_SCHEDULE_8_TANIMI, AU_SINIFLAR, AU_ZEHIR_SINIFI } from './araclar/poisons'
import { AU_ARAYUZ } from './arayuz'
import { AU_ETKILESIM } from './kayit/etkilesim'
import { auFhirTaslak } from './kayit/fhirTaslak'
import { AU_LABORATUVAR } from './kayit/laboratuvar'
import { AU_KAYIT_SISTEMLERI } from './kayit/sistemler'
import { AU_TANI_KODLARI } from './kayit/tani'

const A = AU_ARAYUZ.araclar!
const BUGUN = '2026-10-14'

describe('au notifiable diseases', () => {
  it('71 names from the compilation, first and last as the table prints them', () => {
    assert.equal(AU_BILDIRIM_SATIRLARI.length, 71)
    assert.equal(AU_BILDIRIM_SATIRLARI[0].ad, 'Andes virus infection')
    assert.equal(AU_BILDIRIM_SATIRLARI[0].kod, '1A')
    assert.equal(AU_BILDIRIM_SATIRLARI[10].ad, 'Coronavirus disease (COVID-19)')
    assert.equal(AU_BILDIRIM_SATIRLARI.at(-1)!.ad, 'Yellow fever')
    assert.equal(new Set(AU_BILDIRIM_SATIRLARI.map((r) => r.anahtar)).size, 71)
  })

  it('a tick is a record, and the screen says nothing was sent', () => {
    const g = Object.fromEntries(AU_BILDIRIM.alanlar.map((a) => [a.anahtar, a.anahtar === AU_BILDIRIM_SATIRLARI[1].anahtar]))
    const p = A.araclar.find((x) => x.anahtar === 'au-notifiable-diseases')!
    const s = aracCalistir({ tanim: AU_BILDIRIM, paket: p }, g, BUGUN, A)
    assert.equal(s.tamam, true)
    assert.equal(s.sayilar[0].deger, 1)
    assert.deepEqual([...s.uyarilar], ['gonderilmedi'])
    assert.equal(JSON.stringify(s).includes('71'), false)
  })
})

describe('au poisons standard, October 2026', () => {
  it('nine schedule classes, Schedule 8 entries, and a label checklist that does not print', () => {
    assert.equal(AU_SINIFLAR.length, 9)
    assert.equal(AU_SINIFLAR[0].ad, 'Pharmacy medicines')
    assert.equal(AU_SINIFLAR.find((r) => r.anahtar === 's8')!.ad, 'Controlled drugs')
    assert.equal(AU_SINIFLAR.at(-1)!.kod, '10')
    assert.equal(AU_SCHEDULE_8.length, 86)
    assert.equal(AU_SCHEDULE_8[0].ad, 'ACETYLDIHYDROCODEINE.')
    assert.equal(AU_SCHEDULE_8.find((r) => r.anahtar === 's8-codeine')!.ad, 'CODEINE except when included in Schedule 4.')
    assert.equal(AU_SCHEDULE_8.find((r) => r.anahtar === 's8-alprazolam')!.ad.startsWith('# ALPRAZOLAM'), true)
    assert.equal(AU_SCHEDULE_8.at(-1)!.ad, 'TILIDINE.')
  })

  it('a schedule choice repeats the instrument\'s description and says nothing was sent', () => {
    const p = A.araclar.find((x) => x.anahtar === 'au-poisons-schedules')!
    const s = aracCalistir({ tanim: AU_ZEHIR_SINIFI, paket: p }, { sinif: 's8' }, BUGUN, A)
    assert.equal(s.tamam, true)
    assert.equal(s.bant, 's8')
    assert.deepEqual([...s.uyarilar], ['eyalet', 'gonderilmedi'])
    assert.equal(p.metin.bantlar!.s8['en-AU'].includes('physical or psychological dependence'), true)
  })

  it('a Schedule 8 tick does not put the list length on the result', () => {
    const g = Object.fromEntries(AU_SCHEDULE_8_TANIMI.alanlar.map((a) => [a.anahtar, a.anahtar === 's8-morphine']))
    const p = A.araclar.find((x) => x.anahtar === 'au-schedule-8')!
    const s = aracCalistir({ tanim: AU_SCHEDULE_8_TANIMI, paket: p }, g, BUGUN, A)
    assert.equal(s.tamam, true)
    assert.equal(s.sayilar[0].deger, 1)
    assert.equal(s.sayilar[0].enCok, undefined)
    assert.equal(JSON.stringify(s).includes('86'), false)
  })

  it('a label with a required detail missing says so, and still sends nothing', () => {
    const p = A.araclar.find((x) => x.anahtar === 'au-dispensing-label')!
    const biri = Object.fromEntries(AU_ETIKET.alanlar.map((a) => [a.anahtar, a.anahtar === 'person']))
    const eksik = aracCalistir({ tanim: AU_ETIKET, paket: p }, biri, BUGUN, A)
    assert.equal(eksik.tamam, true)
    assert.ok(eksik.uyarilar.includes('eksik'))
    assert.ok(eksik.uyarilar.includes('gonderilmedi'))
    const hepsi = Object.fromEntries(AU_ETIKET.alanlar.map((a) => [a.anahtar, true]))
    const tam = aracCalistir({ tanim: AU_ETIKET, paket: p }, hepsi, BUGUN, A)
    assert.equal(tam.uyarilar.includes('eksik'), false)
    assert.ok(tam.uyarilar.includes('gonderilmedi'))
  })
})

describe('au record services: configured, not connected', () => {
  it('every service is explicitly unconnected', () => {
    assert.deepEqual(AU_KAYIT_SISTEMLERI.map((s) => s.anahtar), ['my-health-record', 'erx'])
    for (const s of AU_KAYIT_SISTEMLERI) assert.equal(s.bagli, false)
  })

  it('a FHIR draft is local, status draft, and carries no person identifier', () => {
    assert.equal(auFhirTaslak({ ad: '  ' }), null)
    const b = auFhirTaslak({ ad: 'amoxicillin', miktar: 1, yon: 'as written' })!
    assert.equal((b.entry as { resource: { status: string } }[])[0].resource.status, 'draft')
    assert.equal(JSON.stringify(b).includes('patient'), false)
  })

  it('interactions and diagnosis codes stay empty', () => {
    assert.equal(AU_ETKILESIM.bagli, false)
    assert.equal(AU_ETKILESIM.juftlar.length, 0)
    assert.equal(AU_TANI_KODLARI.satirlar.length, 0)
    assert.equal(AU_TANI_KODLARI.okundu, '2026-10-25')
    assert.equal(AU_LABORATUVAR.paneller.length, 0)
    assert.equal(AU_LABORATUVAR.araliklar.length, 0)
    assert.equal(AU_LABORATUVAR.birimler.kreatinin, 'umol/L')
  })
})
