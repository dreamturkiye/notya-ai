import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  parseBoyGirdi,
  hesaplaHedefBoy,
  formatBoyCm,
  cinsiyetHedefBoy,
  pediatriHedefBoyBransi,
} from './hedefBoy'

function cmOf(raw: string | number) {
  const r = parseBoyGirdi(raw)
  assert.equal(r.ok, true, String(raw))
  return r.ok ? r.cm : 0
}

describe('hedefBoy (mid-parental height)', () => {
  it('parses centimetres and metres the way TR clinics type them', () => {
    assert.equal(cmOf('182'), 182)
    assert.equal(cmOf('1.82'), 182)
    assert.equal(cmOf('1,79 m'), 179)
    assert.equal(cmOf('165cm'), 165)
    assert.equal(cmOf('1.82cm'), 182)
  })

  it('Tanner: boy (180 + 165 + 13) / 2 = 179 cm', () => {
    const r = hesaplaHedefBoy({ anneBoy: 165, babaBoy: 180, cinsiyet: 'erkek' })
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.sonuc.cocukCm, 179)
      assert.equal(r.sonuc.altCm, 170.5)
      assert.equal(r.sonuc.ustCm, 187.5)
      assert.equal(r.sonuc.formul, '(baba + anne + 13) / 2')
    }
  })

  it('Tanner: girl (180 + 165 − 13) / 2 = 166 cm', () => {
    const r = hesaplaHedefBoy({ anneBoy: '1.65', babaBoy: '1.80', cinsiyet: 'Kadın' })
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.sonuc.cocukCm, 166)
      assert.equal(r.sonuc.cinsiyet, 'kiz')
    }
  })

  it('refuses missing child sex and out-of-range adult height', () => {
    assert.equal(hesaplaHedefBoy({ anneBoy: 165, babaBoy: 180, cinsiyet: null }).ok, false)
    assert.equal(parseBoyGirdi('90').ok, false)
    assert.equal(parseBoyGirdi('250').ok, false)
  })

  it('TR clinic example: baba 1.82 m, anne 1.79 m, erkek → 187 cm', () => {
    const r = hesaplaHedefBoy({ anneBoy: '1.79', babaBoy: '1.82', cinsiyet: 'erkek' })
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.sonuc.cocukCm, 187)
      assert.equal(r.sonuc.anneCm, 179)
      assert.equal(r.sonuc.babaCm, 182)
    }
  })

  it('maps TR gender labels and formats cm + metres', () => {
    assert.equal(cinsiyetHedefBoy('kız'), 'kiz')
    assert.equal(cinsiyetHedefBoy('Erkek'), 'erkek')
    assert.equal(formatBoyCm(182), '182 cm (1,82 m)')
  })

  it('is a pediatrics-only tool — KD / derm / empty specialty stay out', () => {
    assert.equal(pediatriHedefBoyBransi('pediatri'), true)
    assert.equal(pediatriHedefBoyBransi('Pediatri'), true)
    assert.equal(pediatriHedefBoyBransi('Çocuk Sağlığı ve Hastalıkları'), true)
    assert.equal(pediatriHedefBoyBransi('kadin-hastaliklari-dogum'), false)
    assert.equal(pediatriHedefBoyBransi('dermatoloji'), false)
    assert.equal(pediatriHedefBoyBransi('dahiliye'), false)
    assert.equal(pediatriHedefBoyBransi('cocuk-cerrahisi'), false)
    assert.equal(pediatriHedefBoyBransi(null), false)
  })

  it('Araçlar / dashboard / Ayarlar do not mount Hedef Boy for every doctor', () => {
    const root = join(import.meta.dirname, '../..')
    const tools = readFileSync(join(root, 'app/doktor-tools/page.tsx'), 'utf8')
    const dash = readFileSync(join(root, 'app/dashboard/doktor/page.tsx'), 'utf8')
    const ayar = readFileSync(join(root, 'app/dashboard/doktor/ayarlar/page.tsx'), 'utf8')
    const demo = readFileSync(join(root, 'lib/portal/demoData.ts'), 'utf8')
    assert.match(tools, /usePediatriHedefBoy/)
    assert.match(dash, /pediatriHedefBoyBransi/)
    assert.doesNotMatch(ayar, /Hedef Boy/)
    assert.match(demo, /hedefBoy:\s*null/)
  })

  it('ships 3D cartoon family cutouts for the Araçlar studio', () => {
    const root = join(import.meta.dirname, '../..')
    const manken = readFileSync(join(root, 'components/hedefBoy/HedefBoyManken.tsx'), 'utf8')
    assert.match(manken, /\/hedef-boy\/baba\.png/)
    assert.match(manken, /\/hedef-boy\/anne\.png/)
    assert.match(manken, /\/hedef-boy\/cocuk-erkek\.png/)
    assert.match(manken, /\/hedef-boy\/cocuk-kiz\.png/)
    assert.match(manken, /sonuc\.cinsiyet === 'kiz'/)
    const panel = readFileSync(join(root, 'components/hedefBoy/HedefBoyAracPaneli.tsx'), 'utf8')
    assert.match(panel, /HedefBoySahneBos tema="doktor" cinsiyet=\{cinsiyet\}/)
    for (const ad of ['baba', 'anne', 'cocuk-erkek', 'cocuk-kiz']) {
      const buf = readFileSync(join(root, `public/hedef-boy/${ad}.png`))
      assert.ok(buf.length > 50_000, ad)
      assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    }
  })
})
