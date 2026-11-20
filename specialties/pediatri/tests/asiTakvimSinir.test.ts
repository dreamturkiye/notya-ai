/**
 * ASI-TAKVIM-TEK-01 (2026-11-20) — month-window boundaries of the shared vaccine engine (asiPlan.ts) and agreement of
 * the newborn calendar (bebek kartı tasks / vaccine rows) with it. Schedule data: lib/asi/ulusalAsiTakvimi.ts (T.C. SB,
 * 6'lı karma, 2025 GBP) and TND 2026 for < 2000 g — nothing is invented here.
 *
 * For each window dose: the day before its recommended date it is "yaklaşıyor" (not open), on the date it is open
 * ("bugün"), and it stays open afterwards; month arithmetic is calendar months (31 Jan + 1 ay = 28 Feb).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { asiPlani, onerilenDonem, takvimDozlari, type AsiKaydi, type SeriKod } from '../engines/asiPlan'
import { gunEkle } from '../engines/girdi'
import { generateCalendar, yenidoganAsiListesi } from '@/lib/clinical/yenidogan'

const ac = new Set(['bugun', 'zamani_geldi', 'gecikti'])
function durum(dogum: string, bugun: string, seri: SeriKod, no: number, ek: { kilo?: number; kayitlar?: AsiKaydi[] } = {}) {
  const kayitlar = ek.kayitlar ?? [{ id: 'h1', ad: 'Hepatit B', dozNo: 1, tarih: dogum, kaynak: 'kayit' as const }]
  const p = asiPlani({ dogumIso: dogum, bugunIso: bugun, donem: onerilenDonem(dogum, kayitlar), dogumKiloGr: ek.kilo ?? null, kayitlar })
  const d = p.seriler.find((s) => s.seri === seri)?.dozlar.find((x) => x.no === no)
  assert.ok(d, `${seri} ${no} exists`)
  return d!
}
function sinir(baslik: string, dogum: string, onerilen: string, seri: SeriKod, no: number, ek: { kilo?: number; kayitlar?: AsiKaydi[] } = {}) {
  it(`${baslik}: recommended ${onerilen}; day before → yaklaşıyor, on the day → open, +1 / +31 → open`, () => {
    assert.equal(durum(dogum, gunEkle(onerilen, -1), seri, no, ek).onerilen, onerilen)
    assert.equal(durum(dogum, gunEkle(onerilen, -1), seri, no, ek).durum, 'yaklasiyor')
    assert.ok(ac.has(durum(dogum, onerilen, seri, no, ek).durum))
    assert.ok(ac.has(durum(dogum, gunEkle(onerilen, 1), seri, no, ek).durum))
    const gec = durum(dogum, gunEkle(onerilen, 31), seri, no, ek)
    assert.ok(ac.has(gec.durum) && gec.gecikmeGun === 31)
  })
}

describe('Türkiye schedule — month windows (Elif, born 2026-10-21)', () => {
  const D = '2026-10-21'
  // Term baby: no separate 1. ay Hep B dose under the 2025 GBP.
  it('term: Hep B has only the birth dose in the 6\'lı karma period (no 1. ay dose to be "due")', () => {
    assert.equal(onerilenDonem(D, [{ id: 'h1', ad: 'Hepatit B', dozNo: 1, tarih: D, kaynak: 'kayit' }]), 'altili')
    assert.equal(takvimDozlari({ donem: 'altili' }).filter((d) => d.seri === 'hepb').length, 1)
    for (const bugun of ['2026-11-20', '2026-11-21', '2026-11-22']) {
      const p = asiPlani({ dogumIso: D, bugunIso: bugun, donem: 'altili', kayitlar: [{ id: 'h1', ad: 'Hepatit B', dozNo: 1, tarih: D, kaynak: 'kayit' }] })
      assert.equal(p.bugunYapilabilir.length, 0, bugun)
      assert.equal(p.sonrakiZiyaret?.tarih, '2026-12-21')
    }
  })
  sinir('< 2000 g: 1. ay tekli Hep B (TND 2026)', D, '2026-11-21', 'hepb', 2, { kilo: 1800 })
  sinir('2. ay: BCG', D, '2026-12-21', 'bcg', 1)
  sinir("2. ay: 6'lı karma 1", D, '2026-12-21', 'karma', 1)
  sinir('2. ay: KPA 1', D, '2026-12-21', 'kpa', 1)
  const ilkUc: AsiKaydi[] = [
    { id: 'h1', ad: 'Hepatit B', dozNo: 1, tarih: D, kaynak: 'kayit' },
    { id: 'b1', ad: 'BCG', dozNo: 1, tarih: '2026-12-21', kaynak: 'kayit' },
    { id: 'k1', ad: "6'lı Karma (DaBT-İPA-Hib-HepB)", dozNo: 1, tarih: '2026-12-21', kaynak: 'kayit' },
    { id: 'p1', ad: 'KPA', dozNo: 1, tarih: '2026-12-21', kaynak: 'kayit' },
  ]
  sinir("4. ay: 6'lı karma 2", D, '2027-02-21', 'karma', 2, { kayitlar: ilkUc })
  sinir('4. ay: KPA 2', D, '2027-02-21', 'kpa', 2, { kayitlar: ilkUc })
  const dortAy: AsiKaydi[] = [...ilkUc,
    { id: 'k2', ad: "6'lı Karma (DaBT-İPA-Hib-HepB)", dozNo: 2, tarih: '2027-02-21', kaynak: 'kayit' },
    { id: 'p2', ad: 'KPA', dozNo: 2, tarih: '2027-02-21', kaynak: 'kayit' }]
  sinir("6. ay: 6'lı karma 3", D, '2027-04-21', 'karma', 3, { kayitlar: dortAy })
  sinir('6. ay: OPA 1', D, '2027-04-21', 'opa', 1, { kayitlar: dortAy })
})

describe('month-end births use calendar months (31 Jan + 1 ay = 28 Feb)', () => {
  const D = '2026-01-31'
  sinir('< 2000 g tekli Hep B', D, '2026-02-28', 'hepb', 2, { kilo: 1500 })
  sinir("2. ay 6'lı karma 1", D, '2026-03-31', 'karma', 1)
})

describe('newborn calendar agrees with the shared engine (bebek kartı tasks and vaccine rows)', () => {
  const hepbKodlari = (dogumAt: string, kiloGram?: number) => yenidoganAsiListesi({ dogumAt, kiloGram }).filter((a) => a.kod.startsWith('HEPB')).map((a) => a.kod)

  it("6'lı karma baby (term): no Hep B 2. / 3. doz task — the engine has none either", () => {
    const tasks = generateCalendar({ dogumAt: '2026-10-21', pretermOrLbw: false, gkdRisk: false })
    assert.equal(tasks.some((t) => t.asi_kod === 'HEPB2' || t.asi_kod === 'HEPB3'), false)
    assert.deepEqual(hepbKodlari('2026-10-21'), ['HEPB1'])
    assert.equal(takvimDozlari({ donem: 'altili' }).filter((d) => d.seri === 'hepb').length, hepbKodlari('2026-10-21').length)
    assert.ok(tasks.filter((t) => t.asi_kod?.startsWith('DABTIPA_HIB')).every((t) => t.title.includes("6'lı karma")))
    // KPA 2-4-12 (one rapel), like ulusalAsiTakvimi
    assert.equal(tasks.filter((t) => t.asi_kod?.startsWith('KPA')).length, takvimDozlari({ donem: 'altili' }).filter((d) => d.seri === 'kpa').length)
  })
  it('< 2000 g: the 1. ay tekli Hep B task stays (day 30), as the engine plans it', () => {
    const tasks = generateCalendar({ dogumAt: '2026-10-21', kiloGram: 1800, pretermOrLbw: true, gkdRisk: false })
    const tekli = tasks.find((t) => t.asi_kod === 'HEPB2')
    assert.ok(tekli && /tekli/.test(tekli.title))
    assert.equal(tekli!.due_at, '2026-11-21', 'same date as the engine (calendar month)')
    assert.equal(takvimDozlari({ donem: 'altili', dogumKiloGr: 1800 }).filter((d) => d.seri === 'hepb').length, hepbKodlari('2026-10-21', 1800).length)
  })
  it('baby born before the 6\'lı karma switch keeps the previous 0-1-6 list unchanged', () => {
    assert.deepEqual(hepbKodlari('2025-01-10'), ['HEPB1', 'HEPB2', 'HEPB3'])
    assert.deepEqual(takvimDozlari({ donem: 'besli' }).filter((d) => d.seri === 'hepb').map((d) => d.onerilenGun), [0, 30, 180])
  })
})
