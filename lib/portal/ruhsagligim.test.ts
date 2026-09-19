import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { PSIKIYATRI_PROFILE } from '@/lib/specialties/psikiyatri'
import { portalModulAktif, portalModulleri, type PortalUygunlukGirdisi } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import {
  gorevBasligi, hatirlatmaDurumu, ruhSagligimHatirlatmalari, sonrakiKontrol,
  olcekHatirlatmalari, ilacHatirlatmalari, hastaDiliTemizMi, RUH_SAGLIGIM_NOTU,
} from '@/specialties/psikiyatri/engines/portal-ruhsagligim'

const kok = path.join(import.meta.dirname, '../..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
const BUGUN = '2026-09-19'

describe('PSIK-EXCEPTIONAL-01 Ruh Sağlığım portal', () => {
  it('psikiyatri profile declares Ruh Sağlığım Strong on its own path', () => {
    const m = PSIKIYATRI_PROFILE.portal![0]
    assert.equal(m.id, 'psikiyatri')
    assert.equal(m.derinlik, 'Strong')
    assert.equal(m.eligibility, 'doctor_specialty')
    assert.equal(PSIKIYATRI_PROFILE.olgunluk, 'beta-hazir')
    assert.deepEqual(m.bundleKeys, ['psik'])
    // Yol dahiliye Takibim'in /takibim yolu ile çakışmaz
    assert.deepEqual(m.nav.map((n) => n.path), ['/ruhsagligim'])
    assert.equal(m.nav[0].label, 'Ruh Sağlığım')
  })

  it('module attaches for psikiyatri doctor and for nobody else', () => {
    const g = (brans: string | null): PortalUygunlukGirdisi => ({ doktorBransi: brans, hastaYasYil: 34, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false })
    assert.ok(portalModulleri(g('psikiyatri')).moduller.includes('psikiyatri'))
    assert.ok(portalModulleri(g('Ruh Sağlığı ve Hastalıkları')).moduller.includes('psikiyatri'))
    for (const yabanci of ['dahiliye', 'Göz Hastalıkları', 'Dermatoloji', 'Kadın Hastalıkları ve Doğum', 'pediatri', 'kardiyoloji', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('psikiyatri'), `${yabanci} psikiyatri modülünü görmemeli`)
    }
  })

  it('bundle slice starts null everywhere (demo portal never carries mental health data)', () => {
    assert.equal(emptyPortalBundle().psik, null)
    assert.equal(SAGLIGIM_DEMO.psik, null)
  })

  it('page gates on psikiyatri module', () => {
    const page = oku('app/portal/hasta/[token]/ruhsagligim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'psikiyatri'\)/)
    assert.match(page, /RuhSagligimView/)
  })

  it('bundle route builds psik only when modulAktif psikiyatri and never selects ad/skor', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('psikiyatri'\)/)
    assert.match(rota, /ruhSagligimHatirlatmalari\(/)
    assert.match(rota, /bundle\.psik\s*=/)
    const blok = rota.slice(rota.indexOf("modulAktif('psikiyatri')"), rota.indexOf('[portal] ruhsagligim'))
    // Hekimin yazdığı görev adı ve ölçek skoru portala taşınmaz — yalnız kod + due okunur
    assert.doesNotMatch(blok, /psik_gorevleri'\)\.select\('[^']*\bad\b/)
    assert.doesNotMatch(blok, /psik_olcek/)
    assert.doesNotMatch(blok, /psik_risk/)
  })

  it('foreign module token does not activate psikiyatri', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['gozlerim'] } }, 'psikiyatri'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['dahiliye'] } }, 'psikiyatri'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['psikiyatri'] } }, 'psikiyatri'), true)
  })

  it('gorevBasligi maps every task code to a safe fixed title', () => {
    assert.equal(gorevBasligi('psik_izlem_lityum'), 'İlaç güvenlik kan testi')
    assert.equal(gorevBasligi('psik_izlem_valproat'), 'İlaç güvenlik kan testi')
    assert.equal(gorevBasligi('psik_izlem_klozapin'), 'Düzenli kan sayımı kontrolü')
    assert.equal(gorevBasligi('psik_izlem_atipik_ap'), 'Kilo ve kan şekeri / kolesterol kontrolü')
    assert.equal(gorevBasligi('psik_izlem_ssri'), 'İlaç kontrol görüşmesi')
    assert.equal(gorevBasligi('olcek_phq9'), 'Kontrolden önce doldurulacak kısa form')
    assert.equal(gorevBasligi('olcek_gad7'), 'Kontrolden önce doldurulacak kısa form')
    assert.equal(gorevBasligi('kontrol_randevu'), 'Kontrol randevusu')
    assert.equal(gorevBasligi('bilinmeyen_xyz'), 'Kontrol randevusu')
    assert.equal(gorevBasligi(null), 'Kontrol randevusu')
  })

  it('no task title leaks scale name, score, diagnosis, drug or dose', () => {
    const kodlar = [
      'psik_izlem_lityum', 'psik_izlem_valproat', 'psik_izlem_klozapin', 'psik_izlem_atipik_ap',
      'psik_izlem_ssri', 'psik_izlem_lamotrijin', 'olcek_phq9', 'olcek_gad7', 'cgi_s',
      'kontrol_randevu', 'terapi_seans', 'hatirlatma_takip', 'duzey_li',
    ]
    for (const k of kodlar) assert.ok(hastaDiliTemizMi(gorevBasligi(k)), `${k} → "${gorevBasligi(k)}" hasta dilinde temiz değil`)
    assert.ok(hastaDiliTemizMi(RUH_SAGLIGIM_NOTU))
    assert.match(RUH_SAGLIGIM_NOTU, /112/)
  })

  it('hastaDiliTemizMi catches the forbidden vocabulary', () => {
    assert.equal(hastaDiliTemizMi('PHQ-9 skorunuz 18'), false)
    assert.equal(hastaDiliTemizMi('Depresyon tanınız için lityum 300 mg'), false)
    assert.equal(hastaDiliTemizMi('GAD-7 orta şiddetli'), false)
    assert.equal(hastaDiliTemizMi('Kontrol randevusu · 12 Ekim 2026'), true)
  })

  it('hatirlatmaDurumu windows', () => {
    assert.equal(hatirlatmaDurumu('2026-09-10', BUGUN), 'gecikti')
    assert.equal(hatirlatmaDurumu('2026-09-22', BUGUN), 'yaklasiyor')
    assert.equal(hatirlatmaDurumu('2026-11-20', BUGUN), 'planli')
    assert.equal(hatirlatmaDurumu(null, BUGUN), 'planli')
  })

  it('hatirlatmalar dedupe, sort by date and split into scale / drug buckets', () => {
    const liste = ruhSagligimHatirlatmalari({
      bugun: BUGUN,
      gorevler: [
        { kod: 'olcek_phq9', due: '2026-10-17' },
        { kod: 'olcek_gad7', due: '2026-10-17' }, // aynı başlık + aynı tarih → tek satır
        { kod: 'psik_izlem_lityum', due: '2026-09-10' },
        { kod: 'kontrol_randevu', due: '2026-09-25' },
      ],
      sonrakiKontrolIso: '2026-09-25',
    })
    assert.equal(liste.length, 3)
    assert.equal(liste[0].due, '2026-09-10')
    assert.equal(liste[0].durum, 'gecikti')
    assert.deepEqual(olcekHatirlatmalari(liste).map((h) => h.due), ['2026-10-17'])
    assert.deepEqual(ilacHatirlatmalari(liste).map((h) => h.ad), ['İlaç güvenlik kan testi'])
    const sk = sonrakiKontrol(liste)
    assert.equal(sk?.tarih, '2026-09-25')
    assert.equal(sk?.neden, 'Kontrol randevusu')
  })

  it('view component never renders score, band or drug fields', () => {
    // Dosya başlığı yasak sözcükleri KURAL olarak sayar; kontrol edilen şey kodun kendisi.
    const view = oku('app/portal/_components/RuhSagligimView.tsx').replace(/\/\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(view, /PHQ|GAD|CGI|skor|şiddet|lityum|valproat/i)
  })
})
