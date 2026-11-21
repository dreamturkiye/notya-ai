/**
 * KRONIK-SECIM-01 — the chronic-condition picker: branş suggestions on top (no leak), search by name / synonym / ICD-10,
 * free-text add, no duplicates, removable; the stored shape (array of names) is unchanged.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SPECIALTIES } from './specialties'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'
import {
  BRANS_KRONIK_ONERILERI, GENEL_KRONIK_ONERILERI, KRONIK_TANILAR, aramaKatla, bransKronikOnerileri, kronikAra, kronikCikar, kronikEkle, kronikKodu,
} from './kronikHastaliklar'

describe('kronik hastalık seçici', () => {
  it('every one of the 40 branches (30 medical + 10 Özel Branşlar) has its suggestions, all from the list', () => {
    const adlar = new Set(KRONIK_TANILAR.map((t) => t.ad))
    const tum = [...SPECIALTIES.map((s) => s.key), ...KLINIK_YENI_SLUGS]
    assert.equal(tum.length, 40)
    for (const b of tum) {
      const o = BRANS_KRONIK_ONERILERI[b]
      assert.ok(o && o.length >= 5, `${b} has suggestions`)
      for (const ad of o) assert.ok(adlar.has(ad), `${b}: "${ad}" is a list item`)
    }
    for (const ad of GENEL_KRONIK_ONERILERI) assert.ok(adlar.has(ad), ad)
  })
  it('a branş sees its own suggestions on top — a KBB list never reaches kardiyoloji', () => {
    assert.ok(bransKronikOnerileri('kulak-burun-bogaz').includes('Kronik sinüzit'))
    assert.ok(!bransKronikOnerileri('kardiyoloji').includes('Kronik sinüzit'))
    assert.deepEqual(bransKronikOnerileri('kadin-dogum'), BRANS_KRONIK_ONERILERI['kadin-hastaliklari-dogum'])
    assert.deepEqual(bransKronikOnerileri(null), GENEL_KRONIK_ONERILERI)
  })
  it('searches by Turkish name (without diacritics too), synonym and ICD-10 code', () => {
    assert.equal(kronikAra('sinuz')[0].ad, 'Kronik sinüzit')
    assert.equal(kronikAra('J45')[0].ad, 'Astım')
    assert.equal(kronikAra('seker hastaligi')[0].ad, 'Diyabet')
    assert.equal(kronikAra('osas')[0].ad, 'Obstrüktif uyku apnesi')
    assert.ok(kronikAra('işitme').some((t) => t.ad === 'İşitme kaybı'))
    assert.deepEqual(kronikAra(''), [])
    assert.ok(!kronikAra('diyabet', ['Diyabet']).some((t) => t.ad === 'Diyabet'), 'already chosen items are not offered again')
  })
  it('adds anything (free text), never twice, keeps a list item\'s spelling; removes', () => {
    let s = kronikEkle([], 'Diyabet')
    s = kronikEkle(s, 'diyabet')
    assert.deepEqual(s, ['Diyabet'])
    s = kronikEkle(s, '  kronik sinuzit ')
    assert.deepEqual(s, ['Diyabet', 'Kronik sinüzit'])
    s = kronikEkle(s, 'Wegener granülomatozu')
    assert.deepEqual(s, ['Diyabet', 'Kronik sinüzit', 'Wegener granülomatozu'])
    assert.deepEqual(kronikEkle(s, '   '), s)
    assert.deepEqual(kronikCikar(s, 'KRONİK SİNÜZİT'), ['Diyabet', 'Wegener granülomatozu'])
    assert.equal(kronikKodu('Astım'), 'J45'); assert.equal(kronikKodu('Wegener granülomatozu'), null)
    assert.equal(aramaKatla('İşitme KAYBI'), 'isitme kaybi')
  })
  it('list names are unique', () => {
    const k = KRONIK_TANILAR.map((t) => aramaKatla(t.ad))
    assert.equal(new Set(k).size, k.length)
  })
})
