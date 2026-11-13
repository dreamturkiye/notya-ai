/**
 * PREMATUR-ULKE-01 — the country engine, held to the Türkiye module's numbers (the fixture carries them) and to the rule
 * "nothing is invented": the corrected age, the follow-up plan, the early-birth record, the protocol check.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buyumeAyi, duzeltilmisYas, duzeltilmisYasBicimi, gestasyonGunu, gestasyonMetni, postmenstrualMetni, TERM_GUN } from './yas'
import { planKapsami, siradakiOge, takipPlani, type PlanGirdisi, type TakipOgesi } from './plan'
import { BOS_KAYIT, erkenDogumDegerlendir, erkenDogumTemizle, ozetCikar, steroidPenceresi, type ErkenDogumKaydi } from './erkenDogum'
import { erkenDogumSorunlari, protokolSorunlari } from './dogrulama'
import { profilTemizle } from './tipler'
import { TEST_ERKEN_DOGUM, TEST_ERKEN_DOGUM_YEREL, TEST_PROTOKOLU, TEST_YEREL_PROTOKOLU } from '../testing/prematurProtokolu'

const g = (h: number, d = 0) => h * 7 + d
const K = TEST_PROTOKOLU.duzeltme
const plan = (o: Partial<PlanGirdisi> & Pick<PlanGirdisi, 'dogumIso' | 'bugunIso'>, p = TEST_PROTOKOLU) => takipPlani({ gestasyonGun: null, dogumKiloGr: null, profil: {}, ...o }, p)
const oge = (p: { ogeler: TakipOgesi[] }, id: string) => p.ogeler.find((o) => o.id === id)

describe('corrected age: definition and cut-off', () => {
  it('24-42 weeks: only < 37 weeks is corrected; correction = 40 weeks - gestation', () => {
    for (let hafta = 24; hafta <= 42; hafta++) {
      const y = duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(hafta), tarihIso: '2026-03-01' }, K)
      assert.equal(y.gecerli, true)
      assert.equal(y.kronolojikGun, 59)
      if (hafta < 37) {
        assert.equal(y.prematur, true)
        assert.equal(y.erkenGun, TERM_GUN - hafta * 7)
        assert.equal(y.duzeltilmisGun, 59 - (40 - hafta) * 7)
        assert.equal(y.buyume.duzeltilmis, true)
        assert.equal(y.gelisim.duzeltilmis, true)
      } else {
        assert.equal(y.prematur, false)
        assert.equal(y.erkenGun, 0)
        assert.equal(y.duzeltilmisGun, 59)
        assert.equal(y.buyume.duzeltilmis, false)
        assert.equal(y.terimTarihiIso, null)
      }
    }
  })
  it('boundary: 36+6 is preterm, 37+0 is not', () => {
    assert.equal(duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(36, 6), tarihIso: '2026-02-01' }, K).prematur, true)
    assert.equal(duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(37), tarihIso: '2026-02-01' }, K).prematur, false)
  })
  it('expected term date = birth + (280 - gestation)', () => {
    const y = duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(28), tarihIso: '2026-03-01' }, K)
    assert.equal(y.terimTarihiIso, '2026-03-26')
    assert.equal(y.duzeltilmisGun, 59 - 84)
  })
  it('chronological 24th month: corrected the day before, correction ends that day', () => {
    const once = duzeltilmisYas({ dogumIso: '2024-01-15', gestasyonGun: g(30), tarihIso: '2026-01-14' }, K)
    const gun = duzeltilmisYas({ dogumIso: '2024-01-15', gestasyonGun: g(30), tarihIso: '2026-01-15' }, K)
    assert.equal(once.kronolojikAy, 23); assert.equal(once.buyume.duzeltilmis, true)
    assert.equal(gun.kronolojikAy, 24); assert.equal(gun.buyume.duzeltilmis, false); assert.equal(gun.gelisim.duzeltilmis, false)
  })
  it('29 February birth: the calendar month count holds', () => {
    assert.equal(duzeltilmisYas({ dogumIso: '2024-02-29', gestasyonGun: g(32), tarihIso: '2026-02-27' }, K).kronolojikAy, 23)
    assert.equal(duzeltilmisYas({ dogumIso: '2024-02-29', gestasyonGun: g(32), tarihIso: '2026-02-28' }, K).kronolojikAy, 23)
    assert.equal(duzeltilmisYas({ dogumIso: '2024-02-29', gestasyonGun: g(32), tarihIso: '2026-03-01' }, K).kronolojikAy, 24)
  })
  it('birth day = today: 0 days, before term; growth month is undefined before term', () => {
    const y = duzeltilmisYas({ dogumIso: '2026-05-05', gestasyonGun: g(25), tarihIso: '2026-05-05' }, K)
    assert.equal(y.kronolojikGun, 0); assert.equal(y.duzeltilmisGun, -105); assert.equal(y.buyume.termOncesi, true)
    assert.equal(buyumeAyi(y), null)
    const t = duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(34), tarihIso: '2026-03-01' }, K)
    assert.ok(Math.abs((buyumeAyi(t) as number) - 17 / 30.4375) < 1e-9)
  })
  it('postmenstrual age = gestation + chronological', () => {
    const y = duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(28, 3), tarihIso: '2026-01-31' }, K)
    assert.equal(y.postmenstrualGun, g(28, 3) + 30); assert.equal(postmenstrualMetni(y), '32+5')
  })
  it('invalid input never silently gives a wrong age', () => {
    const c = (gestasyonGun: number | null, dogumIso = '2026-01-01', tarihIso = '2026-02-01') => duzeltilmisYas({ dogumIso, gestasyonGun, tarihIso }, K).durumKodu
    assert.equal(c(null), 'gestasyon-yok'); assert.equal(c(100), 'gestasyon-gecersiz'); assert.equal(c(400), 'gestasyon-gecersiz'); assert.equal(c(200.5), 'gestasyon-gecersiz')
    assert.equal(c(g(30), '2026-03-01'), 'tarih-gecersiz'); assert.equal(c(g(30), 'bad'), 'tarih-gecersiz')
  })
  it('the rule is injected: another cut-off and upper age', () => {
    const kural = { ...K, baslangicHafta: 35, buyumeUstAy: 12, gelisimUstAy: 36 }
    assert.equal(duzeltilmisYas({ dogumIso: '2025-01-01', gestasyonGun: g(36), tarihIso: '2025-06-01' }, kural).prematur, false)
    const b = duzeltilmisYas({ dogumIso: '2024-01-01', gestasyonGun: g(30), tarihIso: '2025-03-01' }, kural)
    assert.equal(b.buyume.duzeltilmis, false); assert.equal(b.gelisim.duzeltilmis, true)
  })
  it('gestasyonGunu: decimal weeks to days', () => {
    assert.equal(gestasyonGunu(32 + 4 / 7), g(32, 4)); assert.equal(gestasyonGunu(32.57), g(32, 4))
    assert.equal(gestasyonGunu(19.9), null); assert.equal(gestasyonGunu(46), null); assert.equal(gestasyonGunu(null), null)
    assert.equal(gestasyonMetni(g(29, 6)), '29+6')
  })
  it('screen shape: months, days before term, none for a term baby', () => {
    const y = duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(30), tarihIso: '2026-06-01' }, K)
    assert.deepEqual(duzeltilmisYasBicimi(y, '2026-06-01'), { tur: 'ay', ay: 2 })
    assert.equal(duzeltilmisYasBicimi(duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(30), tarihIso: '2026-01-10' }, K), '2026-01-10').tur, 'term-oncesi')
    assert.equal(duzeltilmisYasBicimi(duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(39), tarihIso: '2026-06-01' }, K), '2026-06-01').tur, 'yok')
  })
})

describe('follow-up plan: scope', () => {
  it('a term baby: no plan, no item', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-02-01', gestasyonGun: g(39), dogumKiloGr: 3200 })
    assert.equal(p.kapsamda, false); assert.equal(p.kapsamNedeni, 'degil'); assert.deepEqual(p.ogeler, [])
  })
  it('gestation and weight unknown: out of scope, the missing data is named by code', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-02-01' })
    assert.equal(p.kapsamda, false); assert.equal(p.kapsamNedeni, 'bilinmiyor'); assert.deepEqual(p.eksikVeri, ['gestasyon', 'kilo'])
  })
  it('a term baby of <= 1500 g is in scope: ROP criterion met, no correction, cranial ultrasound out', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-10', gestasyonGun: g(38), dogumKiloGr: 1400 })
    assert.equal(p.kapsamda, true); assert.equal(p.kapsamNedeni, 'kilo'); assert.equal(p.yas.buyume.duzeltilmis, false)
    assert.equal(oge(p, 'rop:ilk-4hf')?.kriter.durum, 'karsilandi'); assert.equal(oge(p, 'cranial-us:first')?.durum, 'kriter-disi')
  })
  it('scope edge: 36+6 in, 37+0 out (no weight)', () => {
    assert.equal(planKapsami(g(36, 6), null, TEST_PROTOKOLU).kapsamda, true)
    assert.equal(planKapsami(g(37), null, TEST_PROTOKOLU).kapsamda, false)
    assert.equal(planKapsami(g(37), 1500, TEST_PROTOKOLU).kapsamda, true)
    assert.equal(planKapsami(g(37), 1501, TEST_PROTOKOLU).kapsamda, false)
  })
  it('after the 36th chronological month no plan is shown', () => {
    const p = plan({ dogumIso: '2023-01-01', bugunIso: '2026-01-01', gestasyonGun: g(28) })
    assert.equal(p.kapsamda, false); assert.equal(p.kapsamNedeni, 'ust-ay')
  })
  it('a birth date in the future is refused with its own code', () => {
    assert.equal(plan({ dogumIso: '2026-03-01', bugunIso: '2026-02-01', gestasyonGun: g(30) }).kapsamNedeni, 'tarih-gecersiz')
  })
})

describe('follow-up plan: dates (the Türkiye numbers)', () => {
  const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-20', gestasyonGun: g(28), dogumKiloGr: 1100 })
  it('ROP: gestation >= 27 gives postnatal week 4 (birth + 28 days)', () => {
    const r = oge(p, 'rop:ilk-4hf')!
    assert.equal(r.bas, '2026-01-29'); assert.equal(r.durum, 'yaklasiyor'); assert.ok(!oge(p, 'rop:ilk-pma'))
    assert.ok(r.kaynaklar.length >= 2)
  })
  it('ROP: gestation < 27 gives PMA week 30-31 (25+0 gives birth + 35..42 days)', () => {
    const r = oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-20', gestasyonGun: g(25), dogumKiloGr: 700 }), 'rop:ilk-pma')!
    assert.equal(r.bas, '2026-02-05'); assert.equal(r.son, '2026-02-12')
  })
  it('ROP edge: 26+6 uses PMA, 27+0 uses week 4', () => {
    assert.ok(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-05', gestasyonGun: g(26, 6) }), 'rop:ilk-pma'))
    assert.ok(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-05', gestasyonGun: g(27) }), 'rop:ilk-4hf'))
  })
  it('ROP: gestation unknown with <= 1500 g shows week 4 on an assumption (the unknown condition is named)', () => {
    const r = oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-05', dogumKiloGr: 1200 }), 'rop:ilk-4hf')!
    assert.equal(r.bas, '2026-01-29'); assert.equal(r.varsayim?.length, 1)
  })
  it('cranial ultrasound: day 7-10, week 4-6, PMA 36-40', () => {
    const a = oge(p, 'cranial-us:first')!
    assert.equal(a.bas, '2026-01-08'); assert.equal(a.son, '2026-01-11'); assert.equal(a.durum, 'gecikti')
    const b = oge(p, 'cranial-us:repeat')!
    assert.equal(b.bas, '2026-01-29'); assert.equal(b.son, '2026-02-12')
    const c = oge(p, 'cranial-us:term')!
    assert.equal(c.bas, '2026-02-26'); assert.equal(c.son, '2026-03-26')
    assert.equal(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-20', gestasyonGun: g(31), dogumKiloGr: 1600 }), 'cranial-us:first')?.durum, 'kriter-disi')
  })
  it('iron: preterm gives the month-2 window (day 60-212)', () => {
    const d = oge(p, 'iron:start')!
    assert.equal(d.bas, '2026-03-02'); assert.equal(d.son, '2026-08-01')
  })
  it('month ends and leap years', () => {
    assert.equal(oge(plan({ dogumIso: '2024-01-31', bugunIso: '2024-02-10', gestasyonGun: g(28) }), 'hearing-9m:assess')?.kriter.durum, 'belirsiz')
    const r = plan({ dogumIso: '2024-01-31', bugunIso: '2024-02-10', gestasyonGun: g(28), profil: { nicuGun: 40 } })
    assert.equal(oge(r, 'hearing-9m:assess')?.son, '2024-10-31'); assert.equal(oge(r, 'hearing-9m:follow-24m')?.bas, '2026-01-31')
  })
})

describe('follow-up plan: status, noise, the doctor\'s confirmation', () => {
  it('past and unmarked: overdue up to 180 days, then "no record"', () => {
    assert.equal(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(28) }), 'cranial-us:first')?.durum, 'gecikti')
    const eski = plan({ dogumIso: '2025-01-01', bugunIso: '2025-12-01', gestasyonGun: g(28) })
    assert.equal(oge(eski, 'cranial-us:first')?.durum, 'kayit-eksik'); assert.ok(eski.ozet.kayitEksik > 0)
  })
  it('the doctor\'s "done" and "not applicable" override; "planned" changes nothing', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(28), durumlar: { 'cranial-us:first': { durum: 'yapildi', tarih: '2026-01-09' }, 'cranial-us:repeat': { durum: 'uygulanmaz' }, 'cranial-us:term': { durum: 'plana_alindi' } } })
    assert.equal(oge(p, 'cranial-us:first')?.durum, 'yapildi'); assert.equal(oge(p, 'cranial-us:repeat')?.durum, 'uygulanmaz')
    assert.equal(oge(p, 'cranial-us:first')?.hekim?.tarih, '2026-01-09'); assert.equal(oge(p, 'cranial-us:term')?.hekim?.durum, 'plana_alindi')
  })
  it('nothing becomes "done" without the doctor\'s mark', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(28) })
    assert.ok(p.ogeler.every((o) => o.hekim === null && o.durum !== 'yapildi'))
  })
  it('the summary counts only items whose criterion is met', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-20', gestasyonGun: g(28), dogumKiloGr: 1100 })
    assert.equal(p.ozet.gecikti, 1); assert.ok(p.ozet.yaklasiyor >= 2)
    assert.equal(siradakiOge(p)?.id, 'cranial-us:first')
  })
})

describe('follow-up plan: criterion met / not met / not known', () => {
  const kr = (o: Parameters<typeof plan>[0], id: string) => oge(plan(o), id)?.kriter.durum
  it('RSV: < 29 weeks and < 12 months; 28+6 met, 29+0 not (no other route)', () => {
    assert.equal(kr({ dogumIso: '2026-01-01', bugunIso: '2026-06-01', gestasyonGun: g(27) }, 'rsv:bilgi'), 'karsilandi')
    const ek = { profil: { oksijen28Gun: false, hsKkh: false } }
    assert.equal(kr({ dogumIso: '2026-01-01', bugunIso: '2026-02-01', gestasyonGun: g(28, 6), ...ek }, 'rsv:bilgi'), 'karsilandi')
    assert.equal(kr({ dogumIso: '2026-01-01', bugunIso: '2026-02-01', gestasyonGun: g(29), ...ek }, 'rsv:bilgi'), 'karsilanmadi')
    assert.equal(kr({ dogumIso: '2025-01-01', bugunIso: '2026-02-01', gestasyonGun: g(27), ...ek }, 'rsv:bilgi'), 'karsilanmadi')
  })
  it('RSV: chronic lung disease route; unknown oxygen with no other route is "not known" and shows "data missing"', () => {
    assert.equal(kr({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(30), profil: { oksijen28Gun: true, hsKkh: false } }, 'rsv:bilgi'), 'karsilandi')
    const b = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(30) })
    assert.equal(oge(b, 'rsv:bilgi')?.kriter.durum, 'belirsiz'); assert.equal(oge(b, 'rsv:bilgi')?.durum, 'veri-eksik')
  })
  it('chronic lung disease criterion: < 32 weeks and oxygen', () => {
    assert.equal(kr({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(29), profil: { oksijen28Gun: true } }, 'bpd:bilgi'), 'karsilandi')
    assert.equal(kr({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(32), profil: { oksijen28Gun: true } }, 'bpd:bilgi'), 'karsilanmadi')
    assert.equal(kr({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(29) }, 'bpd:bilgi'), 'belirsiz')
  })
  it('hearing: NICU > 5 days (exactly 5 does not meet); ECMO gives month 3', () => {
    assert.equal(kr({ dogumIso: '2026-01-01', bugunIso: '2026-02-01', gestasyonGun: g(30), profil: { nicuGun: 6 } }, 'hearing-9m:assess'), 'karsilandi')
    assert.equal(kr({ dogumIso: '2026-01-01', bugunIso: '2026-02-01', gestasyonGun: g(30), profil: { nicuGun: 5, ototoksik5Gun: false, degisimTransfuzyonu: false } }, 'hearing-9m:assess'), 'karsilanmadi')
    assert.equal(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-02-01', gestasyonGun: g(30), profil: { ecmo: true } }), 'hearing-ecmo:assess')?.son, '2026-04-01')
  })
  it('rules without a date (lung, RSV, bone) produce no date', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(29), profil: { oksijen28Gun: true } })
    for (const k of ['bpd:bilgi', 'rsv:bilgi', 'bone:bilgi']) { const o = oge(p, k)!; assert.equal(o.bas, null); assert.equal(o.son, null); assert.equal(o.hedef, null) }
  })
  it('the mother\'s history (steroid, PPROM, magnesium) never changes a rule', () => {
    const a = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(29), profil: { antenatalSteroid: true, pprom: true, magnezyum: true } })
    const b = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(29), profil: {} })
    assert.deepEqual(a.ogeler.map((o) => [o.id, o.durum, o.kriter.durum]), b.ogeler.map((o) => [o.id, o.durum, o.kriter.durum]))
  })
})

describe('follow-up plan: "follow your local protocol" and the protocol check', () => {
  it('a local-protocol rule shows for every baby in scope, with no date and no criterion; only the doctor closes it', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(29), dogumKiloGr: 1200 }, TEST_YEREL_PROTOKOLU)
    assert.equal(p.ogeler.length, TEST_YEREL_PROTOKOLU.kurallar.length)
    for (const o of p.ogeler) { assert.equal(o.durum, 'yerel'); assert.equal(o.kriter.durum, 'yerel'); assert.equal(o.bas, null); assert.equal(o.son, null); assert.equal(o.hedef, null) }
    assert.equal(p.ozet.yerel, p.ogeler.length); assert.equal(p.ozet.gecikti, 0); assert.equal(siradakiOge(p), null)
    const q = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(29), durumlar: { 'local-rop:yerel': { durum: 'yapildi', tarih: '2026-02-01' } } }, TEST_YEREL_PROTOKOLU)
    assert.equal(oge(q, 'local-rop:yerel')?.durum, 'yapildi')
  })
  it('the fixtures pass the protocol check; a dated rule with no source read, and a local rule with a date, do not', () => {
    assert.deepEqual(protokolSorunlari(TEST_PROTOKOLU, ['en']), [])
    assert.deepEqual(protokolSorunlari(TEST_YEREL_PROTOKOLU, ['en']), [])
    const citation = { kisa: 'Cited only', tam: 'Cited only (test citation, long enough)', durum: 'dogrulanmadi' as const, not: { en: 'Citation only, not read.' } }
    const invented = { ...TEST_PROTOKOLU, kurallar: [{ ...TEST_PROTOKOLU.kurallar[0], kaynaklar: [citation] }] }
    assert.ok(protokolSorunlari(invented, ['en']).some((s) => /no source of it was read/.test(s)))
    const bad = { ...TEST_YEREL_PROTOKOLU, kurallar: [{ ...TEST_YEREL_PROTOKOLU.kurallar[0], zamanlamalar: [{ kod: 'x', etiket: { en: 'x' }, bas: { tur: 'dogumdan-gun' as const, gun: 1 } }] }] }
    assert.ok(protokolSorunlari(bad, ['en']).some((s) => /local protocol/.test(s)))
    const noSource = { ...TEST_PROTOKOLU, kurallar: [{ ...TEST_PROTOKOLU.kurallar[0], kaynaklar: [] }] }
    assert.ok(protokolSorunlari(noSource, ['en']).some((s) => /no source/.test(s)))
    assert.ok(protokolSorunlari(TEST_PROTOKOLU, ['en', 'uz']).some((s) => /missing in a form|form/.test(s)))
  })
  it('the early-birth thresholds pass the check; thresholds with only a citation do not', () => {
    assert.deepEqual(erkenDogumSorunlari(TEST_ERKEN_DOGUM, ['en']), [])
    assert.deepEqual(erkenDogumSorunlari(TEST_ERKEN_DOGUM_YEREL, ['en']), [])
    const citationOnly = { ...TEST_ERKEN_DOGUM, kaynaklar: [{ kisa: 'Test cervix', tam: 'cited', durum: 'dogrulanmadi' as const, not: { en: 'x' } }, TEST_ERKEN_DOGUM.kaynaklar[1]] }
    assert.ok(erkenDogumSorunlari(citationOnly, ['en']).some((s) => /cervical thresholds need a source/.test(s)))
  })
  it('the engine files carry no country-specific term, no dose and no order language', () => {
    for (const f of ['plan.ts', 'yas.ts', 'tipler.ts', 'erkenDogum.ts', 'tarih.ts', 'dogrulama.ts']) {
      const s = readFileSync(join(__dirname, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      assert.doesNotMatch(s, /SGK|\bTND\b|\bTOD\b|Sağlık Bakanlığı|Türkiye|KVKK|e-Nabız|\bAAP\b|\bACOG\b|\bNHS\b|\bRCPCH\b|\bJCIH\b/, `${f} names a country, a society or a programme`)
      assert.doesNotMatch(s, /\bmg\b|mg\/kg|\bIU\b|\bmL\b|\bmcg\b/i, `${f} contains a dose unit`)
    }
  })
})

describe('profile cleaning', () => {
  it('out-of-range and wrong types become null; days beyond the week are kept only with a week', () => {
    const p = profilTemizle({ gestasyonHafta: 19, dogumKiloGr: '1850', nicuGun: -3, ecmo: 'true', hsKkh: 'yes', gestasyonGunKalan: 3, baska: 1 })
    assert.equal(p.gestasyonHafta, null); assert.equal(p.gestasyonGunKalan, null); assert.equal(p.dogumKiloGr, 1850); assert.equal(p.nicuGun, null); assert.equal(p.ecmo, true); assert.equal(p.hsKkh, null)
    assert.ok(!('baska' in p))
    const q = profilTemizle({ gestasyonHafta: 29, gestasyonGunKalan: 3 })
    assert.equal(q.gestasyonHafta, 29); assert.equal(q.gestasyonGunKalan, 3)
    assert.equal(profilTemizle({ gestasyonHafta: 45, gestasyonGunKalan: 4 }).gestasyonGunKalan, 0)
  })
  it('null, array and text give an empty profile', () => { for (const v of [null, undefined, [], 'x', 5]) assert.equal(profilTemizle(v).gestasyonHafta, null) })
})

describe('early-birth record', () => {
  const bugun = '2026-06-01'
  const girdi = (kayit: Partial<ErkenDogumKaydi>, o: { sat?: string | null; cogulTipi?: string | null; durum?: string } = {}) => ({ sat: o.sat === undefined ? '2026-02-09' : o.sat, tdt: null, cogulTipi: o.cogulTipi ?? 'tekil', durum: o.durum ?? 'aktif', kayit: { ...BOS_KAYIT, ...kayit } })
  const olcum = (mm: number, gest: number, tarih = '2026-05-18', yontem: 'transvajinal' | 'transabdominal' = 'transvajinal') => ({ id: `${tarih}-${yontem}`, tarih, gestasyonGun: gest, mm, yontem })
  const bayrak = (s: ReturnType<typeof erkenDogumDegerlendir>, k: string) => s.bayraklar.find((b) => b.kod === k)!

  it('gestation comes from the corrected due date, else the last menstrual period', () => {
    const s = erkenDogumDegerlendir(girdi({}), bugun, TEST_ERKEN_DOGUM)
    assert.equal(s.gestasyonGun, 112 + 0 + (new Date('2026-06-01').getTime() - new Date('2026-02-09').getTime()) / 86400000 - 112)
    const t = erkenDogumDegerlendir({ ...girdi({}), sat: '2026-01-01', tdt: '2026-11-08' }, bugun, TEST_ERKEN_DOGUM)
    assert.equal(t.gestasyonGun, gestasyonGunuHesap('2026-11-08', bugun))
    assert.equal(erkenDogumDegerlendir(girdi({}, { sat: null }), bugun, TEST_ERKEN_DOGUM).eksikVeri.includes('gebelik-baslangici'), true)
  })
  it('short cervix: below 25 mm met by the first definition; exactly 25 mm only by the second, and the boundary is named', () => {
    const b24 = bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(24.9, g(20))] }), bugun, TEST_ERKEN_DOGUM), 'kisa_serviks')
    assert.equal(b24.durum, 'karsilandi'); assert.deepEqual(b24.gerekce[1].p, { birinci: 1, diger: 1 })
    const b25 = bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(25, g(20))] }), bugun, TEST_ERKEN_DOGUM), 'kisa_serviks')
    assert.equal(b25.durum, 'karsilandi'); assert.deepEqual(b25.gerekce[1].p, { birinci: 0, diger: 1 }); assert.ok(b25.gerekce.some((x) => x.kod === 'tanim-siniri'))
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(25.1, g(20))] }), bugun, TEST_ERKEN_DOGUM), 'kisa_serviks').durum, 'karsilanmadi')
  })
  it('only a transvaginal measurement in 16+0-24+0 counts; a transabdominal one is named and flags nothing', () => {
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(18, g(20), '2026-05-18', 'transabdominal')] }), bugun, TEST_ERKEN_DOGUM), 'kisa_serviks').gerekce[0].kod, 'yalniz-ta')
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(18, g(25))] }), bugun, TEST_ERKEN_DOGUM), 'kisa_serviks').gerekce[0].kod, 'tv-yok-pencerede')
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(18, g(15, 6))] }), bugun, TEST_ERKEN_DOGUM), 'kisa_serviks').durum, 'belirsiz')
  })
  it('progesterone assessment: only for a single pregnancy with no previous spontaneous preterm birth, before 24 weeks', () => {
    const base = { serviks: [olcum(19, g(20))], oncekiSpontanPreterm: false }
    assert.equal(bayrak(erkenDogumDegerlendir(girdi(base), bugun, TEST_ERKEN_DOGUM), 'progesteron_degerlendirme').gerekce[0].kod, 'prog-esik')
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ ...base, serviks: [olcum(23, g(20))] }), bugun, TEST_ERKEN_DOGUM), 'progesteron_degerlendirme').gerekce[0].kod, 'prog-aralik')
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ ...base, serviks: [olcum(26, g(20))] }), bugun, TEST_ERKEN_DOGUM), 'progesteron_degerlendirme').durum, 'karsilanmadi')
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ ...base, oncekiSpontanPreterm: true }), bugun, TEST_ERKEN_DOGUM), 'progesteron_degerlendirme').gerekce[0].kod, 'prog-oyku')
    assert.equal(bayrak(erkenDogumDegerlendir(girdi(base, { cogulTipi: 'ikiz' }), bugun, TEST_ERKEN_DOGUM), 'progesteron_degerlendirme').gerekce[0].kod, 'prog-cogul')
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(19, g(24))], oncekiSpontanPreterm: false }), bugun, TEST_ERKEN_DOGUM), 'progesteron_degerlendirme').gerekce[0].kod, 'prog-gec')
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(19, g(20))] }), bugun, TEST_ERKEN_DOGUM), 'progesteron_degerlendirme').gerekce[0].kod, 'prog-oyku-girilmedi')
  })
  it('very short band: below 10 mm only; the engine raises no cerclage and no order', () => {
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(9.9, g(20))] }), bugun, TEST_ERKEN_DOGUM), 'cok_kisa_serviks').durum, 'karsilandi')
    assert.equal(bayrak(erkenDogumDegerlendir(girdi({ serviks: [olcum(10, g(20))] }), bugun, TEST_ERKEN_DOGUM), 'cok_kisa_serviks').durum, 'karsilanmadi')
  })
  it('trend: differences and day gaps, no flag from the speed of shortening', () => {
    const s = erkenDogumDegerlendir(girdi({ serviks: [olcum(32, g(18), '2026-05-04'), olcum(27, g(20), '2026-05-18')] }), bugun, TEST_ERKEN_DOGUM)
    assert.equal(s.trend[1].fark, -5); assert.equal(s.trend[1].gunAralik, 14); assert.equal(s.riskVar, false)
  })
  it('steroid windows: before 23, 23, 24+0-33+6, 34+0-36+6, after; repeat course gap in days', () => {
    const w = (d: number) => steroidPenceresi(d, TEST_ERKEN_DOGUM.steroid)
    assert.deepEqual([w(g(22, 6)), w(g(23)), w(g(24)), w(g(33, 6)), w(g(34)), w(g(36, 6)), w(g(37)), w(null as unknown as number)], ['oncesi', 'yasayabilirlik', 'ana', 'ana', 'gec', 'gec', 'disi', 'bilinmiyor'])
    const s = erkenDogumDegerlendir(girdi({ steroid: { yapildi: true, kurlar: [{ id: '2026-04-20', tarih: '2026-04-20' }, { id: '2026-05-04', tarih: '2026-05-04' }] } }), bugun, TEST_ERKEN_DOGUM)
    assert.equal(s.steroid.satirlar[1].oncekindenGun, 14)
  })
  it('PPROM, magnesium and progesterone are the doctor\'s facts, with the gestation of each date', () => {
    const s = erkenDogumDegerlendir(girdi({ pprom: { var: true, tarih: '2026-05-25' }, magnezyum: { verildi: true, tarih: '2026-05-26' }, progesteron: { kullaniyor: true, baslangic: '2026-05-18', yol: 'vajinal' } }), bugun, TEST_ERKEN_DOGUM)
    assert.equal(s.pprom?.gunOnce, 7); assert.ok(s.pprom?.gestasyon); assert.ok(s.magnezyum?.gestasyon); assert.equal(s.progesteron.kayit, 'var'); assert.equal(s.progesteron.yol, 'vajinal')
    assert.equal(s.kohortNedenleri.some((n) => n.kod === 'pprom'), true); assert.equal(s.riskVar, true)
  })
  it('FOLLOW YOUR LOCAL PROTOCOL: with no thresholds no flag is produced from a length and no steroid window is named; the record is kept', () => {
    const s = erkenDogumDegerlendir(girdi({ serviks: [olcum(8, g(20))], steroid: { yapildi: true, kurlar: [{ id: '2026-05-04', tarih: '2026-05-04' }] } }), bugun, TEST_ERKEN_DOGUM_YEREL)
    assert.equal(s.serviksYerel, true); assert.equal(s.steroidYerel, true)
    for (const k of ['kisa_serviks', 'progesteron_degerlendirme', 'cok_kisa_serviks']) assert.equal(bayrak(s, k).durum, 'yerel')
    assert.equal(s.trend.length, 1); assert.equal(s.trend[0].pencerede, false); assert.equal(s.steroid.satirlar[0].pencere, 'yerel')
    assert.equal(s.riskVar, false); assert.equal(s.kohortNedenleri.length, 0)
  })
  it('cleaning: bad dates and values are refused with a code; future dates never saved; duplicates merge', () => {
    assert.equal(erkenDogumTemizle({ serviks: [{ tarih: 'x', mm: 20, gestasyonGun: g(20) }] }, bugun).hata, 'serviks-tarih')
    assert.equal(erkenDogumTemizle({ serviks: [{ tarih: '2026-07-01', mm: 20, gestasyonGun: g(20) }] }, bugun).hata, 'serviks-ileri')
    assert.equal(erkenDogumTemizle({ serviks: [{ tarih: '2026-05-01', mm: 0, gestasyonGun: g(20) }] }, bugun).hata, 'serviks-mm')
    assert.equal(erkenDogumTemizle({ serviks: [{ tarih: '2026-05-01', mm: 20, gestasyonGun: 50 }] }, bugun).hata, 'serviks-gestasyon')
    assert.equal(erkenDogumTemizle({ steroid: { kurlar: [{ tarih: '2026-07-01' }] } }, bugun).hata, 'steroid-ileri')
    assert.equal(erkenDogumTemizle({ pprom: { var: true, tarih: '2026-07-01' } }, bugun).hata, 'ileri-tarih')
    const k = erkenDogumTemizle({ serviks: [{ tarih: '2026-05-01', mm: '21,5', gestasyonGun: '19+3' }, { tarih: '2026-05-01', mm: 22, gestasyonGun: g(19, 3) }], steroid: { kurlar: [{ tarih: '2026-05-02' }] }, progesteron: { kullaniyor: true, yol: 'oral', dose: '200' } }, bugun).kayit
    assert.equal(k.serviks.length, 1); assert.equal(k.steroid.yapildi, true); assert.ok(!('dose' in k.progesteron)); assert.equal(k.progesteron.yol, 'oral')
  })
  it('the summary handed to the baby\'s plan: steroid yes/no, PPROM, magnesium; null when nothing is known', () => {
    assert.equal(ozetCikar(BOS_KAYIT, 30), null)
    assert.deepEqual(ozetCikar({ ...BOS_KAYIT, pprom: { var: true, tarih: null } }, 30), { gestasyonHafta: 30, steroidKuru: null, pprom: true, magnezyum: null })
  })
})

function gestasyonGunuHesap(tdt: string, bugun: string): number {
  const bas = new Date(tdt).getTime() - 280 * 86400000
  return Math.round((new Date(bugun).getTime() - bas) / 86400000)
}
