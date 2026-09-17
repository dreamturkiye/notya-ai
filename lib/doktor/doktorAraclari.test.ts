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

  assert.equal(goz.length, ORTAK_DOKTOR_ARACLARI.length)
  assert.equal(kd.length, ORTAK_DOKTOR_ARACLARI.length)
  assert.ok(!goz.some((a) => a.route.includes('dahiliye') || a.route.includes('hedef-boy')))
  assert.ok(!kd.some((a) => a.route.includes('dahiliye') || a.route.includes('hedef-boy')))

  assert.ok(dah.some((a) => a.route === '/doktor-tools/dahiliye-kohort'))
  assert.ok(!dah.some((a) => a.route.includes('hedef-boy')))
  assert.ok(ped.some((a) => a.route === '/doktor-tools/hedef-boy'))
  assert.ok(!ped.some((a) => a.route.includes('dahiliye-kohort')))
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
