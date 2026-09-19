/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › Beyin Cerrahisi takibi portal kilitleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { BEYIN_CERRAHISI_PROFILE } from '@/lib/specialties/beyin-cerrahisi'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import {
  gorevBasligi, beyinTakipHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, BEYIN_TAKIP_NOTU, BEYIN_IPUCLARI,
} from '@/specialties/beyin-cerrahisi/engines/portal-beyin-takibi'

const kok = path.join(import.meta.dirname, '../..')
const oku = (r: string) => fs.readFileSync(path.join(kok, r), 'utf8')
const g = (doktorBransi: string | null) => ({
  doktorBransi, hastaYasYil: 45, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

describe('BEYIN-CERRAHISI-EXCEPTIONAL-01 Beyin Cerrahisi takibi portal', () => {
  it('profile Strong + /beyin-takibi', () => {
    const m = BEYIN_CERRAHISI_PROFILE.portal![0]
    assert.equal(m.id, 'beyin-takibi')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/beyin-takibi'])
  })

  it('yalnız beyin-cerrahisi hekimi görür; noroloji ve yabancı branş görmez', () => {
    for (const kendi of ['beyin-cerrahisi', 'Beyin Cerrahisi', 'Nöroşirürji']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('beyin-takibi'), `${kendi}`)
    }
    for (const yabanci of ['noroloji', 'dahiliye', 'genel-cerrahi', 'onkoloji', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('beyin-takibi'), `${yabanci}`)
    }
  })

  it('empty bundle beyin null', () => {
    assert.equal(emptyPortalBundle().beyin, null)
  })

  it('page gates on beyin-takibi module', () => {
    const page = oku('app/portal/hasta/[token]/beyin-takibi/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'beyin-takibi'\)/)
  })

  it('bundle route builds beyin only when modulAktif beyin-takibi', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('beyin-takibi'\)/)
    assert.match(rota, /beyinTakipHatirlatmalari\(/)
  })

  it('hasta dili temiz + ipuçları', () => {
    assert.ok(hastaDiliTemizMi(BEYIN_TAKIP_NOTU))
    assert.ok(BEYIN_IPUCLARI.every((x) => hastaDiliTemizMi(x)))
    assert.equal(gorevBasligi('postop_yara'), 'Ameliyat sonrası kontrol')
    const h = beyinTakipHatirlatmalari({ bugun: '2026-09-19', gorevler: [{ kod: 'kontrol_randevu', due: '2026-09-25' }], sonrakiKontrolIso: null })
    assert.ok(sonrakiKontrol(h))
  })
})
