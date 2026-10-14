/**
 * UZBEKISTAN — the medical rows added on 2026-10-14, checked against the files and pages they were taken from.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aracCalistir } from '@/lib/ulke/araclar/paket'
import { UZ_ARAYUZ } from './arayuz'
import { UZ_ETKILESIM } from './kayit/etkilesim'
import { uzFhirTaslak } from './kayit/fhirTaslak'
import { UZ_LAB_KATALOG } from './kayit/laboratuvar'
import { UZ_KAYIT_SISTEMLERI } from './kayit/sistemler'
import { UZ_TANI_KODLARI } from './kayit/tani'
import { UZ_ASOSIY_QATORLAR, UZ_EMLASH_TAQVIMI, UZ_GIYOHVAND_QOIDALARI } from './uygulama/araclar/kendi/tibbi'

const A = UZ_ARAYUZ.araclar!
const BUGUN = '2026-10-14'
const calistir = (anahtar: string, g: Record<string, string | number | boolean | null>) => {
  const p = A.araclar.find((x) => x.anahtar === anahtar)!
  const tanim = (A.kendiAraclari ?? []).find((t) => t.anahtar === anahtar)!
  return aracCalistir({ tanim, paket: p }, g, BUGUN, A)
}

describe('uz essential-medicines annex', () => {
  it('502 numbered rows, first and last as the annex prints them', () => {
    assert.equal(UZ_ASOSIY_QATORLAR.length, 502)
    assert.equal(UZ_ASOSIY_QATORLAR[0].inn, 'Izofluran')
    assert.equal(UZ_ASOSIY_QATORLAR[0].shakl, '100 ml; 250 ml ingalyatsiya uchun eritma')
    assert.equal(UZ_ASOSIY_QATORLAR[501].inn, 'Gozalidon (Gosalidon)')
    assert.equal(UZ_ASOSIY_QATORLAR[501].shakl, 'tabletkalar 100 mg')
    assert.equal(new Set(UZ_ASOSIY_QATORLAR.map((r) => r.anahtar)).size, 502)
  })

  it('choosing the first row returns its annex position and not a prescription count', () => {
    const s = calistir('uz-asosiy-dorilar', { dori: 'q001' })
    assert.equal(s.tamam, true)
    assert.equal(s.sayilar[0].deger, 1)
    assert.deepEqual([...s.uyarilar], ['royxat'])
    assert.equal(JSON.stringify(s).includes('502'), false)
  })

  it('a prescription note is the same row, and it says it was not sent', () => {
    const s = calistir('uz-retsept-qaydi', { dori: 'q001', miqdor: 1, yol: 'QA-TEXT-yol' })
    assert.equal(s.sayilar.find((x) => x.anahtar === 'sira')?.deger, 1)
    assert.equal(s.sayilar.find((x) => x.anahtar === 'miqdor')?.deger, 1)
    assert.deepEqual([...s.uyarilar], ['royxat', 'yuborilmadi'])
  })
})

describe('uz flyer and narcotic ticks', () => {
  it('eleven flyer ages, and a tick is a record with the flyer warning', () => {
    const anahtarlar = UZ_EMLASH_TAQVIMI.alanlar.map((a) => a.anahtar)
    assert.deepEqual(anahtarlar, ['kun1', 'kun2', 'oy2', 'oy3', 'oy4', 'oy12', 'oy16', 'yosh6', 'yosh7', 'yosh9', 'yosh16'])
    const g = Object.fromEntries(anahtarlar.map((k) => [k, k === 'kun1']))
    const s = calistir('uz-emlash-taqvimi', g)
    assert.equal(s.sayilar[0].deger, 1)
    assert.deepEqual([...s.uyarilar], ['varaqa'])
  })

  it('nine narcotic ticks, and an incomplete set stays incomplete', () => {
    const anahtarlar = UZ_GIYOHVAND_QOIDALARI.alanlar.map((a) => a.anahtar)
    assert.equal(anahtarlar.length, 9)
    const bir = Object.fromEntries(anahtarlar.map((k) => [k, k === 'muassasa']))
    const s = calistir('uz-giyohvand-qoidalari', bir)
    assert.ok(s.uyarilar.includes('toliq_emas'))
    assert.ok(s.uyarilar.includes('yuborilmadi'))
    const hepsi = Object.fromEntries(anahtarlar.map((k) => [k, true]))
    const t = calistir('uz-giyohvand-qoidalari', hepsi)
    assert.equal(t.uyarilar.includes('toliq_emas'), false)
    assert.ok(t.uyarilar.includes('yuborilmadi'))
  })
})

describe('uz record services: configured, not connected', () => {
  it('every service is explicitly unconnected', () => {
    assert.deepEqual(UZ_KAYIT_SISTEMLERI.map((s) => s.anahtar), ['dmed', 'mygov'])
    for (const s of UZ_KAYIT_SISTEMLERI) {
      assert.equal(s.bagli, false)
      assert.match(s.adres, /^https:\/\//)
      assert.ok(s.kayit.length > 0, s.anahtar)
    }
  })

  it('a FHIR draft carries the annex name, status draft, and no person identifier', () => {
    assert.equal(uzFhirTaslak({ ad: '  ' }), null)
    const b = uzFhirTaslak({ ad: UZ_ASOSIY_QATORLAR[0].lotin, miktar: 1, yon: 'as written' })!
    assert.equal(b.resourceType, 'Bundle')
    const kaynak = (b.entry as { resource: Record<string, unknown> }[])[0].resource
    assert.equal(kaynak.status, 'draft')
    assert.equal((kaynak.medicationCodeableConcept as { text: string }).text, UZ_ASOSIY_QATORLAR[0].lotin)
    assert.equal(JSON.stringify(b).includes('patient'), false)
    assert.match(JSON.stringify(b), /Not submitted/)
  })

  it('interactions, diagnosis codes, and laboratory panels stay empty', () => {
    assert.equal(UZ_ETKILESIM.bagli, false)
    assert.equal(UZ_ETKILESIM.juftlar.length, 0)
    assert.equal(UZ_ETKILESIM.sozlesmeGerekli, true)
    assert.equal(UZ_TANI_KODLARI.satirlar.length, 0)
    assert.equal(UZ_LAB_KATALOG.paneller.length, 0)
    assert.equal(UZ_LAB_KATALOG.birimler.hemoglobin?.birim, 'g/L')
    assert.equal(UZ_LAB_KATALOG.birimler.kreatinin, undefined)
  })
})
