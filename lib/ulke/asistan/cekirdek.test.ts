/**
 * NOTYA-ASISTAN-SABLON — the country door uses Ayşe's engines, and the template covers every role.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { olaylariKur, hastaKur } from '@/lib/doktor/dosyaOlaylari'
import { CEKIRDEK_KURALLAR } from '@/lib/asistan/cekirdekEgitim'
import { ULUSLARARASI_KITAP } from '@/lib/asistan/uluslararasiKitaplar'
import { SECONDARY_TEXTBOOKS } from '@/lib/asistan/turkishSpecialtyRefs'
import { olcumDosyasi, TAHMIN_KILO } from '@/lib/asistan/tests/olcumHastasi'
import { EN_TR_ROL, ikiKitap, ikiUluslararasi } from '@/lib/ulke/asistan/kitaplar'
import { enDosyaCevabi, enDosyaSorusu } from '@/lib/ulke/asistan/cekirdek'
import { asistanKimligiKur, asistanTalimatiKur, ucKaynak } from '@/lib/ulke/asistan/sablon'

const ESLESME = JSON.parse(readFileSync(new URL('../../../countries/rol-eslemesi.json', import.meta.url), 'utf8')) as {
  roller: { en: string; tr: string; taraf: string }[]
}

describe('the role bridge matches the shared role table', () => {
  it('every English doctor and clinic role points at the Turkish key', () => {
    for (const r of ESLESME.roller) assert.equal((EN_TR_ROL as Record<string, string>)[r.en], r.tr, r.en)
    assert.equal(Object.keys(EN_TR_ROL).length, ESLESME.roller.length)
  })
  it('paediatrics takes Nelson from the shared list, and not cardiology\'s book', () => {
    assert.equal(ikiKitap('pediatri')[0], 'Nelson Textbook of Pediatrics')
    assert.deepEqual(ikiUluslararasi('paediatrics').slice(), ikiKitap('pediatri').slice())
    assert.ok(!ikiUluslararasi('cardiology').includes('Nelson Textbook of Pediatrics'))
  })
  it('the English titles are the secondary list with the parenthetical note removed', () => {
    const turkce = /[çğıöşüİĞŞÇÖÜ]|Türk|Türkiye|\bSGK\b|\bSB\b/
    const ing = (ham: string) => {
      const s = ham.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
      return !s || turkce.test(s) ? null : s
    }
    for (const [brans, liste] of Object.entries(SECONDARY_TEXTBOOKS)) {
      const aday = liste.map(ing).filter((x): x is string => Boolean(x))
      assert.deepEqual([...(ULUSLARARASI_KITAP as Record<string, readonly string[]>)[brans]], [aday[0], aday[1]], brans)
    }
  })
})

describe('the template', () => {
  const cumle = {
    profesor: 'You are a professor of %s with more than twenty years of clinical practice in %c.',
    kidemli: 'You are a senior %s with more than twenty years of practice in %c. You are not a doctor.',
    kaynak: '(1) %1 (2) %2 (3) %3',
  }
  it('refuses fewer or more than three references', () => {
    assert.throws(() => ucKaynak(['one', 'two']))
    assert.throws(() => ucKaynak(['one', 'two', 'three', 'four']))
  })
  it('a doctor is a professor and an allied profession is not', () => {
    assert.equal(asistanKimligiKur({ uzmanlik: 'Paediatrics', taraf: 'doktor' }).tamAd, 'Professor of Paediatrics')
    assert.equal(asistanKimligiKur({ uzmanlik: 'Physiotherapist', taraf: 'klinik-muttefik' }).tamAd, 'Senior Physiotherapist')
    const t = asistanTalimatiKur('Australia', { uzmanlik: 'Paediatrics', taraf: 'doktor', kaynaklar: ['Handbook', 'Nelson', 'Harriet Lane'] }, 'en', cumle)
    for (const k of CEKIRDEK_KURALLAR) assert.ok(t.includes(k.en), k.id)
    assert.ok(!t.includes('Braunwald'))
  })
})

describe('English chart questions use the shared engines', () => {
  const dosya = olcumDosyasi('a')
  const bugun = '2026-01-01'
  const olaylar = olaylariKur(dosya, bugun)
  const hasta = hastaKur(dosya, bugun)

  it('the weight at the 6 month visit is the recorded weight, not a dose and not a later visit', () => {
    const cevap = enDosyaCevabi('Can you show me how many kg he was when he came in for the visit when he was 6 months old?', olaylar, hasta)
    assert.ok(cevap)
    assert.match(cevap!, /7\.9 kg/)
    assert.match(cevap!, /2024-11-15/)
    assert.ok(!cevap!.includes(TAHMIN_KILO))
    assert.ok(!cevap!.includes('10.6') && !cevap!.includes('10,6'))
  })

  it('a visit that is not on the record is not filled in from another visit', () => {
    const cevap = enDosyaCevabi('How many kg was he at the 4 month visit?', olaylar, hasta)
    assert.match(cevap!, /no visit on the record/)
    assert.ok(!cevap!.includes('7.9') && !cevap!.includes('9.8'))
  })

  it('the vaccine record lists what was given and does not treat a plan as given', () => {
    const cevap = enDosyaCevabi('Show me the immunization record', olaylar, hasta)
    assert.match(cevap!, /no vaccine record/)
  })

  it('the latest laboratory result keeps the laboratory reference interval', () => {
    const lab = olaylariKur({
      ...dosya,
      lablar: [
        { id: 'l1', canonical_key: 'Ferritin', kanonik_deger: 8, kanonik_birim: 'ug/L', numune_tarihi: '2025-01-01', ref_low: 12, ref_high: 150 },
        { id: 'l2', canonical_key: 'Ferritin', kanonik_deger: 22, kanonik_birim: 'ug/L', numune_tarihi: '2025-06-01', ref_low: 12, ref_high: 150 },
      ],
    }, bugun)
    const cevap = enDosyaCevabi('What are the last lab results?', lab, hasta)
    assert.match(cevap!, /Ferritin: 22 ug\/L \(2025-06-01\)/)
    assert.match(cevap!, /reference interval 12 to 150/)
    assert.ok(!cevap!.includes('Ferritin: 8'))
  })

  it('a dose question is not answered as a weight', () => {
    assert.equal(enDosyaSorusu('what iron dose in mg was started at 6 months'), null)
  })
})
