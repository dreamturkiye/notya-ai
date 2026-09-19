/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Sağlığım › Sindirimim portal kilidi.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { GASTROENTEROLOJI_PROFILE } from '@/lib/specialties/gastroenteroloji'
import {
  gorevBasligi, sindirimimHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, SINDIRIMIM_NOTU, GASTRO_IPUCLARI,
} from '@/specialties/gastroenteroloji/engines/portal-sindirimim'

const oku = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const g = (doktorBransi: string | null) => ({
  doktorBransi, hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

describe('GASTROENTEROLOJI-EXCEPTIONAL-01 Sindirimim portal', () => {
  it('profile Strong + /sindirimim', () => {
    const m = GASTROENTEROLOJI_PROFILE.portal![0]
    assert.equal(m.id, 'sindirimim')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/sindirimim'])
  })

  it('yalnız gastroenteroloji hekimi görür; dahiliye ve yabancı branş görmez', () => {
    for (const kendi of ['gastroenteroloji', 'Gastroenteroloji', 'Gastroenteroloji Uzmanı']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('sindirimim'), `${kendi}`)
    }
    for (const yabanci of ['dahiliye', 'endokrinoloji', 'pediatri', 'kardiyoloji', 'psikiyatri', null, '']) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('sindirimim'), `${yabanci}`)
    }
  })

  it('empty bundle gastro null', () => {
    assert.equal(emptyPortalBundle().gastro, null)
  })

  it('page gates on sindirimim module', () => {
    const page = oku('app/portal/hasta/[token]/sindirimim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'sindirimim'\)/)
  })

  it('bundle route builds gastro only when modulAktif sindirimim', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('sindirimim'\)/)
    assert.match(rota, /sindirimimHatirlatmalari\(/)
  })

  it('hatırlatmalar hasta-güvenli', () => {
    const liste = sindirimimHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [
        { kod: 'skor_mayo_kismi', due: '2026-10-01' },
        { kod: 'hepatit_hbv', due: '2026-11-01' },
        { kod: 'endoskopi_kolonoskopi', due: '2027-01-01' },
      ],
      sonrakiKontrolIso: '2026-10-15',
    })
    assert.ok(liste.length >= 3)
    assert.ok(sonrakiKontrol(liste))
    assert.ok(hastaDiliTemizMi(SINDIRIMIM_NOTU))
    for (const ip of GASTRO_IPUCLARI) assert.ok(hastaDiliTemizMi(ip))
    assert.equal(gorevBasligi('skor_mayo_kismi'), 'Takip formu kontrolü')
  })

  it('foreign module token does not activate sindirimim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['dahiliye'] } }, 'sindirimim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['sindirimim'] } }, 'sindirimim'), true)
  })
})
