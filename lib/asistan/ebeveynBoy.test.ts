/**
 * NOTYA-KORPUS-KALAN-01 (Y-023) — the mother's / father's height is the Hasta Bilgi Formu field, never the patient's
 * own height. Pure: the matcher and the answer over the chart-event index. The route level is
 * lib/asistan/vizitOlcumSahne.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ebeveynBoyuSorusu, ebeveynBoyCevabi } from './ebeveynBoy'
import { kayitIstegiBul } from './kayitTablosu'
import { olaylariKur, type HamDosya } from '@/lib/doktor/dosyaOlaylari'

const BUGUN = '2026-10-01'
const AD = 'QA Bebek Ölçüm'
const HAM: HamDosya = {
  hasta: { ad: AD, dogumIso: '2024-07-10', cinsiyet: 'Kız' },
  brans: 'Pediatri',
  vizitler: [{ id: 'v1', tarih: '2026-04-05', subjektif: '21 aylık kontrol.', tani: 'Sağlam çocuk izlemi', vitaller: { kilo: 10.9, boy: 81, basCevresi: 47 } }],
}

describe('ebeveynBoyuSorusu — kimin boyu soruluyor', () => {
  it('anne / baba boyu: iyelik ya da tamlama', () => {
    const b: [string, string[]][] = [
      ['bu hastanın annesinin boyu kaç', ['anne']],
      ['Babasının boyu ne kadar', ['baba']],
      ['Anne boyu kaç santim?', ['anne']],
      ['Anne ve babasının boyları neydi', ['anne', 'baba']],
      ["Ayşe Yeşil'in annesinin boyu kaç?", ['anne']],
    ]
    for (const [m, beklenen] of b) assert.deepEqual(ebeveynBoyuSorusu(m), beklenen, m)
  })
  it('hastanın kendi boyu, anne adı ve boy geçmeyen soru bu yol değildir', () => {
    for (const m of ['Boyu kaç?', 'Annesi boyunu sordu, boyu kaç?', 'Annesinin adı ne', 'Annesinde diyabet var mı', 'Son muayenedeki boy ve kilo ölçümlerini göster', '']) {
      assert.deepEqual(ebeveynBoyuSorusu(m), [], m)
    }
  })
  it('kök neden: tek-değer eşleyicisi bu cümlede hastanın boyunu görür — çağıran bu modüle ÖNCE bakar', () => {
    assert.equal(kayitIstegiBul('bu hastanın annesinin boyu kaç')?.tur, 'olcum')
    assert.deepEqual(ebeveynBoyuSorusu('bu hastanın annesinin boyu kaç'), ['anne'])
  })
})

describe('ebeveynBoyCevabi — formdaki değer; yoksa öyle söylenir', () => {
  it('formda var: değer ve kaynağı', () => {
    const o = olaylariKur({ ...HAM, intake: { anneBoyu: '168', babaBoyu: '176' } }, BUGUN)
    assert.equal(ebeveynBoyCevabi(['anne'], o, AD).ekran, `${AD} — anne boyu 168 cm (Hasta Bilgi Formu).`)
    assert.equal(ebeveynBoyCevabi(['anne', 'baba'], o, AD).ekran, `${AD} — anne boyu 168 cm ve baba boyu 176 cm (Hasta Bilgi Formu).`)
    assert.equal(ebeveynBoyCevabi(['anne'], o, AD).konusma, ebeveynBoyCevabi(['anne'], o, AD).ekran)
  })
  it('biri var, biri yok', () => {
    const o = olaylariKur({ ...HAM, intake: { anneBoyu: '168' } }, BUGUN)
    assert.equal(ebeveynBoyCevabi(['anne', 'baba'], o, AD).ekran, `${AD} — anne boyu 168 cm (Hasta Bilgi Formu). Baba boyu Hasta Bilgi Formu’nda kayıtlı değil.`)
  })
  it('formda yok: hastanın boyu verilmez, değer uydurulmaz', () => {
    const c = ebeveynBoyCevabi(['anne'], olaylariKur(HAM, BUGUN), AD)
    assert.equal(c.ekran, `${AD} — anne boyu Hasta Bilgi Formu’nda kayıtlı değil Hocam.`)
    assert.ok(!c.ekran.includes('81'), 'hastanın boyu cevapta yok')
    assert.doesNotMatch(c.ekran, /hedef boy|persentil/i)
  })
})
