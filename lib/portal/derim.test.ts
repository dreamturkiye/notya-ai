import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { portalModulAktif } from './moduller'
import { specialtyProfile } from '../specialties/registry'

const oku = (p: string) => fs.readFileSync(path.join(import.meta.dirname, '..', '..', p), 'utf8')

describe('Derim portal — patient-safe + registry gated', () => {
  it('dermatoloji profile declares Derim Partial with /derim nav', () => {
    const m = specialtyProfile('dermatoloji').portal![0]
    assert.equal(m.derinlik, 'Partial')
    assert.equal(m.nav[0]?.path, '/derim')
    assert.ok(m.views.includes('DerimView'))
  })
  it('DerimView has no diagnosis / morph / score language', () => {
    const src = oku('app/portal/_components/DerimView.tsx')
    assert.ok(!/psoriasis|melanom|PASI|BSA|ABCDE|tanınız/i.test(src))
    assert.ok(/yorum ve tanı doktorunuzdadır/i.test(src))
  })
  it('route gated by dermatoloji module', () => {
    const page = oku('app/portal/hasta/[token]/derim/page.tsx')
    assert.ok(/portalModulAktif\(data, 'dermatoloji'\)/.test(page))
    assert.equal(portalModulAktif({ portal: { moduller: ['dermatoloji'], nav: [] } }, 'dermatoloji'), true)
    assert.equal(portalModulAktif({ portal: { moduller: ['gozlerim'], nav: [] } }, 'dermatoloji'), false)
  })
})
