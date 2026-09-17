import { test } from 'node:test'
import assert from 'node:assert/strict'
import { osteoDegerlendir, tSkoruCikar, BOLGE_AD, type OsteoGirdi, type OsteoRiskler, type OsteoSonuc } from '../engines/osteoporoz'

const R0: OsteoRiskler = { kirilganlikKirigi: false, vertebraKalcaKirigi: false, glukokortikoid3Ay: false, erkenMenopoz: false, romatoidArtrit: false, sigara: false, alkol3Unite: false, ebeveynKalcaKirigi: false, aromatazInhibitoruAdt: false }
const t: OsteoGirdi = { yas: 66, kadin: true, vki: 24, tSkorlari: {}, dxaTarihi: '2026-01-15', riskler: R0, dusmePozitif: false, eGFR: 80, ca: 9.4, vitD: 30, ilacMetinleri: [], bugun: '2026-09-17' }
const tumMetin = (r: OsteoSonuc) => JSON.stringify(r)

test('sınıf eşikleri: −2,5 osteoporoz, −2,4 osteopeni, −1,0 normal; en düşük bölge; geçersiz değer yok sayılır', () => {
  assert.equal(osteoDegerlendir({ ...t, tSkorlari: { lomber: -2.5 } }).sinif, 'osteoporoz')
  assert.equal(osteoDegerlendir({ ...t, tSkorlari: { lomber: -2.4 } }).sinif, 'osteopeni')
  assert.equal(osteoDegerlendir({ ...t, tSkorlari: { lomber: -1.0 } }).sinif, 'normal')
  const r = osteoDegerlendir({ ...t, tSkorlari: { lomber: -1.2, femurBoyun: -2.1, totalKalca: null } })
  assert.equal(r.enDusukT, -2.1); assert.equal(r.enDusukBolge, 'femurBoyun'); assert.equal(BOLGE_AD.femurBoyun, 'Femur boynu')
  const g = osteoDegerlendir({ ...t, tSkorlari: { lomber: -9, femurBoyun: NaN } })
  assert.equal(g.sinif, null); assert.equal(g.enDusukT, null); assert.deepEqual(g.gorevler, [{ kod: 'dxa', ad: 'DXA (T-skoru yok)', due: '2026-09-17' }])
})

test('ağır osteoporoz: T ≤ −2,5 + kırılganlık kırığı → anabolik + sevk; aralık 12 ay', () => {
  const r = osteoDegerlendir({ ...t, tSkorlari: { lomber: -2.8 }, riskler: { ...R0, kirilganlikKirigi: true } })
  assert.equal(r.sinif, 'agir_osteoporoz')
  assert.ok(r.tedaviSinifi.some((s) => /anabolik/.test(s))); assert.ok(r.tedaviSinifi.some((s) => /oral bisfosfonat/.test(s)))
  assert.match(r.sevk[0], /Endokrinoloji\/FTR/); assert.equal(r.dxaAraligiAy, 12); assert.equal(r.sonrakiDxa, '2027-01-15')
  assert.ok(r.sekonderTetkik.includes('TSH')); assert.ok(r.sekonderTetkik.includes('PTH (Ca yüksek/düşük sınırda ise)'))
})

test('klinik osteoporoz: vertebra kırığı, T yok → sınıf null, plan + DXA/uzman sevk', () => {
  const r = osteoDegerlendir({ ...t, yas: 72, kadin: false, riskler: { ...R0, vertebraKalcaKirigi: true } })
  assert.equal(r.klinikOsteoporoz, true); assert.equal(r.sinif, null); assert.equal(r.dxaAraligiAy, null)
  assert.ok(r.plan.some((s) => /klinik osteoporoz/.test(s)))
  assert.ok(r.sevk.includes('DXA + uzman değerlendirmesi'))
  assert.ok(r.tedaviSinifi.some((s) => /anabolik/.test(s)))
  assert.ok(r.sekonderTetkik.some((s) => /Testosteron/.test(s)))
  assert.ok(r.gorevler.some((x) => x.kod === 'dxa'))
})

test('eGFR 30: bisfosfonat satırları kalkar, denosumab satırı + uyarı', () => {
  const r = osteoDegerlendir({ ...t, tSkorlari: { femurBoyun: -3.0 }, eGFR: 30 })
  assert.ok(!r.tedaviSinifi.some((s) => /bisfosfonat/i.test(s)))
  assert.ok(r.tedaviSinifi.includes('Denosumab sınıfı — kesilirse ardışık tedavi planı gerekir (hekim)'))
  assert.ok(r.uyarilar.includes('eGFR <35: bisfosfonatlardan kaçınılır — denosumab sınıfı / uzman (hekim)'))
})

test('tedavide: tedaviSinifi yok, aralık 24, tedavi altında kırık sevki', () => {
  const r = osteoDegerlendir({ ...t, tSkorlari: { lomber: -2.9 }, ilacMetinleri: ['Alendronat haftalık'], riskler: { ...R0, kirilganlikKirigi: true } })
  assert.equal(r.tedavide, true); assert.deepEqual(r.tedaviSinifi, []); assert.equal(r.dxaAraligiAy, 24)
  assert.ok(r.plan.includes('Tedavi yanıtı: 1–2 yılda DXA — hekim'))
  assert.ok(r.sevk.includes('Tedavi altında yeni kırık: uzman değerlendirmesi (tedavi başarısızlığı)'))
})

test('osteopeni: aralık 24, sonrakiDxa 2028-01-15 + görev; steroid bayrağı → hekim değerlendirmesi', () => {
  const r = osteoDegerlendir({ ...t, tSkorlari: { totalKalca: -1.8 }, riskler: { ...R0, glukokortikoid3Ay: true, sigara: true } })
  assert.equal(r.dxaAraligiAy, 24); assert.equal(r.sonrakiDxa, '2028-01-15')
  assert.deepEqual(r.gorevler, [{ kod: 'dxa_tekrar', ad: 'DXA tekrar (TEMD Osteoporoz 2025)', due: '2028-01-15' }])
  assert.match(r.tedaviSinifi[0], /Osteopenide yüksek risk/)
  assert.ok(r.plan.includes('Sigara bırakma, alkol kısıtlama')); assert.ok(r.plan.includes('DXA aralığı taslak — hekim kilitler'))
  assert.deepEqual(r.sekonderTetkik, [])
  // normal: 60 ay; ≥2 risk bayrağı → 24
  assert.equal(osteoDegerlendir({ ...t, yas: 60, tSkorlari: { lomber: 0.2 } }).dxaAraligiAy, 60)
  assert.equal(osteoDegerlendir({ ...t, tSkorlari: { lomber: 0.2 }, dusmePozitif: true }).dxaAraligiAy, 24)
})

test('lab uyarıları: vitD 15, Ca düşük / yüksek; genç erişkinde Z-skoru uyarısı', () => {
  const r = osteoDegerlendir({ ...t, tSkorlari: { lomber: -2.6 }, vitD: 15, ca: 8.1 })
  assert.ok(r.uyarilar.includes('25-OH D <20 ng/mL: antirezorptif öncesi D vitamini replasmanı (Vit D/B12 kartı)'))
  assert.ok(r.uyarilar.some((s) => /Hipokalsemi/.test(s)))
  assert.ok(osteoDegerlendir({ ...t, ca: 10.9, tSkorlari: { lomber: -2.6 } }).uyarilar.some((s) => /hiperparatiroidi/.test(s)))
  assert.ok(osteoDegerlendir({ ...t, yas: 42, kadin: false, tSkorlari: { lomber: -2.6 } }).uyarilar.some((s) => /Z-skoru/.test(s)))
  assert.ok(!osteoDegerlendir({ ...t, yas: 45, riskler: { ...R0, erkenMenopoz: true }, tSkorlari: { lomber: -2.6 } }).uyarilar.some((s) => /Z-skoru/.test(s)))
})

test('risk bayrakları: düşük VKİ, düşme, ileri yaş', () => {
  const r = osteoDegerlendir({ ...t, vki: 18.5, dusmePozitif: true, riskler: { ...R0, romatoidArtrit: true } })
  assert.deepEqual(r.riskBayraklari, ['Romatoid artrit', 'Düşük VKİ', 'Düşme taraması pozitif', 'İleri yaş'])
  assert.deepEqual(osteoDegerlendir({ ...t, yas: 68, kadin: false }).riskBayraklari, [])
})

test('tSkoruCikar: Türkçe virgül, unicode eksi, İngilizce rapor', () => {
  const tr1 = 'DXA raporu 15.01.2026. Lomber omurga (L1–L4) BMD 0,812 g/cm², T skoru -2,7, Z skoru -1,9. Femur boynu T-skoru: -1,9. Total kalça T-skoru -1,5.'
  assert.deepEqual(tSkoruCikar(tr1), { lomber: -2.7, femurBoyun: -1.9, totalKalca: -1.5 })
  const tr2 = 'Bulgular: L1-L4 T-skoru: −2,1\nFemur boyun T: −2,6\n(total kalça ölçülemedi)'
  assert.deepEqual(tSkoruCikar(tr2), { lomber: -2.1, femurBoyun: -2.6 })
  const en = 'Lumbar spine L1-L4 T-score -3.1. Femoral neck T-score -1.9; Total hip T-score -1.4.'
  assert.deepEqual(tSkoruCikar(en), { lomber: -3.1, femurBoyun: -1.9, totalKalca: -1.4 })
  assert.deepEqual(tSkoruCikar('Kemik yoğunluğu raporu eklenecek'), {})
  assert.deepEqual(tSkoruCikar(''), {})
})

test('FRAX yok, doz yok: yüzde olasılık ve mg/IU çıktısı üretilmez', () => {
  const girdiler: OsteoGirdi[] = [
    { ...t, tSkorlari: { lomber: -3.8 }, riskler: { ...R0, kirilganlikKirigi: true, vertebraKalcaKirigi: true, glukokortikoid3Ay: true, sigara: true, alkol3Unite: true, ebeveynKalcaKirigi: true }, vitD: 12, ca: 8.0, eGFR: 30, dusmePozitif: true, vki: 18 },
    { ...t, tSkorlari: { femurBoyun: -1.6 }, riskler: { ...R0, glukokortikoid3Ay: true } },
    { ...t, riskler: { ...R0, vertebraKalcaKirigi: true } },
  ]
  for (const g of girdiler) {
    const r = osteoDegerlendir(g)
    assert.match(r.fraxNotu, /lisanslı/); assert.match(r.fraxNotu, /Notya FRAX hesaplamaz/)
    for (const s of [...r.plan, ...r.tedaviSinifi, ...r.uyarilar, ...r.sevk, r.fraxNotu]) assert.ok(!/%\s*\d|\d\s*%/.test(s), s)
    assert.ok(!/\d+\s*(mg|mcg|µg|IU|ünite)\b/i.test(tumMetin(r)), 'doz benzeri çıktı')
    assert.ok(!/olasılık[ıi]\s*[:=]?\s*\d/i.test(tumMetin(r)))
    assert.ok(r.dipnotlar.some((d) => d.ref === 'TEMD_OSTEO2025' && /FRAX/.test(d.not)))
    assert.deepEqual([...new Set(r.dipnotlar.map((d) => d.ref))].sort(), ['HARRISON', 'TEMD_OSTEO2025', 'TIHUD2023'])
  }
})
