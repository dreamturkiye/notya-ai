/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Sağlık Paketim portal kilitleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { specialtyProfile } from '@/lib/specialties/registry'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import {
  gorevBasligi, hatirlatmaDurumu, saglikPaketimHatirlatmalari, sonrakiKontrol,
  hastaDiliTemizMi, SAGLIK_PAKETIM_NOTU, AILE_IPUCLARI,
} from '@/specialties/aile-hekimligi/engines/portal-saglik-paketim'

const g = (doktorBransi: string | null) => ({
  doktorBransi, hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})
const oku = (p: string) => fs.readFileSync(path.join(import.meta.dirname, '../..', p), 'utf8')

describe('Sağlık Paketim portal', () => {
  it('profile Strong + /saglik-paketim', () => {
    const m = specialtyProfile('aile-hekimligi').portal!
    assert.equal(m[0].id, 'saglik-paketim')
    assert.equal(m[0].derinlik, 'Strong')
    assert.deepEqual(m[0].nav.map((n) => n.path), ['/saglik-paketim'])
    assert.equal(specialtyProfile('aile-hekimligi').olgunluk, 'beta-hazir')
  })

  it('yalnız aile hekimliği görür; yabancı branşlar görmez', () => {
    for (const kendi of ['aile-hekimligi', 'Aile Hekimliği', 'Genel Pratisyen']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('saglik-paketim'), `${kendi}`)
    }
    for (const yabanci of ['dahiliye', 'pediatri', 'kardiyoloji', 'goz-hastaliklari', 'psikiyatri', 'endokrinoloji', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('saglik-paketim'), `${yabanci}`)
    }
  })

  it('page gates on saglik-paketim module', () => {
    const page = oku('app/portal/hasta/[token]/saglik-paketim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'saglik-paketim'\)/)
  })

  it('bundle route builds aile only when modulAktif saglik-paketim', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('saglik-paketim'\)/)
    assert.match(rota, /saglikPaketimHatirlatmalari\(/)
  })

  it('foreign module token does not activate saglik-paketim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['kalbim'] } }, 'saglik-paketim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['saglik-paketim'] } }, 'saglik-paketim'), true)
  })

  it('hatırlatmalar hasta-güvenli başlıklar kullanır', () => {
    const liste = saglikPaketimHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'asi_tarama_grip', due: '2026-09-22' }, { kod: 'kronik_dm_lab', due: '2026-10-01' }],
      sonrakiKontrolIso: '2026-10-01',
    })
    assert.ok(liste.some((h) => h.ad === 'Aşı veya tarama randevusu'))
    assert.ok(liste.some((h) => h.ad === 'Kronik takip kontrolü'))
    assert.ok(sonrakiKontrol(liste))
    assert.equal(gorevBasligi('asi_tarama_kolon'), 'Aşı veya tarama randevusu')
    assert.equal(hatirlatmaDurumu('2026-09-10', '2026-09-19'), 'gecikti')
    assert.ok(hastaDiliTemizMi(SAGLIK_PAKETIM_NOTU))
    for (const x of AILE_IPUCLARI) assert.ok(hastaDiliTemizMi(x))
  })
})
