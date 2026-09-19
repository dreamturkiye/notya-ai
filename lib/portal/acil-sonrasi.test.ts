/**
 * ACIL-TIP-EXCEPTIONAL-01 — Sağlığım › Acil sonrası takip portal kilitleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { ACIL_TIP_PROFILE } from '@/lib/specialties/acil-tip'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import {
  gorevBasligi, acilSonrasiHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, ACIL_SONRASI_NOTU, ACIL_SONRASI_IPUCLARI,
} from '@/specialties/acil-tip/engines/portal-acil-sonrasi'

const kok = path.join(import.meta.dirname, '../..')
const oku = (r: string) => fs.readFileSync(path.join(kok, r), 'utf8')
const g = (doktorBransi: string | null) => ({
  doktorBransi, hastaYasYil: 45, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

describe('ACIL-TIP-EXCEPTIONAL-01 Acil sonrası takip portal', () => {
  it('profile Strong + /acil-sonrasi', () => {
    const m = ACIL_TIP_PROFILE.portal![0]
    assert.equal(m.id, 'acil-sonrasi')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/acil-sonrasi'])
  })

  it('yalnız acil-tip hekimi görür; kardiyoloji/nöroloji ve yabancı branş görmez', () => {
    for (const kendi of ['acil-tip', 'Acil Tıp', 'Emergency Medicine']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('acil-sonrasi'), `${kendi}`)
    }
    for (const yabanci of ['kardiyoloji', 'noroloji', 'anestezi', 'dahiliye', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('acil-sonrasi'), `${yabanci}`)
    }
  })

  it('empty bundle acilSonrasi null', () => {
    assert.equal(emptyPortalBundle().acilSonrasi, null)
  })

  it('page gates on acil-sonrasi module', () => {
    const page = oku('app/portal/hasta/[token]/acil-sonrasi/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'acil-sonrasi'\)/)
  })

  it('bundle route builds acilSonrasi only when modulAktif acil-sonrasi', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('acil-sonrasi'\)/)
    assert.match(rota, /acilSonrasiHatirlatmalari\(/)
  })

  it('hasta dili temiz + ipuçları', () => {
    assert.ok(hastaDiliTemizMi(ACIL_SONRASI_NOTU))
    assert.ok(ACIL_SONRASI_IPUCLARI.every((x) => hastaDiliTemizMi(x)))
    assert.equal(gorevBasligi('taburcu_kontrol'), 'Acil sonrası kontrol')
    const h = acilSonrasiHatirlatmalari({ bugun: '2026-09-19', gorevler: [{ kod: 'taburcu_kontrol', due: '2026-09-25' }], sonrakiKontrolIso: null })
    assert.ok(sonrakiKontrol(h))
  })
})
