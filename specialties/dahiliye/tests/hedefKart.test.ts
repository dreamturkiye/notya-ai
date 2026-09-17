import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hedefKarti, yazdirHtml, EGITIM_YAPRAKLARI, type HedefKartGirdi } from '../engines/hedefKart'

const bos: HedefKartGirdi = { kbHedef: null, hba1cHedef: null, ldlHedef: null, kvrKategori: null, ht: false, dm: false, statin: false, son: { kb: null, hba1c: null, ldl: null } }

test('yalnız kilitli hedefler yazılır; kilitsizse "Hekiminiz belirleyecek" + eksikKilit', () => {
  const r = hedefKarti({ ...bos, ht: true, dm: true, statin: true, son: { kb: { sbp: 142, dbp: 86, tarih: '2026-09-17' }, hba1c: { deger: 7.4, tarih: '2026-09-10' }, ldl: null } })
  assert.deepEqual(r.satirlar.map((s) => s.durum), ['hekim_belirleyecek', 'hekim_belirleyecek', 'hekim_belirleyecek'])
  assert.deepEqual(r.eksikKilit, ['KB hedefi (HT)', 'HbA1c hedefi (DM)', 'LDL hedefi (KVR)'])
  assert.deepEqual(r.yapraklar, ['yasam', 'ht', 'dm_ayak_goz', 'statin'])
})

test('kilitli hedef + son değer → hedefte / hedef dışı / ölçüm yok; KVR kategorisi hasta dilinde', () => {
  const r = hedefKarti({ ...bos, ht: true, dm: true, kbHedef: { sbpUst: 130, dbpUst: 80 }, hba1cHedef: 7, ldlHedef: 70, kvrKategori: 'cok_yuksek', son: { kb: { sbp: 128, dbp: 78, tarih: '2026-09-17' }, hba1c: { deger: 7.4, tarih: '2026-09-10' }, ldl: null } })
  const d = Object.fromEntries(r.satirlar.map((s) => [s.kod, s]))
  assert.equal(d.kb.durum, 'hedefte'); assert.equal(d.kb.hedef, '130/80 mmHg altı')
  assert.equal(d.hba1c.durum, 'hedef_disi'); assert.equal(d.hba1c.hedef, '%7 ve altı')
  assert.equal(d.ldl.durum, 'olcum_yok'); assert.equal(d.kvr.hedef, 'çok yüksek')
  assert.equal(r.eksikKilit.length, 0)
})

test('eğitim yaprakları: kısa, doz yok, kaynak ref_code taşır; yazdırma HTML kaçışlı, dipnot hastaya basılmaz', () => {
  for (const y of Object.values(EGITIM_YAPRAKLARI)) {
    const metin = y.bolumler.flatMap((b) => b.maddeler).join('\n')
    assert.ok(metin.length < 1600, y.kod); assert.ok(!/\d+\s*(mg|mcg|µg|IU|ünite|tablet)\b/i.test(metin), y.kod); assert.ok(y.dipnot.ref)
  }
  const k = hedefKarti({ ...bos, ht: true, kbHedef: { sbpUst: 140, dbpUst: 90 } })
  const html = yazdirHtml(k, k.yapraklar, { hastaAdi: '<script>x</script>', hekimAdi: 'Dr. Test', tarih: '17.09.2026' })
  assert.ok(!html.includes('<script>x')); assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(html.includes('Tansiyonumu nasıl kontrol ederim?')); assert.ok(!html.includes('HT_UZLASI2025'))
})
