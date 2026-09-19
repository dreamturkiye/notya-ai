/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — Sağlığım › FTR'm portal kilidi.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { FIZIK_TEDAVI_PROFILE } from '@/lib/specialties/fizik-tedavi'
import {
  gorevBasligi, ftrmHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, FTRM_NOTU, FTR_IPUCLARI,
} from '@/specialties/fizik-tedavi/engines/portal-ftrm'
import type { PortalUygunlukGirdisi } from '@/lib/portal/moduller'

const g = (doktorBransi: string): PortalUygunlukGirdisi => ({
  doktorBransi, hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

const oku = (rel: string) => fs.readFileSync(path.join(import.meta.dirname, '../..', rel), 'utf8')

describe("FTR'm portal", () => {
  it('profile Strong + /ftrm', () => {
    const m = FIZIK_TEDAVI_PROFILE.portal![0]
    assert.equal(m.id, 'ftrm')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/ftrm'])
  })

  it('yalnız fizik-tedavi hekimi görür; yabancı branş görmez', () => {
    for (const kendi of ['fizik-tedavi', 'Fizik Tedavi', 'Fiziksel Tıp ve Rehabilitasyon']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('ftrm'), `${kendi}`)
    }
    for (const yabanci of ['dahiliye', 'ortopedi', 'noroloji', 'pediatri', 'kardiyoloji', 'spor-hekimligi']) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('ftrm'), `${yabanci}`)
    }
  })

  it('empty bundle ftr null', () => {
    assert.equal(emptyPortalBundle().ftr, null)
  })

  it('page gates on ftrm module', () => {
    const page = oku('app/portal/hasta/[token]/ftrm/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'ftrm'\)/)
  })

  it('bundle route builds ftr only when modulAktif ftrm', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('ftrm'\)/)
    assert.match(rota, /ftrmHatirlatmalari\(/)
  })

  it('foreign module token does not activate ftrm', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['eklemlerim'] } }, 'ftrm'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['ftrm'] } }, 'ftrm'), true)
  })

  it('görev kodları hasta-güvenli başlığa çevrilir', () => {
    assert.equal(gorevBasligi('seans_takip'), 'Tedavi seansı')
    assert.equal(gorevBasligi('egzersiz_kontrol'), 'Ev egzersiz kontrolü')
    assert.equal(gorevBasligi('vas_tekrar'), 'Ağrı / fonksiyon formu')
    assert.equal(gorevBasligi('kontrol_randevu'), 'Kontrol randevusu')
  })

  it('hatırlatmalar ve not hasta dili temiz', () => {
    const liste = ftrmHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'seans_takip', due: '2026-09-25' }, { kod: 'vas_tekrar', due: '2026-10-01' }],
      sonrakiKontrolIso: '2026-10-10',
    })
    assert.ok(liste.length >= 2)
    assert.ok(sonrakiKontrol(liste))
    for (const h of liste) assert.ok(hastaDiliTemizMi(h.ad), h.ad)
    assert.ok(hastaDiliTemizMi(FTRM_NOTU))
    for (const x of FTR_IPUCLARI) assert.ok(hastaDiliTemizMi(x), x)
  })
})
