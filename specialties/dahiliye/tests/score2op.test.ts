import { test } from 'node:test'
import assert from 'node:assert/strict'
import { score2OpLp, score2OpKalibrasyonsuz, score2OpKalibreFormul, score2OpOlasilik, score2Op, SCORE2_OP_ONAYLI } from '../engines/score2op'
import { kvrDegerlendir } from '../engines/score2'

// ── Yayımlanmış çalışılmış örnek (DAH-SCORE2-OP) ─────────────────────────────────────────────────────────────────────────
// Kaynak: SCORE2-OP working group, Eur Heart J 2021;42:2455 (ehab312) — "Supplementary material_20210604_v2.docx",
// Supplementary Methods Table 3: 75 yaş, TChol 5.5, HDL 1.3, SBP 140, diyabet yok, sigara içiyor.
// Adım 1–2 TABLODAN. Adım 3: Table 2, ölçekleri Supplementary Methods Table 1'den alır (Table 3'teki −0.85/−0.61 yazım hatası).
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

test('Table 3 adım 3 yazım hatası: örneğin kendi (yanlış) ölçekleriyle formül 0.1397 / 0.1930 üretir — Table 1 değil', () => {
  // Belgede kalan hatalı ölçekler; formülün kendisi doğru (Table 2 adım 3).
  yakin(score2OpKalibreFormul(0.2442, -0.85, 0.82), 0.1397, 0.0001, 'kadın (yanlış ölçek)')
  yakin(score2OpKalibreFormul(0.2966, -0.61, 0.89), 0.1930, 0.0001, 'erkek (yanlış ölçek)')
  // Table 1 düşük bölge ≠ Table 3'ün yazdığı ölçekler.
  const tablo1 = score2OpOlasilik({ ...ORNEK, cinsiyet: 'kadin', bolge: 'low' })!
  assert.ok(Math.abs(tablo1 - 0.1397) > 0.01, 'Table 1 düşük bölge Table 3 hatalı ölçeğiyle çakışıyorsa yeniden değerlendir')
})

test('yayımlanmış örnek 3 (Table 2 adım 3 + Table 1 düşük bölge): kadın %15.2, erkek %18.6', () => {
  yakin(score2OpOlasilik({ ...ORNEK, cinsiyet: 'kadin', bolge: 'low' })!, 0.152, 0.001, 'kadın Table1 low')
  yakin(score2OpOlasilik({ ...ORNEK, cinsiyet: 'erkek', bolge: 'low' })!, 0.186, 0.001, 'erkek Table1 low')
})

test('Türkiye yüksek risk bölgesi (Table 1): aynı örnek kadın %30.6, erkek %27.8 — SCORE2_OP_ONAYLI', () => {
  assert.equal(SCORE2_OP_ONAYLI, true)
  assert.equal(score2Op({ ...ORNEK, cinsiyet: 'kadin', bolge: 'high' }), 30.6)
  assert.equal(score2Op({ ...ORNEK, cinsiyet: 'erkek', bolge: 'high' }), 27.8)
  // ≥70 eşik: ≥%15 → çok yüksek kova taslak
  assert.equal(score2Op({ ...ORNEK, cinsiyet: 'erkek' }), 27.8) // varsayılan high
})

test('KVR kartı: ≥70 yaş SCORE2-OP sayı + kova taslak; kural kovaları aynı', () => {
  const base = { ...ORNEK, cinsiyet: 'erkek' as const, askvh: false, dmTod: false, eGFR: 80, uacr: 10, ldlMgdl: 140, statinYogunluk: 'yok' as const }
  const r = kvrDegerlendir(base)
  assert.equal(r.score2, null)
  assert.equal(r.score2Op, 27.8)
  assert.equal(r.kova, 'cok_yuksek') // ≥70: ≥%15
  assert.match(r.kovaNedeni, /SCORE2-OP/)
  assert.ok((r.dipnotlar || []).some((d) => d.ref === 'ESC_SCORE2_OP'))
  assert.equal(kvrDegerlendir({ ...base, askvh: true }).kova, 'cok_yuksek')
  // DM ≥50 → TEMD ikincil "yüksek" (skorGerekli kapalı; SCORE2-Diabetes yalnız 40–69)
  assert.equal(kvrDegerlendir({ ...base, dm: true }).kova, 'yuksek')
})
