/**
 * NOROLOJI-EXCEPTIONAL-01 — Sağlığım › Nörolojimm portal kilidi.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { NOROLOJI_PROFILE } from '@/lib/specialties/noroloji'
import {
  gorevBasligi, norolojimHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, NOROLOJIM_NOTU, NORO_IPUCLARI,
} from '@/specialties/noroloji/engines/portal-norolojim'
import type { PortalUygunlukGirdisi } from '@/lib/portal/moduller'

const g = (doktorBransi: string): PortalUygunlukGirdisi => ({
  doktorBransi, hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

const oku = (rel: string) => fs.readFileSync(path.join(import.meta.dirname, '../..', rel), 'utf8')

describe('Nörolojimm portal', () => {
  it('profile Strong + /norolojim', () => {
    const m = NOROLOJI_PROFILE.portal![0]
    assert.equal(m.id, 'norolojim')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/norolojim'])
  })

  it('yalnız noroloji hekimi görür; yabancı branş görmez', () => {
    for (const kendi of ['noroloji', 'Nöroloji', 'Noroloji Uzmanı']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('norolojim'), `${kendi}`)
    }
    for (const yabanci of ['dahiliye', 'kulak-burun-bogaz', 'psikiyatri', 'pediatri', 'kardiyoloji', 'gogus-hastaliklari']) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('norolojim'), `${yabanci}`)
    }
  })

  it('çocuk hasta + yabancı branş bile Nörolojimm açmaz', () => {
    const cocuk: PortalUygunlukGirdisi = { doktorBransi: 'noroloji', hastaYasYil: 10, gebelikAktif: false, kdKaydi: true, buyumeOlcumu: true, dahiliyeKaydi: true }
    assert.ok(portalModulleri(cocuk).moduller.includes('norolojim'))
    assert.ok(!portalModulleri({ ...cocuk, doktorBransi: 'dahiliye' }).moduller.includes('norolojim'))
  })

  it('empty bundle noro null', () => {
    assert.equal(emptyPortalBundle().noro, null)
  })

  it('page gates on norolojim module', () => {
    const page = oku('app/portal/hasta/[token]/norolojim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'norolojim'\)/)
  })

  it('bundle route builds noro only when modulAktif norolojim', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('norolojim'\)/)
    assert.match(rota, /norolojimHatirlatmalari\(/)
  })

  it('foreign module token does not activate norolojim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['kulaklarim'] } }, 'norolojim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['norolojim'] } }, 'norolojim'), true)
  })

  it('görev kodları hasta-güvenli başlığa çevrilir', () => {
    assert.equal(gorevBasligi('noro_izlem_valproat'), 'İlaç güvenlik kontrolü')
    assert.equal(gorevBasligi('migren_tekrar'), 'Baş ağrısı takip formu')
    assert.equal(gorevBasligi('kontrol_randevu'), 'Kontrol randevusu')
  })

  it('hatırlatmalar ve not hasta dili temiz', () => {
    const liste = norolojimHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'noro_izlem_valproat', due: '2026-09-25' }, { kod: 'migren_tekrar', due: '2026-10-01' }],
      sonrakiKontrolIso: '2026-10-10',
    })
    assert.ok(liste.length >= 2)
    assert.ok(sonrakiKontrol(liste))
    for (const h of liste) assert.ok(hastaDiliTemizMi(h.ad), h.ad)
    assert.ok(hastaDiliTemizMi(NOROLOJIM_NOTU))
    for (const x of NORO_IPUCLARI) assert.ok(hastaDiliTemizMi(x), x)
  })
})
