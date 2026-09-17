import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  doktorAraclariListesi,
  doktorAraciBransaUygun,
  ORTAK_DOKTOR_ARACLARI,
  BRANS_DOKTOR_ARACLARI,
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

  assert.ok(goz.some((a) => a.route.includes('goz-')))
  assert.ok(!goz.some((a) => a.route.includes('dahiliye') || a.title.includes('Dahiliye')))
  assert.ok(!goz.some((a) => a.route.includes('kd-jine') || a.title.startsWith('KD ')))

  assert.ok(kd.some((a) => a.route.includes('kd-jine')))
  assert.ok(!kd.some((a) => a.route.includes('goz-') || a.title.includes('Göz')))
  assert.ok(!kd.some((a) => a.route.includes('dahiliye') || a.title.includes('Dahiliye')))

  assert.ok(dah.some((a) => a.route === '/doktor-tools/dahiliye-kohort'))
  assert.ok(!dah.some((a) => a.route.includes('goz-') || a.route.includes('kd-jine')))

  // baseline / pediatri: shared only (Hedef Boy is a separate pediatri gate on the page)
  assert.equal(ped.length, ORTAK_DOKTOR_ARACLARI.length)
  assert.ok(!ped.some((a) => a.branslar))
})

test('free-text users.specialty resolves for chapter araçlar', () => {
  assert.ok(doktorAraclariListesi('Göz Hastalıkları Uzmanı').some((a) => a.icon === 'GÖZ'))
  assert.ok(doktorAraclariListesi('Kadın Hastalıkları ve Doğum').some((a) => a.icon === 'KD'))
  assert.ok(doktorAraclariListesi('İç Hastalıkları').some((a) => a.route === '/doktor-tools/dahiliye-kohort'))
})

test('deep-link guard: dahiliye kohort only for dahiliye', () => {
  assert.equal(doktorAraciBransaUygun('/doktor-tools/dahiliye-kohort', 'dahiliye'), true)
  assert.equal(doktorAraciBransaUygun('/doktor-tools/dahiliye-kohort', 'goz-hastaliklari'), false)
  assert.equal(doktorAraciBransaUygun('/doktor-tools/dahiliye-kohort', 'kadin-dogum'), false)
  assert.equal(doktorAraciBransaUygun('/doktor-tools/erecete', 'goz-hastaliklari'), true)
})

test('every chapter tile declares branslar; page uses the filtered catalog', () => {
  for (const a of BRANS_DOKTOR_ARACLARI) {
    assert.ok(a.branslar && a.branslar.length > 0, a.route)
  }
  const kok = path.join(import.meta.dirname, '../..')
  const page = fs.readFileSync(path.join(kok, 'app/doktor-tools/page.tsx'), 'utf8')
  assert.match(page, /doktorAraclariListesi/)
  assert.doesNotMatch(page, /dahiliye-presprint-audit\.html/)
  assert.doesNotMatch(page, /goz-presprint-audit\.html/)
  const kohort = fs.readFileSync(path.join(kok, 'app/doktor-tools/dahiliye-kohort/page.tsx'), 'utf8')
  assert.match(kohort, /doktorAraciBransaUygun/)
})
