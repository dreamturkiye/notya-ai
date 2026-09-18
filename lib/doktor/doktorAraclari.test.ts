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
  assert.ok(!goz.some((a) => a.route.includes('dahiliye') || a.route.includes('hedef-boy')))
  assert.ok(!kd.some((a) => a.route.includes('dahiliye') || a.route.includes('hedef-boy')))

  assert.ok(dah.some((a) => a.route === '/doktor-tools/dahiliye-kohort'))
  assert.ok(!dah.some((a) => a.route.includes('hedef-boy')))
  assert.ok(ped.some((a) => a.route === '/doktor-tools/hedef-boy'))
  assert.ok(!ped.some((a) => a.route.includes('dahiliye-kohort')))
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

// PEDI-ARACLAR-01 — pediatri-only Araçlar (same shape as the göz block above).
const PEDI_ROTALAR = ['/doktor-tools/pedi-buyume', '/doktor-tools/pedi-doz']

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
