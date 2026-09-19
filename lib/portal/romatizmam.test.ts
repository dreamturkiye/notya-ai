/**
 * ROMATOLOJI-EXCEPTIONAL-01 — Sağlığım › Romatizmam portal kilidi.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROMATOLOJI_PROFILE } from '@/lib/specialties/romatoloji'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import {
  gorevBasligi, romatizmamHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, ROMATIZMAM_NOTU, ROMA_IPUCLARI,
} from '@/specialties/romatoloji/engines/portal-romatizmam'

const oku = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const g = (doktorBransi: string) => ({
  doktorBransi, hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

describe('ROMATOLOJI-EXCEPTIONAL-01 Romatizmam', () => {
  it('profile Strong + /romatizmam', () => {
    const m = ROMATOLOJI_PROFILE.portal![0]
    assert.equal(m.id, 'romatizmam')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/romatizmam'])
  })

  it('yalnız romatoloji hekimi görür; ortopedi/FTR/dahiliye görmez', () => {
    for (const kendi of ['romatoloji', 'Romatoloji']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('romatizmam'), `${kendi}`)
    }
    for (const yabanci of ['ortopedi', 'fizik-tedavi', 'dahiliye', 'endokrinoloji', 'kardiyoloji']) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('romatizmam'), `${yabanci}`)
    }
  })

  it('page gates on romatizmam module', () => {
    const page = oku('app/portal/hasta/[token]/romatizmam/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'romatizmam'\)/)
  })

  it('bundle route builds roma only when modulAktif romatizmam', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('romatizmam'\)/)
    assert.match(rota, /romatizmamHatirlatmalari\(/)
  })

  it('hatırlatmalar hasta-güvenli', () => {
    const liste = romatizmamHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'lab_crp', due: '2026-09-25' }, { kod: 'skor_das28', due: '2026-10-01' }],
      sonrakiKontrolIso: '2026-10-10',
    })
    assert.ok(liste.some((h) => h.ad === 'Kan tahlili kontrolü'))
    assert.ok(sonrakiKontrol(liste))
    assert.equal(gorevBasligi('lab_crp'), 'Kan tahlili kontrolü')
    assert.ok(hastaDiliTemizMi(ROMATIZMAM_NOTU))
    assert.ok(ROMA_IPUCLARI.length >= 2)
  })

  it('foreign module token does not activate romatizmam', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['eklemlerim'] } }, 'romatizmam'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['romatizmam'] } }, 'romatizmam'), true)
  })

  it('empty bundle has roma null', () => {
    assert.equal(emptyPortalBundle().roma, null)
  })
})
