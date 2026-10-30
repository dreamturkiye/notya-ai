/**
 * AU visit-prep checklists — one per offered role, specialty-gated, ticks only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AU_MUAYENE_MOTORLARI } from '../klinik/muayeneMotorlari'
import {
  AU_VISIT_PREP_ANAHTARLARI,
  AU_VISIT_PREP_ROL,
  AU_VISIT_PREP_TANIMLAR,
  auVisitPrepAraclari,
} from './visitPrep'

describe('AU visit-prep tools', () => {
  it('covers every Muayene motor role exactly once', () => {
    const roller = Object.keys(AU_MUAYENE_MOTORLARI).sort()
    assert.equal(AU_VISIT_PREP_ANAHTARLARI.length, roller.length)
    assert.equal(auVisitPrepAraclari().length, roller.length)
    assert.equal(AU_VISIT_PREP_TANIMLAR.length, roller.length)
    for (const rol of roller) {
      assert.equal(AU_VISIT_PREP_ROL[rol], `au-${rol}-visit-prep`)
    }
  })

  it('each tool is gated to exactly one role', () => {
    for (const p of auVisitPrepAraclari()) {
      assert.equal(p.roller?.length, 1, p.anahtar)
      assert.match(p.anahtar, /^au-[a-z0-9-]+-visit-prep$/)
    }
  })

  it('ticks need a visit date; empty ticks warn; filled ticks mark portal', () => {
    const t = AU_VISIT_PREP_TANIMLAR.find((x) => x.anahtar === 'au-cardiology-visit-prep')!
    assert.equal(t.hesapla({ gun: '', riza: true }).tamam, false)
    const bos = t.hesapla({ gun: '2026-10-30' })
    assert.equal(bos.tamam, true)
    assert.ok(bos.uyarilar.includes('bos'))
    const dolu = t.hesapla({ gun: '2026-10-30', riza: true, guvenlik: true })
    assert.equal(dolu.tamam, true)
    assert.ok(dolu.uyarilar.includes('portal'))
    assert.equal(dolu.sayilar.find((s) => s.anahtar === 'isaretli')?.deger, 2)
  })
})
