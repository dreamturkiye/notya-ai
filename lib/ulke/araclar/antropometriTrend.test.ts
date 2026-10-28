/**
 * AU-DIETETICS-TREND-01 — unit tests for anthropometry trend extraction from body-size kayitlar.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ANTROPOMETRI_PARAMETRELERI, antropometriNoktalari } from './antropometriTrend'
import type { AracKaydi } from './kayitTipleri'

const ARAC = 'au-body-size'

function kayit(ek: Partial<AracKaydi> & { gun: string; girdiler: AracKaydi['girdiler']; sonuc: AracKaydi['sonuc'] }): AracKaydi {
  return {
    id: ek.id ?? `k-${ek.gun}`,
    arac: ek.arac ?? ARAC,
    olusturuldu: `${ek.gun}T10:00:00.000Z`,
    gun: ek.gun,
    takipTarihi: null,
    kapandi: null,
    girdiler: ek.girdiler,
    sonuc: ek.sonuc,
  }
}

describe('antropometriNoktalari', () => {
  const liste: AracKaydi[] = [
    kayit({
      gun: '2026-09-01',
      girdiler: { agirlik: 82, boy: 170, cinsiyet: 'erkek', bel: 98 },
      sonuc: {
        tamam: true,
        sayilar: [
          { anahtar: 'bmi', deger: 28.4, ondalik: 1, birim: 'kg/m2' },
          { anahtar: 'bel', deger: 98, ondalik: 1, olcu: 'boy' },
        ],
        bant: 'fazla',
        uyarilar: ['bel_artmis_erkek'],
        tarihler: [],
      },
    }),
    kayit({
      gun: '2026-10-15',
      girdiler: { agirlik: 79.5, boy: 170, cinsiyet: 'erkek', bel: 94 },
      sonuc: {
        tamam: true,
        sayilar: [
          { anahtar: 'bmi', deger: 27.5, ondalik: 1, birim: 'kg/m2' },
          { anahtar: 'bel', deger: 94, ondalik: 1, olcu: 'boy' },
        ],
        bant: 'fazla',
        uyarilar: ['bel_artmis_erkek'],
        tarihler: [],
      },
    }),
    kayit({
      gun: '2026-08-01',
      arac: 'other-tool',
      girdiler: { agirlik: 90 },
      sonuc: { tamam: true, sayilar: [{ anahtar: 'bmi', deger: 30, ondalik: 1 }], bant: null, uyarilar: [], tarihler: [] },
    }),
  ]

  it('reads weight, waist and BMI oldest-first from the named tool only', () => {
    assert.deepEqual(antropometriNoktalari(liste, ARAC, 'agirlik'), [
      { tarih: '2026-09-01', deger: 82 },
      { tarih: '2026-10-15', deger: 79.5 },
    ])
    assert.deepEqual(antropometriNoktalari(liste, ARAC, 'bel'), [
      { tarih: '2026-09-01', deger: 98 },
      { tarih: '2026-10-15', deger: 94 },
    ])
    assert.deepEqual(antropometriNoktalari(liste, ARAC, 'bmi'), [
      { tarih: '2026-09-01', deger: 28.4 },
      { tarih: '2026-10-15', deger: 27.5 },
    ])
  })

  it('skips incomplete results and unknown tools', () => {
    assert.deepEqual(antropometriNoktalari(liste, 'no-such', 'bmi'), [])
    assert.deepEqual(
      antropometriNoktalari(
        [kayit({ gun: '2026-01-01', girdiler: { agirlik: 80 }, sonuc: { tamam: false, sayilar: [], bant: null, uyarilar: [], tarihler: [] } })],
        ARAC,
        'agirlik',
      ),
      [],
    )
  })

  it('exposes the three parameters in chart order', () => {
    assert.deepEqual([...ANTROPOMETRI_PARAMETRELERI], ['agirlik', 'bel', 'bmi'])
  })
})
