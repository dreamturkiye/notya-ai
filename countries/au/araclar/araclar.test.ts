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
import { alanVarMi } from '@/lib/ulke/araclar/yardimci'
import { AU_ASI_TAKVIMI, AU_ASI_TAKVIMI_MADDELERI, AU_BEDEN, AU_ECOG, AU_K10, AU_TANIMLAR, BEL_SINIRLARI, bmiSinifi, ECOG_DERECELERI, k10Grubu, K10_MADDELERI } from './tanimlar'
import { AU_GST } from './gstInvoice'
import { AU_MEDICARE } from './medicareParticulars'
import { AU_ZORUNLU_BILDIRIM } from './notifications'
import { AU_PBS_RECETE } from './pbsPrescription'

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

describe('au-immunisation-schedule — the National Immunisation Program schedule (read via NSW Health\'s published rendering, health.nsw.gov.au/schedule, current as at 1 October 2026, read 2026-10-13)', () => {
  const kosAsi = (g: AracGirdisi) => AU_ASI_TAKVIMI.hesapla(kosullariUygula(AU_ASI_TAKVIMI.alanlar, g), { bugun: BUGUN, p: {} })

  it('twelve milestones, birth to 75 years and over, exactly as the page lists them, in order', () => {
    assert.deepEqual([...AU_ASI_TAKVIMI_MADDELERI], ['dogum', 'hafta6', 'ay4', 'ay6', 'ay12', 'ay18', 'yas4', 'yil7', 'yil10', 'gebelik', 'yas65', 'yas75'])
  })

  it('a tick alone, with no date, is still a complete record (the date is optional), and it does not claim an AIR report', () => {
    const r = kosAsi({ dogum: true })
    assert.deepEqual([r.tamam, sayi(r, 'isaretli'), r.tarihler, r.uyarilar], [true, 1, [], ['air_yok']])
  })

  it('a tick with its date is recorded under that milestone\'s own date key', () => {
    const r = kosAsi({ ay12: true, ay12_tarih: '2026-10-01' })
    assert.deepEqual(r.tarihler, [{ anahtar: 'ay12_tarih', tarih: '2026-10-01' }])
  })

  it('every milestone can be ticked at once, and the count is exactly twelve', () => {
    const tumu = Object.fromEntries(AU_ASI_TAKVIMI_MADDELERI.map((k) => [k, true]))
    const r = kosAsi(tumu)
    assert.deepEqual([r.tamam, sayi(r, 'isaretli')], [true, 12])
  })

  it('nothing ticked gives no result: the tool works nothing out and holds no default', () => {
    assert.equal(kosAsi({}).tamam, false)
  })

  it('the tool has no dose, no catch-up rule and no eligibility test: it carries no parameter and no table', () => {
    assert.equal(AU_ASI_TAKVIMI.parametreler, undefined)
    assert.equal(AU_ASI_TAKVIMI.tablolar, undefined)
    assert.ok((AU_ASI_TAKVIMI.kaynak ?? '').includes('National Immunisation Program'))
  })
})

describe('the mechanisms only Australia has', () => {
  it('each key carries the country\'s code, each names the source of its arithmetic, and none asks the country for a number of its own', () => {
    assert.deepEqual(AU_TANIMLAR.map((t) => t.anahtar), ['au-body-size', 'au-mental-health-screen', 'au-oncology-grading', 'au-immunisation-schedule', 'au-notifiable-diseases', 'au-poisons-schedules', 'au-schedule-8', 'au-dispensing-label', 'au-mandatory-notifications', 'au-pbs-prescription', 'au-medicare-particulars', 'au-identifier-check', 'au-privacy-principles', 'au-tax-invoice'])
    for (const t of AU_TANIMLAR) {
      assert.match(t.anahtar, /^au-[a-z0-9]+(-[a-z0-9]+)*$/)
      assert.ok((t.kaynak ?? '').length > 20, t.anahtar)
      assert.equal(t.parametreler, undefined, t.anahtar)
      // NO TOOL OF AUSTRALIA'S OWN WRITES AN AMOUNT OF A MEDICINE
      assert.equal(t.dozYazar, undefined, t.anahtar)
    }
  })
})

const gorunen = (t: AracTanimi, ham: AracGirdisi) => t.alanlar.filter((a) => a.tur === 'isaret' && alanVarMi(a, kosullariUygula(t.alanlar, ham))).map((a) => a.anahtar)

describe('statutory checklists read on 2026-10-15 — a tick on the wrong path does not count', () => {
  it('mandatory notifications: the treating-practitioner path is not the section 140 path', () => {
    assert.equal(kos(AU_ZORUNLU_BILDIRIM, { m_cinsel: true }).tamam, false)
    const meslek = kos(AU_ZORUNLU_BILDIRIM, { yol: 'meslek', m_cinsel: true, t_cinsel: true })
    assert.equal(meslek.tamam, true)
    assert.equal(sayi(meslek, 'isaretli'), 1)
    assert.equal(meslek.sayilar[0].enCok, 5)
    assert.deepEqual(gorunen(AU_ZORUNLU_BILDIRIM, { yol: 'meslek' }).includes('t_cinsel'), false)
    assert.deepEqual(gorunen(AU_ZORUNLU_BILDIRIM, { yol: 'tedavi' }), ['t_cinsel', 't_bozukluk', 't_alkol', 't_standart', 't_ogrenci'])
    assert.equal(gorunen(AU_ZORUNLU_BILDIRIM, { yol: 'isveren' }).length, 4)
    assert.deepEqual(meslek.uyarilar, ['gonderilmedi', 'istisna'])
  })

  it('PBS prescription: a paper form shows the paper lines, and an electronic prescription does not', () => {
    assert.equal(kos(AU_PBS_RECETE, { ad: true }).tamam, false)
    const kagit = kos(AU_PBS_RECETE, { bicim: 'kagit', ad: true, olcu: true, meta: true })
    assert.equal(kagit.tamam, true)
    assert.equal(sayi(kagit, 'isaretli'), 2)
    assert.ok(gorunen(AU_PBS_RECETE, { bicim: 'kagit' }).includes('olcu'))
    assert.equal(gorunen(AU_PBS_RECETE, { bicim: 'kagit' }).includes('meta'), false)
    assert.ok(gorunen(AU_PBS_RECETE, { bicim: 'elektronik' }).includes('meta'))
    assert.equal(gorunen(AU_PBS_RECETE, { bicim: 'elektronik' }).includes('olcu'), false)
    assert.equal(kagit.sayilar[0].enCok, gorunen(AU_PBS_RECETE, { bicim: 'kagit' }).length)
    assert.deepEqual(kagit.uyarilar, ['gonderilmedi'])
    const yazilan = AU_PBS_RECETE.alanlar.find((a) => a.anahtar === 'yazilan')
    assert.equal(yazilan?.tur, 'metin')
    assert.equal(kos(AU_PBS_RECETE, { bicim: 'kagit', yazilan: 'the benefit as written' }).tamam, false)
  })

  it('Medicare particulars: a general medical service does not show the pathology lines', () => {
    assert.equal(kos(AU_MEDICARE, { ad: true }).tamam, false)
    const genel = kos(AU_MEDICARE, { sinif: 'genel', ad: true, pat_kim: true })
    assert.equal(genel.tamam, true)
    assert.equal(sayi(genel, 'isaretli'), 1)
    assert.equal(genel.sayilar[0].enCok, 7)
    assert.equal(gorunen(AU_MEDICARE, { sinif: 'genel' }).includes('pat_kim'), false)
    assert.ok(gorunen(AU_MEDICARE, { sinif: 'patoloji' }).includes('pat_kim'))
    assert.equal(gorunen(AU_MEDICARE, { sinif: 'goruntuleme' }).includes('kim'), false)
    assert.deepEqual(genel.uyarilar, ['gonderilmedi'])
  })

  it('GST tax invoice: a supplier invoice under 1,000 hides the recipient line, and a recipient-issued invoice shows who pays the GST', () => {
    assert.equal(kos(AU_GST, { niyet: true }).tamam, false)
    const alti = kos(AU_GST, { sinif: 'alti', niyet: true, alici_kim: true, alici_gst: true })
    assert.equal(alti.tamam, true)
    assert.equal(sayi(alti, 'isaretli'), 1)
    assert.equal(alti.sayilar[0].enCok, 7)
    assert.equal(gorunen(AU_GST, { sinif: 'alti' }).includes('alici_kim'), false)
    assert.equal(gorunen(AU_GST, { sinif: 'alti' }).includes('alici_gst'), false)
    assert.ok(gorunen(AU_GST, { sinif: 'bin' }).includes('alici_kim'))
    assert.equal(gorunen(AU_GST, { sinif: 'bin' }).includes('alici_gst'), false)
    const alici = kos(AU_GST, { sinif: 'alici', alici_gst: true })
    assert.equal(alici.tamam, true)
    assert.ok(gorunen(AU_GST, { sinif: 'alici' }).includes('alici_gst'))
    assert.equal(alici.sayilar[0].enCok, 9)
    assert.deepEqual(alti.uyarilar, ['gonderilmedi'])
  })
})
