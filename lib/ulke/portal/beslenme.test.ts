/**
 * AU-DIETETICS-MEAL-01 / portal coaching — meal plan, diary, goals and clinic weight shaping.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  portalAgirlikGecmisi,
  portalBeslenmeHedefleri,
  portalHastaGunlukSayisi,
  portalOgunPlani,
  portalYemekGunlugu,
} from './beslenme'
import type { AracKaydi } from '../araclar/kayitTipleri'

const PLAN = 'au-meal-plan'
const GUNLUK = 'au-food-diary'
const HEDEF = 'au-nutrition-goals'
const BODY = 'au-body-size'

const HEDEF_ADI = {
  agirlik: 'Weight or muscle goal',
  alim: 'Intake or fortification goal',
  yutma: 'Texture or swallowing-related nutrition goal',
  semptom: 'Symptom or tolerance goal',
  egitim: 'Education or food-skills goal',
  aile: 'Family or carer included in goal-setting',
} as const

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
    assert.equal(portalHastaGunlukSayisi(kayitlar, GUNLUK), 1)
  })
})

describe('portalBeslenmeHedefleri', () => {
  it('returns ticked goals from the newest completed record with pack labels', () => {
    const kayitlar = [
      kayit({
        arac: HEDEF,
        gun: '2026-10-28',
        girdiler: { agirlik: true, alim: true, yutma: false, semptom: false, egitim: false, aile: true },
        sonuc: { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: 3, ondalik: 0 }], bant: null, uyarilar: [], tarihler: [] },
      }),
      kayit({
        arac: HEDEF,
        gun: '2026-10-01',
        girdiler: { agirlik: true, alim: false, yutma: false, semptom: false, egitim: false, aile: false },
        sonuc: { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: 1, ondalik: 0 }], bant: null, uyarilar: [], tarihler: [] },
      }),
    ]
    assert.deepEqual(portalBeslenmeHedefleri(kayitlar, HEDEF, HEDEF_ADI), [
      { anahtar: 'agirlik', etiket: 'Weight or muscle goal' },
      { anahtar: 'alim', etiket: 'Intake or fortification goal' },
      { anahtar: 'aile', etiket: 'Family or carer included in goal-setting' },
    ])
  })

  it('returns empty when the newest goals record has no ticks', () => {
    const kayitlar = [
      kayit({
        arac: HEDEF,
        gun: '2026-10-28',
        girdiler: { agirlik: false, alim: false },
        sonuc: { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: 0, ondalik: 0 }], bant: null, uyarilar: ['hedef_yok'], tarihler: [] },
      }),
      kayit({
        arac: HEDEF,
        gun: '2026-10-01',
        girdiler: { agirlik: true },
        sonuc: { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: 1, ondalik: 0 }], bant: null, uyarilar: [], tarihler: [] },
      }),
    ]
    assert.deepEqual(portalBeslenmeHedefleri(kayitlar, HEDEF, HEDEF_ADI), [])
  })
})

describe('portalAgirlikGecmisi', () => {
  it('merges weight / waist / BMI by day, newest first', () => {
    const kayitlar = [
      kayit({
        arac: BODY,
        gun: '2026-10-28',
        girdiler: { agirlik: 72.5, bel: 88 },
        sonuc: {
          tamam: true,
          sayilar: [
            { anahtar: 'bmi', deger: 24.1, ondalik: 1 },
            { anahtar: 'bel', deger: 88, ondalik: 0 },
          ],
          bant: null,
          uyarilar: [],
          tarihler: [],
        },
      }),
      kayit({
        arac: BODY,
        gun: '2026-10-01',
        girdiler: { agirlik: 74 },
        sonuc: {
          tamam: true,
          sayilar: [{ anahtar: 'bmi', deger: 24.6, ondalik: 1 }],
          bant: null,
          uyarilar: [],
          tarihler: [],
        },
      }),
      kayit({
        arac: 'other',
        gun: '2026-09-01',
        girdiler: { agirlik: 99 },
        sonuc: { tamam: true, sayilar: [{ anahtar: 'bmi', deger: 30, ondalik: 1 }], bant: null, uyarilar: [], tarihler: [] },
      }),
    ]
    assert.deepEqual(portalAgirlikGecmisi(kayitlar, BODY), [
      { gun: '2026-10-28', kiloKg: 72.5, belCm: 88, bmi: 24.1 },
      { gun: '2026-10-01', kiloKg: 74, belCm: null, bmi: 24.6 },
    ])
  })
})
