/**
 * ULKE-BRANS-DERINLIK-2026-11 — Canada: every role this pack offers gives the live assistant this country's own practice
 * sources (./asistanKaynaklari.ts), no other country's, and a role-specific body sits on its own roles only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CA_ARAYUZ } from './arayuz'
import { CA_KLINIK } from './klinik'
import { CA_ASISTAN_KAYNAKLARI, caAsistanKaynakBlogu } from './asistanKaynaklari'

const ROLLER = CA_ARAYUZ!.roller.map((r) => r.anahtar)

describe('ca: per-role practice sources for the live assistant (ULKE-BRANS-DERINLIK-2026-11)', () => {
  it('exactly the offered roles have sources; an unknown key has none', () => {
    assert.deepEqual(Object.keys(CA_ASISTAN_KAYNAKLARI).sort(), [...ROLLER].sort())
    assert.equal(caAsistanKaynakBlogu('no-such-role'), null)
  })

  it('the live assistant receives the block for every role (not null any more)', () => {
    const c = CA_KLINIK!.canliAsistan!
    for (const rol of ROLLER) {
      const b = c.kaynakBlogu(rol)
      assert.ok(b && b.includes('CANADIAN PRACTICE SOURCES'), rol)
      assert.ok(CA_ASISTAN_KAYNAKLARI[rol].length >= 2, rol)
      assert.equal(new Set(CA_ASISTAN_KAYNAKLARI[rol]).size, CA_ASISTAN_KAYNAKLARI[rol].length, rol)
    }
  })

  it('no source of Türkiye or of another country, no claim of approval, no edition or guideline number', () => {
    const hepsi = Object.values(CA_ASISTAN_KAYNAKLARI).flat().join('\n')
    assert.doesNotMatch(hepsi, /\b(Turkey|Turkish|SGK|Australia|Australian|NHS|NICE|Zealand|Medicare|FDA|CDC|Uzbekistan|United Kingdom)\b/)
    assert.doesNotMatch(hepsi, /\b(approved|endorsed|certified|compliant|accredited)\b/i)
    assert.doesNotMatch(hepsi, /\b(NG|CG|QS)\d+\b|\b(19|20)\d\d\b|edition/i)
  })

  it('role-specific bodies stay on their roles (no cross-specialty bleed)', () => {
    const sahibi = (desen: RegExp) => ROLLER.filter((r) => CA_ASISTAN_KAYNAKLARI[r].some((x) => desen.test(x))).sort()
    assert.deepEqual(sahibi(/Canadian Paediatric Society/), ['paediatric-surgery', 'paediatrics'])
    assert.deepEqual(sahibi(/Obstetricians and Gynaecologists/), ['obstetrics-gynaecology', 'reproductive-endocrinology'])
    assert.deepEqual(sahibi(/Allergy and Clinical Immunology/), ['clinical-immunology-allergy'])
    assert.deepEqual(sahibi(/Canadian Pain Society/), ['pain-medicine'])
    assert.deepEqual(sahibi(/Thoracic Society/), ['respiratory-medicine'])
    assert.deepEqual(sahibi(/Counselling and Psychotherapy/), ['psychotherapy'])
  })
})
