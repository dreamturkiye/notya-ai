/**
 * AU-DIETETICS-MEAL-01 — meal plan / food diary shaping for the patient portal.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { portalOgunPlani, portalYemekGunlugu } from './beslenme'
import type { AracKaydi } from '../araclar/kayitTipleri'

const PLAN = 'au-meal-plan'
const GUNLUK = 'au-food-diary'

function kayit(ek: Partial<AracKaydi> & { arac: string; gun: string; girdiler: AracKaydi['girdiler'] }): AracKaydi {
  return {
    id: ek.id ?? `k-${ek.gun}-${ek.arac}`,
    arac: ek.arac,
    olusturuldu: `${ek.gun}T10:00:00.000Z`,
    gun: ek.gun,
    takipTarihi: null,
    kapandi: null,
    girdiler: ek.girdiler,
    sonuc: ek.sonuc ?? { tamam: true, sayilar: [{ anahtar: 'dolu', deger: 1, ondalik: 0 }], bant: null, uyarilar: ['portal'], tarihler: [] },
  }
}

describe('portalOgunPlani / portalYemekGunlugu', () => {
  it('returns the newest completed meal plan with meal slots', () => {
    // Same order as hastaninAracKayitlari: newest first.
    const kayitlar = [
      kayit({
        arac: PLAN,
        gun: '2026-10-28',
        girdiler: {
          plan_tarihi: '2026-10-28',
          kahvalti: 'Oats',
          ogle: 'Soup',
          aksam: 'Fish + veg',
          atistirmalik: 'Nuts',
          notlar: 'Fortify milk',
        },
      }),
      kayit({
        arac: PLAN,
        gun: '2026-10-20',
        girdiler: { plan_tarihi: '2026-10-20', kahvalti: 'Old oats', ogle: 'Lunch then', aksam: '', atistirmalik: '' },
      }),
    ]
    assert.deepEqual(portalOgunPlani(kayitlar, PLAN), {
      gun: '2026-10-28',
      kahvalti: 'Oats',
      ogle: 'Soup',
      aksam: 'Fish + veg',
      atistirmalik: 'Nuts',
      notlar: 'Fortify milk',
    })
  })

  it('skips empty plans and other tools', () => {
    assert.equal(
      portalOgunPlani(
        [kayit({ arac: PLAN, gun: '2026-10-01', girdiler: { plan_tarihi: '2026-10-01', kahvalti: '', ogle: '', aksam: '', atistirmalik: '' } })],
        PLAN,
      ),
      null,
    )
    assert.equal(portalOgunPlani([kayit({ arac: 'other', gun: '2026-10-01', girdiler: { kahvalti: 'x' } })], PLAN), null)
  })

  it('lists recent diary entries newest-first, capped', () => {
    const kayitlar = [
      kayit({
        arac: GUNLUK,
        gun: '2026-10-28',
        girdiler: { gun: '2026-10-28', ogun: 'kahvalti', aciklama: 'Toast', kim: 'hasta' },
      }),
      kayit({
        arac: GUNLUK,
        gun: '2026-10-27',
        girdiler: { gun: '2026-10-27', ogun: 'ogle', aciklama: 'Salad', kim: 'diyetisyen' },
      }),
      kayit({
        arac: 'other',
        gun: '2026-10-26',
        girdiler: { gun: '2026-10-26', ogun: 'aksam', aciklama: 'Skip', kim: 'hasta' },
      }),
    ]
    assert.deepEqual(portalYemekGunlugu(kayitlar, GUNLUK, 1), [
      { gun: '2026-10-28', ogun: 'kahvalti', aciklama: 'Toast', kim: 'hasta' },
    ])
    assert.equal(portalYemekGunlugu(kayitlar, GUNLUK).length, 2)
  })
})
