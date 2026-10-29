/**
 * AU-PEDIATRI-GOLD-01a — one danger-sign tool per offered role; foreign role omits it;
 * a tick raises acil; yok alone is clean.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AU_ASISTAN_ADLARI } from '../klinik/asistanAdlari'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { AU_ARAYUZ } from '../arayuz'
import {
  AU_ACIL_ANAHTARLARI,
  AU_ACIL_ROL_ANAHTAR,
  AU_ACIL_TANIMLAR,
  auAcilBayraklari,
} from './acilBayraklari'

const A = AU_ARAYUZ.araclar as UlkeAraclari

const kos = (anahtar: string, ham: Record<string, unknown>) => {
  const t = AU_ACIL_TANIMLAR.find((x) => x.anahtar === anahtar)!
  return t.hesapla(ham as never, { bugun: '2026-10-28', p: {} })
}

describe('AU danger-sign pathways (GOLD-01a)', () => {
  it('one flag tool per offered role; pack wires them specialty-gated', () => {
    assert.equal(AU_ACIL_ANAHTARLARI.length, Object.keys(AU_ASISTAN_ADLARI).length)
    assert.equal(auAcilBayraklari().length, AU_ACIL_ANAHTARLARI.length)
    for (const rol of Object.keys(AU_ASISTAN_ADLARI) as (keyof typeof AU_ACIL_ROL_ANAHTAR)[]) {
      const anahtar = AU_ACIL_ROL_ANAHTAR[rol]
      const paket = A.araclar.find((p) => p.anahtar === anahtar)
      assert.ok(paket, `${rol} → ${anahtar}`)
      assert.deepEqual(paket!.roller, [rol])
      assert.match(paket!.metin.uyarilar!.acil['en-AU']!, /Triple Zero \(000\)/)
    }
  })

  it('cardiology never sees the paediatrics flags tool', () => {
    const pedi = AU_ACIL_ROL_ANAHTAR.paediatrics
    const kardiyoGoren = A.araclar.filter((p) => p.anahtar === pedi)
    assert.equal(kardiyoGoren.length, 1)
    assert.deepEqual(kardiyoGoren[0].roller, ['paediatrics'])
    assert.ok(!kardiyoGoren[0].roller!.includes('cardiology'))
  })

  it('a tick raises acil; yok alone does not; yok with a tick is incomplete', () => {
    const anahtar = AU_ACIL_ROL_ANAHTAR.paediatrics
    const t = AU_ACIL_TANIMLAR.find((x) => x.anahtar === anahtar)!
    const isaret = t.alanlar.find((a) => a.tur === 'isaret' && a.anahtar !== 'yok')!.anahtar
    const dolu = kos(anahtar, { [isaret]: true })
    assert.equal(dolu.tamam, true)
    assert.deepEqual(dolu.uyarilar, ['acil'])
    const temiz = kos(anahtar, { yok: true })
    assert.equal(temiz.tamam, true)
    assert.deepEqual(temiz.uyarilar, [])
    assert.equal(kos(anahtar, { [isaret]: true, yok: true }).tamam, false)
    assert.equal(kos(anahtar, {}).tamam, false)
  })
})
