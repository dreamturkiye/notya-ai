import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  klinikSlugCoz,
  klinikLandingSlugCoz,
  klinikUzmanlikNorm,
  muttefikMeslekMi,
  hekimKlinikMi,
  muttefikAracGizliMi,
  KLINIK_YENI_SLUGS,
} from './klinikDikey'

describe('KLINIK-10-EXCEPTIONAL dikey', () => {
  it('landing 10 dal kanonik Klinik slug olur', () => {
    assert.equal(klinikSlugCoz('Sac Ekimi'), 'sac-ekimi')
    assert.equal(klinikSlugCoz('Estetik & Plastik Cerrahi'), 'estetik-cerrahi')
    assert.equal(klinikSlugCoz('estetik-cerrahi'), 'estetik-cerrahi')
    assert.equal(klinikSlugCoz('Medikal Estetik'), 'medikal-estetik')
    assert.equal(klinikSlugCoz('klinik-dermatoloji'), 'klinik-dermatoloji')
    assert.equal(klinikSlugCoz('Klinik Dermatoloji'), 'klinik-dermatoloji')
    assert.equal(klinikSlugCoz('Longevity & Wellness'), 'longevity')
    assert.equal(klinikSlugCoz('Fizyoterapi'), 'fizyoterapi')
    assert.equal(klinikSlugCoz('Klinik Psikoloji'), 'klinik-psikolog')
    assert.equal(klinikSlugCoz('Diyetisyen'), 'diyetisyen')
    assert.equal(klinikSlugCoz('Ergoterapi'), 'ergoterapi')
    assert.equal(klinikSlugCoz('Odyoloji'), 'odyoloji')
  })

  it('çıplak dermatoloji TUS kalır; landing dermatoloji Klinik dalına map olur', () => {
    assert.equal(klinikSlugCoz('dermatoloji'), null)
    assert.equal(klinikSlugCoz('Dermatoloji'), null)
    assert.equal(klinikLandingSlugCoz('dermatoloji'), 'klinik-dermatoloji')
    assert.notEqual(klinikSlugCoz('estetik-cerrahi'), 'plastik-cerrahi')
  })

  it('fizyoterapi FTR değildir; klinik psikolog psikiyatri değildir', () => {
    assert.equal(klinikSlugCoz('fizyoterapi'), 'fizyoterapi')
    assert.notEqual(klinikSlugCoz('fizyoterapi'), 'fizik-tedavi')
    assert.ok(muttefikMeslekMi('Fizyoterapi'))
    assert.equal(muttefikMeslekMi('sac-ekimi'), false)
    assert.ok(hekimKlinikMi('estetik-cerrahi'))
    assert.ok(hekimKlinikMi('klinik-dermatoloji'))
    assert.equal(hekimKlinikMi('odyoloji'), false)
  })

  it('müttefik reçete / Medula / ICD araçlarını gizler', () => {
    assert.equal(muttefikAracGizliMi('/doktor-tools/erecete'), true)
    assert.equal(muttefikAracGizliMi('/doktor-tools/hasta-portali'), false)
  })

  it('10 dal tam', () => {
    assert.equal(klinikUzmanlikNorm('Sac Ekimi'), 'sac-ekimi')
    assert.equal(KLINIK_YENI_SLUGS.length, 10)
  })
})
