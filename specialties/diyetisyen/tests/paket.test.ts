/**
 * BRANS-PAKETI (diyetisyen) — professional engines: measurement panel (TEMD 2024 waist cut-offs, Mifflin–St Jeor, safe
 * loss rate), diagnosis templates (hekim tanısı lock), lab panel (HOMA-IR omitted per TEMD 2024 § 5.6), drug–food notes
 * (levothyroxine KÜB timings, no doses), weekly plan → TÜBER shopping list, SCOFF scoring.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bki, bkiSinifi, belBoyOrani, belRiski, enerjiGereksinimi, guvenliKayip, olcumPaneli } from '../engines/olcum'
import { TANI_SABLONLARI, taniSablonuCikti } from '../engines/sablonlar'
import { labAnahtari, labSerileri, HOMA_IR_NOTU } from '../engines/lab'
import { ilacBesinNotlari, levotiroksinGunPlani, ILAC_BESIN_NOTLARI } from '../engines/ilacBesin'
import { alisverisListesi, planCoz, tuberGrubu } from '../engines/plan'
import { scoffDegerlendir, taramaZamaniMi, SCOFF_SORULARI } from '../engines/tarama'
import { DOZ_DESENI } from '@/lib/portal/bransPaketi'
import { ozelAracCalistir } from '@/lib/klinik/ozelAracCalistir'
import { klinikAraclariListesi } from '@/lib/klinik/klinikAraclari'

describe('diyetisyen ölçüm paneli', () => {
  it('BKİ and classes', () => {
    assert.equal(bki(80, 170), 27.7)
    assert.equal(bkiSinifi(27.7), 'Fazla kilolu (25–29,9)')
    assert.equal(bki(10, 170), null)
  })
  it('waist risk uses the Turkish cut-offs (TEMD 2024): women ≥ 90, men ≥ 100', () => {
    assert.deepEqual(belRiski(90, 'kadin'), { esik: 90, risk: true })
    assert.deepEqual(belRiski(95, 'erkek'), { esik: 100, risk: false })
    assert.deepEqual(belBoyOrani(85, 170), { oran: 0.5, risk: true })
  })
  it('energy: Mifflin–St Jeor stated, activity factor applied', () => {
    const e = enerjiGereksinimi({ kiloKg: 70, boyCm: 165, yas: 40, cinsiyet: 'kadin', aktivite: 'hafif' })!
    assert.equal(e.ree, 1370) // 700 + 1031.25 − 200 − 161 = 1370.25
    assert.equal(e.toplam, Math.round(1370 * 1.375))
    assert.match(e.denklem, /Mifflin–St Jeor/)
    assert.equal(enerjiGereksinimi({ kiloKg: 70, boyCm: 165, yas: 12, cinsiyet: 'kadin', aktivite: 'hafif' }), null, 'not for children')
  })
  it('safe loss 0,5–1,0 kg/week (TEMD 2024 § 6.1.1) and the BKİ band for the height', () => {
    const g = guvenliKayip({ kiloKg: 90, boyCm: 170, toplamEnerji: 2000, ree: 1600 })!
    assert.deepEqual(g.haftalikKg, [0.5, 1.0]); assert.deepEqual(g.acikKcal, [500, 1000])
    assert.deepEqual(g.hedefAralikKg, [53.5, 72])
    assert.ok(g.altSinirUyarisi, 'a 1000 kcal deficit below REE is flagged for review')
    const p = olcumPaneli({ kiloKg: 90, boyCm: 170, belCm: 102, yas: 45, cinsiyet: 'erkek', aktivite: 'orta' })
    assert.ok('satirlar' in p && p.satirlar.some((s) => s.includes('TEMD')) && p.satirlar.at(-1)!.includes('doz'))
  })
})

describe('diyetisyen tanıya bağlı şablonlar', () => {
  it('seven templates, each sourced; the physician diagnosis is required; no dose in any template', () => {
    assert.deepEqual(TANI_SABLONLARI.map((t) => t.kod), ['pkos', 'insulin-direnci', 'hipotiroidi', 'tip2-diyabet', 'gebelik-diyabeti', 'masld', 'dislipidemi'])
    for (const t of TANI_SABLONLARI) {
      assert.ok(t.kaynaklar.length > 0, t.kod)
      for (const i of [...t.ilkeler, ...t.izlenecek]) assert.doesNotMatch(i, DOZ_DESENI, `${t.kod}: ${i}`)
    }
    assert.ok('hata' in taniSablonuCikti('pkos', '  '))
    const r = taniSablonuCikti('hipotiroidi', 'Hashimoto tiroiditi (Dr. … sevk notu)')
    assert.ok('satirlar' in r && r.satirlar.some((s) => /yarım saat/.test(s)))
  })
  it('the insulin-resistance template states that HOMA-IR is not used (TEMD 2024 § 5.6)', () => {
    assert.ok(TANI_SABLONLARI.find((t) => t.kod === 'insulin-direnci')!.ilkeler.some((i) => /HOMA-IR/.test(i) && /kullanılmaz/.test(i)))
  })
})

describe('diyetisyen tahlil paneli', () => {
  it('matches the physician-ordered analytes and never HOMA-IR', () => {
    assert.equal(labAnahtari({ raw_name: 'HbA1c' }), 'hba1c')
    assert.equal(labAnahtari({ raw_name: 'LDL Kolesterol' }), 'ldl')
    assert.equal(labAnahtari({ raw_name: 'HDL kolesterol' }), 'hdl')
    assert.equal(labAnahtari({ raw_name: 'Total Kolesterol' }), 'total-kolesterol')
    assert.equal(labAnahtari({ raw_name: 'Açlık Kan Glukozu' }), 'glukoz')
    assert.equal(labAnahtari({ raw_name: 'Glukoz (OGTT 120. dk)' }), null)
    assert.equal(labAnahtari({ raw_name: 'TSH' }), 'tsh')
    assert.equal(labAnahtari({ raw_name: 'İnsülin (açlık)' }), 'insulin')
    assert.equal(labAnahtari({ raw_name: 'HOMA-IR' }), null)
    assert.match(HOMA_IR_NOTU, /TEMD/)
  })
  it('series oldest → newest, one point per date (newest row of that date)', () => {
    const s = labSerileri([
      { raw_name: 'HbA1c', value_num: 6.1, unit: '%', numune_tarihi: '2026-10-01' },
      { raw_name: 'HbA1c', value_num: 6.4, unit: '%', numune_tarihi: '2026-07-01' },
      { raw_name: 'HbA1c', value_num: 'x', numune_tarihi: '2026-08-01' },
      { raw_name: 'HOMA-IR', value_num: 3.2, numune_tarihi: '2026-10-01' },
    ])
    assert.equal(s.length, 1)
    assert.deepEqual(s[0].noktalar, [{ tarih: '2026-07-01', deger: 6.4 }, { tarih: '2026-10-01', deger: 6.1 }])
  })
})

describe('diyetisyen ilaç–besin notları', () => {
  it('notes only for medicines on file; levothyroxine ≠ antithyroid; GLP-1 brand names; no dose words', () => {
    assert.deepEqual(ilacBesinNotlari(['Euthyrox 100 mcg', 'Glifor 1000']).map((n) => n.kod), ['levotiroksin', 'metformin'])
    assert.deepEqual(ilacBesinNotlari(['Thyromazol']).map((n) => n.kod), [])
    assert.deepEqual(ilacBesinNotlari(['Wegovy']).map((n) => n.kod), ['glp1'])
    for (const n of Object.values(ILAC_BESIN_NOTLARI)) for (const m of n.maddeler) assert.doesNotMatch(m, DOZ_DESENI)
  })
  it('levothyroxine day plan: breakfast +30 min, coffee +60 min, calcium/iron +2 h (KÜB)', () => {
    assert.deepEqual(levotiroksinGunPlani('07:00'), { kahvalti: '07:30', kahve: '08:00', kalsiyumDemir: '09:00' })
    assert.deepEqual(levotiroksinGunPlani('23:45'), { kahvalti: '00:15', kahve: '00:45', kalsiyumDemir: '01:45' })
    assert.equal(levotiroksinGunPlani('7'), null)
  })
})

describe('diyetisyen haftalık plan → alışveriş listesi (TÜBER 2022)', () => {
  it('parses the dietitian’s lines; "Her gün" fills the week; kcal and malformed lines are refused', () => {
    const { plan, hatali } = planCoz('Her gün | Kahvaltı | yumurta, beyaz peynir, domates\nPazartesi | Öğle | mercimek çorbası, yoğurt\nSalı | Akşam | 500 kcal tavuk\nbozuk satır')
    assert.equal(plan.gunler.filter((g) => g.ogunler.some((o) => o.ad === 'Kahvaltı')).length, 7)
    assert.equal(plan.gunler[0].ogunler.length, 2)
    assert.equal(hatali.length, 2)
  })
  it('groups items by TÜBER food group, Turkish letters handled', () => {
    assert.equal(tuberGrubu('beyaz peynir'), 'Süt ve ürünleri')
    assert.equal(tuberGrubu('Mercimek çorbası'), 'Et, yumurta, kurubaklagiller')
    assert.equal(tuberGrubu('taze fasulye'), 'Taze sebze')
    assert.equal(tuberGrubu('balık'), 'Et, yumurta, kurubaklagiller')
    assert.equal(tuberGrubu('tam buğday ekmeği'), 'Ekmek ve tahıllar')
    assert.equal(tuberGrubu('zeytinyağı'), 'Yağlar')
    assert.equal(tuberGrubu('elma'), 'Taze meyve')
    assert.equal(tuberGrubu('baklava'), 'Şekerler')
    assert.equal(tuberGrubu('kinoa salatası'), 'Ekmek ve tahıllar')
    const l = alisverisListesi(planCoz('Her gün | Kahvaltı | 2 adet yumurta, domates\nPazartesi | Öğle | yoğurt').plan)
    const yumurta = l.find((g) => g.grup === 'Et, yumurta, kurubaklagiller')!.kalemler.find((k) => k.ad === 'yumurta')!
    assert.equal(yumurta.kez, 7)
  })
})

describe('diyetisyen SCOFF', () => {
  it('five items, ≥ 2 yes = positive; incomplete answers refused; due at start and every 90 days', () => {
    assert.equal(SCOFF_SORULARI.length, 5)
    assert.deepEqual(scoffDegerlendir([true, true, false, false, false]), { pozitif: true, puan: 2 })
    assert.deepEqual(scoffDegerlendir([true, false, false, false, false]), { pozitif: false, puan: 1 })
    assert.equal(scoffDegerlendir([true, false]), null)
    assert.equal(scoffDegerlendir([true, false, false, false, 'evet']), null)
    assert.equal(taramaZamaniMi(null, '2026-11-27'), true)
    assert.equal(taramaZamaniMi('2026-10-01', '2026-11-27'), false)
    assert.equal(taramaZamaniMi('2026-08-01', '2026-11-27'), true)
  })
})

describe('diyetisyen araçları (Özel Branş kataloğu)', () => {
  it('the new tools are diyetisyen-only and run through the shared tool runner', () => {
    const yollar = ['/ozel-branslar/diyet-sablon', '/ozel-branslar/diyet-olcum', '/ozel-branslar/diyet-ilac-besin', '/ozel-branslar/diyet-lab']
    const diy = klinikAraclariListesi('diyetisyen').map((a) => a.route)
    for (const y of yollar) assert.ok(diy.includes(y), y)
    for (const d of ['sac-ekimi', 'longevity', 'fizyoterapi', 'klinik-psikolog']) for (const y of yollar) assert.ok(!klinikAraclariListesi(d).some((a) => a.route === y), `${y} leaked into ${d}`)
    for (const d of ['sac-ekimi', 'diyetisyen', 'odyoloji']) assert.ok(klinikAraclariListesi(d).some((a) => a.route === '/ozel-branslar/hasta-alani-paketi'))
    const r = ozelAracCalistir('/ozel-branslar/diyet-sablon', { tani: '', sablon: TANI_SABLONLARI[0].ad }, '2026-11-27')
    assert.ok('hata' in r, 'no template without the physician diagnosis')
    const o = ozelAracCalistir('/ozel-branslar/diyet-olcum', { kilo: '80', boy: '170', yas: '40', cinsiyet: 'kadın', aktivite: 'hafif' }, '2026-11-27')
    assert.ok(!('hata' in o) && o.ozet.includes('BKİ'))
  })
})
