import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { ORTOPEDI_PROFILE } from '@/lib/specialties/ortopedi'
import { portalModulAktif, portalModulleri, type PortalUygunlukGirdisi } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import {
  gorevBasligi, hatirlatmaDurumu, eklemlerimHatirlatmalari, sonrakiKontrol,
  izlemHatirlatmalari, islemHatirlatmalari, hastaDiliTemizMi, EKLEMLERIM_NOTU, ORTO_BAKIM_IPUCLARI,
} from '@/specialties/ortopedi/engines/portal-eklemlerim'

const kok = path.join(import.meta.dirname, '../..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
const BUGUN = '2026-09-19'

describe('ORTOPEDI-EXCEPTIONAL-01 Eklemlerim portal', () => {
  it('Ortopedi profile declares Eklemlerim Strong on its own path', () => {
    const m = ORTOPEDI_PROFILE.portal![0]
    assert.equal(m.id, 'eklemlerim')
    assert.equal(m.derinlik, 'Strong')
    assert.equal(m.eligibility, 'doctor_specialty')
    assert.equal(ORTOPEDI_PROFILE.olgunluk, 'beta-hazir')
    assert.equal(ORTOPEDI_PROFILE.pediatrikBaglam, 'asla')
    assert.deepEqual(m.bundleKeys, ['eklem'])
    assert.deepEqual(m.nav.map((n) => n.path), ['/eklemlerim'])
    assert.equal(m.nav[0].label, 'Eklemlerim')
  })

  it('module attaches for ortopedi doctor and for nobody else', () => {
    const g = (brans: string | null): PortalUygunlukGirdisi => ({ doktorBransi: brans, hastaYasYil: 45, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false })
    for (const kendi of ['ortopedi', 'Ortopedi', 'Ortopedi ve Travmatoloji', 'orthopedics']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('eklemlerim'), `${kendi} Eklemlerim'i görmeli`)
    }
    for (const yabanci of ['dahiliye', 'fizik-tedavi', 'FTR', 'pediatri', 'kardiyoloji', 'uroloji', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('eklemlerim'), `${yabanci} Eklemlerim modülünü görmemeli`)
    }
  })

  it('Ortopedi doctor gets no foreign chapter module', () => {
    const cocuk: PortalUygunlukGirdisi = { doktorBransi: 'ortopedi', hastaYasYil: 6, gebelikAktif: false, kdKaydi: true, buyumeOlcumu: true, dahiliyeKaydi: true }
    const m = portalModulleri(cocuk).moduller
    assert.deepEqual(m, ['eklemlerim'])
    assert.ok(!m.includes('buyume'))
    assert.ok(!m.includes('ftrm'))
  })

  it('bundle slice starts null everywhere', () => {
    assert.equal(emptyPortalBundle().eklem, null)
    assert.equal(SAGLIGIM_DEMO.eklem, null)
  })

  it('page gates on eklemlerim module', () => {
    const page = oku('app/portal/hasta/[token]/eklemlerim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'eklemlerim'\)/)
    assert.match(page, /EklemlerimView/)
  })

  it('bundle route builds eklem only when modulAktif eklemlerim and never selects VAS numbers', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('eklemlerim'\)/)
    assert.match(rota, /eklemlerimHatirlatmalari\(/)
    assert.match(rota, /bundle\.eklem\s*=/)
    const blok = rota.slice(rota.indexOf("modulAktif('eklemlerim')"), rota.indexOf('[portal] eklemlerim'))
    assert.doesNotMatch(blok, /orto_gorevleri'\)\.select\('[^']*\bad\b/)
    assert.doesNotMatch(blok, /orto_vas/)
    assert.doesNotMatch(blok, /\bvas\b/)
  })

  it('foreign module token does not activate eklemlerim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['ftrm'] } }, 'eklemlerim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['eklemlerim'] } }, 'eklemlerim'), true)
  })

  it('gorevBasligi maps codes to patient-safe titles', () => {
    assert.equal(gorevBasligi('vas_tekrar'), 'Ağrı / hareket formu kontrolü')
    assert.equal(gorevBasligi('alci_alma'), 'Alçı / ortez kontrolü')
    assert.equal(gorevBasligi('yuk_verme'), 'Hareket / yük kontrolü')
    assert.equal(gorevBasligi('goruntu_kontrol'), 'Görüntüleme randevusu')
    assert.equal(gorevBasligi('kontrol_randevu'), 'Kontrol randevusu')
    assert.equal(gorevBasligi(null), 'Kontrol randevusu')
  })

  it('no task title leaks diagnosis, VAS, dose', () => {
    for (const k of ['vas_tekrar', 'alci_alma', 'yuk_verme', 'goruntu_kontrol', 'kontrol_randevu']) {
      assert.ok(hastaDiliTemizMi(gorevBasligi(k)), `${k} → "${gorevBasligi(k)}"`)
    }
    assert.ok(hastaDiliTemizMi(EKLEMLERIM_NOTU))
    assert.match(EKLEMLERIM_NOTU, /112/)
    for (const x of ORTO_BAKIM_IPUCLARI) assert.ok(hastaDiliTemizMi(x), x)
  })

  it('hastaDiliTemizMi catches forbidden vocabulary', () => {
    assert.equal(hastaDiliTemizMi('VAS 8'), false)
    assert.equal(hastaDiliTemizMi('artroz tanısı'), false)
    assert.equal(hastaDiliTemizMi('kaynama yok'), false)
    assert.equal(hastaDiliTemizMi('ibuprofen 400 mg'), false)
    assert.equal(hastaDiliTemizMi('Kontrol randevusu · 12 Ekim 2026'), true)
  })

  it('hatirlatmalar dedupe and split buckets', () => {
    const liste = eklemlerimHatirlatmalari({
      bugun: BUGUN,
      gorevler: [
        { kod: 'alci_alma', due: '2026-09-22' },
        { kod: 'vas_tekrar', due: '2026-09-21' },
        { kod: 'goruntu_kontrol', due: '2026-09-10' },
      ],
      sonrakiKontrolIso: '2026-11-01',
    })
    assert.ok(liste.length >= 3)
    assert.equal(hatirlatmaDurumu('2026-09-10', BUGUN), 'gecikti')
    assert.ok(izlemHatirlatmalari(liste).length >= 1)
    assert.ok(islemHatirlatmalari(liste).length >= 1)
    assert.ok(sonrakiKontrol(liste))
  })
})
