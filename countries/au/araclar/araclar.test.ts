/**
 * NOTYA-ULKE-UYGULA-AU — Australia: THE ARITHMETIC OF THE TOOLS ONLY AUSTRALIA HAS, against each source's own worked
 * example and against every limit the source prints. The sources, with the date each was opened, are beside the
 * arithmetic in ./tanimlar.ts; the ones a test rests on are named again here.
 *
 * No value below is from memory: each expected number is one the named page prints, or the plain result of the
 * formula that page prints.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { AracGirdisi, AracSonucu, AracTanimi } from '@/lib/ulke/araclar/tipler'
import { kosullariUygula } from '@/lib/ulke/araclar/yardimci'
import { AU_BEDEN, AU_ECOG, AU_K10, AU_TANIMLAR, BEL_SINIRLARI, bmiSinifi, ECOG_DERECELERI, k10Grubu, K10_MADDELERI } from './tanimlar'

const BUGUN = '2026-10-10'
const kos = (t: AracTanimi, g: AracGirdisi): AracSonucu => t.hesapla(kosullariUygula(t.alanlar, g), { bugun: BUGUN, p: {} })
const sayi = (r: AracSonucu, k: string) => r.sayilar.find((x) => x.anahtar === k)?.deger

describe('au-mental-health-screen — the K10 total (ABS Information Paper 4817.0.55.001, chapter "K10 Scoring", read 2026-10-10)', () => {
  const k10 = (cevaplar: readonly (number | null)[]) => kos(AU_K10, Object.fromEntries(K10_MADDELERI.map((k, i) => [k, cevaplar[i] ?? null])))
  const hepsi = (n: number): number[] => Array.from({ length: 10 }, () => n)

  it('ten items, each scored 1 ("none of the time") to 5 ("all of the time"): the source\'s minimum total is 10 and its maximum 50', () => {
    assert.equal(K10_MADDELERI.length, 10)
    for (const a of AU_K10.alanlar) assert.deepEqual([a.tur, a.enAz, a.enCok, a.tam, a.numarali], ['puan', 1, 5, true, true], a.anahtar)
    assert.equal(sayi(k10(hepsi(1)), 'toplam'), 10)
    assert.equal(sayi(k10(hepsi(5)), 'toplam'), 50)
    assert.equal(sayi(k10([1, 2, 3, 4, 5, 1, 2, 3, 4, 5]), 'toplam'), 30)
    assert.equal(k10(hepsi(3)).sayilar[0].enCok, 50)
  })

  it('the four groups the Bureau prints: 10-15 low, 16-21 moderate, 22-29 high, 30-50 very high — every total from 10 to 50', () => {
    const beklenen = (t: number) => (t >= 10 && t <= 15 ? 'dusuk' : t >= 16 && t <= 21 ? 'orta' : t >= 22 && t <= 29 ? 'yuksek' : 'cok_yuksek')
    for (let t = 10; t <= 50; t++) assert.equal(k10Grubu(t), beklenen(t), String(t))
    // each edge the page prints, reached through the tool itself
    const toplamla = (t: number) => { const c = hepsi(1); let kalan = t - 10; for (let i = 0; i < 10 && kalan > 0; i++) { const ek = Math.min(4, kalan); c[i] += ek; kalan -= ek } return k10(c) }
    for (const [t, grup] of [[10, 'dusuk'], [15, 'dusuk'], [16, 'orta'], [21, 'orta'], [22, 'yuksek'], [29, 'yuksek'], [30, 'cok_yuksek'], [50, 'cok_yuksek']] as const) {
      const r = toplamla(t)
      assert.deepEqual([sayi(r, 'toplam'), r.bant], [t, grup])
    }
  })

  it('THE PAGE\'S OWN CROSS-CHECK: where a survey scored the answers the other way round, the same groups are 45-50, 39-44, 31-38 and 10-30', () => {
    // an answer scored 1..5 one way is 6 minus it the other way, so a total t is 60 - t
    const tersGruplar: readonly (readonly [number, number, string])[] = [[45, 50, 'dusuk'], [39, 44, 'orta'], [31, 38, 'yuksek'], [10, 30, 'cok_yuksek']]
    for (const [alt, ust, grup] of tersGruplar) for (let ters = alt; ters <= ust; ters++) assert.equal(k10Grubu(60 - ters), grup, `reversed total ${ters}`)
  })

  it('ALL TEN OR NOTHING: an item left empty, a half point or a value outside 1 to 5 gives no total and no group', () => {
    const dokuz = hepsi(3).slice(1)
    for (const c of [[null, ...dokuz], [...dokuz, null], [2.5, ...dokuz], [0, ...dokuz], [6, ...dokuz]]) {
      const r = k10(c)
      assert.deepEqual([r.tamam, r.bant, r.sayilar.length], [false, null, 0], JSON.stringify(c))
    }
  })
})

describe('au-body-size — body mass index and waist (AIHW, "Risk factors to health: Overweight and obesity", read 2026-10-10)', () => {
  const beden = (g: AracGirdisi) => kos(AU_BEDEN, { agirlik: null, boy: null, cinsiyet: null, bel: null, ...g })

  it('THE PAGE\'S OWN WORKED EXAMPLE: 75 kg and 175 cm (1.75 m) give 75 / (1.75 x 1.75) = 24.5', () => {
    const r = beden({ agirlik: 75, boy: 175 })
    assert.equal(r.tamam, true)
    assert.equal(sayi(r, 'bmi'), 24.5)
    assert.equal(r.bant, 'normal')
    assert.deepEqual(r.uyarilar, [])
    assert.equal(r.sayilar.length, 1, 'no waist was typed, so none is shown')
  })

  it('the adult classes as printed: less than 18.5; 18.5 to less than 25; 25 to less than 30; 30 or more', () => {
    for (const [bmi, sinif] of [[18.4, 'zayif'], [18.5, 'normal'], [24.9, 'normal'], [25, 'fazla'], [29.9, 'fazla'], [30, 'obez'], [45, 'obez']] as const) assert.equal(bmiSinifi(bmi), sinif, String(bmi))
    // through the tool: at a height of 200 cm the index is a quarter of the weight
    for (const [kg, bmi, sinif] of [[73.6, 18.4, 'zayif'], [74, 18.5, 'normal'], [99.6, 24.9, 'normal'], [100, 25, 'fazla'], [119.6, 29.9, 'fazla'], [120, 30, 'obez']] as const) {
      const r = beden({ agirlik: kg, boy: 200 })
      assert.deepEqual([sayi(r, 'bmi'), r.bant], [bmi, sinif], `${kg} kg`)
    }
  })

  it('THE NUMBER ON THE SCREEN AND THE CLASS BESIDE IT NEVER DISAGREE: the class is read from the index as it is written, to one decimal place', () => {
    // 99.9 kg at 200 cm is 24.975: written 25.0, and classed as 25.0
    const r = beden({ agirlik: 99.9, boy: 200 })
    assert.deepEqual([sayi(r, 'bmi'), r.bant], [25, 'fazla'])
  })

  it('the waist limits as printed: men 94 cm and 102 cm, women 80 cm and 88 cm — "or more", so a waist AT the limit is past it', () => {
    assert.deepEqual(BEL_SINIRLARI, { erkek: { artmis: 94, cok_artmis: 102 }, kadin: { artmis: 80, cok_artmis: 88 } })
    const uyari = (cinsiyet: string, bel: number) => beden({ agirlik: 75, boy: 175, cinsiyet, bel }).uyarilar
    assert.deepEqual([uyari('erkek', 93.9), uyari('erkek', 94), uyari('erkek', 101.9), uyari('erkek', 102)], [[], ['bel_artmis_erkek'], ['bel_artmis_erkek'], ['bel_cok_artmis_erkek']])
    assert.deepEqual([uyari('kadin', 79.9), uyari('kadin', 80), uyari('kadin', 87.9), uyari('kadin', 88)], [[], ['bel_artmis_kadin'], ['bel_artmis_kadin'], ['bel_cok_artmis_kadin']])
    // a man's waist is never read against a woman's limit
    assert.deepEqual(uyari('erkek', 85), [])
    assert.equal(sayi(beden({ agirlik: 75, boy: 175, cinsiyet: 'kadin', bel: 85 }), 'bel'), 85)
  })

  it('a waist without the patient\'s sex is not read at all; a missing weight or height gives no result', () => {
    const r = beden({ agirlik: 75, boy: 175, bel: 110 })
    assert.deepEqual([r.tamam, r.uyarilar, r.sayilar.length], [true, [], 1], 'the field is not there until the sex is chosen: no limit is applied by guess')
    assert.equal(beden({ agirlik: 75 }).tamam, false)
    assert.equal(beden({ boy: 175 }).tamam, false)
    assert.equal(beden({}).tamam, false)
  })
})

describe('au-oncology-grading — a record of the ECOG grade (ECOG-ACRIN, "ECOG Performance Status Scale", read 2026-10-10: six grades, 0 to 5)', () => {
  it('six grades, 0 to 5, named by their number; the tool repeats the grade the doctor chose and works nothing out', () => {
    assert.deepEqual([...ECOG_DERECELERI], ['g0', 'g1', 'g2', 'g3', 'g4', 'g5'])
    for (const d of ECOG_DERECELERI) { const r = kos(AU_ECOG, { derece: d }); assert.deepEqual([r.tamam, r.bant, r.sayilar, r.uyarilar], [true, d, [], []]) }
    for (const d of [null, 'g6', '3', '']) assert.equal(kos(AU_ECOG, { derece: d }).tamam, false, String(d))
  })
})

describe('the mechanisms only Australia has', () => {
  it('each key carries the country\'s code, each names the source of its arithmetic, and none asks the country for a number of its own', () => {
    assert.deepEqual(AU_TANIMLAR.map((t) => t.anahtar), ['au-body-size', 'au-mental-health-screen', 'au-oncology-grading'])
    for (const t of AU_TANIMLAR) {
      assert.match(t.anahtar, /^au-[a-z0-9]+(-[a-z0-9]+)*$/)
      assert.ok((t.kaynak ?? '').length > 20, t.anahtar)
      assert.equal(t.parametreler, undefined, t.anahtar)
      // NO TOOL OF AUSTRALIA'S OWN WRITES AN AMOUNT OF A MEDICINE
      assert.equal(t.dozYazar, undefined, t.anahtar)
    }
  })
})
