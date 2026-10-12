/**
 * One emergency number per country pack. A second public line is not shown.
 * Türkiye is the pre-split application and is not one of these packs.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { ulkePaketi } from './ulke'

const BEKLENEN: Record<string, string> = { us: '911', gb: '999', ca: '911', au: '000', nz: '111', uz: '103' }
const KALIP = /\b(911|999|000|111|112|103|101|102|104|988)\b/g

function metinler(x: unknown, out: string[]) {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) for (const y of x) metinler(y, out)
  else if (x && typeof x === 'object') for (const y of Object.values(x)) metinler(y, out)
}

describe('one emergency number', () => {
  it('the pack names exactly one number, and the intake form does not add another', () => {
    const kod = ulkePaketi().kod
    if (kod === 'tr') return
    const n = BEKLENEN[kod]
    assert.ok(n, `${kod} has no expected emergency number in this test`)
    assert.equal(ulkePaketi().uygulama?.portal?.acilNumara, n)
    const parcalar: string[] = []
    metinler(AKTIF_KLINIK?.hastaFormu, parcalar)
    const bulunan = new Set<string>()
    for (const p of parcalar) for (const m of p.matchAll(KALIP)) bulunan.add(m[1])
    assert.deepEqual([...bulunan].sort(), [n])
  })
})
