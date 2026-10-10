/**
 * NOTYA-SUT-RAPOR-01 — göğüs hastalıkları rapor taslağı: rapor süresinin tavanı.
 * SUT 3.1.2.2(2): sürekli kullanılan tıbbi malzemelere ilişkin sağlık raporları, istisnalar hariç, en fazla 2 yıl
 * geçerlidir. SUT 4.1.3(5): ilaç kullanımına esas sağlık raporları, özel düzenlemeler hariç, en fazla iki yıl geçerlidir.
 * Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gogusRaporTaslagi, gogusRaporSuresi, GOGUS_RAPOR_EN_FAZLA_AY, GOGUS_RAPOR_SABLONLARI } from '../engines/sgkRapor'

const girdi = (sureAy?: number) => ({ sablon: 'uzun_oksijen' as const, hastaAdi: '', bugun: '2026-10-10', tani: { icd10: 'J44.9', aciklama: 'KOAH' }, hekimDegerlendirmesi: 'Değerlendirme', sureAy })

describe('göğüs rapor taslağı — süre tavanı (SUT 3.1.2.2(2), 4.1.3(5))', () => {
  it('24 ayı aşan süre 24 aya indirilir (önceki davranış: sınırsız)', () => {
    assert.equal(GOGUS_RAPOR_EN_FAZLA_AY, 24)
    assert.equal(gogusRaporTaslagi(girdi(60)).draft.sureAy, 24)
    assert.equal(gogusRaporTaslagi(girdi(24)).draft.sureAy, 24)
    assert.equal(gogusRaporTaslagi(girdi(12)).draft.sureAy, 12)
  })

  it('süre verilmezse varsayılan 6 ay; geçersiz değer varsayılana döner', () => {
    assert.equal(gogusRaporTaslagi(girdi()).draft.sureAy, 6)
    assert.equal(gogusRaporSuresi(0), 6)
    assert.equal(gogusRaporSuresi(-3), 6)
    assert.equal(gogusRaporSuresi(Number.NaN), 6)
    assert.equal(gogusRaporSuresi(2.4), 2)
  })

  it('tavan her şablonda aynıdır', () => {
    for (const s of GOGUS_RAPOR_SABLONLARI) {
      assert.equal(gogusRaporTaslagi({ ...girdi(99), sablon: s.id }).draft.sureAy, 24, s.id)
    }
  })
})
