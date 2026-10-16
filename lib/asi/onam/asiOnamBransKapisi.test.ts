/**
 * NOTYA-ASI-ONAM-01 — branş kapısı: Dijital Aşı Onam Sistemi SADECE pediatri'de görünür/erişilebilir.
 * BRANS-ALAN-SIZMASI deseni: her branş için açıkça karar + negatif örnekleri isimle test et
 * (bkz. lib/specialties/brans-alan-sizmasi.test.ts). Bu kapı PEDIATRIK_BAGLAM'dan bilerek daha dar
 * (çocuk-cerrahisi de hariç) — asiOnamBransKapisi.ts'in başındaki not.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import { ASI_ONAM_BRANSI, asiOnamBransUygunMu } from './asiOnamBransKapisi'

const TUM: SpecialtyKey[] = Object.keys(BRANS_ETIKETLERI) as SpecialtyKey[]

describe('NOTYA-ASI-ONAM-01 · branş kapısı', () => {
  it('ASI_ONAM_BRANSI pediatri', () => {
    assert.equal(ASI_ONAM_BRANSI, 'pediatri')
  })

  it('yalnız pediatri true döner — tüm branşlar üzerinde döngü (negatif: çocuk-cerrahisi, aile-hekimliği dahil)', () => {
    assert.ok(TUM.length > 20, `beklenenden az branş (${TUM.length}) — BRANS_ETIKETLERI bozulmuş olabilir`)
    for (const brans of TUM) {
      const beklenen = brans === 'pediatri'
      assert.equal(asiOnamBransUygunMu(brans), beklenen, `${brans} için beklenen ${beklenen}`)
    }
  })

  it('çocuk-cerrahisi ve aile-hekimliği açıkça false (PEDIATRIK_BAGLAM ile karıştırılmasın)', () => {
    assert.equal(asiOnamBransUygunMu('cocuk-cerrahisi'), false)
    assert.equal(asiOnamBransUygunMu('aile-hekimligi'), false)
  })

  it('bilinmeyen/boş branş → false, asla "bilinmiyorsa pediatri" değil', () => {
    assert.equal(asiOnamBransUygunMu(null), false)
    assert.equal(asiOnamBransUygunMu(undefined), false)
    assert.equal(asiOnamBransUygunMu('bilinmeyen-brans-xyz' as SpecialtyKey), false)
  })
})
