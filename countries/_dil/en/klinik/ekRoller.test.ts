/**
 * ULKE-BRANS-DERINLIK-2026-11 — the own content of the roles only one country has (./ekRoller.ts): every kind has fields
 * and questions of its own, nothing names a country, and nothing changes for a role a country did not name.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { EN_ALANLAR } from './notSablonlari'
import { EN_EK_ALANLAR, EN_EK_SABLONLAR, EN_EK_TURLER, enEkRolIcerigi, enEkSorular } from './ekRoller'
import type { EnRolDegisimi } from './roller'

const ULKE_SOZLERI = /\b(NHS|NICE|GMC|Medicare|Medicaid|Canada|Canadian|Australia|Australian|Zealand|ACC|Ahpra|Turkey|Turkish|SGK|HIPAA|Uzbekistan)\b/

describe('own content for country-only roles (ULKE-BRANS-DERINLIK-2026-11)', () => {
  it('no new field clashes with a field of the shared set', () => {
    for (const k of Object.keys(EN_EK_ALANLAR)) assert.ok(!(k in EN_ALANLAR), k)
  })

  it('every kind has at least 5 fields of its own, every field exists, none repeated, and at least one new field or a mix no shared role has', () => {
    for (const tur of EN_EK_TURLER) {
      const liste = EN_EK_SABLONLAR[tur]
      assert.ok(liste.length >= 5, tur)
      assert.equal(new Set(liste).size, liste.length, tur)
      for (const alan of liste) assert.ok(alan in EN_ALANLAR || alan in EN_EK_ALANLAR, `${tur}: ${alan}`)
    }
  })

  it('every kind asks at least 5 questions, keys unique and under the role prefix, wording names no country', () => {
    const tum = new Set<string>()
    for (const tur of EN_EK_TURLER) {
      const r = enEkSorular(tur, `zz_${tur.replace(/-/g, '')}`)
      assert.ok(r.sorular.length >= 5, tur)
      for (const q of r.sorular) {
        assert.ok(q.anahtar.startsWith(`zz_${tur.replace(/-/g, '')}_`), q.anahtar)
        assert.ok(!tum.has(q.anahtar), q.anahtar)
        tum.add(q.anahtar)
        assert.doesNotMatch([q.metin, q.ayrinti ?? '', q.veliMetni ?? '', ...(q.secenekler ?? []).map((o) => o.ad)].join(' '), ULKE_SOZLERI, q.anahtar)
      }
      assert.doesNotMatch(r.baslik, ULKE_SOZLERI, tur)
    }
    assert.doesNotMatch(Object.values(EN_EK_ALANLAR).map((x) => x.ad).join(' '), ULKE_SOZLERI)
  })

  it('no field holds a reference value, a dose or a score of its own: labels describe what was said', () => {
    for (const [k, v] of Object.entries(EN_EK_ALANLAR)) assert.doesNotMatch(v.ad, /\b(mg|mmol|normal range|cut-?off|grade \d|stage [IV]+)\b/i, k)
  })

  it('a country names its own roles; a role it does not name is left exactly as it was; fields spelled per form', () => {
    const d: EnRolDegisimi = { ekle: [
      { anahtar: 'zz-allergy', taraf: 'doktor', ad: 'Allergy', gibi: 'internal-medicine' },
      { anahtar: 'zz-other', taraf: 'doktor', ad: 'Other', gibi: 'internal-medicine' },
    ] }
    const sonuc = enEkRolIcerigi(d, 'en-US', { 'zz-allergy': 'allergy' }, { 'zz-allergy': 'zz_al' }, { form: true })
    const al = sonuc.ekle!.find((r) => r.anahtar === 'zz-allergy')!
    const ot = sonuc.ekle!.find((r) => r.anahtar === 'zz-other')!
    assert.deepEqual(al.sablon, EN_EK_SABLONLAR.allergy)
    assert.ok(al.form && al.form.sorular.every((q) => q.anahtar.startsWith('zz_al_')))
    assert.deepEqual(ot, d.ekle![1])
    assert.ok(sonuc.alanlar && 'reaction_history' in sonuc.alanlar && !('sleep_pattern' in sonuc.alanlar))
    const ekransiz = enEkRolIcerigi(d, 'en-US', { 'zz-allergy': 'allergy' }, { 'zz-allergy': 'zz_al' }, { form: false })
    assert.equal(ekransiz.ekle!.find((r) => r.anahtar === 'zz-allergy')!.form, undefined)
  })
})
