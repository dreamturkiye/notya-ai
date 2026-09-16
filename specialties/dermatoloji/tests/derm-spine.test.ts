import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { lezyonDegerlendir, islemGorevleri, biyolojikKapisi, izotretinoinKapisi, DERM_ONAMLAR, ISLEM_SABLONLARI } from '../engines/derm-spine'

describe('lezyon ABCDE', () => {
  it('≥3 criteria or dermoscopy alert → melanom şüphesi + acil; shave discouraged; ≤2 → follow-up', () => {
    const m = lezyonDegerlendir({ asimetri: true, sinir: true, renk: true, cap6mm: false, evrim: false }, false, false, 4)
    assert.equal(m.melanomSuphesi, true); assert.equal(m.acil, true); assert.ok(m.oneri.some((o) => o.includes('shave')))
    const d = lezyonDegerlendir({ asimetri: false, sinir: false, renk: false, cap6mm: false, evrim: false }, true, false, 3); assert.equal(d.melanomSuphesi, true)
    const f = lezyonDegerlendir({ asimetri: true, sinir: false, renk: false, cap6mm: false, evrim: false }, false, false, 3); assert.equal(f.melanomSuphesi, false); assert.ok(f.oneri[0].includes('3 ay'))
    const size = lezyonDegerlendir({ asimetri: true, sinir: true, renk: false, cap6mm: false, evrim: false }, false, false, 7); assert.equal(size.abcdePuan, 3)
  })
})
describe('işlem paketi', () => {
  it('biopsies create sütür + patoloji tasks; kriyo only wound care; every kind has onam', () => {
    const p = islemGorevleri('punch', '2026-09-16'); assert.ok(p.some((g) => g.kod === 'sutur_punch')); assert.ok(p.some((g) => g.kod === 'pat_punch')); assert.equal(p.find((g) => g.kod === 'yara_punch')!.due, '2026-09-26')
    assert.equal(islemGorevleri('kriyo', '2026-09-16').length, 1)
    for (const k of Object.keys(ISLEM_SABLONLARI)) assert.ok(DERM_ONAMLAR.some((o) => o.kod === ISLEM_SABLONLARI[k as keyof typeof ISLEM_SABLONLARI].onamKodu), k)
  })
})
describe('biyolojik lab kapısı', () => {
  it('missing/old screens block; positives warn', () => {
    const b = biyolojikKapisi([{ key: 'HBsAg', deger: null, metin: 'Negatif', tarih: '2026-09-01' }, { key: 'Hb', deger: 13, metin: null, tarih: '2026-09-01' }, { key: 'ALT', deger: 20, metin: null, tarih: '2026-09-01' }], '2026-09-16')
    assert.equal(b.hazir, false); assert.ok(b.eksik.some((e) => e.startsWith('IGRA')))
    const ok = biyolojikKapisi([{ key: 'IGRA', deger: null, metin: 'Pozitif', tarih: '2026-08-01' }, { key: 'HBsAg', deger: null, metin: 'Negatif', tarih: '2026-08-01' }, { key: 'AntiHBc', deger: null, metin: 'Negatif', tarih: '2026-08-01' }, { key: 'AntiHCV', deger: null, metin: 'Negatif', tarih: '2026-08-01' }, { key: 'HIV', deger: null, metin: 'Negatif', tarih: '2026-08-01' }, { key: 'Hb', deger: 13, metin: null, tarih: '2026-08-01' }, { key: 'ALT', deger: 20, metin: null, tarih: '2026-08-01' }], '2026-09-16')
    assert.equal(ok.hazir, true); assert.ok(ok.uyari.some((u) => u.includes('latent TB')))
  })
})
describe('izotretinoin kapısı', () => {
  it('female needs recent βhCG + consent; male passes; monthly due', () => {
    assert.equal(izotretinoinKapisi(true, null, null, '2026-09-16').eksik.length, 2)
    assert.equal(izotretinoinKapisi(true, '2026-09-10', 'onam-1', '2026-09-16').baslanabilir, true)
    assert.equal(izotretinoinKapisi(true, '2026-07-01', 'onam-1', '2026-09-16').baslanabilir, false)
    const e = izotretinoinKapisi(false, null, null, '2026-09-16'); assert.equal(e.baslanabilir, true); assert.equal(e.aylikDue, '2026-10-16')
  })
})
