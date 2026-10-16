import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gs1Coz, barkodBilgisi } from './barkod'

describe('NOTYA-ASI-STOK-BARKOD-01: GS1 barkod ayrıştırma', () => {
  it('GTIN(01) + SKT(17) + Lot(10) ayrıştırır', () => {
    const ham = '0108680000123456172612311012345A'
    const d = gs1Coz(ham)
    assert.equal(d?.gtin, '08680000123456')
    assert.equal(d?.sktIso, '2026-12-31')
    assert.equal(d?.lotNo, '12345A')
  })

  it('GS (0x1D) ayraçlı değişken alanı doğru sınırlar', () => {
    const GS = '\u001d'
    // AI01 sabit 14 hane (ayraçsız), ardından AI10 (değişken, GS ile sonlanır), ardından AI17 (sabit 6 hane).
    const ham = `0108680000123456` + `10ABC123` + GS + `17261231`
    const d = gs1Coz(ham)
    assert.equal(d?.lotNo, 'ABC123')
    assert.equal(d?.sktIso, '2026-12-31')
  })

  it('GS1 kalıbına uymayan ham kodda null döner', () => {
    assert.equal(gs1Coz('KLINIK-KENDI-ETIKETI-001'), null)
  })

  it('barkodBilgisi: GS1 çözülürse anahtar gtin|lot, çözülmezse ham kodun kendisi', () => {
    const gs1 = barkodBilgisi('0108680000123456172612311012345A')
    assert.equal(gs1.anahtar, '08680000123456|12345A')
    const ham = barkodBilgisi('KLINIK-001')
    assert.equal(ham.anahtar, 'KLINIK-001')
    assert.equal(ham.ham, 'KLINIK-001')
  })
})
