/**
 * HASTA-PORTALI-GUNLUK — Doz Takvimi math: frequency text → times, slot states (due / missed / postponed), adherence
 * (only resolved slots count, no penalty before a window closes), two missed days, as-needed state, plan sync.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { DozKaydi, DozPlani } from './tipler'
import { bugunPlani, gerektikceDurumu, gunSlotlari, ikiGunKacirdiMi, kayitHaritasi, siklikCoz, slotDurumu, uyum } from './dozPlani'
import { planSenkronu } from './sunucu'
import { gunEkle, trGun, trSaatAni } from './zaman'

const SIMDI = '2026-11-24T10:00:00Z' // 13:00 Türkiye
const BUGUN = trGun(SIMDI)
const plan = (o: Partial<DozPlani> = {}): DozPlani => ({ id: 'p1', ilacId: 'i1', ad: 'Metformin', doz: '1000 mg', saatler: ['08:00', '20:00'], gerektikce: false, haftaGunu: null, kaynak: 'hekim', kritik: false, minAralikSaat: null, aktif: true, baslangic: null, bitis: null, ...o })
let n = 0
const kayit = (planId: string, gunOnce: number, saat: string, durum: DozKaydi['durum'], o: Partial<DozKaydi> = {}): DozKaydi => {
  const at = trSaatAni(gunEkle(BUGUN, -gunOnce), saat)
  return { id: `k${++n}`, planId, planlananAt: at, durum, kayitAt: at, erteleUntil: null, ...o }
}

describe('siklikCoz', () => {
  const t = (s: string) => siklikCoz(s)
  it('counts and words → times', () => {
    assert.deepEqual(t('1x1').saatler, ['09:00'])
    assert.deepEqual(t('2 x 1').saatler, ['08:00', '20:00'])
    assert.deepEqual(t('günde 3 kez').saatler, ['08:00', '14:00', '20:00'])
    assert.deepEqual(t('4*1').saatler, ['08:00', '12:00', '16:00', '20:00'])
    assert.deepEqual(t('sabah-akşam').saatler, ['08:00', '20:00'])
    assert.deepEqual(t('Akşam 1 tablet').saatler, ['20:00'])
    assert.deepEqual(t('yatmadan önce').saatler, ['22:00'])
    assert.deepEqual(t('12 saatte bir').saatler, ['08:00', '20:00'])
    assert.deepEqual(t('8 saatte 1').saatler, ['06:00', '14:00', '22:00'])
  })
  it('as needed / weekly / empty', () => {
    assert.deepEqual(t('gerektiğinde'), { saatler: [], gerektikce: true, haftalik: false })
    assert.equal(t('ateş olursa 1 ölçek').gerektikce, true)
    assert.equal(t('haftada 1').haftalik, true)
    assert.deepEqual(siklikCoz(null).saatler, ['09:00'])
  })
})

describe('slot durumu', () => {
  const p = plan()
  it('before -60 min: bekliyor; until +3 h: zamani; later unmarked: kacirildi', () => {
    const h = kayitHaritasi([])
    const s08 = trSaatAni(BUGUN, '08:00'), s20 = trSaatAni(BUGUN, '20:00')
    assert.equal(slotDurumu(p.id, s20, h, SIMDI), 'bekliyor')
    assert.equal(slotDurumu(p.id, s08, h, '2026-11-24T07:30:00Z'), 'zamani') // 10:30 TR
    assert.equal(slotDurumu(p.id, s08, h, SIMDI), 'kacirildi') // 13:00 TR > 08:00 + 3 h
  })
  it('postponed: ertelendi until the snooze + 3 h, then kacirildi; marks win', () => {
    const s08 = trSaatAni(BUGUN, '08:00')
    const e = kayit('p1', 0, '08:00', 'ertelendi', { erteleUntil: trSaatAni(BUGUN, '08:30') })
    assert.equal(slotDurumu('p1', s08, kayitHaritasi([e]), '2026-11-24T08:00:00Z'), 'ertelendi') // 11:00 TR
    assert.equal(slotDurumu('p1', s08, kayitHaritasi([e]), SIMDI), 'kacirildi')
    assert.equal(slotDurumu('p1', s08, kayitHaritasi([kayit('p1', 0, '08:00', 'alindi')]), SIMDI), 'alindi')
  })
  it('weekly plans and start / end dates', () => {
    const haftalik = plan({ saatler: ['09:00'], haftaGunu: 0 }) // Monday
    assert.equal(gunSlotlari(haftalik, '2026-11-23').length, 1) // Monday
    assert.equal(gunSlotlari(haftalik, BUGUN).length, 0) // Tuesday
    assert.equal(gunSlotlari(plan({ bitis: gunEkle(BUGUN, -1) }), BUGUN).length, 0)
    assert.equal(gunSlotlari(plan({ baslangic: gunEkle(BUGUN, 1) }), BUGUN).length, 0)
    assert.equal(gunSlotlari(plan({ aktif: false }), BUGUN).length, 0)
  })
})

describe('uyum (adherence)', () => {
  it('taken ÷ resolved; future and due-now slots do not count yet', () => {
    const p = plan()
    const k = [kayit('p1', 1, '08:00', 'alindi'), kayit('p1', 1, '20:00', 'atlandi'), kayit('p1', 0, '08:00', 'alindi')]
    // yesterday: 2 resolved (1 taken), today 08:00 taken, 20:00 future → 2/3
    assert.deepEqual(uyum([p], k, gunEkle(BUGUN, -1), BUGUN, SIMDI), { alinan: 2, beklenen: 3, yuzde: 67 })
  })
  it('a slot never marked counts as missed once its window closed', () => {
    assert.deepEqual(uyum([plan()], [], gunEkle(BUGUN, -1), gunEkle(BUGUN, -1), SIMDI), { alinan: 0, beklenen: 2, yuzde: 0 })
  })
  it('no plans → yuzde null (nothing to grade)', () => {
    assert.equal(uyum([], [], BUGUN, BUGUN, SIMDI).yuzde, null)
  })
  it('several plans add up; as-needed plans never count', () => {
    const k = [kayit('p1', 1, '08:00', 'alindi'), kayit('p1', 1, '20:00', 'alindi'), kayit('p2', 1, '08:00', 'alindi')]
    const r = uyum([plan(), plan({ id: 'p2', saatler: ['08:00'] }), plan({ id: 'p3', gerektikce: true, saatler: [] })], k, gunEkle(BUGUN, -1), gunEkle(BUGUN, -1), SIMDI)
    assert.deepEqual(r, { alinan: 3, beklenen: 3, yuzde: 100 })
  })
})

describe('iki gün kaçırma', () => {
  it('true only when both complete days had slots and none was taken', () => {
    const p = plan()
    assert.equal(ikiGunKacirdiMi(p, [], SIMDI), true)
    assert.equal(ikiGunKacirdiMi(p, [kayit('p1', 2, '20:00', 'alindi')], SIMDI), false)
    assert.equal(ikiGunKacirdiMi(p, [kayit('p1', 1, '08:00', 'atlandi'), kayit('p1', 2, '08:00', 'atlandi')], SIMDI), true)
    assert.equal(ikiGunKacirdiMi(plan({ baslangic: gunEkle(BUGUN, -1) }), [], SIMDI), false) // started yesterday: no 2 days yet
  })
})

describe('bugün planı ve gerektiğinde', () => {
  it('timeline sorted by time with states', () => {
    const l = bugunPlani([plan(), plan({ id: 'p2', ad: 'Ramipril', saatler: ['08:00'] })], [kayit('p2', 0, '08:00', 'alindi')], SIMDI)
    assert.deepEqual(l.map((x) => [x.saat, x.ad, x.durum]), [['08:00', 'Metformin', 'kacirildi'], ['08:00', 'Ramipril', 'alindi'], ['20:00', 'Metformin', 'bekliyor']])
  })
  it('as-needed: last dose, the doctor\'s minimum interval and the next suitable time (never a dose)', () => {
    const p = plan({ id: 'g', gerektikce: true, saatler: [], minAralikSaat: 6 })
    const k = { id: 'x', planId: 'g', planlananAt: '2026-11-24T08:00:00Z', durum: 'alindi' as const, kayitAt: '2026-11-24T08:00:00Z', erteleUntil: null }
    const [d] = gerektikceDurumu([p], [k], SIMDI)
    assert.equal(d.sonAt, '2026-11-24T08:00:00Z'); assert.equal(d.uygunAt, '2026-11-24T14:00:00.000Z'); assert.equal(d.bekle, true); assert.equal(d.bugunSayisi, 1)
  })
})

describe('plan senkronu (doctor medicines → dose plans)', () => {
  it('adds missing active medicines with suggested times, skips ended ones, switches off removed ones', () => {
    const mevcut = [plan({ id: 'eski', ilacId: 'kaldirildi' }), plan({ id: 'var', ilacId: 'i-var' }), plan({ id: 'kendi', ilacId: null, kaynak: 'hasta' })]
    const r = planSenkronu(mevcut, [
      { id: 'i-var', ilac_adi: 'A', kullanim_sikli: '1x1', aktif: true },
      { id: 'i-yeni', ilac_adi: 'Amlodipin', doz: '5 mg', kullanim_sikli: 'akşam', aktif: true },
      { id: 'i-bitti', ilac_adi: 'B', kullanim_sikli: '1x1', aktif: true, bitis_tarihi: '2020-01-01' },
    ], BUGUN)
    assert.deepEqual(r.ekle.map((x) => [x.ilac_id, x.saatler, x.doz]), [['i-yeni', ['20:00'], '5 mg · akşam']])
    assert.deepEqual(r.kapat, ['eski']) // the patient's own medicine is never touched
  })
})
