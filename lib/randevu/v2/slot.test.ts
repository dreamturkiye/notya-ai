import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bosSlotlar, gunlereAyir, slotUygunMu, type SlotGirdisi } from './slot'
import { istanbulAn, istanbulYerelUtc, istanbulOfsetDk, saatDakika } from './zaman'

const GUN = (acik: boolean) => ({ acik, baslangic: '09:00', bitis: '12:00' })
const HAFTA = { '0': GUN(false), '1': GUN(true), '2': GUN(true), '3': GUN(true), '4': GUN(true), '5': GUN(true), '6': GUN(false) }

// Monday 2026-10-05, 06:00 Istanbul = 03:00Z.
const PZT = '2026-10-05'
const simdi = Date.parse('2026-10-05T03:00:00Z')
const iso = (gun: string, hhmm: string) => new Date(istanbulYerelUtc(gun, saatDakika(hhmm)!)).toISOString()

function girdi(p: Partial<SlotGirdisi> = {}): SlotGirdisi {
  return {
    calismaSaatleri: HAFTA, adimDk: 30, sureDk: 30, tamponDk: 0, minBildirimDk: 0, maxIleriGun: 1,
    simdi, istisnalar: [], mesgul: [], resmiTatiller: [], gunler: [PZT], ...p,
  }
}
const saatler = (g: SlotGirdisi) => bosSlotlar(g).map((s) => s.saat)

describe('zaman — Europe/Istanbul wall clock, UTC storage', () => {
  it('09:00 Istanbul is 06:00Z (UTC+3)', () => {
    assert.equal(iso(PZT, '09:00'), '2026-10-05T06:00:00.000Z')
    assert.equal(istanbulOfsetDk(simdi), 180)
  })
  it('istanbulAn reads the local day, minute and weekday', () => {
    const a = istanbulAn('2026-10-04T22:30:00Z') // 01:30 on Monday in Istanbul
    assert.deepEqual(a, { gun: '2026-10-05', dakika: 90, haftaGunu: 1 })
  })
})

describe('slot motoru — çalışma saatleri − istisnalar − randevular − dış meşgul − tampon', () => {
  it('working hours on the grid; a slot must end by closing time', () => {
    assert.deepEqual(saatler(girdi()), ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'])
    assert.deepEqual(saatler(girdi({ sureDk: 45 })), ['09:00', '09:30', '10:00', '10:30', '11:00'])
  })
  it('closed weekday → nothing', () => {
    assert.deepEqual(saatler(girdi({ gunler: ['2026-10-04'] })), []) // Sunday
  })
  it('active appointments (pending and confirmed alike) block their window', () => {
    const mesgul = [{ bas: Date.parse(iso(PZT, '10:00')), son: Date.parse(iso(PZT, '10:30')) }]
    assert.deepEqual(saatler(girdi({ mesgul })), ['09:00', '09:30', '10:30', '11:00', '11:30'])
  })
  it('buffer is applied on both sides of a busy block', () => {
    const mesgul = [{ bas: Date.parse(iso(PZT, '10:00')), son: Date.parse(iso(PZT, '10:30')) }]
    assert.deepEqual(saatler(girdi({ mesgul, tamponDk: 15 })), ['09:00', '11:00', '11:30'])
  })
  it('izin range removes the covered slots (no buffer around exceptions)', () => {
    const istisnalar = [{ bas: Date.parse(iso(PZT, '09:00')), son: Date.parse(iso(PZT, '10:30')) }]
    assert.deepEqual(saatler(girdi({ istisnalar, tamponDk: 15 })), ['10:30', '11:00', '11:30'])
  })
  it('external busy blocks are just more busy time', () => {
    const mesgul = [{ bas: Date.parse(iso(PZT, '11:15')), son: Date.parse(iso(PZT, '11:20')) }]
    assert.deepEqual(saatler(girdi({ mesgul })), ['09:00', '09:30', '10:00', '10:30', '11:30'])
  })
  it('official holiday closes the day; an arife closes from 13:00', () => {
    assert.deepEqual(saatler(girdi({ resmiTatiller: [{ tarih: PZT }] })), [])
    const uzun = { ...HAFTA, '1': { acik: true, baslangic: '12:00', bitis: '15:00' } }
    assert.deepEqual(saatler(girdi({ calismaSaatleri: uzun, resmiTatiller: [{ tarih: PZT, yarim: true }] })), ['12:00', '12:30'])
  })
  it('minimum notice hides slots too close to now', () => {
    const simdi10 = Date.parse(iso(PZT, '09:40'))
    assert.deepEqual(saatler(girdi({ simdi: simdi10, minBildirimDk: 60 })), ['11:00', '11:30'])
  })
  it('max days ahead bounds the window', () => {
    const g = girdi({ gunler: undefined, maxIleriGun: 2 })
    assert.deepEqual(Array.from(new Set(bosSlotlar(g).map((s) => s.gun))), ['2026-10-05', '2026-10-06', '2026-10-07'].filter((d) => Date.parse(iso(d, '09:00')) <= simdi + 2 * 86400e3))
  })
  it('output carries times only — never who or why', () => {
    const s = bosSlotlar(girdi())[0]
    assert.deepEqual(Object.keys(s).sort(), ['bas', 'gun', 'saat', 'son'])
  })
  it('slotUygunMu accepts exactly a free grid start, rejects off-grid and taken', () => {
    assert.ok(slotUygunMu(girdi({ gunler: undefined }), iso(PZT, '09:30')))
    assert.equal(slotUygunMu(girdi({ gunler: undefined }), iso(PZT, '09:10')), null)
    const mesgul = [{ bas: Date.parse(iso(PZT, '09:30')), son: Date.parse(iso(PZT, '10:00')) }]
    assert.equal(slotUygunMu(girdi({ gunler: undefined, mesgul }), iso(PZT, '09:30')), null)
    assert.equal(slotUygunMu(girdi(), 'not-a-date'), null)
  })
  it('gunlereAyir groups in order', () => {
    const g = gunlereAyir(bosSlotlar(girdi({ gunler: ['2026-10-05', '2026-10-06'], maxIleriGun: 2 })))
    assert.deepEqual(g.map((x) => x.gun), ['2026-10-05', '2026-10-06'])
  })
  it('malformed hours are skipped, not thrown', () => {
    const bozuk = { ...HAFTA, '1': { acik: true, baslangic: 'xx', bitis: '12:00' } }
    assert.deepEqual(saatler(girdi({ calismaSaatleri: bozuk })), [])
  })
})
