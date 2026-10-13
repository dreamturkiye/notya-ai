/**
 * Structural tools added for empty specialty and clinic grids. Arithmetic only: counts, reminder days, and the
 * rules that keep a contradictory tick or a missing required tick from becoming a result.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kitAraci } from './katalog'
import type { AracGirdisi } from './tipler'

const bugun = '2026-06-15'
const calistir = (anahtar: string, g: AracGirdisi, gun = bugun) => kitAraci(anahtar)!.hesapla(g, { bugun: gun, p: {} })

describe('structural tools — records and product reminders', () => {
  it('graft count is the rounded product, with no band', () => {
    const s = calistir('greft-tahmini', { alan: 10, yogunluk: 40 })
    assert.equal(s.tamam, true)
    assert.deepEqual(s.sayilar, [{ anahtar: 'greft', deger: 400, ondalik: 0 }])
    assert.equal(s.bant, null)
    assert.equal(calistir('greft-tahmini', { alan: 10.4, yogunluk: 30 }).sayilar[0].deger, 312)
    assert.equal(calistir('greft-tahmini', { alan: 0, yogunluk: 40 }).tamam, false)
    assert.equal(calistir('greft-tahmini', { alan: 401, yogunluk: 40 }).tamam, false)
    assert.equal(calistir('greft-tahmini', { alan: 10, yogunluk: 121 }).tamam, false)
  })

  it('hair reminders are days 1, 3, 10 and 14, and a past day is marked', () => {
    const s = calistir('sac-bakim-vade', { baslangic: '2026-06-01' }, '2026-06-12')
    assert.deepEqual(s.tarihler.map((t) => t.tarih), ['2026-06-01', '2026-06-02', '2026-06-04', '2026-06-11', '2026-06-15'])
    assert.deepEqual(s.uyarilar, ['gecikti_gun_1', 'gecikti_gun_3', 'gecikti_gun_10'])
    assert.equal(calistir('estetik-cerrahi-vade', { baslangic: '2026-06-01' }, '2026-06-01').tarihler[4].tarih, '2026-07-13')
    assert.equal(calistir('akne-vade', { baslangic: '2026-01-01' }, '2026-01-01').tarihler.map((t) => t.tarih)[1], '2026-01-15')
  })

  it('laser interval is the gap the clinician chooses, inside 14 to 90 days', () => {
    const s = calistir('lazer-vade', { baslangic: '2026-06-01', aralik_gun: 21 }, '2026-06-22')
    assert.equal(s.tarihler.find((t) => t.anahtar === 'sonraki')!.tarih, '2026-06-22')
    assert.deepEqual(s.uyarilar, [])
    assert.deepEqual(calistir('lazer-vade', { baslangic: '2026-06-01', aralik_gun: 21 }, '2026-06-23').uyarilar, ['gecikti'])
    assert.equal(calistir('lazer-vade', { baslangic: '2026-06-01', aralik_gun: 13 }).tamam, false)
  })

  it('a danger sign warns, none does not, and both together is not a result', () => {
    assert.deepEqual(calistir('birinci-acil-bayrak', { gogus: true }).uyarilar, ['acil'])
    assert.deepEqual(calistir('inme-bayraklari', { yok: true }).uyarilar, [])
    assert.equal(calistir('inme-bayraklari', { yok: true, yuz: true }).tamam, false)
    assert.equal(calistir('psikiyatri-guvenlik', {}).tamam, false)
    assert.deepEqual(calistir('psikiyatri-guvenlik', { intihar: true }).uyarilar, ['guvenlik'])
  })

  it('days since the last menstrual period are counted, and an expected date is only echoed', () => {
    const s = calistir('gebelik-gun', { sat: '2026-05-18', tahmini: '2026-12-01' }, '2026-06-15')
    assert.deepEqual(s.sayilar.map((x) => [x.anahtar, x.deger]), [['gun', 28], ['hafta', 4]])
    assert.deepEqual(s.tarihler, [{ anahtar: 'sat', tarih: '2026-05-18' }, { anahtar: 'tahmini', tarih: '2026-12-01' }])
    assert.equal(calistir('gebelik-gun', { sat: '2025-01-01' }, '2026-06-15').tamam, false)
  })

  it('a session plan needs a modality, and a functioning summary needs the physician plan', () => {
    assert.equal(calistir('seans-plani', { seans: 10, haftalik: 2 }).tamam, false)
    const s = calistir('seans-plani', { egzersiz: true, seans: 10, haftalik: 2 })
    assert.equal(s.tamam, true)
    assert.deepEqual(s.sayilar.map((x) => x.deger), [1, 10, 2])
    assert.equal(calistir('icf-ozet', { vucut: true }).tamam, false)
    assert.equal(calistir('icf-ozet', { hekim_plani: true }).tamam, true)
    assert.equal(calistir('infuzyon-guvenlik', { lot: true }).tamam, false)
    assert.deepEqual(calistir('infuzyon-guvenlik', { hekim_plani: true, alerji: true }).uyarilar, ['alerji'])
  })

  it('a cardiology note needs a measurement or a class, and raises no threshold warning', () => {
    assert.equal(calistir('kardiyo-not', { tip: 'ht' }).tamam, false)
    const s = calistir('kardiyo-not', { tip: 'kky', nyha: 'iii', sistol: 150 })
    assert.equal(s.tamam, true)
    assert.deepEqual(s.uyarilar, [])
    assert.deepEqual(s.sayilar.map((x) => x.anahtar), ['sistol'])
  })

  it('intake stores the numbers entered, and the next session refuses a date before this one', () => {
    const s = calistir('makro-kaydi', { kcal: 1800, protein: 70 })
    assert.deepEqual(s.sayilar.map((x) => [x.anahtar, x.deger]), [['kcal', 1800], ['protein', 70]])
    assert.equal(s.bant, null)
    assert.equal(calistir('sonraki-seans', { tarih: '2026-06-15', sonraki: '2026-06-14' }).tamam, false)
    assert.equal(calistir('sonraki-seans', { tarih: '2026-06-15', sonraki: '2026-06-22' }).tamam, true)
    assert.equal(calistir('endoskopi-kaydi', { tip: 'ust', tarih: '2026-06-01' }).tamam, true)
    assert.equal(calistir('kronik-izlem-kaydi', { tip: 'dm' }).tarihler.length, 0)
  })
})
