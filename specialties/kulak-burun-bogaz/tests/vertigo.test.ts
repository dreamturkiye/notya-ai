import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  vertigoNotu, MANEVRA_LISTESI, MANEVRA_AD, SONUC_AD, SANTRAL_ISARETLERI, NISTAGMUS_OZELLIKLERI,
  manevraSonrasiKontrolGun,
} from '@/specialties/kulak-burun-bogaz/engines/vertigo'

describe('KBB-EXCEPTIONAL-01 vertigo / manevra notu', () => {
  it('records Dix-Hallpike result as exam finding without writing BPPV diagnosis', () => {
    const s = vertigoNotu({
      manevralar: [{ manevra: 'dix_hallpike', yan: 'sag', sonuc: 'pozitif' }],
      nistagmus: ['Torsiyonel / yukarı vuran', 'Latans var (birkaç saniye gecikme)'],
      santralIsaretleri: [],
      kulakBelirtisi: false,
    })
    assert.equal(s.manevraUygunMu, true)
    assert.match(s.metin, /Dix-Hallpike/)
    assert.match(s.metin, /Pozitif/)
    assert.doesNotMatch(s.metin, /BPPV|Meniere|vestib[üu]ler n[öo]rit/i)
    assert.match(s.metin, /tanı.*hekim/i)
  })

  it('blocks reposition suitability when any central-suspicion flag is marked', () => {
    const s = vertigoNotu({
      manevralar: [{ manevra: 'epley', yan: 'sag', sonuc: 'pozitif' }],
      nistagmus: [],
      santralIsaretleri: [SANTRAL_ISARETLERI[0]],
      kulakBelirtisi: false,
    })
    assert.equal(s.manevraUygunMu, false)
    assert.ok(s.uyarilar.some((u) => /112|acil/i.test(u)))
    assert.ok(s.uyarilar.some((u) => /repozisyon/i.test(u)))
    assert.doesNotMatch(s.metin, /BPPV|Meniere|vestib[üu]ler n[öo]rit/i)
  })

  it('keeps maneuver catalog stable and clinician-facing', () => {
    assert.ok(MANEVRA_LISTESI.includes('dix_hallpike'))
    assert.ok(MANEVRA_LISTESI.includes('epley'))
    assert.match(MANEVRA_AD.dix_hallpike, /Dix-Hallpike/)
    assert.match(SONUC_AD.pozitif, /Pozitif/)
    assert.ok(NISTAGMUS_OZELLIKLERI.length >= 5)
    assert.ok(SANTRAL_ISARETLERI.length >= 4)
  })

  it('follow-up calendar tightens when central suspicion blocks maneuver', () => {
    const uygun = vertigoNotu({ manevralar: [], nistagmus: [], santralIsaretleri: [], kulakBelirtisi: false })
    const blok = vertigoNotu({ manevralar: [], nistagmus: [], santralIsaretleri: [SANTRAL_ISARETLERI[0]], kulakBelirtisi: false })
    assert.equal(manevraSonrasiKontrolGun(uygun), 7)
    assert.equal(manevraSonrasiKontrolGun(blok), 1)
  })

  it('never invents dose or drug language', () => {
    const s = vertigoNotu({
      manevralar: [{ manevra: 'supine_roll', yan: 'sol', sonuc: 'negatif' }],
      nistagmus: ['Horizontal'],
      santralIsaretleri: [],
      kulakBelirtisi: true,
      hekimNotu: 'Kontrol planlandı',
    })
    assert.doesNotMatch(s.metin, /\d+\s*mg\b|betahistin|dimenhidrinat|günde/i)
  })
})
