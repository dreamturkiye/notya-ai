import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fuse, capHesapla, acilKurali, raporuDogrula, bant, fusionYap } from './fusion'
import { bransAnahtari, etkinModalite, tierBMotorlari } from './router'
import { BULGULAR, gecerliKod } from './ontoloji'
import type { MotorCiktisi, BelgeRaporu } from './types'

const claude = (labels: MotorCiktisi['labels']): MotorCiktisi => ({ motor: 'claude-vision', surum: '1', tier: 'A', dogrulanmis: false, labels })
const txrv = (labels: MotorCiktisi['labels']): MotorCiktisi => ({ motor: 'txrv-densenet121', surum: '1', tier: 'B', dogrulanmis: true, labels })
const ark = (labels: MotorCiktisi['labels']): MotorCiktisi => ({ motor: 'arkplus', surum: '1', tier: 'C', dogrulanmis: true, labels })

describe('ontology', () => {
  it('every code has a Turkish label and at least one modality', () => {
    for (const [k, v] of Object.entries(BULGULAR)) { assert.ok(v.tr.length > 2, k); assert.ok(v.modalite.length >= 1, k) }
    assert.ok(gecerliKod('CXR.PTX')); assert.ok(!gecerliKod('Pleural Effusion'))
  })
})

describe('fusion', () => {
  it('two validated engines agreeing → kept, agree=2, no karşı', () => {
    const f = fuse([txrv([{ kod: 'CXR.EFF', p: 0.8 }]), ark([{ kod: 'CXR.EFF', p: 0.9 }])])
    assert.equal(f.length, 1); assert.equal(f[0].kod, 'CXR.EFF'); assert.equal(f[0].agree, 2); assert.deepEqual(f[0].karsi, [])
  })
  it('single validated engine ≥0.85 → kept; other engine silent → listed as karşı', () => {
    const f = fuse([txrv([{ kod: 'CXR.PTX', p: 0.9 }]), claude([{ kod: 'CXR.NORM', p: 0.7 }])])
    const ptx = f.find((x) => x.kod === 'CXR.PTX')!
    assert.ok(ptx); assert.deepEqual(ptx.karsi, ['claude-vision'])
  })
  it('unknown label strings are ignored (ontology-only fusion)', () => {
    const f = fuse([txrv([{ kod: 'Effusion', p: 0.99 }])])
    assert.equal(f.length, 0)
  })
  it('claude alone at 0.6 is kept (agree 0.5 weight + p≥0.5) but validated weight double in fused p', () => {
    const f = fuse([claude([{ kod: 'CXR.CONS', p: 0.6 }]), txrv([{ kod: 'CXR.CONS', p: 0.9 }])])
    assert.equal(f[0].p, 0.8) // (0.6*1 + 0.9*2)/3
  })
  it('engines with hata are excluded', () => {
    const f = fuse([{ ...txrv([{ kod: 'CXR.PTX', p: 0.99 }]), hata: 'timeout' }])
    assert.equal(f.length, 0)
  })
})

describe('caps', () => {
  it('no validated engine → 70 with sinirlar note', () => {
    const c = capHesapla({ modalite: 'cxr', motorlar: [claude([])], fused: [], kalite: 'iyi' })
    assert.equal(c.cap, 70); assert.ok(c.sinirlar.length === 1)
  })
  it('single validated engine → 85; two agreeing validated → 95', () => {
    const m1 = [txrv([{ kod: 'CXR.EFF', p: 0.9 }])]
    assert.equal(capHesapla({ modalite: 'cxr', motorlar: m1, fused: fuse(m1), kalite: 'iyi' }).cap, 85)
    const m2 = [...m1, ark([{ kod: 'CXR.EFF', p: 0.9 }])]
    assert.equal(capHesapla({ modalite: 'cxr', motorlar: m2, fused: fuse(m2), kalite: 'iyi' }).cap, 95)
  })
  it('pediatric patient with adult engine → 60 + note', () => {
    const m = [txrv([{ kod: 'CXR.EFF', p: 0.9 }])]
    const c = capHesapla({ modalite: 'cxr', motorlar: m, fused: fuse(m), kalite: 'iyi', yasAy: 5 * 12 })
    assert.equal(c.cap, 60); assert.ok(c.sinirlar.some((s) => s.includes('16 yaş')))
  })
  it('quality dusuk → 0', () => {
    assert.equal(capHesapla({ modalite: 'cxr', motorlar: [], fused: [], kalite: 'dusuk' }).cap, 0)
  })
  it('serbest modality → 55', () => {
    assert.equal(capHesapla({ modalite: 'serbest', motorlar: [claude([])], fused: [], kalite: 'iyi' }).cap, 55)
  })
  it('phone derm photo without Fitzpatrick → 70 even with validated engines', () => {
    const m = [txrv([{ kod: 'DERM.MEL', p: 0.9 }]), ark([{ kod: 'DERM.MEL', p: 0.9 }])]
    assert.equal(capHesapla({ modalite: 'derm', motorlar: m, fused: fuse(m), kalite: 'iyi' }).cap, 70)
  })
})

describe('acil rule and validator', () => {
  it('PTX at 0.75 fires acil; at 0.5 does not', () => {
    assert.equal(acilKurali(fuse([txrv([{ kod: 'CXR.PTX', p: 0.75 }])])).acil, true)
    assert.equal(acilKurali(fuse([txrv([{ kod: 'CXR.PTX', p: 0.5 }])])).acil, false)
  })
  it('validator caps the model, sets bands, forces acil, appends sinirlar, and clears tanılar on kalite dusuk', () => {
    const m = [txrv([{ kod: 'CXR.PTX', p: 0.9 }])]
    const f = fusionYap(m, { modalite: 'cxr', kalite: 'iyi', yasAy: 4 * 12 })
    const r: BelgeRaporu = { modalite: 'cxr', kalite: 'iyi', ozet: '', bulgular: [], tanilar: [{ ad: 'Pnömotoraks', guven_pct: 92, guven_bant: 'yüksek', destek: [], karsi: [] }], acil_bayrak: false, oneri: '', sinirlar: [], hekim_tanisi: [], engines_used: [] }
    const { rapor, duzeltmeler } = raporuDogrula(r, f)
    assert.equal(rapor.tanilar[0].guven_pct, 60); assert.equal(rapor.tanilar[0].guven_bant, 'orta')
    assert.equal(rapor.acil_bayrak, true); assert.ok(duzeltmeler.length >= 2); assert.ok(rapor.sinirlar.length >= 1)
    const f2 = fusionYap([], { modalite: 'cxr', kalite: 'dusuk' })
    assert.equal(raporuDogrula(r, f2).rapor.tanilar.length, 0)
  })
  it('bands', () => { assert.equal(bant(80), 'yüksek'); assert.equal(bant(55), 'orta'); assert.equal(bant(54), 'düşük') })
})

describe('router', () => {
  it('maps free-text specialties', () => {
    assert.equal(bransAnahtari('Çocuk Sağlığı ve Hastalıkları'), 'pediatri')
    assert.equal(bransAnahtari('Kardiyoloji'), 'kardiyoloji'); assert.equal(bransAnahtari('Göğüs Cerrahisi'), 'gogus_cerrahisi')
    assert.equal(bransAnahtari('Göğüs Hastalıkları'), 'gogus'); assert.equal(bransAnahtari(null), 'genel')
  })
  it('unlisted modality → serbest; listed → itself; psikiyatri has no engines', () => {
    assert.equal(etkinModalite('pediatri', 'patoloji').modalite, 'serbest')
    assert.equal(etkinModalite('pediatri', 'ses_akciger').modalite, 'ses_akciger')
    assert.deepEqual(tierBMotorlari('psikiyatri', 'ses_konusma'), [])
    assert.deepEqual(tierBMotorlari('pediatri', 'cxr'), ['txrv-densenet121'])
  })
})
