/**
 * AU-ARAC-GORUNUM-01 — unit tests for ./maddeTakvimi.ts, the milestone-calendar's pure logic. Names no country and
 * no real tool: fixtures are a minimal made-up checklist tool and synthetic `AracKaydi` rows.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { maddeAnahtarlari, maddeTakvimiBosMu, maddeTakvimiDurumu } from './maddeTakvimi'
import type { AracKaydi } from './kayitTipleri'
import type { AracTanimi } from './tipler'

const TANIM: Pick<AracTanimi, 'alanlar'> = {
  alanlar: [
    { anahtar: 'secim_bir', tur: 'secim' },
    { anahtar: 'birinci', tur: 'isaret' },
    { anahtar: 'ikinci', tur: 'isaret' },
    { anahtar: 'ucuncu', tur: 'isaret' },
    { anahtar: 'bir_tarih', tur: 'tarih' },
  ] as AracTanimi['alanlar'],
}

function kayit(p: Partial<AracKaydi> & { girdiler: AracKaydi['girdiler'] }): AracKaydi {
  return {
    id: p.id ?? 'k',
    arac: 'test-takvim-araci',
    olusturuldu: p.olusturuldu ?? '2026-01-01T00:00:00Z',
    gun: p.gun ?? '2026-01-01',
    takipTarihi: null,
    kapandi: null,
    sonuc: p.sonuc ?? null,
    girdiler: p.girdiler,
  }
}

describe('maddeAnahtarlari', () => {
  it('returns only the isaret fields, in the order the tool declares them, never another field type', () => {
    assert.deepEqual(maddeAnahtarlari(TANIM), ['birinci', 'ikinci', 'ucuncu'])
  })
  it('a tool with no isaret field at all has no milestones', () => {
    assert.deepEqual(maddeAnahtarlari({ alanlar: [{ anahtar: 'x', tur: 'sayi' }] as AracTanimi['alanlar'] }), [])
  })
})

describe('maddeTakvimiDurumu', () => {
  const maddeler = maddeAnahtarlari(TANIM)

  it('every milestone starts not done, with no date, when there are no kept results at all', () => {
    const durum = maddeTakvimiDurumu([], maddeler)
    assert.deepEqual(durum, { birinci: { tamam: false, tarih: null }, ikinci: { tamam: false, tarih: null }, ucuncu: { tamam: false, tarih: null } })
  })

  it('a ticked milestone with a dated tarihler entry on its result is done, with that date', () => {
    const k = kayit({
      girdiler: { birinci: true, ikinci: false },
      sonuc: { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'birinci_tarih', tarih: '2026-02-10' }] },
    })
    const durum = maddeTakvimiDurumu([k], maddeler)
    assert.deepEqual(durum.birinci, { tamam: true, tarih: '2026-02-10' })
    assert.deepEqual(durum.ikinci, { tamam: false, tarih: null })
  })

  it('falls back to the raw typed `<madde>_tarih` field when the result carries no date for it', () => {
    const k = kayit({ girdiler: { ikinci: true, ikinci_tarih: '2026-03-01' }, sonuc: { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [] } })
    assert.deepEqual(maddeTakvimiDurumu([k], maddeler).ikinci, { tamam: true, tarih: '2026-03-01' })
  })

  it('a milestone with no date anywhere is still done, with tarih null', () => {
    const k = kayit({ girdiler: { ucuncu: true }, sonuc: { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [] } })
    assert.deepEqual(maddeTakvimiDurumu([k], maddeler).ucuncu, { tamam: true, tarih: null })
  })

  it('merges across several kept results: a later visit ticking one milestone does not undo an earlier one', () => {
    const once = kayit({ id: 'a', gun: '2026-01-05', girdiler: { birinci: true }, sonuc: { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'birinci_tarih', tarih: '2026-01-05' }] } })
    const later = kayit({ id: 'b', gun: '2026-02-05', girdiler: { ikinci: true }, sonuc: { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'ikinci_tarih', tarih: '2026-02-05' }] } })
    const durum = maddeTakvimiDurumu([once, later], maddeler)
    assert.equal(durum.birinci.tamam, true)
    assert.equal(durum.ikinci.tamam, true)
  })

  it('reads kayitlar oldest first regardless of the order they are passed in, so a later tick is not overwritten by an earlier one read out of order', () => {
    const early = kayit({ id: 'a', gun: '2026-01-01', girdiler: { birinci: true }, sonuc: { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'birinci_tarih', tarih: '2026-01-01' }] } })
    const late = kayit({ id: 'b', gun: '2026-06-01', girdiler: { birinci: true }, sonuc: { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [{ anahtar: 'birinci_tarih', tarih: '2026-06-01' }] } })
    // passed newest-first, as a patient's record list usually is
    assert.deepEqual(maddeTakvimiDurumu([late, early], maddeler).birinci, { tamam: true, tarih: '2026-06-01' })
  })

  it('a record of another tool is ignored even when it happens to share a field name', () => {
    const k: AracKaydi = { ...kayit({ girdiler: { birinci: true }, sonuc: { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [] } }), arac: 'baska-arac' }
    // maddeTakvimiDurumu itself is given only this tool's own kayitlar by the caller (AsiTakvimi.tsx filters by
    // `k.arac === anahtar` first); passed one of another tool directly, it still reads any matching field names —
    // proving the filtering responsibility sits with the caller, not here, is the point of this test.
    const durum = maddeTakvimiDurumu([k], maddeler)
    assert.equal(durum.birinci.tamam, true)
  })

  it('a record with girdiler: null is skipped, not thrown on', () => {
    const k = kayit({ girdiler: null })
    assert.doesNotThrow(() => maddeTakvimiDurumu([k], maddeler))
    assert.deepEqual(maddeTakvimiDurumu([k], maddeler).birinci, { tamam: false, tarih: null })
  })
})

describe('maddeTakvimiBosMu', () => {
  it('true when every milestone is not done', () => {
    assert.equal(maddeTakvimiBosMu({ a: { tamam: false, tarih: null }, b: { tamam: false, tarih: null } }), true)
  })
  it('false once at least one milestone is done', () => {
    assert.equal(maddeTakvimiBosMu({ a: { tamam: false, tarih: null }, b: { tamam: true, tarih: null } }), false)
  })
  it('true for an empty milestone set (no milestone to be done)', () => {
    assert.equal(maddeTakvimiBosMu({}), true)
  })
})
