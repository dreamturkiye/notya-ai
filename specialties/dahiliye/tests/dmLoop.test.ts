import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fib4, fib4Yorum, dmDongu } from '../engines/dmLoop'

test('FIB-4 formülü ve eşikler (1,3 / 2,67)', () => {
  // 60 yaş, AST 40, ALT 36, Plt 200 → (60×40)/(200×6) = 2,0
  assert.equal(fib4(60, 40, 36, 200), 2)
  assert.equal(fib4Yorum(2, 60).kategori, 'belirsiz'); assert.equal(fib4Yorum(3.1, 60).sevk, true); assert.equal(fib4Yorum(1.0, 50).kategori, 'dusuk')
  assert.match(fib4Yorum(1.0, 30).aksiyon, /<35 yaş/); assert.equal(fib4(60, 40, 0, 200), null)
})

const taban = { yas: 58, ilacMetinleri: ['glifor metformin'], askvh: false, kky: false, eGFR: 80, uacr: 10, vki: 27, alt: null, ast: null, plt: null, sonAyakFoto: null, bugun: '2026-09-16' }

test('kardiyo-renal bayraklar: KY/KBH → SGLT2, ASKVH → GLP-1 + SGLT2; kullanılıyorsa plan yok', () => {
  const r = dmDongu({ ...taban, kky: true, eGFR: 50, askvh: true })
  assert.ok(r.kardiyoRenal.some((k) => k.sinif === 'SGLT2' && /Kalp/.test(k.neden))); assert.ok(r.kardiyoRenal.some((k) => k.sinif === 'GLP-1 RA'))
  assert.ok(r.plan.every((p) => /hekim/.test(p)))
  const r2 = dmDongu({ ...taban, kky: true, ilacMetinleri: ['jardiance empagliflozin'] })
  assert.equal(r2.kardiyoRenal[0].kullaniyor, true); assert.equal(r2.plan.filter((p) => /SGLT2/.test(p)).length, 0)
})

test('hipoglisemi riski: SU + ≥65 veya eGFR <45; FIB-4 yüksek → gastro sevk; ayak foto ve FIB-4 görevleri', () => {
  const r = dmDongu({ ...taban, yas: 70, ilacMetinleri: ['diamicron gliklazid'], alt: { deger: 25, tarih: '2026-09-01' }, ast: { deger: 60, tarih: '2026-09-01' }, plt: { deger: 110, tarih: '2026-09-01' } })
  assert.match(r.hipoRiski!, /Sülfonilüre/); assert.ok(r.fib4 && r.fib4.skor >= 2.67); assert.equal(r.sevk.length, 1)
  assert.ok(r.gorevler.some((g) => g.kod === 'dm_ayak_foto')); assert.ok(!r.gorevler.some((g) => g.kod === 'dm_fib4'))
  assert.equal(dmDongu({ ...taban, eGFR: 40, ilacMetinleri: ['lantus insülin glarjin'] }).hipoRiski != null, true)
  assert.ok(dmDongu(taban).gorevler.some((g) => g.kod === 'dm_fib4'))
})
