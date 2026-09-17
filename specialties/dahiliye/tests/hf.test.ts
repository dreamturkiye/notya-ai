import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hfDegerlendir, efKategorisi } from '../engines/hf'

const t = { ef: 30, nyha: 2 as const, ilacMetinleri: [] as string[], sbp: 118, nabiz: 72, k: 4.4, eGFR: 65, ntprobnp: null, oncekiNtprobnp: null, kiloSerisi: [] as { kg: number; tarih: string }[], yatis12Ay: false, ekoTarihi: null, bugun: '2026-09-16' }

test('EF kategorileri', () => { assert.equal(efKategorisi(40), 'HFrEF'); assert.equal(efKategorisi(45), 'HFmrEF'); assert.equal(efKategorisi(55), 'HFpEF'); assert.equal(efKategorisi(null), null) })

test('HFrEF: 4 sütun; eksikler plan; EF ≤35 + NYHA ≥2 → cihaz değerlendirme sevki', () => {
  const r = hfDegerlendir({ ...t, ilacMetinleri: ['entresto sakubitril valsartan', 'concor bisoprolol'] })
  assert.deepEqual(r.eksik.length, 2); assert.ok(r.sutunlar.find((s) => s.kod === 'ras')!.var)
  assert.ok(r.sevk.some((s) => /ICD\/CRT/.test(s))); assert.ok(r.plan.every((p) => !/\d+\s?mg/.test(p)))
})

test('HFpEF: yalnız SGLT2 endike; uyarılar: K >5, diltiazem HFrEF, NSAİİ, 3 günde >2 kg', () => {
  const p = hfDegerlendir({ ...t, ef: 60 })
  assert.deepEqual(p.sutunlar.filter((s) => s.endike).map((s) => s.kod), ['sglt2'])
  const u = hfDegerlendir({ ...t, k: 5.4, ilacMetinleri: ['diltiazem', 'arveles deksketoprofen'], kiloSerisi: [{ kg: 80, tarih: '2026-09-13' }, { kg: 82.6, tarih: '2026-09-16' }] })
  assert.equal(u.uyarilar.length, 4)
  assert.ok(hfDegerlendir({ ...t, ef: null }).sevk.some((s) => /ekokardiyografi/.test(s)))
})
