/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Sağlığım › Hormonlarım portal kilidi.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { ENDOKRINOLOJI_PROFILE } from '@/lib/specialties/endokrinoloji'
import {
  gorevBasligi, hormonlarimHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, HORMONLARIM_NOTU, ENDO_IPUCLARI,
} from '@/specialties/endokrinoloji/engines/portal-hormonlarim'
import type { PortalUygunlukGirdisi } from '@/lib/portal/moduller'

const g = (doktorBransi: string): PortalUygunlukGirdisi => ({
  doktorBransi, hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

const oku = (rel: string) => fs.readFileSync(path.join(import.meta.dirname, '../..', rel), 'utf8')

describe('Hormonlarım portal', () => {
  it('profile Strong + /hormonlarim', () => {
    const m = ENDOKRINOLOJI_PROFILE.portal![0]
    assert.equal(m.id, 'hormonlarim')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/hormonlarim'])
  })

  it('yalnız endokrinoloji hekimi görür; dahiliye ve yabancı branş görmez', () => {
    for (const kendi of ['endokrinoloji', 'Endokrinoloji', 'Endokrinoloji ve Metabolizma']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('hormonlarim'), `${kendi}`)
    }
    for (const yabanci of ['dahiliye', 'kulak-burun-bogaz', 'psikiyatri', 'pediatri', 'kardiyoloji', 'gogus-hastaliklari', 'noroloji']) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('hormonlarim'), `${yabanci}`)
    }
  })

  it('empty bundle endo null', () => {
    assert.equal(emptyPortalBundle().endo, null)
  })

  it('page gates on hormonlarim module', () => {
    const page = oku('app/portal/hasta/[token]/hormonlarim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'hormonlarim'\)/)
  })

  it('bundle route builds endo only when modulAktif hormonlarim', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('hormonlarim'\)/)
    assert.match(rota, /hormonlarimHatirlatmalari\(/)
  })

  it('görev kodları hasta-güvenli başlığa çevrilir', () => {
    assert.equal(gorevBasligi('lab_hba1c'), 'Kan tahlili kontrolü')
    assert.equal(gorevBasligi('dxa_tekrar'), 'Kemik yoğunluğu testi')
    assert.equal(gorevBasligi('rejim_insulin_kontrol'), 'İnsülin rejim kontrolü')
    assert.equal(gorevBasligi('kontrol_randevu'), 'Kontrol randevusu')
  })

  it('hatırlatmalar ve not hasta dili temiz', () => {
    const liste = hormonlarimHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'lab_hba1c', due: '2026-09-25' }, { kod: 'dxa_tekrar', due: '2026-10-01' }],
      sonrakiKontrolIso: '2026-10-10',
    })
    assert.ok(liste.length >= 2)
    assert.ok(sonrakiKontrol(liste))
    for (const h of liste) assert.ok(hastaDiliTemizMi(h.ad), h.ad)
    assert.ok(hastaDiliTemizMi(HORMONLARIM_NOTU))
    for (const x of ENDO_IPUCLARI) assert.ok(hastaDiliTemizMi(x), x)
  })

  it('foreign module token does not activate hormonlarim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['dahiliye'] } }, 'hormonlarim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['hormonlarim'] } }, 'hormonlarim'), true)
  })
})
