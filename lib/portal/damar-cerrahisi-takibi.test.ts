/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Portal Damar Cerrahisi takibi.
 * No SCORE2/Kalbim; kardiyoloji token never attaches this module.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { KALP_DAMAR_CERRAHISI_PROFILE } from '@/lib/specialties/kalp-damar-cerrahisi'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import {
  gorevBasligi, damarHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, DAMAR_TAKIP_NOTU, KDC_IPUCLARI,
} from '@/specialties/kalp-damar-cerrahisi/engines/portal-damar'

const g = (doktorBransi: string | null) => ({
  doktorBransi, hastaYasYil: 45, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

const oku = (rel: string) => fs.readFileSync(path.join(import.meta.dirname, '../..', rel), 'utf8')

describe('Damar Cerrahisi takibi portal', () => {
  it('profile Strong + /damar-cerrahisi-takibi', () => {
    const m = KALP_DAMAR_CERRAHISI_PROFILE.portal![0]
    assert.equal(m.id, 'damar-cerrahisi-takibi')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/damar-cerrahisi-takibi'])
  })

  it('yalnız kalp-damar-cerrahisi hekimi görür; kardiyoloji ve yabancı branş görmez', () => {
    for (const kendi of ['kalp-damar-cerrahisi', 'Kalp Damar Cerrahisi', 'Kalp ve Damar Cerrahisi']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('damar-cerrahisi-takibi'), `${kendi}`)
      assert.ok(!portalModulleri(g(kendi)).moduller.includes('kalbim'), `${kendi} must not get Kalbim`)
    }
    for (const yabanci of ['kardiyoloji', 'Kardiyoloji', 'dahiliye', 'genel-cerrahi', 'gogus-cerrahisi', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('damar-cerrahisi-takibi'), `${yabanci}`)
    }
  })

  it('empty bundle damarCerrahisi null', () => {
    assert.equal(emptyPortalBundle().damarCerrahisi, null)
  })

  it('page gates on damar-cerrahisi-takibi module', () => {
    const page = oku('app/portal/hasta/[token]/damar-cerrahisi-takibi/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'damar-cerrahisi-takibi'\)/)
  })

  it('bundle route builds damarCerrahisi only when modulAktif', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('damar-cerrahisi-takibi'\)/)
    assert.match(rota, /damarHatirlatmalari\(/)
    assert.match(rota, /kdc_gorevleri/)
    assert.doesNotMatch(rota.slice(rota.indexOf("modulAktif('damar-cerrahisi-takibi')"), rota.indexOf("modulAktif('damar-cerrahisi-takibi')") + 900), /SCORE2|Kalbim|kalbim/)
  })

  it('hatırlatma başlıkları hasta-güvenli', () => {
    assert.equal(gorevBasligi('greft_yara_greft'), 'Greft / yara kontrolü')
    const liste = damarHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'antikoag_lab', due: '2026-09-25' }],
      sonrakiKontrolIso: '2026-10-01',
    })
    assert.ok(liste.length >= 1)
    assert.ok(sonrakiKontrol(liste))
    assert.ok(hastaDiliTemizMi(DAMAR_TAKIP_NOTU))
    for (const i of KDC_IPUCLARI) assert.ok(hastaDiliTemizMi(i), i)
  })

  it('foreign module token does not activate', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['kalbim'] } }, 'damar-cerrahisi-takibi'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['damar-cerrahisi-takibi'] } }, 'damar-cerrahisi-takibi'), true)
  })
})
