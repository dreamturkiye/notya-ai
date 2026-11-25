/**
 * EV-VERISI-V2 — the doctor's Ev verisi card, display layer: status sentence, trend wording, tile layout, smooth path,
 * per-medicine strip, and the core-component guarantees (metrics come only from what the patient logged — no branş
 * field leak; no consent → no home data; no "AI" wording in the card).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { evVerisiDemoGirdisi } from './demo'
import { evVerisiHesapla } from './evVerisi'
import { metrikAnahtari } from './olcumler'
import {
  durumCumlesi, egilim, gunlukSeri, haftaninEksikDozlari, karoYayilimi, kisaAd, olcumGunleri, puruzsuzYol, type Metrik,
} from './evVerisiGorunum'

const SIMDI = '2026-11-24T12:00:00.000Z'
const MS = Date.parse(SIMDI)
const demo = () => evVerisiHesapla(evVerisiDemoGirdisi(SIMDI))

describe('Ev verisi v2 — status sentence', () => {
  it('names the rising after-lunch glucose in plain Turkish, attention tone', () => {
    const d = durumCumlesi(demo(), MS)
    assert.equal(d.ton, 'dikkat')
    assert.match(d.baslik, /^Tokluk şekeri bu hafta yükseliyor — ort\. \d+ mg\/dL$/)
    assert.match(d.alt, /^Önceki 3 haftada \d+ mg\/dL idi\./)
    assert.equal(d.metrik, 'glukoz:tokluk2')
  })
  it('after "Gördüm": calm, and says the alert was seen instead of claiming there is no trend', () => {
    const v = demo()
    const d = durumCumlesi({ ...v, uyarilar: v.uyarilar.map((u) => ({ ...u, goruldu: true })) }, MS)
    assert.equal(d.ton, 'sakin')
    assert.equal(d.baslik, 'Yeni uyarı yok')
  })
  it('urgent tone for an acil alert; empty patient gets the empty sentence', () => {
    const v = demo()
    const acil = durumCumlesi({ ...v, uyarilar: [{ id: 'x', duzey: 'acil', metin: 'Tansiyon ≥180', tarih: SIMDI, goruldu: false, metrik: 'kb', kural: 'cok_yuksek', deger: 186, deger2: 112 }] }, MS)
    assert.equal(acil.ton, 'acil')
    assert.equal(acil.baslik, 'Tansiyon yüksek ölçüldü — 186/112 mmHg')
    const g = evVerisiDemoGirdisi(SIMDI)
    const bos = evVerisiHesapla({ ...g, olcumler: [], kayitlar: [], planlar: [], uyarilar: [] })
    assert.equal(durumCumlesi(bos, MS).baslik, 'Henüz ev verisi yok')
  })
})

describe('Ev verisi v2 — numbers', () => {
  it('trend wording: artış / düşüş / sabit with the unit', () => {
    const m = (h: number, o: number): Metrik => ({ anahtar: 'glukoz:aclik', etiket: '', birim: 'mg/dL', noktalar: [], hafta: { ort: h, ort2: null, n: 5 }, onceki: { ort: o, ort2: null, n: 15 }, hedefMin: 80, hedefMax: 130, hedefMax2: null })
    assert.deepEqual(egilim(m(158, 121)), { yon: 1, metin: '37 mg/dL artış' })
    assert.deepEqual(egilim(m(115, 117)), { yon: 0, metin: 'sabit' })
    assert.deepEqual(egilim(m(100, 117)), { yon: -1, metin: '17 mg/dL düşüş' })
  })
  it('short names, daily series inside the window, measurement days ≤ 7', () => {
    assert.equal(kisaAd('glukoz:tokluk2'), 'Tokluk şekeri')
    assert.equal(kisaAd('kb'), 'Tansiyon')
    const v = demo()
    for (const m of v.metrikler) for (const p of gunlukSeri(m, MS)) assert.ok(p.x >= 0 && p.x <= 1)
    const g = olcumGunleri(v, MS)
    assert.ok(g >= 1 && g <= 7)
  })
  it('a missed dose this week is surfaced; every medicine has a 14-day strip', () => {
    const v = demo()
    const e = haftaninEksikDozlari(v)
    assert.ok(e.toplam > 0 && e.ilaclar.length > 0)
    for (const i of v.uyum.ilaclar) {
      assert.equal(i.gunler.length, 14)
      assert.ok(i.gunler.every((x) => ['yok', 'tam', 'kismi', 'alinmadi'].includes(x)))
      assert.ok(i.hafta.beklenen >= i.hafta.alinan)
    }
  })
})

describe('Ev verisi v2 — layout and drawing', () => {
  it('tiles without a featured one: rows of ≤ 4, each row fills the 12-column grid', () => {
    assert.deepEqual(karoYayilimi(5), [4, 4, 4, 6, 6])
    assert.deepEqual(karoYayilimi(7), [3, 3, 3, 3, 4, 4, 4])
    assert.deepEqual(karoYayilimi(4), [3, 3, 3, 3])
    assert.deepEqual(karoYayilimi(1), [12])
  })
  it('smooth path never overshoots monotone readings', () => {
    const p: Array<[number, number]> = [[0, 50], [10, 40], [20, 38], [30, 10]]
    const d = puruzsuzYol(p)
    assert.ok(d.startsWith('M0.0 50.0'))
    assert.equal((d.match(/C/g) || []).length, 3)
    const ys = [...d.matchAll(/(-?\d+\.\d) (-?\d+\.\d)/g)].map((x) => Number(x[2]))
    assert.ok(ys.every((y) => y <= 50 && y >= 10), `overshoot in ${d}`)
  })
})

describe('Ev verisi v2 — core component guarantees', () => {
  it('metrics shown are exactly what the patient logged (no branş field leak), for any branş', () => {
    for (const brans of ['dahiliye', 'pediatri', 'kardiyoloji', 'dermatoloji', 'fizyoterapi']) {
      const g = evVerisiDemoGirdisi(SIMDI, brans)
      const v = evVerisiHesapla(g)
      const logged = new Set(g.olcumler.filter((o) => Date.parse(o.olcumAt) >= MS - 28 * 86_400_000).map(metrikAnahtari))
      assert.deepEqual(new Set(v.metrikler.map((m) => m.anahtar)), logged, brans)
    }
  })
  it('no consent → no home data reaches the card (alerts, strips, metrics)', () => {
    const g = evVerisiDemoGirdisi(SIMDI)
    const v = evVerisiHesapla({ ...g, tercih: { ...g.tercih, paylasimOnayi: false } })
    assert.deepEqual([v.metrikler.length, v.uyarilar.length, v.uyum.ilaclar.length, v.sorular.length], [0, 0, 0, 0])
  })
  it('the card never branches on the branş and never uses AI wording', () => {
    const src = readFileSync(join(process.cwd(), 'components/doktor/saglikEvi/EvVerisiKarti.tsx'), 'utf8')
    assert.ok(!/veri\.brans|\bbrans\b\s*===/.test(src), 'card must not branch on branş')
    assert.ok(!/yapay zek|\bAI\b|\bai\b destekli/i.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), 'no AI wording in UI copy')
  })
})
