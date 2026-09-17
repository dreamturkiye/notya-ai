import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pulmDegerlendir } from '../engines/pulm'
import { giDegerlendir } from '../engines/gi'

const p = { tani: 'koah' as const, fev1Fvc: 0.58, fev1Yuzde: 45, bdFev1ArtisYuzde: 5, bdFev1ArtisMl: 80, mmrc: 2, cat: 14, ortaAlevlenme12Ay: 0, yatisliAlevlenme12Ay: 0, eozinofil: 0.35, spo2: 94, sigara: true, astimKontrol: null, oralSteroidKur12Ay: 0, ilacMetinleri: ['ventolin salbutamol'], sonSpirometri: null, bugun: '2026-09-16' }

test('KOAH: GOLD 3, grup B → LAMA+LABA; yalnız SABA uyarısı; E + eozinofil 350 → ICS; SpO2 ≤88 sevk', () => {
  const r = pulmDegerlendir(p)
  assert.equal(r.gold, 3); assert.equal(r.grup, 'B'); assert.match(r.inhalerSinifi[0], /LAMA \+ LABA/)
  assert.ok(r.uyarilar.some((u) => /kısa etkili/.test(u))); assert.ok(r.gorevler.some((g) => g.kod === 'pulm_spirometri'))
  assert.match(pulmDegerlendir({ ...p, yatisliAlevlenme12Ay: 1 }).inhalerSinifi[0], /ICS \(eozinofil 350/)
  assert.equal(pulmDegerlendir({ ...p, spo2: 87 }).sevk.length, 1)
  assert.ok(pulmDegerlendir({ ...p, fev1Fvc: 0.75 }).uyarilar.some((u) => /desteklenmiyor/.test(u)))
})

test('astım kontrol: 3/4 → kontrolsüz; SABA tek başına uyarı; ≥2 OKS sevk', () => {
  const a = pulmDegerlendir({ ...p, tani: 'astim', astimKontrol: { gunduzSemptom: true, geceUyanma: true, kurtariciIhtiyac: true, aktiviteKisit: false }, oralSteroidKur12Ay: 2 })
  assert.equal(a.astimKontrol, 'kontrolsuz'); assert.match(a.inhalerSinifi[0], /ICS-formoterol/); assert.ok(a.uyarilar.some((u) => /SABA/.test(u))); assert.equal(a.sevk.length, 1)
})

const gi = { yas: 45, alarm: {}, gerd: null, ibs: null, hp: null, masld: null, hb: 13.5, bugun: '2026-09-16' }
test('GÖRH: alarm yok → PPI 8 hafta; disfaji → endoskopi; ≥60 yaş → endoskopi', () => {
  assert.match(giDegerlendir({ ...gi, gerd: { tipikSemptom: true } }).gerd[0], /PPI sınıfı 8 hafta/)
  assert.equal(giDegerlendir({ ...gi, alarm: { disfaji: true }, gerd: { tipikSemptom: true } }).sevk.length, 1)
  assert.match(giDegerlendir({ ...gi, yas: 64, gerd: { tipikSemptom: true } }).sevk[0], /≥60/)
})
test('H. pylori: bizmutlu dörtlü 14 gün; kontrol testi ≥4 hafta ve PPI kesiminden 2 hafta sonra', () => {
  assert.match(giDegerlendir({ ...gi, hp: { test: 'pozitif', eradikasyonBitis: null, ppiKesimTarihi: null, kontrolSonuc: null } }).hp.plan[0], /bizmutlu dörtlü 14 gün/)
  const r = giDegerlendir({ ...gi, hp: { test: 'pozitif', eradikasyonBitis: '2026-09-01', ppiKesimTarihi: '2026-09-25', kontrolSonuc: null } })
  assert.equal(r.hp.kontrolTestTarihi, '2026-10-09'); assert.equal(r.hp.gorev?.due, '2026-10-09')
  assert.equal(giDegerlendir({ ...gi, hp: { test: 'pozitif', eradikasyonBitis: '2026-09-01', ppiKesimTarihi: '2026-09-01', kontrolSonuc: null } }).hp.kontrolTestTarihi, '2026-09-29')
})
test('İBS Roma IV + alarm → organik neden dışlanmadan İBS denmez; MASLD FIB-4 ortak motor', () => {
  const ibs = { karinAgrisiHaftada1Gun3Ay: true, defekasyonIliskili: true, siklikDegisimi: true, formDegisimi: false, baslangic6AyOnce: true }
  assert.equal(giDegerlendir({ ...gi, ibs }).ibs.romaIV, true); assert.equal(giDegerlendir({ ...gi, ibs }).sevk.length, 0)
  assert.match(giDegerlendir({ ...gi, yas: 55, ibs }).ibs.not, /dışlanmadan/)
  assert.equal(giDegerlendir({ ...gi, masld: { alt: 36, ast: 40, plt: 200 }, yas: 60 }).masld.skor, 2)
})
