import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DOZ_ADIMI_KILIDI,
  MED_BIRIMI,
  YANIK_PROTOKOLU,
  araVermeUyarisi,
  cihazBasinaKumulatif,
  cumulativeJ,
  dozAdimiOzeti,
  medEksikCihazlar,
  solaryumMu,
  sonMed,
  tbseHatirlatmaIpucu,
  yanikBildirimiGerekli,
  yanikProtokoluEksikler,
  type MedKaydi,
  type PhotoSession,
} from '../engines/phototherapy-log'

// DERM-EXCEPTIONAL-01 · madde 2 — fototerapi defteri v2: MED girişi, seans başına doz adımı,
// yanık protokolü, cihaz başına kümülatif J, yıllık TBSE ipucu. Doz üretilmez; solaryum yasak.

const seans = (o: Partial<PhotoSession>): PhotoSession => ({
  date: '2026-03-02', device: 'nb-uvb-311', j_cm2: 0.5, ...o,
})

describe('cihaz başına kümülatif doz', () => {
  it('cihazları ayırır, boş cihazı listelemez, kümülatifi büyükten küçüğe sıralar', () => {
    const s = [
      seans({ date: '2026-03-02', device: 'nb-uvb-311', j_cm2: 0.5 }),
      seans({ date: '2026-03-05', device: 'nb-uvb-311', j_cm2: 0.7 }),
      seans({ date: '2026-03-06', device: 'excimer-308', j_cm2: 0.2 }),
    ]
    const c = cihazBasinaKumulatif(s)
    assert.deepEqual(c.map((x) => x.device), ['nb-uvb-311', 'excimer-308'])
    assert.equal(c[0].seans, 2)
    assert.equal(c[0].kumulatifJ, 1.2)
    assert.equal(c[0].sonSeans, '2026-03-05')
    assert.equal(cumulativeJ(s), 1.4)
  })

  it('seans yoksa liste boştur', () => {
    assert.deepEqual(cihazBasinaKumulatif([]), [])
  })
})

describe('MED / MPD girişi', () => {
  const medler: MedKaydi[] = [
    { date: '2026-01-10', device: 'nb-uvb-311', deger: 400, birim: 'mJ/cm²' },
    { date: '2026-03-01', device: 'nb-uvb-311', deger: 500, birim: 'mJ/cm²' },
  ]

  it('cihazın en son MED kaydını verir', () => {
    assert.equal(sonMed(medler, 'nb-uvb-311')?.deger, 500)
    assert.equal(sonMed(medler, 'puva-oral'), null)
  })

  it('seansı olup MED kaydı olmayan cihazı eksik olarak bildirir', () => {
    const s = [seans({ device: 'puva-bath', j_cm2: 1 }), seans({ device: 'nb-uvb-311' })]
    assert.deepEqual(medEksikCihazlar(s, medler), ['puva-bath'])
  })

  it('seansta med_test işaretliyse eksik sayılmaz (defterde test kaydı var)', () => {
    const s = [seans({ device: 'puva-bath', j_cm2: 1, med_test: true })]
    assert.deepEqual(medEksikCihazlar(s, []), [])
  })

  it('her cihazın MED birimi tanımlı (PUVA J/cm², UVB mJ/cm²)', () => {
    assert.equal(MED_BIRIMI['nb-uvb-311'], 'mJ/cm²')
    assert.equal(MED_BIRIMI['puva-oral'], 'J/cm²')
  })
})

describe('yanık protokolü', () => {
  it('ağrılı / büllü eritem veya yanık işareti protokolü zorunlu kılar', () => {
    assert.equal(yanikBildirimiGerekli(seans({ eritem: 'minimal' })), false)
    assert.equal(yanikBildirimiGerekli(seans({ eritem: 'agrili' })), true)
    assert.equal(yanikBildirimiGerekli(seans({ eritem: 'bullu' })), true)
    assert.equal(yanikBildirimiGerekli(seans({ burn: true })), true)
  })

  it('protokol gerekmiyorsa eksik listesi boştur; gerekiyorsa işaretlenmeyenleri sayar', () => {
    assert.deepEqual(yanikProtokoluEksikler(seans({ eritem: 'yok' })), [])
    const eksik = yanikProtokoluEksikler(seans({ burn: true, yanik_protokolu: { seans_durdur: true } }))
    assert.equal(eksik.length, YANIK_PROTOKOLU.length - 1)
  })

  it('protokol maddeleri doz / ilaç yazmaz — hemşire eylemleridir', () => {
    for (const m of YANIK_PROTOKOLU) {
      assert.doesNotMatch(m.ad, /\d+\s*(mg|ml|mL|J\/cm²)/i)
      assert.doesNotMatch(m.ad, /kortikosteroid|krem adı|antibiyotik/i)
    }
    assert.ok(YANIK_PROTOKOLU.some((m) => /hekim/i.test(m.ad)))
  })
})

describe('doz adımı ve ara verme — karar hekimin', () => {
  it('defter özeti hekimin girdiği adımı gösterir, adım önermez', () => {
    const s = [seans({ date: '2026-03-02', j_cm2: 0.5 }), seans({ date: '2026-03-05', j_cm2: 0.6, doz_adimi_pct: 20 })]
    const ozet = dozAdimiOzeti(s)
    assert.match(ozet, /Son doz 0\.6 J\/cm²/)
    assert.match(ozet, /son adım %20/)
    assert.equal(dozAdimiOzeti([]), 'Seans yok')
  })

  it('doz adımı kilidi metni Notya\'nın doz üretmediğini söyler', () => {
    assert.match(DOZ_ADIMI_KILIDI, /hekim/)
    assert.match(DOZ_ADIMI_KILIDI, /doz üretmez|önermez/)
  })

  it('ara verme uyarısı gün sayısını söyler, dozu söylemez', () => {
    assert.equal(araVermeUyarisi([seans({ date: '2026-03-02' })], '2026-03-05'), null)
    const u = araVermeUyarisi([seans({ date: '2026-03-02' })], '2026-03-20')
    assert.match(String(u), /18 gün/)
    assert.match(String(u), /hekimin/)
    assert.equal(araVermeUyarisi([], '2026-03-20'), null)
  })
})

describe('yıllık TBSE ipucu ve solaryum yasağı', () => {
  it('seans yoksa ipucu yok; TBSE kaydı yoksa gerekli olur', () => {
    assert.equal(tbseHatirlatmaIpucu({ lastTbseIso: null, todayIso: '2026-03-02', sessions: [] }), null)
    const i = tbseHatirlatmaIpucu({ lastTbseIso: null, todayIso: '2026-03-02', sessions: [seans({})] })
    assert.equal(i?.gerekli, true)
    assert.match(String(i?.metin), /kümülatif/)
  })

  it('bir yıl geçmemişse güncel sayılır', () => {
    const i = tbseHatirlatmaIpucu({ lastTbseIso: '2026-01-01', todayIso: '2026-03-02', sessions: [seans({})] })
    assert.equal(i?.gerekli, false)
  })

  it('solaryum cihaz olarak tanınır ve reddedilir', () => {
    assert.equal(solaryumMu('solaryum'), true)
    assert.equal(solaryumMu('Solarium 40'), true)
    assert.equal(solaryumMu('nb-uvb-311'), false)
  })
})
