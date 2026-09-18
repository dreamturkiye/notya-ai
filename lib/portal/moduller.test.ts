import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { portalBransAnahtari, portalModulleri, portalModulAktif, type PortalUygunlukGirdisi } from './moduller'
import { specialtyProfile } from '../specialties/registry'
import { emptyPortalBundle } from './emptyBundle'
import { SAGLIGIM_DEMO } from './demoData'

// SAGLIGIM-PORTAL-REGISTRY — one shell, many chapters (.cursor/skills/specialty-hasta-portali/SKILL.md).
const g = (o: Partial<PortalUygunlukGirdisi>): PortalUygunlukGirdisi => ({ doktorBransi: null, hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false, ...o })
const kok = path.join(import.meta.dirname, '..', '..')

describe('pediatri portal is not göz portal', () => {
  it('göz doctor: Gözlerim only — no büyüme / gebelik / jine / anket by default, even for a child with growth data', () => {
    for (const hasta of [g({ doktorBransi: 'goz-hastaliklari' }), g({ doktorBransi: 'Göz Hastalıkları', hastaYasYil: 6, buyumeOlcumu: true, kdKaydi: true, dahiliyeKaydi: true })]) {
      assert.deepEqual(portalModulleri(hasta).moduller, ['gozlerim'])
    }
  })
  it('pediatri doctor: büyüme for a child (or unknown DOB), never Gözlerim', () => {
    assert.deepEqual(portalModulleri(g({ doktorBransi: 'pediatri', hastaYasYil: 4 })).moduller, ['buyume'])
    assert.deepEqual(portalModulleri(g({ doktorBransi: 'pediatri', hastaYasYil: null })).moduller, ['buyume'])
    assert.ok(!portalModulleri(g({ doktorBransi: 'pediatri', hastaYasYil: 4 })).moduller.includes('gozlerim'))
  })
  it('adult patient never gets büyüme (bug: curves were built for every patient with a DOB)', () => {
    for (const b of ['pediatri', 'aile-hekimligi', null]) assert.ok(!portalModulleri(g({ doktorBransi: b, hastaYasYil: 35, buyumeOlcumu: true })).moduller.includes('buyume'))
  })
})

describe('KD / dahiliye / derm eligibility', () => {
  it('Gebeliğim fires on an active pregnancy for any practice (mixed care), jine reminders only for KD', () => {
    assert.deepEqual(portalModulleri(g({ doktorBransi: 'goz-hastaliklari', gebelikAktif: true, kdKaydi: true })).moduller, ['gozlerim', 'gebelik'])
    assert.deepEqual(portalModulleri(g({ doktorBransi: 'kadin-hastaliklari-dogum', gebelikAktif: true })).moduller, ['gebelik', 'jinekoloji'])
    assert.deepEqual(portalModulleri(g({ doktorBransi: 'dahiliye', kdKaydi: true, dahiliyeKaydi: true })).moduller, ['dahiliye'])
  })
  it('baseline-branch doctor (aile hekimi) gets chart-data modules only when that data exists', () => {
    assert.deepEqual(portalModulleri(g({ doktorBransi: 'aile-hekimligi' })).moduller, [])
    assert.deepEqual(portalModulleri(g({ doktorBransi: 'aile-hekimligi', kdKaydi: true, dahiliyeKaydi: true })).moduller.sort(), ['dahiliye', 'jinekoloji'])
  })
  // DERM-EXCEPTIONAL-01: Derim Strong (hekim tetiklemeli hatırlatma).
  it('dermatoloji mounts Derim (Strong) — unique from göz / pediatri', () => {
    const m = specialtyProfile('dermatoloji').portal!
    assert.equal(m[0].derinlik, 'Strong')
    assert.deepEqual(m[0].nav.map((n) => n.path), ['/derim'])
    assert.deepEqual(portalModulleri(g({ doktorBransi: 'Dermatoloji', hastaYasYil: 5, buyumeOlcumu: true, kdKaydi: true })).moduller, ['dermatoloji'])
    assert.deepEqual(portalModulleri(g({ doktorBransi: 'Dermatoloji' })).nav[0]?.label, 'Derim')
  })
  it('free-text users.specialty resolves', () => {
    assert.equal(portalBransAnahtari('İç Hastalıkları'), 'dahiliye')
    assert.equal(portalBransAnahtari('Göz Hastalıkları Uzmanı'), 'goz-hastaliklari')
    assert.equal(portalBransAnahtari('Kadın Hastalıkları ve Doğum'), 'kadin-hastaliklari-dogum')
    assert.equal(portalBransAnahtari(null), null)
  })
})

describe('registry contract', () => {
  it('every chapter beyond baseline declares a portal module; nav only from the registry', () => {
    for (const k of ['pediatri', 'kadin-hastaliklari-dogum', 'dermatoloji', 'dahiliye', 'goz-hastaliklari'] as const) {
      assert.ok((specialtyProfile(k).portal || []).length > 0, k)
    }
    assert.deepEqual(portalModulleri(g({ doktorBransi: 'dahiliye', dahiliyeKaydi: true })).nav.map((n) => n.key), ['takibim', 'on-anket'])
  })
  it('bundle carries typed module state; empty + demo bundles attach nothing', () => {
    assert.deepEqual(emptyPortalBundle().portal, { moduller: [], nav: [] })
    assert.equal(emptyPortalBundle().goz, null)
    assert.equal(emptyPortalBundle().deri, null)
    assert.ok(!portalModulAktif(SAGLIGIM_DEMO, 'buyume') && !portalModulAktif(SAGLIGIM_DEMO, 'gebelik'))
  })
  it('shell/Takip/API mount specialty slices only through the registry (no stacking just in case)', () => {
    const takip = fs.readFileSync(path.join(kok, 'app/portal/_components/TrackingView.tsx'), 'utf8')
    assert.ok(/portalModulAktif\(data, 'gebelik'\) && data\.gebelik/.test(takip))
    assert.ok(/buyumeModulu && data\.buyume/.test(takip))
    const api = fs.readFileSync(path.join(kok, 'app/api/portal/hasta/[token]/route.ts'), 'utf8')
    for (const id of ['buyume', 'gebelik', 'jinekoloji']) assert.ok(api.includes(`modulAktif('${id}')`), id)
    const shell = fs.readFileSync(path.join(kok, 'app/portal/_components/PortalShell.tsx'), 'utf8')
    assert.ok(shell.includes('[...NAV, ...ekNav]') && !/goz|pediatri|dahiliye/i.test(shell.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '').replace(/Gözlerim/g, '')))
  })
})
