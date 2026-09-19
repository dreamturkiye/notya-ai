/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — araç UI / kabuk / cross-leak source locks.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const kok = path.join(import.meta.dirname, '../../..')

describe('cocuk-cerrahisi araç UI locks', () => {
  it('CcAracKabugu gates with doktorAraciBransaUygun', () => {
    const kabuk = fs.readFileSync(path.join(kok, 'specialties/cocuk-cerrahisi/ui/araclar/CcAracKabugu.tsx'), 'utf8')
    assert.match(kabuk, /doktorAraciBransaUygun\(route/)
    assert.match(kabuk, /Bu araç yalnızca çocuk cerrahisi için\./)
  })

  it('studio pages use CcAracKabugu; no pediatri Hedef Boy mount', () => {
    for (const r of ['cc-prepost-op', 'cc-yara-dren', 'cc-onam-veli', 'cc-kohort']) {
      const sayfa = fs.readFileSync(path.join(kok, `app/doktor-tools/${r}/page.tsx`), 'utf8')
      assert.match(sayfa, /CcAracKabugu/)
      assert.doesNotMatch(sayfa, /HedefBoyManken|HastaBuyume|from '@\/components\/hedefBoy|from '@\/lib\/clinical\/hedefBoy/i)
    }
  })

  it('Home does not mount pediatri growth tools', () => {
    const home = fs.readFileSync(path.join(kok, 'specialties/cocuk-cerrahisi/ui/CocukCerrahisiHome.tsx'), 'utf8')
    assert.doesNotMatch(home, /HedefBoyManken|HastaBuyume|buyumeEgrisi|Mchat|from '@\/components\/hedefBoy/i)
    assert.match(home, /data-chapter="cocuk-cerrahisi"/)
  })
})