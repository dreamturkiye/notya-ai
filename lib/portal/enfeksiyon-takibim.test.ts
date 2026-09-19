/**
 * ENFEKSIYON-EXCEPTIONAL-01 — Sağlığım › Enfeksiyon Takibim portal kilidi.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { specialtyProfile } from '@/lib/specialties/registry'
import { portalModulleri, portalModulAktif, type PortalUygunlukGirdisi } from '@/lib/portal/moduller'
import {
  gorevBasligi, enfeksiyonTakibimHatirlatmalari, sonrakiKontrol, hastaDiliTemizMi, ENFEKSIYON_TAKIBIM_NOTU, ENF_IPUCLARI,
} from '@/specialties/enfeksiyon-hastaliklari/engines/portal-enfeksiyon-takibim'

const g = (doktorBransi: string | null): PortalUygunlukGirdisi => ({
  doktorBransi, hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})
const oku = (rel: string) => fs.readFileSync(path.join(import.meta.dirname, '../..', rel), 'utf8')

describe('ENFEKSIYON-EXCEPTIONAL-01 Enfeksiyon Takibim portal', () => {
  it('enfeksiyon profile declares Enfeksiyon Takibim Strong on its own path', () => {
    const m = specialtyProfile('enfeksiyon-hastaliklari').portal![0]
    assert.equal(m.id, 'enfeksiyon-takibim')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/enfeksiyon-takibim'])
  })

  it('module attaches for enfeksiyon doctor and for nobody else', () => {
    for (const kendi of ['enfeksiyon-hastaliklari', 'Enfeksiyon Hastalıkları', 'Enfeksiyon Hastalıkları ve Klinik Mikrobiyoloji']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('enfeksiyon-takibim'), `${kendi}`)
    }
    for (const yabanci of ['dahiliye', 'pediatri', 'kardiyoloji', 'gogus-hastaliklari', 'gastroenteroloji', 'nefroloji', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('enfeksiyon-takibim'), `${yabanci}`)
    }
  })

  it('page gates on enfeksiyon-takibim module', () => {
    const page = oku('app/portal/hasta/[token]/enfeksiyon-takibim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'enfeksiyon-takibim'\)/)
  })

  it('bundle route builds enfeksiyon only when modulAktif enfeksiyon-takibim', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('enfeksiyon-takibim'\)/)
    assert.match(rota, /enfeksiyonTakibimHatirlatmalari\(/)
    const blok = rota.slice(rota.indexOf("modulAktif('enfeksiyon-takibim')"), rota.indexOf('[portal] enfeksiyon-takibim'))
    assert.doesNotMatch(blok, /\.from\('enfeksiyon_viral'\).*deger|CD4|tanı/i)
  })

  it('hatırlatma başlıkları hasta-güvenli', () => {
    assert.equal(gorevBasligi('viral_hiv_viral'), 'Kan tahlili kontrolü')
    assert.equal(gorevBasligi('atb_bitis'), 'İlaç süre kontrolü')
    const liste = enfeksiyonTakibimHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'atb_bitis', due: '2026-09-20' }, { kod: 'viral_hiv_cd4', due: '2026-10-01' }],
      sonrakiKontrolIso: '2026-10-15',
    })
    assert.ok(liste.length >= 2)
    assert.ok(sonrakiKontrol(liste))
    assert.ok(hastaDiliTemizMi(ENFEKSIYON_TAKIBIM_NOTU))
    for (const i of ENF_IPUCLARI) assert.ok(hastaDiliTemizMi(i), i)
  })

  it('foreign module token does not activate enfeksiyon-takibim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['dahiliye'] } }, 'enfeksiyon-takibim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['enfeksiyon-takibim'] } }, 'enfeksiyon-takibim'), true)
  })
})
