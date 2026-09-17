import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ekgDegerlendir, qtc, EKG_SABLONLARI, type EkgGirdi } from '../engines/ekg'
import { tiradsPuan, trKategori, nodulDegerlendir } from '../engines/tiroidNodul'

const bos: EkgGirdi = { ritim: 'sinus', hiz: 72, pr: 160, qrs: 90, qt: 380, aks: 'normal', stElevasyon: false, stDepresyon: false, tInversiyon: false, yeniLbbb: false, rbbb: false, avBlok: 'yok', deltaDalga: false, lvh: false, gogusAgrisi: false }

test('QTc Bazett / Fridericia', () => { const q = qtc(400, 60); assert.equal(q.bazett, 400); assert.equal(q.fridericia, 400); assert.equal(qtc(360, 100).bazett, 465) })

test('normal şablon: acil yok, rapor Türkçe; ST elevasyonu / tam blok / QTc>500 acil', () => {
  const n = ekgDegerlendir({ ...bos, ...EKG_SABLONLARI.normal.g } as EkgGirdi)
  assert.equal(n.acil.length, 0); assert.match(n.rapor, /normal sınırlarda EKG/); assert.match(n.rapor, /sinüs ritmi, hız 72/)
  assert.equal(ekgDegerlendir({ ...bos, stElevasyon: true }).acil.length, 1)
  assert.equal(ekgDegerlendir({ ...bos, avBlok: '3', hiz: 35 }).acil.length, 2)
  assert.ok(ekgDegerlendir({ ...bos, qt: 520, hiz: 70 }).acil.some((a) => /QTc/.test(a)))
  const af = ekgDegerlendir({ ...bos, ritim: 'af', hiz: 125, qt: 300 })
  assert.equal(af.acil.length, 0); assert.ok(af.dikkat.some((d) => /antikoagülan/.test(d)))
})

test('TI-RADS puan ve kategori; kistik 0 puan', () => {
  assert.equal(tiradsPuan({ bilesim: 'solid', ekojenite: 'cok_hipo', sekil: 'uzun', kenar: 'lobule_duzensiz', odak: 'punktat' }), 13)
  assert.equal(tiradsPuan({ bilesim: 'kistik', ekojenite: 'cok_hipo', sekil: 'uzun', kenar: 'ekstratiroidal', odak: 'punktat' }), 0)
  assert.equal(trKategori(1), 1); assert.equal(trKategori(2), 2); assert.equal(trKategori(3), 3); assert.equal(trKategori(6), 4); assert.equal(trKategori(7), 5)
})

test('nodül eşikleri: TR4 16 mm → İİAB sevk; TR4 12 mm → izlem 1/2/3/5 yıl; TR3 12 mm gerekmez; düşük TSH sintigrafi', () => {
  const b = { bilesim: 'solid' as const, ekojenite: 'hipo' as const, sekil: 'genis' as const, kenar: 'duzgun' as const, odak: 'yok' as const, usTarihi: '2026-09-01', tsh: 1.5, bugun: '2026-09-16' }
  const a = nodulDegerlendir({ ...b, boyutMm: 16 })
  assert.equal(a.tr, 4); assert.equal(a.oneri, 'iiab'); assert.equal(a.sevk.length, 1)
  const i = nodulDegerlendir({ ...b, boyutMm: 12 })
  assert.equal(i.oneri, 'izlem'); assert.deepEqual(i.izlemTarihleri, ['2027-09-01', '2028-09-01', '2029-09-01', '2031-09-01']); assert.equal(i.sonrakiUs, '2027-09-01')
  assert.equal(nodulDegerlendir({ ...b, ekojenite: 'hiper_izo', boyutMm: 12 }).oneri, 'gerekmez')
  assert.equal(nodulDegerlendir({ ...b, boyutMm: 12, tsh: 0.1 }).notlar.length, 1)
})
