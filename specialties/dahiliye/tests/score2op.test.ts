import { test } from 'node:test'
import assert from 'node:assert/strict'
import { score2OpLp, score2OpKalibrasyonsuz, score2OpKalibreFormul, score2OpOlasilik, score2Op, SCORE2_OP_ONAYLI } from '../engines/score2op'
import { kvrDegerlendir } from '../engines/score2'

// ── Yayımlanmış çalışılmış örnek (DAH-SCORE2-OP) ─────────────────────────────────────────────────────────────────────────
// Kaynak: SCORE2-OP working group, Eur Heart J 2021;42:2455 (ehab312) — "Supplementary material_20210604_v2.docx",
// Supplementary Methods Table 3: 75 yaş, TChol 5.5, HDL 1.3, SBP 140, diyabet yok, sigara içiyor. Beklenen değerler TABLODAN.
const MG = 38.67
const ORNEK = { yas: 75, sigara: true, dm: false, sbp: 140, tcholMgdl: 5.5 * MG, hdlMgdl: 1.3 * MG }
const yakin = (a: number, b: number, tol: number, ad: string) => assert.ok(Math.abs(a - b) <= tol, `${ad}: ${a} ≠ ${b} (±${tol})`)

test('yayımlanmış örnek 1 (Suppl. Methods Table 3, adım 1): LP kadın 0.5029, erkek 0.3298', () => {
  yakin(score2OpLp({ ...ORNEK, cinsiyet: 'kadin' }), 0.5029, 0.00005, 'kadın LP')
  yakin(score2OpLp({ ...ORNEK, cinsiyet: 'erkek' }), 0.3298, 0.00005, 'erkek LP')
})

test('yayımlanmış örnek 2 (Suppl. Methods Table 3, adım 2): kalibrasyonsuz 10 yıllık risk kadın 0.2442, erkek 0.2966', () => {
  yakin(score2OpKalibrasyonsuz({ ...ORNEK, cinsiyet: 'kadin' })!, 0.2442, 0.0001, 'kadın ham')
  yakin(score2OpKalibrasyonsuz({ ...ORNEK, cinsiyet: 'erkek' })!, 0.2966, 0.0001, 'erkek ham')
})

test('yayımlanmış örnek 3 (Suppl. Methods Table 3, adım 3 formülü, örneğin kendi ölçekleriyle): kadın 0.1397, erkek 0.1930', () => {
  yakin(score2OpKalibreFormul(0.2442, -0.85, 0.82), 0.1397, 0.0001, 'kadın')
  yakin(score2OpKalibreFormul(0.2966, -0.61, 0.89), 0.1930, 0.0001, 'erkek')
})

test('doğrulama kapısı: Table 1 ölçekleri yayımlanmış bölge örneklerini üretmiyor → SCORE2_OP_ONAYLI=false, sayısal skor yok', () => {
  // Ek materyal kendi içinde çelişkili: Table 3 örneği düşük bölge için Table 1'den farklı ölçek kullanıyor.
  const tablo1Dusuk = score2OpOlasilik({ ...ORNEK, cinsiyet: 'kadin', bolge: 'low' })!
  assert.ok(Math.abs(tablo1Dusuk - 0.1397) > 0.01, 'Table 1 düşük bölge ölçeği Table 3 örneğini üretiyorsa kapı yeniden değerlendirilmeli')
  // Ana makale: 75 yaş erkek sigara, SBP 150, non-HDL 4.5 → düşük bölge %16 (HDL 1.0–1.6 aralığında hiçbir değer üretmiyor).
  for (const hdl of [1.0, 1.2, 1.4, 1.6]) assert.ok(Math.abs(score2OpOlasilik({ yas: 75, sigara: true, dm: false, sbp: 150, tcholMgdl: (4.5 + hdl) * MG, hdlMgdl: hdl * MG, cinsiyet: 'erkek', bolge: 'low' })! * 100 - 16) > 2)
  assert.equal(SCORE2_OP_ONAYLI, false)
  assert.equal(score2Op({ ...ORNEK, cinsiyet: 'erkek' }), null)
})

test('KVR kartı: ≥70 yaş SCORE2-OP yoluna gider, sayı yok, bekleme notu + kural kovaları aynı', () => {
  const base = { ...ORNEK, cinsiyet: 'erkek' as const, askvh: false, dmTod: false, eGFR: 80, uacr: 10, ldlMgdl: 140, statinYogunluk: 'yok' as const }
  const r = kvrDegerlendir(base)
  assert.equal(r.score2, null); assert.equal(r.score2Op, null)
  assert.match(r.score2Notu, /SCORE2-OP/)
  assert.equal(r.kova, null)
  assert.equal(kvrDegerlendir({ ...base, askvh: true }).kova, 'cok_yuksek')
  assert.equal(kvrDegerlendir({ ...base, dm: true }).kova, 'yuksek') // DM ≥50 yaş TEMD kuralı
})
