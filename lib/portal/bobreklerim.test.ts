/**
 * NEFROLOJI-EXCEPTIONAL-01 — Böbreklerim portal kilidi.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { NEFROLOJI_PROFILE } from '@/lib/specialties/nefroloji'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import {
  gorevBasligi, bobreklerimHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, BOBREKLERIM_NOTU, NEF_IPUCLARI,
} from '@/specialties/nefroloji/engines/portal-bobreklerim'

const g = (brans: string | null) => ({
  doktorBransi: brans, hastaYasYil: 45, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})
const oku = (rel: string) => readFileSync(join(import.meta.dirname, '../..', rel), 'utf8')

describe('Böbreklerim portal', () => {
  it('profile Strong + /bobreklerim', () => {
    const m = NEFROLOJI_PROFILE.portal![0]
    assert.equal(m.id, 'bobreklerim')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/bobreklerim'])
  })

  it('yalnız nefroloji hekimi görür; dahiliye ve yabancı branş görmez', () => {
    for (const kendi of ['nefroloji', 'Nefroloji', 'Böbrek Hastalıkları']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('bobreklerim'), `${kendi}`)
    }
    for (const yabanci of Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'nefroloji')) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('bobreklerim'), `${yabanci}`)
    }
  })

  it('empty bundle nef null', () => {
    assert.equal(emptyPortalBundle().nef, null)
  })

  it('page gates on bobreklerim module', () => {
    const page = oku('app/portal/hasta/[token]/bobreklerim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'bobreklerim'\)/)
  })

  it('bundle route builds nef only when modulAktif bobreklerim', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('bobreklerim'\)/)
    assert.match(rota, /bobreklerimHatirlatmalari\(/)
  })

  it('görev başlıkları hasta-güvenli', () => {
    assert.equal(gorevBasligi('egfr_izlem'), 'Kan tahlili kontrolü')
    assert.equal(gorevBasligi('diyaliz_seans'), 'Diyaliz seans / takip')
    const liste = bobreklerimHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'egfr_izlem', due: '2026-09-25' }],
      sonrakiKontrolIso: '2026-10-01',
    })
    assert.ok(liste.length >= 1)
    assert.ok(sonrakiKontrol(liste))
    assert.ok(hastaDiliTemizMi(BOBREKLERIM_NOTU))
    for (const i of NEF_IPUCLARI) assert.ok(hastaDiliTemizMi(i))
  })

  it('foreign module token does not activate bobreklerim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['dahiliye'] } }, 'bobreklerim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['bobreklerim'] } }, 'bobreklerim'), true)
  })
})
