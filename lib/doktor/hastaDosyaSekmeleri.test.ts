import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  gebelikSekmesiUygun,
  hastaDosyaSekmeleri,
  ozelBolumBransi,
  pediatriAracSekmesiUygun,
  pediatriSekmesiUygun,
  muayeneAltiSekmeler,
} from './hastaDosyaSekmeleri'

const NOW = Date.parse('2026-09-15T00:00:00Z')

describe('hastaDosyaSekmeleri', () => {
  it('hides M-CHAT, gelişim, and büyüme tabs on adult patients', () => {
    assert.equal(pediatriSekmesiUygun('1998-04-01', NOW), false)
    const adult = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, deriUygun: false })
    const labels = adult.map((t) => t.label)
    assert.equal(labels.includes('M-CHAT-R/F'), false)
    assert.equal(labels.includes('Gelişim Taraması'), false)
    assert.equal(labels.includes('Büyüme Eğrileri'), false)
    assert.equal(labels.includes('Deri & Lezyon'), false)
  })

  it('shows Deri only when deriUygun (dermatoloji doctor)', () => {
    const derm = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, deriUygun: true })
    assert.ok(derm.some((t) => t.id === 'deri'))
    const goz = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, gozUygun: true, deriUygun: false })
    assert.equal(goz.some((t) => t.id === 'deri'), false)
    assert.ok(goz.some((t) => t.id === 'goz'))
  })

  it('keeps pediatric tabs for a child; KD lives under Muayene Geçmişi (not top-level)', () => {
    assert.equal(pediatriSekmesiUygun('2022-01-10', NOW), true)
    assert.equal(gebelikSekmesiUygun({ cinsiyet: 'Kadın', dogumIso: '1995-06-01' }, NOW), true)
    assert.equal(gebelikSekmesiUygun({ cinsiyet: 'Erkek', dogumIso: '1995-06-01' }, NOW), false)
    const woman = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: true })
    assert.equal(woman.some((t) => t.id === 'gebelik'), false)
    assert.ok(muayeneAltiSekmeler(true).some((t) => t.id === 'gebelik'))
    assert.equal(muayeneAltiSekmeler(false).some((t) => t.id === 'gebelik'), false)
    assert.equal(woman.some((t) => t.id === 'mchat'), false)
    const child = hastaDosyaSekmeleri({ pediatriUygun: true, gebelikUygun: false })
    assert.ok(child.some((t) => t.id === 'mchat'))
    assert.ok(child.some((t) => t.id === 'gelisim'))
    assert.ok(child.some((t) => t.id === 'buyume'))
    assert.ok(child.some((t) => t.id === 'bebek'))
  })

  it('CHART-TAB-POLICY: göz doctor does not get ped tabs even for a child', () => {
    assert.equal(ozelBolumBransi('Göz Hastalıkları'), true)
    assert.equal(ozelBolumBransi('aile hekimliği'), false)
    assert.equal(
      pediatriAracSekmesiUygun({ dogumIso: '2022-01-10', doktorBransi: 'goz-hastaliklari', pediatriDoktoru: false }, NOW),
      false,
    )
    assert.equal(
      pediatriAracSekmesiUygun({ dogumIso: '2022-01-10', doktorBransi: 'aile hekimliği', pediatriDoktoru: false }, NOW),
      true,
    )
    assert.equal(
      pediatriAracSekmesiUygun({ dogumIso: '2022-01-10', doktorBransi: 'pediatri', pediatriDoktoru: true }, NOW),
      true,
    )
  })

  it('KBB-EXCEPTIONAL-01: KBB sekmesi yalnız kbbUygun; yabancı branşta yok', () => {
    const kbb = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, kbbUygun: true })
    assert.ok(kbb.some((t) => t.id === 'kbb' && t.label === 'KBB'))
    const psik = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, psikiyatriUygun: true })
    assert.equal(psik.some((t) => t.id === 'kbb'), false)
    assert.ok(psik.some((t) => t.id === 'psikiyatri'))
    const goz = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, gozUygun: true })
    assert.equal(goz.some((t) => t.id === 'kbb'), false)
    assert.equal(ozelBolumBransi('Kulak Burun Boğaz'), true)
    assert.equal(ozelBolumBransi('kulak-burun-bogaz'), true)
  })
})
