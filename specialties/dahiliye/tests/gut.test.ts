import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gutDegerlendir, DIYET_ONERILERI, type GutGirdi, type GutSonuc } from '../engines/gut'

const b: GutGirdi = { urik: 7.5, urikTarih: '2026-09-10', eGFR: 85, atakAktif: false, ates: false, kristalKanit: false, atakSayisi12Ay: 0, tofus: false, radyografikHasar: false, urolitiyazis: false, hf: false, dm: false, ilacMetinleri: [], bugun: '2026-09-17' }
const tumMetin = (r: GutSonuc) => [...r.kirmizi, ...r.atakSinif, ...r.ultNeden, ...r.ultMerdiven, ...r.profilaksi, ...r.ilacUyari, ...r.diyet, ...r.sevk, ...r.gorevler.map((x) => x.ad), ...r.dipnotlar.map((d) => d.not)]

test('evre sınıflaması: atak > kronik > asemptomatik > normal > belirsiz; diyet yalnız gut/hiperürisemide', () => {
  assert.equal(gutDegerlendir({ ...b, atakAktif: true }).evre, 'atak')
  assert.equal(gutDegerlendir({ ...b, urik: 5, atakSayisi12Ay: 1 }).evre, 'kronik_gut')
  assert.equal(gutDegerlendir({ ...b, urik: null, kristalKanit: true }).evre, 'kronik_gut')
  assert.equal(gutDegerlendir(b).evre, 'asemptomatik_hiperurisemi')
  const n = gutDegerlendir({ ...b, urik: 6.8 }); assert.equal(n.evre, 'normal'); assert.equal(n.ultEndikasyon, null); assert.equal(n.diyet.length, 0)
  const bel = gutDegerlendir({ ...b, urik: null }); assert.equal(bel.evre, 'belirsiz'); assert.equal(bel.ultEndikasyon, null)
  assert.deepEqual(gutDegerlendir(b).diyet, DIYET_ONERILERI); assert.ok(DIYET_ONERILERI.length >= 5 && DIYET_ONERILERI.length <= 7)
})

test('ateş + atak → septik artrit kırmızı + acil sevk; ilk atak kristalsiz → aspirasyon sevki', () => {
  const r = gutDegerlendir({ ...b, atakAktif: true, ates: true })
  assert.match(r.kirmizi[0], /septik artrit dışlanmalı/); assert.ok(r.sevk.includes('Acil / ortopedi-romatoloji: septik artrit şüphesi'))
  assert.ok(r.sevk.some((s) => /kristal kanıtı/.test(s)))
  assert.equal(gutDegerlendir({ ...b, atakAktif: true }).kirmizi.length, 0)
  assert.ok(!gutDegerlendir({ ...b, atakAktif: true, kristalKanit: true }).sevk.some((s) => /kristal kanıtı/.test(s)))
})

test('atak sınıfları: normal böbrekte üçü; eGFR 25 → NSAİİ ve kolşisin çıkar, uyarı; DM → glisemi; mevcut ULT kesilmez', () => {
  const r = gutDegerlendir({ ...b, atakAktif: true })
  assert.equal(r.atakSinif.length, 3); assert.ok(r.atakSinif.every((s) => /hekim dozu yazar/.test(s)))
  const k = gutDegerlendir({ ...b, atakAktif: true, eGFR: 25, dm: true, ilacMetinleri: ['Allopurinol tb'] })
  assert.equal(k.atakSinif.length, 1); assert.match(k.atakSinif[0], /Kortikosteroid/)
  assert.ok(k.ilacUyari.some((u) => /NSAİİ sınıfından kaçınılır: eGFR 25/.test(u)))
  assert.ok(k.ilacUyari.includes('kolşisin: ağır böbrek yetmezliğinde kaçınılır/hekim'))
  assert.ok(k.ilacUyari.some((u) => /glisemi izlemi/.test(u))); assert.ok(k.ilacUyari.some((u) => /atak sırasında kesilmez/.test(u)))
})

test('warfarin / KY → NSAİİ çıkar; klaritromisin → kolşisin etkileşimi', () => {
  const w = gutDegerlendir({ ...b, atakAktif: true, ilacMetinleri: ['Coumadin (warfarin) 5'] })
  assert.ok(!w.atakSinif.some((s) => /NSAİİ/.test(s))); assert.ok(w.ilacUyari.some((u) => /warfarin/.test(u)))
  assert.ok(!gutDegerlendir({ ...b, atakAktif: true, hf: true }).atakSinif.some((s) => /NSAİİ/.test(s)))
  assert.ok(gutDegerlendir({ ...b, atakAktif: true, ilacMetinleri: ['Klaritromisin'] }).ilacUyari.some((u) => /CYP3A4\/P-gp.*klaritromisin/.test(u)))
})

test('tofüs → güçlü ULT, hedef 5, merdiven + profilaksi + romatoloji sevki', () => {
  const r = gutDegerlendir({ ...b, tofus: true })
  assert.equal(r.ultEndikasyon, 'guclu'); assert.equal(r.hedefUrik, 5)
  assert.match(r.ultMerdiven[0], /^Allopurinol \(birinci basamak\)/); assert.ok(r.ultMerdiven.some((m) => /HLA-B\*58:01/.test(m)))
  assert.match(r.profilaksi[0], /3–6 ay/); assert.ok(r.sevk.includes('Romatoloji: tofüs/eklem hasarı'))
  assert.equal(gutDegerlendir({ ...b, atakSayisi12Ay: 2 }).hedefUrik, 6)
})

test('1 atak + eGFR 50 → koşullu, hedef 6; 1 atak ek risksiz → yok; asemptomatik 9,5 → yok', () => {
  const r = gutDegerlendir({ ...b, atakSayisi12Ay: 1, eGFR: 50 })
  assert.equal(r.ultEndikasyon, 'kosullu'); assert.equal(r.hedefUrik, 6); assert.ok(r.ultNeden.some((n) => /eGFR 50/.test(n)))
  const y = gutDegerlendir({ ...b, atakSayisi12Ay: 1 }); assert.equal(y.ultEndikasyon, 'yok'); assert.equal(y.hedefUrik, null); assert.equal(y.ultMerdiven.length, 0)
  const a = gutDegerlendir({ ...b, urik: 9.5 })
  assert.equal(a.ultEndikasyon, 'yok'); assert.match(a.ultNeden[0], /rutin önerilmez/); assert.equal(a.profilaksi.length, 0); assert.equal(a.gorevler.length, 0)
  assert.equal(gutDegerlendir({ ...b, urik: 7, atakSayisi12Ay: 1, urolitiyazis: true }).sevk[0], 'Üroloji: ürat taşı öyküsü (hekim kararı)')
})

test('tiyazid / loop diüretik uyarısı; losartan bilgisi', () => {
  const r = gutDegerlendir({ ...b, ilacMetinleri: ['Hidroklorotiyazid', 'Losartan'] })
  assert.ok(r.ilacUyari.some((u) => /hidroklorotiyazid.*ürik asiti artırabilir/.test(u)))
  assert.ok(r.ilacUyari.some((u) => /losartan/.test(u)))
  assert.ok(gutDegerlendir({ ...b, ilacMetinleri: ['furosemid'] }).ilacUyari.some((u) => /ürik asiti artırabilir/.test(u)))
})

test('görevler: kontrol bugün+1 ay; atakta ürik 6,1 → tekrar bugün+21 gün; ürik yok → ilk tetkik bugün', () => {
  const k = gutDegerlendir({ ...b, tofus: true })
  assert.deepEqual(k.gorevler, [{ kod: 'gut_urik_kontrol', ad: 'Ürik asit kontrolü (ULT titrasyonu, hedef <5 mg/dL)', due: '2026-10-17' }])
  const t = gutDegerlendir({ ...b, atakAktif: true, urik: 6.1 })
  assert.equal(t.gorevler.find((x) => x.kod === 'gut_urik_tekrar')?.due, '2026-10-08'); assert.ok(t.ultNeden.some((n) => /yalancı normal/.test(n)))
  const i = gutDegerlendir({ ...b, atakAktif: true, urik: null })
  assert.deepEqual(i.gorevler.find((x) => x.kod === 'gut_urik_ilk'), { kod: 'gut_urik_ilk', ad: 'Serum ürik asit + kreatinin', due: '2026-09-17' })
})

test('güvenlik: hiçbir çıktı metninde doz (mg/mcg/µg) yok; dipnotlar ACR/EULAR/Harrison', () => {
  const senaryolar: GutGirdi[] = [b, { ...b, tofus: true, atakAktif: true, ates: true, dm: true, eGFR: 25, ilacMetinleri: ['warfarin', 'klaritromisin', 'allopurinol', 'indapamid', 'losartan'] }, { ...b, atakSayisi12Ay: 1, urik: 9.4, urolitiyazis: true }, { ...b, atakAktif: true, urik: null }]
  for (const s of senaryolar) {
    const r = gutDegerlendir(s)
    for (const m of tumMetin(r)) assert.doesNotMatch(m, /\d+\s*(mg|mcg|µg)(?!\/dL)/i, m)
    assert.deepEqual(r.dipnotlar.map((d) => d.ref), ['ACR_GUT2020', 'EULAR_GUT2016', 'HARRISON'])
  }
})
