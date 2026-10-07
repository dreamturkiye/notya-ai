/**
 * PORTAL-HASTA-ADI — patient name on Sağlığım: present after unlock, null when the record has none, nothing else exposed.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { hastaAdSoyad } from './hastaAdi'
import { emptyPortalBundle } from './emptyBundle'
import { SAGLIGIM_DEMO } from './demoData'

const kok = path.join(import.meta.dirname, '../..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
const ROTA = 'app/api/portal/hasta/[token]/route.ts'

describe('PORTAL-HASTA-ADI hasta adı', () => {
  it('decrypted { ad, soyad } → full name', () => {
    assert.equal(hastaAdSoyad(JSON.stringify({ ad: 'Işıl Şükrü', soyad: 'Ağaoğlu' })), 'Işıl Şükrü Ağaoğlu')
    assert.equal(hastaAdSoyad(JSON.stringify({ ad: '  Ece ', soyad: '' })), 'Ece')
  })

  it('no name on the record → null (no placeholder)', () => {
    assert.equal(hastaAdSoyad(null), null)
    assert.equal(hastaAdSoyad(''), null)
    assert.equal(hastaAdSoyad('{}'), null)
    assert.equal(hastaAdSoyad(JSON.stringify({ ad: ' ', soyad: '' })), null)
    assert.equal(hastaAdSoyad('bozuk-json'), null)
    assert.equal(hastaAdSoyad(JSON.stringify({ ad: 42, soyad: null })), null)
  })

  it('empty bundle (pre-unlock client state) carries no name; demo is synthetic', () => {
    assert.deepEqual(emptyPortalBundle().hasta, { adSoyad: null })
    assert.deepEqual(SAGLIGIM_DEMO.hasta, { adSoyad: 'Demo Hasta' })
  })

  it('route fills hasta only after requirePortalUnlock, scoped to token doctor, name only', () => {
    const src = oku(ROTA)
    const kilit = src.indexOf('if (locked) return locked')
    const atama = src.indexOf('bundle.hasta = { adSoyad: hastaAdSoyad(coz(hastaRow?.name_encrypted)) }')
    assert.ok(kilit > 0 && atama > kilit, 'hasta adı PIN kontrolünden sonra atanmalı')
    assert.match(src, /from\('patients'\)\.select\('name_encrypted, [^']*'\)\.eq\('id', patientId\)\.eq\('doctor_id', doctorId\)/)
    // only adSoyad on bundle.hasta — no T.C., doğum tarihi or iletişim
    assert.equal((src.match(/bundle\.hasta\s*=/g) || []).length, 1)
    assert.doesNotMatch(src, /bundle\.hasta\.\w+\s*=/)
  })

  it('UI: hero identity + header name, both hidden when null; no greeting', () => {
    const hero = oku('app/portal/_components/HomeHero.tsx')
    assert.match(hero, /\{hastaAdi \? \(/)
    assert.match(hero, /sg-hero-hasta-etiket">Hasta</)
    assert.doesNotMatch(hero, /Merhaba/)
    const shell = oku('app/portal/_components/PortalShell.tsx')
    assert.match(shell, /\{hastaAdi \? \(/)
    assert.doesNotMatch(oku('app/portal/_components/PinGate.tsx'), /adSoyad|hastaAdi/)
  })
})
