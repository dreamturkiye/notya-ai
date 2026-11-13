import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ivmeHesapla, haftalikHesapla, haftalikSatiri, ivmeYonMetni, type OnayMetrigi } from './ivme'
import { OGRENME_METINLERI, ogrenmeDili, ogrenmeMetni } from './metinler'

const GUN = 86_400_000
const SIMDI = Date.parse('2026-11-13T12:00:00Z')
const m = (i: number, d: number, gunOnce: number): OnayMetrigi => ({ note_id: `n${i}`, duzeltme_sayisi: d, onay_at: new Date(SIMDI - gunOnce * GUN).toISOString() })

test('ivme: 3 onaylı nottan az → boş durum, uydurma sayı yok', () => {
  for (const n of [0, 1, 2]) {
    const s = ivmeHesapla(Array.from({ length: n }, (_, i) => m(i, 5, 10 - i)))
    assert.equal(s.yeterli, false)
    assert.equal(s.n, n)
    assert.deepEqual(s.seri, [])
    assert.equal(s.ilkOrtalama, null)
    assert.equal(s.sonOrtalama, null)
  }
})

test('ivme: 3-5 not → rakamlar var, yön söylenmez', () => {
  const s = ivmeHesapla([m(1, 6, 9), m(2, 4, 8), m(3, 2, 7), m(4, 1, 6)])
  assert.equal(s.yeterli, true)
  assert.equal(s.yon, 'erken')
  assert.equal(s.n, 4)
})

test('ivme: ≥6 not → ilk 3 vs son 3 ortalaması ve yön', () => {
  const az = ivmeHesapla([6, 5, 4, 3, 2, 1].map((d, i) => m(i, d, 20 - i)))
  assert.equal(az.yon, 'azaliyor')
  assert.equal(az.ilkOrtalama, 5)
  assert.equal(az.sonOrtalama, 2)
  const sabit = ivmeHesapla([3, 3, 3, 3, 3, 3].map((d, i) => m(i, d, 20 - i)))
  assert.equal(sabit.yon, 'sabit')
  const art = ivmeHesapla([1, 1, 1, 4, 4, 4].map((d, i) => m(i, d, 20 - i)))
  assert.equal(art.yon, 'artiyor')
})

test('ivme: sıfır düzeltmeli notlar sayılır; tekrar onay son hali alır; bozuk satır atılır', () => {
  const s = ivmeHesapla([m(1, 0, 5), m(2, 0, 4), m(3, 0, 3), { note_id: 'n3', duzeltme_sayisi: 2, onay_at: m(3, 2, 2).onay_at }, { note_id: '', duzeltme_sayisi: 1, onay_at: 'x' }, { note_id: 'z', duzeltme_sayisi: -1, onay_at: m(9, 0, 1).onay_at }])
  assert.equal(s.n, 3)
  assert.deepEqual(s.seri.map((x) => x.duzeltme), [0, 0, 2])
})

test('haftalık: <3 toplam not → yok; geçen hafta <2 not → karşılaştırma yok', () => {
  assert.equal(haftalikHesapla([m(1, 2, 1), m(2, 3, 2)], SIMDI), null)
  const h = haftalikHesapla([m(1, 2, 1), m(2, 4, 2), m(3, 3, 3), m(4, 9, 10)], SIMDI)
  assert.deepEqual(h, { buHaftaOrtalama: 3, buHaftaNot: 3, oncekiHaftaOrtalama: null })
  const h2 = haftalikHesapla([m(1, 2, 1), m(2, 4, 2), m(3, 3, 3), m(4, 6, 9), m(5, 8, 10)], SIMDI)
  assert.equal(h2?.oncekiHaftaOrtalama, 7)
  assert.equal(haftalikHesapla([m(1, 2, 9), m(2, 4, 10), m(3, 3, 11)], SIMDI), null)
})

test('metinler: TR korunur; ülke dilleri TR değildir ve her anahtar dolu', () => {
  assert.equal(ogrenmeDili(undefined), 'tr')
  assert.equal(ogrenmeDili('au'), 'en')
  assert.equal(ogrenmeDili('uz'), 'uz')
  assert.equal(ogrenmeMetni('tr').sayfaBaslik, 'Ayşe’nin hafızası')
  assert.match(haftalikSatiri({ buHaftaOrtalama: 2, buHaftaNot: 4, oncekiHaftaOrtalama: 3 }, OGRENME_METINLERI.tr) || '', /Bu hafta 4 onaylı notta ortalama 2 düzeltme \(geçen hafta 3\)/)
  assert.match(haftalikSatiri({ buHaftaOrtalama: 2, buHaftaNot: 4, oncekiHaftaOrtalama: null }, OGRENME_METINLERI.en) || '', /^This week: 2 corrections per note on average across 4 approved notes\.$/)
  assert.equal(haftalikSatiri(null, OGRENME_METINLERI.en), null)
  const trAnahtar = Object.keys(OGRENME_METINLERI.tr)
  const turkceHarf = /[çğıöşüÇĞİÖŞÜ]/
  for (const dil of ['en', 'uz'] as const) {
    assert.deepEqual(Object.keys(OGRENME_METINLERI[dil]).sort(), [...trAnahtar].sort())
  }
  const en = OGRENME_METINLERI.en
  for (const [k, v] of Object.entries(en)) {
    const metin = typeof v === 'function' ? (v as (...a: never[]) => unknown)(...([1, '1', '2'] as never[])) : v
    const duz = typeof metin === 'string' ? metin : JSON.stringify(metin)
    if (k === 'sayfaBaslik') continue
    assert.ok(!turkceHarf.test(duz.replace(/Ayşe/g, '')), `EN metninde Türkçe harf: ${k}`)
  }
  assert.equal(ivmeYonMetni(ivmeHesapla([]), OGRENME_METINLERI.en).length > 0, true)
})
