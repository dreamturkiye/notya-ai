import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { SPOR_HEKIMLIGI_PROFILE } from '@/lib/specialties/spor-hekimligi'
import { portalModulleri, portalModulAktif } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import {
  gorevBasligi, hatirlatmaDurumu, sporumHatirlatmalari, sonrakiKontrol,
  hastaDiliTemizMi, rtpHastaOzeti, SPORUM_NOTU,
} from '@/specialties/spor-hekimligi/engines/portal-sporum'

const kok = process.cwd()
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
const g = (doktorBransi: string | null) => ({
  doktorBransi, hastaYasYil: 28, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false,
})

describe('SPOR-HEKIMLIGI-EXCEPTIONAL-01 Sporum portal', () => {
  it('profile declares Sporum Strong on /sporum', () => {
    const m = SPOR_HEKIMLIGI_PROFILE.portal![0]!
    assert.equal(m.id, 'sporum')
    assert.equal(m.derinlik, 'Strong')
    assert.deepEqual(m.nav.map((n) => n.path), ['/sporum'])
  })

  it('module attaches for spor-hekimligi only — not ortopedi or FTR', () => {
    for (const kendi of ['spor-hekimligi', 'Spor Hekimliği', 'Spor Hekimliği Uzmanı', 'sports medicine']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('sporum'), `${kendi} Sporum'u görmeli`)
    }
    for (const yabanci of ['ortopedi', 'fizik-tedavi', 'dahiliye', 'pediatri', 'uroloji', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('sporum'), `${yabanci} Sporum görmemeli`)
    }
  })

  it('page gates on sporum module', () => {
    const page = oku('app/portal/hasta/[token]/sporum/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'sporum'\)/)
  })

  it('bundle route builds spor only when modulAktif sporum and never selects diagnosis/doping', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('sporum'\)/)
    assert.match(rota, /sporumHatirlatmalari\(/)
    const blok = rota.slice(rota.indexOf("modulAktif('sporum')"), rota.indexOf('[portal] sporum'))
    assert.doesNotMatch(blok, /spor_sakatlik'\)\.select\('[^']*siddet/)
    assert.doesNotMatch(blok, /doping|WADA/i)
  })

  it('foreign module token does not activate sporum', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['eklemlerim'] } }, 'sporum'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['sporum'] } }, 'sporum'), true)
  })

  it('empty bundle starts with spor null', () => {
    assert.equal(emptyPortalBundle().spor, null)
  })

  it('patient-safe titles and language lock', () => {
    assert.equal(gorevBasligi('rtp_kontrol'), 'Antrenmana dönüş planı kontrolü')
    assert.equal(hatirlatmaDurumu('2020-01-01', '2026-09-19'), 'gecikti')
    const liste = sporumHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'rtp_kontrol', due: '2026-09-25' }],
      sonrakiKontrolIso: '2026-10-01',
      rtpBasamak: 2,
    })
    assert.ok(liste.length >= 1)
    assert.ok(sonrakiKontrol(liste))
    assert.ok(hastaDiliTemizMi(SPORUM_NOTU))
    assert.ok(hastaDiliTemizMi(rtpHastaOzeti(2) || ''))
    assert.equal(hastaDiliTemizMi('ACL yırtığı tanısı ve 50 mg'), false)
  })
})
