import { test } from 'node:test'
import assert from 'node:assert/strict'
import { UZ_ASISTAN_ADLARI, uzAsistanAdi } from './asistanAdlari'

test('owner list: 30 doctor specialties, 5 clinic doctors, 5 clinic allied roles', () => {
  const say = (t: string) => UZ_ASISTAN_ADLARI.filter((a) => a.taraf === t).length
  assert.equal(UZ_ASISTAN_ADLARI.length, 40)
  assert.equal(say('doktor'), 30)
  assert.equal(say('klinik-hekim'), 5)
  assert.equal(say('klinik-muttefik'), 5)
})

test('keys, full names and short names are unique', () => {
  for (const alan of ['bransAnahtari', 'tamAd', 'kisaAd'] as const) {
    const degerler = UZ_ASISTAN_ADLARI.map((a) => a[alan])
    assert.equal(new Set(degerler).size, degerler.length, alan)
  }
})

test('every full name carries a title and its own short name; no Turkish letters anywhere', () => {
  for (const a of UZ_ASISTAN_ADLARI) {
    const parcalar = a.tamAd.split(' ')
    assert.equal(parcalar.length, 3, a.tamAd)
    assert.equal(parcalar[1], a.kisaAd, a.tamAd)
    assert.ok(a.taraf === 'klinik-muttefik' ? parcalar[0] !== 'Dr.' : parcalar[0] === 'Dr.', a.tamAd)
    assert.doesNotMatch(a.tamAd + a.kisaAd, /[\u00e7\u011f\u0131\u00f6\u015f\u00fc\u0130\u00c7\u011e\u00d6\u015e\u00dc]/, a.tamAd)
    assert.match(a.bransAnahtari, /^[a-z]+(-[a-z]+)*$/)
  }
})

test('lookup: known key answers, unknown key is null (no fallback to another specialty)', () => {
  assert.equal(uzAsistanAdi('pediatri')?.tamAd, 'Dr. Malika Nazarova')
  assert.equal(uzAsistanAdi('odyoloji')?.kisaAd, 'Rayhon')
  assert.equal(uzAsistanAdi('yok-boyle-brans'), null)
})
