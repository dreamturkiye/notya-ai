/**
 * BUYUME-GRAFIK-V2 — age window, ticks, percentile trend and wording of the growth cards; birth values from the record.
 *   npx tsx --test lib/clinical/buyumeGrafik.test.ts
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  yasPenceresi, yasTikleri, degerTikleri, persentilEgilimi, egilimMetni, cizgiGecisi, persentilEtiketi, degerMetni, yasMetni, bantDisiMi,
} from './buyumeGrafik'
import { cizgiGecisi as motorCizgiGecisi, MAJOR_PERSENTILLER } from '@/specialties/pediatri/engines/buyume'
import { dogumOlcumleri } from './dogumOlcumu'

describe('yasPenceresi — default zoom fits the child', () => {
  it('2-month-old (Elif) → 0–6 months, full range offered', () => {
    const p = yasPenceresi(2, [0, 1, 1.95], 24)
    assert.deepEqual(p, { varsayilanUst: 6, tamUst: 24, daraltilmis: true })
  })
  it('5 months → 0–6; 10 months → 0–12; 11 months → 0–24; 20 months → 0–24', () => {
    assert.equal(yasPenceresi(5, [], 24).varsayilanUst, 6)
    assert.equal(yasPenceresi(10, [], 24).varsayilanUst, 12)
    assert.equal(yasPenceresi(11, [], 24).varsayilanUst, 24)
    assert.equal(yasPenceresi(20, [], 26).varsayilanUst, 24)
  })
  it('older children step through 36 / 60 / 120 / 216 and never exceed the drawn range', () => {
    assert.equal(yasPenceresi(30, [], 36).varsayilanUst, 36)
    assert.equal(yasPenceresi(48, [], 54).varsayilanUst, 54)
    assert.equal(yasPenceresi(48, [], 54).daraltilmis, false)
    assert.equal(yasPenceresi(96, [], 102).varsayilanUst, 102)
  })
  it('a measurement later than the stated age widens the window', () => {
    assert.equal(yasPenceresi(2, [7], 24).varsayilanUst, 12)
  })
  it('no age and no points → the full range', () => {
    assert.deepEqual(yasPenceresi(null, [], 30), { varsayilanUst: 30, tamUst: 30, daraltilmis: false })
  })
})

describe('ticks', () => {
  it('months up to 3 years with readable steps; years beyond', () => {
    assert.deepEqual(yasTikleri(6).tikler.map((t) => t.ay), [0, 1, 2, 3, 4, 5, 6])
    assert.deepEqual(yasTikleri(12).tikler.map((t) => t.ay), [0, 2, 4, 6, 8, 10, 12])
    assert.deepEqual(yasTikleri(24).tikler.map((t) => t.ay), [0, 3, 6, 9, 12, 15, 18, 21, 24])
    assert.equal(yasTikleri(24).birim, 'ay')
    const y = yasTikleri(60)
    assert.equal(y.birim, 'yas')
    assert.deepEqual(y.tikler.map((t) => t.etiket), ['0', '1', '2', '3', '4', '5'])
    assert.deepEqual(yasTikleri(216).tikler.map((t) => t.etiket).slice(0, 3), ['0', '2', '4'])
  })
  it('value ticks are few and round', () => {
    const t = degerTikleri(2.3, 8.9, 4)
    assert.deepEqual(t.tikler, [2, 4, 6, 8, 10])
    const b = degerTikleri(45.1, 69.8, 4)
    assert.ok(b.tikler.length >= 3 && b.tikler.length <= 6, String(b.tikler))
    assert.ok(b.tikler.every((v) => Number.isInteger(v / 5)))
    assert.ok(b.altSinir <= 45.1 && b.ustSinir >= 69.8)
  })
})

describe('persentilEgilimi — trend of the child’s own points', () => {
  it('one shared crossing count with the pediatri engine (no copy)', () => {
    assert.equal(cizgiGecisi, motorCizgiGecisi)
    assert.deepEqual([...MAJOR_PERSENTILLER], [3, 10, 25, 50, 75, 90, 97])
    assert.equal(cizgiGecisi(52, 8), -3)
    assert.equal(cizgiGecisi(52, 20), -2)
    assert.equal(cizgiGecisi(40, 60), 1)
  })
  it('< 2 points with a percentile → nothing to say', () => {
    assert.deepEqual(persentilEgilimi([{ ay: 0, persentil: 40 }, { ay: 2, persentil: null }]), { tur: 'yok' })
    assert.equal(egilimMetni({ tur: 'yok' }), null)
  })
  it('within one line → tracking the channel', () => {
    const e = persentilEgilimi([{ ay: 0, persentil: 46 }, { ay: 1, persentil: 49 }, { ay: 2, persentil: 52 }])
    assert.equal(e.tur, 'kanal')
    assert.deepEqual(egilimMetni(e), { metin: 'Persentil kanalında ilerliyor', uyari: false })
  })
  it('≥ 2 major lines down → flagged with direction and the two percentiles; largest crossing wins', () => {
    const e = persentilEgilimi([{ ay: 9, persentil: 60 }, { ay: 12, persentil: 40 }, { ay: 18, persentil: 8 }])
    assert.equal(e.tur, 'kayma')
    if (e.tur !== 'kayma') return
    assert.equal(e.yon, 'asagi'); assert.equal(e.cizgi, 3); assert.equal(e.pOnce, 60); assert.equal(e.erken, false)
    assert.deepEqual(egilimMetni(e), { metin: '3 ana persentil çizgisi aşağı (60. → 8.)', uyari: true })
  })
  it('a crossing that starts in the first months carries the physiological caveat', () => {
    const e = persentilEgilimi([{ ay: 0, persentil: 92 }, { ay: 3, persentil: 45 }])
    assert.equal(e.tur, 'kayma')
    assert.match(egilimMetni(e)!.metin, /ilk aylarda fizyolojik olabilir/)
  })
  it('with ≥ 2 points from 6 months on, the birth value is history (no early caveat, compared from 6 months)', () => {
    const e = persentilEgilimi([{ ay: 0, persentil: 67 }, { ay: 6, persentil: 70 }, { ay: 12, persentil: 55 }, { ay: 40, persentil: 4 }])
    assert.equal(e.tur, 'kayma')
    if (e.tur !== 'kayma') return
    assert.equal(e.pOnce, 70); assert.equal(e.erken, false); assert.equal(e.cizgi, 3)
    assert.equal(persentilEgilimi([{ ay: 0, persentil: 92 }, { ay: 7, persentil: 45 }, { ay: 9, persentil: 50 }]).tur, 'kanal')
  })
  it('points arriving out of order are sorted by age first', () => {
    const e = persentilEgilimi([{ ay: 18, persentil: 8 }, { ay: 9, persentil: 60 }])
    assert.equal(e.tur === 'kayma' && e.yon, 'asagi')
  })
})

describe('wording', () => {
  it('percentile, value and age read naturally in Turkish', () => {
    assert.equal(persentilEtiketi(52.4), '52. persentil')
    assert.equal(persentilEtiketi(0.1), '<1. persentil')
    assert.equal(persentilEtiketi(99.9), '>99. persentil')
    assert.equal(degerMetni(5.1, 'kg'), '5,1 kg')
    assert.equal(degerMetni(3.25, 'kg'), '3,25 kg')
    assert.equal(degerMetni(57.46, 'cm'), '57,5 cm')
    assert.equal(yasMetni(0), 'Doğum')
    assert.equal(yasMetni(0.5), '15 günlük')
    assert.equal(yasMetni(1.94), '1 ay 29 günlük')
    assert.equal(yasMetni(2.02), '2 aylık')
    assert.equal(yasMetni(9.5), '9 aylık')
    assert.equal(yasMetni(27), '2 yaş 3 aylık')
    assert.equal(bantDisiMi(2.5), true); assert.equal(bantDisiMi(50), false)
  })
})

describe('dogumOlcumleri — birth values from the record', () => {
  it('Elif’s form answers parse (Turkish thousands dot, decimal comma)', () => {
    assert.deepEqual(dogumOlcumleri(null, { dogumKilosuPed: '3.200', dogumBoyuPed: '50', basCevresiPed: '34,5' }), {
      kilo: { deger: 3.2, kaynak: 'intake' }, boy: { deger: 50, kaynak: 'intake' }, basCevresi: { deger: 34.5, kaynak: 'intake' },
    })
    assert.equal(dogumOlcumleri(null, { dogumKilosuPed: '3200 g' }).kilo?.deger, 3.2)
    assert.equal(dogumOlcumleri(null, { dogumKilosuPed: '3,2 kg' }).kilo?.deger, 3.2)
  })
  it('card first, per value; the form fills what the card lacks', () => {
    const d = dogumOlcumleri({ kilo_gram: 3350, boy_cm: null, bas_cevresi_cm: '35' }, { dogumKilosuPed: '3200', dogumBoyuPed: '50' })
    assert.deepEqual(d, { kilo: { deger: 3.35, kaynak: 'bebek_karti' }, boy: { deger: 50, kaynak: 'intake' }, basCevresi: { deger: 35, kaynak: 'bebek_karti' } })
  })
  it('values no newborn has are dropped', () => {
    assert.deepEqual(dogumOlcumleri(null, { dogumKilosuPed: '32', dogumBoyuPed: '75', basCevresiPed: '44' }), {})
    assert.deepEqual(dogumOlcumleri(null, null), {})
  })
})
