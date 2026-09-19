/**
 * KARDIO-EXCEPTIONAL-01 — Sağlığım › Kalbim portal kilidi.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { specialtyProfile } from '@/lib/specialties/registry'
import {
  gorevBasligi, hatirlatmaDurumu, kalbimHatirlatmalari, sonrakiKontrol,
  hastaDiliTemizMi, KALBIM_NOTU, KALP_BAKIM_IPUCLARI,
} from '@/specialties/kardiyoloji/engines/portal-kalbim'

const kok = path.join(import.meta.dirname, '../..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
const g = (doktorBransi: string | null) => ({
  doktorBransi, hastaYasYil: 55, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

describe('Kalbim portal module', () => {
  it('kardiyoloji profile declares Kalbim Strong at /kalbim', () => {
    const m = specialtyProfile('kardiyoloji').portal!
    assert.equal(m[0].id, 'kalbim')
    assert.equal(m[0].derinlik, 'Strong')
    assert.deepEqual(m[0].nav.map((n) => n.path), ['/kalbim'])
  })

  it('only kardiyoloji mounts Kalbim; foreign branşlar never', () => {
    for (const kendi of ['kardiyoloji', 'Kardiyoloji', 'Kardiyoloji Uzmanı']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('kalbim'), `${kendi} Kalbim'i görmeli`)
    }
    for (const yabanci of ['dahiliye', 'pediatri', 'kulak-burun-bogaz', 'psikiyatri', 'goz-hastaliklari', 'gogus-hastaliklari', 'noroloji', 'kalp-damar-cerrahisi']) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('kalbim'), `${yabanci} Kalbim görmemeli`)
    }
  })

  it('page gates on kalbim module', () => {
    const page = oku('app/portal/hasta/[token]/kalbim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'kalbim'\)/)
  })

  it('bundle route builds kalp only when modulAktif kalbim', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('kalbim'\)/)
    assert.match(rota, /kalbimHatirlatmalari\(/)
    const blok = rota.slice(rota.indexOf("modulAktif('kalbim')"), rota.indexOf('[portal] kalbim'))
    assert.doesNotMatch(blok, /risk_pct|SCORE2|NYHA|\.select\('ad'\)/)
  })

  it('foreign module token does not activate kalbim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['kulaklarim'] } }, 'kalbim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['kalbim'] } }, 'kalbim'), true)
  })

  it('task codes map to patient-safe titles without scores', () => {
    assert.equal(gorevBasligi('kb_kontrol'), 'Tansiyon kontrol randevusu')
    assert.equal(gorevBasligi('ekg_belge'), 'Kalp testi / belge randevusu')
    assert.equal(hatirlatmaDurumu('2026-09-10', '2026-09-19'), 'gecikti')
    const liste = kalbimHatirlatmalari({ bugun: '2026-09-19', gorevler: [{ kod: 'lab_elektrolit', due: '2026-09-22' }], sonrakiKontrolIso: '2026-10-01' })
    assert.ok(sonrakiKontrol(liste))
    for (const h of liste) assert.ok(hastaDiliTemizMi(h.ad))
  })

  it('fixed patient copy stays clean', () => {
    assert.ok(hastaDiliTemizMi(KALBIM_NOTU))
    for (const x of KALP_BAKIM_IPUCLARI) assert.ok(hastaDiliTemizMi(x), x)
  })
})
