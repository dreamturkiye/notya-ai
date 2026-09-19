import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { UROLOJI_PROFILE } from '@/lib/specialties/uroloji'
import { portalModulAktif, portalModulleri, type PortalUygunlukGirdisi } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import {
  gorevBasligi, hatirlatmaDurumu, urolojimHatirlatmalari, sonrakiKontrol,
  testHatirlatmalari, islemHatirlatmalari, hastaDiliTemizMi, UROLOJIM_NOTU, URO_BAKIM_IPUCLARI,
} from '@/specialties/uroloji/engines/portal-urolojim'

const kok = path.join(import.meta.dirname, '../..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
const BUGUN = '2026-09-19'

describe('UROLOJI-EXCEPTIONAL-01 Ürolojimm portal', () => {
  it('Üroloji profile declares Ürolojimm Strong on its own path', () => {
    const m = UROLOJI_PROFILE.portal![0]
    assert.equal(m.id, 'urolojim')
    assert.equal(m.derinlik, 'Strong')
    assert.equal(m.eligibility, 'doctor_specialty')
    assert.equal(UROLOJI_PROFILE.olgunluk, 'beta-hazir')
    assert.equal(UROLOJI_PROFILE.pediatrikBaglam, 'asla')
    assert.deepEqual(m.bundleKeys, ['uro'])
    assert.deepEqual(m.nav.map((n) => n.path), ['/urolojim'])
    assert.equal(m.nav[0].label, 'Ürolojimm')
  })

  it('module attaches for üroloji doctor and for nobody else', () => {
    const g = (brans: string | null): PortalUygunlukGirdisi => ({ doktorBransi: brans, hastaYasYil: 55, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false })
    for (const kendi of ['uroloji', 'Üroloji', 'Uroloji Uzmanı', 'urology']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('urolojim'), `${kendi} Ürolojimm'i görmeli`)
    }
    for (const yabanci of ['dahiliye', 'Göz Hastalıkları', 'Dermatoloji', 'pediatri', 'kardiyoloji', 'psikiyatri', 'kulak-burun-bogaz', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('urolojim'), `${yabanci} Ürolojimm modülünü görmemeli`)
    }
  })

  it('Üroloji doctor gets no foreign chapter module', () => {
    const cocuk: PortalUygunlukGirdisi = { doktorBransi: 'uroloji', hastaYasYil: 6, gebelikAktif: false, kdKaydi: true, buyumeOlcumu: true, dahiliyeKaydi: true }
    const m = portalModulleri(cocuk).moduller
    assert.deepEqual(m, ['urolojim'])
    assert.ok(!m.includes('buyume'))
    assert.ok(!m.includes('kulaklarim'))
  })

  it('bundle slice starts null everywhere', () => {
    assert.equal(emptyPortalBundle().uro, null)
    assert.equal(SAGLIGIM_DEMO.uro, null)
  })

  it('page gates on urolojim module', () => {
    const page = oku('app/portal/hasta/[token]/urolojim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'urolojim'\)/)
    assert.match(page, /UrolojimView/)
  })

  it('bundle route builds uro only when modulAktif urolojim and never selects PSA/IPSS numbers', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('urolojim'\)/)
    assert.match(rota, /urolojimHatirlatmalari\(/)
    assert.match(rota, /bundle\.uro\s*=/)
    const blok = rota.slice(rota.indexOf("modulAktif('urolojim')"), rota.indexOf('[portal] urolojim'))
    assert.doesNotMatch(blok, /uro_gorevleri'\)\.select\('[^']*\bad\b/)
    assert.doesNotMatch(blok, /uro_ipss/)
    assert.doesNotMatch(blok, /uro_psa/)
    assert.doesNotMatch(blok, /deger_ng_ml/)
    assert.doesNotMatch(blok, /toplam/)
  })

  it('foreign module token does not activate urolojim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['kulaklarim'] } }, 'urolojim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['urolojim'] } }, 'urolojim'), true)
  })

  it('gorevBasligi maps codes to patient-safe titles', () => {
    assert.equal(gorevBasligi('ipss_tekrar'), 'Semptom formu kontrolü')
    assert.equal(gorevBasligi('psa_izlem'), 'Kan testi randevusu')
    assert.equal(gorevBasligi('tas_takip'), 'Taş takibi randevusu')
    assert.equal(gorevBasligi('rapor_sgk'), 'Belge / rapor işlemi')
    assert.equal(gorevBasligi('kontrol_randevu'), 'Kontrol randevusu')
    assert.equal(gorevBasligi(null), 'Kontrol randevusu')
  })

  it('no task title leaks diagnosis, PSA, IPSS, dose', () => {
    for (const k of ['ipss_tekrar', 'psa_izlem', 'tas_takip', 'rapor_sgk', 'kontrol_randevu']) {
      assert.ok(hastaDiliTemizMi(gorevBasligi(k)), `${k} → "${gorevBasligi(k)}"`)
    }
    assert.ok(hastaDiliTemizMi(UROLOJIM_NOTU))
    assert.match(UROLOJIM_NOTU, /112/)
    for (const x of URO_BAKIM_IPUCLARI) assert.ok(hastaDiliTemizMi(x), x)
  })

  it('hastaDiliTemizMi catches forbidden vocabulary', () => {
    assert.equal(hastaDiliTemizMi('PSA 4.2 ng/mL'), false)
    assert.equal(hastaDiliTemizMi('IPSS skor 22'), false)
    assert.equal(hastaDiliTemizMi('BPH tanısı'), false)
    assert.equal(hastaDiliTemizMi('prostat kanseri'), false)
    assert.equal(hastaDiliTemizMi('tamsulosin 0.4 mg'), false)
    assert.equal(hastaDiliTemizMi('Kontrol randevusu · 12 Ekim 2026'), true)
  })

  it('hatirlatmalar dedupe and split buckets', () => {
    const liste = urolojimHatirlatmalari({
      bugun: BUGUN,
      gorevler: [
        { kod: 'psa_izlem', due: '2026-10-17' },
        { kod: 'ipss_tekrar', due: '2026-09-21' },
        { kod: 'tas_takip', due: '2026-09-10' },
      ],
      sonrakiKontrolIso: '2026-11-01',
    })
    assert.ok(liste.length >= 3)
    assert.equal(hatirlatmaDurumu('2026-09-10', BUGUN), 'gecikti')
    assert.ok(testHatirlatmalari(liste).length >= 1)
    assert.ok(islemHatirlatmalari(liste).length >= 1)
    assert.ok(sonrakiKontrol(liste))
  })
})
