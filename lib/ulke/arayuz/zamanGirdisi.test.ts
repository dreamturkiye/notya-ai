/**
 * NOTYA-ULKE-DENETIM-01b — A DAY AND A TIME OF DAY ARE TYPED THE COUNTRY'S WAY, whatever the browser. The reading
 * half of the kit's own date and time fields (components/ulke/girdi/), for every pack side by side.
 *
 * The fault this guards against, found by all six audits: a browser's own date field is drawn in the order of the
 * browser's language, so the same keystrokes gave 7 March in one browser and 3 July in another on the same build.
 * Here the order of the parts is the PACK'S pattern and nothing else: no function of this file reads a browser, a
 * locale of the platform, or a clock.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TUM_ULKELER } from '@/countries/tumu'
import type { UlkeKodu } from '../tipler'
import { gunYazDesenle, gunYazYilsiz } from '../uygulama/zaman'
import { BOS_SAAT, BOS_TARIH, GIRDI_GECERSIZ, girdiDegeri, gundenParcalar, saatOku, saatParcasiYaz, saattenParcalar, tarihDuzeni, tarihOku, tarihParcasiYaz, type GunYarisi, type TarihParcalari, type TarihParcasi } from './zamanGirdisi'

const ALTI: readonly UlkeKodu[] = ['us', 'gb', 'au', 'nz', 'ca', 'uz']
const desen = (kod: UlkeKodu) => TUM_ULKELER[kod].paket.bicim.tarihDeseni
const saatBicimi = (kod: UlkeKodu) => TUM_ULKELER[kod].paket.uygulama!.saatBicimi
/** What a person types into the three fields from left to right, in the order this pack draws them. */
const sirayla = (kod: UlkeKodu, yazilan: readonly [string, string, string]): TarihParcalari => {
  const p: Record<TarihParcasi, string> = { DD: '', MM: '', YYYY: '' }
  tarihDuzeni(desen(kod)).sira.forEach((k, i) => { p[k] = yazilan[i] })
  return p
}
const gun = (DD: string, MM: string, YYYY: string) => tarihOku({ DD, MM, YYYY })

describe('typing a day — the order of the parts is the pack\'s own', () => {
  it('each pack\'s pattern, its order and its mark: US month first, Canada year first, the others day first', () => {
    const BEKLENEN: Record<string, readonly [string, string, string]> = { us: ['MM/DD/YYYY', 'MM DD YYYY', '/'], gb: ['DD/MM/YYYY', 'DD MM YYYY', '/'], au: ['DD/MM/YYYY', 'DD MM YYYY', '/'], nz: ['DD/MM/YYYY', 'DD MM YYYY', '/'], ca: ['YYYY-MM-DD', 'YYYY MM DD', '-'], uz: ['DD.MM.YYYY', 'DD MM YYYY', '.'] }
    for (const kod of ALTI) {
      const d = tarihDuzeni(desen(kod))
      assert.deepEqual([desen(kod), d.sira.join(' '), d.ayrac], BEKLENEN[kod], kod)
    }
  })

  it('THE AUDITS\' CASE: the same keystrokes mean the day each country means by them, and one day is typed differently in each', () => {
    // 03 then 07 then 2019, typed into the first, second and third field
    assert.deepEqual(tarihOku(sirayla('us', ['03', '07', '2019'])), { durum: 'tamam', deger: '2019-03-07' }, 'United States: March 7')
    for (const kod of ['gb', 'au', 'nz', 'uz'] as const) assert.deepEqual(tarihOku(sirayla(kod, ['03', '07', '2019'])), { durum: 'tamam', deger: '2019-07-03' }, `${kod}: 3 July`)
    // Canada's first field is the year: the same keystrokes are not a day at all, and are refused
    assert.equal(tarihOku(sirayla('ca', ['03', '07', '2019'])).durum, 'gecersiz')
    assert.deepEqual(tarihOku(sirayla('ca', ['2019', '03', '07'])), { durum: 'tamam', deger: '2019-03-07' }, 'Canada: 2019-03-07')
    // and the same day, 7 March 2019, is what a person of each country types for it, and what the kit writes back
    for (const kod of ALTI) {
      const d = tarihDuzeni(desen(kod))
      const yazilan = d.sira.map((k) => ({ DD: '07', MM: '03', YYYY: '2019' })[k]) as [string, string, string]
      assert.deepEqual(tarihOku(sirayla(kod, yazilan)), { durum: 'tamam', deger: '2019-03-07' }, kod)
      assert.equal(yazilan.join(d.ayrac), gunYazDesenle('2019-03-07', desen(kod)), `${kod}: typed as it is written`)
    }
  })

  it('what is stored is the same ISO day whatever the order it was typed in', () => {
    for (const kod of ALTI) for (const iso of ['2019-03-07', '2026-10-10', '2000-02-29', '1999-12-31', '2026-01-01']) {
      const p = gundenParcalar(iso)
      assert.deepEqual(tarihOku(p), { durum: 'tamam', deger: iso }, `${kod} ${iso}`)
      assert.deepEqual(tarihDuzeni(desen(kod)).sira.map((k) => p[k]).join(tarihDuzeni(desen(kod)).ayrac), gunYazDesenle(iso, desen(kod)))
    }
  })
})

describe('typing a day — a real day of the calendar, or not a day', () => {
  it('29 February exists in a leap year and in no other', () => {
    for (const yil of ['2024', '2000', '2028', '1996']) assert.deepEqual(gun('29', '02', yil), { durum: 'tamam', deger: `${yil}-02-29` }, yil)
    for (const yil of ['2023', '2025', '2026', '1900', '2100']) assert.deepEqual(gun('29', '02', yil), { durum: 'gecersiz', deger: '' }, yil)
    assert.equal(gun('28', '02', '2023').durum, 'tamam')
  })

  it('impossible days are refused: 30 and 31 February, the 31st of a 30-day month, month 13, day 32, day or month 00, year 0000', () => {
    for (const [g, a, y] of [['30', '02', '2024'], ['31', '02', '2024'], ['31', '04', '2026'], ['31', '06', '2026'], ['31', '09', '2026'], ['31', '11', '2026'], ['01', '13', '2026'], ['32', '01', '2026'], ['00', '05', '2026'], ['05', '00', '2026'], ['01', '01', '0000']] as const) {
      assert.deepEqual(gun(g, a, y), { durum: 'gecersiz', deger: '' }, `${g}.${a}.${y}`)
    }
    for (const [g, a] of [['31', '01'], ['31', '03'], ['31', '05'], ['31', '07'], ['31', '08'], ['31', '10'], ['31', '12'], ['30', '04'], ['30', '06'], ['30', '09'], ['30', '11']] as const) assert.equal(gun(g, a, '2026').durum, 'tamam', `${g}.${a}`)
  })

  it('what can no longer become a day is said at once, before the rest is typed', () => {
    assert.equal(gun('', '13', '').durum, 'gecersiz'); assert.equal(gun('32', '', '').durum, 'gecersiz'); assert.equal(gun('00', '', '').durum, 'gecersiz'); assert.equal(gun('', '00', '').durum, 'gecersiz')
  })

  it('a half-typed date is not a day, and a two-digit year is never completed by a guess', () => {
    assert.deepEqual(gun('', '', ''), { durum: 'bos', deger: '' })
    for (const p of [['07', '', ''], ['07', '03', ''], ['', '03', '2019'], ['07', '', '2019'], ['07', '03', '19'], ['07', '03', '201'], ['0', '03', '2019'], ['07', '0', '2019']] as const) assert.deepEqual(gun(p[0], p[1], p[2]), { durum: 'yarim', deger: '' }, p.join('.'))
    // one digit is a day or a month; the year is always four
    assert.deepEqual(gun('7', '3', '2019'), { durum: 'tamam', deger: '2019-03-07' })
  })

  it('a part holds digits only, cut to its length; a stored value that is not a real day shows as empty parts', () => {
    assert.deepEqual([tarihParcasiYaz('DD', '7a/'), tarihParcasiYaz('DD', '123'), tarihParcasiYaz('MM', ' 0 3 '), tarihParcasiYaz('YYYY', '20199'), tarihParcasiYaz('YYYY', '-2019')], ['7', '12', '03', '2019', '2019'])
    assert.deepEqual(gundenParcalar('2019-03-07'), { DD: '07', MM: '03', YYYY: '2019' })
    for (const x of ['', GIRDI_GECERSIZ, '2019-02-30', '07/03/2019', '2019-3-7', null, undefined, 20190307]) assert.deepEqual(gundenParcalar(x), BOS_TARIH)
    assert.equal(gun('a7', '03', '2019').durum, 'gecersiz')
  })

  it('what a field hands its screen: nothing, the day, or "not a day" — never a half-read value', () => {
    assert.equal(girdiDegeri(gun('', '', '')), '')
    assert.equal(girdiDegeri(gun('07', '03', '2019')), '2019-03-07')
    for (const p of [['07', '03', ''], ['31', '02', '2024'], ['07', '03', '19']] as const) assert.equal(girdiDegeri(gun(p[0], p[1], p[2])), GIRDI_GECERSIZ)
    assert.ok(!/^\d{4}-\d{2}-\d{2}$/.test(GIRDI_GECERSIZ), 'the mark can never pass for a day')
  })

  it('a pattern that is not a date pattern is refused, not repaired', () => {
    for (const d of ['DD.MM', 'DD/DD/YYYY', 'DDMMYYYY', '', 'YYYY']) assert.throws(() => tarihDuzeni(d), /not a date pattern/, d)
  })
})

describe('typing a time of day — the pack\'s own clock', () => {
  it('each pack\'s clock: 12-hour in the United States, Canada, Australia and New Zealand; 24-hour in the United Kingdom and Uzbekistan', () => {
    assert.deepEqual(ALTI.map((kod) => `${kod}:${saatBicimi(kod)}`), ['us:12', 'gb:24', 'au:12', 'nz:12', 'ca:12', 'uz:24'])
  })

  const oniki = (saat: string, dakika: string, yari: GunYarisi) => saatOku({ saat, dakika, yari }, 12)
  const yirmiDort = (saat: string, dakika: string) => saatOku({ saat, dakika, yari: '' }, 24)

  it('12-HOUR: 12:00 AM is midnight and 12:00 PM is noon', () => {
    assert.deepEqual(oniki('12', '00', 'oo'), { durum: 'tamam', deger: '00:00' }, '12:00 AM')
    assert.deepEqual(oniki('12', '00', 'os'), { durum: 'tamam', deger: '12:00' }, '12:00 PM')
    assert.deepEqual(oniki('12', '30', 'oo'), { durum: 'tamam', deger: '00:30' }, '12:30 AM')
    assert.deepEqual(oniki('12', '59', 'os'), { durum: 'tamam', deger: '12:59' }, '12:59 PM')
    assert.deepEqual(oniki('1', '00', 'oo'), { durum: 'tamam', deger: '01:00' })
    assert.deepEqual(oniki('11', '59', 'oo'), { durum: 'tamam', deger: '11:59' }, '11:59 AM')
    assert.deepEqual(oniki('1', '05', 'os'), { durum: 'tamam', deger: '13:05' })
    assert.deepEqual(oniki('2', '30', 'os'), { durum: 'tamam', deger: '14:30' })
    assert.deepEqual(oniki('11', '59', 'os'), { durum: 'tamam', deger: '23:59' }, '11:59 PM')
    assert.deepEqual(oniki('09', '00', 'oo'), { durum: 'tamam', deger: '09:00' })
  })

  it('12-HOUR: the half of the day is an explicit choice — without it there is no time; there is no hour 0 and no hour 13', () => {
    assert.deepEqual(oniki('2', '30', ''), { durum: 'yarim', deger: '' })
    assert.deepEqual(oniki('12', '00', ''), { durum: 'yarim', deger: '' })
    assert.deepEqual(oniki('', '', ''), { durum: 'bos', deger: '' })
    assert.equal(oniki('', '', 'os').durum, 'yarim', 'a half of the day alone is not a time')
    for (const s of ['13', '14', '23', '24', '00']) assert.equal(oniki(s, '00', 'os').durum, 'gecersiz', s)
    assert.equal(oniki('0', '00', 'oo').durum, 'yarim', 'a single 0 may still become 01 … 09')
  })

  it('24-HOUR: 00:00 to 23:59, no hour 24, and no half of the day is asked or read', () => {
    assert.deepEqual(yirmiDort('00', '00'), { durum: 'tamam', deger: '00:00' })
    assert.deepEqual(yirmiDort('12', '00'), { durum: 'tamam', deger: '12:00' })
    assert.deepEqual(yirmiDort('23', '59'), { durum: 'tamam', deger: '23:59' })
    assert.deepEqual(yirmiDort('9', '05'), { durum: 'tamam', deger: '09:05' })
    assert.deepEqual(yirmiDort('14', '30'), { durum: 'tamam', deger: '14:30' })
    for (const s of ['24', '25', '99']) assert.equal(yirmiDort(s, '00').durum, 'gecersiz', s)
    assert.deepEqual(saatOku({ saat: '14', dakika: '30', yari: 'oo' }, 24), { durum: 'tamam', deger: '14:30' }, 'a half of the day is not read on a 24-hour clock')
    assert.deepEqual(saatOku({ saat: '', dakika: '', yari: 'os' }, 24), { durum: 'bos', deger: '' })
  })

  it('both clocks: the minute is two digits from 00 to 59; anything half-typed is not a time', () => {
    for (const b of [12, 24] as const) {
      const oku = (saat: string, dakika: string) => saatOku({ saat, dakika, yari: 'os' }, b)
      for (const d of ['60', '61', '99']) assert.equal(oku('10', d).durum, 'gecersiz', `${b}: minute ${d}`)
      assert.equal(oku('10', '5').durum, 'yarim', `${b}: one digit of a minute is not a minute`)
      assert.equal(oku('10', '').durum, 'yarim'); assert.equal(oku('', '30').durum, 'yarim')
      assert.equal(oku('1a', '30').durum, 'gecersiz')
      assert.equal(girdiDegeri(oku('10', '5')), GIRDI_GECERSIZ); assert.equal(girdiDegeri(oku('10', '60')), GIRDI_GECERSIZ)
    }
    assert.deepEqual([saatParcasiYaz('9x'), saatParcasiYaz('123'), saatParcasiYaz(' 0 5')], ['9', '12', '05'])
  })

  it('every minute of the day survives both clocks: what is stored is shown, typed back and stored again unchanged', () => {
    for (const b of [12, 24] as const) {
      for (let dk = 0; dk < 1440; dk++) {
        const saat = `${String(Math.floor(dk / 60)).padStart(2, '0')}:${String(dk % 60).padStart(2, '0')}`
        assert.deepEqual(saatOku(saattenParcalar(saat, b), b), { durum: 'tamam', deger: saat }, `${b}: ${saat}`)
      }
    }
    assert.deepEqual(saattenParcalar('00:00', 12), { saat: '12', dakika: '00', yari: 'oo' })
    assert.deepEqual(saattenParcalar('12:00', 12), { saat: '12', dakika: '00', yari: 'os' })
    assert.deepEqual(saattenParcalar('14:30', 12), { saat: '2', dakika: '30', yari: 'os' })
    assert.deepEqual(saattenParcalar('14:30', 24), { saat: '14', dakika: '30', yari: '' })
    for (const x of ['', GIRDI_GECERSIZ, '24:00', '12:60', '2:30 PM', null, 1430]) assert.deepEqual(saattenParcalar(x, 12), BOS_SAAT)
  })
})

describe('a day without its year — never "the first five characters"', () => {
  it('Canada\'s appointment buttons: the short form of a day holds the day and the month in every pack, and the year in none', () => {
    const BEKLENEN: Record<string, string> = { us: '10/09', gb: '09/10', au: '09/10', nz: '09/10', ca: '10-09', uz: '09.10' }
    for (const kod of ALTI) assert.equal(gunYazYilsiz('2026-10-09', desen(kod)), BEKLENEN[kod], kod)
    // what the kit did before: the first five characters of the written date — in a year-first country the year and no day
    assert.equal(gunYazDesenle('2026-10-10', desen('ca')).slice(0, 5), '2026-')
    assert.equal(gunYazYilsiz('2026-02-30', desen('ca')), '')
  })
})
