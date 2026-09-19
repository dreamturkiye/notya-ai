import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kardioScore2Hesapla } from '@/specialties/kardiyoloji/engines/score2'
import { izlemDegerlendir } from '@/specialties/kardiyoloji/engines/htKky'
import { kardioRaporTaslagi } from '@/specialties/kardiyoloji/engines/sgkRapor'
import { kardioKohortSatirlari, kardioRecallMesaji } from '@/specialties/kardiyoloji/engines/kohort'
import { kardioSeridi } from '@/specialties/kardiyoloji/engines/serit'
import { hastaDiliTemizMi, kalbimHatirlatmalari, KALBIM_NOTU, KALP_BAKIM_IPUCLARI } from '@/specialties/kardiyoloji/engines/portal-kalbim'

describe('KARDIO engines', () => {
  it('SCORE2 returns risk band as karar desteği for complete inputs', () => {
    const s = kardioScore2Hesapla({
      yas: 55, cinsiyet: 'erkek', sigara: true, sbp: 140, tcholMgdl: 240, hdlMgdl: 40, bolge: 'high',
    })
    assert.equal(s.tamamMi, true)
    assert.ok(s.riskPct != null && s.riskPct > 0)
    assert.match(s.ozet, /karar desteği/i)
    assert.doesNotMatch(s.ozet, /\bmg\b|doz/i)
  })

  it('SCORE2 refuses invented values when inputs missing', () => {
    const s = kardioScore2Hesapla({ yas: 55 })
    assert.equal(s.tamamMi, false)
    assert.ok(s.eksikler.length)
  })

  it('HT izlem builds class-level tasks without dose', () => {
    const s = izlemDegerlendir({ tip: 'ht', bugun: '2026-09-19', sbp: 150, dbp: 95 })
    assert.ok(s.gorevler.length >= 1)
    assert.doesNotMatch(s.ozet, /\bmg\b/)
  })

  it('SGK rapor blocks lock without ICD and checklist', () => {
    const s = kardioRaporTaslagi({ sablon: 'hipertansiyon', hastaAdi: 'Test', bugun: '2026-09-19' })
    assert.ok(s.eksikler.some((e) => /ICD|TANI/i.test(e)))
    assert.equal(s.draft.tcSon4, '')
  })

  it('kohort recall never carries clinical numbers', () => {
    const m = kardioRecallMesaji(['gecikmis_kontrol'])
    assert.ok(hastaDiliTemizMi(m.metin))
    assert.doesNotMatch(m.metin, /SCORE2|%|NYHA|\bmg\b/)
    const risk = kardioRecallMesaji(['risk_acik'])
    assert.match(risk.metin, /112/)
  })

  it('kohort ranks open red flags first', () => {
    const s = kardioKohortSatirlari([
      { patientId: 'a', ad: 'A', sonScore2Pct: null, sonScore2Kova: null, acikRiskBayraklari: ['gogus_agrisi'], sonrakiKontrol: null, gorevler: [], sonVizit: null, portalVar: true },
      { patientId: 'b', ad: 'B', sonScore2Pct: null, sonScore2Kova: null, acikRiskBayraklari: [], sonrakiKontrol: '2026-01-01', gorevler: [], sonVizit: null, portalVar: false },
    ], '2026-09-19')
    assert.equal(s[0].patientId, 'a')
  })

  it('serit shows SCORE2 chip', () => {
    const s = kardioSeridi({
      bugun: '2026-09-19',
      score2: { riskPct: 12, kova: 'yuksek', tarih: '2026-09-01' },
      riskBayraklari: [],
      riskHekimOnay: true,
      sonrakiKontrol: null,
      sonIzlem: null,
      gorevler: [],
      planlar: [],
    })
    assert.ok(s.chips.some((c) => c.ad === 'SCORE2' && c.deger.includes('%')))
  })

  it('portal Kalbim texts stay patient-safe', () => {
    assert.ok(hastaDiliTemizMi(KALBIM_NOTU))
    for (const x of KALP_BAKIM_IPUCLARI) assert.ok(hastaDiliTemizMi(x), x)
    const h = kalbimHatirlatmalari({ bugun: '2026-09-19', gorevler: [{ kod: 'kb_kontrol', due: '2026-09-25' }], sonrakiKontrolIso: '2026-10-01' })
    assert.ok(h.some((x) => /Tansiyon|Kontrol/.test(x.ad)))
  })
})
