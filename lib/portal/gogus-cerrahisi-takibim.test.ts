/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Portal Göğüs Cerrahisi takibi.
 * No CAT/mMRC/Akciğerlerim; gogus-hastaliklari token never attaches this module.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { GOGUS_CERRAHISI_PROFILE } from '@/lib/specialties/gogus-cerrahisi'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import {
  gorevBasligi, takibimHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, TAKIBIM_NOTU, GC_IPUCLARI,
} from '@/specialties/gogus-cerrahisi/engines/portal-takibim'

const g = (doktorBransi: string | null) => ({
  doktorBransi, hastaYasYil: 45, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

const oku = (rel: string) => fs.readFileSync(path.join(import.meta.dirname, '../..', rel), 'utf8')

describe('Göğüs Cerrahisi takibi portal', () => {
  it('profile Strong + /gogus-cerrahisi-takibim', () => {
    const m = GOGUS_CERRAHISI_PROFILE.portal![0]
    assert.equal(m.id, 'gogus-cerrahisi-takibim')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/gogus-cerrahisi-takibim'])
  })

  it('yalnız gogus-cerrahisi hekimi görür; gogus-hastaliklari ve yabancı branş görmez', () => {
    for (const kendi of ['gogus-cerrahisi', 'Göğüs Cerrahisi', 'Göğüs Cerrahisi Uzmanı']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('gogus-cerrahisi-takibim'), `${kendi}`)
      assert.ok(!portalModulleri(g(kendi)).moduller.includes('akcigerlerim'), `${kendi} must not get Akciğerlerim`)
    }
    for (const yabanci of ['gogus-hastaliklari', 'Göğüs Hastalıkları', 'dahiliye', 'kardiyoloji', 'genel-cerrahi', 'onkoloji', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('gogus-cerrahisi-takibim'), `${yabanci}`)
    }
  })

  it('empty bundle gogusCerrahi null', () => {
    assert.equal(emptyPortalBundle().gogusCerrahi, null)
  })

  it('page gates on gogus-cerrahisi-takibim module', () => {
    const page = oku('app/portal/hasta/[token]/gogus-cerrahisi-takibim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'gogus-cerrahisi-takibim'\)/)
  })

  it('bundle route builds gogusCerrahi only when modulAktif', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('gogus-cerrahisi-takibim'\)/)
    assert.match(rota, /takibimHatirlatmalari\(/)
    assert.match(rota, /goc_gorevleri/)
    assert.doesNotMatch(rota.slice(rota.indexOf("modulAktif('gogus-cerrahisi-takibim')"), rota.indexOf("modulAktif('gogus-cerrahisi-takibim')") + 800), /CAT|mMRC|akcigerlerim/)
  })

  it('hatırlatma başlıkları hasta-güvenli', () => {
    assert.equal(gorevBasligi('tup_yara_toraks_tup'), 'Tüp / yara kontrolü')
    const liste = takibimHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'patoloji_rapor', due: '2026-09-25' }],
      sonrakiKontrolIso: '2026-10-01',
    })
    assert.ok(liste.length >= 1)
    assert.ok(sonrakiKontrol(liste))
    assert.ok(hastaDiliTemizMi(TAKIBIM_NOTU))
    for (const i of GC_IPUCLARI) assert.ok(hastaDiliTemizMi(i), i)
  })

  it('foreign module token does not activate', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['akcigerlerim'] } }, 'gogus-cerrahisi-takibim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['gogus-cerrahisi-takibim'] } }, 'gogus-cerrahisi-takibim'), true)
  })
})
