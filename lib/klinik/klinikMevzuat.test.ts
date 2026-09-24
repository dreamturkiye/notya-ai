import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'
import { doktorAraclariListesi } from '@/lib/doktor/doktorAraclari'
import { klinikAraclariListesi } from '@/lib/klinik/klinikAraclari'
import {
  KLINIK_MEVZUAT,
  KLINIK_ORTAK_KANUNLAR,
  klinikMevzuat,
  klinikMevzuatOzet,
  muttefikHekimPlaniZorunlu,
} from './klinikMevzuat'

describe('KLINIK_MEVZUAT — SB / KVKK / kayıt', () => {
  it('10 dalın kanun + qos + kvkk + kayit + rıza + yasak paketi var', () => {
    for (const slug of KLINIK_YENI_SLUGS) {
      const m = KLINIK_MEVZUAT[slug]
      assert.ok(m.kanunlar.length >= 6, slug)
      assert.ok(m.qos.length >= 3, slug)
      assert.ok(m.kvkk.length >= 1, slug)
      assert.ok(m.kayit.length >= 2, slug)
      assert.ok(m.riza.length >= 1, slug)
      assert.ok(m.yasak.length >= 2, slug)
      assert.ok(KLINIK_ORTAK_KANUNLAR.some((k) => k.includes('KVKK')))
    }
  })

  it('müttefik: hekim planı, rıza, tetkik yasağı; odyo sessiz oda', () => {
    for (const slug of ['fizyoterapi', 'klinik-psikolog', 'diyetisyen', 'ergoterapi', 'odyoloji'] as const) {
      assert.equal(KLINIK_MEVZUAT[slug].rejim, 'muttefik')
      assert.equal(muttefikHekimPlaniZorunlu(slug), true)
      assert.ok(KLINIK_MEVZUAT[slug].kanunlar.some((k) => k.includes('29.03.2025')))
      assert.ok(KLINIK_MEVZUAT[slug].yasak.some((y) => /tetkik|teşhis|tanı/i.test(y)), slug)
    }
    assert.ok(KLINIK_MEVZUAT.odyoloji.qos.some((q) => q.includes('3 m²')))
    assert.ok(KLINIK_MEVZUAT.diyetisyen.yasak.some((y) => y.includes('takviye')))
    assert.ok(KLINIK_MEVZUAT['klinik-psikolog'].kvkk.some((k) => k.includes('Ruh sağlığı')))
  })

  it('hekim klinik: Ayakta Teşhis kayıt; saç/estetik foto KVKK', () => {
    for (const slug of ['sac-ekimi', 'estetik-cerrahi', 'medikal-estetik', 'klinik-dermatoloji', 'longevity'] as const) {
      assert.equal(KLINIK_MEVZUAT[slug].rejim, 'hekim-klinik')
      assert.ok(KLINIK_MEVZUAT[slug].kanunlar.some((k) => k.includes('Ayakta Teşhis')))
      assert.ok(KLINIK_MEVZUAT[slug].kayit.some((k) => k.includes('md.24') || k.includes('elektronik')))
    }
    assert.ok(KLINIK_MEVZUAT['sac-ekimi'].kvkk.some((k) => k.includes('foto')))
    assert.equal(klinikMevzuat('kardiyoloji'), null)
    assert.ok(klinikMevzuatOzet('fizyoterapi').includes('29.03.2025'))
  })

  it('kayıt-kvkk aracı 10 dalda; Doktor gridine sızmaz', () => {
    for (const slug of KLINIK_YENI_SLUGS) {
      assert.ok(klinikAraclariListesi(slug).some((a) => a.route === '/klinik-tools/kayit-kvkk'), slug)
      assert.ok(klinikAraclariListesi(slug).some((a) => a.route === '/klinik-tools/hasta-portali'), slug)
    }
    assert.equal(doktorAraclariListesi('kardiyoloji').some((a) => a.route.includes('kayit-kvkk')), false)
    assert.equal(doktorAraclariListesi('dermatoloji').some((a) => a.route.startsWith('/klinik-tools/')), false)
  })
})
