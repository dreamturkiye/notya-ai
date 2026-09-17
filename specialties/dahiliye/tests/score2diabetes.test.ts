import { test } from 'node:test'
import assert from 'node:assert/strict'
import { score2DmLp, score2DmKalibrasyonsuz, score2DmOlasilik, score2Diabetes, hba1cMmolMol, dmRiskSinifi, SCORE2_DIABETES_ONAYLI } from '../engines/score2diabetes'
import { kvrDegerlendir } from '../engines/score2'

// ── Yayımlanmış çalışılmış örnekler (DAH-SCORE2-DIABETES) ───────────────────────────────────────────────────────────────
// Kaynak: SCORE2-Diabetes working group, Eur Heart J 2023;44:2544 (ehad260, PMC10361012). Beklenen değerler YAYINDAN kopyalandı.
const yakin = (a: number, b: number, tol: number, ad: string) => assert.ok(Math.abs(a - b) <= tol, `${ad}: ${a} ≠ ${b} (±${tol})`)
// Ana makale Results: "60-year-old non-smoking man with a history of diabetes, SBP 140, TChol 5.5, HDL 1.3, HbA1c 50, eGFR 90, age at
// diagnosis 60 → 11.0% (moderate)"; "HbA1c 70, eGFR 60, age at diagnosis 50 → 17.2%"; kadın aynı → 12.7%; bölgeler: 12.9% / 9.8% (low),
// 31.2% / 34.0% (very high).
const IYI = { yas: 60, sigara: false, sbp: 140, tcholMmol: 5.5, hdlMmol: 1.3, hba1cMmolMol: 50, eGFR: 90, taniYasi: 60 }
const KOTU = { ...IYI, hba1cMmolMol: 70, eGFR: 60, taniYasi: 50 }

test('yayımlanmış örnek 1 (ehad260 Results, orta risk bölgesi): erkek 60 yaş %11.0, kötü diyabet profili %17.2, kadın %12.7', () => {
  yakin(score2DmOlasilik({ ...IYI, cinsiyet: 'erkek', bolge: 'moderate' }) * 100, 11.0, 0.05, 'erkek iyi')
  yakin(score2DmOlasilik({ ...KOTU, cinsiyet: 'erkek', bolge: 'moderate' }) * 100, 17.2, 0.05, 'erkek kötü')
  yakin(score2DmOlasilik({ ...KOTU, cinsiyet: 'kadin', bolge: 'moderate' }) * 100, 12.7, 0.05, 'kadın kötü')
})

test('yayımlanmış örnek 2 (ehad260 Results, bölge kalibrasyonu): düşük bölge erkek %12.9 / kadın %9.8; çok yüksek bölge %31.2 / %34.0', () => {
  yakin(score2DmOlasilik({ ...KOTU, cinsiyet: 'erkek', bolge: 'low' }) * 100, 12.9, 0.05, 'erkek low')
  yakin(score2DmOlasilik({ ...KOTU, cinsiyet: 'kadin', bolge: 'low' }) * 100, 9.8, 0.05, 'kadın low')
  yakin(score2DmOlasilik({ ...KOTU, cinsiyet: 'erkek', bolge: 'very_high' }) * 100, 31.2, 0.05, 'erkek very high')
  yakin(score2DmOlasilik({ ...KOTU, cinsiyet: 'kadin', bolge: 'very_high' }) * 100, 34.0, 0.05, 'kadın very high')
})

// Resmi hesaplayıcı (ehad260 appendix_2.xlsx) kayıtlı örnek: 53 yaş, tanı yaşı 30, sigara içiyor, SBP 110, TChol 4.5, HDL 1.4, HbA1c 55, eGFR 95.
// "values" sayfası: LP erkek 0.95725 / kadın 1.31418; kalibrasyonsuz 0.099645 / 0.080857; düşük 9.9554 / 8.0800; orta 13.1164 / 10.3024;
// yüksek 15.3886 / 16.0076; çok yüksek 24.1477 / 27.8694.
const HESAP = { yas: 53, taniYasi: 30, sigara: true, sbp: 110, tcholMmol: 4.5, hdlMmol: 1.4, hba1cMmolMol: 55, eGFR: 95 }
const XLSX = {
  erkek: { lp: 0.95725, ham: 0.099645, low: 9.9554, moderate: 13.1164, high: 15.3886, very_high: 24.1477 },
  kadin: { lp: 1.31418, ham: 0.080857, low: 8.0800, moderate: 10.3024, high: 16.0076, very_high: 27.8694 },
} as const

test('yayımlanmış örnek 3 (resmi hesaplayıcı appendix_2.xlsx): LP + kalibrasyonsuz risk + 4 bölge × 2 cinsiyet, yüksek bölge (Türkiye) dahil', () => {
  for (const c of ['erkek', 'kadin'] as const) {
    yakin(score2DmLp({ ...HESAP, cinsiyet: c }), XLSX[c].lp, 0.00001, `${c} LP`)
    yakin(score2DmKalibrasyonsuz({ ...HESAP, cinsiyet: c }), XLSX[c].ham, 0.000001, `${c} ham`)
    for (const b of ['low', 'moderate', 'high', 'very_high'] as const) yakin(score2DmOlasilik({ ...HESAP, cinsiyet: c, bolge: b }) * 100, XLSX[c][b], 0.0001, `${c} ${b}`)
  }
})

test('HbA1c % → mmol/mol (IFCC–NGSP ana denklemi) ve ESC 2023 diyabet risk eşikleri', () => {
  yakin(hba1cMmolMol(7), 53.0, 0.1, '7%'); yakin(hba1cMmolMol(6.5), 47.5, 0.1, '6.5%')
  assert.equal(dmRiskSinifi(4.9), 'dusuk'); assert.equal(dmRiskSinifi(5), 'orta'); assert.equal(dmRiskSinifi(10), 'yuksek'); assert.equal(dmRiskSinifi(20), 'cok_yuksek')
})

test('eksik girdi → skor yok, eksikler adıyla; 40–69 dışı skor yok', () => {
  const r = score2Diabetes({ yas: 60, cinsiyet: 'erkek', sigara: false, sbp: 140, tcholMgdl: 212, hdlMgdl: 50, hba1cYuzde: 7.5, eGFR: null, taniYasi: null })
  assert.equal(r.skor, null)
  assert.ok(r.eksik.some((e) => /eGFR/.test(e)) && r.eksik.some((e) => /tanı yaşı/.test(e)))
  assert.equal(score2Diabetes({ yas: 72, cinsiyet: 'erkek', sigara: false, sbp: 140, tcholMgdl: 212, hdlMgdl: 50, hba1cYuzde: 7.5, eGFR: 80, taniYasi: 60 }).skor, null)
})

test('KVR kartı: DM 40–69 SCORE2-Diabetes yolu (yüksek risk bölgesi), kural kovaları değişmedi, hekim kilitler', () => {
  assert.equal(SCORE2_DIABETES_ONAYLI, true)
  const MG = 38.67
  const base = { yas: 60, cinsiyet: 'erkek' as const, sigara: false, sbp: 140, tcholMgdl: 5.5 * MG, hdlMgdl: 1.3 * MG, askvh: false, dm: true, dmTod: false, eGFR: 90, uacr: 10, ldlMgdl: 120, statinYogunluk: 'yok' as const, hba1cYuzde: 50 / 10.929 + 2.15, dmTaniYasi: 60 }
  const r = kvrDegerlendir(base)
  const beklenen = Math.round(score2DmOlasilik({ ...IYI, cinsiyet: 'erkek', bolge: 'high' }) * 1000) / 10
  assert.equal(r.score2Diabetes, beklenen)
  assert.equal(r.score2, null)
  assert.equal(r.kova, 'yuksek') // ESC 2023: %10–<20 yüksek
  assert.match(r.kovaNedeni, /SCORE2-Diabetes.*hekim kilitler/)
  assert.ok(r.dipnotlar.some((d) => d.ref === 'ESC_SCORE2_DIABETES'))
  // kural kovaları skor gerektirmez
  assert.equal(kvrDegerlendir({ ...base, dmTod: true }).kova, 'cok_yuksek'); assert.equal(kvrDegerlendir({ ...base, dmTod: true }).score2Diabetes, null)
  assert.equal(kvrDegerlendir({ ...base, askvh: true }).score2Diabetes, null)
  assert.equal(kvrDegerlendir({ ...base, eGFR: 25 }).kova, 'cok_yuksek')
  // eksik girdi → TEMD "en az yüksek" yedeği korunur, eksikler notta
  const eksik = kvrDegerlendir({ ...base, dmTaniYasi: null })
  assert.equal(eksik.score2Diabetes, null); assert.equal(eksik.kova, 'yuksek'); assert.match(eksik.score2Notu, /tanı yaşı/)
  // düşük skor + orta KBH kural kovası → yüksekten aşağı inmez
  const genc = kvrDegerlendir({ ...base, yas: 45, sbp: 120, tcholMgdl: 180, hdlMgdl: 60, hba1cYuzde: 6.5, dmTaniYasi: 44, eGFR: 50, uacr: 80 })
  assert.equal(genc.kova, 'yuksek')
})
