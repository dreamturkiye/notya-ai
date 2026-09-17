import { test } from 'node:test'
import assert from 'node:assert/strict'
import { asiTakvimi } from '../engines/asi'

const bul = (r: ReturnType<typeof asiTakvimi>, k: string) => r.find((x) => x.kod === k)

test('≥65 hiç aşı yok: grip + pnömokok + zona + Td zamanı; HBV serolojisi', () => {
  const r = asiTakvimi({ yas: 70, kronik: {}, dozlar: [], bugun: '2026-10-05' })
  assert.equal(bul(r, 'grip')?.durum, 'zamani'); assert.match(bul(r, 'pnomokok')!.not, /PCV20 tek doz VEYA PCV13/)
  assert.equal(bul(r, 'zona')?.durum, 'zamani'); assert.equal(bul(r, 'td')?.durum, 'zamani'); assert.ok(bul(r, 'covid'))
  assert.ok(r.every((x) => x.dipnot.ref === 'HYP' || x.dipnot.ref === 'TIHUD2023'))
})

test('grip: bu sezon yapıldıysa tamam; yaz aylarında planlı; genç risksiz → grip yok', () => {
  assert.equal(bul(asiTakvimi({ yas: 55, kronik: { dm: true }, dozlar: [{ asi: 'grip', tarih: '2026-09-20' }], bugun: '2026-12-01' }), 'grip')?.durum, 'tamam')
  assert.equal(bul(asiTakvimi({ yas: 55, kronik: { dm: true }, dozlar: [{ asi: 'grip', tarih: '2025-10-20' }], bugun: '2026-06-01' }), 'grip')?.due, '2026-09-01')
  assert.equal(bul(asiTakvimi({ yas: 55, kronik: { dm: true }, dozlar: [], bugun: '2026-06-01' }), 'grip')?.durum, 'planli')
  assert.equal(bul(asiTakvimi({ yas: 30, kronik: {}, dozlar: [], bugun: '2026-10-01' }), 'grip'), undefined)
})

test('pnömokok dizisi: PCV13 sonrası PPSV23 1 yıl; KBH\'de 8 hafta; PCV20 tamam', () => {
  assert.equal(bul(asiTakvimi({ yas: 60, kronik: { dm: true }, dozlar: [{ asi: 'pcv13', tarih: '2026-01-10' }], bugun: '2026-09-16' }), 'pnomokok')?.due, '2027-01-10')
  assert.equal(bul(asiTakvimi({ yas: 60, kronik: { kbh: true }, dozlar: [{ asi: 'pcv13', tarih: '2026-01-10' }], bugun: '2026-09-16' }), 'pnomokok')?.due, '2026-03-07')
  assert.equal(bul(asiTakvimi({ yas: 66, kronik: {}, dozlar: [{ asi: 'pcv20', tarih: '2025-01-10' }], bugun: '2026-09-16' }), 'pnomokok')?.durum, 'tamam')
})

test('zona 2. doz 2 ay; Td 10 yıl; HBV: anti-HBs ≥10 bağışık, HBsAg pozitif aşı değil, seronegatif 3 doz şema', () => {
  const r = asiTakvimi({ yas: 52, kronik: {}, dozlar: [{ asi: 'zona', tarih: '2026-08-01' }, { asi: 'td', tarih: '2014-05-01' }], antiHbs: 45, hbsag: 'negatif', bugun: '2026-09-16' })
  assert.equal(bul(r, 'zona')?.due, '2026-10-01'); assert.equal(bul(r, 'td')?.durum, 'gecikti'); assert.equal(bul(r, 'hbv')?.durum, 'tamam')
  assert.equal(bul(asiTakvimi({ yas: 40, kronik: {}, dozlar: [], hbsag: 'Pozitif', antiHbs: 0, bugun: '2026-09-16' }), 'hbv')?.durum, 'uygun_degil')
  assert.equal(bul(asiTakvimi({ yas: 40, kronik: { dm: true }, dozlar: [{ asi: 'hbv', tarih: '2026-08-01' }], hbsag: 'negatif', antiHbs: 2, bugun: '2026-09-16' }), 'hbv')?.due, '2026-09-01')
})
