/**
 * ULKE-BRANS-DERINLIK-09 — the specialty dose engine and order presets (./dozMotoru.ts), pack-free: the arithmetic, the
 * clinician's own ceiling, Mosteller's area, the fields a basis shows, and that the engine knows no medicine or amount.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { dozAraciTanimi, dozHesapla, mosteller, siparisAraciTanimi } from './dozMotoru'

const ORTAM = { bugun: '2026-11-08', p: {} }
const sayi = (s: { sayilar: readonly { anahtar: string; deger: number }[] }, k: string) => s.sayilar.find((x) => x.anahtar === k)?.deger

describe('specialty dose engine', () => {
  it('per kilogram: 20 kg × 15 mg/kg per dose × 4 = 300 mg per dose, 1200 mg a day, every 6 hours', () => {
    const s = dozHesapla({ temel: 'kg', kiloKg: 20, miktar: 15, mod: 'doz', dozSayisi: 4 })!
    assert.deepEqual([s.dozMg, s.gunlukMg, s.araliksaat, s.bsa], [300, 1200, 6, null])
  })
  it('per square metre: Mosteller from height and weight (170 cm, 70 kg → 1.818 m²); the clinician\'s own area wins', () => {
    assert.equal(Math.round(mosteller(170, 70) * 1000) / 1000, 1.818)
    const s = dozHesapla({ temel: 'm2', kiloKg: 70, boyCm: 170, miktar: 100, mod: 'doz', dozSayisi: 1 })!
    assert.equal(Math.round(s.dozMg * 10) / 10, 181.8)
    assert.equal(dozHesapla({ temel: 'm2', bsa: 2, kiloKg: 70, boyCm: 170, miktar: 100, mod: 'doz', dozSayisi: 1 })!.dozMg, 200)
    assert.equal(dozHesapla({ temel: 'm2', kiloKg: 70, miktar: 100, mod: 'doz', dozSayisi: 1 }), null, 'no area and no height: nothing')
  })
  it('fixed dose: amount per dose × times a day; a concentration gives the volume, never rounded', () => {
    const s = dozHesapla({ temel: 'sabit', miktar: 250, mod: 'gun', dozSayisi: 3, konsMg: 250, konsMl: 5 })!
    assert.deepEqual([s.dozMg, s.gunlukMg, s.dozMl, s.gunlukMl], [250, 750, 5, 15])
    assert.ok(s.uyarilar.includes('ml_yuvarlanmadi'))
  })
  it('the clinician\'s ceiling: passed → warning and the capped amount; the engine has no ceiling of its own', () => {
    const s = dozHesapla({ temel: 'kg', kiloKg: 40, miktar: 15, mod: 'doz', dozSayisi: 4, tavanDozMg: 500, tavanGunMg: 1800 })!
    assert.deepEqual([s.dozMg, s.tavanliDozMg, [...s.uyarilar].sort()], [600, 450, ['tavan_doz', 'tavan_gun']])
    assert.deepEqual(dozHesapla({ temel: 'kg', kiloKg: 400, miktar: 1000, mod: 'doz', dozSayisi: 6 })!.uyarilar, ['kilo_birim'])
  })
  it('missing or impossible input: nothing (no guess)', () => {
    assert.equal(dozHesapla({ temel: 'kg', miktar: 10, mod: 'doz', dozSayisi: 2 }), null)
    assert.equal(dozHesapla({ temel: 'kg', kiloKg: 10, miktar: 0, mod: 'doz', dozSayisi: 2 }), null)
    assert.equal(dozHesapla({ temel: 'kg', kiloKg: 10, miktar: 5, mod: 'doz', dozSayisi: 9 }), null)
  })
  it('the tool shows only the fields of the role\'s bases, writes a medicine amount, prints, and holds no default', () => {
    const sabit = dozAraciTanimi('xx-a-doz', ['sabit'])
    assert.deepEqual(sabit.alanlar.map((a) => a.anahtar), ['ilac', 'temel', 'miktar', 'doz_sayisi', 'kons_mg', 'kons_ml', 'tavan_doz_mg', 'tavan_gun_mg'])
    const onko = dozAraciTanimi('xx-b-doz', ['m2', 'kg', 'sabit'])
    assert.ok(['kilo', 'boy', 'bsa', 'mod'].every((k) => onko.alanlar.some((a) => a.anahtar === k)))
    assert.equal(onko.dozYazar, true); assert.equal(onko.yazdirilir, true)
    for (const a of onko.alanlar) assert.equal((a as { varsayilan?: unknown }).varsayilan, undefined)
    const s = onko.hesapla({ temel: 'm2', kilo: 70, boy: 170, miktar: 100, mod: 'doz', doz_sayisi: 1 }, ORTAM)
    assert.equal(s.tamam, true); assert.equal(Math.round(sayi(s, 'bsa')! * 100) / 100, 1.82)
    assert.ok(s.sayilar.filter((x) => x.anahtar.endsWith('_mg')).every((x) => (x as { doz?: boolean }).doz === true))
    assert.equal(onko.hesapla({ temel: 'kg', miktar: 100, doz_sayisi: 1, mod: 'doz' }, ORTAM).tamam, false)
    assert.equal(sabit.hesapla({ temel: 'kg', kilo: 10, miktar: 5, doz_sayisi: 1, mod: 'doz' }, ORTAM).tamam, false, 'a basis the role does not have is refused')
    assert.throws(() => dozAraciTanimi('xx-c-doz', []))
  })
})

describe('specialty order presets', () => {
  it('ticks and a free line; at least three distinct items; prints; holds no result', () => {
    const t = siparisAraciTanimi('xx-a-orders', ['ekg', 'qon', 'rentgen'])
    assert.equal(t.yazdirilir, true)
    assert.equal(t.hesapla({}, ORTAM).tamam, false)
    assert.equal(sayi(t.hesapla({ ekg: true, rentgen: true, diger: 'MRI' }, ORTAM), 'secilen'), 3)
    assert.throws(() => siparisAraciTanimi('xx', ['a', 'b']))
    assert.throws(() => siparisAraciTanimi('xx', ['a', 'a', 'b']))
  })
})
