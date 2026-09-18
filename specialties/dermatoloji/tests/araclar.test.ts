import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pasi, easi, scorad, pasiBandi, easiBandi, scoradBandi } from '../engines/score-calculator'
import { gopIsotretinoin, GOP_BLOCK } from '../engines/gop-isotretinoin'
import { cumulativeJ, fototerapiOzeti, sonSeans, BURN_CHECKLIST, PHOTO_DEVICES, type PhotoSession } from '../engines/phototherapy-log'
import { plannedReads, patchStatus, EUROPEAN_BASELINE, EUROPEAN_BASELINE_STUB, baselineAlerjenAdi } from '../engines/patch-calendar'
import { dermKohortSatiri, dermKohortSatirlari, dermHatirlatmaMesaji, DERM_BAYRAK_AD, type DermKohortGirdi } from '../engines/kohort'

const BUGUN = '2026-05-20'

const bolge = (e: number, i: number, d: number, a: number, l = 0) => ({ e, i, d, a, l })

describe('Araçlar › PASI / EASI / SCORAD', () => {
  it('PASI uses 0.1/0.2/0.3/0.4 region weights on (E+I+D)×A', () => {
    // baş 0,1×(2+2+2)×3 = 1,8 · üst 0,2×(1+1+1)×2 = 1,2 · gövde 0 · alt 0,4×(3+3+3)×4 = 14,4
    assert.equal(pasi({ head: bolge(2, 2, 2, 3), upper: bolge(1, 1, 1, 2), trunk: bolge(0, 0, 0, 0), lower: bolge(3, 3, 3, 4) }), 17.4)
  })

  it('PASI is 0 while no region has an area grade', () => {
    assert.equal(pasi({ head: bolge(4, 4, 4, 0), upper: bolge(4, 4, 4, 0), trunk: bolge(4, 4, 4, 0), lower: bolge(4, 4, 4, 0) }), 0)
  })

  it('EASI counts four severity items (lichenification included) and clamps each at 3', () => {
    const uc = easi({ head: bolge(1, 1, 1, 2), upper: bolge(0, 0, 0, 0), trunk: bolge(0, 0, 0, 0), lower: bolge(0, 0, 0, 0) })
    const dort = easi({ head: bolge(1, 1, 1, 2, 3), upper: bolge(0, 0, 0, 0), trunk: bolge(0, 0, 0, 0), lower: bolge(0, 0, 0, 0) })
    assert.equal(uc, 0.6)
    assert.equal(dort, 1.2)
    // PASI'nin 4'lük ölçeği EASI'ye taşmaz
    assert.equal(easi({ head: bolge(9, 9, 9, 9, 9), upper: bolge(0, 0, 0, 0), trunk: bolge(0, 0, 0, 0), lower: bolge(0, 0, 0, 0) }), 7.2)
  })

  it('SCORAD = extent/5 + 3.5×intensity + subjective', () => {
    assert.equal(scorad(50, 10, 12), 57)
  })

  it('severity bands are decision support thresholds (PASI 10/20 · EASI 7/21 · SCORAD 25/50)', () => {
    assert.equal(pasiBandi(9.9).kod, 'hafif')
    assert.equal(pasiBandi(10).kod, 'orta')
    assert.equal(pasiBandi(20).kod, 'siddetli')
    assert.equal(easiBandi(6.9).kod, 'hafif')
    assert.equal(easiBandi(7).kod, 'orta')
    assert.equal(easiBandi(21).kod, 'siddetli')
    assert.equal(scoradBandi(24).kod, 'hafif')
    assert.equal(scoradBandi(25).kod, 'orta')
    assert.equal(scoradBandi(50).kod, 'siddetli')
  })
})

describe('Araçlar › GÖP izotretinoin kapı', () => {
  const taban = { two_contraception: true, hcg_iso: '2026-05-15', hcg_negative: true, cycle_day: 2, rx_days: 30, start_iso: BUGUN, today_iso: BUGUN }

  it('all gates met → allowed', () => {
    assert.deepEqual(gopIsotretinoin({ ...taban, sex: 'female' }), { allowed: true })
  })

  it('lists every failing gate for a female patient', () => {
    const r = gopIsotretinoin({ ...taban, sex: 'female', two_contraception: false, hcg_iso: '2026-05-01', cycle_day: 9, rx_days: 60 })
    assert.equal(r.allowed, false)
    if (!r.allowed) {
      assert.deepEqual(r.blocks, [GOP_BLOCK.twoContraception, GOP_BLOCK.staleHcg, GOP_BLOCK.cycleDay, GOP_BLOCK.rxDays])
    }
  })

  it('male patient skips pregnancy gates but keeps the 30-day rx limit', () => {
    const r = gopIsotretinoin({ ...taban, sex: 'male', two_contraception: false, hcg_iso: null, hcg_negative: false, cycle_day: null, rx_days: 45 })
    assert.equal(r.allowed, false)
    if (!r.allowed) assert.deepEqual(r.blocks, [GOP_BLOCK.rxDays])
    assert.equal(r.notApplicable?.length, 3)
  })

  it('unknown sex is treated as pregnancy-capable (safer default)', () => {
    const r = gopIsotretinoin({ ...taban, two_contraception: false })
    assert.equal(r.allowed, false)
    if (!r.allowed) assert.ok(r.blocks.includes(GOP_BLOCK.twoContraception))
  })
})

describe('Araçlar › Fototerapi defteri', () => {
  const seanslar: PhotoSession[] = [
    { date: '2026-05-01', device: 'nb-uvb-311', j_cm2: 0.3, med_test: true, med_j_cm2: 0.28, dose_step: 0.1 },
    { date: '2026-05-04', device: 'nb-uvb-311', j_cm2: 0.4, dose_step: 0.1 },
    { date: '2026-05-08', device: 'excimer-308', j_cm2: 1.2 },
  ]

  it('cumulative J/cm² is per device and over everything', () => {
    assert.equal(cumulativeJ(seanslar, 'nb-uvb-311'), 0.7)
    assert.equal(cumulativeJ(seanslar), 1.9)
  })

  it('summary reports last dose, MED and the doctor-entered next-dose draft', () => {
    const o = fototerapiOzeti(seanslar, 'nb-uvb-311')
    assert.equal(o.seans, 2)
    assert.equal(o.kumulatif, 0.7)
    assert.equal(o.sonTarih, '2026-05-04')
    assert.equal(o.sonDoz, 0.4)
    assert.equal(o.medJ, 0.28)
    assert.equal(o.sonrakiDozTaslagi, 0.5)
  })

  it('a burn on the last session withholds the next-dose draft', () => {
    const o = fototerapiOzeti([...seanslar, { date: '2026-05-11', device: 'nb-uvb-311', j_cm2: 0.5, burn: true, dose_step: 0.1 }], 'nb-uvb-311')
    assert.equal(o.yanik, 1)
    assert.equal(o.sonrakiDozTaslagi, null)
  })

  it('sessions are ordered by date, not insertion order', () => {
    assert.equal(sonSeans([seanslar[1], seanslar[0]], 'nb-uvb-311')?.date, '2026-05-04')
  })

  it('solarium is not a device and the burn checklist is not empty', () => {
    assert.equal((PHOTO_DEVICES as readonly string[]).includes('solarium'), false)
    assert.ok(BURN_CHECKLIST.length >= 4)
  })
})

describe('Araçlar › Yama D2 / D4', () => {
  it('applied day → D2 and D4 reads', () => {
    assert.deepEqual(plannedReads('2026-05-18'), { d2: '2026-05-20', d4: '2026-05-22' })
  })

  it('status walks not_yet → open_d2 → overdue_d2 → open_d4 → done', () => {
    const kur = { series: 'european_baseline' as const, appliedAt: '2026-05-18', readD2: null, readD4: null, photoIds: [], positives: [] }
    assert.equal(patchStatus(kur, '2026-05-19'), 'not_yet')
    assert.equal(patchStatus(kur, '2026-05-20'), 'open_d2')
    assert.equal(patchStatus(kur, '2026-05-21'), 'overdue_d2')
    assert.equal(patchStatus({ ...kur, readD2: '2026-05-20' }, '2026-05-22'), 'open_d4')
    assert.equal(patchStatus({ ...kur, readD2: '2026-05-20', readD4: '2026-05-22' }, '2026-05-23'), 'done')
  })

  it('European baseline is a selectable list of ≥20 allergens with unique codes', () => {
    assert.ok(EUROPEAN_BASELINE.length >= 20)
    assert.equal(new Set(EUROPEAN_BASELINE.map((a) => a.kod)).size, EUROPEAN_BASELINE.length)
    assert.ok(EUROPEAN_BASELINE.every((a) => a.ad.length > 1 && a.kaynak.length > 1))
    for (const kod of ['nickel-sulfate', 'ppd', 'mci-mi', 'formaldehyde', 'fragrance-mix-1']) {
      assert.ok(EUROPEAN_BASELINE.some((a) => a.kod === kod), kod)
    }
    assert.equal(EUROPEAN_BASELINE_STUB.length, EUROPEAN_BASELINE.length)
    assert.equal(baselineAlerjenAdi('nickel-sulfate'), 'Nikel sülfat')
    assert.equal(baselineAlerjenAdi('bilinmeyen'), 'bilinmeyen')
  })
})

describe('Araçlar › Derm kohort', () => {
  const bos: DermKohortGirdi = {
    patientId: 'p1', ad: 'QA Hasta', sonTbse: null, tbseTakipte: false,
    yamaKurslari: [], fototerapi: [], ilacTakip: [], tbTarama: true, hbvTarama: true,
    gorevler: [], sonVizit: null, portalVar: true,
  }

  it('a patient with nothing overdue raises no flag', () => {
    assert.deepEqual(dermKohortSatiri(bos, BUGUN).bayraklar, [])
    assert.deepEqual(dermKohortSatirlari([bos], BUGUN), [])
  })

  it('TBSE flags after a year, and only when the patient is in lesion follow-up if never done', () => {
    assert.deepEqual(dermKohortSatiri({ ...bos, sonTbse: '2025-05-19' }, BUGUN).bayraklar, ['tbse_gecikti'])
    assert.deepEqual(dermKohortSatiri({ ...bos, sonTbse: '2026-01-10' }, BUGUN).bayraklar, [])
    assert.deepEqual(dermKohortSatiri({ ...bos, sonTbse: null, tbseTakipte: true }, BUGUN).bayraklar, ['tbse_gecikti'])
    assert.deepEqual(dermKohortSatiri({ ...bos, sonTbse: null, tbseTakipte: false }, BUGUN).bayraklar, [])
  })

  it('patch reading flags while open or overdue, never once both reads are done', () => {
    assert.deepEqual(dermKohortSatiri({ ...bos, yamaKurslari: [{ appliedAt: '2026-05-18', readD2: null, readD4: null }] }, BUGUN).bayraklar, ['yama_okuma'])
    assert.deepEqual(dermKohortSatiri({ ...bos, yamaKurslari: [{ appliedAt: '2026-05-12', readD2: '2026-05-14', readD4: '2026-05-16' }] }, BUGUN).bayraklar, [])
  })

  it('phototherapy flags a widened gap or a burn, but not a finished course', () => {
    assert.deepEqual(dermKohortSatiri({ ...bos, fototerapi: [{ tarih: '2026-05-05', yanik: false }] }, BUGUN).bayraklar, ['fototerapi_seans'])
    assert.deepEqual(dermKohortSatiri({ ...bos, fototerapi: [{ tarih: '2026-05-18', yanik: false }] }, BUGUN).bayraklar, [])
    assert.deepEqual(dermKohortSatiri({ ...bos, fototerapi: [{ tarih: '2026-01-02', yanik: false }] }, BUGUN).bayraklar, [])
    assert.deepEqual(dermKohortSatiri({ ...bos, fototerapi: [{ tarih: '2026-05-18', yanik: true }] }, BUGUN).bayraklar, ['fototerapi_seans'])
  })

  it('β-hCG and systemic lab follow-ups are separate flags', () => {
    assert.deepEqual(dermKohortSatiri({ ...bos, ilacTakip: [{ ilac: 'izotretinoin', aylikDue: '2026-05-10' }] }, BUGUN).bayraklar, ['beta_hcg'])
    assert.deepEqual(dermKohortSatiri({ ...bos, ilacTakip: [{ ilac: 'izotretinoin', aylikDue: '2026-06-10' }] }, BUGUN).bayraklar, [])
    assert.deepEqual(dermKohortSatiri({ ...bos, ilacTakip: [{ ilac: 'biyolojik', aylikDue: '2026-05-01' }] }, BUGUN).bayraklar, ['biyolojik_lab'])
    assert.deepEqual(dermKohortSatiri({ ...bos, ilacTakip: [{ ilac: 'biyolojik', aylikDue: null }], tbTarama: false }, BUGUN).bayraklar, ['biyolojik_lab'])
    // tarama eksikliği tek başına, sistemik tedavi yoksa bayrak değildir
    assert.deepEqual(dermKohortSatiri({ ...bos, tbTarama: false, hbvTarama: false }, BUGUN).bayraklar, [])
  })

  it('lesion tasks flag melanom codes immediately and dated lezyon tasks when due', () => {
    assert.deepEqual(dermKohortSatiri({ ...bos, gorevler: [{ kod: 'melanom_ab12', ad: 'Eksizyonel biyopsi planı', due: null, kaynak: 'lezyon' }] }, BUGUN).bayraklar, ['melanom_gorev'])
    assert.deepEqual(dermKohortSatiri({ ...bos, gorevler: [{ kod: 'lezyon_kontrol', ad: 'Lezyon kontrolü', due: '2026-07-01', kaynak: 'lezyon' }] }, BUGUN).bayraklar, [])
    assert.deepEqual(dermKohortSatiri({ ...bos, gorevler: [{ kod: 'islem_yara', ad: 'Yara bakımı', due: '2026-05-01', kaynak: 'islem' }] }, BUGUN).bayraklar, [])
  })

  it('rows sort oldest overdue first and keep only flagged patients', () => {
    const a = { ...bos, patientId: 'a', ad: 'A', sonTbse: '2024-01-01' }
    const b = { ...bos, patientId: 'b', ad: 'B', sonTbse: '2025-01-01' }
    assert.deepEqual(dermKohortSatirlari([b, a, bos], BUGUN).map((s) => s.patientId), ['a', 'b'])
  })

  it('reminder text is patient-safe: no score, dose, drug name or diagnosis, and carries the 112 line', () => {
    const hepsi = Object.keys(DERM_BAYRAK_AD) as (keyof typeof DERM_BAYRAK_AD)[]
    const m = dermHatirlatmaMesaji(hepsi)
    assert.equal(m.konu, 'Deri kontrol hatırlatması')
    assert.doesNotMatch(m.metin, /PASI|EASI|SCORAD|izotretinoin|biyolojik|metotreksat|melanom|psoriasis|β-hCG|mg|J\/cm²/i)
    assert.match(m.metin, /112/)
    const bos2 = dermHatirlatmaMesaji([])
    assert.match(bos2.metin, /Deri kontrolünüzün zamanı geldi/)
  })
})
