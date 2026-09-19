/**
 * ANESTEZI-EXCEPTIONAL-01 — Sağlığım › Anestezi Öncesi portal kilitleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { ANESTEZI_PROFILE } from '@/lib/specialties/anestezi'
import { portalModulleri } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import {
  gorevBasligi, anesteziOncesiHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, ANESTEZI_ONCESI_NOTU, ANESTEZI_IPUCLARI,
} from '@/specialties/anestezi/engines/portal-anestezi-oncesi'

const kok = path.join(import.meta.dirname, '../..')
const oku = (r: string) => fs.readFileSync(path.join(kok, r), 'utf8')
const g = (doktorBransi: string | null) => ({
  doktorBransi, hastaYasYil: 45, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

describe('ANESTEZI-EXCEPTIONAL-01 Anestezi Öncesi portal', () => {
  it('profile Strong + /anestezi-oncesi', () => {
    const m = ANESTEZI_PROFILE.portal![0]
    assert.equal(m.id, 'anestezi-oncesi')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/anestezi-oncesi'])
  })

  it('yalnız anestezi hekimi görür; genel-cerrahi ve yabancı branş görmez', () => {
    for (const kendi of ['anestezi', 'Anestezi', 'Anesteziyoloji']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('anestezi-oncesi'), `${kendi}`)
    }
    for (const yabanci of ['genel-cerrahi', 'gogus-cerrahisi', 'dahiliye', 'kardiyoloji', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('anestezi-oncesi'), `${yabanci}`)
    }
  })

  it('empty bundle anestezi null', () => {
    assert.equal(emptyPortalBundle().anestezi, null)
  })

  it('page gates on anestezi-oncesi module', () => {
    const page = oku('app/portal/hasta/[token]/anestezi-oncesi/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'anestezi-oncesi'\)/)
  })

  it('bundle route builds anestezi only when modulAktif anestezi-oncesi', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('anestezi-oncesi'\)/)
    assert.match(rota, /anesteziOncesiHatirlatmalari\(/)
  })

  it('hasta dili temiz + ipuçları', () => {
    assert.ok(hastaDiliTemizMi(ANESTEZI_ONCESI_NOTU))
    assert.ok(ANESTEZI_IPUCLARI.every((x) => hastaDiliTemizMi(x)))
    assert.equal(gorevBasligi('asa_kontrol_randevu'), 'Anestezi öncesi değerlendirme')
    const h = anesteziOncesiHatirlatmalari({ bugun: '2026-09-19', gorevler: [{ kod: 'kontrol_randevu', due: '2026-09-25' }], sonrakiKontrolIso: null })
    assert.ok(sonrakiKontrol(h))
  })
})
