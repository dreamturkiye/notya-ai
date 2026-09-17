import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { SAGLIGIM_DEMO, SAGLIGIM_DEMO_GOZ } from './demoData'
import { portalModulAktif } from './moduller'

// GOZ-PORTAL — Sağlığım "Gözlerim" (.cursor/skills/specialty-hasta-portali/SKILL.md, Göz).
const kok = path.join(import.meta.dirname, '..', '..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')

describe('göz demo fixture', () => {
  it('attaches only Gözlerim — no pediatri / KD slices', () => {
    assert.deepEqual(SAGLIGIM_DEMO_GOZ.portal?.moduller, ['gozlerim'])
    assert.deepEqual(SAGLIGIM_DEMO_GOZ.portal?.nav.map((n) => n.path), ['/gozlerim'])
    assert.equal(SAGLIGIM_DEMO_GOZ.buyume, null)
    assert.equal(SAGLIGIM_DEMO_GOZ.gebelik, null)
    assert.equal(SAGLIGIM_DEMO_GOZ.jinekoloji, null)
    assert.equal(SAGLIGIM_DEMO_GOZ.hedefBoy, null)
    assert.ok(portalModulAktif(SAGLIGIM_DEMO_GOZ, 'gozlerim'))
    const g = SAGLIGIM_DEMO_GOZ.goz
    assert.ok(g)
    assert.equal(g.damlalar.length, 2)
    assert.ok(g.islemler.some((i) => i.durum === 'planli'))
    assert.equal(g.olcumler.length, 5)
    assert.equal(g.goruntuler.length, 2)
  })
  it('adult dahiliye demo has no göz slice and no Gözlerim module', () => {
    assert.equal(SAGLIGIM_DEMO.goz, null)
    assert.ok(!portalModulAktif(SAGLIGIM_DEMO, 'gozlerim'))
  })
  it('göz demo fixture never exposes drug names on injections or diagnosis words', () => {
    const g = SAGLIGIM_DEMO_GOZ.goz!
    for (const i of g.islemler) assert.match(i.ad, /^Göz içi (enjeksiyon|implant)$/)
    const metin = JSON.stringify(g)
    assert.doesNotMatch(metin, /glokomunuz|kötüleş|normal aralık|yüksek|düşük/i)
  })
})

describe('GozlerimView patient-facing copy', () => {
  const src = oku('app/portal/_components/GozlerimView.tsx')
  it('no diagnosis / interpretation language', () => {
    assert.doesNotMatch(src, /glokomunuz|kötüleş|normal aralık|yüksek|düşük|iyileş/i)
  })
  it('always shows the acil text and the clinic-recorded caption; drop checkbox is local-only', () => {
    assert.match(src, /HASTA_ACIL_METNI/)
    assert.match(src, /Klinikte ölçüldüğü gibidir; değerlendirmeyi doktorunuz yapar\./)
    assert.match(src, /localStorage/)
    assert.doesNotMatch(src, /fetch\(/)
  })
})

describe('portal API wiring', () => {
  const route = oku('app/api/portal/hasta/[token]/route.ts')
  it("göz slice built only when modulAktif('gozlerim')", () => {
    assert.ok(route.includes("modulAktif('gozlerim')"))
  })
  it('göz queries filter by patient and never select report / AI read text', () => {
    const blok = route.slice(route.indexOf("modulAktif('gozlerim')"), route.indexOf("[portal] gozlerim"))
    for (const t of ['goz_kontroller', 'goz_glokom', 'goz_enjeksiyonlar', 'goz_muayeneler']) assert.ok(blok.includes(`from('${t}')`), t)
    assert.equal((blok.match(/\.from\(/g) || []).length, (blok.match(/\.eq\('patient_id', patientId\)/g) || []).length)
    assert.doesNotMatch(blok, /rapor_metni|goz_goruntu_okumalari|taslak|uzman_metin/)
  })
  it('patient page gates on the module', () => {
    const page = oku('app/portal/hasta/[token]/gozlerim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'gozlerim'\)/)
    assert.match(page, /Bu bölüm göz hastalıkları takibinizde açılır\./)
  })
})
