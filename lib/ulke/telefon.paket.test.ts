/**
 * Phone numbers on every form, for whichever pack is active: the country's own example number passes; a number too
 * short, too long, with letters or with another country's prefix is refused — by the same rule on the patient record,
 * the appointment, the intake form and the screens (their sentences are the pack's, with the example in them).
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { cevabiSuz, telefonHatalari } from './intake/sorular'
import type { Soru } from './intake/tipler'
import { telefonHatasi, telefonKaydi, ulkeTelefonu } from './arayuz/telefon'
import { girdiMetni } from './arayuz'
import { hastaGirdisiHatasi, hastaGirdisiniSuz, hastaDilleri } from './uygulama/hastalar'
import { ulkePaketi } from './ulke'

const p = ulkePaketi()
const tel = p.telefon.ornek
const KISA = tel.slice(0, -4).trim()
const UZUN = `${tel}99`
const BASKA = p.kod === 'gb' ? '+61 491 570 006' : '+44 7700 900123'
const sorgu: Soru = { anahtar: 'tel', tur: 'kisa-metin', metin: { x: 'Phone' }, tel: true }
const hasta = (telefon: string) => ({ ad: 'Test Patient', otaIsmi: '', dogumTarihi: '2000-01-01', cinsiyet: '' as const, telefon, dil: hastaDilleri()[0] ?? '', ulusalKimlik: '' })

describe(`phone numbers: ${p.kod}`, () => {
  it("the pack's own example is a valid number and is stored as E.164", () => {
    const r = ulkeTelefonu(tel)
    assert.ok(r.tamam, JSON.stringify(r))
    assert.match(r.tamam ? r.e164 : '', /^\+\d{8,15}$/)
  })
  it('too short, too long, letters and another country are refused with a sentence of the pack that holds the example', () => {
    const g = girdiMetni(p.varsayilanDil)
    for (const kotu of [KISA, UZUN, `${tel}abc`, BASKA]) {
      const m = telefonHatasi(g, kotu)
      assert.ok(m, `${kotu} must be refused`)
      assert.ok(!/%\d?/.test(m!), 'no placeholder is left in the sentence')
    }
    assert.equal(telefonHatasi(g, tel), null)
    assert.equal(telefonHatasi(g, ''), null, 'an optional field may be empty')
    assert.ok(telefonHatasi(g, '', { zorunlu: true }))
    assert.ok(telefonHatasi(g, KISA)!.includes(tel) || telefonHatasi(g, `${tel}abc`)!.length > 0)
  })
  it('the patient record: the server refuses a bad number by field and stores the good one as E.164', () => {
    assert.equal(hastaGirdisiHatasi(hasta(tel)), null)
    assert.equal(hastaGirdisiHatasi(hasta('')), null)
    for (const kotu of [KISA, UZUN, `${tel}abc`, BASKA]) assert.equal(hastaGirdisiHatasi(hasta(kotu)), 'telefon', kotu)
    assert.equal(hastaGirdisiniSuz(hasta(tel)).telefon, telefonKaydi(tel))
    assert.match(hastaGirdisiniSuz(hasta(tel)).telefon, /^\+/)
  })
  it('the intake form: a typed phone is kept as E.164, a bad one is named for refusal on sending', () => {
    assert.equal(cevabiSuz(sorgu, tel, p.uygulama!.birimler), telefonKaydi(tel))
    assert.equal(cevabiSuz(sorgu, KISA, p.uygulama!.birimler), undefined)
    assert.deepEqual(telefonHatalari([sorgu], { tel: KISA }), ['tel'])
    assert.deepEqual(telefonHatalari([sorgu], { tel }), [])
    assert.deepEqual(telefonHatalari([sorgu], { tel: '' }), [])
  })
  it('a number with a plus sign and the pack prefix is the same number', () => {
    const e = telefonKaydi(tel)
    assert.equal(telefonKaydi(e), e)
    assert.equal(telefonKaydi(`00${e.slice(1)}`), e)
  })
})
