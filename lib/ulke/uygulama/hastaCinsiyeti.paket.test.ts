/**
 * CINSIYET-NORMAL-01 (2026-11-20, country build) — the patient record's sex goes through the ONE shared helper
 * (lib/utils/cinsiyet.ts), for whichever pack is active: any stored or typed variant (F / M, Female, the country's own
 * words — Uzbek "ayol" / "erkak", Russian "женский" / "мужской") is accepted and stored as the canonical
 * 'female' | 'male', so a growth chart or a sex-limited tool never silently drops a patient. Unknown or contradictory
 * text is still refused, and so is a Turkish form (Kadın / Erkek / K / E — no Turkish in a country build); an empty
 * field stays empty.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { hastaGirdisiHatasi, hastaGirdisiniSuz, hastaDilleri, type HastaGirdisi } from './hastalar'
import { ulkePaketi } from '../ulke'

const p = ulkePaketi()
const girdi = (cinsiyet: string): HastaGirdisi => ({ ad: 'Test Patient', otaIsmi: '', dogumTarihi: '2020-01-01', cinsiyet: cinsiyet as HastaGirdisi['cinsiyet'], telefon: '', dil: hastaDilleri()[0] ?? '', ulusalKimlik: '' })

describe(`patient sex — one shared normaliser: ${p.kod}`, () => {
  const kadin = ['female', 'Female', 'F', 'f', 'woman', 'girl', 'ayol', 'qiz', 'женский', 'Ж']
  const erkek = ['male', 'MALE', 'M', 'm', 'man', 'boy', 'erkak', "o'g'il", 'мужской', 'М']
  it('every female variant is accepted and stored as "female"', () => {
    for (const v of kadin) {
      assert.notEqual(hastaGirdisiHatasi(girdi(v)), 'cinsiyet', v)
      assert.equal(hastaGirdisiniSuz(girdi(v)).cinsiyet, 'female', v)
    }
  })
  it('every male variant is accepted and stored as "male"', () => {
    for (const v of erkek) {
      assert.notEqual(hastaGirdisiHatasi(girdi(v)), 'cinsiyet', v)
      assert.equal(hastaGirdisiniSuz(girdi(v)).cinsiyet, 'male', v)
    }
  })
  it('Turkish forms, unknown or contradictory text are refused (no Turkish in a country build); empty stays empty', () => {
    for (const v of ['Kadın', 'Kadin', 'K', 'Erkek', 'E', 'other', 'x', 'male/female']) assert.equal(hastaGirdisiHatasi(girdi(v)), 'cinsiyet', v)
    assert.notEqual(hastaGirdisiHatasi(girdi('')), 'cinsiyet')
    assert.equal(hastaGirdisiniSuz(girdi('')).cinsiyet, '')
  })
})
