/**
 * KD-TARAMA-01 (2026-11-09) — Uzbekistan: the four O&G records are on for obstetrics and gynaecology only (leak test: no
 * other role), in the three forms, with the national HPV entry and the WHO dose counts (international), no country numbers
 * for the thyroid fallback (Uzbek rule: none without a local clinician), and a clean pack check.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { araclarSorunlari } from '@/lib/ulke/araclar/denetim'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { KD_TARAMA_ARACLARI } from '@/lib/ulke/araclar/tanimlar/kdTaramalar'
import { UZ_ARAYUZ } from './arayuz'
import { UZ_PAKETI } from './index'

const A = UZ_ARAYUZ.araclar as UlkeAraclari
const ARAC = (k: string) => A.araclar.find((p) => p.anahtar === k)

describe('KD-TARAMA-01 — Uzbekistan', () => {
  it('all four records are on, obstetrics and gynaecology only', () => {
    for (const t of KD_TARAMA_ARACLARI) assert.deepEqual(ARAC(t.anahtar)?.roller, ['kadin-hastaliklari-dogum'], t.anahtar)
  })
  it('three forms for every name; the HPV note names the national schedule entry and the international dose source', () => {
    for (const t of KD_TARAMA_ARACLARI) for (const f of ['uz-Latn', 'uz-Cyrl', 'ru'] as const) assert.ok(String(ARAC(t.anahtar)!.metin.ad[f] ?? '').length > 5, `${t.anahtar} ${f}`)
    assert.match(String(ARAC('hpv-asi-kaydi')!.metin.not?.ru), /9 лет/)
    assert.match(String(ARAC('hpv-asi-kaydi')!.metin.not?.ru), /Всемирная организация здравоохранения/)
  })
  it('no country number for the thyroid fallback (Uzbek rule); the HPV table is the WHO schedule', () => {
    assert.equal(ARAC('gebelik-tiroid')!.parametreler, undefined)
    assert.equal(ARAC('hpv-asi-kaydi')!.tablolar?.hpv_takvimi?.satirlar.length, 4)
  })
  it('the pack check finds nothing to fix in the four records', () => {
    const s = araclarSorunlari(UZ_PAKETI, UZ_ARAYUZ, UZ_PAKETI.diller).filter((x) => /gebelik-tiroid|hpv-asi-kaydi|sma-tasiyicilik|pmdd-gunluk-ozeti/.test(JSON.stringify(x)))
    assert.deepEqual(s, [])
  })
})
