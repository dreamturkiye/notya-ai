/**
 * AU-GAP-CLOSE-01/02 — pack wiring: letter / MBS / PMS vault / freemium / clinician sign-off register.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AU_KLINIK } from './klinik'
import { AU_UZANTI } from './uzanti'
import { AU_GIRDI } from './ayarlar'
import { MEKTUP_TURLERI } from '@/lib/ulke/mektup/sabitler'
import { AU_MEKTUP_ICERIK_ONAYLARI, mektupIcerikOnaysizMi } from './klinik/mektupOnay'
import { ulkeTicari } from '@/lib/billing/ulkeTicari'
import { ULKE_TABLOLARI } from '@/lib/ulke/uygulama/tablolar'

describe('AU-GAP-CLOSE-01/02 pack wiring', () => {
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

  it('uzanti carries letter/MBS sign-off copy, PMS vault strings and telehealth tip', () => {
    assert.ok(AU_UZANTI.mektup)
    assert.equal(AU_UZANTI.mektup!.turler.length, 3)
    assert.match(AU_UZANTI.mektup!.onayla, /include in export|sign/i)
    assert.match(AU_UZANTI.mektup!.onayBekliyor, /Sign off/i)
    assert.ok(AU_UZANTI.mbsOneri)
    assert.match(AU_UZANTI.mbsOneri!.uyari, /never lodges/i)
    assert.match(AU_UZANTI.mbsOneri!.onayla, /Confirm selected/i)
    assert.ok(AU_UZANTI.pmsEntegrasyon)
    assert.ok(AU_UZANTI.pmsEntegrasyon!.kalemler.some((k) => k.anahtar === 'best-practice' && k.durum === 'partner-api'))
    assert.ok(AU_UZANTI.pmsEntegrasyon!.kalemler.some((k) => k.durum === 'hazir-export'))
    assert.ok(AU_UZANTI.pmsEntegrasyon!.baglantiBaslik)
    assert.match(AU_UZANTI.pmsEntegrasyon!.baglantiKaydedildi ?? '', /not Synced/i)
    assert.match(AU_UZANTI.pmsEntegrasyon!.kuyrukBekliyor ?? '', /partner API|Prepared/i)
    assert.match(AU_UZANTI.pmsEntegrasyon!.uyari, /never .?Synced/i)
    assert.match(AU_UZANTI.telehealthIpucu ?? '', /Telehealth|dictate/i)
    assert.match(AU_UZANTI.telehealthIpucu ?? '', /capture|paste/i)
    assert.doesNotMatch(AU_UZANTI.telehealthIpucu ?? '', /not built yet/i)
  })

  it('prompt register lists every letter/MBS key and remains awaiting clinician until filled', () => {
    const anahtarlar = AU_MEKTUP_ICERIK_ONAYLARI.map((x) => x.anahtar)
    assert.deepEqual(anahtarlar, ['mektup-gp', 'mektup-referral', 'mektup-patient', 'mbs-oneri'])
    assert.equal(mektupIcerikOnaysizMi(), true)
    for (const x of AU_MEKTUP_ICERIK_ONAYLARI) {
      assert.equal(x.klinisyen, null)
      assert.ok(x.surum.length > 0)
      assert.ok(x.bakilacak.length > 20)
    }
  })

  it('AU freemium is note-only 5/day; founding seat count stays 20; PMS tables registered', () => {
    const a = ulkeTicari('au')
    assert.equal(a?.ucretsiz?.gunlukNot, 5)
    assert.equal(a?.kurucu?.koltuk, 20)
    assert.ok((ULKE_TABLOLARI as readonly string[]).includes('ulke_pms_baglantilari'))
    assert.ok((ULKE_TABLOLARI as readonly string[]).includes('ulke_pms_yazma_kuyrugu'))
  })

  it('landing list price stays A$149/mo (founding A$79 invite-only is STRIPE-NOTYA-AU-05; yearly ladder not overwritten here)', () => {
    const f = AU_GIRDI.acilis.fiyatlar.doctor
    assert.equal(f.aylik, 149)
    // Public yearly display left alone while founding offer (A$79/mo · A$948/yr invite) is live.
    assert.equal(f.yillik ?? null, null)
    assert.equal(f.oneCikan, false)
  })
})
