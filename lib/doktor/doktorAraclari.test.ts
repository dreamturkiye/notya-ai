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
  }

  // Göz / KD: shared only — no foreign chapter clinical tiles
  assert.equal(goz.length, ORTAK_DOKTOR_ARACLARI.length)
  assert.equal(kd.length, ORTAK_DOKTOR_ARACLARI.length)
  assert.ok(!goz.some((a) => a.title.includes('Dahiliye') || a.route.includes('dahiliye')))
  assert.ok(!kd.some((a) => a.title.includes('Göz') || a.route.includes('goz') || a.route.includes('dahiliye')))

  assert.ok(dah.some((a) => a.route === '/doktor-tools/dahiliye-kohort'))
  assert.equal(ped.length, ORTAK_DOKTOR_ARACLARI.length)
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
  assert.ok(!doktorAraclariListesi('Kadın Hastalıkları ve Doğum').some((a) => a.route.includes('dahiliye')))
  assert.ok(!doktorAraclariListesi('Göz Hastalıkları Uzmanı').some((a) => a.route.includes('dahiliye')))
})

test('deep-link guard: dahiliye kohort only for dahiliye', () => {
  assert.equal(doktorAraciBransaUygun('/doktor-tools/dahiliye-kohort', 'dahiliye'), true)
  assert.equal(doktorAraciBransaUygun('/doktor-tools/dahiliye-kohort', 'goz-hastaliklari'), false)
  assert.equal(doktorAraciBransaUygun('/doktor-tools/dahiliye-kohort', 'kadin-dogum'), false)
  assert.equal(doktorAraciBransaUygun('/doktor-tools/erecete', 'goz-hastaliklari'), true)
})

test('page uses filtered catalog; no audit HTML wired into araçlar', () => {
  const kok = path.join(import.meta.dirname, '../..')
  const page = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  const catalog = fs.readFileSync(path.join(kok, 'lib/doktor/doktorAraclari.ts'), 'utf8')
  assert.match(page, /doktorAraclariListesi/)
  assert.doesNotMatch(catalog, /presprint-audit|post-sprint-audit|gaps-audit|\.html/)
  assert.doesNotMatch(catalog, /Gökhan|Gokhan/)
  const kohort = fs.readFileSync(path.join(kok, 'app/doktor-tools/dahiliye-kohort/page.tsx'), 'utf8')
  assert.match(kohort, /doktorAraciBransaUygun/)
})
