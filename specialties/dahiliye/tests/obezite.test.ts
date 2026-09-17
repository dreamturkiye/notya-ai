import { test } from 'node:test'
import assert from 'node:assert/strict'
import { obeziteDegerlendir, vkiHesapla, vkiSinif } from '../engines/obezite'

const t = { kiloKg: null, boyCm: 170, belCm: null, kadin: false, yas: 45, komorbidite: {}, kiloSerisi: [], farmakoterapiBaslangic: null, glp1Var: false, bugun: '2026-09-16' }

test('VKİ ve sınıflar', () => {
  assert.equal(vkiHesapla(95, 170), 32.9); assert.equal(vkiSinif(32.9), 'obez_1'); assert.equal(vkiSinif(24.9), 'normal'); assert.equal(vkiSinif(40), 'obez_3')
})

test('basamaklar: 28 + HT farmakoterapi; 28 komorbiditesiz yaşam tarzı; 36 + DM bariatrik SEVK; normal VKİ yüksek bel', () => {
  assert.equal(obeziteDegerlendir({ ...t, kiloKg: 81, komorbidite: { ht: true } }).basamak, 'farmakoterapi')
  assert.equal(obeziteDegerlendir({ ...t, kiloKg: 81 }).basamak, 'yasam_tarzi')
  const b = obeziteDegerlendir({ ...t, kiloKg: 104, komorbidite: { dm: true } })
  assert.equal(b.basamak, 'bariatrik_degerlendirme'); assert.match(b.sevk[0], /ofiste protokol yok/); assert.ok(!/mg\b/.test(JSON.stringify(b)))
  assert.match(obeziteDegerlendir({ ...t, kiloKg: 70, belCm: 105 }).plan[0], /abdominal/)
  assert.deepEqual(obeziteDegerlendir({ ...t }).plan, ['Kilo ve boy girin (VKİ)'])
})

test('3. ay yanıtı: <%5 kayıp → yeniden değerlendir; gerekçe metni SGK notu', () => {
  const r = obeziteDegerlendir({ ...t, kiloKg: 98, kiloSerisi: [{ kg: 100, tarih: '2026-05-01' }], farmakoterapiBaslangic: '2026-05-01', komorbidite: { osa: true } })
  assert.equal(r.yanit?.degisimYuzde, -2); assert.match(r.yanit!.not, /yeniden değerlendir/)
  assert.match(r.gerekceMetni, /SUT/); assert.match(r.gerekceMetni, /100 → 98/)
})
