/**
 * PREMATURE-MODUL — Büyüme persentili düzeltilmiş yaşla (engines/buyume.ts → olcumSatirlari, gestasyonGun parametresi).
 * Kural: doğumda < 37 hafta → kronolojik takvim ayı 24'e ulaşana kadar düzeltilmiş yaş; term bebekler değişmez;
 * düzeltilmiş yaş < 0 ise referans uygulanamaz (persentil yok).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { olcumSatirlari, degerlendir } from '../engines/buyume'
import { gestasyonGunu } from '@/lib/clinical/prematur/duzeltilmisYas'

const DOGUM = '2026-01-10'
const G28 = gestasyonGunu(28)! // 196 gün → 12 hafta (84 gün) erken
const G36_6 = gestasyonGunu(36 + 6 / 7)!
const G37 = gestasyonGunu(37)!

describe('olcumSatirlari — düzeltilmiş yaş', () => {
  it('gestasyon verilmezse davranış değişmez (kronolojik)', () => {
    const [a] = olcumSatirlari('neyzi', 'male', DOGUM, [{ tarih: '2026-07-10', boy: 66 }])
    assert.equal(a.duzeltilmis, false)
    assert.equal(a.egriAy, a.ay)
    assert.deepEqual(a.sonuc.boy, degerlendir('neyzi', 'boy', 'male', a.ay, 66))
  })

  it('term bebek (≥ 37 hf) hiç düzeltilmez', () => {
    const [t] = olcumSatirlari('neyzi', 'male', DOGUM, [{ tarih: '2026-07-10', boy: 66 }], G37)
    assert.equal(t.duzeltilmis, false)
    assert.equal(t.egriAy, t.ay)
    const [t40] = olcumSatirlari('neyzi', 'male', DOGUM, [{ tarih: '2026-07-10', boy: 66 }], 280)
    assert.equal(t40.duzeltilmis, false)
  })

  it('28 hf bebek 6. ayda: persentil düzeltilmiş yaşla (≈ 3 ay) hesaplanır', () => {
    const [s] = olcumSatirlari('neyzi', 'female', DOGUM, [{ tarih: '2026-07-10', boy: 62, kilo: 6.2 }], G28)
    assert.equal(s.duzeltilmis, true)
    assert.equal(s.termOncesi, false)
    // 181 gün − 84 gün = 97 gün
    assert.ok(Math.abs(s.egriAy! - 97 / 30.4375) < 1e-9)
    assert.deepEqual(s.sonuc.boy, degerlendir('neyzi', 'boy', 'female', 97 / 30.4375, 62))
    // kronolojik 6 ay için aynı ölçü farklı (daha düşük) persentil verir → düzeltme anlamlı
    const kron = degerlendir('neyzi', 'boy', 'female', s.ay, 62)!
    assert.ok(s.sonuc.boy!.persentil > kron.persentil)
    assert.ok(Math.abs(s.ay - 181 / 30.4375) < 1e-9, 'ay (kronolojik) korunur')
  })

  it('sınır: kronolojik 24. takvim ayında düzeltme biter', () => {
    const [once, tam] = olcumSatirlari('neyzi', 'male', DOGUM, [{ tarih: '2028-01-09', boy: 85 }, { tarih: '2028-01-10', boy: 85 }], G28)
    assert.equal(once.duzeltilmis, true)  // 23 ay 30 gün
    assert.equal(tam.duzeltilmis, false)  // 24. ay doğum günü
    assert.equal(tam.egriAy, tam.ay)
  })

  it('36+6 hf (< 37) düzeltilir: terme 22 gün', () => {
    const [s] = olcumSatirlari('neyzi', 'male', DOGUM, [{ tarih: '2026-03-10', kilo: 5 }], G36_6)
    assert.equal(s.duzeltilmis, true)
    assert.ok(Math.abs((s.ay - s.egriAy!) - 22 / 30.4375) < 1e-9)
  })

  it('düzeltilmiş yaş < 0 (term öncesi): referans uygulanamaz, persentil yok', () => {
    const [s] = olcumSatirlari('neyzi', 'male', DOGUM, [{ tarih: '2026-02-20', kilo: 1.9 }], G28) // 41 gün < 84
    assert.equal(s.termOncesi, true)
    assert.equal(s.egriAy, null)
    assert.equal(s.sonuc.kilo, null)
    assert.equal(s.deger.kilo, 1.9)
  })

  it('WHO referansı da düzeltilmiş yaşı kullanır', () => {
    const [s] = olcumSatirlari('who', 'male', DOGUM, [{ tarih: '2026-07-10', kilo: 6.0 }], G28)
    assert.deepEqual(s.sonuc.kilo, degerlendir('who', 'kilo', 'male', 97 / 30.4375, 6.0))
  })
})
