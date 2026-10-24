import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { telefonCoz, type TelefonUlke } from './dogrula'

const gecerli = (u: TelefonUlke, ham: string, e164: string, s = {}) => { const r = telefonCoz(u, ham, s); assert.ok(r.tamam, `${u} ${ham} → ${JSON.stringify(r)}`); assert.equal(r.tamam && r.e164, e164, `${u} ${ham}`) }
const red = (u: TelefonUlke, ham: string, neden: string, s = {}) => { const r = telefonCoz(u, ham, s); assert.deepEqual(r.tamam ? 'ok' : r.neden, neden, `${u} ${ham}`) }

describe('telefonCoz: one validator for every country', () => {
  it('AU: mobile, landline, +61 forms, service numbers', () => {
    gecerli('au', '0491 570 006', '+61491570006'); gecerli('au', '+61 491 570 006', '+61491570006'); gecerli('au', '0061491570006', '+61491570006')
    gecerli('au', '(02) 9374 4000', '+61293744000'); gecerli('au', '03 9999 1234', '+61399991234'); gecerli('au', '+61 (0)7 3000 1234', '+61730001234')
    red('au', '0491 570 00', 'kisa'); red('au', '0491 570 0061', 'uzun'); red('au', '0491abc006', 'harf'); red('au', '+44 7700 900123', 'gecersiz')
    red('au', '0151 234 567', 'gecersiz'); red('au', '131 114', 'gecersiz'); red('au', '1300 655 506', 'gecersiz')
    const hz = { hizmetNumarasi: true }; assert.ok(telefonCoz('au', '13 11 14', hz).tamam); assert.ok(telefonCoz('au', '1300 655 506', hz).tamam); assert.ok(telefonCoz('au', '1800 123 456', hz).tamam)
  })
  it('US / CA: NANP', () => {
    for (const u of ['us', 'ca'] as const) {
      gecerli(u, '202-555-0123', '+12025550123'); gecerli(u, '(613) 555-0123', '+16135550123'); gecerli(u, '+1 613 555 0123', '+16135550123'); gecerli(u, '1-613-555-0123', '+16135550123')
      red(u, '202-555-012', 'kisa'); red(u, '202-555-01234', 'uzun'); red(u, '012-555-0123', 'gecersiz'); red(u, '202-155-0123', 'gecersiz'); red(u, '202-CALL-NOW', 'harf'); red(u, '+44 20 7946 0958', 'gecersiz')
    }
  })
  it('GB', () => {
    gecerli('gb', '07700 900123', '+447700900123'); gecerli('gb', '+44 7700 900123', '+447700900123'); gecerli('gb', '020 7946 0958', '+442079460958'); gecerli('gb', '+44 (0)20 7946 0958', '+442079460958')
    gecerli('gb', '01632 960123', '+441632960123')
    red('gb', '0770 0900', 'kisa'); red('gb', '07700 9001234', 'uzun'); red('gb', '07700 abc123', 'harf'); red('gb', '+61 491 570 006', 'gecersiz')
  })
  it('NZ', () => {
    gecerli('nz', '021 123 4567', '+64211234567'); gecerli('nz', '+64 21 123 4567', '+64211234567'); gecerli('nz', '09 123 4567', '+6491234567')
    red('nz', '021 123', 'kisa'); red('nz', '021 123 45678 9', 'uzun'); red('nz', '02x 123 4567', 'harf'); red('nz', '+61 491 570 006', 'gecersiz')
  })
  it('UZ', () => {
    gecerli('uz', '+998 90 123 45 67', '+998901234567'); gecerli('uz', '90 123 45 67', '+998901234567'); gecerli('uz', '8 90 123 45 67', '+998901234567')
    red('uz', '90 123 45', 'kisa'); red('uz', '90 123 45 678', 'uzun'); red('uz', '90 123 45 6a', 'harf'); red('uz', '+7 912 345 67 89', 'gecersiz')
  })
  it('TR', () => {
    gecerli('tr', '0532 123 45 67', '+905321234567'); gecerli('tr', '532 123 45 67', '+905321234567'); gecerli('tr', '+90 532 123 45 67', '+905321234567'); gecerli('tr', '0090 532 123 45 67', '+905321234567')
    red('tr', '0532 123 45', 'kisa'); red('tr', '0532 123 45 678', 'uzun'); red('tr', '0532 12x 45 67', 'harf'); red('tr', '+1 202 555 0123', 'gecersiz')
  })
  it('empty, and signs a number does not have', () => {
    red('au', '', 'bos'); red('au', '   ', 'bos'); red('au', '04915-70006+', 'harf'); red('au', '0491 570 006; DROP', 'harf')
  })
})
