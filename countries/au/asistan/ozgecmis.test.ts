/**
 * PERSONA-ARKAPLAN-01 (Kaan, 2026-11-24) — every AU persona carries a brief professional background in the prompt, the
 * self-introduction does not call the assistant "AI", a sincere "are you a person / an AI?" is answered truthfully, and no
 * background claims a registration or credential the AU pack's own limits forbid.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { canliIstem } from '@/lib/ulke/asistan/istem'
import { AU_ARAYUZ } from '../arayuz'
import { AU_ASISTAN_ADLARI } from '../klinik/asistanAdlari'
import { AU_CANLI_ASISTAN } from './canli'
import { AU_ASISTAN_OZGECMISI, auAsistanOzgecmisi } from './ozgecmis'

const ROLLER = Object.keys(AU_ASISTAN_ADLARI)
const istemi = (rol: string, yazili = false) => {
  const k = AU_ARAYUZ.asistan(rol, 'en-AU')!
  return canliIstem({ canli: AU_CANLI_ASISTAN, tamAd: k.tamAd, kisaAd: k.kisaAd, rolAdi: rol, rol, acilNumara: '000', yazili })
}

describe('au persona backgrounds', () => {
  it('one background for each of the roles with a persona, and none for an unknown role', () => {
    assert.deepEqual(Object.keys(AU_ASISTAN_OZGECMISI).sort(), [...ROLLER].sort())
    assert.equal(auAsistanOzgecmisi('not-a-role'), null)
    assert.equal(AU_CANLI_ASISTAN.ozgecmis?.('paediatrics'), AU_ASISTAN_OZGECMISI.paediatrics)
  })

  it('no registration, college, credential, real institution, number of years or "AI" in any background', () => {
    const yasak = /\b(ahpra|registered|registration|licen[cs]ed?|fellow|fracp|fracs|franzcp|apd|accredited|certified|endorsed|board|college|university|hospital of|\d+\s*years?|ai)\b/i
    for (const [rol, metin] of Object.entries(AU_ASISTAN_OZGECMISI)) {
      assert.ok(!yasak.test(metin), `${rol}: ${metin}`)
      assert.ok(metin.length > 30 && metin.length < 200, rol)
    }
  })

  it('paediatrics and dietetics: the background reaches the voice and the typed prompt, beside the name', () => {
    for (const rol of ['paediatrics', 'dietetics']) {
      for (const yazili of [false, true]) {
        const istem = istemi(rol, yazili)
        assert.ok(istem.includes(AU_ASISTAN_OZGECMISI[rol as keyof typeof AU_ASISTAN_OZGECMISI]), rol)
        assert.ok(istem.includes(AU_ASISTAN_ADLARI[rol as keyof typeof AU_ASISTAN_ADLARI].tamAd), rol)
      }
    }
  })

  it('the self-introduction never says "AI colleague"; a sincere question about being a person or an AI is answered truthfully', () => {
    const istem = istemi('paediatrics')
    const kimlik = istem.split('\n').find((s) => s.startsWith('IDENTITY:'))!
    const ilk = istem.split('\n')[0]
    assert.ok(!/\bAI\b/.test(kimlik), kimlik)
    assert.ok(!/\bAI\b/.test(ilk), ilk)
    assert.ok(!/AI colleague/.test(istem))
    const durust = istem.split('\n').find((s) => s.startsWith('HONESTY:'))!
    assert.match(durust, /not a person/)
    assert.match(durust, /Never claim to be human and never deny being an AI/)
    assert.match(durust, /never claim to personally hold a registration/)
    // The opening line the agent speaks names the persona and the field only.
    const acilis = AU_CANLI_ASISTAN.acilis({ tamAd: 'Dr. Emily Harcourt', kisaAd: 'Emily', rolAdi: 'Paediatrics', doktorAdi: null })
    assert.ok(!/\bAI\b|Notya AI/.test(acilis), acilis)
  })
})
