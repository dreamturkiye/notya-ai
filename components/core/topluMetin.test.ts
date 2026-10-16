/**
 * TOPLU-ULKE-01 — the batch card's copy for the ACTIVE country (NOTYA_COUNTRY at test time; unset = Türkiye).
 * Country builds must never show Turkish; Türkiye's text must stay exactly what it was.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AKTIF_TOPLU as m } from '@/countries/active/toplu'

const ulke = process.env.NOTYA_COUNTRY || 'tr'
const TURKCE_HARF = /[çğıöşüİÇĞÖŞÜ]/
const SAYI = { hazir: 2, eksikli: 1, uyariBekleyen: 1 }

/** Every string the card can show from this object, with the keys the base medication action uses. */
function tumMetinler(): string[] {
  return [
    m.kayitHazirlandi(1), m.kayitHazirlandi(3), m.uyariGordum, m.eksikAciklama, m.seciniz, m.seciliEksik(['A', 'B']), m.kaydediliyor, m.kaydedildi, m.kaynak,
    m.dugme(SAYI), m.dugme({ hazir: 0, eksikli: 0, uyariBekleyen: 0 }),
    m.zaman.azOnce, m.zaman.dakika(5), m.zaman.saat(3), m.zaman.dun, m.zaman.gun(3),
    ...Object.values(m.eylemEtiketleri), ...Object.values(m.alanEtiketleri),
  ]
}

describe(`topluMetin (${ulke})`, () => {
  if (ulke === 'tr') {
    it('Türkiye: the original Turkish wording, unchanged, with the server labels untouched', () => {
      assert.equal(m.dugme({ hazir: 1, eksikli: 2, uyariBekleyen: 0 }), 'Seçilenleri kaydet (1 hazır, 2 kayıtta eksik alan var)')
      assert.equal(m.dugme({ hazir: 0, eksikli: 0, uyariBekleyen: 0 }), 'Seçilenleri kaydet (0 hazır)')
      assert.equal(m.dugme(SAYI), 'Seçilenleri kaydet (2 hazır, 1 kayıtta eksik alan var, 1 kayıtta uyarı onayı bekliyor)')
      assert.equal(m.kayitHazirlandi(3), '3 kayıt hazırlandı')
      assert.equal(m.uyariGordum, 'Uyarıyı gördüm, kaydedilebilir')
      assert.equal(m.seciliEksik(['Doz', 'Kullanım']), 'Seçili — Doz, Kullanım girilince eklenecek.')
      assert.equal(m.kaydedildi, 'Kaydedildi')
      assert.equal(m.zaman.dun, 'dün')
      assert.deepEqual(m.alanEtiketleri, {})
      assert.deepEqual(m.eylemEtiketleri, {})
    })
    return
  }
  it('no Turkish letter in any string of this country\'s card copy', () => {
    for (const t of tumMetinler()) assert.ok(!TURKCE_HARF.test(t), `Turkish letter in: ${t}`)
  })
  it('every string is non-empty and carries no leftover Turkish wording', () => {
    for (const t of tumMetinler()) {
      assert.ok(t.trim().length > 0)
      assert.ok(!/kayıt|kaydet|hazır|eksik|Uyarı|Ayşe/i.test(t), t)
    }
  })
  it('labels the base medication keys the release branch really has (ilac_adi, doz, kullanim_sikli)', () => {
    for (const k of ['ilac_adi', 'doz', 'kullanim_sikli']) assert.ok(m.alanEtiketleri[k]?.trim(), k)
    assert.ok(m.eylemEtiketleri.ilac_ekle?.trim())
  })
  it('the button states ready / missing / awaiting counts', () => {
    const d = m.dugme(SAYI)
    assert.ok(d.includes('2') && d.includes('1'))
    assert.notEqual(m.dugme({ hazir: 0, eksikli: 0, uyariBekleyen: 0 }), d)
  })
  if (ulke === 'us') it('en-US spelling form', () => assert.equal(m.tarihYerel, 'en-US'))
  if (ulke === 'gb') it('en-GB spelling form', () => assert.equal(m.tarihYerel, 'en-GB'))
  if (ulke === 'ca') it('en-CA spelling form', () => assert.equal(m.tarihYerel, 'en-CA'))
  if (ulke === 'au') it('en-AU spelling form', () => assert.equal(m.tarihYerel, 'en-AU'))
  if (ulke === 'nz') it('en-NZ spelling form', () => assert.equal(m.tarihYerel, 'en-NZ'))
  if (ulke === 'uz') {
    it('Uzbek (Latin script): no Cyrillic, no Turkish-only wording', () => {
      for (const t of tumMetinler()) assert.ok(!/[Ѐ-ӿ]/.test(t), t)
      assert.equal(m.tarihYerel, 'uz-Latn')
      assert.equal(m.kaydedildi, 'Saqlandi')
    })
  }
})
