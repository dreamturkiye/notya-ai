/**
 * RADYOLOJI-EXCEPTIONAL-01 — Sağlığım › Tetkiklerim portal kilitleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { RADYOLOJI_PROFILE } from '@/lib/specialties/radyoloji'
import { portalModulleri } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import {
  gorevBasligi, tetkiklerimHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, TETKIKLERIM_NOTU, TETKIKLERIM_IPUCLARI,
} from '@/specialties/radyoloji/engines/portal-tetkiklerim'

const kok = path.join(import.meta.dirname, '../..')
const oku = (r: string) => fs.readFileSync(path.join(kok, r), 'utf8')
const g = (doktorBransi: string | null) => ({
  doktorBransi, hastaYasYil: 45, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

describe('RADYOLOJI-EXCEPTIONAL-01 Tetkiklerim portal', () => {
  it('profile Strong + /tetkiklerim', () => {
    const m = RADYOLOJI_PROFILE.portal![0]
    assert.equal(m.id, 'tetkiklerim')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/tetkiklerim'])
  })

  it('yalnız radyoloji hekimi görür; yabancı branş görmez', () => {
    for (const kendi of ['radyoloji', 'Radyoloji', 'Radiology']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('tetkiklerim'), `${kendi}`)
    }
    for (const yabanci of ['dahiliye', 'onkoloji', 'gogus-hastaliklari', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('tetkiklerim'), `${yabanci}`)
    }
  })

  it('empty bundle radyo null', () => {
    assert.equal(emptyPortalBundle().radyo, null)
  })

  it('page gates on tetkiklerim module', () => {
    const page = oku('app/portal/hasta/[token]/tetkiklerim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'tetkiklerim'\)/)
  })

  it('bundle route builds radyo only when modulAktif tetkiklerim', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('tetkiklerim'\)/)
    assert.match(rota, /tetkiklerimHatirlatmalari\(/)
  })

  it('hasta dili temiz + ipuçları (BI-RADS sayı yok)', () => {
    assert.ok(hastaDiliTemizMi(TETKIKLERIM_NOTU))
    assert.ok(TETKIKLERIM_IPUCLARI.every((x) => hastaDiliTemizMi(x)))
    assert.equal(gorevBasligi('kuyruk_bt'), 'Tetkik randevusu')
    const h = tetkiklerimHatirlatmalari({ bugun: '2026-09-19', gorevler: [{ kod: 'kontrol_randevu', due: '2026-09-25' }], sonrakiKontrolIso: null })
    assert.ok(sonrakiKontrol(h))
  })
})
