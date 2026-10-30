/**
 * AU gold depth — per-role coaching suite: specialty gates + care-plan arithmetic.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AU_KOCLUK_ANAHTARLARI, AU_KOCLUK_MODULLERI, AU_KOCLUK_ROLLERI } from '../portalBransModulleri'
import { AU_KOCLUK_TANIMLAR, auBransKoclukAraclari } from './bransKocluk'
import { AU_PORTAL_BOLUMLERI } from '../portalBolumleri'

describe('AU branş coaching tools', () => {
  it('covers every portal role except dietetics (which keeps meal-plan tools)', () => {
    const portalRoller = Object.keys(AU_PORTAL_BOLUMLERI).filter((r) => r !== 'dietetics').sort()
    assert.deepEqual([...AU_KOCLUK_ROLLERI].sort(), portalRoller)
    assert.equal(AU_KOCLUK_ANAHTARLARI.length, AU_KOCLUK_ROLLERI.length * 3)
    assert.equal(AU_KOCLUK_TANIMLAR.length, AU_KOCLUK_ANAHTARLARI.length)
  })

  it('each tool is gated to exactly one role and dietetics never receives a coaching key', () => {
    const paketler = auBransKoclukAraclari()
    assert.equal(paketler.length, AU_KOCLUK_ANAHTARLARI.length)
    for (const p of paketler) {
      assert.equal(p.roller?.length, 1, p.anahtar)
      assert.notEqual(p.roller?.[0], 'dietetics', p.anahtar)
      assert.match(p.anahtar, /^au-[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('care-plan needs at least one filled slot; diary needs date, type, author and text', () => {
    const cardiology = AU_KOCLUK_MODULLERI.cardiology!
    const plan = AU_KOCLUK_TANIMLAR.find((t) => t.anahtar === cardiology.planAraci)!
    const gunluk = AU_KOCLUK_TANIMLAR.find((t) => t.anahtar === cardiology.gunlukAraci)!
    const hedefler = AU_KOCLUK_TANIMLAR.find((t) => t.anahtar === cardiology.hedefAraci)!

    const bos = plan.hesapla({ plan_tarihi: '2026-10-30', kahvalti: '', ogle: '', aksam: '', atistirmalik: '' })
    assert.equal(bos.tamam, true)
    assert.ok(bos.uyarilar.includes('plan_bos'))

    const dolu = plan.hesapla({
      plan_tarihi: '2026-10-30',
      kahvalti: 'Home BP twice daily',
      ogle: '',
      aksam: '',
      atistirmalik: '',
    })
    assert.equal(dolu.tamam, true)
    assert.ok(dolu.uyarilar.includes('portal'))
    assert.equal(dolu.sayilar.find((s) => s.anahtar === 'dolu')?.deger, 1)

    assert.equal(gunluk.hesapla({ gun: '2026-10-30', ogun: 'kahvalti', aciklama: 'BP 128/80', kim: 'hasta' }).tamam, true)
    assert.equal(gunluk.hesapla({ gun: '2026-10-30', ogun: 'kahvalti', aciklama: '', kim: 'hasta' }).tamam, false)

    const h = hedefler.hesapla({ tansiyon: true, aktivite: true })
    assert.equal(h.tamam, true)
    assert.equal(h.sayilar.find((s) => s.anahtar === 'isaretli')?.deger, 2)
  })

  it('foreign roles omit another role\'s care-plan key', () => {
    const paketler = auBransKoclukAraclari()
    const cardioPlan = paketler.find((p) => p.anahtar === 'au-cardiology-care-plan')!
    assert.deepEqual(cardioPlan.roller, ['cardiology'])
    const physio = paketler.find((p) => p.anahtar === 'au-physiotherapy-care-plan')!
    assert.deepEqual(physio.roller, ['physiotherapy'])
  })
})
