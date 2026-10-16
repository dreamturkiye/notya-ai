/**
 * NOTYA-ASI-ONAM-01 Phase 2 — proves the engine needs zero code changes for a 6th locale: every
 * country pack below type-checks against `AsiOnamUlkePaketi` as-is, and the engine's own
 * functions accept each one without special-casing. `icerik: []` is intentional (see
 * ulkePaketleri.ts header) — this suite checks the SHAPE is reusable, not that any country's
 * vaccine content exists yet (that is explicitly not implemented this round).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { asiOnamIcerigiGoster, asiOnamIstegiHazirla, TURKIYE_ASI_ONAM_PAKETI } from '../asiOnamMotoru'
import { ASI_ONAM_ULKE_PAKETLERI, type AsiOnamUlkeKodu } from './ulkePaketleri'

const KODLAR: AsiOnamUlkeKodu[] = ['gb', 'nz', 'au', 'ca', 'us', 'uz']

describe('NOTYA-ASI-ONAM-01 Phase 2 · ülke paketleri (reusable engine, no code change per country)', () => {
  it('altı ülke paketi de tanımlı, her biri kendi dilini ve pediatri branşını taşıyor', () => {
    assert.equal(KODLAR.length, 6)
    for (const kod of KODLAR) {
      const paket = ASI_ONAM_ULKE_PAKETLERI[kod]
      assert.equal(paket.pediatriBransi, 'pediatri')
      assert.ok(paket.dil.length > 0)
      assert.ok(Array.isArray(paket.icerik))
    }
  })

  it('her ülke paketinin dili birbirinden farklı (yanlışlıkla tr veya aynı locale kopyalanmamış)', () => {
    const diller = KODLAR.map((k) => ASI_ONAM_ULKE_PAKETLERI[k].dil)
    assert.equal(new Set(diller).size, diller.length)
    assert.ok(!diller.includes('tr'))
  })

  it('motor fonksiyonları herhangi bir ülke paketini TÜRKİYE paketiyle AYNI imzayla kabul eder (motor kodu değişmedi)', () => {
    for (const kod of KODLAR) {
      const paket = ASI_ONAM_ULKE_PAKETLERI[kod]
      // asiOnamIcerigiGoster paket parametresini kabul eder; içerik boş olduğundan null döner — çökme yok.
      assert.equal(asiOnamIcerigiGoster('Herhangi Bir Aşı', paket.dil, paket), null)
      // Boş paket için boş seçim reddedilir (TR için de aynı davranış — motor ülkeye göre dallanmıyor).
      const sonuc = asiOnamIstegiHazirla([], paket.dil, paket)
      assert.equal(sonuc.ok, false)
    }
  })

  it('TURKIYE_ASI_ONAM_PAKETI hâlâ dolu (Phase 2 eklemesi TR içeriğini bozmadı)', () => {
    assert.ok(TURKIYE_ASI_ONAM_PAKETI.icerik.length >= 10)
    assert.equal(TURKIYE_ASI_ONAM_PAKETI.dil, 'tr')
  })

  it('hiçbir ülke paketi henüz içerik taşımıyor — kasıtlı: icat edilmiş tıbbi/yasal içerik yok', () => {
    for (const kod of KODLAR) assert.equal(ASI_ONAM_ULKE_PAKETLERI[kod].icerik.length, 0)
  })
})
