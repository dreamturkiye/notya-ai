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

  it('route fills hasta only after requirePortalUnlock, scoped to token doctor, name + under-18 flag only', () => {
    const src = oku(ROTA)
    const kilit = src.indexOf('if (locked) return locked')
    const atama = src.indexOf('bundle.hasta = { adSoyad: hastaAdSoyad(coz(hastaRow?.name_encrypted)), onSekizAlti: veliOnamGerekliMi(dogumIso) }')
    assert.ok(kilit > 0 && atama > kilit, 'hasta adı PIN kontrolünden sonra atanmalı')
    assert.match(src, /from\('patients'\)\.select\('name_encrypted, [^']*'\)\.eq\('id', patientId\)\.eq\('doctor_id', doctorId\)/)
    // only adSoyad + the boolean onSekizAlti on bundle.hasta — no T.C., doğum tarihi or iletişim
    assert.equal((src.match(/bundle\.hasta\s*=/g) || []).length, 1)
    assert.doesNotMatch(src, /bundle\.hasta\.\w+\s*=/)
  })

  // PORTAL-REGRESYON-2026-11-25: the live home is Bugün (HASTA-PORTALI-GUNLUK); HomeHero is now only the göz / KBB demo
  // home, drawn through the shared PortalOzetGorunumu since 9fa006b3 — so the identity checks follow the real screens.
  it('UI: header name on every page; Bugün greets an adult by first name, never a minor (identity line instead)', () => {
    const ozet = oku('components/doktor/portal/PortalOzetGorunumu.tsx')
    assert.match(ozet, /\{hastaAdi \? \(/)
    assert.match(ozet, /sg-hero-hasta-etiket/)
    assert.doesNotMatch(ozet, /Merhaba/)
    // header name: PortalShell passes it, the shared frame (since 9fa006b3) draws it only when set
    assert.match(oku('app/portal/_components/PortalShell.tsx'), /hastaAdi=\{hastaAdi\}/)
    assert.match(oku('components/doktor/portal/PortalKabukGorunumu.tsx'), /\{hastaAdi \? \(/)
    assert.match(oku('app/portal/hasta/[token]/page.tsx'), /<BugunSayfasi \/>/)
    const sayfa = oku('app/portal/_components/saglikEvi/Sayfalar.tsx')
    assert.match(sayfa, /hastaAdi=\{data\.hasta\?\.adSoyad \|\| null\}/)
    assert.match(sayfa, /veli: !!data\.hasta\?\.onSekizAlti/)
    const bugun = oku('components/doktor/portal/saglikEvi/BugunGorunumu.tsx')
    assert.match(bugun, /ad && !kopru\.veli \? `, \$\{ad\}`/)
    assert.doesNotMatch(bugun, /Merhaba/)
    assert.doesNotMatch(oku('app/portal/_components/PinGate.tsx'), /adSoyad|hastaAdi/)
  })
})
