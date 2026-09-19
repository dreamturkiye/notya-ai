import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  acilTara, hekimOnayiGerekliMi, INTAKE_ACIL_SECENEKLERI, ACIL_KODLARI, HASTA_ACIL_METNI, intakeAcilKodlari,
} from '@/specialties/uroloji/engines/acil'
import { BRANS_SORULARI } from '@/lib/intake/bransSorulari'

describe('UROLOJI-EXCEPTIONAL-01 acil triyaj', () => {
  it('INTAKE_ACIL_SECENEKLERI labels match bransSorulari 1:1', () => {
    const alan = BRANS_SORULARI.uroloji.alanlar.find((a) => a.id === 'acilBelirtilerUroloji')
    assert.ok(alan)
    const secenekler = (alan!.secenekler || []).filter((s) => s !== 'Yok')
    assert.deepEqual(INTAKE_ACIL_SECENEKLERI.map((s) => s.etiket), secenekler)
  })

  it('detects hematuri, retansiyon, flank+ateş, torsiyon, priapizm, travma', () => {
    assert.ok(acilTara(['idrarda kan görüyorum']).some((b) => b.kod === 'hematuri_makroskopik'))
    assert.ok(acilTara(['idrar yapamıyorum']).some((b) => b.kod === 'anuri_retansiyon'))
    assert.ok(acilTara(['yan ağrım var ateşim de çıktı']).some((b) => b.kod === 'flank_ates'))
    assert.ok(acilTara(['testiste ani şiddetli ağrı']).some((b) => b.kod === 'torsiyon_suphesi'))
    assert.ok(acilTara(['4 saattir ağrılı ereksiyon']).some((b) => b.kod === 'priapizm'))
    assert.ok(acilTara(['pelvis kırığı sonrası üretra travması']).some((b) => b.kod === 'travma_uretra'))
  })

  it('hemen flags require hekim onayı', () => {
    const b = acilTara([], ['hematuri_makroskopik'])
    assert.equal(hekimOnayiGerekliMi(b), true)
  })

  it('patient copy mentions 112 and has no diagnosis language', () => {
    assert.match(HASTA_ACIL_METNI, /112/)
    assert.doesNotMatch(HASTA_ACIL_METNI, /tanı|kanser|BPH/i)
    assert.equal(ACIL_KODLARI.length, 6)
  })

  it('intakeAcilKodlari maps labels to codes', () => {
    const kodlar = intakeAcilKodlari(['Gözle görülür idrar kanaması', 'Yok'])
    assert.deepEqual(kodlar, ['hematuri_makroskopik'])
  })
})
