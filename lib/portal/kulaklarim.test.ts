import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { KULAK_BURUN_BOGAZ_PROFILE } from '@/lib/specialties/kulak-burun-bogaz'
import { portalModulAktif, portalModulleri, type PortalUygunlukGirdisi } from '@/lib/portal/moduller'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import {
  gorevBasligi, hatirlatmaDurumu, kulaklarimHatirlatmalari, sonrakiKontrol,
  testHatirlatmalari, islemHatirlatmalari, hastaDiliTemizMi, KULAKLARIM_NOTU, KULAK_BAKIM_IPUCLARI,
} from '@/specialties/kulak-burun-bogaz/engines/portal-kulaklarim'

const kok = path.join(import.meta.dirname, '../..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
const BUGUN = '2026-09-19'

describe('KBB-EXCEPTIONAL-01 Kulaklarım portal', () => {
  it('KBB profile declares Kulaklarım Strong on its own path', () => {
    const m = KULAK_BURUN_BOGAZ_PROFILE.portal![0]
    assert.equal(m.id, 'kulaklarim')
    assert.equal(m.derinlik, 'Strong')
    assert.equal(m.eligibility, 'doctor_specialty')
    assert.equal(KULAK_BURUN_BOGAZ_PROFILE.olgunluk, 'beta-hazir')
    assert.equal(KULAK_BURUN_BOGAZ_PROFILE.pediatrikBaglam, 'asla')
    assert.deepEqual(m.bundleKeys, ['kulak'])
    // Yol başka bölümün yoluyla çakışmaz (/gozlerim, /ruhsagligim, /takibim)
    assert.deepEqual(m.nav.map((n) => n.path), ['/kulaklarim'])
    assert.equal(m.nav[0].label, 'Kulaklarım')
  })

  it('module attaches for a KBB doctor (canonical + alias + official title) and for nobody else', () => {
    const g = (brans: string | null): PortalUygunlukGirdisi => ({ doktorBransi: brans, hastaYasYil: 41, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false })
    for (const kendi of ['kulak-burun-bogaz', 'kbb', 'Kulak Burun Boğaz Hastalıkları', 'KBB Uzmanı']) {
      assert.ok(portalModulleri(g(kendi)).moduller.includes('kulaklarim'), `${kendi} Kulaklarım'ı görmeli`)
    }
    for (const yabanci of ['dahiliye', 'Göz Hastalıkları', 'Dermatoloji', 'Kadın Hastalıkları ve Doğum', 'pediatri', 'kardiyoloji', 'psikiyatri', 'aile-hekimligi', null]) {
      assert.ok(!portalModulleri(g(yabanci)).moduller.includes('kulaklarim'), `${yabanci} Kulaklarım modülünü görmemeli`)
    }
  })

  it('KBB doctor gets no foreign chapter module (no büyüme / jinekoloji / ruh sağlığı leak)', () => {
    const cocuk: PortalUygunlukGirdisi = { doktorBransi: 'kulak-burun-bogaz', hastaYasYil: 6, gebelikAktif: false, kdKaydi: true, buyumeOlcumu: true, dahiliyeKaydi: true }
    const m = portalModulleri(cocuk).moduller
    assert.deepEqual(m, ['kulaklarim'])
    assert.ok(!m.includes('buyume'))
    assert.ok(!m.includes('jinekoloji'))
    assert.ok(!m.includes('dahiliye'))
    assert.ok(!m.includes('psikiyatri'))
  })

  it('bundle slice starts null everywhere (demo portal never carries KBB follow-up)', () => {
    assert.equal(emptyPortalBundle().kulak, null)
    assert.equal(SAGLIGIM_DEMO.kulak, null)
  })

  it('page gates on kulaklarim module', () => {
    const page = oku('app/portal/hasta/[token]/kulaklarim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'kulaklarim'\)/)
    assert.match(page, /KulaklarimView/)
  })

  it('bundle route builds kulak only when modulAktif kulaklarim and never selects ad / dB / risk', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('kulaklarim'\)/)
    assert.match(rota, /kulaklarimHatirlatmalari\(/)
    assert.match(rota, /bundle\.kulak\s*=/)
    const blok = rota.slice(rota.indexOf("modulAktif('kulaklarim')"), rota.indexOf('[portal] kulaklarim'))
    // Hekimin yazdığı görev adı, odyometri ölçümü ve kırmızı bayrak portala taşınmaz — yalnız kod + due
    assert.doesNotMatch(blok, /kbb_gorevleri'\)\.select\('[^']*\bad\b/)
    assert.doesNotMatch(blok, /kbb_odyometri/)
    assert.doesNotMatch(blok, /kbb_risk/)
    assert.doesNotMatch(blok, /pta_db/)
  })

  it('foreign module token does not activate kulaklarim', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['gozlerim'] } }, 'kulaklarim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['psikiyatri'] } }, 'kulaklarim'), false)
    assert.equal(portalModulAktif({ portal: { moduller: ['kulaklarim'] } }, 'kulaklarim'), true)
  })

  it('gorevBasligi maps every task code to a safe fixed title', () => {
    assert.equal(gorevBasligi('odyo_tekrar'), 'İşitme testi randevusu')
    assert.equal(gorevBasligi('isitme_test'), 'İşitme testi randevusu')
    assert.equal(gorevBasligi('osas_sevk'), 'Uyku tetkiki randevusu')
    assert.equal(gorevBasligi('manevra_kontrol'), 'Denge muayenesi kontrolü')
    assert.equal(gorevBasligi('cihaz_kontrol'), 'İşitme cihazı kontrol randevusu')
    assert.equal(gorevBasligi('rapor_sgk'), 'Belge / rapor işlemi')
    assert.equal(gorevBasligi('pansuman'), 'Kulak temizliği / pansuman randevusu')
    assert.equal(gorevBasligi('kontrol_randevu'), 'Kontrol randevusu')
    assert.equal(gorevBasligi('bilinmeyen_xyz'), 'Kontrol randevusu')
    assert.equal(gorevBasligi(null), 'Kontrol randevusu')
  })

  it('no task title leaks diagnosis, dB value, loss band, drug or dose', () => {
    const kodlar = [
      'odyo_tekrar', 'isitme_test', 'pta_kontrol', 'osas_sevk', 'uyku_tetkik', 'manevra_kontrol',
      'vertigo_kontrol', 'cihaz_kontrol', 'rapor_sgk', 'belge', 'pansuman', 'buson_temizlik',
      'kontrol_randevu', 'hatirlatma_takip',
    ]
    for (const k of kodlar) assert.ok(hastaDiliTemizMi(gorevBasligi(k)), `${k} → "${gorevBasligi(k)}" hasta dilinde temiz değil`)
    assert.ok(hastaDiliTemizMi(KULAKLARIM_NOTU))
    assert.match(KULAKLARIM_NOTU, /112/)
    for (const x of KULAK_BAKIM_IPUCLARI) assert.ok(hastaDiliTemizMi(x), x)
  })

  it('hastaDiliTemizMi catches the forbidden vocabulary', () => {
    assert.equal(hastaDiliTemizMi('Sağ kulak PTA 48 dB'), false)
    assert.equal(hastaDiliTemizMi('Sensorinöral işitme kaybı tanınız'), false)
    assert.equal(hastaDiliTemizMi('BPPV için Epley uygulandı'), false)
    assert.equal(hastaDiliTemizMi('Kulak damlası 2x1, amoksisilin 500 mg'), false)
    assert.equal(hastaDiliTemizMi('Timpanik membran perforasyon'), false)
    assert.equal(hastaDiliTemizMi('İşitme testi randevusu · 12 Ekim 2026'), true)
  })

  it('hatirlatmaDurumu windows', () => {
    assert.equal(hatirlatmaDurumu('2026-09-10', BUGUN), 'gecikti')
    assert.equal(hatirlatmaDurumu('2026-09-22', BUGUN), 'yaklasiyor')
    assert.equal(hatirlatmaDurumu('2026-11-20', BUGUN), 'planli')
    assert.equal(hatirlatmaDurumu(null, BUGUN), 'planli')
  })

  it('hatirlatmalar dedupe, sort by date and split into test / islem buckets', () => {
    const liste = kulaklarimHatirlatmalari({
      bugun: BUGUN,
      gorevler: [
        { kod: 'odyo_tekrar', due: '2026-10-17' },
        { kod: 'isitme_test', due: '2026-10-17' }, // aynı başlık + aynı tarih → tek satır
        { kod: 'osas_sevk', due: '2026-09-10' },
        { kod: 'pansuman', due: '2026-09-21' },
        { kod: 'kontrol_randevu', due: '2026-09-25' },
      ],
      sonrakiKontrolIso: '2026-09-25',
    })
    assert.equal(liste.length, 4)
    assert.equal(liste[0].due, '2026-09-10')
    assert.equal(liste[0].durum, 'gecikti')
    assert.deepEqual(testHatirlatmalari(liste).map((h) => h.ad), ['Uyku tetkiki randevusu', 'İşitme testi randevusu'])
    assert.deepEqual(islemHatirlatmalari(liste).map((h) => h.ad), ['Kulak temizliği / pansuman randevusu'])
    const sk = sonrakiKontrol(liste)
    assert.equal(sk?.tarih, '2026-09-21')
    assert.equal(sk?.neden, 'Kulak temizliği / pansuman randevusu')
  })

  it('view component never renders dB, band, diagnosis or drug fields', () => {
    // Dosya başlığı yasak sözcükleri KURAL olarak sayar; kontrol edilen şey kodun kendisi.
    const view = oku('app/portal/_components/KulaklarimView.tsx').replace(/\/\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(view, /\bdB\b|PTA|odyogram|sensorin|perforasyon|BPPV|tanı/i)
  })
})
