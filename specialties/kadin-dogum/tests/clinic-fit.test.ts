import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  completedSbIzlemNos,
  markVisitsDone,
  aktifIzlemPenceresi,
  buildIzlemCalendar,
  SB_IZLEM_WINDOWS,
} from '../engines/izlem-calendar'
import {
  doneWindowIdsFromClinic,
  eksikLabKalemleri,
  onerilenSonrakiTarih,
  dualClinicWarnings,
  nstShouldMount,
  mapIdc,
  mapPlurality,
  sevkFromClinic,
} from '../engines/clinic-fit'
import { riskClassFromForm } from '../protocols/risk-formu'
import { vteScoreFromForm, vteHint } from '../protocols/vte-formu'
import { cycleNote } from '../protocols/jinekoloji'
import { gdmKarti, gbsKarti, peKarti, rhKarti } from '../protocols/karar-kartlari'
import { tehlikeDanismanlikMetni } from '../protocols/tehlike'
import { payloadFromGebelikApi, chapterCalendar, chapterWindows } from '../../../lib/specialties/kadin-dogum-live'
import { evaluateGBS } from '../protocols/risk-pe-gdm-rh'

const ROOT = join(import.meta.dirname, '..')

describe('clinic-fit unify', () => {
  it('marks SB izlem Yapıldı from recorded weeks and passes doneIds into tarama', () => {
    const completed = completedSbIzlemNos([12, 20])
    assert.deepEqual(completed, [1, 2])
    const visits = markVisitsDone(
      buildIzlemCalendar({ risk_class: 'dusuk', booking_ga_weeks: 10, episode_status: 'gebe' }),
      { completedWeeks: [12, 20] },
    )
    assert.equal(visits.find((v) => v.izlem_no === 1)?.done, true)
    assert.equal(visits.find((v) => v.izlem_no === 3)?.done, false)
    const windows = chapterWindows(20, 0, doneWindowIdsFromClinic({
      labs: { hemogram: { sonuc: '12.1' }, idrar: { sonuc: 'negatif' }, hbsag: { sonuc: 'negatif' }, tsh: { deger: '1.8' } },
      izlemler: [{ hafta: 20, usg: { bpd: 48 } }],
      genetik: [{ tur: 'ikili' }],
    }))
    assert.equal(windows.find((w) => w.id === 'first_visit_labs')?.status, 'done')
    assert.equal(windows.find((w) => w.id === 'ikili_nt')?.status, 'done')
    assert.equal(windows.find((w) => w.id === 'ayrintili_usg')?.status, 'done')
  })

  it('persists checklist shape yapildi/reddedildi+neden', () => {
    const pencere = aktifIzlemPenceresi(12, [])
    assert.equal(pencere.izlem_no, 1)
    assert.ok(pencere.checklist.includes('öykü'))
    const state = { öykü: { durum: 'yapildi' as const }, TSH: { durum: 'reddedildi' as const, neden: 'hasta reddi' } }
    assert.equal(state.TSH.neden, 'hasta reddi')
    assert.equal(SB_IZLEM_WINDOWS[0].checklist.length > 5, true)
  })

  it('risk form ticks drive class and sevk; VTE ≥3 hints tromboprofilaksi', () => {
    assert.equal(riskClassFromForm([]), 'dusuk')
    assert.equal(riskClassFromForm(['ileri_yas']), 'orta')
    assert.equal(riskClassFromForm(['kronik_ht']), 'yuksek')
    const sevk = sevkFromClinic({
      risk: 'yuksek',
      riskMaddeler: ['previa', 'kronik_ht'],
      plurality: 'twins',
      chorionicity: 'mo/di',
    })
    assert.equal(sevk.sevk, true)
    assert.ok(sevk.reason.length > 0)
    assert.equal(vteScoreFromForm(['onceki_vte']), 3)
    assert.equal(vteHint(['onceki_vte']).next.some((n) => /enoxaparin/i.test(n)), true)
    assert.equal(vteScoreFromForm(['bmi30', 'bmi40']), 2)
  })

  it('labs mark related windows; missing list is Turkish', () => {
    const eksik = eksikLabKalemleri({}, null)
    assert.ok(eksik.includes('Hemogram'))
    assert.ok(eksik.includes('HIV (onamlı)'))
    const done = doneWindowIdsFromClinic({
      labs: { ogtt: { sonuc: 'pozitif', tarih: '2026-08-01' } },
      izlemler: [{ hafta: 36, gbs_kultur: 'negatif' }],
    })
    assert.ok(done.includes('ogtt_gdm'))
    assert.ok(done.includes('gbs_prezentasyon'))
  })

  it('jine cycle-day ignores pregnancy SAT and uses jine LMP', () => {
    const pregnancySat = cycleNote('2026-01-15', '2026-09-16')
    assert.equal(pregnancySat.day, null)
    assert.match(pregnancySat.label, /jinekoloji son adet/i)
    const jine = cycleNote('2026-09-10', '2026-09-16')
    assert.equal(jine.day, 7)
    assert.equal(jine.label, 'Siklusun 7. günü')
    const empty = cycleNote(null, '2026-09-16')
    assert.match(empty.label, /girilmedi/)
  })

  it('maps live D/E, IDC, risk, plurality instead of placeholders', () => {
    const payload = payloadFromGebelikApi('p-anne', {
      gebelik: {
        id: 'g-1',
        sat: '2026-01-15',
        tdt: '2026-10-22',
        gravida: 3,
        para: 1,
        abortus: 0,
        yasayan: 1,
        olu_dogum: 1,
        ektopik: 1,
        cogul_gebelik_tipi: 'monokoryonik-diamniyotik',
        risk_sinifi: 'yuksek',
        risk_formu: { maddeler: ['kronik_ht'] },
        rh_negatif: true,
        durum: 'aktif',
        dogum_tarihi: null,
        indirekt_coombs: [{ tarih: '2026-04-01', sonuc: 'negatif' }],
      },
      yas: { hafta: 20, gun: 0 },
      izlemler: [{ id: 'iz-1', hafta: 12, usg: null }],
    })
    assert.ok(payload)
    assert.equal(payload?.obstetric_score.D, 1)
    assert.equal(payload?.obstetric_score.E, 1)
    assert.equal(payload?.idc_history, 'negative')
    assert.equal(payload?.risk_class, 'yuksek')
    assert.equal(payload?.plurality, 'twins')
    assert.equal(payload?.chorionicity, 'mo/di')
    const cal = chapterCalendar(payload!, 10, [12])
    assert.equal(cal.find((v) => v.izlem_no === 1)?.done, true)
    assert.equal(mapIdc([{ sonuc: 'pozitif' }]), 'positive')
    assert.equal(mapPlurality('tekil').plurality, 'singleton')
  })

  it('switches lohusa calendar after birth and marks PP visits done', () => {
    const payload = payloadFromGebelikApi('p-anne', {
      gebelik: {
        id: 'g-1',
        sat: '2026-01-15',
        tdt: '2026-10-22',
        gravida: 1,
        para: 1,
        abortus: 0,
        yasayan: 1,
        rh_negatif: false,
        durum: 'tamamlandi',
        dogum_tarihi: '2026-09-01',
      },
      yas: { hafta: 40, gun: 0 },
      lohusa: { dogumSonrasiGun: 4, izlemler: [{ dogum_sonrasi_gun: 3 }] },
    })
    assert.equal(payload?.episode_status, 'lohusa')
    const cal = chapterCalendar(payload!, 10, [], [3])
    assert.ok(cal.every((v) => v.layer === 'lohusa'))
    assert.equal(cal.find((v) => v.ga_or_pp_day === 3)?.done, true)
  })

  it('decision cards keep dual ACOG vs DÖBYR and NST mounts at ≥28w', () => {
    const gdm = gdmKarti({ ogtt_positive: false })
    assert.equal(gdm.conflict, true)
    assert.ok(gdm.dobyr.some((s) => /DÖBYR|yasal/i.test(s)))
    assert.ok(gdm.acog.length > 0)
    const gbs = gbsKarti({ ga_weeks: 36, kultur: null })
    assert.equal(gbs.conflict, true)
    const pe = peKarti({ sbp: 150, dbp: 95, proteinuria: true })
    assert.equal(pe.triage, 'urgent')
    const rh = rhKarti({ rh: 'D-', idc: 'negative', ga_weeks: 28 })
    assert.ok(rh.acog.join(' ').includes('Anti-D') || rh.dobyr.join(' ').includes('Anti-D'))
    assert.equal(nstShouldMount({ gaWeeks: 28, risk: 'dusuk', nstCount: 0 }), true)
    assert.equal(nstShouldMount({ gaWeeks: 12, risk: 'dusuk', nstCount: 0 }), false)
    assert.equal(nstShouldMount({ gaWeeks: 12, risk: 'yuksek', nstCount: 0 }), true)
    const ev = evaluateGBS({ ga_weeks: 36 })
    assert.equal(ev.conflict, true)
    assert.ok(ev.sb_required && ev.acog_recommended)
  })

  it('next visit date follows ACOG cadence; dual warnings do not collapse', () => {
    assert.equal(onerilenSonrakiTarih({ bugunIso: '2026-09-01', gaWeeks: 20, risk: 'dusuk' }), '2026-09-29')
    assert.equal(onerilenSonrakiTarih({ bugunIso: '2026-09-01', gaWeeks: 30, risk: 'dusuk' }), '2026-09-15')
    assert.equal(onerilenSonrakiTarih({ bugunIso: '2026-09-01', gaWeeks: 37, risk: 'dusuk' }), '2026-09-08')
    const dual = dualClinicWarnings({
      gaWeeks: 30,
      completedSb: [1, 2, 3],
      risk: 'dusuk',
      rh: 'D+',
      idc: 'not_tested',
    })
    assert.ok(dual.some((u) => u.dual && u.dual.sb.includes('DÖBYR') && u.dual.acog.includes('ACOG')))
    assert.match(tehlikeDanismanlikMetni(), /Vajinal kanama/)
  })

  it('visit-first shell, sticky strip, checklists, and doneIds are wired in source', () => {
    const geb = readFileSync(join(ROOT, '..', '..', 'components', 'doktor', 'HastaGebelik.tsx'), 'utf8')
    const destek = readFileSync(join(ROOT, 'protocols', 'supplements-vaccines.ts'), 'utf8')
    const sevkUi = readFileSync(join(ROOT, 'ui', 'SevkCta.tsx'), 'utf8')
    const kararUi = readFileSync(join(ROOT, 'ui', 'KararKartlari.tsx'), 'utf8')
    assert.doesNotMatch(destek, /as history/)
    assert.doesNotMatch(destek, /pediatric schedule/)
    assert.match(destek, /geçmiş öyküye göre/)
    assert.match(destek, /pediatrik aşı takvimi değildir/)
    assert.match(sevkUi, /data-kd="sevk-cta"/)
    assert.doesNotMatch(sevkUi, /if \(!sevk\) return null/)
    assert.match(kararUi, /Karar kartları/)
    assert.match(geb, /data-kd="nst-panel"/)
    assert.doesNotMatch(geb, /\{showNst && \(/)
    assert.match(geb, /etkinMod: Mod = mod/)
    const strip = readFileSync(join(ROOT, 'ui', 'StickyGebeStrip.tsx'), 'utf8')
    const aktif = readFileSync(join(ROOT, 'ui', 'AktifIsler.tsx'), 'utf8')
    assert.match(strip, /Bugünkü izlem/)
    assert.match(strip, /sticky-strip/)
    assert.match(aktif, /Aktif işler/)
    assert.match(geb, /IzlemChecklist/)
    assert.match(geb, /RiskFormu/)
    assert.match(geb, /VtePaneli/)
    assert.match(geb, /DestekAsiPaneli/)
    assert.match(geb, /LabPaneli/)
    assert.match(geb, /KararKartlari/)
    assert.match(geb, /JinekolojiSpine/)
    assert.match(geb, /BugunkuJineMuayene/)
    assert.match(geb, /InfertiliteStub/)
    assert.match(geb, /Doğum Gerçekleşti/)
    assert.match(geb, /oncekiGebelikleriFiltrele\(veri\.gecmis,\s*veri\.gebelik\)/)
    assert.match(geb, /yerelIsoTarih/)
    assert.match(geb, /set\(\(prev\) =>/)
    const ch = readFileSync(join(ROOT, '..', '..', 'components', 'doktor', 'HastaKdChapter.tsx'), 'utf8')
    assert.match(ch, /doneIds/)
    assert.match(ch, /chapterDoneIds/)
    assert.match(ch, /NstStrip/)
    assert.match(ch, /jineLmp/)
    const api = readFileSync(join(ROOT, '..', '..', 'app', 'api', 'doktor', 'gebelik', 'route.ts'), 'utf8')
    assert.match(api, /action === 'klinik'/)
    assert.match(api, /checklist/)
    assert.match(api, /onerilenSonrakiTarih/)
    assert.match(readFileSync(join(ROOT, 'ui', 'IzlemChecklist.tsx'), 'utf8'), /izlem-checklist/)
    assert.match(readFileSync(join(ROOT, 'ui', 'RiskFormu.tsx'), 'utf8'), /risk-formu/)
    assert.match(readFileSync(join(ROOT, 'ui', 'JinekolojiKart.tsx'), 'utf8'), /jine-kart/)
    assert.match(readFileSync(join(ROOT, 'ui', 'StickyJineStrip.tsx'), 'utf8'), /jine-sticky-strip/)
    assert.match(sevkUi, /Sevk oluştur \/ not ekle/)
  })
})
