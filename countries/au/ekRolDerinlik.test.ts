/**
 * ULKE-BRANS-DERINLIK-2026-11 — Australia: every role only this country has writes with note fields of its own and asks
 * intake questions of its own, and its role-specific fields leak to no other role (brans-alan-sizmasi, both directions).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AU_ARAYUZ } from './arayuz'
import { AU_KLINIK } from './klinik'
import { AU_EK_ROL_TURLERI } from './klinik/roller'
import { EN_EK_ALANLAR, EN_EK_SABLONLAR } from '../_dil/en/klinik/ekRoller'
import { rolSablonAlanlari } from '@/lib/ulke/arayuz/notSablonu'
import { icerikAnahtari } from '@/lib/ulke/arayuz/rolIcerigi'

const A = AU_ARAYUZ!
const K = AU_KLINIK!
const ROLLER = A.roller
const turu = (rol: string): string | null => (Object.prototype.hasOwnProperty.call(AU_EK_ROL_TURLERI, rol) ? AU_EK_ROL_TURLERI[rol] : null)

describe('au: own depth for the roles only this country has (ULKE-BRANS-DERINLIK-2026-11)', () => {
  it('every named role is a role of this pack, and writes with its kind\'s own fields, not the borrowed ones', () => {
    for (const [rol, tur] of Object.entries(AU_EK_ROL_TURLERI)) {
      assert.ok(ROLLER.some((r) => r.anahtar === rol), rol)
      assert.equal(icerikAnahtari(ROLLER, rol, A.notSablonlari.rolAlanlari), rol, `${rol}: own template`)
      assert.deepEqual([...rolSablonAlanlari(A.notSablonlari, ROLLER, rol)], [...EN_EK_SABLONLAR[tur as keyof typeof EN_EK_SABLONLAR]], rol)
      for (const alan of rolSablonAlanlari(A.notSablonlari, ROLLER, rol)) assert.ok(A.notSablonlari.alanlar[alan], `${rol}: ${alan} has a label`)
    }
  })

  it('every named role asks intake questions of its own (server half)', () => {
    const form = K.hastaFormu!
    for (const rol of Object.keys(AU_EK_ROL_TURLERI)) {
      assert.equal(icerikAnahtari(ROLLER, rol, form.roller), rol, `${rol}: own questions`)
      assert.ok(form.roller[rol].sorular.length >= 5, rol)
    }
  })

  it('a field that belongs to one kind is on no role of another kind (present for the owner, absent elsewhere)', () => {
    for (const r of ROLLER) {
      const alanlar = rolSablonAlanlari(A.notSablonlari, ROLLER, r.anahtar)
      const tur = turu(r.anahtar)
      for (const alan of alanlar) {
        if (!(alan in EN_EK_ALANLAR)) continue
        assert.ok(tur !== null, `${r.anahtar} (a role with no kind of its own) shows ${alan}`)
        assert.ok((EN_EK_SABLONLAR[tur as keyof typeof EN_EK_SABLONLAR] as readonly string[]).includes(alan), `${r.anahtar} shows ${alan}`)
      }
    }
    // the shared roles keep exactly what they had: no new field reaches them
    for (const r of ROLLER.filter((x) => !turu(x.anahtar))) {
      for (const alan of rolSablonAlanlari(A.notSablonlari, ROLLER, r.anahtar)) assert.ok(!(alan in EN_EK_ALANLAR), `${r.anahtar}: ${alan}`)
    }
  })
})
