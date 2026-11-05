/**
 * KD-RAPOR-01 (2026-11-05) — USG / NST arithmetic against the published thresholds, the doğum epikrizi built from
 * recorded data, and the KD-only gate of the reports panel.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  BOS_JINEKOLOJIK_USG, BOS_OBSTETRIK_USG, afiBandi, dvpBandi, elipsoidHacimMl, jinekolojikUsgDogrula, jinekolojikUsgHesapla,
  mcaPsvMedian, obstetrikUsgDogrula, obstetrikUsgHesapla,
} from '../engines/usgRaporu'
import { BOS_NST, nstDogrula, nstSiniflandir, type NstGirdi } from '../engines/nstKtg'
import { dogumEpikriziKur, type EpikrizGirdi } from '../engines/dogumEpikrizi'
import { kadinDogumBransi } from '../../../lib/doktor/hastaDosyaSekmeleri'

const oku = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

describe('Obstetric USG', () => {
  it('liquor bands: AFI ≤5 oligo, ≥24 poly; SDP <2 oligo, ≥8 poly (ACOG CO 831, SMFM #46)', () => {
    assert.equal(afiBandi(5), 'oligo'); assert.equal(afiBandi(5.1), 'normal'); assert.equal(afiBandi(23.9), 'normal'); assert.equal(afiBandi(24), 'poli')
    assert.equal(dvpBandi(1.9), 'oligo'); assert.equal(dvpBandi(2), 'normal'); assert.equal(dvpBandi(7.9), 'normal'); assert.equal(dvpBandi(8), 'poli')
    assert.equal(afiBandi(null), null)
  })
  it('MCA-PSV median (Mari 2000) and MoM; defined 18–40 weeks only', () => {
    assert.ok(Math.abs(mcaPsvMedian(30)! - Math.exp(2.31 + 0.046 * 30)) < 1e-9)
    assert.ok(Math.abs(mcaPsvMedian(30)! - 40.04) < 0.01)
    assert.equal(mcaPsvMedian(17.9), null); assert.equal(mcaPsvMedian(40.1), null)
    const h = obstetrikUsgHesapla({ ...BOS_OBSTETRIK_USG, haftaGun: { hafta: 30, gun: 0 }, mcaPsv: 60.1 })
    assert.equal(h.mcaMom, 1.5); assert.equal(h.mcaAnemiBayragi, true)
    const h2 = obstetrikUsgHesapla({ ...BOS_OBSTETRIK_USG, haftaGun: { hafta: 30, gun: 0 }, mcaPsv: 45 })
    assert.equal(h2.mcaAnemiBayragi, false)
  })
  it('CPR = MCA PI / UA PI, flagged below 1.08 (Gramellini 1992); UA EDF absent/reversed flagged; FHR outside 110–160', () => {
    const h = obstetrikUsgHesapla({ ...BOS_OBSTETRIK_USG, mcaPi: 1.8, uaPi: 1.2, uaEdf: 'ters', fkh: 105 })
    assert.equal(h.cpr, 1.5); assert.equal(h.cprDusuk, false); assert.equal(h.uaEdfBayragi, 'ters'); assert.equal(h.fkhBayragi, 'bradikardi')
    const h2 = obstetrikUsgHesapla({ ...BOS_OBSTETRIK_USG, mcaPi: 1.0, uaPi: 1.0, fkh: 165, uaEdf: 'var' })
    assert.equal(h2.cprDusuk, true); assert.equal(h2.fkhBayragi, 'tasikardi'); assert.equal(h2.uaEdfBayragi, null)
  })
  it('biometry uses the INTERGROWTH-21st tables already in the product; EFW is Hadlock', () => {
    const h = obstetrikUsgHesapla({ ...BOS_OBSTETRIK_USG, haftaGun: { hafta: 20, gun: 0 }, hcMm: 172.5, acMm: 150, flMm: 32 })
    const hc = h.biyometri.find((b) => b.param === 'hc')!
    assert.equal(hc.persentil, 50); assert.equal(hc.durum, 'normal')
    assert.ok(h.efw != null && h.efw > 200 && h.efw < 500)
    assert.equal(obstetrikUsgHesapla({ ...BOS_OBSTETRIK_USG, hcMm: 172.5 }).biyometri.length, 0, 'no GA → no percentile')
  })
  it('NT uses the existing absolute flag; uterine PI is averaged without a centile', () => {
    const h = obstetrikUsgHesapla({ ...BOS_OBSTETRIK_USG, haftaGun: { hafta: 12, gun: 3 }, ntMm: 3.6, uterinPiSag: 1.2, uterinPiSol: 1.6 })
    assert.equal(h.nt?.bayrak, true); assert.equal(h.uterinOrtPi, 1.4)
  })
  it('validation refuses a physiologically impossible number and keeps the rest', () => {
    assert.equal(obstetrikUsgDogrula({ tarih: '2026-11-05', fkh: 400 }).ok, false)
    assert.equal(obstetrikUsgDogrula({ tarih: 'dün' }).ok, false)
    const r = obstetrikUsgDogrula({ tarih: '2026-11-05', afiCm: '12,5', uaEdf: 'yok', anatomi: { omurga: 'normal', bilinmeyen: 'x' } })
    assert.equal(r.ok, true); if (r.ok) { assert.equal(r.veri.afiCm, 12.5); assert.equal(r.veri.uaEdf, 'yok'); assert.deepEqual(r.veri.anatomi, { omurga: 'normal' }) }
  })
})

describe('Gynaecological USG', () => {
  it('ellipsoid volumes; the postmenopausal endometrium flag above 4 mm only after menopause (ACOG CO 734)', () => {
    assert.equal(elipsoidHacimMl(80, 40, 50), 83.7)
    assert.equal(elipsoidHacimMl(80, null, 50), null)
    assert.equal(jinekolojikUsgHesapla({ ...BOS_JINEKOLOJIK_USG, menopoz: true, endometriumMm: 5 }).postmenopozalEndometriumBayragi, true)
    assert.equal(jinekolojikUsgHesapla({ ...BOS_JINEKOLOJIK_USG, menopoz: true, endometriumMm: 4 }).postmenopozalEndometriumBayragi, false)
    assert.equal(jinekolojikUsgHesapla({ ...BOS_JINEKOLOJIK_USG, menopoz: false, endometriumMm: 12 }).postmenopozalEndometriumBayragi, false)
  })
  it('lesions are validated and capped', () => {
    const r = jinekolojikUsgDogrula({ tarih: '2026-11-05', lezyonlar: [{ yer: 'uterus', tur: 'myom', boyutMm: [30, 25, 28], figo: '4', orads: '', aciklama: 'intramural' }] })
    assert.equal(r.ok, true); if (r.ok) assert.equal(r.veri.lezyonlar[0].tur, 'myom')
    assert.equal(jinekolojikUsgDogrula({ tarih: '2026-11-05', overSag: [0, 20, 20] }).ok, false)
  })
})

describe('NST — FIGO 2015 classification and ACOG PB 229 reactivity', () => {
  const g = (x: Partial<NstGirdi>): NstGirdi => ({ ...BOS_NST, tarih: '2026-11-05', haftaGun: { hafta: 36, gun: 0 }, sureDk: 20, bazalFkh: 140, varyabiliteBpm: 10, akselerasyon20dk: 3, ...x })
  it('normal trace', () => {
    const r = nstSiniflandir(g({}))
    assert.equal(r.figo, 'normal'); assert.equal(r.reaktivite, 'reaktif'); assert.equal(r.akselerasyonEsigi, '15x15')
  })
  it('suspicious: a departure from normality with no pathological feature', () => {
    assert.equal(nstSiniflandir(g({ bazalFkh: 165 })).figo, 'supheli')
    assert.equal(nstSiniflandir(g({ bazalFkh: 105 })).figo, 'supheli')
    assert.equal(nstSiniflandir(g({ varyabiliteBpm: 4, azalmisVaryabiliteDk: 30 })).figo, 'supheli')
    assert.equal(nstSiniflandir(g({ tekrarlayan: true, degiskenDes: 4 })).figo, 'supheli')
  })
  it('pathological features', () => {
    assert.equal(nstSiniflandir(g({ bazalFkh: 95 })).figo, 'patolojik')
    assert.equal(nstSiniflandir(g({ varyabiliteBpm: 3, azalmisVaryabiliteDk: 55 })).figo, 'patolojik')
    assert.equal(nstSiniflandir(g({ varyabiliteBpm: 30, artmisVaryabiliteDk: 35 })).figo, 'patolojik')
    assert.equal(nstSiniflandir(g({ sinuzoidalDk: 31 })).figo, 'patolojik')
    assert.equal(nstSiniflandir(g({ enUzunDesDk: 6, uzamisDes: 1 })).figo, 'patolojik')
    assert.equal(nstSiniflandir(g({ tekrarlayan: true, gecDes: 6, tekrarlayanDesDk: 35 })).figo, 'patolojik')
    assert.equal(nstSiniflandir(g({ tekrarlayan: true, gecDes: 6, tekrarlayanDesDk: 25 })).figo, 'supheli', '25 min with normal variability')
    assert.equal(nstSiniflandir(g({ tekrarlayan: true, gecDes: 6, tekrarlayanDesDk: 25, varyabiliteBpm: 4 })).figo, 'patolojik', '>20 min with reduced variability')
  })
  it('reactivity: <2 accelerations → extend to 40 min, then non-reactive; <32 weeks uses 10×10', () => {
    assert.equal(nstSiniflandir(g({ akselerasyon20dk: 1, sureDk: 20 })).reaktivite, 'uzatilmali')
    assert.equal(nstSiniflandir(g({ akselerasyon20dk: 1, sureDk: 40 })).reaktivite, 'non_reaktif')
    assert.equal(nstSiniflandir(g({ haftaGun: { hafta: 30, gun: 0 } })).akselerasyonEsigi, '10x10')
  })
  it('tachysystole is reported; incomplete input is not classified', () => {
    assert.ok(nstSiniflandir(g({ kontraksiyon10dk: 6 })).ozellikler.includes('tasisistoli'))
    assert.equal(nstSiniflandir({ ...BOS_NST }).tamam, false)
    assert.equal(nstDogrula({ tarih: '2026-11-05', bazalFkh: 300, varyabiliteBpm: 10 }).ok, false)
    assert.equal(nstDogrula({ tarih: '2026-11-05', bazalFkh: 140 }).ok, false)
  })
})

describe('Doğum epikrizi — built from recorded data only', () => {
  const temel: EpikrizGirdi = {
    gebelik: { sat: '2026-02-01', tdt: '2026-11-08' },
    dogum: { dogum_sekli: 'cs_acil', dogum_zamani: '2026-11-01T10:00:00Z', cs_endikasyon: ['Fetal distres'], pph: { tahmin_ml: '900', siniflama: 'PPH (≥1000 mL değil)' } },
    bebekler: [{ sira: 1, cinsiyet: 'K', kilo_gram: 3200, apgar1: 8, apgar5: 9, gebelik_haftasi: 39, canli: true }],
    komplikasyonlar: [{ kime: 'anne', ad: 'Preeklampsi', ayrinti: null }, { kime: 'bebek', ad: 'TTN', ayrinti: null }],
    ameliyatNotu: { kanKaybiMl: 700, komplikasyon: 'Yok', postopOrderlar: '', islem: 'Sezaryen' },
    ilaclar: [{ ilac_adi: 'Demir', doz: '1x1', kullanim_sikli: null }],
    emziriyor: true,
  }
  it('mode, GA, newborn, blood loss from the operation note first, the mother\'s complications only', () => {
    const e = dogumEpikriziKur(temel)
    assert.equal(e.sekil, 'Acil sezaryen'); assert.equal(e.sezaryenMi, true); assert.equal(e.hafta, '39 hafta')
    assert.deepEqual(e.kanKaybi, { ml: 700, kaynak: 'ameliyat_notu' })
    assert.equal(e.bebekler[0].kilo, '3200 g'); assert.equal(e.bebekler[0].apgar, '8 / 9')
    assert.ok(e.anneKomplikasyonlari.some((k) => k.startsWith('Preeklampsi')))
    assert.ok(!e.anneKomplikasyonlari.some((k) => k.includes('TTN')))
    assert.ok(e.talimatlar.some((t) => t.includes('Sezaryen yarası')))
  })
  it('without an operation note the PPH record is used; follow-up dates come from the delivery date (SB lohusa izlemleri)', () => {
    const e = dogumEpikriziKur({ ...temel, ameliyatNotu: null, dogum: { ...temel.dogum!, dogum_sekli: 'nsd' } })
    assert.deepEqual(e.kanKaybi, { ml: 900, kaynak: 'pph_kaydi' })
    assert.equal(e.kontroller[0].tarihAraligi, '03.11.2026 – 06.11.2026')
    assert.ok(!e.talimatlar.some((t) => t.includes('Sezaryen yarası')))
  })
  it('contraception follows breastfeeding (WHO MEC engine of the chapter)', () => {
    const emziren = dogumEpikriziKur(temel).kontrasepsiyon.map((k) => k.yontem)
    const emzirmeyen = dogumEpikriziKur({ ...temel, emziriyor: false }).kontrasepsiyon.map((k) => k.yontem)
    assert.ok(emziren.some((y) => /LAM|Laktasyon|lam/i.test(y)) || emziren.length > 0)
    assert.ok(!emziren.some((y) => /Kombine oral/.test(y)), 'no combined pill offered to a breastfeeding mother at discharge')
    assert.ok(emzirmeyen.some((y) => /Kombine oral/.test(y)))
  })
  it('unrecorded values print as "—", never invented', () => {
    const e = dogumEpikriziKur({ ...temel, ameliyatNotu: null, dogum: { dogum_sekli: null, dogum_zamani: null }, bebekler: [] })
    assert.equal(e.sekil, '—'); assert.equal(e.hafta, '—'); assert.equal(e.kanKaybi.ml, null)
  })
})

describe('KD-only gate of the reports (brans-alan-sizmasi)', () => {
  it('kadinDogumBransi: KD (every spelling) yes; aile hekimliği, pediatri, dahiliye, göz, genel cerrahi no', () => {
    for (const b of ['kadin-hastaliklari-dogum', 'kadin-dogum', 'Kadın Hastalıkları ve Doğum']) assert.equal(kadinDogumBransi(b), true, b)
    for (const b of ['aile-hekimligi', 'pediatri', 'dahiliye', 'goz-hastaliklari', 'genel-cerrahi', '', null]) assert.equal(kadinDogumBransi(b), false, String(b))
  })
  it('HastaGebelik mounts the reports only behind that gate (the section itself is shared with aile hekimliği)', () => {
    const s = oku('components/doktor/HastaGebelik.tsx')
    assert.match(s, /const kdHekimi = kadinDogumBransi\(doktorBransi\)/)
    assert.match(s, /\{kdHekimi && <KdRaporlar /)
    assert.equal((s.match(/<KdRaporlar /g) || []).length, 1)
  })
  it('the caesarean free-text box is replaced by the structured note, and the old record stays readable', () => {
    const s = oku('specialties/kadin-dogum/ui/DogumSpine.tsx')
    assert.ok(!s.includes("['preop', 'intraop', 'ssvd']"))
    assert.match(s, /<SezaryenAmeliyatNotu patientId=\{patientId\} dogumId=\{d\.id\} intraop=\{d\.intraop\} \/>/)
  })
})
