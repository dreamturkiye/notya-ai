import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  gebelikSekmesiUygun,
  hastaDosyaSekmeleri,
  pediatriSekmesiUygun,
} from './hastaDosyaSekmeleri'

const NOW = Date.parse('2026-09-15T00:00:00Z')

describe('hastaDosyaSekmeleri', () => {
  it('hides M-CHAT, gelişim, and büyüme tabs on adult patients', () => {
    assert.equal(pediatriSekmesiUygun('1998-04-01', NOW), false)
    const adult = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false })
    const labels = adult.map((t) => t.label)
    assert.equal(labels.includes('M-CHAT-R/F'), false)
    assert.equal(labels.includes('Gelişim Taraması'), false)
    assert.equal(labels.includes('Büyüme Eğrileri'), false)
    assert.ok(labels.includes('Deri & Lezyon'))
  })

  it('keeps pediatric tabs for a child and KD for an adult woman', () => {
    assert.equal(pediatriSekmesiUygun('2022-01-10', NOW), true)
    assert.equal(gebelikSekmesiUygun({ cinsiyet: 'Kadın', dogumIso: '1995-06-01' }, NOW), true)
    assert.equal(gebelikSekmesiUygun({ cinsiyet: 'Erkek', dogumIso: '1995-06-01' }, NOW), false)
    const woman = hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: true })
    assert.ok(woman.some((t) => t.id === 'gebelik'))
    assert.equal(woman.some((t) => t.id === 'mchat'), false)
    const child = hastaDosyaSekmeleri({ pediatriUygun: true, gebelikUygun: false })
    assert.ok(child.some((t) => t.id === 'mchat'))
    assert.ok(child.some((t) => t.id === 'gelisim'))
    assert.ok(child.some((t) => t.id === 'buyume'))
  })
})
