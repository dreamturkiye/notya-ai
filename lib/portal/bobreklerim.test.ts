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
  gorevBasligi, bobreklerimHatirlatmalari, sonrakiKontrol, labHatirlatmalari, anemiHatirlatmalari,
  diyalizHatirlatmalari, hastaDiliTemizMi, portalPaketGuvenliMi, BOBREKLERIM_NOTU, NEF_IPUCLARI,
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
    assert.equal(gorevBasligi('anemi_izlem'), 'Kan sayımı kontrolü')
    const liste = bobreklerimHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [
        { kod: 'egfr_izlem', due: '2026-09-25' },
        { kod: 'anemi_izlem', due: '2026-09-20' },
        { kod: 'diyaliz_seans', due: '2026-09-18' },
      ],
      sonrakiKontrolIso: '2026-10-01',
    })
    assert.ok(liste.length >= 3)
    assert.ok(sonrakiKontrol(liste))
    assert.ok(labHatirlatmalari(liste).length >= 1)
    assert.ok(anemiHatirlatmalari(liste).length >= 1)
    assert.ok(diyalizHatirlatmalari(liste).some((h) => h.due === '2026-09-18'))
    assert.ok(liste.some((h) => h.ad === 'Diyaliz seans / takip' && h.durum === 'gecikti'))
    assert.ok(hastaDiliTemizMi(BOBREKLERIM_NOTU))
    for (const i of NEF_IPUCLARI) assert.ok(hastaDiliTemizMi(i))
    assert.ok(portalPaketGuvenliMi([BOBREKLERIM_NOTU, ...NEF_IPUCLARI, ...liste.map((h) => h.ad)]))
  })

  it('portal vocabulary lock rejects eGFR / KDIGO / ESA / ICD', () => {
    assert.equal(hastaDiliTemizMi('Kontrol randevusu'), true)
    assert.equal(hastaDiliTemizMi('eGFR 45 KDIGO G3a'), false)
    assert.equal(hastaDiliTemizMi('ESA 4000 IU'), false)
    assert.equal(hastaDiliTemizMi('KBH tanısı ICD N18'), false)
    assert.equal(portalPaketGuvenliMi(['Kan tahlili kontrolü', 'eGFR 22']), false)
  })

  it('foreign module token does not activate bobreklerim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['dahiliye'] } }, 'bobreklerim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['bobreklerim'] } }, 'bobreklerim'), true)
  })
})
