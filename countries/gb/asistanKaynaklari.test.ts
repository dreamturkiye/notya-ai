/**
 * ULKE-BRANS-DERINLIK-2026-11 — United Kingdom: every role this pack offers gives the live assistant this country's own practice
 * sources (./asistanKaynaklari.ts), no other country's, and a role-specific body sits on its own roles only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { GB_ARAYUZ } from './arayuz'
import { GB_KLINIK } from './klinik'
import { GB_ASISTAN_KAYNAKLARI, gbAsistanKaynakBlogu } from './asistanKaynaklari'

const ROLLER = GB_ARAYUZ!.roller.map((r) => r.anahtar)

describe('gb: per-role practice sources for the live assistant (ULKE-BRANS-DERINLIK-2026-11)', () => {
  it('exactly the offered roles have sources; an unknown key has none', () => {
    assert.deepEqual(Object.keys(GB_ASISTAN_KAYNAKLARI).sort(), [...ROLLER].sort())
    assert.equal(gbAsistanKaynakBlogu('no-such-role'), null)
  })

  it('the live assistant receives the block for every role (not null any more)', () => {
    const c = GB_KLINIK!.canliAsistan!
    for (const rol of ROLLER) {
      const b = c.kaynakBlogu(rol)
      assert.ok(b && b.includes('UNITED KINGDOM PRACTICE SOURCES'), rol)
      assert.ok(GB_ASISTAN_KAYNAKLARI[rol].length >= 2, rol)
      assert.equal(new Set(GB_ASISTAN_KAYNAKLARI[rol]).size, GB_ASISTAN_KAYNAKLARI[rol].length, rol)
    }
  })

  it('no source of Türkiye or of another country, no claim of approval, no edition or guideline number', () => {
    const hepsi = Object.values(GB_ASISTAN_KAYNAKLARI).flat().join('\n')
    assert.doesNotMatch(hepsi, /\b(Turkey|Turkish|SGK|Australia|Australian|Canada|Canadian|Zealand|Medicare|FDA|CDC|Uzbekistan)\b/)
    assert.doesNotMatch(hepsi, /\b(approved|endorsed|certified|compliant|accredited)\b/i)
    assert.doesNotMatch(hepsi, /\b(NG|CG|QS)\d+\b|\b(19|20)\d\d\b|edition/i)
  })

  it('role-specific bodies stay on their roles (no cross-specialty bleed)', () => {
    const sahibi = (desen: RegExp) => ROLLER.filter((r) => GB_ASISTAN_KAYNAKLARI[r].some((x) => desen.test(x))).sort()
    assert.deepEqual(sahibi(/Paediatrics and Child Health/), ['child-adolescent-psychiatry', 'paediatric-surgery', 'paediatrics'])
    assert.deepEqual(sahibi(/BASHH/), ['community-sexual-reproductive-health', 'genito-urinary-medicine'])
    assert.deepEqual(sahibi(/BSACI/), ['allergy'])
    assert.deepEqual(sahibi(/Obstetricians and Gynaecologists/), ['obstetrics-gynaecology'])
    assert.deepEqual(sahibi(/Green Book/), ['family-medicine', 'infectious-diseases', 'paediatrics'])
    assert.deepEqual(sahibi(/Royal College of Podiatry/), ['podiatry'])
  })
})
