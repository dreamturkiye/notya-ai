import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sigaraDegerlendir, paketYil, hsiSkoru, BES_A, EVRE_AD, type SigaraGirdi } from '../engines/sigara'

const t: SigaraGirdi = { durum: 'iciyor', gunlukAdet: 20, yil: 30, ilkSigaraDk: 15, evre: null, birakmaTarihi: null, eGFR: null, nobetOyku: false, yemeBozuklugu: false, gebe: false, psikiyatrikOyku: false, ilacMetinleri: [], koah: false, askvh: false, dm: false, bugun: '2026-09-17' }
const doz = /\d+\s*(mg|mcg|µg)/i

test('paket-yıl', () => {
  assert.equal(paketYil(20, 30), 30); assert.equal(paketYil(10, 15), 7.5); assert.equal(paketYil(null, 10), null)
})

test('HSI eşikleri ve null', () => {
  assert.equal(hsiSkoru(10, 61), 0); assert.equal(hsiSkoru(11, 60), 2); assert.equal(hsiSkoru(20, 31), 2); assert.equal(hsiSkoru(21, 30), 4)
  assert.equal(hsiSkoru(30, 6), 4); assert.equal(hsiSkoru(31, 5), 6); assert.equal(hsiSkoru(null, 5), null); assert.equal(hsiSkoru(20, null), null)
  assert.equal(sigaraDegerlendir({ ...t, gunlukAdet: 40, ilkSigaraDk: 3 }).bagimlilik, 'yuksek')
  assert.equal(sigaraDegerlendir({ ...t, gunlukAdet: 5, ilkSigaraDk: 90 }).bagimlilik, 'dusuk')
})

test('hazır değil: farmakoterapi yok, motivasyonel görüşme; hiç içmemiş: boş', () => {
  const r = sigaraDegerlendir({ ...t, evre: 'hazir_degil', gunlukAdet: 40, ilkSigaraDk: 3 })
  assert.deepEqual(r.farmakoterapiSinifi, []); assert.match(r.yaklasim.join(' '), /motivasyonel/); assert.match(r.yaklasim.join(' '), /bir sonraki vizit/i)
  const h = sigaraDegerlendir({ ...t, durum: 'hic' })
  assert.deepEqual([h.yaklasim, h.kaynaklar, h.gorevler, h.uyarilar, h.sevk], [[], [], [], [], []]); assert.equal(h.dipnotlar.length, 3)
  assert.equal(BES_A.length, 5); assert.equal(EVRE_AD.hazirlik, 'Hazırlık')
})

test('hazırlık: 3 sınıf, ALO 171, SGK şablonu yok, tarih görevi +14 gün; komorbidite satırları', () => {
  const r = sigaraDegerlendir({ ...t, evre: 'hazirlik', koah: true, askvh: true, dm: true })
  assert.equal(r.farmakoterapiSinifi.length, 3); assert.ok(r.farmakoterapiSinifi.every((x) => /hekim dozu yazar/.test(x)))
  assert.ok(r.kaynaklar.some((x) => x.includes('ALO 171'))); assert.match(r.kaynaklar.join(' '), /SGK ilaç raporu şablonu yok/)
  assert.deepEqual(r.gorevler, [{ kod: 'sigara_tarih', ad: 'Bırakma tarihini belirle', due: '2026-10-01' }])
  assert.ok(r.yaklasim.some((x) => /^KOAH/.test(x)) && r.yaklasim.some((x) => /KVH/.test(x)) && r.yaklasim.some((x) => /^Diyabet/.test(x)))
})

test('nöbet öyküsü bupropionu çıkarır + uyarı; psikiyatrik öykü sevk', () => {
  const r = sigaraDegerlendir({ ...t, evre: 'hazirlik', nobetOyku: true, psikiyatrikOyku: true })
  assert.ok(!r.farmakoterapiSinifi.some((x) => /Bupropion/.test(x))); assert.equal(r.farmakoterapiSinifi.length, 2)
  assert.ok(r.uyarilar.some((x) => /Bupropion.*nöbet/.test(x))); assert.ok(r.uyarilar.some((x) => /nöropsikiyatrik/.test(x)))
  assert.ok(r.sevk.includes('Psikiyatri ile ortak izlem (hekim kararı)'))
})

test('gebe: yalnız NRT (hekim kararı); eGFR 25 vareniklin uyarısı; CYP1A2', () => {
  const g = sigaraDegerlendir({ ...t, evre: 'eylem', gebe: true })
  assert.equal(g.farmakoterapiSinifi.length, 1); assert.match(g.farmakoterapiSinifi[0], /Nikotin replasman.*hekim kararı/); assert.ok(g.uyarilar.some((x) => /davranışsal destek öncelikli/.test(x)))
  const e = sigaraDegerlendir({ ...t, evre: 'hazirlik', eGFR: 25, ilacMetinleri: ['Klozapin 100 mg tb'] })
  assert.ok(e.uyarilar.some((x) => /Vareniklin.*böbrek fonksiyonuna göre doz ayarı hekim/.test(x)))
  assert.ok(e.uyarilar.some((x) => /CYP1A2/.test(x)))
})

test('görev tarihleri (bırakma 2026-09-20) ve bıraktı → 12 ay; yüksek bağımlılık sevk', () => {
  const r = sigaraDegerlendir({ ...t, evre: 'hazirlik', birakmaTarihi: '2026-09-20', gunlukAdet: 40, ilkSigaraDk: 3 })
  assert.deepEqual(r.gorevler.map((x) => [x.kod, x.due]), [['sigara_1hafta', '2026-09-27'], ['sigara_1ay', '2026-10-20'], ['sigara_3ay', '2026-12-20'], ['sigara_6ay', '2027-03-20']])
  assert.match(r.sevk[0], /yüksek bağımlılık/)
  const b = sigaraDegerlendir({ ...t, durum: 'birakti', birakmaTarihi: '2026-01-10' })
  assert.match(b.yaklasim[0], /Nüks önleme/); assert.deepEqual(b.gorevler.map((x) => x.due), ['2027-01-10']); assert.deepEqual(b.farmakoterapiSinifi, [])
})

test('hiçbir çıktıda doz sayısı yok', () => {
  const girdiler: SigaraGirdi[] = [{ ...t, evre: 'hazirlik', eGFR: 20, nobetOyku: true, psikiyatrikOyku: true, koah: true, askvh: true, dm: true, birakmaTarihi: '2026-09-20', ilacMetinleri: ['Teofilin 200 mg SR', 'VARFARİN 5 mg', 'Olanzapin 10mg'] }, { ...t, evre: 'eylem', gebe: true }, { ...t, durum: 'birakti', birakmaTarihi: '2026-01-01' }, { ...t, evre: 'hazir_degil' }, { ...t, evre: 'dusunuyor' }, { ...t, evre: 'surdurme' }]
  for (const g of girdiler) assert.ok(!doz.test(JSON.stringify(sigaraDegerlendir(g))))
  assert.ok(!doz.test(JSON.stringify(BES_A)))
})
