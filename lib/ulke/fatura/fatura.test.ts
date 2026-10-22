import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { faturaToplami, kalemleriTemizle, kurusYaz, tutarKurusa } from './hesap'
import { canliAnahtarMi, demoSaglayici, uzlasmaCsv, uzlastir } from './odemeSaglayici'
import { kalanGun, talepSonTarihi } from '../gizlilik/hesap'

describe('invoice arithmetic (integer cents; the rate is the pack\'s)', () => {
  it('a tax-free line adds no tax; a taxable line adds the rate once on the subtotal', () => {
    assert.deepEqual(faturaToplami([{ tutarKurus: 10000, muaf: true }], 10), { altToplamKurus: 10000, vergiKurus: 0, toplamKurus: 10000 })
    assert.deepEqual(faturaToplami([{ tutarKurus: 10000, muaf: false }], 10), { altToplamKurus: 10000, vergiKurus: 1000, toplamKurus: 11000 })
    assert.deepEqual(faturaToplami([{ tutarKurus: 5000, muaf: true }, { tutarKurus: 2500, muaf: false }], 10), { altToplamKurus: 7500, vergiKurus: 250, toplamKurus: 7750 })
  })
  it('rounds half up once on the taxable subtotal', () => {
    assert.equal(faturaToplami([{ tutarKurus: 5, muaf: false }], 10).vergiKurus, 1)
    assert.equal(faturaToplami([{ tutarKurus: 4, muaf: false }], 10).vergiKurus, 0)
    assert.equal(faturaToplami([{ tutarKurus: 333, muaf: false }, { tutarKurus: 333, muaf: false }], 10).vergiKurus, 67)
  })
  it('parses amounts strictly', () => {
    assert.equal(tutarKurusa('12.50'), 1250)
    assert.equal(tutarKurusa('1,200'), 120000)
    assert.equal(tutarKurusa('12.345'), null)
    assert.equal(tutarKurusa('-5'), null)
    assert.equal(tutarKurusa('0'), null)
    assert.equal(tutarKurusa('abc'), null)
    assert.equal(kurusYaz(1250), 'AUD 12.50')
  })
  it('lines from a browser are validated; nothing invented', () => {
    assert.equal(kalemleriTemizle([]), null)
    assert.equal(kalemleriTemizle([{ aciklama: '', kalemNo: '', tutarKurus: 100, muaf: true }]), null)
    assert.equal(kalemleriTemizle([{ aciklama: 'x', kalemNo: '', tutarKurus: 1.5, muaf: true }]), null)
    assert.equal(kalemleriTemizle([{ aciklama: 'x', kalemNo: '', tutarKurus: 100 }]), null)
    assert.deepEqual(kalemleriTemizle([{ aciklama: ' Consult ', kalemNo: ' 23 ', tutarKurus: 100, muaf: false }]), [{ aciklama: 'Consult', kalemNo: '23', tutarKurus: 100, muaf: false }])
  })
})

describe('bring-your-own payment path on the demo adapter (no network, no charge)', () => {
  it('pays, refunds in part and in full, and refuses nonsense', async () => {
    const s = demoSaglayici()
    assert.equal(s.gercek, false)
    const o = await s.ode({ faturaId: '11111111-2222-3333-4444-555555555555', tutarKurus: 5000, paraKodu: 'AUD' })
    assert.equal(o.tamam, true)
    assert.match(o.ref, /^demo_pay_/)
    assert.equal((await s.ode({ faturaId: 'x', tutarKurus: 0, paraKodu: 'AUD' })).tamam, false)
    assert.equal((await s.iade(o.ref, 1000)).iadeKurus, 1000)
    assert.equal((await s.iade('pi_real_looking', 1000)).tamam, false)
  })
  it('reconciliation: match, mismatch, missing at provider, unpaid; CSV neutralises formulas', async () => {
    const fat = [
      { id: 'a', no: 1, toplamKurus: 1000, iadeKurus: 0, durum: 'odendi', ref: 'demo_pay_a' },
      { id: 'b', no: 2, toplamKurus: 2000, iadeKurus: 500, durum: 'odendi', ref: 'demo_pay_b' },
      { id: 'c', no: 3, toplamKurus: 3000, iadeKurus: 0, durum: 'odendi', ref: 'demo_pay_c' },
      { id: 'd', no: 4, toplamKurus: 4000, iadeKurus: 0, durum: 'taslak', ref: null },
    ]
    const s = demoSaglayici(new Map([['demo_pay_a', { tutarKurus: 1000, iadeKurus: 0 }], ['demo_pay_b', { tutarKurus: 2000, iadeKurus: 0 }]]))
    const u = uzlastir(fat, await s.sorgula(['demo_pay_a', 'demo_pay_b', 'demo_pay_c']))
    assert.deepEqual(u.map((x) => x.sonuc), ['eslesti', 'uyusmadi', 'saglayicida_yok', 'odenmedi'])
    const csv = uzlasmaCsv([{ ...u[0], faturaDurum: '=HYPERLINK("x")' }])
    assert.match(csv, /'=HYPERLINK/)
    assert.equal(csv.split('\n')[0].split(',').length, 9)
  })
  it('live keys are recognised (live mode is off)', () => {
    assert.equal(canliAnahtarMi('sk_live_abcdefgh'), true)
    assert.equal(canliAnahtarMi('rk_live_abcdefgh'), true)
    assert.equal(canliAnahtarMi('sk_test_abcdefgh'), false)
  })
})

describe('access/correction timer (30 days after receipt, in the account\'s time zone)', () => {
  it('counts calendar days in the given zone', () => {
    // 2026-10-22 14:30 UTC is 01:30 on the 23rd in Sydney (UTC+11) and 22:30 on the 22nd in Perth (UTC+8).
    const an = Date.UTC(2026, 9, 22, 14, 30)
    assert.equal(talepSonTarihi(an, 'Australia/Sydney'), '2026-11-22')
    assert.equal(talepSonTarihi(an, 'Australia/Perth'), '2026-11-21')
  })
  it('days left, negative when overdue', () => {
    assert.equal(kalanGun('2026-11-22', '2026-10-23'), 30)
    assert.equal(kalanGun('2026-11-22', '2026-11-22'), 0)
    assert.equal(kalanGun('2026-11-22', '2026-11-25'), -3)
  })
})
