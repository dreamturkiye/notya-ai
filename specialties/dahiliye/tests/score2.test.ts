import { test } from 'node:test'
import assert from 'node:assert/strict'
import { score2Ham, score2Kova, score2Kalibrasyonsuz, score2Olasilik, score2Kalibre, kvrDegerlendir, SCORE2_ONAYLI } from '../engines/score2'

test('kural kovası skor gerektirmez: ASKVH / DM+TOD / ağır KBH → çok yüksek', () => {
  const base = { yas: 55, cinsiyet: 'erkek' as const, sigara: false, sbp: 130, tcholMgdl: 200, hdlMgdl: 50, dm: false, dmTod: false, askvh: false, eGFR: 80, uacr: 10, ldlMgdl: 130, statinYogunluk: 'yok' as const }
  assert.equal(kvrDegerlendir({ ...base, askvh: true }).kova, 'cok_yuksek')
  assert.equal(kvrDegerlendir({ ...base, dm: true, dmTod: true }).kova, 'cok_yuksek')
  assert.equal(kvrDegerlendir({ ...base, eGFR: 25 }).kova, 'cok_yuksek')
  assert.equal(kvrDegerlendir({ ...base, eGFR: 40, uacr: 80 }).kova, 'cok_yuksek')
  assert.equal(kvrDegerlendir({ ...base, eGFR: 40, uacr: 10 }).kova, 'yuksek')
  assert.equal(kvrDegerlendir({ ...base, dm: true }).kova, 'yuksek')
})

test('LDL hedefi ve statin açığı', () => {
  const r = kvrDegerlendir({ yas: 60, cinsiyet: 'kadin', sigara: false, sbp: 120, tcholMgdl: 220, hdlMgdl: 60, dm: false, dmTod: false, askvh: true, eGFR: 90, uacr: 5, ldlMgdl: 150, statinYogunluk: 'yok' })
  assert.equal(r.hedefLdl, 55)
  assert.match(r.statinAcigi[0], /yüksek yoğunluk/)
  const r2 = kvrDegerlendir({ yas: 60, cinsiyet: 'kadin', sigara: false, sbp: 120, tcholMgdl: 220, hdlMgdl: 60, dm: false, dmTod: false, askvh: true, eGFR: 90, uacr: 5, ldlMgdl: 80, statinYogunluk: 'yuksek', ezetimib: true })
  assert.match(r2.statinAcigi[0], /PCSK9/)
})

// ── Yayımlanmış çalışılmış örnekler (DAH-SCORE2-VERIFY) ──────────────────────────────────────────────────────────────
// Kaynak: SCORE2 working group, Eur Heart J 2021;42:2439 (ehab309) — "SCORE2 Updated Supplementary Material",
// Supplementary methods Table 4 "Illustration of risk estimation for a non-diabetic man or woman with given risk factor
// values": 50 yaş, sigara içiyor, SBP 140 mmHg, TChol 6.3 mmol/L, HDL 1.4 mmol/L. Beklenen değerler TABLODAN kopyalandı
// (kodun çıktısından değil). Tablo ara adımı 4 ondalığa yuvarladığı için (0.0541 / 0.0332) uçtan uca tolerans ±0.0002.
const MG = 38.67
const ORNEK = { yas: 50, sigara: true, sbp: 140, tcholMgdl: 6.3 * MG, hdlMgdl: 1.4 * MG }
const TABLO4 = {
  erkek: { ham: 0.0541, low: 0.0631, moderate: 0.0811, high: 0.0881, very_high: 0.1506 },
  kadin: { ham: 0.0332, low: 0.0434, moderate: 0.0523, high: 0.0713, very_high: 0.1414 },
} as const
const BOLGELER = ['low', 'moderate', 'high', 'very_high'] as const
const yakin = (a: number, b: number, tol: number, ad: string) => assert.ok(Math.abs(a - b) <= tol, `${ad}: ${a} ≠ ${b} (±${tol})`)

test('yayımlanmış örnek 1 (Suppl. Table 4, adım 1–2): kalibrasyonsuz 10 yıllık risk erkek 0.0541, kadın 0.0332', () => {
  yakin(score2Kalibrasyonsuz({ ...ORNEK, cinsiyet: 'erkek' })!, TABLO4.erkek.ham, 0.00005, 'erkek ham')
  yakin(score2Kalibrasyonsuz({ ...ORNEK, cinsiyet: 'kadin' })!, TABLO4.kadin.ham, 0.00005, 'kadın ham')
})

test('yayımlanmış örnek 2 (Suppl. Table 3 + Table 4 adım 3): tablonun ara değerinden 4 bölge × 2 cinsiyet kalibre risk birebir', () => {
  for (const c of ['erkek', 'kadin'] as const) for (const b of BOLGELER) yakin(score2Kalibre(TABLO4[c].ham, c, b), TABLO4[c][b], 0.00005, `${c} ${b}`)
})

test('yayımlanmış örnek 3 (Suppl. Table 4 uçtan uca): erkek 50 yaş sigara — düşük 6.31%, orta 8.11%, yüksek 8.81%, çok yüksek 15.06%', () => {
  for (const b of BOLGELER) {
    yakin(score2Olasilik({ ...ORNEK, cinsiyet: 'erkek', bolge: b })!, TABLO4.erkek[b], 0.0002, `erkek ${b}`)
    assert.equal(score2Ham({ ...ORNEK, cinsiyet: 'erkek', bolge: b }), Math.round(TABLO4.erkek[b] * 1000) / 10)
  }
})

test('yayımlanmış örnek 4 (Suppl. Table 4 uçtan uca): kadın 50 yaş sigara — düşük 4.34%, orta 5.23%, yüksek 7.13%, çok yüksek 14.14%', () => {
  for (const b of BOLGELER) {
    yakin(score2Olasilik({ ...ORNEK, cinsiyet: 'kadin', bolge: b })!, TABLO4.kadin[b], 0.0002, `kadın ${b}`)
    assert.equal(score2Ham({ ...ORNEK, cinsiyet: 'kadin', bolge: b }), Math.round(TABLO4.kadin[b] * 1000) / 10)
  }
})

test('onaylı SCORE2: Türkiye (yüksek risk bölgesi) varsayılanı, kova yalnız taslak + ESC_SCORE2 Kaynak; DM / ≥70 / kural kovasında skor yok', () => {
  assert.equal(SCORE2_ONAYLI, true)
  const base = { ...ORNEK, cinsiyet: 'erkek' as const, dm: false, dmTod: false, askvh: false, eGFR: 90, uacr: 5, ldlMgdl: 160, statinYogunluk: 'yok' as const }
  const r = kvrDegerlendir(base)
  assert.equal(r.score2, 8.8) // Table 4 yüksek risk bölgesi erkek 0.0881
  assert.equal(r.kova, 'yuksek') // 50–69 yaş: %5–<10
  assert.match(r.kovaNedeni, /hekim kilitler/)
  assert.ok(r.dipnotlar.some((d) => d.ref === 'ESC_SCORE2'))
  assert.equal(kvrDegerlendir({ ...base, cinsiyet: 'kadin' }).score2, 7.1) // Table 4 yüksek risk bölgesi kadın 0.0713
  assert.equal(kvrDegerlendir({ ...base, dm: true }).score2, null)
  assert.equal(kvrDegerlendir({ ...base, yas: 72 }).score2, null)
  const kural = kvrDegerlendir({ ...base, askvh: true })
  assert.equal(kural.score2, null); assert.equal(kural.kova, 'cok_yuksek')
})

test('ham model tutarlılığı: yaş/sigara/SBP/TChol ↑ → risk ↑, HDL ↑ → risk ↓; eşikler yaşa göre', () => {
  const g = { yas: 55, cinsiyet: 'erkek' as const, sigara: false, sbp: 130, tcholMgdl: 200, hdlMgdl: 50, bolge: 'high' as const }
  const r0 = score2Ham(g)!
  assert.ok(r0 > 0 && r0 < 50)
  assert.ok(score2Ham({ ...g, yas: 65 })! > r0)
  assert.ok(score2Ham({ ...g, sigara: true })! > r0)
  assert.ok(score2Ham({ ...g, sbp: 170 })! > r0)
  assert.ok(score2Ham({ ...g, tcholMgdl: 280 })! > r0)
  assert.ok(score2Ham({ ...g, hdlMgdl: 75 })! < r0)
  assert.ok(score2Ham({ ...g, cinsiyet: 'kadin' })! < r0)
  assert.ok(score2Ham({ ...g, bolge: 'low' })! < r0)
  assert.equal(score2Ham({ ...g, yas: 39 }), null)
  assert.equal(score2Kova(45, 3), 'yuksek'); assert.equal(score2Kova(45, 8), 'cok_yuksek'); assert.equal(score2Kova(60, 4.9), 'dusuk_orta'); assert.equal(score2Kova(60, 10), 'cok_yuksek')
})
