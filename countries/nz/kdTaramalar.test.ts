/**
 * KD-TARAMA-01 (2026-11-09) — NZ: the four O&G records are on, obstetrics and gynaecology only (never another role: leak test),
 * with this country's HPV table and thyroid numbers, and the pack check finds nothing to fix in them.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { araclarSorunlari } from '@/lib/ulke/araclar/denetim'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { KD_TARAMA_ARACLARI } from '@/lib/ulke/araclar/tanimlar/kdTaramalar'
import { NZ_ARAYUZ } from './arayuz'
import { NZ_PAKETI } from './index'

const A = NZ_ARAYUZ.araclar as UlkeAraclari
const ARAC = (k: string) => A.araclar.find((p) => p.anahtar === k)

describe('KD-TARAMA-01 — NZ', () => {
  it('all four records are on, for obstetrics and gynaecology only', () => {
    for (const t of KD_TARAMA_ARACLARI) {
      const p = ARAC(t.anahtar)
      assert.ok(p, `${t.anahtar} should be on`)
      assert.deepEqual(p!.roller, ['obstetrics-gynaecology'], t.anahtar)
    }
  })
  it('no other role sees them (leak test: every other role of the pack)', () => {
    for (const t of KD_TARAMA_ARACLARI) assert.ok(!(ARAC(t.anahtar)!.roller ?? []).some((r) => r !== 'obstetrics-gynaecology'), t.anahtar)
    const roller = new Set(A.araclar.flatMap((p) => p.roller ?? []))
    assert.ok(roller.size > 5)
  })
  it('the country states its own HPV schedule and thyroid numbers, with its source under the result', () => {
    assert.ok((ARAC('hpv-asi-kaydi')!.tablolar?.hpv_takvimi?.satirlar ?? []).length > 0)
    assert.ok(Object.keys(ARAC('gebelik-tiroid')!.parametreler ?? {}).length > 5)
    for (const t of KD_TARAMA_ARACLARI) assert.ok(Object.values(ARAC(t.anahtar)!.metin.not ?? {}).every((s) => String(s).length > 40), t.anahtar)
  })
  it('the pack check finds nothing to fix in the four records', () => {
    const s = araclarSorunlari(NZ_PAKETI, NZ_ARAYUZ, NZ_PAKETI.diller).filter((x) => /gebelik-tiroid|hpv-asi-kaydi|sma-tasiyicilik|pmdd-gunluk-ozeti/.test(JSON.stringify(x)))
    assert.deepEqual(s, [])
  })
})
