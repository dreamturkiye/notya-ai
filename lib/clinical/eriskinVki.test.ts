import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { eriskinVkiHesapla, eriskinVkiSiniflandir, eriskinVkiVitalerden, eriskinVkiYasUygun } from './eriskinVki'
import { buyumePersentilleriniHesapla } from './buyumeEgrisi'

describe('eriskinVki', () => {
  it('classifies WHO adult BMI bands', () => {
    assert.equal(eriskinVkiSiniflandir(17).etiket, 'Zayıf')
    assert.equal(eriskinVkiSiniflandir(22).etiket, 'Normal')
    assert.equal(eriskinVkiSiniflandir(27).etiket, 'Fazla kilolu')
    assert.equal(eriskinVkiSiniflandir(32).etiket, 'Obez (sınıf I)')
    assert.equal(eriskinVkiSiniflandir(37).etiket, 'Obez (sınıf II)')
    assert.equal(eriskinVkiSiniflandir(42).etiket, 'Obez (sınıf III)')
  })

  it('computes BMI from kilo/boy (62.8 kg, 160 cm → ~24.5 Normal)', () => {
    const r = eriskinVkiHesapla(62.8, 160)
    assert.ok(r)
    assert.equal(r!.sinif, 'normal')
    assert.ok(r!.deger >= 24.4 && r!.deger <= 24.6)
    assert.match(r!.ozet, /Normal/)
  })

  it('returns null for incomplete vitals', () => {
    assert.equal(eriskinVkiHesapla(null, 160), null)
    assert.equal(eriskinVkiHesapla(70, ''), null)
  })

  // DEMO-1121 bug 2: the printed report said "VKİ 15,7 — Zayıf" for a 2-month-old.
  it('never applies adult WHO categories under 18 years (2-month-old → null; adult → category)', () => {
    // 2-month-old: 5.3 kg, 58 cm → BMI 15.8 — would be "Zayıf" with adult cut-offs
    assert.equal(eriskinVkiHesapla(5.3, 58, 2), null)
    assert.equal(eriskinVkiVitalerden({ kilo: 5.3, boy: 58 }, 2), null)
    assert.equal(eriskinVkiHesapla(32, 140, 10 * 12), null, '10-year-old: no adult label')
    assert.equal(eriskinVkiHesapla(55, 165, 17 * 12 + 11), null, '17y11m: still no adult label')
    assert.equal(eriskinVkiYasUygun(215.9), false)
    // adult: same function, category present
    const eriskin = eriskinVkiHesapla(50, 170, 30 * 12)
    assert.ok(eriskin)
    assert.equal(eriskin!.etiket, 'Zayıf')
    assert.equal(eriskinVkiHesapla(50, 170, 18 * 12)!.sinif, 'zayif', '18y exactly → adult')
    // unknown age keeps legacy adult behaviour (adult branş without a birth date)
    assert.equal(eriskinVkiHesapla(62.8, 160)!.sinif, 'normal')
  })

  it('2-month-old: the age/sex percentile path gives no BMI category either (under 2 y)', () => {
    const p = buyumePersentilleriniHesapla({ kilo: 5.3, boy: 58 }, '2026-09-21', 'male', '2026-11-21T10:00:00Z')
    assert.ok(p, 'kilo/boy percentiles still computed')
    assert.equal(p!.vki, undefined)
    assert.equal(p!.vkiSinif, undefined)
  })

  it('print page never re-computes an adult BMI on the client (API decides by age)', () => {
    const kaynak = readFileSync(join(__dirname, '../../app/dashboard/doktor/notlar/[id]/yazdir/page.tsx'), 'utf8')
    assert.ok(!/eriskinVkiVitalerden|eriskinVkiHesapla/.test(kaynak), 'no client-side adult BMI fallback on the print page')
    const api = readFileSync(join(__dirname, '../../app/api/notes/[id]/route.ts'), 'utf8')
    assert.match(api, /eriskinVki: kapsam\.pediatrik \|\| cocukHasta \? null/, 'API gates adult BMI on patient age too')
  })
})
