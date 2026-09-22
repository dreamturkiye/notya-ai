import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  klinikSlugCoz,
  klinikUzmanlikNorm,
  muttefikMeslekMi,
  hekimKlinikMi,
  muttefikAracGizliMi,
  KLINIK_YENI_SLUGS,
} from './klinikDikey'

describe('KLINIK-AYNA-01 dikey', () => {
  it('landing etiketleri kanonik slug olur', () => {
    assert.equal(klinikSlugCoz('Sac Ekimi'), 'sac-ekimi')
    assert.equal(klinikSlugCoz('Saç Ekimi'), 'sac-ekimi')
    assert.equal(klinikSlugCoz('Medikal Estetik'), 'medikal-estetik')
    assert.equal(klinikSlugCoz('Longevity & Wellness'), 'longevity')
    assert.equal(klinikSlugCoz('Fizyoterapi'), 'fizyoterapi')
    assert.equal(klinikSlugCoz('Klinik Psikoloji'), 'klinik-psikolog')
    assert.equal(klinikSlugCoz('Psikoloji'), 'klinik-psikolog')
    assert.equal(klinikSlugCoz('Diyetisyen'), 'diyetisyen')
    assert.equal(klinikSlugCoz('Ergoterapi'), 'ergoterapi')
    assert.equal(klinikSlugCoz('Odyoloji'), 'odyoloji')
  })

  it('estetik-cerrahi / dermatoloji TUS’a alias olmaz — Klinik ayrı kategori', () => {
    assert.equal(klinikSlugCoz('estetik-cerrahi'), null)
    assert.equal(klinikSlugCoz('Estetik & Plastik Cerrahi'), null)
    assert.equal(klinikSlugCoz('dermatoloji'), null)
  })

  it('fizyoterapi FTR değildir; klinik psikolog psikiyatri değildir', () => {
    assert.equal(klinikSlugCoz('fizyoterapi'), 'fizyoterapi')
    assert.notEqual(klinikSlugCoz('fizyoterapi'), 'fizik-tedavi')
    assert.equal(klinikSlugCoz('klinik-psikolog'), 'klinik-psikolog')
    assert.ok(muttefikMeslekMi('Fizyoterapi'))
    assert.ok(muttefikMeslekMi('klinik-psikolog'))
    assert.equal(muttefikMeslekMi('sac-ekimi'), false)
    assert.ok(hekimKlinikMi('Saç Ekimi'))
    assert.equal(hekimKlinikMi('odyoloji'), false)
  })

  it('müttefik reçete / Medula / ICD araçlarını gizler', () => {
    assert.equal(muttefikAracGizliMi('/doktor-tools/erecete'), true)
    assert.equal(muttefikAracGizliMi('/doktor-tools/hasta-portali'), false)
    assert.equal(muttefikAracGizliMi('/doktor-tools/sac-greft'), false)
  })

  it('norm slug üretir; 8 yeni dal tam', () => {
    assert.equal(klinikUzmanlikNorm('Sac Ekimi'), 'sac-ekimi')
    assert.equal(KLINIK_YENI_SLUGS.length, 8)
  })
})
