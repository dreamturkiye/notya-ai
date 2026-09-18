import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { portalModulAktif } from './moduller'
import { specialtyProfile } from '../specialties/registry'
import {
  derimHatirlatmalari, gorevBasligi, hastaDiliTemizMi, hatirlatmaDurumu, seansAraligi, sonrakiKontrol, TBSE_BASLIK,
} from '../../specialties/dermatoloji/engines/portal-derim'

const oku = (p: string) => fs.readFileSync(path.join(import.meta.dirname, '..', '..', p), 'utf8')

const BUGUN = '2026-09-18'
const temelGirdi = {
  bugun: BUGUN,
  gorevler: [] as Array<{ kod: string; due: string | null }>,
  ilacGuvenlik: [] as Array<{ ilac: string; aylikDue: string | null }>,
  yamaKurslari: [] as Parameters<typeof derimHatirlatmalari>[0]['yamaKurslari'],
  sonFototerapiSeansi: null as string | null,
  fototerapiAralikGun: null as number | null,
  sonTbse: null as string | null,
  sonrakiFoto: null as string | null,
}

describe('Derim portal — Strong + registry gated', () => {
  it('dermatoloji profile declares Derim Strong with /derim nav', () => {
    const m = specialtyProfile('dermatoloji').portal![0]
    assert.equal(m.derinlik, 'Strong')
    assert.equal(m.nav[0]?.path, '/derim')
    assert.ok(m.views.includes('DerimView'))
    assert.equal(specialtyProfile('dermatoloji').olgunluk, 'beta-hazir')
  })

  it('DerimView has no diagnosis / morph / score language', () => {
    const src = oku('app/portal/_components/DerimView.tsx')
    assert.ok(!/psoriasis|melanom|PASI|BSA|ABCDE|tanınız/i.test(src))
    assert.ok(/yorum ve tanı doktorunuzdadır/i.test(src))
  })

  it('route gated by dermatoloji module', () => {
    const page = oku('app/portal/hasta/[token]/derim/page.tsx')
    assert.ok(/portalModulAktif\(data, 'dermatoloji'\)/.test(page))
    assert.equal(portalModulAktif({ portal: { moduller: ['dermatoloji'] } }, 'dermatoloji'), true)
    assert.equal(portalModulAktif({ portal: { moduller: ['gozlerim'] } }, 'dermatoloji'), false)
  })

  it('the portal API forwards engine titles, never the doctor’s görev metni', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /derimHatirlatmalari\(/)
    // derm_gorevleri.ad (klinik dil: "MELANOM ŞÜPHESİ: …") portal sorgusunda seçilmez.
    const derimBlok = rota.slice(rota.indexOf("modulAktif('dermatoloji')"), rota.indexOf("console.error('[portal] derim:"))
    assert.ok(!/derm_gorevleri'\)\.select\('ad/.test(derimBlok))
    assert.ok(!/String\(g\.ad\)/.test(derimBlok), 'hekim görev metni hastaya taşınmaz')
  })
})

describe('Derim hatırlatma motoru — hekim tetikli, hasta-güvenli', () => {
  it('görev kodu sabit hasta-güvenli başlığa çevrilir; tanı/ilaç dili taşınmaz', () => {
    assert.equal(gorevBasligi('izo_bhcg'), 'Aylık kan testi (gebelik testi) — tedavi güvenliği için')
    assert.equal(gorevBasligi('melanom_a1b2c3d4'), 'Öncelikli kontrol randevusu — muayenehane sizi arayacak')
    assert.equal(gorevBasligi('yara_punch_12345678'), 'Yara bakımı kontrolü')
    assert.equal(gorevBasligi('sutur_eksizyon_12345678'), 'Dikiş alma randevusu')
    assert.equal(gorevBasligi('pat_punch_12345678'), 'Biyopsi sonucu görüşmesi')
    assert.equal(gorevBasligi('ped_atopik'), 'Kontrol randevusu')
    assert.equal(gorevBasligi('bilinmeyen_kod'), 'Kontrol randevusu')
    assert.equal(gorevBasligi(null), 'Kontrol randevusu')
  })

  it('β-hCG, fototerapi, yama D2/D4, yara kontrol ve TBSE tek listede toplanır', () => {
    const liste = derimHatirlatmalari({
      ...temelGirdi,
      gorevler: [{ kod: 'yara_punch_1234', due: '2026-09-25' }, { kod: 'melanom_9999', due: '2026-09-19' }],
      ilacGuvenlik: [{ ilac: 'izotretinoin', aylikDue: '2026-10-01' }],
      yamaKurslari: [{ series: 'european_baseline', appliedAt: '2026-09-14', readD2: null, readD4: null, photoIds: [], positives: [] }],
      sonFototerapiSeansi: '2026-09-15',
      fototerapiAralikGun: 3,
      sonTbse: '2024-05-02',
    })
    const adlar = liste.map((h) => h.ad)
    assert.ok(adlar.includes('Aylık kan testi (gebelik testi) — tedavi güvenliği için'))
    assert.ok(adlar.includes('Fototerapi seansı'))
    assert.ok(adlar.some((a) => /^Yama testi okuması/.test(a)))
    assert.ok(adlar.includes('Yara bakımı kontrolü'))
    assert.ok(adlar.includes(TBSE_BASLIK))
    assert.ok(liste.every((h) => hastaDiliTemizMi(h.ad)), JSON.stringify(adlar))
    assert.deepEqual(liste.map((h) => h.due).filter(Boolean), [...liste.map((h) => h.due).filter(Boolean)].sort())
  })

  it('geciken / yaklaşan / planlı ayrımı', () => {
    assert.equal(hatirlatmaDurumu('2026-09-17', BUGUN), 'gecikti')
    assert.equal(hatirlatmaDurumu('2026-09-18', BUGUN), 'yaklasiyor')
    assert.equal(hatirlatmaDurumu('2026-09-25', BUGUN), 'yaklasiyor')
    assert.equal(hatirlatmaDurumu('2026-10-30', BUGUN), 'planli')
    assert.equal(hatirlatmaDurumu(null, BUGUN), 'planli')
  })

  it('fototerapi seans aralığı kliniğin kendi kaydından okunur; uydurulmaz', () => {
    assert.equal(seansAraligi(['2026-09-15', '2026-09-12', '2026-09-09']), 3)
    assert.equal(seansAraligi(['2026-09-15']), null, 'tek seanstan takvim üretilmez')
    assert.equal(seansAraligi([]), null)
    assert.equal(seansAraligi(['2026-09-15', '2026-01-02']), null, '14 günü aşan aralık hatırlatma doğurmaz')
    const liste = derimHatirlatmalari({ ...temelGirdi, sonFototerapiSeansi: '2026-09-15', fototerapiAralikGun: null, sonTbse: BUGUN })
    assert.ok(!liste.some((h) => h.ad === 'Fototerapi seansı'))
  })

  it('okunmuş yama kursu hatırlatma üretmez; aynı başlık iki kez yazılmaz', () => {
    const liste = derimHatirlatmalari({
      ...temelGirdi,
      sonTbse: BUGUN,
      gorevler: [{ kod: 'yara_punch_1', due: '2026-09-30' }, { kod: 'yara_kriyo_2', due: '2026-09-22' }],
      yamaKurslari: [{ series: 'european_baseline', appliedAt: '2026-09-01', readD2: '2026-09-03', readD4: '2026-09-05', photoIds: [], positives: [] }],
    })
    assert.deepEqual(liste.map((h) => h.ad), ['Yara bakımı kontrolü'])
    assert.equal(liste[0].due, '2026-09-22', 'en erken tarih kazanır')
  })

  it('yaklaşan kontrol kartı önce gecikeni gösterir', () => {
    const liste = derimHatirlatmalari({
      ...temelGirdi, sonTbse: BUGUN,
      gorevler: [{ kod: 'kontrol_1', due: '2026-10-05' }, { kod: 'sutur_eksizyon_1', due: '2026-09-10' }],
    })
    assert.deepEqual(sonrakiKontrol(liste), { tarih: '2026-09-10', neden: 'Dikiş alma randevusu' })
    assert.equal(sonrakiKontrol([]), null)
  })

  it('hasta dili kalkanı: skor, tanı, doz ve ilaç adı yakalanır', () => {
    for (const kotu of ['PASI 12 düştü', 'Melanom şüphesi', 'İzotretinoin 30 mg/gün', 'NB-UVB 1,2 J/cm²', 'ABCDE değerlendirmesi']) {
      assert.equal(hastaDiliTemizMi(kotu), false, kotu)
    }
    for (const iyi of ['Kontrol randevusu', TBSE_BASLIK, 'Yama testi okuması (2. gün)', 'Dikiş alma randevusu', 'Fototerapi seansı']) {
      assert.equal(hastaDiliTemizMi(iyi), true, iyi)
    }
  })
})
