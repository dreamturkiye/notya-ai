/**
 * AU-PEDIATRI-GOLD-01b — immunisation + review overdue cohort engines and tools.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { AU_ARAYUZ } from '../arayuz'
import {
  AU_ASI_KOHORT,
  AU_INCELEME_KOHORT,
  AU_KOHORT_ANAHTARLARI,
  auAsiKohortSatiri,
  auAsiKohortSatirlari,
  auIncelemeKohortSatiri,
  auIncelemeKohortSatirlari,
  auKohortAraclari,
} from './kohort'

const A = AU_ARAYUZ.araclar as UlkeAraclari

describe('AU overdue cohort (GOLD-01b)', () => {
  it('immunisation cohort flags overdue NIP age milestones; completed ones are skipped', () => {
    const bugun = '2026-10-28'
    // Born 2025-10-01 → by 2026-10-28 the child is ~13 months: dogum..ay12 due; ay18 and yas4 not yet.
    const s = auAsiKohortSatiri(
      { patientId: 'p1', ad: 'Alex', dogumIso: '2025-10-01', yapilan: ['dogum', 'hafta6'] },
      bugun,
    )
    assert.deepEqual(s.bayraklar, ['asi_gecikti'])
    assert.ok(s.geciken.includes('ay4'))
    assert.ok(s.geciken.includes('ay12'))
    assert.ok(!s.geciken.includes('dogum'))
    assert.ok(!s.geciken.includes('yas4'))
    assert.ok(s.enErkenVade)

    const guncel = auAsiKohortSatiri(
      { patientId: 'p2', ad: 'Bea', dogumIso: '2026-10-20', yapilan: ['dogum'] },
      bugun,
    )
    assert.deepEqual(guncel.bayraklar, [])
  })

  it('practice list keeps only overdue patients', () => {
    const liste = auAsiKohortSatirlari(
      [
        { patientId: 'a', ad: 'A', dogumIso: '2024-01-01', yapilan: [] },
        { patientId: 'b', ad: 'B', dogumIso: '2026-10-20', yapilan: ['dogum'] },
      ],
      '2026-10-28',
    )
    assert.equal(liste.length, 1)
    assert.equal(liste[0].patientId, 'a')
  })

  it('review cohort marks overdue when next review is before today', () => {
    const gecik = auIncelemeKohortSatiri(
      { patientId: 'p', ad: 'Pat', seansIso: '2026-09-01', aralikGun: 14 },
      '2026-10-28',
    )!
    assert.equal(gecik.gecikti, true)
    assert.equal(gecik.sonraki, '2026-09-15')
    const guncel = auIncelemeKohortSatiri(
      { patientId: 'p', ad: 'Pat', seansIso: '2026-10-20', aralikGun: 30 },
      '2026-10-28',
    )!
    assert.equal(guncel.gecikti, false)
    assert.equal(
      auIncelemeKohortSatirlari(
        [
          { patientId: '1', ad: 'A', seansIso: '2026-09-01', aralikGun: 7 },
          { patientId: '2', ad: 'B', seansIso: '2026-10-20', aralikGun: 30 },
        ],
        '2026-10-28',
      ).length,
      1,
    )
  })

  it('tool arithmetic: immunisation overdue warning; review overdue warning', () => {
    const asi = AU_ASI_KOHORT.hesapla(
      { dogumGunu: '2024-01-01' },
      { bugun: '2026-10-28', p: {} },
    )
    assert.equal(asi.tamam, true)
    assert.ok(asi.uyarilar.includes('asi_gecikti'))
    assert.ok((asi.sayilar.find((x) => x.anahtar === 'geciken')?.deger ?? 0) > 0)

    const gecik = AU_INCELEME_KOHORT.hesapla(
      { seans: '2026-09-01', aralik: 14 },
      { bugun: '2026-10-28', p: {} },
    )
    assert.deepEqual(gecik.uyarilar, ['inceleme_gecikti'])
    const guncel = AU_INCELEME_KOHORT.hesapla(
      { seans: '2026-10-20', aralik: 30 },
      { bugun: '2026-10-28', p: {} },
    )
    assert.deepEqual(guncel.uyarilar, ['guncel'])
  })

  it('pack: immunisation cohort is paeds+GP only; review cohort is every offered role', () => {
    assert.deepEqual(AU_KOHORT_ANAHTARLARI, ['au-immunisation-cohort', 'au-review-cohort'])
    const paketler = auKohortAraclari()
    const asi = paketler.find((p) => p.anahtar === 'au-immunisation-cohort')!
    assert.deepEqual(asi.roller, ['paediatrics', 'family-medicine'])
    const inceleme = paketler.find((p) => p.anahtar === 'au-review-cohort')!
    assert.ok(inceleme.roller && inceleme.roller.length >= 44)
    for (const k of AU_KOHORT_ANAHTARLARI) {
      assert.ok(A.araclar.some((p) => p.anahtar === k), k)
    }
  })
})
