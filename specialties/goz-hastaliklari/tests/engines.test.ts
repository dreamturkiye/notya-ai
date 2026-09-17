import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { vaCoz, harfFarki, vaGoster, enIyiUzak, kopyaIleriTaslak } from '../engines/va'
import { glokomDegerlendir, gibOzeti } from '../engines/glokom'
import { drDegerlendir, ICO_ARALIK_AY } from '../engines/dr'
import { sgkKapilari, sutYanit, yuklemeDozSayisi, yuklemeTakvimi, sonrakiDoz, type Enjeksiyon } from '../engines/antiVegf'
import { acilTara } from '../engines/acil'
import { kataraktHazirlik, pediatrikIzlem, ON_SEGMENT_PROTOKOLLERI, gilSgkKontrol, sbGormeSevk } from '../engines/klinik'
import { gozSgkTaslak } from '../engines/sgkRapor'
import { gozSeridi, intakeSubjektif } from '../engines/serit'
import { kuruGozOzet, osdiBand } from '../engines/kuruGoz'
import { ayseGoruntuTaslagi } from '../engines/ayseGoruntu'
import { gozBolgeCoz, kiyasCifti } from '../engines/kiyas'

describe('VA — TR notation, logMAR, harf', () => {
  it('decimal (comma or dot), Snellen fractions → logMAR = −log10(decimal)', () => {
    assert.deepEqual(vaCoz('1,0'), { ham: '1,0', kategori: 'sayisal', ondalik: 1, logmar: 0 })
    assert.equal(vaCoz('0.5')!.logmar, 0.3)
    assert.equal(vaCoz('0,1')!.logmar, 1)
    assert.equal(vaCoz('6/12')!.ondalik, 0.5)
    assert.equal(vaCoz('20/40')!.logmar, 0.3)
    assert.equal(vaCoz('10/10')!.logmar, 0)
  })
  it('PS / EH / IH / IHY are non-numeric (no invented logMAR substitutes)', () => {
    assert.deepEqual(vaCoz('PS 1m'), { ham: 'PS 1m', kategori: 'PS', ondalik: null, logmar: null, mesafeM: 1 })
    assert.equal(vaCoz('EH')!.kategori, 'EH'); assert.equal(vaCoz('IH+')!.kategori, 'IH'); assert.equal(vaCoz('IHY')!.kategori, 'IHY')
    assert.equal(vaCoz('EH')!.logmar, null)
    assert.equal(harfFarki('PS 2m', '0,1'), null)
  })
  it('letter change: 0.1 logMAR = 5 letters (ETDRS); gain positive', () => {
    assert.equal(harfFarki('0,5', '1,0'), 15)
    assert.equal(harfFarki('1,0', '0,8'), -5)
    assert.equal(vaGoster('0.8'), '0,8'); assert.equal(vaGoster('6/12'), '6/12')
    assert.equal(vaCoz('abc'), null); assert.equal(vaCoz('9'), null)
  })
  it('best distance VA picks cc over sc when better; copy-forward is a draft needing confirm', () => {
    assert.equal(enIyiUzak({ uzak_sc: '0,4', uzak_cc: '0,9' }), '0,9')
    const k = kopyaIleriTaslak({ tarih: '2026-08-01', va: { sag: { uzak_cc: '0,9' } }, gibSag: 16, gibSol: 17 }, '2026-09-17')!
    assert.equal(k.onayGerekli, true); assert.equal(k.taslak.tarih, '2026-09-17'); assert.equal(k.kaynakTarih, '2026-08-01')
  })
})

describe('Glokom loop — hekim sets target/intervals, engine never titrates', () => {
  const olc = [{ tarih: '2026-03-01', sag: 24, sol: 18 }, { tarih: '2026-09-01', sag: 21, sol: 19 }]
  it('trend + above-target flag per eye', () => {
    const o = gibOzeti(olc, 'sag', 18)
    assert.equal(o.son, 21); assert.equal(o.delta, -3); assert.equal(o.hedefUstu, true)
  })
  it('no interval → "hekim belirlesin" task, no invented number; due VF task when overdue', () => {
    const d = glokomDegerlendir({ taniHekim: 'POAG', goz: 'iki', hedefSag: 18, hedefSol: 18, damlalar: [{ ad: 'Latanoprost', goz: 'iki', siklik: 'akşam' }], sonGormeAlani: '2025-12-01', sonOctRnfl: null, gaAralikAy: 6, octAralikAy: null }, olc, '2026-09-17')
    assert.ok(d.gorevler.some((g) => g.kod === 'glokom_ga' && g.due === '2026-06-01'))
    assert.ok(d.gorevler.some((g) => g.kod === 'glokom_oct_aralik' && g.due === null))
    assert.ok(d.bayraklar.some((b) => b.includes('hedef 18 mmHg üstünde') && b.includes('hekim kararı')))
    assert.ok(!JSON.stringify(d).match(/ekle|artır|değiştir.*damla|titr[ae]/i))
  })
})

describe('DR — TEMD 2026 (TR) + ICO 2017 Table 3a dual column', () => {
  it('ICO Table 3a values as published', () => {
    assert.deepEqual(ICO_ARALIK_AY, { yok: [12, 24], hafif_npdr: [6, 12], orta_npdr: [3, 6], agir_npdr: [0, 3], pdr: [0, 1] })
  })
  it('T2 without a fundus record → tarama görevi (TEMD: tanıda)', () => {
    const r = drDegerlendir({ dmTip: 'T2', dmTaniTarihi: '2026-01-01', yas: 55, gebe: false, evreSag: null, evreSol: null, dmoSag: null, dmoSol: null, sonFundus: null, bugun: '2026-09-17' })
    assert.equal(r.taramaGorevi?.kod, 'dr_tarama'); assert.equal(r.kontrol, null)
  })
  it('T1: screening starts 5 years after diagnosis', () => {
    const r = drDegerlendir({ dmTip: 'T1', dmTaniTarihi: '2024-01-01', yas: 14, gebe: false, evreSag: null, evreSol: null, dmoSag: null, dmoSol: null, sonFundus: null, bugun: '2026-09-17' })
    assert.equal(r.taramaGorevi, null); assert.ok(r.uyarilar.some((u) => u.includes('2029-01-01')))
  })
  it('no DR: TEMD yearly vs ICO 1–2 y → conflict shown, not collapsed', () => {
    const r = drDegerlendir({ dmTip: 'T2', dmTaniTarihi: null, yas: 60, gebe: false, evreSag: 'yok', evreSol: 'yok', dmoSag: 'yok', dmoSol: 'yok', sonFundus: '2026-01-10', bugun: '2026-09-17' })
    assert.equal(r.kontrol!.tr.enGec, '2027-01-10'); assert.equal(r.kontrol!.uluslararasi.enGec, '2028-01-10'); assert.equal(r.kontrol!.catisma, true)
  })
  it('worst eye + central DME drive the ICO window; PDR → same-day referral flag', () => {
    const r = drDegerlendir({ dmTip: 'T2', dmTaniTarihi: null, yas: 60, gebe: false, evreSag: 'orta_npdr', evreSol: 'hafif_npdr', dmoSag: 'merkez_tutan', dmoSol: 'yok', sonFundus: '2026-09-01', bugun: '2026-09-17' })
    assert.equal(r.kotuEvre, 'orta_npdr'); assert.equal(r.kontrol!.uluslararasi.enGec, '2026-12-01'); assert.equal(r.kontrol!.tr.enGec, '2027-03-01'); assert.equal(r.sevkAciliyet, 'uzman')
    const p = drDegerlendir({ dmTip: 'T2', dmTaniTarihi: null, yas: 60, gebe: false, evreSag: 'pdr', evreSol: null, dmoSag: null, dmoSol: null, sonFundus: '2026-09-01', bugun: '2026-09-17' })
    assert.equal(p.sevkAciliyet, 'ayni_gun'); assert.equal(p.kontrol!.uluslararasi.enGec, '2026-10-01')
  })
  it('pregnancy: TEMD every trimester', () => {
    const r = drDegerlendir({ dmTip: 'T1', dmTaniTarihi: '2010-01-01', yas: 30, gebe: true, evreSag: 'yok', evreSol: 'yok', dmoSag: null, dmoSol: null, sonFundus: '2026-09-01', bugun: '2026-09-17' })
    assert.equal(r.kontrol!.tr.enGec, '2026-12-01'); assert.ok(r.uyarilar.some((u) => u.includes('her trimester')))
  })
})

describe('Anti-VEGF — SUT 4.2.33 (primary text verified 2026-09-17)', () => {
  const e = (o: Partial<Enjeksiyon>): Enjeksiyon => ({ goz: 'sag', ajan: 'bevacizumab', endikasyon: 'ybmd', faz: 'yukleme', dozNo: 1, tarih: '2026-06-01', durum: 'yapildi', ...o })
  it('loading: 3 doses 4–6 weeks; DMÖ aflibersept 2 mg 5 optional; myopic CNV bevacizumab no loading', () => {
    assert.equal(yuklemeDozSayisi('ranibizumab', 'ybmd').doz, 3)
    assert.equal(yuklemeDozSayisi('aflibersept_2mg', 'dmo', true).doz, 5)
    assert.equal(yuklemeDozSayisi('bevacizumab', 'miyopik_knv').doz, null)
    assert.deepEqual(yuklemeTakvimi('2026-09-01', 'bevacizumab', 'ybmd')[1], { dozNo: 2, enErken: '2026-09-29', enGec: '2026-10-13' })
  })
  it('basamak: muayenehane not an SGK level; ranibizumab not paid at 2. basamak', () => {
    assert.equal(sgkKapilari({ ajan: 'bevacizumab', goz: 'sag', tarih: '2026-09-17', basamak: 'muayenehane', gecmis: [] }).odenebilir, null)
    assert.equal(sgkKapilari({ ajan: 'ranibizumab', goz: 'sag', tarih: '2026-09-17', basamak: '2', gecmis: [] }).odenebilir, false)
    assert.equal(sgkKapilari({ ajan: 'bevacizumab', goz: 'sag', tarih: '2026-09-17', basamak: '2', gecmis: [] }).odenebilir, true)
  })
  it('implant: ≥1 month after anti-VEGF, ≥3 months same eye, ≤4/year', () => {
    const k = sgkKapilari({ ajan: 'deksametazon_implant', goz: 'sag', tarih: '2026-06-20', basamak: '3', gecmis: [e({})] })
    assert.ok(k.engeller.some((x) => x.includes('1 ay')))
    const k2 = sgkKapilari({ ajan: 'deksametazon_implant', goz: 'sag', tarih: '2026-08-01', basamak: '3', gecmis: [e({ ajan: 'deksametazon_implant', tarih: '2026-06-01' })] })
    assert.ok(k2.engeller.some((x) => x.includes('en az 3 ay')))
  })
  it('ranibizumab → aflibersept switch needs bevacizumab loading first; faricimab not in SUT', () => {
    const k = sgkKapilari({ ajan: 'aflibersept_2mg', goz: 'sag', tarih: '2026-09-17', basamak: '3', gecmis: [e({ ajan: 'ranibizumab', faz: 'idame', tarih: '2026-08-01' })] })
    assert.ok(k.engeller.some((x) => x.includes('bevacizumab ile yükleme')))
    assert.equal(sgkKapilari({ ajan: 'faricimab', goz: 'sol', tarih: '2026-09-17', basamak: '3', gecmis: [] }).odenebilir, false)
  })
  it('SUT 4.2.33(3) response: either criterion; conflicting → belirsiz (hekim)', () => {
    assert.equal(sutYanit({ vaOnceki: '0,5', vaSimdi: '0,6', mfkOncekiMikron: 400, mfkSimdiMikron: 300 }).sinif, 'yeterli')
    assert.equal(sutYanit({ vaOnceki: '0,5', vaSimdi: '0,4', mfkOncekiMikron: 400, mfkSimdiMikron: 380 }).sinif, 'yetersiz')
    assert.equal(sutYanit({ vaOnceki: '0,5', vaSimdi: '0,4', mfkOncekiMikron: 260, mfkSimdiMikron: 240 }).sinif, 'belirsiz')
    assert.equal(sutYanit({ vaOnceki: null, vaSimdi: null, mfkOncekiMikron: null, mfkSimdiMikron: null }).sinif, 'belirsiz')
  })
  it('next dose: loading counter per eye, maintenance interval left to hekim', () => {
    const s = sonrakiDoz([e({ tarih: '2026-08-01' }), e({ dozNo: 2, tarih: '2026-09-01' })], 'sag', '2026-09-17')
    assert.deepEqual([s.faz, s.dozNo, s.enErken, s.enGec], ['yukleme', 3, '2026-09-29', '2026-10-13'])
    const t = sonrakiDoz([e({ tarih: '2026-07-01' }), e({ tarih: '2026-08-01' }), e({ tarih: '2026-09-01' })], 'sag', '2026-09-17')
    assert.equal(t.faz, 'idame'); assert.equal(t.enErken, null)
  })
})

describe('SGK rapor taslakları', () => {
  it('bevacizumab başlangıç = 1 ay tek hekim; missing SUT 4.2.33(2) items listed; no dose, no TC', () => {
    const r = gozSgkTaslak({ sablon: 'anti_vegf_baslangic', hasta: { adSoyad: 'Test Hasta' }, goz: 'sag', ajan: 'bevacizumab', endikasyon: 'ybmd', vaBaslangic: '0,3', okt: '2026-09-17', gecmis: [], bugun: '2026-09-17' })
    assert.match(r.raporTipi, /1 ay süreli tek hekim/); assert.equal(r.draft.onerilen_sure_ay, 1); assert.equal(r.draft.tcSon4, '')
    assert.ok(r.eksikler.includes('Hasta anamnezi') && r.eksikler.includes('Lezyona ait renkli resim') && r.eksikler.includes('FFA veya kontrendikasyon notu'))
    assert.ok(!/mg\/0|1,25 mg/.test(JSON.stringify(r.draft)))
  })
  it('ranibizumab idame = 1 ay sağlık kurulu with response line', () => {
    const r = gozSgkTaslak({ sablon: 'anti_vegf_idame', hasta: { adSoyad: 'X' }, goz: 'sol', ajan: 'ranibizumab', endikasyon: 'dmo', anamnez: 'DMÖ', vaOnceki: '0,4', vaSimdi: '0,5', mfkOnceki: 350, mfkSimdi: 240, renkliResim: 'a', ffa: 'b', okt: 'c', gecmis: [], bugun: '2026-09-17' })
    assert.match(r.raporTipi, /1 ay süreli sağlık kurulu/); assert.match(r.draft.mevcutDurum!, /taslak sınıf: yeterli/); assert.deepEqual(r.eksikler, [])
  })
})

describe('Acil, katarakt, ön segment, pediatrik, şerit, intake', () => {
  it('red flags: chemical burn first (hemen), RD suspicion same day', () => {
    const a = acilTara(['sağ gözüme çamaşır suyu kaçtı', 'ışık çakmaları var'])
    assert.equal(a[0].kod, 'kimyasal_yanik'); assert.ok(a.some((x) => x.kod === 'retina_dekolmani_suphesi'))
    assert.deepEqual(acilTara(['gözlük numaram değişti']), [])
  })
  it('cataract checklist: mandatory items gate readiness; IOL power never computed', () => {
    const h = kataraktHazirlik({ va_refraksiyon: true, biyometri: true })
    assert.equal(h.hazir, false); assert.ok(h.eksikZorunlu.some((x) => x.includes('Alfa-1')))
    assert.ok(ON_SEGMENT_PROTOKOLLERI.find((p) => p.id === 'kuru_goz')!.sgk.some((s) => s.includes('7 damla')))
  })
  it('pediatric bridge: no invented patching hours', () => {
    const p = pediatrikIzlem({ yasAy: 40, tip: 'ambliyopi', kapamaHekim: null, sonrakiKontrol: null, bugun: '2026-09-17' })
    assert.ok(p.hatirlatmalar.some((h) => h.includes('36–48 ay'))); assert.ok(p.gorevler.some((g) => g.kod === 'ped_kontrol'))
    assert.ok(p.hatirlatmalar.some((h) => h.includes('motor önermez')))
  })
  it('strip: bilateral VA + letters, GİB vs target, acil from complaint', () => {
    const s = gozSeridi({ muayeneler: [{ tarih: '2026-09-17', va: { sag: { uzak_cc: '0,8' }, sol: { uzak_sc: '0,5' } }, gibSag: 22, gibSol: 15 }, { tarih: '2026-06-01', va: { sag: { uzak_cc: '0,63' }, sol: { uzak_sc: '0,5' } }, gibSag: 20, gibSol: 16 }], hedefSag: 18, hedefSol: 18, evreSag: 'hafif_npdr', evreSol: null, sonrakiEnjeksiyon: null, gorevDue: ['2026-09-01', null], sikayetMetinleri: ['aniden görmüyorum'], bugun: '2026-09-17' })
    assert.equal(s.va.sag, '0,8'); assert.equal(s.va.harfSag, 5); assert.equal(s.gib.ustSag, true); assert.equal(s.gib.ustSol, false)
    assert.equal(s.gecikenGorev, 1); assert.equal(s.acil[0].kod, 'ani_gorme_kaybi'); assert.equal(s.bugunOlcumVar, true)
  })
  it('intake → Subjektif (hasta beyanı) + card hints', () => {
    const r = intakeSubjektif({ basvuruNedeni: 'Kontrol', mevcutGozSikayetleri: ['Bulanık Görme', 'Göz Kuruluğu'], bilinenGozHastaliklari: ['Glokom'], kronikRahatsizliklarGoz: ['Diyabet'], oncekiGozOperasyonlari: ['Yok'], aileGozHastaligiOykusu: ['Bilinmiyor'] })
    assert.match(r.subjektif, /Başvuru nedeni \(hasta beyanı\): Kontrol/); assert.ok(!r.subjektif.includes('Yok'))
    assert.deepEqual(r.ipuclari.map((i) => i.kart).sort(), ['dr', 'glokom', 'on_segment'])
  })
})

describe('Gaps close — dry eye, SB sevk, EK-3/G, Ayşe, compare', () => {
  it('OSDI bands + Schirmer/TBUT flags without diagnosis language', () => {
    assert.equal(osdiBand(10), 'normal'); assert.equal(osdiBand(20), 'hafif'); assert.equal(osdiBand(40), 'siddetli')
    const o = kuruGozOzet({ osdi: 40, schirmerSag: 5, schirmerSol: 12, tbutSag: 4, tbutSol: 11, notHekim: null })
    assert.equal(o.osdiBand, 'siddetli'); assert.equal(o.schirmerDusuk, true); assert.equal(o.tbutDusuk, true)
    assert.ok(!/tanı|glokom|reçete/i.test(o.ozetSatir))
  })
  it('SB görme sevk: 3–5y VA under 0.5 or ≥2 lines; 6–10y VA≤0.7', () => {
    const a = sbGormeSevk({ yasAy: 42, vaSag: 0.4, vaSol: 0.8 })
    assert.equal(a.sevk, true); assert.ok(a.nedenler.some((n) => n.kod === 'va_esik'))
    const b = sbGormeSevk({ yasAy: 84, vaSag: 0.6, vaSol: 0.9 })
    assert.ok(b.nedenler.some((n) => n.kod === 'va_esik'))
    const c = sbGormeSevk({ yasAy: 42, vaSag: 0.8, vaSol: 0.8 })
    assert.equal(c.sevk, false)
  })
  it('pediatric bridge embeds SB sevk when VA below threshold', () => {
    const p = pediatrikIzlem({ yasAy: 40, tip: 'ambliyopi', kapamaHekim: 'OD 2 saat', sonrakiKontrol: '2026-10-01', bugun: '2026-09-17', vaSag: 0.3, vaSol: 0.8 })
    assert.equal(p.sevk.sevk, true)
  })
  it('GİL EK-3/G maps monofokal→G10090; no price invented', () => {
    const g = gilSgkKontrol('monofokal')
    assert.equal(g.kalem?.kod, 'G10090')
    assert.ok(!/₺|\d+\s*TL|fiyat\s*[:=]|bedel\s*\d/i.test(JSON.stringify(g)))
  })
  it('Ayşe draft is dual-sign scaffold, never diagnoses', () => {
    const a = ayseGoruntuTaslagi({ modalite: 'oct', goz: 'sag' })
    assert.match(a.taslak, /Ayşe taslak/); assert.match(a.taslak, /Tanı \/ evre yazılmaz/)
    assert.ok(!/glokom|NPDR|AMD tanısı/i.test(a.taslak))
  })
  it('compare requires same eye + same modality; Turkish region parses', () => {
    assert.equal(gozBolgeCoz('sağ göz'), 'sag'); assert.equal(gozBolgeCoz('sol'), 'sol')
    const ok = kiyasCifti(
      { id: 'a', modalite: 'oct', goz: 'sag', tarih: '2026-01-01', url: null },
      { id: 'b', modalite: 'oct', goz: 'sag', tarih: '2026-06-01', url: null },
    )
    assert.equal(ok.ok, true)
    const bad = kiyasCifti(
      { id: 'a', modalite: 'oct', goz: 'sag', tarih: '2026-01-01', url: null },
      { id: 'b', modalite: 'fundus', goz: 'sag', tarih: '2026-06-01', url: null },
    )
    assert.equal(bad.ok, false)
  })
})
