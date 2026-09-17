import { test } from 'node:test'
import assert from 'node:assert/strict'
import { anemiDegerlendir, type AnemiGirdi } from '../engines/anemi'

const bos: AnemiGirdi = { kadin: false, yas: 55, hb: null, mcv: null, rbc: null, wbc: null, plt: null, ferritin: null, b12: null, folat: null, retic: null, crp: null, eGFR: null, tsh: null, ldh: null, tbil: null }

test('eşik: Hb 12,5 kadında anemi yok, erkekte var; Hb <7 kırmızı bayrak', () => {
  assert.equal(anemiDegerlendir({ ...bos, kadin: true, hb: 12.5 }).anemi, false)
  assert.equal(anemiDegerlendir({ ...bos, hb: 12.5 }).anemi, true)
  assert.equal(anemiDegerlendir({ ...bos, hb: 6.5, mcv: 90 }).kirmizi.length, 1)
})

test('mikrositer: ferritin yoksa sonraki test; düşük ferritin erkek → gastro sevk; normal ferritin + Mentzer <13 → elektroforez', () => {
  assert.deepEqual(anemiDegerlendir({ ...bos, hb: 10, mcv: 72 }).sonrakiTestler, ['Ferritin', 'CRP (ferritin yorumu için)'])
  const d = anemiDegerlendir({ ...bos, hb: 10, mcv: 72, ferritin: 8 })
  assert.match(d.olasiNeden[0], /Demir eksikliği/); assert.match(d.sevk[0], /endoskopi/)
  const pre = anemiDegerlendir({ ...bos, kadin: true, yas: 32, hb: 10, mcv: 72, ferritin: 8 })
  assert.equal(pre.sevk.length, 0); assert.ok(pre.plan.some((p) => /Premenopozal/.test(p)))
  const t = anemiDegerlendir({ ...bos, hb: 11.5, mcv: 64, rbc: 5.9, ferritin: 80, crp: 2 })
  assert.match(t.olasiNeden[0], /Talasemi/); assert.ok(t.sonrakiTestler.some((x) => /elektroforez/.test(x)))
})

test('makrositer B12 düşük; normositer retikülosit yüksek → hemoliz paneli; KBH anemisi', () => {
  assert.match(anemiDegerlendir({ ...bos, hb: 10, mcv: 108, b12: 150, folat: 8 }).olasiNeden[0], /B12/)
  const h = anemiDegerlendir({ ...bos, hb: 9.5, mcv: 92, retic: 5, ldh: 480, tbil: 2.4 })
  assert.ok(h.sonrakiTestler.includes('Direkt Coombs')); assert.equal(h.sevk.length, 1)
  assert.match(anemiDegerlendir({ ...bos, hb: 10, mcv: 88, retic: 1, eGFR: 35, ferritin: 200, b12: 400, tsh: 2 }).olasiNeden[0], /KBH/)
})
