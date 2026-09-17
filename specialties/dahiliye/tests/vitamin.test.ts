import { test } from 'node:test'
import assert from 'node:assert/strict'
import { vitaminDegerlendir, type VitGirdi } from '../engines/vitamin'
import { sgkRaporTaslagi, SGK_SABLONLARI } from '../engines/sgkRapor'

const bos: VitGirdi = { vitD: null, vitDTarih: null, b12: null, b12Tarih: null, folat: null, hb: null, mcv: null, ca: null, kadin: true, ilacMetinleri: [], noroSemptom: false, malabsorpsiyon: false, vegan: false, bugun: '2026-09-17' }
const dozYok = (r: ReturnType<typeof vitaminDegerlendir>) => [...r.d.plan, ...r.d.uyarilar, ...r.d.sonrakiTest, ...r.b12.plan, ...r.b12.uyarilar, ...r.b12.sonrakiTest, ...r.sevk].every((x) => !/\d+\s*(mg|mcg|µg|IU|ünite)\b/i.test(x))

test('D vitamini eşikleri: <20 eksik, 20–29 yetersiz, 30–100 yeterli, >100 yüksek; lab yoksa sonraki test', () => {
  assert.equal(vitaminDegerlendir({ ...bos, vitD: 12 }).d.durum, 'eksik')
  assert.equal(vitaminDegerlendir({ ...bos, vitD: 25 }).d.durum, 'yetersiz')
  assert.equal(vitaminDegerlendir({ ...bos, vitD: 30 }).d.durum, 'yeterli')
  assert.equal(vitaminDegerlendir({ ...bos, vitD: 130 }).d.uyarilar.length, 1)
  assert.equal(vitaminDegerlendir(bos).d.durum, null); assert.match(vitaminDegerlendir(bos).d.sonrakiTest[0], /25-OH D/)
})

test('D eksik: replasman SINIFI (doz hekim), Ca istenir, 3 ay kontrol görevi, SGK vitd şablonu; hiperkalsemide uyarı', () => {
  const r = vitaminDegerlendir({ ...bos, vitD: 9, ca: 10.9 })
  assert.match(r.d.plan[0], /kolekalsiferol sınıfı.*hekim yazar/)
  assert.deepEqual(r.gorevler, [{ kod: 'vitd_kontrol', ad: '25-OH D + Ca kontrolü (replasman sonrası)', due: '2026-12-17' }])
  assert.deepEqual(r.sgkSablonlari, ['vitd'])
  assert.ok(r.d.uyarilar.some((u) => /hiperkalsemi/.test(u)))
  assert.ok(dozYok(r))
})

test('B12: <200 eksik → replasman + pernisiyöz anemi testi; nörolojik bulguda parenteral + nöroloji sevk; 200–300 → MMA', () => {
  const r = vitaminDegerlendir({ ...bos, b12: 150, noroSemptom: true, ilacMetinleri: ['Metformin 1000 mg'] })
  assert.equal(r.b12.durum, 'eksik'); assert.match(r.b12.plan[0], /parenteral yol tercih/)
  assert.ok(r.b12.sonrakiTest.some((x) => /intrinsik/.test(x))); assert.equal(r.sevk.length, 1)
  assert.ok(r.b12.uyarilar.some((u) => /Metformin/.test(u))); assert.deepEqual(r.sgkSablonlari, ['b12'])
  assert.ok(dozYok(r))
  const s = vitaminDegerlendir({ ...bos, b12: 250 })
  assert.equal(s.b12.durum, 'sinirda'); assert.match(s.b12.sonrakiTest[0], /Metilmalonik/); assert.equal(s.b12.plan.length, 0)
})

test('B12 yok: metformin veya makrositozda test önerisi; folat düşük + B12 eksik → folat tek başına verilmez', () => {
  assert.match(vitaminDegerlendir({ ...bos, ilacMetinleri: ['metformin'] }).b12.sonrakiTest[0], /metformin/)
  assert.match(vitaminDegerlendir({ ...bos, mcv: 104 }).b12.sonrakiTest[0], /makrositoz/)
  assert.ok(vitaminDegerlendir({ ...bos, b12: 120, folat: 2.5 }).b12.uyarilar.some((u) => /tek başına verilmez/.test(u)))
})

test('SGK şablonları: vitd E55.9 ve b12 (anemi varsa D51.9) — lab kanıtı yalnız onaylı satırdan, etken madde yalnız hasta_ilaclar', () => {
  assert.ok(SGK_SABLONLARI.some((x) => x.id === 'vitd') && SGK_SABLONLARI.some((x) => x.id === 'b12'))
  const hasta = { adSoyad: 'Test', yas: 70, kadin: true }
  const v = sgkRaporTaslagi({ sablon: 'vitd', hasta, bugun: '2026-09-17', ilaclar: [{ ad: 'Devit-3', etken: 'kolekalsiferol', aktif: true }], labs: { VitD: [{ ad: 'VitD', deger: 8, tarih: '2026-09-10' }], Ca: [{ ad: 'Ca', deger: 9.4, tarih: '2026-09-10' }] } })
  assert.equal(v.draft.tani.icd10, 'E55.9'); assert.deepEqual(v.draft.etkenMaddeler, ['kolekalsiferol']); assert.equal(v.sutKontrol[0].tamam, true); assert.equal(v.eksikler.length, 0)
  const b = sgkRaporTaslagi({ sablon: 'b12', hasta, bugun: '2026-09-17', ilaclar: [], labs: { B12: [{ ad: 'B12', deger: 140, tarih: '2026-09-10' }], Hb: [{ ad: 'Hb', deger: 10.8, tarih: '2026-09-10' }] } })
  assert.equal(b.draft.tani.icd10, 'D51.9'); assert.ok(b.eksikler.some((e) => /Etken madde/.test(e)))
  const yok = sgkRaporTaslagi({ sablon: 'b12', hasta, bugun: '2026-09-17', ilaclar: [], labs: {} })
  assert.equal(yok.draft.tani.icd10, 'E53.8'); assert.equal(yok.sutKontrol[0].tamam, false)
})
