/**
 * AU-GAP-CLOSE-01 — pack wiring: letter / MBS instructions and uzanti copy are present for Australia.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AU_KLINIK } from './klinik'
import { AU_UZANTI } from './uzanti'
import { AU_GIRDI } from './ayarlar'
import { MEKTUP_TURLERI } from '@/lib/ulke/mektup/sabitler'

describe('AU-GAP-CLOSE-01 pack wiring', () => {
  it('clinical half offers all three letter kinds and MBS suggest prompts', () => {
    assert.equal(typeof AU_KLINIK.mektupTalimati, 'function')
    assert.equal(typeof AU_KLINIK.mektupGirdisi, 'function')
    assert.equal(typeof AU_KLINIK.mbsOneriTalimati, 'function')
    assert.equal(typeof AU_KLINIK.mbsOneriGirdisi, 'function')
    for (const t of MEKTUP_TURLERI) {
      const talimat = AU_KLINIK.mektupTalimati!(t)
      assert.ok(talimat && talimat.length > 40, t)
      assert.match(talimat!, /Australian English|JSON/)
      assert.match(talimat!, /never|Never|not lodge|not sent|Invent no/i)
      const girdi = AU_KLINIK.mektupGirdisi!(t, { s: 'S', o: 'O', a: 'A', p: 'P' })
      assert.match(girdi, /"s":"S"/)
    }
    const mbs = AU_KLINIK.mbsOneriTalimati!()
    assert.ok(mbs)
    assert.match(mbs!, /Suggest ONLY|never lodge|Never lodge/i)
    assert.match(mbs!, /suggestions/)
  })

  it('uzanti carries letter, MBS, PMS roadmap and telehealth tip copy', () => {
    assert.ok(AU_UZANTI.mektup)
    assert.equal(AU_UZANTI.mektup!.turler.length, 3)
    assert.ok(AU_UZANTI.mbsOneri)
    assert.match(AU_UZANTI.mbsOneri!.uyari, /never lodges/i)
    assert.ok(AU_UZANTI.pmsEntegrasyon)
    assert.ok(AU_UZANTI.pmsEntegrasyon!.kalemler.some((k) => k.anahtar === 'best-practice' && k.durum === 'partner-api'))
    assert.ok(AU_UZANTI.pmsEntegrasyon!.kalemler.some((k) => k.durum === 'hazir-export'))
    assert.match(AU_UZANTI.telehealthIpucu ?? '', /Telehealth|dictate/i)
  })

  it('landing price list exposes yearly A$1,490 for the doctor plan', () => {
    const f = AU_GIRDI.acilis.fiyatlar.doctor
    assert.equal(f.aylik, 149)
    assert.equal(f.yillik, 1490)
    assert.equal(f.oneCikan, true)
  })
})
