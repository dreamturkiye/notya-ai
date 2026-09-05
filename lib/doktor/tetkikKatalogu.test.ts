import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TETKIK_KATALOGU, TETKIK_PANELLERI, TUM_TETKIKLER } from './tetkikKatalogu'

describe('tetkikKatalogu TR compliance', () => {
  it('has no duplicate test names within the catalog', () => {
    const names = TUM_TETKIKLER.map((t) => t.ad)
    const uniq = new Set(names)
    assert.equal(uniq.size, names.length, `duplicates: ${names.filter((n, i) => names.indexOf(n) !== i).join(', ')}`)
  })

  it('panel entries all resolve to catalog tests', () => {
    const set = new Set(TUM_TETKIKLER.map((t) => t.ad))
    for (const [panel, tests] of Object.entries(TETKIK_PANELLERI)) {
      for (const name of tests) {
        assert.ok(set.has(name), `${panel} → missing "${name}"`)
      }
    }
  })

  it('uses Turkish ESH naming (not bare ESR-only duplicates)', () => {
    assert.ok(TUM_TETKIKLER.some((t) => t.ad.includes('Eritrosit sedimantasyon hızı')))
    assert.equal(TUM_TETKIKLER.filter((t) => /sedimentasyon|sedimantasyon|esr/i.test(t.ad)).length, 1)
  })

  it('covers core outpatient TR staples', () => {
    const blob = TUM_TETKIKLER.map((t) => t.ad).join(' | ')
    for (const must of [
      'Tam kan sayımı (Hemogram)',
      'Tam idrar tetkiki (TİT)',
      'HbA1c',
      'TSH',
      'TDBK',
      'aPTT (APTZ)',
      'Semen analizi (spermogram)',
      'Gruber-Widal',
      'Rose Bengal',
    ]) {
      assert.match(blob, new RegExp(must.replace(/[()]/g, '\\$&')))
    }
  })

  it('keeps major clinical sections', () => {
    const bolumler = TETKIK_KATALOGU.map((b) => b.bolum)
    for (const b of ['Rutin Biyokimya', 'Hematoloji', 'Tiroid', 'İdrar Tetkikleri', 'Enfeksiyon Serolojisi', 'Mikrobiyoloji — Kültürler']) {
      assert.ok(bolumler.includes(b), b)
    }
  })
})
