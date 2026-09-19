import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { GOGUS_HASTALIKLARI_PROFILE } from '@/lib/specialties/gogus-hastaliklari'
import { portalModulAktif, portalModulleri, type PortalUygunlukGirdisi } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import {
  gorevBasligi, hatirlatmaDurumu, akcigerlerimHatirlatmalari, sonrakiKontrol,
  testHatirlatmalari, bakimHatirlatmalari, hastaDiliTemizMi, AKCIGERLERIM_NOTU, AKCIGER_BAKIM_IPUCLARI,
} from '@/specialties/gogus-hastaliklari/engines/portal-akcigerlerim'

const kok = path.join(import.meta.dirname, '../..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
const BUGUN = '2026-09-19'

describe('GOGUS-EXCEPTIONAL-01 Akciğerlerim portal', () => {
  it('profile declares Akciğerlerim Strong on /akcigerlerim', () => {
    const m = GOGUS_HASTALIKLARI_PROFILE.portal![0]
    assert.equal(m.id, 'akcigerlerim')
    assert.equal(m.derinlik, 'Strong')
    assert.equal(m.eligibility, 'doctor_specialty')
    assert.equal(GOGUS_HASTALIKLARI_PROFILE.olgunluk, 'beta-hazir')
    assert.equal(GOGUS_HASTALIKLARI_PROFILE.pediatrikBaglam, 'asla')
    assert.deepEqual(m.bundleKeys, ['akciger'])
    assert.deepEqual(m.nav.map((n) => n.path), ['/akcigerlerim'])
    assert.equal(m.nav[0].label, 'Akciğerlerim')
  })

  it('module attaches for göğüs doctor only — not dahiliye or gogus-cerrahisi', () => {
    const g = (brans: string | null): PortalUygunlukGirdisi => ({ doktorBransi: brans, hastaYasYil: 55, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false })
    for (const kendi of ['gogus-hastaliklari', 'Göğüs Hastalıkları', 'Göğüs Hastalıkları Uzmanı']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('akcigerlerim'), `${kendi} Akciğerlerim'i görmeli`)
    }
    for (const yabanci of ['dahiliye', 'gogus-cerrahisi', 'Göğüs Cerrahisi', 'kardiyoloji', 'kulak-burun-bogaz', 'pediatri', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('akcigerlerim'), `${yabanci} Akciğerlerim görmemeli`)
    }
  })

  it('bundle slice starts null; page gates on akcigerlerim', () => {
    assert.equal(emptyPortalBundle().akciger, null)
    assert.equal(SAGLIGIM_DEMO.akciger, null)
    const page = oku('app/portal/hasta/[token]/akcigerlerim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'akcigerlerim'\)/)
    assert.match(page, /AkcigerlerimView/)
  })

  it('API builds akciger only when modulAktif and never selects skor/risk', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('akcigerlerim'\)/)
    assert.match(rota, /akcigerlerimHatirlatmalari\(/)
    assert.match(rota, /bundle\.akciger\s*=/)
    const blok = rota.slice(rota.indexOf("modulAktif('akcigerlerim')"), rota.indexOf('[portal] akcigerlerim'))
    assert.doesNotMatch(blok, /gogus_gorevleri'\)\.select\('[^']*\bad\b/)
    assert.doesNotMatch(blok, /gogus_skor/)
    assert.doesNotMatch(blok, /gogus_risk/)
  })

  it('foreign module token does not activate akcigerlerim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['kulaklarim'] } }, 'akcigerlerim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['akcigerlerim'] } }, 'akcigerlerim'), true)
  })

  it('gorevBasligi maps to safe titles without CAT/GOLD/dose', () => {
    assert.equal(gorevBasligi('spiro_tekrar'), 'Solunum testi randevusu')
    assert.equal(gorevBasligi('inhaler_teknik'), 'İnhaler teknik kontrolü')
    assert.equal(gorevBasligi('aksiyon_plan'), 'Aksiyon planı gözden geçirme')
    assert.equal(gorevBasligi('kontrol_randevu'), 'Kontrol randevusu')
    for (const k of ['spiro_tekrar', 'inhaler_teknik', 'aksiyon_plan', 'oksijen_kontrol', 'rapor_sgk', 'kontrol_randevu']) {
      assert.ok(hastaDiliTemizMi(gorevBasligi(k)), gorevBasligi(k))
    }
    assert.ok(hastaDiliTemizMi(AKCIGERLERIM_NOTU))
    assert.match(AKCIGERLERIM_NOTU, /112/)
    for (const x of AKCIGER_BAKIM_IPUCLARI) assert.ok(hastaDiliTemizMi(x), x)
  })

  it('hastaDiliTemizMi catches forbidden vocabulary', () => {
    assert.equal(hastaDiliTemizMi('CAT 18 / GOLD B'), false)
    assert.equal(hastaDiliTemizMi('FEV1 %45'), false)
    assert.equal(hastaDiliTemizMi('Salbutamol 100 mcg 2 puff'), false)
    assert.equal(hastaDiliTemizMi('Solunum testi randevusu · 12 Ekim 2026'), true)
  })

  it('hatirlatmalar dedupe and split buckets', () => {
    assert.equal(hatirlatmaDurumu('2026-09-10', BUGUN), 'gecikti')
    const liste = akcigerlerimHatirlatmalari({
      bugun: BUGUN,
      gorevler: [
        { kod: 'spiro_tekrar', due: '2026-10-17' },
        { kod: 'sft_kontrol', due: '2026-10-17' },
        { kod: 'inhaler_teknik', due: '2026-09-21' },
        { kod: 'kontrol_randevu', due: '2026-09-25' },
      ],
      sonrakiKontrolIso: '2026-09-25',
    })
    assert.equal(liste.length, 3)
    assert.deepEqual(testHatirlatmalari(liste).map((h) => h.ad), ['Solunum testi randevusu'])
    assert.deepEqual(bakimHatirlatmalari(liste).map((h) => h.ad), ['İnhaler teknik kontrolü'])
    const sk = sonrakiKontrol(liste)
    assert.equal(sk?.tarih, '2026-09-21')
  })

  it('view never renders CAT/GOLD/FEV1/diagnosis', () => {
    const view = oku('app/portal/_components/AkcigerlerimView.tsx').replace(/\/\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(view, /\bCAT\b|mMRC|GOLD|FEV|tanı|mcg/i)
  })
})
