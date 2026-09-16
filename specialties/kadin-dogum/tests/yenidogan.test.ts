import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  NTP_DISCLAIMER,
  addDays,
  generateCalendar,
  gorevUrgency,
  ntpBelgeSahibi,
  pretermOrLbw,
  redKaydi,
  taburcuGate,
  yorumNtp,
  muhtemelNtpPanel,
  ntpKeyFromRaw,
  ntpFlagNorm,
  ASI_V1,
  CIFT_ATIF,
} from '../../../lib/clinical/yenidogan'

describe('yenidogan taburcu gate', () => {
  const dogumAt = '2026-09-10'
  const checks = { ntp1: false, hepb1: false, vitk: false, isitme: false }

  it('blocks finalize when NTP-1 HepB-1 VitK işitme are unchecked', () => {
    const g = taburcuGate({ checks, dogumAt })
    assert.equal(g.ok, false)
    assert.deepEqual(g.eksik, ['ntp1', 'hepb1', 'vitk', 'isitme'])
    assert.match(g.neden, /Taburcu tamamlanamaz/)
    assert.equal(g.gorevler.length, 0)
  })

  it('allows finalize when all required items are checked', () => {
    const g = taburcuGate({
      checks: { ntp1: true, hepb1: true, vitk: true, isitme: true },
      dogumAt,
    })
    assert.equal(g.ok, true)
    assert.equal(g.eksik.length, 0)
  })

  it('allows documented exception (erken taburcu) and generates tasks', () => {
    const g = taburcuGate({
      checks,
      dogumAt,
      istisna: { neden: 'erken_taburcu', aciklama: '48 saat dolmadan taburcu, sevk ASM', kaydeden: 'dr-1', at: '2026-09-11T10:00:00Z' },
    })
    assert.equal(g.ok, true)
    assert.equal(g.eksik.length, 4)
    assert.ok(g.gorevler.length >= 4)
    assert.ok(g.gorevler.some((t) => t.title.includes('NTP-1')))
  })

  it('treats parental refuse status=red as documented for that item', () => {
    const red = redKaydi({ kalem: 'ntp1', neden: 'aile reddetti', kaydeden: 'dr-1', at: '2026-09-11T10:00:00Z' })
    assert.equal(red.status, 'red')
    const g = taburcuGate({
      checks: { ntp1: false, hepb1: true, vitk: true, isitme: true },
      redler: [red],
      dogumAt,
    })
    assert.equal(g.ok, true)
    assert.equal(g.eksik.length, 0)
  })

  it('does not accept empty exception', () => {
    const g = taburcuGate({
      checks,
      dogumAt,
      istisna: { neden: 'sevk', aciklama: '  ', kaydeden: 'dr-1', at: '2026-09-11T10:00:00Z' },
    })
    assert.equal(g.ok, false)
  })
})

describe('yenidogan calendar', () => {
  it('builds NTP-2 day 3–5, izlem windows, dvit, iron, vaccines from dogum_at', () => {
    const tasks = generateCalendar({ dogumAt: '2026-09-01', pretermOrLbw: false, gkdRisk: false })
    const ntp2 = tasks.find((t) => t.kind === 'ntp2')
    assert.equal(ntp2?.due_at, '2026-09-04')
    assert.equal(ntp2?.due_end_at, '2026-09-06')
    assert.ok(tasks.some((t) => t.kind === 'dvit' && t.due_at === '2026-09-08'))
    const demir = tasks.find((t) => t.kind === 'demir')
    assert.equal(demir?.due_at, addDays('2026-09-01', 120))
    const hepb1 = tasks.find((t) => t.asi_kod === 'HEPB1')
    assert.equal(hepb1?.due_at, '2026-09-01')
    const hepa2 = tasks.find((t) => t.asi_kod === 'HEPA2')
    assert.equal(hepa2?.due_at, addDays('2026-09-01', 730))
    assert.ok(tasks.some((t) => t.kind === 'izlem' && t.title.includes('9. ay')))
    assert.ok(tasks.some((t) => t.kind === 'lohusa_anne'))
    assert.equal(tasks.some((t) => t.kind === 'kalca_us'), false)
    const kodlar = new Set(ASI_V1.map((a) => a.kod))
    assert.equal(kodlar.has('HEPB1'), true)
    assert.equal(kodlar.has('ROTAVIRUS' as never), false)
  })

  it('moves iron to day 60 for preterm/LBW and adds hip US when GKD risk', () => {
    assert.equal(pretermOrLbw({ gestHafta: 34, kiloGram: 2800 }), true)
    assert.equal(pretermOrLbw({ gestHafta: 39, kiloGram: 2200 }), true)
    assert.equal(pretermOrLbw({ gestHafta: 39, kiloGram: 3200 }), false)
    const tasks = generateCalendar({ dogumAt: '2026-09-01', pretermOrLbw: true, gkdRisk: true })
    assert.equal(tasks.find((t) => t.kind === 'demir')?.due_at, addDays('2026-09-01', 60))
    assert.ok(tasks.some((t) => t.kind === 'kalca_us' && t.due_at === addDays('2026-09-01', 42)))
  })

  it('marks overdue amber then red after 7 days — refuse does not drop the row', () => {
    assert.equal(gorevUrgency('2026-09-01', '2026-09-01'), 'ok')
    assert.equal(gorevUrgency('2026-09-01', '2026-09-03'), 'amber')
    assert.equal(gorevUrgency('2026-09-01', '2026-09-09'), 'red')
    const cal = generateCalendar({ dogumAt: '2026-09-01', pretermOrLbw: false, gkdRisk: false })
    const afterRed = cal.filter((t) => t.kind === 'ntp2')
    assert.equal(afterRed.length, 1)
  })
})

describe('NTP on bebek not anne', () => {
  it('rejects NTP belge on the mother', () => {
    const r = ntpBelgeSahibi({ belgePatientId: 'anne-1', bebekPatientId: 'bebek-1', annePatientId: 'anne-1' })
    assert.equal(r.ok, false)
    assert.match(r.neden, /bebek kartına/)
  })

  it('accepts NTP belge on the bebek', () => {
    const r = ntpBelgeSahibi({ belgePatientId: 'bebek-1', bebekPatientId: 'bebek-1', annePatientId: 'anne-1' })
    assert.equal(r.ok, true)
  })
})

describe('NTP interpret rules', () => {
  it('all normal → tarama negatif', () => {
    const y = yorumNtp({
      satirlar: [
        { canonical_key: 'ntp_pku', flag: 'normal' },
        { canonical_key: 'ntp_tsh', flag: 'normal' },
        { canonical_key: 'ntp_sma', flag: 'normal' },
      ],
      sample_no: '1',
    })
    assert.match(y.yorum, /Tarama negatif/)
    assert.deepEqual(y.tanilar, [])
    assert.equal(y.sevk, 'yok')
    assert.equal(y.disclaimer, NTP_DISCLAIMER)
    assert.equal(y.panel_type, 'yenidogan_tarama')
  })

  it('one borderline → tekrar / tanı koyma', () => {
    const y = yorumNtp({
      satirlar: [
        { canonical_key: 'ntp_pku', flag: 'normal' },
        { canonical_key: 'ntp_irt', flag: 'sinir' },
      ],
    })
    assert.match(y.yorum, /Tekrar örnek/)
    assert.ok(y.plan.includes('Tekrar topuk'))
    assert.deepEqual(y.tanilar, [])
  })

  it('TSH high → congenital hypothyroidism suspicion, not a diagnosis', () => {
    const y = yorumNtp({
      satirlar: [{ canonical_key: 'ntp_tsh', flag: 'pozitif_suphe', raw: '24' }],
    })
    assert.match(y.yorum, /Konjenital hipotiroidi/)
    assert.match(y.yorum, /Tarama≠tanı|tanı/)
    assert.equal(y.sevk, 'endokrin')
    assert.ok(y.plan.some((p) => /Venöz TSH/.test(p)))
    assert.deepEqual(y.tanilar, [])
    const fromH = yorumNtp({ satirlar: [{ canonical_key: 'ntp_tsh', flag: 'H' }] })
    assert.equal(fromH.sevk, 'endokrin')
  })

  it('SMA / PKU positive → sevk, no automatic diet or drug', () => {
    const sma = yorumNtp({ satirlar: [{ canonical_key: 'ntp_sma', flag: 'pozitif_suphe' }] })
    assert.match(sma.yorum, /SMA/)
    assert.match(sma.yorum, /ilaç|diyet/i)
    assert.equal(sma.sevk, 'nöroloji')
    const pku = yorumNtp({ satirlar: [{ canonical_key: 'ntp_pku', flag: 'pozitif_suphe' }] })
    assert.equal(pku.sevk, 'metabolizma')
    assert.match(pku.yorum, /Diyet otomatik başlamaz/)
  })

  it('inadequate sample is a redraw task, not a diagnosis', () => {
    const y = yorumNtp({ satirlar: [{ canonical_key: 'ntp_pku', flag: 'yetersiz_ornek' }] })
    assert.match(y.yorum, /Yetersiz örnek/)
    assert.ok(y.plan.some((p) => /Tekrar topuk/.test(p)))
    assert.deepEqual(y.tanilar, [])
  })

  it('detects NTP panel from topuk aliases', () => {
    assert.equal(ntpKeyFromRaw('Fenilketonüri'), 'ntp_pku')
    assert.equal(ntpKeyFromRaw('SMA'), 'ntp_sma')
    assert.equal(muhtemelNtpPanel({ labAdi: 'Yenidoğan tarama', satirlar: [] }), true)
    assert.equal(muhtemelNtpPanel({ labAdi: 'Hemogram', satirlar: [{ raw_name: 'Hb' }] }), false)
    assert.equal(ntpFlagNorm('H'), 'pozitif_suphe')
    assert.equal(ntpFlagNorm('borderline'), 'sinir')
  })

  it('dual-cites 9th-month and lohusa windows without merging', () => {
    assert.match(CIFT_ATIF.ay9.sb, /270/)
    assert.match(CIFT_ATIF.ay9.overlay, /250/)
    assert.match(CIFT_ATIF.lohusa40.sb, /30–42/)
    assert.match(CIFT_ATIF.lohusa40.overlay, /30–40/)
    assert.match(CIFT_ATIF.hepa2.sb, /24/)
  })
})
