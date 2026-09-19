/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Sağlığım › Yaram portal kilidi.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { PLASTIK_CERRAHI_PROFILE } from '@/lib/specialties/plastik-cerrahi'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import {
  gorevBasligi, yaramHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, YARAM_NOTU, PLASTIK_IPUCLARI,
} from '@/specialties/plastik-cerrahi/engines/portal-yaram'

const g = (doktorBransi: string) => ({
  doktorBransi, hastaYasYil: 35, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

const oku = (p: string) => fs.readFileSync(path.join(import.meta.dirname, '../..', p), 'utf8')

describe('Yaram portal', () => {
  it('profile Strong + /yaram', () => {
    const m = PLASTIK_CERRAHI_PROFILE.portal![0]
    assert.equal(m.id, 'yaram')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/yaram'])
  })

  it('yalnız plastik-cerrahi hekimi görür; dermatoloji ve yabancı branş görmez', () => {
    for (const kendi of ['plastik-cerrahi', 'Plastik Cerrahi', 'Plastik Rekonstrüktif']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('yaram'), `${kendi}`)
    }
    for (const yabanci of ['dermatoloji', 'genel-cerrahi', 'dahiliye', 'onkoloji', 'pediatri', 'ortopedi']) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('yaram'), `${yabanci}`)
    }
  })

  it('page gates on yaram module', () => {
    const page = oku('app/portal/hasta/[token]/yaram/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'yaram'\)/)
  })

  it('bundle route builds plastik only when modulAktif yaram', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('yaram'\)/)
    assert.match(rota, /yaramHatirlatmalari\(/)
  })

  it('hatırlatma başlıkları hasta-güvenli', () => {
    assert.equal(gorevBasligi('pansuman_izlem'), 'Pansuman / yara bakımı')
    const liste = yaramHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'pansuman_izlem', due: '2026-09-22' }, { kod: 'foto_kontrol', due: '2026-09-25' }],
      sonrakiKontrolIso: '2026-10-01',
    })
    assert.ok(liste.length >= 2)
    assert.ok(sonrakiKontrol(liste))
    assert.ok(hastaDiliTemizMi(YARAM_NOTU))
    for (const i of PLASTIK_IPUCLARI) assert.ok(hastaDiliTemizMi(i))
    assert.equal(hastaDiliTemizMi('melanom tanısı'), false)
  })

  it('empty bundle plastik null; foreign module token does not activate yaram', () => {
    assert.equal(emptyPortalBundle().plastik, null)
    assert.equal(portalModulAktif({ portal: { moduller: ['dermatoloji'] } }, 'yaram'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['yaram'] } }, 'yaram'), true)
  })
})
