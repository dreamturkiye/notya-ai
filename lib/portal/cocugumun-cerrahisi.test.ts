/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Çocuğumun Cerrahisi portal module.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { COCUK_CERRAHISI_PROFILE } from '@/lib/specialties/cocuk-cerrahisi'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { hastaDiliTemizMi, COCUGUMUN_CERRAHISI_NOTU } from '@/specialties/cocuk-cerrahisi/engines/portal-cocugumun-cerrahisi'
import type { PortalUygunlukGirdisi } from '@/lib/portal/moduller'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

const g = (doktorBransi: string | null): PortalUygunlukGirdisi => ({
  doktorBransi,
  hastaYasYil: 6,
  buyumeOlcumu: false,
  gebelikAktif: false,
  kdKaydi: false,
  dahiliyeKaydi: false,
})

describe('Çocuğumun Cerrahisi portal module', () => {
  it('profile declares Strong module', () => {
    assert.equal(COCUK_CERRAHISI_PROFILE.portal?.[0]?.id, 'cocugumun-cerrahisi')
    assert.equal(COCUK_CERRAHISI_PROFILE.portal?.[0]?.derinlik, 'Strong')
    assert.equal(COCUK_CERRAHISI_PROFILE.olgunluk, 'beta-hazir')
  })

  it('yalnız cocuk-cerrahisi hekimi görür; pediatri ve yabancı branş görmez', () => {
    for (const kendi of ['cocuk-cerrahisi', 'Çocuk Cerrahisi', 'Cocuk Cerrahisi']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('cocugumun-cerrahisi'), `${kendi}`)
    }
    for (const yabanci of ['pediatri', 'genel-cerrahi', 'ortopedi', 'dahiliye', 'onkoloji', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('cocugumun-cerrahisi'), `${yabanci}`)
    }
  })

  it('pediatri buyume does not attach for cocuk-cerrahisi doctor', () => {
    const m = portalModulleri(g('cocuk-cerrahisi')).moduller
    assert.ok(m.includes('cocugumun-cerrahisi'))
    assert.ok(!m.includes('buyume'), 'çocuk cerrahisi hekimi büyüme portalını miras almamalı')
  })

  it('foreign modules never activate as cocugumun-cerrahisi', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['buyume'] } }, 'cocugumun-cerrahisi'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['cocugumun-cerrahisi'] } }, 'cocugumun-cerrahisi'), true)
  })

  it('patient-safe copy lock', () => {
    assert.ok(hastaDiliTemizMi(COCUGUMUN_CERRAHISI_NOTU))
    for (const k of Object.keys(BRANS_ETIKETLERI) as SpecialtyKey[]) {
      if (k === 'cocuk-cerrahisi') continue
      assert.ok(!portalModulleri(g(k)).moduller.includes('cocugumun-cerrahisi'), k)
    }
  })
})
