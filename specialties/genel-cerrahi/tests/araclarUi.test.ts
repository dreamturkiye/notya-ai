/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Araçlar UI / kabuk kilitleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const kok = process.cwd()
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')

describe('genel-cerrahi araçlar UI', () => {
  it('GcAracKabugu branş kapısı + genel cerrahi metni', () => {
    const kabuk = oku('specialties/genel-cerrahi/ui/araclar/GcAracKabugu.tsx')
    assert.match(kabuk, /doktorAraciBransaUygun\(route/)
    assert.match(kabuk, /Bu araç yalnızca genel cerrahi için\./)
  })
  it('4 studio sayfası GcAracKabugu kullanır; landing gömülü değil', () => {
    const landing = oku('app/doktor-tools/page.tsx')
    for (const r of ['gc-preop', 'gc-yara-dren', 'gc-patoloji', 'gc-kohort']) {
      const sayfa = oku(`app/doktor-tools/${r}/page.tsx`)
      assert.match(sayfa, /GcAracKabugu/)
      assert.doesNotMatch(landing, new RegExp(r))
    }
    assert.doesNotMatch(landing, /GcPreopAraci|GcYaraDrenAraci|GcPatolojiAraci|GcKohortAraci|gc-exceptional-audit/)
  })
  it('Home sticky + sekmeler', () => {
    const home = oku('specialties/genel-cerrahi/ui/GenelCerrahiHome.tsx')
    assert.match(home, /data-chapter="genel-cerrahi"/)
    assert.match(home, /Pre-op/)
    assert.match(home, /Yara\/Dren/)
    assert.match(home, /Patoloji/)
  })
})
