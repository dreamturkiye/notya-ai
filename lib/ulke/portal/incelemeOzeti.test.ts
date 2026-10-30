import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { portalIncelemeOzeti } from './incelemeOzeti'
import type { AracKaydi } from '../araclar/kayitTipleri'

function kayit(arac: string, sonraki: string, seans = '2026-10-01'): AracKaydi {
  return {
    id: '1',
    arac,
    gun: seans,
    girdiler: { seans, aralik: 14 },
    sonuc: {
      tamam: true,
      sayilar: [],
      bant: null,
      uyarilar: [],
      tarihler: [{ anahtar: 'sonraki', tarih: sonraki }],
    },
  } as AracKaydi
}

describe('portalIncelemeOzeti', () => {
  it('returns the newest matching review with a sonraki date', () => {
    const o = portalIncelemeOzeti(
      [kayit('au-cardiology-review', '2026-11-01'), kayit('au-other-review', '2026-12-01')],
      ['au-cardiology-review'],
    )
    assert.deepEqual(o, { arac: 'au-cardiology-review', seans: '2026-10-01', sonraki: '2026-11-01' })
  })

  it('skips non-matching tools and incomplete results', () => {
    assert.equal(portalIncelemeOzeti([kayit('au-x-review', '2026-11-01')], ['au-y-review']), null)
  })
})
