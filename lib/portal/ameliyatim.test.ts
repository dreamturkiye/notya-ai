/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Ameliyatım portal kilidi.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { GENEL_CERRAHI_PROFILE } from '@/lib/specialties/genel-cerrahi'
import { portalModulleri, portalModulAktif, type PortalUygunlukGirdisi } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import {
  gorevBasligi, ameliyatimHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, AMELIYATIM_NOTU, GC_IPUCLARI,
} from '@/specialties/genel-cerrahi/engines/portal-ameliyatim'

const oku = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const g = (doktorBransi: string | null): PortalUygunlukGirdisi => ({
  doktorBransi, hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

describe('Ameliyatım portal', () => {
  it('profile Strong + /ameliyatim', () => {
    const m = GENEL_CERRAHI_PROFILE.portal![0]
    assert.equal(m.id, 'ameliyatim')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/ameliyatim'])
  })

  it('module attaches for genel-cerrahi only', () => {
    for (const kendi of ['genel-cerrahi', 'Genel Cerrahi']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('ameliyatim'), `${kendi}`)
    }
    for (const yabanci of ['plastik-cerrahi', 'ortopedi', 'uroloji', 'dahiliye', 'onkoloji', 'pediatri', 'cocuk-cerrahisi']) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('ameliyatim'), `${yabanci}`)
    }
  })

  it('page gates on ameliyatim module', () => {
    const page = oku('app/portal/hasta/[token]/ameliyatim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'ameliyatim'\)/)
  })

  it('bundle route builds gc only when modulAktif ameliyatim', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('ameliyatim'\)/)
    assert.match(rota, /ameliyatimHatirlatmalari\(/)
    const blok = rota.slice(rota.indexOf("modulAktif('ameliyatim')"), rota.indexOf('[portal] ameliyatim'))
    assert.doesNotMatch(blok, /tanı|malign|doz|mg\b/i)
  })

  it('hatırlatma başlıkları hasta-güvenli', () => {
    assert.equal(gorevBasligi('preop_gun'), 'Ameliyat / işlem günü')
    assert.equal(gorevBasligi('yara_kontrol'), 'Yara / dren kontrolü')
    const liste = ameliyatimHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'preop_gun', due: '2026-09-25' }, { kod: 'patoloji_bekliyor', due: '2026-09-22' }],
      sonrakiKontrolIso: '2026-10-01',
    })
    assert.ok(liste.length >= 2)
    assert.ok(sonrakiKontrol(liste))
    assert.ok(hastaDiliTemizMi(AMELIYATIM_NOTU))
    for (const i of GC_IPUCLARI) assert.ok(hastaDiliTemizMi(i))
  })

  it('empty bundle gc null; foreign module token does not activate ameliyatim', () => {
    assert.equal(emptyPortalBundle().gc, null)
    assert.equal(portalModulAktif({ portal: { moduller: ['yaram'] } }, 'ameliyatim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['ameliyatim'] } }, 'ameliyatim'), true)
  })
})
