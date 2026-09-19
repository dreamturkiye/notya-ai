/**
 * NOROLOJI-EXCEPTIONAL-01 — İnme/TIA acil triyaj motor testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  acilTara, hekimOnayiGerekliMi, intakeAcilKodlari, INTAKE_ACIL_SECENEKLERI, ACIL_KODLARI, HASTA_ACIL_METNI,
} from '../engines/acil'

describe('noroloji acil', () => {
  it('yüz kayması ve konuşma bozukluğunu yakalar', () => {
    const b = acilTara(['Yüzüm kaydı ve konuşmam bozuldu'])
    assert.ok(b.some((x) => x.kod === 'yuz_kaymasi'))
    assert.ok(b.some((x) => x.kod === 'konusma_bozuk'))
    assert.ok(hekimOnayiGerekliMi(b))
  })

  it('Türkçe İ büyük harfini yakalar', () => {
    const b = acilTara(['İki saattir kolum güçsüz'])
    assert.ok(b.some((x) => x.kod === 'guc_kaybi'))
  })

  it('intake etiketleri motor kodlarıyla birebir', () => {
    const kodlar = intakeAcilKodlari(INTAKE_ACIL_SECENEKLERI.map((s) => s.etiket))
    assert.equal(kodlar.length, ACIL_KODLARI.length)
  })

  it('hasta acil metni tanı ve doz taşımaz', () => {
    assert.match(HASTA_ACIL_METNI, /112/)
    assert.doesNotMatch(HASTA_ACIL_METNI, /\bmg\b|MIDAS|tanı/i)
  })
})
