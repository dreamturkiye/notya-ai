/**
 * ASI-TAKVIM-TEK-01 (2026-11-20, Australia) — boundary tests of the overdue-immunisation cohort on the NIP age
 * milestones (kohort.ts, NIP schedule as read 2026-10-13: birth, 6 weeks, 4, 6, 12, 18 months, 4 years). The Türkiye
 * engine fix (2026-11-20) was about which dose is due at a month boundary; this is the equivalent check on Australia's
 * own schedule: the day before and the due day itself are not overdue, the day after is; months are calendar months
 * (31 Jan + 4 months = 31 May). A 29th–31st birth whose target month is shorter follows the country kit's documented
 * convention (lib/ulke/araclar/yardimci.ts ayEkle: the day runs into the next month, 31 Oct + 4 months = 3 Mar) —
 * Türkiye's engine clamps to the month end instead; the difference is logged in docs/OPEN-COMMITMENTS.md
 * (ASI-TAKVIM-TEK-01) for a sourced decision, not changed here. Nothing here sends anything to the Register.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { auAsiKohortSatiri } from './kohort'

const satir = (dogumIso: string, bugun: string, yapilan: string[] = []) => auAsiKohortSatiri({ patientId: 'p', ad: 'QA Baby', dogumIso, yapilan }, bugun)
const once = ['dogum', 'hafta6', 'ay4', 'ay6', 'ay12', 'ay18', 'yas4']

function sinir(dogum: string, madde: string, vade: string, gun: (d: string, n: number) => string) {
  it(`${madde}: due ${vade} — day before and the due day are not overdue, the day after is`, () => {
    const yapilan = once.slice(0, once.indexOf(madde))
    assert.ok(!satir(dogum, gun(vade, -1), yapilan).geciken.includes(madde))
    assert.ok(!satir(dogum, vade, yapilan).geciken.includes(madde))
    const sonra = satir(dogum, gun(vade, 1), yapilan)
    assert.ok(sonra.geciken.includes(madde))
    assert.equal(sonra.enErkenVade, vade)
  })
}
const gunEkle = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)

describe('AU NIP cohort — milestone boundaries (born 2026-10-21)', () => {
  const D = '2026-10-21'
  sinir(D, 'dogum', '2026-10-21', gunEkle)
  sinir(D, 'hafta6', '2026-12-02', gunEkle)
  sinir(D, 'ay4', '2027-02-21', gunEkle)
  sinir(D, 'ay6', '2027-04-21', gunEkle)
  it('a milestone already ticked is never overdue', () => {
    assert.deepEqual(satir(D, '2027-05-01', ['dogum', 'hafta6', 'ay4', 'ay6']).geciken, [])
  })
})

describe('AU NIP cohort — month-end births use calendar months', () => {
  sinir('2026-01-31', 'ay4', '2026-05-31', gunEkle)
  sinir('2026-01-31', 'ay6', '2026-07-31', gunEkle)
  // Documented kit convention (see header): 31 Oct + 4 months runs into March.
  sinir('2025-10-31', 'ay4', '2026-03-03', gunEkle)
})
