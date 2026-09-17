import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gEvre, aEvre, kdigoRenk, ckdDegerlendir, nefroSevkPaketi } from '../engines/ckd'

test('KDIGO evreleme ve ısı haritası', () => {
  assert.equal(gEvre(95), 'G1'); assert.equal(gEvre(60), 'G2'); assert.equal(gEvre(50), 'G3a'); assert.equal(gEvre(35), 'G3b'); assert.equal(gEvre(20), 'G4'); assert.equal(gEvre(10), 'G5')
  assert.equal(aEvre(10), 'A1'); assert.equal(aEvre(100), 'A2'); assert.equal(aEvre(500), 'A3')
  assert.equal(kdigoRenk('G1', 'A1'), 'yesil'); assert.equal(kdigoRenk('G2', 'A2'), 'sari'); assert.equal(kdigoRenk('G3a', 'A2'), 'turuncu'); assert.equal(kdigoRenk('G3b', 'A2'), 'kirmizi'); assert.equal(kdigoRenk('G4', 'A1'), 'kirmizi')
})

test('evre yok → eGFR yoksa; sevk tetikleri; hızlı düşüş', () => {
  const base = { eGFR: 40, eGFRTarih: '2026-09-01', oncekiEGFR: [{ deger: 62, tarih: '2025-08-01' }], uacr: 120, uacrTarih: '2026-09-01', dm: true, ht: true, rasBlokeri: false, sglt2: false, nsaii: true, k: 5.7, hb: 9.5, bugun: '2026-09-16' }
  const r = ckdDegerlendir(base)
  assert.equal(r.g, 'G3b'); assert.equal(r.a, 'A2'); assert.equal(r.renk, 'kirmizi'); assert.equal(r.hizliDusus, true); assert.equal(r.kronikMi, 'olasi')
  assert.ok(r.plan.some((p) => /ACEi\/ARB/.test(p))); assert.ok(r.plan.some((p) => /SGLT2/.test(p)))
  assert.ok(r.uyarilar.some((u) => /NSAİİ/.test(u))); assert.ok(r.uyarilar.some((u) => /hiperkalemi/.test(u))); assert.ok(r.uyarilar.some((u) => /anemisi/.test(u)))
  assert.ok(r.sevk[0].includes('Nefroloji'))
  assert.equal(ckdDegerlendir({ ...base, eGFR: null }).g, null)
  const paket = nefroSevkPaketi(r, [{ ad: 'eGFR', deger: '40', tarih: '2026-09-01' }], { yas: 66, kadin: false }, ['metformin'])
  assert.match(paket, /NEFROLOJİ SEVK/); assert.match(paket, /G3b A2/)
})
