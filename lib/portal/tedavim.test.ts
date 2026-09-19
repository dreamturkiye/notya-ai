/**
 * ONKOLOJI-EXCEPTIONAL-01 — Sağlığım › Tedavim portal kilitleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { ONKOLOJI_PROFILE } from '@/lib/specialties/onkoloji'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import {
  gorevBasligi, tedavimHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, TEDAVIM_NOTU, ONKO_IPUCLARI,
} from '@/specialties/onkoloji/engines/portal-tedavim'

const kok = path.join(import.meta.dirname, '../..')
const oku = (r: string) => fs.readFileSync(path.join(kok, r), 'utf8')
const g = (doktorBransi: string | null) => ({
  doktorBransi, hastaYasYil: 45, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

describe('ONKOLOJI-EXCEPTIONAL-01 Tedavim portal', () => {
  it('profile Strong + /tedavim', () => {
    const m = ONKOLOJI_PROFILE.portal![0]
    assert.equal(m.id, 'tedavim')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/tedavim'])
  })

  it('yalnız onkoloji hekimi görür; dahiliye ve yabancı branş görmez', () => {
    for (const kendi of ['onkoloji', 'Onkoloji', 'Tıbbi Onkoloji']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('tedavim'), `${kendi}`)
    }
    for (const yabanci of ['dahiliye', 'pediatri', 'kardiyoloji', 'endokrinoloji', 'nefroloji', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('tedavim'), `${yabanci}`)
    }
  })

  it('empty bundle onko null', () => {
    assert.equal(emptyPortalBundle().onko, null)
  })

  it('page gates on tedavim module', () => {
    const page = oku('app/portal/hasta/[token]/tedavim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'tedavim'\)/)
  })

  it('bundle route builds onko only when modulAktif tedavim', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('tedavim'\)/)
    assert.match(rota, /tedavimHatirlatmalari\(/)
  })

  it('hasta dili temiz; tanı/evre/doz yok', () => {
    assert.ok(hastaDiliTemizMi(TEDAVIM_NOTU))
    assert.ok(ONKO_IPUCLARI.every((x) => hastaDiliTemizMi(x)))
    assert.equal(hastaDiliTemizMi('evre III kanser'), false)
    assert.equal(gorevBasligi('kur_sonraki'), 'Tedavi / kür günü')
    const liste = tedavimHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'kur_sonraki', due: '2026-09-25' }],
      sonrakiKontrolIso: '2026-10-01',
    })
    assert.ok(liste.length >= 1)
    assert.ok(sonrakiKontrol(liste))
  })

  it('foreign module token does not activate tedavim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['dahiliye'] } }, 'tedavim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['tedavim'] } }, 'tedavim'), true)
  })
})
