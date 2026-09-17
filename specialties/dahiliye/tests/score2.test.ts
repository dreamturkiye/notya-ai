import { test } from 'node:test'
import assert from 'node:assert/strict'
import { score2Ham, score2Kova, kvrDegerlendir, SCORE2_ONAYLI } from '../engines/score2'

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

test('güvenlik kilidi: onaysızken sayısal SCORE2 dönmez, not döner', () => {
  const r = kvrDegerlendir({ yas: 55, cinsiyet: 'erkek', sigara: true, sbp: 150, tcholMgdl: 240, hdlMgdl: 40, dm: false, dmTod: false, askvh: false, eGFR: 90, uacr: 5, ldlMgdl: 160, statinYogunluk: 'yok' })
  if (!SCORE2_ONAYLI) { assert.equal(r.score2, null); assert.match(r.score2Notu, /doğrulama/); assert.equal(r.kova, null) }
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
