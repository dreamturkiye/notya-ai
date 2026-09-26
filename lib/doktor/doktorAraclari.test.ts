import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  doktorAraclariListesi,
  doktorAraciBransaUygun,
  ORTAK_DOKTOR_ARACLARI,
  BRANS_DOKTOR_ARACLARI,
  TUM_DOKTOR_ARACLARI,
} from './doktorAraclari'
import { BRANS_ETIKETLERI } from '../intake/bransSorulari'

test('shared tools appear for every branş; chapter tiles do not cross-leak', () => {
  const goz = doktorAraclariListesi('goz-hastaliklari')
  const kd = doktorAraclariListesi('kadin-dogum')
  const dah = doktorAraclariListesi('dahiliye')
  const ped = doktorAraclariListesi('pediatri')

  for (const o of ORTAK_DOKTOR_ARACLARI) {
    assert.ok(goz.some((a) => a.route === o.route), `göz missing shared ${o.route}`)
    assert.ok(kd.some((a) => a.route === o.route), `KD missing shared ${o.route}`)
    assert.ok(dah.some((a) => a.route === o.route), `dahiliye missing shared ${o.route}`)
    assert.ok(ped.some((a) => a.route === o.route), `pediatri missing shared ${o.route}`)
  }

  assert.equal(goz.length, ORTAK_DOKTOR_ARACLARI.length + GOZ_ROTALARI.length)
  assert.equal(kd.length, ORTAK_DOKTOR_ARACLARI.length + KD_ROTALARI.length)
  assert.equal(dah.length, ORTAK_DOKTOR_ARACLARI.length + DAH_ROTALARI.length)
  assert.ok(!goz.some((a) => a.route.includes('dahiliye') || a.route.includes('hedef-boy')))
  assert.ok(!kd.some((a) => a.route.includes('dahiliye') || a.route.includes('hedef-boy')))

  for (const r of DAH_ROTALARI) assert.ok(dah.some((a) => a.route === r), `dahiliye missing ${r}`)
  assert.ok(!dah.some((a) => a.route.includes('hedef-boy')))
  assert.ok(ped.some((a) => a.route === '/doktor-tools/hedef-boy'))
  assert.ok(!ped.some((a) => a.route.includes('dahiliye')))
})

// DAH-EXCEPTIONAL-01 — dahiliye-only Araçlar (same shape as the göz / derm blocks below).
const DAH_ROTALARI = [
  '/doktor-tools/dahiliye-kohort',
  '/doktor-tools/dahiliye-score2',
  '/doktor-tools/dahiliye-ckd',
  '/doktor-tools/dahiliye-sgk',
  '/doktor-tools/dahiliye-polifarmasi',
  '/doktor-tools/dahiliye-antikoag',
]

test('dahiliye-only Araçlar: dahiliye sees all six; pediatri / kardiyoloji / göz / KD / derm and 25 others never', () => {
  for (const ham of ['dahiliye', 'İç Hastalıkları']) {
    const dah = doktorAraclariListesi(ham)
    for (const r of DAH_ROTALARI) {
      assert.ok(dah.some((a) => a.route === r), `${ham} missing ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
    assert.equal(dah.length, ORTAK_DOKTOR_ARACLARI.length + DAH_ROTALARI.length)
  }
  for (const r of DAH_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.ok(arac, `${r} not in BRANS_DOKTOR_ARACLARI`)
    assert.deepEqual(arac.branslar, ['dahiliye'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'dahiliye')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'kardiyoloji', 'goz-hastaliklari', 'kadin-dogum', 'dermatoloji', 'Çocuk Sağlığı ve Hastalıkları', 'Kadın Hastalıkları ve Doğum', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of DAH_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  // dahiliye does not see other chapters' tiles
  const dah = doktorAraclariListesi('dahiliye')
  assert.ok(!dah.some((a) => a.branslar && !a.branslar.includes('dahiliye')))
})

test('dahiliye studio pages: guarded by DahiliyeAracKabugu, card-opened, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/dahiliye/ui/araclar/DahiliyeAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /router\.replace\('\/doktor-tools'\)/)
  assert.match(kabuk, /Bu araç yalnızca dahiliye için\./)
  for (const r of DAH_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /DahiliyeAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /Score2Araci|CkdAraci|SgkRaporAraci|PolifarmasiAraci|AntikoagAraci|KohortPanel/)
})

const GOZ_ROTALARI = ['/doktor-tools/goz-va', '/doktor-tools/goz-sut-vegf', '/doktor-tools/goz-sgk-rapor', '/doktor-tools/goz-gil-kod', '/doktor-tools/goz-kohort']

test('göz-only Araçlar: göz sees all five; pediatri / dahiliye / kardiyoloji / KD / derm and 25 others never', () => {
  const goz = doktorAraclariListesi('goz-hastaliklari')
  for (const r of GOZ_ROTALARI) {
    assert.ok(goz.some((a) => a.route === r), `göz missing ${r}`)
    assert.equal(doktorAraciBransaUygun(r, 'goz-hastaliklari'), true, r)
    assert.equal(doktorAraciBransaUygun(r, 'Göz Hastalıkları'), true, r)
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.deepEqual(arac.branslar, ['goz-hastaliklari'], r)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'goz-hastaliklari')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'kardiyoloji', 'kadin-dogum', 'dermatoloji', 'İç Hastalıkları', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of GOZ_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  // göz does not see other chapters' tiles
  assert.ok(!goz.some((a) => a.route === '/doktor-tools/hedef-boy' || a.route === '/doktor-tools/dahiliye-kohort'))
})

const DERM_ROTALARI = ['/doktor-tools/derm-pasi', '/doktor-tools/derm-gop', '/doktor-tools/derm-fototerapi', '/doktor-tools/derm-yama', '/doktor-tools/derm-kohort']

test('dermatoloji-only Araçlar: derm sees all five; pediatri / dahiliye / kardiyoloji / göz / KD and 25 others never', () => {
  const derm = doktorAraclariListesi('dermatoloji')
  for (const r of DERM_ROTALARI) {
    assert.ok(derm.some((a) => a.route === r), `dermatoloji missing ${r}`)
    assert.equal(doktorAraciBransaUygun(r, 'dermatoloji'), true, r)
    assert.equal(doktorAraciBransaUygun(r, 'Deri ve Zührevi Hastalıkları'), true, r)
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.deepEqual(arac.branslar, ['dermatoloji'], r)
  }
  assert.equal(derm.length, ORTAK_DOKTOR_ARACLARI.length + DERM_ROTALARI.length)
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'dermatoloji')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'kardiyoloji', 'kadin-dogum', 'goz-hastaliklari', 'İç Hastalıkları', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of DERM_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  // dermatoloji does not see other chapters' tiles
  assert.ok(!derm.some((a) => GOZ_ROTALARI.includes(a.route) || a.route === '/doktor-tools/hedef-boy' || a.route === '/doktor-tools/dahiliye-kohort'))
})

test('dermatoloji studio pages: guarded, card-opened, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/dermatoloji/ui/araclar/DermAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /router\.replace\('\/doktor-tools'\)/)
  for (const r of DERM_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /DermAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /PasiEasiAraci|GopKapiAraci|FototerapiDefteriAraci|YamaAraci|DermKohortPaneli/)
})

test('göz studio pages: guarded, card-opened, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/goz-hastaliklari/ui/araclar/GozAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /router\.replace\('\/doktor-tools'\)/)
  for (const r of GOZ_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /GozAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /VaAraci|SutVegfAraci|SgkRaporAraci|GilKodAraci|GozKohortPaneli|goz-exceptional-audit/)
})

test('tetkik print paper matches the prescription letterhead, not a ministry claim', () => {
  const sayfa = fs.readFileSync(path.join(import.meta.dirname, '../../app/doktor-tools/tetkik/page.tsx'), 'utf8')
  assert.match(sayfa, /\/api\/doktor\/recete-baslik/)
  assert.match(sayfa, /Diploma No/)
  assert.match(sayfa, /Kaşe \/ İmza/)
  assert.match(sayfa, /hekimUnvanli/)
  assert.doesNotMatch(sayfa, /T\.C\. SAĞLIK BAKANLIĞI|T\.C\. Sağlık Bakanlığı resmi/)
})

test('commercial grid: no internal audits, sprint jargon, or named beta-doctor copy', () => {
  const blob = TUM_DOKTOR_ARACLARI.map((a) => `${a.title} ${a.desc} ${a.route}`).join('\n')
  assert.doesNotMatch(blob, /audit|presprint|post-sprint|pre-sprint|wow|JINE-|Gökhan|Gokhan|Gaps \+|sprint/i)
  assert.doesNotMatch(blob, /\.html/)
  for (const a of BRANS_DOKTOR_ARACLARI) {
    assert.ok(a.route.startsWith('/doktor-tools/'), `chapter tile must be an app route: ${a.route}`)
    assert.ok(a.branslar && a.branslar.length > 0, a.route)
  }
})

test('free-text users.specialty resolves for chapter araçlar', () => {
  assert.ok(doktorAraclariListesi('İç Hastalıkları').some((a) => a.route === '/doktor-tools/dahiliye-kohort'))
  assert.ok(doktorAraclariListesi('Çocuk Sağlığı ve Hastalıkları').some((a) => a.route === '/doktor-tools/hedef-boy'))
  assert.ok(!doktorAraclariListesi('Kadın Hastalıkları ve Doğum').some((a) => a.route.includes('hedef-boy') || a.route.includes('dahiliye')))
})

test('deep-link guard: chapter tools only for owning branş', () => {
  assert.equal(doktorAraciBransaUygun('/doktor-tools/dahiliye-kohort', 'dahiliye'), true)
  assert.equal(doktorAraciBransaUygun('/doktor-tools/dahiliye-kohort', 'pediatri'), false)
  assert.equal(doktorAraciBransaUygun('/doktor-tools/hedef-boy', 'pediatri'), true)
  assert.equal(doktorAraciBransaUygun('/doktor-tools/hedef-boy', 'dahiliye'), false)
  assert.equal(doktorAraciBransaUygun('/doktor-tools/erecete', 'goz-hastaliklari'), true)
})

test('Hedef Boy is pediatri-only — never kardiyoloji / göz / KD / dahiliye', () => {
  for (const b of ['kardiyoloji', 'goz-hastaliklari', 'kadin-dogum', 'dahiliye', 'ortopedi', 'aile-hekimligi']) {
    assert.ok(
      !doktorAraclariListesi(b).some((a) => a.route === '/doktor-tools/hedef-boy'),
      `${b} must not see Hedef Boy`,
    )
    assert.equal(doktorAraciBransaUygun('/doktor-tools/hedef-boy', b), false, b)
  }
  assert.ok(doktorAraclariListesi('pediatri').some((a) => a.route === '/doktor-tools/hedef-boy'))
  assert.equal(doktorAraciBransaUygun('/doktor-tools/hedef-boy', 'pediatri'), true)
})

test('Araçlar landing is a card grid only — Hedef Boy opens as its own page', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const page = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const catalog = fs.readFileSync(path.join(kok, 'lib/doktor/doktorAraclari.ts'), 'utf8')
  const hedef = fs.readFileSync(path.join(kok, 'app/doktor-tools/hedef-boy/page.tsx'), 'utf8')
  assert.match(page, /doktorAraclariListesi/)
  assert.doesNotMatch(page, /HedefBoyAracPaneli|usePediatriHedefBoy/)
  assert.match(catalog, /\/doktor-tools\/hedef-boy/)
  assert.match(hedef, /HedefBoyAracPaneli/)
  assert.doesNotMatch(catalog, /presprint-audit|post-sprint-audit|gaps-audit|\.html/)
  assert.doesNotMatch(catalog, /Gökhan|Gokhan/)
})

// PEDI-ARACLAR-01 / -02 — pediatri-only Araçlar (same shape as the göz block above). Pediatri sees all five studios.
const PEDI_YENI_ROTALAR = ['/doktor-tools/pedi-asi', '/doktor-tools/pedi-gelisim', '/doktor-tools/pedi-kohort']
const PEDI_ROTALAR = ['/doktor-tools/pedi-buyume', '/doktor-tools/pedi-doz', ...PEDI_YENI_ROTALAR]

test('pediatri-only Araçlar: pediatri sees all; dahiliye / kardiyoloji / göz / KD / derm and every other branş never', () => {
  for (const b of ['pediatri', 'Çocuk Sağlığı ve Hastalıkları']) {
    const ped = doktorAraclariListesi(b)
    for (const r of [...PEDI_ROTALAR, '/doktor-tools/hedef-boy']) {
      assert.ok(ped.some((a) => a.route === r), `${b} missing ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), true, `${b} ${r}`)
    }
  }
  for (const r of PEDI_ROTALAR) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.ok(arac, `${r} not in BRANS_DOKTOR_ARACLARI`)
    assert.deepEqual(arac.branslar, ['pediatri'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'pediatri')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'dahiliye', 'kardiyoloji', 'goz-hastaliklari', 'kadin-dogum', 'dermatoloji', 'İç Hastalıkları', 'Kadın Hastalıkları ve Doğum', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of PEDI_ROTALAR) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  // pediatri does not see other chapters' tiles
  const ped = doktorAraclariListesi('pediatri')
  assert.ok(!ped.some((a) => a.route.startsWith('/doktor-tools/goz-') || a.route === '/doktor-tools/dahiliye-kohort'))
  assert.equal(ped.length, ORTAK_DOKTOR_ARACLARI.length + 1 + PEDI_ROTALAR.length)
})

test('pediatri studio pages: guarded by PediAracKabugu, card-opened, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/pediatri/ui/araclar/PediAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /router\.replace\('\/doktor-tools'\)/)
  for (const r of PEDI_ROTALAR) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /PediAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /PediAracKabugu|BuyumeStudyosu|DozAraci|AsiPlanlayici|GelisimPaneli|PediKohortPaneli/)
})

test('PEDI-ARACLAR-02: aşı / gelişim / kohort — pediatri tek anahtar; 30/30 döngüde her yabancı branş görmez ve derin linki reddedilir', () => {
  assert.equal(PEDI_ROTALAR.length, 5)
  const ped = doktorAraclariListesi('pediatri')
  for (const r of PEDI_ROTALAR) assert.ok(ped.some((a) => a.route === r), `pediatri beşini de görmeli: ${r}`)
  for (const r of PEDI_YENI_ROTALAR) {
    const arac = TUM_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['pediatri'], `${r} yalnız pediatri anahtarını taşımalı`)
    // ticari metin: sprint id / kişi adı / audit bağlantısı yok
    assert.doesNotMatch(`${arac.title} ${arac.desc}`, /PEDI-|ARACLAR|sprint|audit|Gökhan|Gokhan|Kaan|\.html/i, r)
  }
  const anahtarlar = Object.keys(BRANS_ETIKETLERI)
  assert.ok(anahtarlar.includes('pediatri'))
  for (const b of anahtarlar) {
    if (b === 'pediatri') continue
    const liste = doktorAraclariListesi(b)
    for (const r of PEDI_YENI_ROTALAR) {
      assert.ok(!liste.some((a) => a.route === r), `${b} ${r} görmemeli`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} ${r} derin linki reddedilmeli`)
    }
  }
  // Adıyla: dahiliye, kardiyoloji, göz, KD (kanonik + eski + serbest metin), dermatoloji, branşsız.
  for (const b of ['dahiliye', 'İç Hastalıkları', 'kardiyoloji', 'goz-hastaliklari', 'kadin-hastaliklari-dogum', 'kadin-dogum', 'Kadın Hastalıkları ve Doğum', 'dermatoloji', 'aile-hekimligi', null, '']) {
    for (const r of PEDI_YENI_ROTALAR) {
      assert.ok(!doktorAraclariListesi(b).some((a) => a.route === r), `${b} ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} ${r}`)
    }
  }
})

// ─── Kadın Hastalıkları ve Doğum — specialty-only Araçlar ───────────────────────────────────────
const KD_ROTALARI = ['/doktor-tools/kd-gebelik-takvim', '/doktor-tools/kd-dogum-rapor', '/doktor-tools/kd-mec', '/doktor-tools/kd-risk', '/doktor-tools/kd-kohort']

test('KD-only Araçlar: KD sees all five (legacy + free-text keys); every other branş in BRANS_ETIKETLERI never', () => {
  for (const ham of ['kadin-hastaliklari-dogum', 'kadin-dogum', 'Kadın Hastalıkları ve Doğum', 'Jinekoloji ve Obstetrik']) {
    const kd = doktorAraclariListesi(ham)
    for (const r of KD_ROTALARI) {
      assert.ok(kd.some((a) => a.route === r), `${ham} missing ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of KD_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.deepEqual(arac.branslar, ['kadin-hastaliklari-dogum'], r)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'kadin-hastaliklari-dogum')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'kardiyoloji', 'goz-hastaliklari', 'dermatoloji', 'Çocuk Sağlığı ve Hastalıkları', 'İç Hastalıkları', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of KD_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  // KD does not see other chapters' tiles
  const kd = doktorAraclariListesi('kadin-hastaliklari-dogum')
  assert.ok(!kd.some((a) => a.branslar && !a.branslar.includes('kadin-hastaliklari-dogum')))
})

test('KD studio pages: guarded, card-opened, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/kadin-dogum/ui/araclar/KdAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /router\.replace\('\/doktor-tools'\)/)
  for (const r of KD_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /KdAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /GebelikTakvimAraci|DogumRaporAraci|MecAraci|RiskAraci|KdKohortPaneli/)
})

// ─── PSIK-EXCEPTIONAL-01 — Psikiyatri (Ruh Sağlığı ve Hastalıkları) specialty-only Araçlar ──────
const PSIK_ROTALARI = [
  '/doktor-tools/psik-phq-gad',
  '/doktor-tools/psik-risk',
  '/doktor-tools/psik-ilac-izlem',
  '/doktor-tools/psik-sgk',
  '/doktor-tools/psik-kohort',
]

test('psikiyatri-only Araçlar: psikiyatri sees all five (canonical + official title); 25+ foreign branşlar never', () => {
  for (const ham of ['psikiyatri', 'Psikiyatri', 'Ruh Sağlığı ve Hastalıkları', 'Psikiyatri Uzmanı']) {
    const psik = doktorAraclariListesi(ham)
    for (const r of PSIK_ROTALARI) {
      assert.ok(psik.some((a) => a.route === r), `${ham} missing ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
    assert.equal(psik.length, ORTAK_DOKTOR_ARACLARI.length + PSIK_ROTALARI.length)
  }
  for (const r of PSIK_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.ok(arac, `${r} not in BRANS_DOKTOR_ARACLARI`)
    assert.deepEqual(arac.branslar, ['psikiyatri'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'psikiyatri')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'kardiyoloji', 'goz-hastaliklari', 'kadin-dogum', 'dermatoloji', 'İç Hastalıkları', 'Çocuk Sağlığı ve Hastalıkları', 'Kadın Hastalıkları ve Doğum', 'noroloji', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of PSIK_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  // psikiyatri does not see other chapters' tiles (Hedef Boy, dahiliye, göz, derm, KD)
  const psik = doktorAraclariListesi('psikiyatri')
  assert.ok(!psik.some((a) => a.branslar && !a.branslar.includes('psikiyatri')))
  assert.ok(!psik.some((a) => a.route === '/doktor-tools/hedef-boy' || a.route === '/doktor-tools/dahiliye-kohort'))
  assert.ok(!psik.some((a) => GOZ_ROTALARI.includes(a.route) || DERM_ROTALARI.includes(a.route) || KD_ROTALARI.includes(a.route)))
})

test('psikiyatri studio pages: guarded by PsikAracKabugu, card-opened, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/psikiyatri/ui/araclar/PsikAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /router\.replace\('\/doktor-tools'\)/)
  assert.match(kabuk, /Bu araç yalnızca psikiyatri için\./)
  assert.match(kabuk, /Araçlar · Psikiyatri/)
  for (const r of PSIK_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /PsikAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /PhqGadAraci|PsikSgkAraci|IlacIzlemAraci|PsikKohortAraci|PsikAracKabugu|psik-exceptional-audit/)
})

test('psikiyatri tiles stay commercial: no dose, no diagnosis claim, no locked-ward copy', () => {
  for (const r of PSIK_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanısı konur|zorla yatış|kapalı servis/i, r)
    assert.doesNotMatch(blob, /PSIK-|sprint|audit|\.html/i, r)
  }
})

// ARACLAR-CILA-01 Faz 4 — iki YENİ evrensel araç. Evrensel = branslar null = HER branş görür.
const YENI_EVRENSEL = ['/doktor-tools/muayene-sonu', '/doktor-tools/sablonlarim']

test('ARACLAR-CILA-01 Faz 4: muayene sonu paketi ve sık kullandıklarım evrenseldir — her branş görür', () => {
  for (const r of YENI_EVRENSEL) {
    const arac = ORTAK_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.ok(arac, `${r} ORTAK_DOKTOR_ARACLARI'nda olmalı`)
    assert.equal(arac.branslar, null, `${r} evrensel olmalı (branslar: null)`)
    assert.ok(!BRANS_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} branş aracı olmamalı`)
  }
  // 30/30: BRANS_ETIKETLERI'ndeki her branş + branşsız + serbest metin adlar
  const anahtarlar = Object.keys(BRANS_ETIKETLERI)
  assert.ok(anahtarlar.length >= 26)
  for (const b of [...anahtarlar, 'İç Hastalıkları', 'Çocuk Sağlığı ve Hastalıkları', 'Kadın Hastalıkları ve Doğum', 'Deri ve Zührevi Hastalıkları', 'Göz Hastalıkları', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of YENI_EVRENSEL) {
      assert.ok(liste.some((a) => a.route === r), `${b} evrensel aracı görmeli: ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), true, `${b} derin linki açabilmeli: ${r}`)
    }
  }
})

test('ARACLAR-CILA-01 Faz 4: yeni evrensel sayfalar ortak kabukla korunur, ticari metin taşır', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  for (const r of YENI_EVRENSEL) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /OrtakAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} kendi rotasını bildirir`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  // Araçlar açılış sayfası yalnız kart ızgarasıdır — araçlar kendi sayfasında açılır.
  assert.doesNotMatch(landing, /MuayeneSonuPaketi|Sablonlarim/)
  const kabuk = fs.readFileSync(path.join(kok, 'lib/doktor/aracUi.tsx'), 'utf8')
  assert.match(kabuk, /export function OrtakAracKabugu\(/)
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /router\.replace\('\/doktor-tools'\)/)
})

test('ARACLAR-CILA-01 Faz 4: muayene sonu MEVCUT rotaları bağlar, yeniden yazmaz', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const ui = fs.readFileSync(path.join(kok, 'components/doktor/araclar/MuayeneSonuPaketi.tsx'), 'utf8')
  for (const yol of ['/doktor-tools/erecete', '/doktor-tools/sgk-rapor', '/dashboard/doktor/randevular', '/doktor-tools/hasta-portali', '/doktor-tools/sgk-medula']) {
    assert.ok(ui.includes(yol), `muayene sonu paketi ${yol} rotasına bağlanmalı`)
  }
  // Kendi reçetesini / raporunu / randevusunu yazmaz: yazma isteği yok, yalnız nota ekleme ortak yoldan.
  assert.doesNotMatch(ui, /method: 'POST'/, 'kapanış paketi kendi yazma isteğini açmaz')
  assert.match(ui, /<MuayeneFormunaEkle/)
  assert.match(ui, /TaslakNotu/)
})

test('ARACLAR-CILA-01 Faz 4: şablonlar hekime özeldir ve Notya doz / ilaç önermez', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const rota = fs.readFileSync(path.join(kok, 'app/api/doktor/araclar/sablonlarim/route.ts'), 'utf8')
  // DOKTOR-IZOLASYON: her okuma/yazma doctor_id ile daraltılır; hasta verisi yok.
  for (const parca of ["eq('doctor_id', user.id)"]) assert.ok(rota.includes(parca), `sablonlarim: ${parca}`)
  const sorgu = (rota.match(/from\('doktor_sablonlari'\)/g) || []).length
  const daralma = (rota.match(/eq\('doctor_id', user\.id\)/g) || []).length + (rota.match(/doctor_id: user\.id/g) || []).length
  assert.equal(sorgu, daralma, 'her doktor_sablonlari sorgusu doctor_id ile daraltılmalı (okumada .eq, yazmada satırın kendisi)')
  const rotaKod = rota.split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*\*)/.test(l)).join('\n')
  assert.doesNotMatch(rotaKod, /patient_id|patientId|from\('patients'\)/, 'şablon rotası hasta verisine dokunmaz')

  const ui = fs.readFileSync(path.join(kok, 'components/doktor/araclar/Sablonlarim.tsx'), 'utf8')
  const yardimci = fs.readFileSync(path.join(kok, 'lib/doktor/sablonlar.ts'), 'utf8')
  // Hazır şablon / ilaç adı / doz tohumlanmaz — içerik hekimin kendi yazdığıdır (doz kilidi).
  const kaynak = `${ui}\n${yardimci}\n${rota}`.toLocaleLowerCase('tr-TR')
  for (const ad of ['parasetamol', 'ibuprofen', 'amoksisilin', 'klavulan', 'azitromisin', 'setirizin', 'prednizolon', 'salbutamol', 'metformin', 'ramipril']) {
    assert.ok(!kaynak.includes(ad), `şablon aracı "${ad}" içeriyor — Notya ilaç önermez`)
  }
  assert.doesNotMatch(kaynak, /\d+\s*mg\b/, 'şablon aracında doz metni olmaz')
  assert.match(ui, /Notya hazır şablon, ilaç ya da doz önermez/)
  assert.match(ui, /const BOS = \{ ad: '', tani: '', receteTaslagi: '', kontrolAraligi: '', notlar: '' \}/, 'form boş başlar')

  const migrasyon = fs.readFileSync(path.join(kok, 'lib/db/migrations/056_doktor_sablonlari.sql'), 'utf8')
  assert.match(migrasyon, /create table if not exists doktor_sablonlari/)
  assert.match(migrasyon, /alter table doktor_sablonlari enable row level security/)
  assert.match(migrasyon, /doctor_id = auth\.uid\(\)/)
  assert.doesNotMatch(migrasyon, /drop table|alter column|delete from/i, 'migration yalnız ekleme yapar')
})

// ─── KBB-EXCEPTIONAL-01 — Kulak Burun Boğaz specialty-only Araçlar ─────────────────────────────
const KBB_ROTALARI = [
  '/doktor-tools/kbb-otoskopi',
  '/doktor-tools/kbb-odyometri',
  '/doktor-tools/kbb-vertigo',
  '/doktor-tools/kbb-sgk',
  '/doktor-tools/kbb-kohort',
]

test('KBB-only Araçlar: kulak burun boğaz sees all five (canonical + alias + official title); 25+ foreign branşlar never', () => {
  for (const ham of ['kulak-burun-bogaz', 'kbb', 'KBB', 'Kulak Burun Boğaz Hastalıkları', 'Kulak Burun Boğaz']) {
    const kbb = doktorAraclariListesi(ham)
    for (const r of KBB_ROTALARI) {
      assert.ok(kbb.some((a) => a.route === r), `${ham} missing ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
    assert.equal(kbb.length, ORTAK_DOKTOR_ARACLARI.length + KBB_ROTALARI.length)
  }
  for (const r of KBB_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.ok(arac, `${r} not in BRANS_DOKTOR_ARACLARI`)
    assert.deepEqual(arac.branslar, ['kulak-burun-bogaz'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'kulak-burun-bogaz')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'kardiyoloji', 'goz-hastaliklari', 'kadin-dogum', 'dermatoloji', 'psikiyatri', 'İç Hastalıkları', 'Çocuk Sağlığı ve Hastalıkları', 'Kadın Hastalıkları ve Doğum', 'noroloji', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of KBB_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  // KBB does not see other chapters' tiles (Hedef Boy, dahiliye, göz, derm, KD, psikiyatri)
  const kbb = doktorAraclariListesi('kulak-burun-bogaz')
  assert.ok(!kbb.some((a) => a.branslar && !a.branslar.includes('kulak-burun-bogaz')))
  assert.ok(!kbb.some((a) => a.route === '/doktor-tools/hedef-boy' || a.route === '/doktor-tools/dahiliye-kohort'))
  assert.ok(!kbb.some((a) => GOZ_ROTALARI.includes(a.route) || DERM_ROTALARI.includes(a.route) || KD_ROTALARI.includes(a.route) || PSIK_ROTALARI.includes(a.route)))
})

test('KBB studio pages: guarded by KbbAracKabugu, card-opened, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/kulak-burun-bogaz/ui/araclar/KbbAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /router\.replace\('\/doktor-tools'\)/)
  assert.match(kabuk, /Bu araç yalnızca kulak burun boğaz için\./)
  assert.match(kabuk, /Araçlar · KBB/)
  for (const r of KBB_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /KbbAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /KbbOtoskopiAraci|KbbOdyometriAraci|KbbVertigoAraci|KbbSgkAraci|KbbKohortAraci|KbbAracKabugu|kbb-exceptional-audit/)
})

test('KBB tiles stay commercial: no dose, no diagnosis claim, no surgery/OR copy', () => {
  for (const r of KBB_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanısı konur|ameliyat planla|ameliyathane/i, r)
    assert.doesNotMatch(blob, /KBB-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// KONSULTASYON-02 (Kaan 2026-09-19, seçenek #1) — "yanıt gelmedi" takibi kohort paneli olmayan branşlara da ulaşsın:
// Bekleyen Konsültasyonlar EVRENSEL (ORTAK_…, branslar: null). 23 ayrı kohort paneli yerine tek araç.
const BEKLEYEN_KONSULTASYONLAR = '/doktor-tools/bekleyen-konsultasyonlar'
const KOHORT_PANELI_OLAN_BRANSLAR = [
  'dahiliye',
  'goz-hastaliklari',
  'dermatoloji',
  'kadin-hastaliklari-dogum',
  'pediatri',
  'psikiyatri',
  'kulak-burun-bogaz',
  'kardiyoloji',
  'gogus-hastaliklari',
  'noroloji',
  'uroloji',
  'ortopedi',
  'fizik-tedavi',
  'aile-hekimligi',
  'spor-hekimligi',
  'endokrinoloji',
  'gastroenteroloji',
  'nefroloji',
  'romatoloji',
  'enfeksiyon-hastaliklari',
  'onkoloji',
  'genel-cerrahi',
  'plastik-cerrahi',
  'gogus-cerrahisi',
  'beyin-cerrahisi',
  'cocuk-cerrahisi',
  'anestezi',
  'acil-tip',
  'radyoloji',
  'kalp-damar-cerrahisi',
]

test('Bekleyen Konsültasyonlar evrensel: BRANS_ETIKETLERI\'ndeki HER branş görür ve derin linki açar (kohortlu + kohortsuz hepsi)', () => {
  const arac = ORTAK_DOKTOR_ARACLARI.find((a) => a.route === BEKLEYEN_KONSULTASYONLAR)
  assert.ok(arac, 'ORTAK_DOKTOR_ARACLARI içinde olmalı')
  assert.equal(arac.branslar, null)
  assert.ok(!BRANS_DOKTOR_ARACLARI.some((a) => a.route === BEKLEYEN_KONSULTASYONLAR), 'branşa özel listeye eklenmemeli')
  assert.equal(TUM_DOKTOR_ARACLARI.filter((a) => a.route === BEKLEYEN_KONSULTASYONLAR).length, 1)

  const anahtarlar = Object.keys(BRANS_ETIKETLERI)
  assert.ok(anahtarlar.length >= 25)
  for (const k of KOHORT_PANELI_OLAN_BRANSLAR) assert.ok(anahtarlar.includes(k), `${k} BRANS_ETIKETLERI'nde`)
  const kohortsuz = anahtarlar.filter((b) => !doktorAraclariListesi(b).some((a) => a.route.endsWith('-kohort')))
  // Wave-5: acil / anestezi / radyoloji / kalp-damar hepsi kohort taşıyor — kohortsuz boş kalır.
  assert.deepEqual(kohortsuz.sort(), [].sort())
  for (const b of [...anahtarlar, ...Object.values(BRANS_ETIKETLERI), ...KOHORT_PANELI_OLAN_BRANSLAR, 'kadin-dogum', 'İç Hastalıkları', 'Çocuk Sağlığı ve Hastalıkları']) {
    assert.ok(doktorAraclariListesi(b).some((a) => a.route === BEKLEYEN_KONSULTASYONLAR), `${b} Bekleyen Konsültasyonlar'ı görmeli`)
    assert.equal(doktorAraciBransaUygun(BEKLEYEN_KONSULTASYONLAR, b), true, `${b} derin link`)
  }
  // Branşı henüz tanımlanmamış hekim de kendi bekleyenlerini izler (evrensel omurga).
  assert.ok(doktorAraclariListesi(null).some((a) => a.route === BEKLEYEN_KONSULTASYONLAR))
})

test('Bekleyen Konsültasyonlar sayfası: OrtakAracKabugu + kendi rotası, ticari metin, landing yalnız kart', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const sayfa = fs.readFileSync(path.join(kok, `app${BEKLEYEN_KONSULTASYONLAR}/page.tsx`), 'utf8')
  assert.match(sayfa, /OrtakAracKabugu/)
  assert.ok(sayfa.includes(`route="${BEKLEYEN_KONSULTASYONLAR}"`))
  assert.doesNotMatch(sayfa.replace(/^\/\*\*.*\*\/$/m, ''), /audit|sprint|Gökhan|Gokhan|KONSULTASYON-0\d|\.html/i) // baş yorum hariç: hekime görünen metin
  assert.doesNotMatch(sayfa, /HastaSecici/, 'hekim düzeyinde liste — hasta seçici yok')
  const arac = ORTAK_DOKTOR_ARACLARI.find((a) => a.route === BEKLEYEN_KONSULTASYONLAR)!
  assert.doesNotMatch(`${arac.title} ${arac.desc}`, /KONSULTASYON|sevk|Kaan|denetim/i)
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  assert.doesNotMatch(landing, /BekleyenKonsultasyonlar/)
})

// ─── KARDIO-EXCEPTIONAL-01 — Kardiyoloji specialty-only Araçlar ─────────────────────────────
const KARDIO_ROTALARI = [
  '/doktor-tools/kardio-score2',
  '/doktor-tools/kardio-ht-kky',
  '/doktor-tools/kardio-sgk',
  '/doktor-tools/kardio-kohort',
]

test('kardiyoloji-only Araçlar: kardiyoloji sees all four; 25+ foreign branşlar never', () => {
  for (const ham of ['kardiyoloji', 'Kardiyoloji', 'Kardiyoloji Uzmanı']) {
    const g = doktorAraclariListesi(ham)
    for (const r of KARDIO_ROTALARI) assert.ok(g.some((a) => a.route === r), `${ham} missing ${r}`)
  }
  for (const r of KARDIO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.deepEqual(arac.branslar, ['kardiyoloji'], r)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'kardiyoloji')
  for (const b of [...yabanci, 'dahiliye', 'pediatri', 'kalp-damar-cerrahisi', 'gogus-hastaliklari', 'İç Hastalıkları', null, '']) {
    const g = doktorAraclariListesi(b as string | null)
    for (const r of KARDIO_ROTALARI) assert.ok(!g.some((a) => a.route === r), `${b} must not see ${r}`)
  }
  const kard = doktorAraclariListesi('kardiyoloji')
  assert.ok(!kard.some((a) => a.branslar && !a.branslar.includes('kardiyoloji')))
})

test('kardiyoloji studio pages: guarded by KardioAracKabugu, card-opened, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/kardiyoloji/ui/araclar/KardioAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca kardiyoloji için\./)
  for (const r of KARDIO_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /KardioAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
  }
  assert.doesNotMatch(landing, /KardioScore2Araci|KardioHtKkyAraci|KardioSgkAraci|KardioKohortAraci|KardioAracKabugu|kardio-exceptional-audit/)
})

test('kardiyoloji tiles stay commercial: no dose, no cath-lab copy, no audit jargon', () => {
  for (const r of KARDIO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması/i, r)
    assert.doesNotMatch(blob, /cath lab|ameliyathane|tanı koy|Medula e-imza/i, r)
    assert.doesNotMatch(blob, /KARDIO-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── GOGUS-EXCEPTIONAL-01 — Göğüs Hastalıkları specialty-only Araçlar ─────────────────────────
const GOGUS_ROTALARI = [
  '/doktor-tools/gogus-cat-mmrc',
  '/doktor-tools/gogus-aksiyon-plani',
  '/doktor-tools/gogus-inhaler',
  '/doktor-tools/gogus-sgk',
  '/doktor-tools/gogus-kohort',
]

test('GOGUS-only Araçlar: gogus-hastaliklari sees all five; gogus-cerrahisi and 25+ foreign branşlar never', () => {
  for (const ham of ['gogus-hastaliklari', 'Göğüs Hastalıkları', 'Göğüs Hastalıkları Uzmanı']) {
    const g = doktorAraclariListesi(ham)
    for (const r of GOGUS_ROTALARI) {
      assert.ok(g.some((a) => a.route === r), `${ham} missing ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
    assert.equal(g.length, ORTAK_DOKTOR_ARACLARI.length + GOGUS_ROTALARI.length)
  }
  for (const r of GOGUS_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.ok(arac, `${r} not in BRANS_DOKTOR_ARACLARI`)
    assert.deepEqual(arac.branslar, ['gogus-hastaliklari'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'gogus-hastaliklari')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'gogus-cerrahisi', 'Göğüs Cerrahisi', 'dahiliye', 'kardiyoloji', 'kulak-burun-bogaz', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of GOGUS_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const gogus = doktorAraclariListesi('gogus-hastaliklari')
  assert.ok(!gogus.some((a) => a.branslar && !a.branslar.includes('gogus-hastaliklari')))
  assert.ok(!gogus.some((a) => a.route === '/doktor-tools/hedef-boy' || a.route === '/doktor-tools/kbb-odyometri'))
})

test('GOGUS studio pages: guarded by GogusAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/gogus-hastaliklari/ui/araclar/GogusAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /router\.replace\('\/doktor-tools'\)/)
  assert.match(kabuk, /Bu araç yalnızca göğüs hastalıkları için\./)
  assert.match(kabuk, /Araçlar · Göğüs/)
  for (const r of GOGUS_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /GogusAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /GogusCatMmrcAraci|GogusAksiyonPlaniAraci|GogusInhalerAraci|GogusSgkAraci|GogusKohortAraci|GogusAracKabugu|gogus-exceptional-audit/)
})

test('GOGUS tiles stay commercial: no dose, no diagnosis lock, no thoracic surgery copy', () => {
  for (const r of GOGUS_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|mcg|doz şeması/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanısı konur|lobektomi|VATS|ameliyathane|gogus-cerrahisi/i, r)
    assert.doesNotMatch(blob, /GOGUS-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── NOROLOJI-EXCEPTIONAL-01 — Nöroloji specialty-only Araçlar ─────────────────────────────
const NORO_ROTALARI = [
  '/doktor-tools/noro-inme',
  '/doktor-tools/noro-migren',
  '/doktor-tools/noro-ilac-izlem',
  '/doktor-tools/noro-kohort',
]

test('Nöroloji-only Araçlar: noroloji sees all four; foreign branşlar never', () => {
  for (const ham of ['noroloji', 'Nöroloji', 'Noroloji Uzmanı', 'nöroloji']) {
    const noro = doktorAraclariListesi(ham)
    for (const r of NORO_ROTALARI) {
      assert.ok(noro.some((a) => a.route === r), `${ham} missing ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
    assert.equal(noro.length, ORTAK_DOKTOR_ARACLARI.length + NORO_ROTALARI.length)
  }
  for (const r of NORO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.ok(arac, `${r} not in BRANS_DOKTOR_ARACLARI`)
    assert.deepEqual(arac.branslar, ['noroloji'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'noroloji')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'kardiyoloji', 'kulak-burun-bogaz', 'psikiyatri', 'gogus-hastaliklari', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of NORO_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const noro = doktorAraclariListesi('noroloji')
  assert.ok(!noro.some((a) => a.route === '/doktor-tools/hedef-boy' || a.route === '/doktor-tools/kbb-otoskopi'))
})

test('Nöroloji studio pages: guarded by NoroAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/noroloji/ui/araclar/NoroAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca nöroloji için\./)
  for (const r of NORO_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /NoroAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /NoroInmeAraci|NoroMigrenAraci|NoroIlacIzlemAraci|NoroKohortAraci|NoroAracKabugu|noro-exceptional-audit/)
})

test('Nöroloji tiles stay commercial: no dose, no diagnosis lock, no stroke-unit HIS', () => {
  for (const r of NORO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanısı konur|stroke unit|inme ünitesi|yatış emri/i, r)
    assert.doesNotMatch(blob, /NOROLOJI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})


// ─── UROLOJI-EXCEPTIONAL-01 — Üroloji specialty-only Araçlar ─────────────────────────────
const URO_ROTALARI = [
  '/doktor-tools/uro-ipss',
  '/doktor-tools/uro-psa',
  '/doktor-tools/uro-acil',
  '/doktor-tools/uro-kohort',
] as const

test('Üroloji-only Araçlar: uroloji sees all four; foreign branşlar never', () => {
  for (const ham of ['uroloji', 'Üroloji', 'Uroloji Uzmanı', 'urology']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of URO_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of URO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['uroloji'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'uroloji')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'kardiyoloji', 'kulak-burun-bogaz', 'psikiyatri', 'gogus-hastaliklari', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of URO_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const uro = doktorAraclariListesi('uroloji')
  assert.ok(!uro.some((a) => a.route === '/doktor-tools/hedef-boy' || a.route === '/doktor-tools/kbb-otoskopi'))
})

test('Üroloji studio pages: guarded by UroAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/uroloji/ui/araclar/UroAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca üroloji için\./)
  for (const r of URO_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /UroAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /UroIpssAraci|UroPsaAraci|UroAcilAraci|UroKohortAraci|UroAracKabugu|uroloji-exceptional-audit/)
})

test('Üroloji tiles stay commercial: no dose, no BPH/cancer diagnosis, no OR scheduling', () => {
  for (const r of URO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması/i, r)
    assert.doesNotMatch(blob, /BPH tanısı|prostat kanseri tanısı|ameliyathane|OR scheduling/i, r)
    assert.doesNotMatch(blob, /UROLOJI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── ORTOPEDI-EXCEPTIONAL-01 — Ortopedi specialty-only Araçlar ─────────────────────────────
const ORTO_ROTALARI = [
  '/doktor-tools/orto-kirik-alci',
  '/doktor-tools/orto-vas',
  '/doktor-tools/orto-op-protokol',
  '/doktor-tools/orto-kohort',
] as const

test('Ortopedi-only Araçlar: ortopedi sees all four; foreign branşlar never', () => {
  for (const ham of ['ortopedi', 'Ortopedi', 'Ortopedi ve Travmatoloji', 'orthopedics']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of ORTO_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of ORTO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['ortopedi'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'ortopedi')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'fizik-tedavi', 'kardiyoloji', 'uroloji', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of ORTO_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const orto = doktorAraclariListesi('ortopedi')
  assert.ok(!orto.some((a) => a.route === '/doktor-tools/hedef-boy' || a.route === '/doktor-tools/ftr-seans'))
})

test('Ortopedi studio pages: guarded by OrtoAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/ortopedi/ui/araclar/OrtoAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca ortopedi için\./)
  for (const r of ORTO_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /OrtoAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /OrtoKirikAlciAraci|OrtoVasAraci|OrtoOpProtokolAraci|OrtoKohortAraci|OrtoAracKabugu|ortopedi-exceptional-audit/)
})

test('Ortopedi tiles stay commercial: no dose, no diagnosis lock, no OR scheduling', () => {
  for (const r of ORTO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması/i, r)
    assert.doesNotMatch(blob, /artroz tanısı|kaynama tanısı|ameliyathane plan/i, r)
    assert.doesNotMatch(blob, /ORTOPEDI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── AILE-HEKIMLIGI-EXCEPTIONAL-01 — Aile hekimliği specialty-only Araçlar ─────────────────
const AILE_ROTALARI = [
  '/doktor-tools/aile-asi-tarama',
  '/doktor-tools/aile-kronik',
  '/doktor-tools/aile-sevk',
  '/doktor-tools/aile-kohort',
] as const

test('Aile hekimliği-only Araçlar: aile-hekimligi sees all four; foreign branşlar never', () => {
  for (const ham of ['aile-hekimligi', 'Aile Hekimliği', 'Genel Pratisyen']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of AILE_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of AILE_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.deepEqual(arac.branslar, ['aile-hekimligi'], r)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'aile-hekimligi')
  for (const b of [...yabanci, 'dahiliye', 'pediatri', 'kardiyoloji', 'endokrinoloji', 'İç Hastalıkları', null, '']) {
    for (const r of AILE_ROTALARI) {
      assert.ok(!doktorAraclariListesi(b).some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const aile = doktorAraclariListesi('aile-hekimligi')
  assert.ok(!aile.some((a) => a.branslar && !a.branslar.includes('aile-hekimligi')))
})

test('Aile hekimliği studio pages: guarded by AileAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/aile-hekimligi/ui/araclar/AileAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca aile hekimliği için\./)
  for (const r of AILE_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /AileAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /AileAsiTaramaAraci|AileKronikAraci|AileSevkAraci|AileKohortAraci|AileAracKabugu|aile-exceptional-audit/)
})

test('Aile hekimliği tiles stay commercial: no dose, no AHIS, no audit jargon', () => {
  for (const r of AILE_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması|lot numarası/i, r)
    assert.doesNotMatch(blob, /AHIS|ulusal HIS|tanı kilidi/i, r)
    assert.doesNotMatch(blob, /AILE-HEKIMLIGI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── FIZIK-TEDAVI-EXCEPTIONAL-01 — FTR specialty-only Araçlar ─────────────────────────────
const FTR_ROTALARI = [
  '/doktor-tools/ftr-seans',
  '/doktor-tools/ftr-vas-odi',
  '/doktor-tools/ftr-egzersiz',
  '/doktor-tools/ftr-kohort',
] as const

test('FTR-only Araçlar: fizik-tedavi sees all four; foreign branşlar never', () => {
  for (const ham of ['fizik-tedavi', 'Fizik Tedavi', 'Fiziksel Tıp ve Rehabilitasyon', 'FTR']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of FTR_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
    assert.equal(liste.length, ORTAK_DOKTOR_ARACLARI.length + FTR_ROTALARI.length)
  }
  for (const r of FTR_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.ok(arac, `${r} not in BRANS_DOKTOR_ARACLARI`)
    assert.deepEqual(arac.branslar, ['fizik-tedavi'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'fizik-tedavi')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'ortopedi', 'noroloji', 'kardiyoloji', 'pediatri', 'spor-hekimligi', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of FTR_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const ftr = doktorAraclariListesi('fizik-tedavi')
  assert.ok(!ftr.some((a) => a.branslar && !a.branslar.includes('fizik-tedavi')))
  assert.ok(!ftr.some((a) => a.route === '/doktor-tools/hedef-boy' || a.route === '/doktor-tools/orto-vas'))
})

test('FTR studio pages: guarded by FtrAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/fizik-tedavi/ui/araclar/FtrAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca fizik tedavi için\./)
  for (const r of FTR_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /FtrAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /FtrSeansAraci|FtrVasOdiAraci|FtrEgzersizAraci|FtrKohortAraci|FtrAracKabugu|ftr-exceptional-audit/)
})

test('FTR tiles stay commercial: no dose, no diagnosis lock, no hospital rehab HIS', () => {
  for (const r of FTR_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması/i, r)
    assert.doesNotMatch(blob, /disk hernisi tanısı|hastane HIS|tanı kilidi/i, r)
    assert.doesNotMatch(blob, /FIZIK-TEDAVI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Spor Hekimliği specialty-only Araçlar ───────────────────
const SPOR_ROTALARI = [
  '/doktor-tools/spor-rtp',
  '/doktor-tools/spor-sakatlik',
  '/doktor-tools/spor-kohort',
] as const

test('Spor-hekimligi-only Araçlar: spor-hekimligi sees all three; ortopedi/FTR and foreign branşlar never', () => {
  for (const ham of ['spor-hekimligi', 'Spor Hekimliği', 'Spor Hekimliği Uzmanı', 'sports medicine']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of SPOR_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of SPOR_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['spor-hekimligi'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'spor-hekimligi')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'ortopedi', 'fizik-tedavi', 'pediatri', 'dahiliye', 'uroloji', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of SPOR_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const spor = doktorAraclariListesi('spor-hekimligi')
  assert.ok(!spor.some((a) => a.route === '/doktor-tools/orto-vas' || a.route === '/doktor-tools/ftr-seans'))
})

test('Spor studio pages: guarded by SporAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/spor-hekimligi/ui/araclar/SporAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca spor hekimliği için\./)
  for (const r of SPOR_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /SporAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /SporRtpAraci|SporSakatlikAraci|SporKohortAraci|SporAracKabugu|spor-exceptional-audit/)
})

test('Spor tiles stay commercial: no dose, no doping panel, no team roster HIS, no diagnosis lock', () => {
  for (const r of SPOR_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması/i, r)
    assert.doesNotMatch(blob, /doping|WADA|takım kadrosu|team roster|tanı kilidi/i, r)
    assert.doesNotMatch(blob, /SPOR-HEKIMLIGI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── ENDOKRINOLOJI-EXCEPTIONAL-01 — Endokrinoloji specialty-only Araçlar ─────────────────
const ENDO_ROTALARI = [
  '/doktor-tools/endo-lab-izlem',
  '/doktor-tools/endo-dxa',
  '/doktor-tools/endo-rejim',
  '/doktor-tools/endo-kohort',
] as const

test('Endokrinoloji-only Araçlar: endokrinoloji sees all four; dahiliye and foreign never', () => {
  for (const ham of ['endokrinoloji', 'Endokrinoloji', 'Endokrinoloji ve Metabolizma']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of ENDO_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of ENDO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['endokrinoloji'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'endokrinoloji')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'kardiyoloji', 'noroloji', 'aile-hekimligi', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of ENDO_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const endo = doktorAraclariListesi('endokrinoloji')
  assert.ok(!endo.some((a) => a.route === '/doktor-tools/dahiliye-kohort' || a.route === '/doktor-tools/hedef-boy'))
})

test('Endokrinoloji studio pages: guarded by EndoAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/endokrinoloji/ui/araclar/EndoAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca endokrinoloji için\./)
  for (const r of ENDO_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /EndoAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /EndoLabIzlemAraci|EndoDxaAraci|EndoRejimAraci|EndoKohortAraci|EndoAracKabugu|endo-exceptional-audit/)
})

test('Endokrinoloji tiles stay commercial: no dose, no CGM core, no diagnosis lock', () => {
  for (const r of ENDO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması|ünite|sliding.?scale/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanısı konur|CGM entegrasyon|sürekli glukoz/i, r)
    assert.doesNotMatch(blob, /ENDOKRINOLOJI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── NEFROLOJI-EXCEPTIONAL-01 — Nefroloji specialty-only Araçlar ─────────────────
const NEF_ROTALARI = [
  '/doktor-tools/nef-egfr-kdigo',
  '/doktor-tools/nef-diyaliz',
  '/doktor-tools/nef-anemi',
  '/doktor-tools/nef-sgk',
  '/doktor-tools/nef-kohort',
] as const

test('Nefroloji-only Araçlar: nefroloji sees all five; dahiliye and foreign never', () => {
  for (const ham of ['nefroloji', 'Nefroloji', 'Böbrek Hastalıkları']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of NEF_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of NEF_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['nefroloji'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'nefroloji')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'uroloji', 'kardiyoloji', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of NEF_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const nef = doktorAraclariListesi('nefroloji')
  assert.ok(!nef.some((a) => a.route === '/doktor-tools/dahiliye-ckd' || a.route === '/doktor-tools/hedef-boy'))
})

test('Nefroloji studio pages: guarded by NefAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/nefroloji/ui/araclar/NefAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca nefroloji için\./)
  for (const r of NEF_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /NefAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /NefEgfrAraci|NefDiyalizAraci|NefAnemiAraci|NefSgkAraci|NefKohortAraci|NefAracKabugu|nef-exceptional-audit/)
})

test('Nefroloji tiles stay commercial: no ESA dose, no dialysis HIS product, no diagnosis lock', () => {
  for (const r of NEF_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması|\bIU\b|ünite/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanısı konur|Kt\/V|UF reçete/i, r)
    assert.doesNotMatch(blob, /NEFROLOJI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── GASTROENTEROLOJI-EXCEPTIONAL-01 — Gastroenteroloji specialty-only Araçlar ─────────────
const GASTRO_ROTALARI = [
  '/doktor-tools/gastro-ibd-ibs',
  '/doktor-tools/gastro-endoskopi',
  '/doktor-tools/gastro-hepatit',
  '/doktor-tools/gastro-kohort',
] as const

test('Gastroenteroloji-only Araçlar: gastroenteroloji sees all four; dahiliye and foreign never', () => {
  for (const ham of ['gastroenteroloji', 'Gastroenteroloji', 'Gastroenteroloji Uzmanı']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of GASTRO_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of GASTRO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['gastroenteroloji'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'gastroenteroloji')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'kardiyoloji', 'endokrinoloji', 'aile-hekimligi', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of GASTRO_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const gastro = doktorAraclariListesi('gastroenteroloji')
  assert.ok(!gastro.some((a) => a.route === '/doktor-tools/dahiliye-kohort' || a.route === '/doktor-tools/hedef-boy'))
})

test('Gastroenteroloji studio pages: guarded by GastroAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/gastroenteroloji/ui/araclar/GastroAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca gastroenteroloji için\./)
  for (const r of GASTRO_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /GastroAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /GastroIbdIbsAraci|GastroEndoskopiAraci|GastroHepatitAraci|GastroKohortAraci|GastroAracKabugu|gastro-exceptional-audit/)
})

test('Gastroenteroloji tiles stay commercial: no dose, no HIS core, no diagnosis lock', () => {
  for (const r of GASTRO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\b\d+\s*mg\b|\bmL\b|doz şeması/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanısı konur|ameliyathane suite/i, r)
    assert.doesNotMatch(blob, /GASTROENTEROLOJI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── ENFEKSIYON-EXCEPTIONAL-01 — Enfeksiyon Hastalıkları specialty-only Araçlar ─────────
const ENF_ROTALARI = [
  '/doktor-tools/enfeksiyon-izolasyon',
  '/doktor-tools/enfeksiyon-atb-sure',
  '/doktor-tools/enfeksiyon-viral-izlem',
  '/doktor-tools/enfeksiyon-kohort',
] as const

test('Enfeksiyon-only Araçlar: enfeksiyon sees all four; dahiliye and foreign never', () => {
  for (const ham of ['enfeksiyon-hastaliklari', 'Enfeksiyon Hastalıkları', 'Enfeksiyon Hastalıkları ve Klinik Mikrobiyoloji']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of ENF_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of ENF_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['enfeksiyon-hastaliklari'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'enfeksiyon-hastaliklari')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'kardiyoloji', 'gogus-hastaliklari', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of ENF_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const enf = doktorAraclariListesi('enfeksiyon-hastaliklari')
  assert.ok(!enf.some((a) => a.route === '/doktor-tools/dahiliye-kohort' || a.route === '/doktor-tools/hedef-boy'))
})

test('Enfeksiyon studio pages: guarded by EnfAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/enfeksiyon-hastaliklari/ui/araclar/EnfAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca enfeksiyon hastalıkları için\./)
  for (const r of ENF_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /EnfAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /EnfIzolasyonAraci|EnfAtbSureAraci|EnfViralIzlemAraci|EnfKohortAraci|EnfAracKabugu|enfeksiyon-exceptional-audit/)
})

test('Enfeksiyon tiles stay commercial: no dose, no hospital HIS, no diagnosis lock', () => {
  for (const r of ENF_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması|mg\/kg/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanısı konur|full HIS suite/i, r)
    assert.doesNotMatch(blob, /ENFEKSIYON-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})


// ─── ONKOLOJI-EXCEPTIONAL-01 — Onkoloji specialty-only Araçlar ─────────────────
const ONKO_ROTALARI = [
  '/doktor-tools/onko-kur',
  '/doktor-tools/onko-toksisite',
  '/doktor-tools/onko-sut',
  '/doktor-tools/onko-kohort',
] as const

test('Onkoloji-only Araçlar: onkoloji sees all four; dahiliye and foreign never', () => {
  for (const ham of ['onkoloji', 'Onkoloji', 'Tıbbi Onkoloji']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of ONKO_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of ONKO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['onkoloji'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'onkoloji')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'dahiliye', 'kardiyoloji', 'endokrinoloji', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of ONKO_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const onko = doktorAraclariListesi('onkoloji')
  assert.ok(!onko.some((a) => a.route === '/doktor-tools/dahiliye-kohort' || a.route === '/doktor-tools/hedef-boy'))
})

test('Onkoloji studio pages: guarded by OnkoAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/onkoloji/ui/araclar/OnkoAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca onkoloji için\./)
  for (const r of ONKO_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /OnkoAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /OnkoKurAraci|OnkoToksisiteAraci|OnkoSutAraci|OnkoKohortAraci|OnkoAracKabugu|onko-exceptional-audit/)
})

test('Onkoloji tiles stay commercial: no dose, no Medula e-imza live, no diagnosis lock', () => {
  for (const r of ONKO_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /mg\/m²|mg\/m2|AUC|BSA|doz şeması|eczane doz/i, r)
    assert.doesNotMatch(blob, /tanı koy|evre kilidi|canlı Medula e-imza at/i, r)
    assert.doesNotMatch(blob, /ONKOLOJI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── ROMATOLOJI-EXCEPTIONAL-01 — Romatoloji specialty-only Araçlar ─────────────────
const ROMA_ROTALARI = [
  '/doktor-tools/roma-das28-basdai',
  '/doktor-tools/roma-biyolojik-sut',
  '/doktor-tools/roma-lab-izlem',
  '/doktor-tools/roma-kohort',
] as const

test('Romatoloji-only Araçlar: romatoloji sees all four; ortopedi/FTR/dahiliye and foreign never', () => {
  for (const ham of ['romatoloji', 'Romatoloji']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of ROMA_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of ROMA_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['romatoloji'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'romatoloji')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'ortopedi', 'fizik-tedavi', 'dahiliye', 'pediatri', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of ROMA_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const roma = doktorAraclariListesi('romatoloji')
  assert.ok(!roma.some((a) => a.route === '/doktor-tools/orto-vas' || a.route === '/doktor-tools/ftr-seans' || a.route === '/doktor-tools/hedef-boy'))
})

test('Romatoloji studio pages: guarded by RomaAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/romatoloji/ui/araclar/RomaAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca romatoloji için\./)
  for (const r of ROMA_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /RomaAracKabugu/, r)
    assert.doesNotMatch(landing, new RegExp(r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.doesNotMatch(landing, /RomaDas28BasdaiAraci|RomaLabIzlemAraci|RomaBiyolojikSutAraci|RomaKohortAraci|RomaAracKabugu|roma-exceptional-audit/)
})

test('Romatoloji Araçlar commercial copy: no sprint jargon, no person names, no doses', () => {
  for (const r of ROMA_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|\bmL\b|doz şeması|infüzyon süiti HIS/i, r)
    assert.doesNotMatch(blob, /ROMATOLOJI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── GENEL-CERRAHI-EXCEPTIONAL-01 — Genel Cerrahi specialty-only Araçlar ─────────────
const GC_ROTALARI = [
  '/doktor-tools/gc-preop',
  '/doktor-tools/gc-yara-dren',
  '/doktor-tools/gc-patoloji',
  '/doktor-tools/gc-kohort',
] as const

test('Genel cerrahi-only Araçlar: genel-cerrahi sees all four; ortopedi/plastik and foreign never', () => {
  for (const ham of ['genel-cerrahi', 'Genel Cerrahi']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of GC_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of GC_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['genel-cerrahi'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'genel-cerrahi')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'ortopedi', 'plastik-cerrahi', 'uroloji', 'onkoloji', 'pediatri', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of GC_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const gc = doktorAraclariListesi('genel-cerrahi')
  assert.ok(!gc.some((a) => a.route === '/doktor-tools/orto-vas' || a.route === '/doktor-tools/hedef-boy' || a.route === '/doktor-tools/plastik-yara'))
})

test('Genel cerrahi studio pages: guarded by GcAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/genel-cerrahi/ui/araclar/GcAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca genel cerrahi için\./)
  for (const r of GC_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /GcAracKabugu/, r)
    assert.doesNotMatch(landing, new RegExp(r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.doesNotMatch(landing, /GcPreopAraci|GcYaraDrenAraci|GcPatolojiAraci|GcKohortAraci|gc-exceptional-audit/)
})

test('Genel cerrahi Araçlar commercial copy: no sprint jargon, no person names, no doses', () => {
  for (const r of GC_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|doz şeması|OR scheduling HIS/i, r)
    assert.doesNotMatch(blob, /GENEL-CERRAHI-EXCEPTIONAL|sprint|audit|\.html/i, r)
    assert.doesNotMatch(blob, /Gökhan|Gokhan/i, r)
  }
})

// ─── PLASTIK-CERRAHI-EXCEPTIONAL-01 — Plastik specialty-only Araçlar ─────────────
const PLASTIK_ROTALARI = [
  '/doktor-tools/plastik-foto',
  '/doktor-tools/plastik-yara',
  '/doktor-tools/plastik-onam',
  '/doktor-tools/plastik-kohort',
] as const

test('Plastik-only Araçlar: plastik-cerrahi sees all four; dermatoloji/genel-cerrahi and foreign never', () => {
  for (const ham of ['plastik-cerrahi', 'Plastik Cerrahi', 'Plastik Rekonstrüktif ve Estetik Cerrahi']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of PLASTIK_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of PLASTIK_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['plastik-cerrahi'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'plastik-cerrahi')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'dermatoloji', 'genel-cerrahi', 'onkoloji', 'pediatri', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of PLASTIK_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const plastik = doktorAraclariListesi('plastik-cerrahi')
  assert.ok(!plastik.some((a) => a.route === '/doktor-tools/derm-pasi' || a.route === '/doktor-tools/hedef-boy'))
})

test('Plastik studio pages: guarded by PlastikAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/plastik-cerrahi/ui/araclar/PlastikAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca plastik cerrahi için\./)
  for (const r of PLASTIK_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /PlastikAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /PlastikFotoAraci|PlastikYaraAraci|PlastikOnamAraci|PlastikKohortAraci|PlastikAracKabugu|plastik-exceptional-audit/)
})

test('Plastik tiles stay commercial: no dose, no OR/HIS, no diagnosis lock, no derm leak', () => {
  for (const r of PLASTIK_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|doz şeması/i, r)
    assert.doesNotMatch(blob, /tanı koy|OR scheduling|full HIS/i, r)
    assert.doesNotMatch(blob, /PLASTIK-CERRAHI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})


// ─── BEYIN-CERRAHISI-EXCEPTIONAL-01 — Beyin Cerrahisi specialty-only Araçlar ─────────────────
const BC_ROTALARI = [
  '/doktor-tools/bc-postop',
  '/doktor-tools/bc-goruntu',
  '/doktor-tools/bc-bilinc',
  '/doktor-tools/bc-kohort',
] as const

test('Beyin-cerrahisi-only Araçlar: beyin sees all four; noroloji and foreign never', () => {
  const kok = path.join(import.meta.dirname, '../..')
  for (const ham of ['beyin-cerrahisi', 'Beyin Cerrahisi', 'Nöroşirürji']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of BC_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of BC_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['beyin-cerrahisi'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'beyin-cerrahisi')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'noroloji', 'genel-cerrahi', 'dahiliye', 'pediatri', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of BC_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  // Cross-leak: noroloji Migren/İnme must not appear for beyin-cerrahisi
  const beyin = doktorAraclariListesi('beyin-cerrahisi')
  assert.ok(!beyin.some((a) => a.route === '/doktor-tools/noro-migren'))
  assert.ok(!beyin.some((a) => a.route === '/doktor-tools/noro-inme'))
  const noro = doktorAraclariListesi('noroloji')
  assert.ok(!noro.some((a) => a.route.startsWith('/doktor-tools/bc-')))
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  for (const r of BC_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /BcAracKabugu/)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /BcPostopAraci|BcGoruntuAraci|BcBilincAraci|BcKohortAraci|BcAracKabugu|beyin-exceptional-audit/)
})

test('Beyin-cerrahisi tiles stay commercial: no AED dose, no OR/HIS, no diagnosis lock', () => {
  const kok = path.join(import.meta.dirname, '../..')
  for (const r of BC_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|AED dozu üret|antiepileptik doz şeması/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanı kilidi|full HIS|OR scheduling motoru/i, r)
    assert.doesNotMatch(blob, /BEYIN-CERRAHISI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/beyin-cerrahisi/ui/araclar/BcAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /Bu araç yalnızca beyin cerrahisi için\./)
})

// ─── GOGUS-CERRAHISI-EXCEPTIONAL-01 — Göğüs Cerrahisi specialty-only Araçlar ─────
const GOGUS_CERRAHI_ROTALARI = [
  '/doktor-tools/gogus-cerrahi-preop',
  '/doktor-tools/gogus-cerrahi-tup-yara',
  '/doktor-tools/gogus-cerrahi-patoloji',
  '/doktor-tools/gogus-cerrahi-kohort',
] as const

test('Göğüs cerrahisi-only Araçlar: gogus-cerrahisi sees all four; gogus-hastaliklari and foreign never', () => {
  for (const ham of ['gogus-cerrahisi', 'Göğüs Cerrahisi', 'Göğüs Cerrahisi Uzmanı']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of GOGUS_CERRAHI_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
    // No pulmonology CAT/mMRC tiles
    assert.ok(!liste.some((a) => a.route === '/doktor-tools/gogus-cat-mmrc'), `${ham} must not see CAT/mMRC`)
    assert.ok(!liste.some((a) => a.route === '/doktor-tools/gogus-inhaler'), `${ham} must not see inhaler`)
  }
  for (const r of GOGUS_CERRAHI_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['gogus-cerrahisi'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'gogus-cerrahisi')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'gogus-hastaliklari', 'Göğüs Hastalıkları', 'genel-cerrahi', 'kardiyoloji', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of GOGUS_CERRAHI_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
})

test('Göğüs cerrahisi studio pages: guarded by GcAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/gogus-cerrahisi/ui/araclar/GcAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca göğüs cerrahisi için\./)
  for (const r of GOGUS_CERRAHI_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /GcAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /GcPreopAraci|GcTupYaraAraci|GcPatolojiAraci|GcKohortAraci|GcAracKabugu|gogus-cerrahisi-exceptional-audit/)
})

test('Göğüs cerrahisi tiles stay commercial: no dose, no OR/HIS, no CAT/mMRC, no diagnosis lock', () => {
  for (const r of GOGUS_CERRAHI_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|doz şeması|CAT\/mMRC|mMRC|GOLD\s*ABE/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanı kilidi|full HIS|OR scheduling motoru|ameliyathane HIS/i, r)
    assert.doesNotMatch(blob, /GOGUS-CERRAHISI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── COCUK-CERRAHISI-EXCEPTIONAL-01 — Çocuk Cerrahisi specialty-only Araçlar ─────────
const CC_ROTALARI = [
  '/doktor-tools/cc-prepost-op',
  '/doktor-tools/cc-yara-dren',
  '/doktor-tools/cc-onam-veli',
  '/doktor-tools/cc-kohort',
] as const

test('Çocuk cerrahisi-only Araçlar: cocuk-cerrahisi sees all four; pediatri and foreign never', () => {
  for (const ham of ['cocuk-cerrahisi', 'Çocuk Cerrahisi', 'Cocuk Cerrahisi']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of CC_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of CC_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['cocuk-cerrahisi'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'cocuk-cerrahisi')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'pediatri', 'genel-cerrahi', 'ortopedi', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of CC_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const cc = doktorAraclariListesi('cocuk-cerrahisi')
  assert.ok(!cc.some((a) => a.route === '/doktor-tools/hedef-boy' || a.route === '/doktor-tools/gc-preop' || a.route === '/doktor-tools/orto-vas'))
  const ped = doktorAraclariListesi('pediatri')
  for (const r of CC_ROTALARI) assert.ok(!ped.some((a) => a.route === r), `pediatri must not see ${r}`)
})

test('Çocuk cerrahisi studio pages: guarded by CcAracKabugu, never on the landing', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/cocuk-cerrahisi/ui/araclar/CcAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca çocuk cerrahisi için\./)
  for (const r of CC_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /CcAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /CcPrepostAraci|CcYaraDrenAraci|CcOnamVeliAraci|CcKohortAraci|CcAracKabugu|cocuk-cerrahisi-exceptional-audit/)
})

test('Çocuk cerrahisi tiles stay commercial: no dose, no OR/HIS, no Neyzi/Hedef Boy, no diagnosis lock', () => {
  for (const r of CC_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|doz şeması|Neyzi|Hedef Boy|persentil/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanı kilidi|full HIS|OR scheduling motoru/i, r)
    assert.doesNotMatch(blob, /COCUK-CERRAHISI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Kalp Damar Cerrahisi specialty-only Araçlar ─────
const KDC_ROTALARI = [
  '/doktor-tools/kdc-preop',
  '/doktor-tools/kdc-greft-yara',
  '/doktor-tools/kdc-antikoag',
  '/doktor-tools/kdc-kohort',
] as const

test('Kalp damar cerrahisi-only Araçlar: kalp-damar-cerrahisi sees all four; kardiyoloji and foreign never', () => {
  for (const ham of ['kalp-damar-cerrahisi', 'Kalp Damar Cerrahisi', 'Kalp ve Damar Cerrahisi']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of KDC_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'kalp-damar-cerrahisi')
  for (const b of [...yabanci, 'kardiyoloji', 'Kardiyoloji', 'dahiliye', 'genel-cerrahi', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of KDC_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must NOT see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  // Cross-leak: SCORE2/Kalbim tools must not appear for kalp-damar
  const kdc = doktorAraclariListesi('kalp-damar-cerrahisi')
  assert.ok(!kdc.some((a) => /score2|kalbim|ht-kky/i.test(a.route)))
  const kardio = doktorAraclariListesi('kardiyoloji')
  assert.ok(!kardio.some((a) => a.route.startsWith('/doktor-tools/kdc-')))
})

test('Kalp damar cerrahisi pages: KdcAracKabugu + own route; landing cards only', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/kalp-damar-cerrahisi/ui/araclar/KdcAracKabugu.tsx'), 'utf8')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  assert.match(kabuk, /doktorAraciBransaUygun\(route/)
  assert.match(kabuk, /Bu araç yalnızca kalp damar cerrahisi için\./)
  for (const r of KDC_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /KdcAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} guards its own route`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /KdcPreopAraci|KdcGreftYaraAraci|KdcAntikoagAraci|KdcKohortAraci|KdcAracKabugu|kalp-damar-exceptional-audit/)
})

test('Kalp damar cerrahisi tiles stay commercial: no invented dose numbers, no OR/HIS, no diagnosis lock', () => {
  for (const r of KDC_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\b\d+\s*mg\b|warfarin\s*\d+|INR hedef\s*=/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanı kilitle|full HIS|OR scheduling motoru|ameliyathane HIS/i, r)
    assert.doesNotMatch(blob, /KALP-DAMAR-CERRAHISI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
})

// ─── ANESTEZI-EXCEPTIONAL-01 — Anestezi specialty-only Araçlar ─────────────────
const ANESTEZI_ROTALARI = [
  '/doktor-tools/anestezi-asa',
  '/doktor-tools/anestezi-hava-yolu',
  '/doktor-tools/anestezi-agri',
  '/doktor-tools/anestezi-kohort',
] as const

test('Anestezi-only Araçlar: anestezi sees all four; genel-cerrahi and foreign never', () => {
  const kok = path.join(import.meta.dirname, '../..')
  for (const ham of ['anestezi', 'Anestezi', 'Anesteziyoloji']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of ANESTEZI_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of ANESTEZI_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['anestezi'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'anestezi')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'genel-cerrahi', 'gogus-cerrahisi', 'dahiliye', 'pediatri', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of ANESTEZI_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  // Cross-leak: genel-cerrahi / göğüs cerrahisi pre-op must not appear for anestezi
  const anestezi = doktorAraclariListesi('anestezi')
  assert.ok(!anestezi.some((a) => a.route === '/doktor-tools/gc-preop'))
  assert.ok(!anestezi.some((a) => a.route === '/doktor-tools/gogus-cerrahi-preop'))
  const gc = doktorAraclariListesi('genel-cerrahi')
  assert.ok(!gc.some((a) => a.route.startsWith('/doktor-tools/anestezi-')))
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  for (const r of ANESTEZI_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /AnesteziAracKabugu/)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /AnesteziAsaAraci|AnesteziHavaYoluAraci|AnesteziAgriAraci|AnesteziKohortAraci|AnesteziAracKabugu|anestezi-exceptional-audit/)
})

test('Anestezi tiles stay commercial: no dose, no OR machine HIS, no diagnosis lock', () => {
  const kok = path.join(import.meta.dirname, '../..')
  for (const r of ANESTEZI_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\bmg\b|doz şeması|propofol doz|analjezik doz şeması/i, r)
    assert.doesNotMatch(blob, /tanı koy|tanı kilidi|full HIS|OR scheduling motoru/i, r)
    assert.doesNotMatch(blob, /ANESTEZI-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/anestezi/ui/araclar/AnesteziAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /Bu araç yalnızca anestezi için\./)
})

// ─── ACIL-TIP-EXCEPTIONAL-01 — Acil Tıp specialty-only Araçlar ─────────────────
const ACIL_ROTALARI = [
  '/doktor-tools/acil-esi',
  '/doktor-tools/acil-kritik-yol',
  '/doktor-tools/acil-sevk',
  '/doktor-tools/acil-kohort',
] as const

test('Acil-tip-only Araçlar: acil-tip sees all four; kardiyoloji/noroloji and foreign never', () => {
  const kok = path.join(import.meta.dirname, '../..')
  for (const ham of ['acil-tip', 'Acil Tıp', 'Emergency Medicine']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of ACIL_ROTALARI) {
      assert.ok(liste.some((a) => a.route === r), `${ham} must see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, ham), true, `${ham} deep-link ${r}`)
    }
  }
  for (const r of ACIL_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)
    assert.ok(arac, r)
    assert.deepEqual(arac.branslar, ['acil-tip'], r)
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} must not be a shared tile`)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'acil-tip')
  assert.ok(yabanci.length >= 25)
  for (const b of [...yabanci, 'kardiyoloji', 'noroloji', 'anestezi', 'dahiliye', 'pediatri', null, '']) {
    const liste = doktorAraclariListesi(b)
    for (const r of ACIL_ROTALARI) {
      assert.ok(!liste.some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  // Cross-leak: kardiyoloji SCORE2 / noroloji İnme must not appear for acil-tip
  const acil = doktorAraclariListesi('acil-tip')
  assert.ok(!acil.some((a) => a.route === '/doktor-tools/kardio-score2' || a.route.includes('score2')))
  assert.ok(!acil.some((a) => a.route === '/doktor-tools/noro-inme'))
  const kardio = doktorAraclariListesi('kardiyoloji')
  assert.ok(!kardio.some((a) => a.route.startsWith('/doktor-tools/acil-')))
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  for (const r of ACIL_ROTALARI) {
    const sayfa = fs.readFileSync(path.join(kok, `app${r}/page.tsx`), 'utf8')
    assert.match(sayfa, /AtAracKabugu/)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  assert.doesNotMatch(landing, /AtEsiAraci|AtKritikYolAraci|AtSevkAraci|AtKohortAraci|AtAracKabugu|acil-exceptional-audit/)
})

test('Acil-tip tiles stay commercial: no dose, no bed board HIS, no diagnosis lock', () => {
  const kok = path.join(import.meta.dirname, '../..')
  for (const r of ACIL_ROTALARI) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    const blob = `${arac.title} ${arac.desc}`
    assert.doesNotMatch(blob, /\b\d+\s*mg\b|doz şeması|adrenaline doz/i, r)
    assert.doesNotMatch(blob, /tanı koy(?!\s*yok)|tanı kilitle|full HIS|bed board motoru/i, r)
    assert.doesNotMatch(blob, /ACIL-TIP-EXCEPTIONAL|sprint|audit|\.html/i, r)
  }
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/acil-tip/ui/araclar/AtAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /Bu araç yalnızca acil tıp için\./)
})


// ─── RADYOLOJI-EXCEPTIONAL-01 — Radyoloji specialty-only Araçlar ─────────────────────────────
test('Radyoloji-only Araçlar: radyoloji sees all four; foreign never', () => {
  const rotalar = ['/doktor-tools/radyo-kuyruk', '/doktor-tools/radyo-rapor', '/doktor-tools/radyo-kritik', '/doktor-tools/radyo-kohort']
  for (const ham of ['radyoloji', 'Radyoloji']) {
    const liste = doktorAraclariListesi(ham)
    for (const r of rotalar) assert.ok(liste.some((a) => a.route === r), `${ham} ${r}`)
  }
  for (const r of rotalar) {
    const arac = BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!
    assert.deepEqual(arac.branslar, ['radyoloji'], r)
  }
  const yabanci = Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'radyoloji')
  for (const b of yabanci) {
    const liste = doktorAraclariListesi(b)
    for (const r of rotalar) assert.ok(!liste.some((a) => a.route === r), `${b} must omit ${r}`)
  }
  const radyo = doktorAraclariListesi('radyoloji')
  assert.ok(!radyo.some((a) => a.route === '/doktor-tools/dahiliye-score2'))
  assert.ok(!radyo.some((a) => a.route === '/doktor-tools/gogus-cat-mmrc'))
  const kok = path.join(import.meta.dirname, '../..')
  const landing = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  assert.doesNotMatch(landing, /RadyoKuyrukAraci|RadyoRaporAraci|RadyoKritikAraci|RadyoKohortAraci|radyo-exceptional-audit/)
  const kabuk = fs.readFileSync(path.join(kok, 'specialties/radyoloji/ui/araclar/RadyoAracKabugu.tsx'), 'utf8')
  assert.match(kabuk, /Bu araç yalnızca radyoloji için\./)
})
