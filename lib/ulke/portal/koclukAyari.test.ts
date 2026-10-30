/**
 * Portal coaching resolver — dietetics beslenme vs per-role kocluk modules.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { portalKoclukAyari } from './koclukAyari'
import type { AracTanimi, UlkeAraclari } from '../araclar/tipler'
import type { UlkePaketi } from '../tipler'
import { BOS_SONUC } from '../araclar/yardimci'

const etiket = {
  sekmeBaslik: 'Care',
  planBaslik: 'Plan',
  planYok: 'none',
  kahvalti: 'a',
  ogle: 'b',
  aksam: 'c',
  atistirmalik: 'd',
  notlar: 'n',
  gunlukBaslik: 'Diary',
  gunlukYok: 'none',
  gunlukEkle: 'add',
  gun: 'Date',
  ogun: 'Type',
  aciklama: 'Note',
  kaydet: 'Save',
  kaydedildi: 'ok',
  kaydedilemedi: 'fail',
  hedefBaslik: 'Goals',
  hedefYok: 'none',
  agirlikBaslik: '',
  agirlikYok: '',
  agirlikKg: '',
  bmiEtiket: '',
  belEtiket: '',
  mesajCta: 'Message',
  mesajIpucu: 'hint',
  cipPlan: 'Plan',
  cipPlanYok: 'none',
  cipGunluk: 'Notes',
  cipGunlukYok: 'none',
  cipHedef: 'Goals',
  cipHedefYok: 'none',
  ogunAdi: { kahvalti: 'Progress', diger: 'Other' },
  kimAdi: { diyetisyen: 'Clinician', hasta: 'You' },
  hedefAdi: { izlem: 'Monitor' },
}

function paket(ek: Partial<NonNullable<UlkePaketi['uygulama']>['portal']>): UlkePaketi {
  return {
    kod: 'xx',
    iz: 'test',
    diller: ['en'],
    acikDiller: ['en'],
    varsayilanDil: 'en',
    paraBirimi: { kod: 'AUD', simge: '$', ondalikHane: 2 },
    ozellikler: {},
    uygulama: {
      diller: ['en'],
      hastaDilleri: ['en'],
      dilGruplari: [{ temel: 'en', bicimler: [{ yazi: null, dil: 'en' }] }],
      saatDilimleri: ['UTC'],
      saatBicimi: 24,
      birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' },
      adAlanlari: { ikinciAd: false },
      kimlikNumarasi: { dogrula: false },
      veliYasi: null,
      kayitAcik: false,
      portal: {
        baglantiGecerlilikGun: 30,
        ...ek,
      },
    },
  } as UlkePaketi
}

function stub(anahtar: string): AracTanimi {
  return {
    anahtar,
    tur: 'liste',
    alanlar: [],
    cikti: { sayilar: [], bantlar: [], uyarilar: [], tarihler: [] },
    kaynak: 'test stub for portal coaching resolver',
    hesapla: () => BOS_SONUC,
  }
}

function icerik(entries: { anahtar: string; roller: string[] }[]): UlkeAraclari {
  return {
    araclar: entries.map(({ anahtar, roller }) => ({
      anahtar,
      roller,
      metin: { ad: { en: anahtar }, aciklama: { en: '' }, alanlar: {}, not: { en: '' } },
      lisans: { durum: 'serbest', hakSahibi: 't', kaynak: 't', bildirim: { en: 't' } },
    })),
    kendiAraclari: entries.map((e) => stub(e.anahtar)),
  } as UlkeAraclari
}

describe('portalKoclukAyari', () => {
  it('prefers dietetics beslenme when the role can open the meal-plan tool', () => {
    const p = paket({
      beslenme: {
        planAraci: 'au-meal-plan',
        gunlukAraci: 'au-food-diary',
        hedefAraci: 'au-nutrition-goals',
        agirlikAraci: 'au-body-size',
        etiket: { ...etiket, agirlikBaslik: 'Weight', sekmeBaslik: 'Meal plan' },
      },
      kocluk: {
        moduller: {
          cardiology: {
            planAraci: 'au-cardiology-care-plan',
            gunlukAraci: 'au-cardiology-between-visit-log',
            hedefAraci: 'au-cardiology-care-goals',
            etiket,
          },
        },
      },
    })
    const a = portalKoclukAyari(
      p,
      'dietetics',
      icerik([
        { anahtar: 'au-meal-plan', roller: ['dietetics'] },
        { anahtar: 'au-food-diary', roller: ['dietetics'] },
        { anahtar: 'au-nutrition-goals', roller: ['dietetics'] },
      ]),
    )
    assert.equal(a?.planAraci, 'au-meal-plan')
    assert.equal(a?.etiket.sekmeBaslik, 'Meal plan')
  })

  it('resolves cardiology coaching from kocluk modules', () => {
    const p = paket({
      kocluk: {
        moduller: {
          cardiology: {
            planAraci: 'au-cardiology-care-plan',
            gunlukAraci: 'au-cardiology-between-visit-log',
            hedefAraci: 'au-cardiology-care-goals',
            etiket,
          },
        },
      },
    })
    const a = portalKoclukAyari(
      p,
      'cardiology',
      icerik([{ anahtar: 'au-cardiology-care-plan', roller: ['cardiology'] }]),
    )
    assert.equal(a?.planAraci, 'au-cardiology-care-plan')
    assert.equal(a?.etiket.agirlikBaslik, '')
  })

  it('returns null when the role cannot open the plan tool', () => {
    const p = paket({
      kocluk: {
        moduller: {
          cardiology: {
            planAraci: 'au-cardiology-care-plan',
            gunlukAraci: 'au-cardiology-between-visit-log',
            etiket,
          },
        },
      },
    })
    assert.equal(
      portalKoclukAyari(p, 'physiotherapy', icerik([{ anahtar: 'au-cardiology-care-plan', roller: ['cardiology'] }])),
      null,
    )
    assert.equal(portalKoclukAyari(p, 'cardiology', icerik([])), null)
  })
})
