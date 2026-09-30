import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bugunTRT, gunKaydirTRT } from '../../core/eylemler/types'
import { takvimSorusuCoz, takvimSorusuMu, sesGurultusuMu, takvimTakipCoz, takvimRecantMi, sonTakvimCevabiMi, takvimSapmasiMi } from './takvimSorusu'

describe('takvimSorusu — clinic day lookup, not a chart question', () => {
  it('bugün / today / appointments today → today', () => {
    const bugun = bugunTRT()
    for (const m of [
      'Bugün randevu var mı?',
      'bugün randevularımız neler',
      'takvimde ne var',
      'do we have any appointments today',
      'Have we got appointments today',
    ]) {
      const c = takvimSorusuCoz(m)
      assert.ok(c, m)
      assert.equal(c!.tarih, bugun, m)
      assert.equal(c!.saat, null, m)
    }
  })

  it('yarın and a clock time', () => {
    const c = takvimSorusuCoz('Yarın 14:30 boş mu?')
    assert.ok(c)
    assert.equal(c!.tarih, gunKaydirTRT(1))
    assert.equal(c!.saat, '14:30')
  })

  it('kayıt niyeti ve hasta randevusu eşleşmez', () => {
    for (const m of [
      'kontrol randevusu yazıver',
      'randevu kartını hazırla',
      'Umutcan’ın randevusu',
      'nasılsınız',
      'aşıları tam mı',
    ]) {
      assert.equal(takvimSorusuMu(m), false, m)
    }
  })

  it('ASR "..." is noise; emin misin after a calendar line re-reads today', () => {
    assert.equal(sesGurultusuMu('...'), true)
    assert.equal(sesGurultusuMu('…'), true)
    assert.equal(sesGurultusuMu('eee'), true)
    assert.equal(sesGurultusuMu('Bugün randevu var mı?'), false)
    const son = '29 Eylül 2026 Salı takviminde randevu yok.'
    assert.equal(sonTakvimCevabiMi(son), true)
    assert.equal(sonTakvimCevabiMi('29 Eylül 2026 Salı takviminde 1 randevu: 10:00–10:20 Umutcan (muayene).'), true)
    assert.equal(sonTakvimCevabiMi('Bugün takviminizde randevu yok Hocam.'), true)
    assert.equal(takvimTakipCoz('...', son), null)
    const takip = takvimTakipCoz('Emin misin?', son)
    assert.ok(takip)
    assert.equal(takip!.tarih, '2026-09-29') // re-reads the day the answer named
    assert.equal(takvimTakipCoz('Emin misin?', 'Hocam, iyiyim.'), null)
    assert.equal(takvimRecantMi('Haklısınız Hocam; az önce randevu olmadığını ve tarihi kesinmiş gibi söyledim. Bunu doğrulamadan belirtmemeliydim. Randevu durumunu Ana Sayfa’daki bugünkü randevular bölümünden kontrol edelim.'), true)
    assert.equal(takvimRecantMi('Bugün takviminizde randevu yok Hocam.'), false)
  })
})

// NOTYA-TAKVIM-TZ-01 — doctor in US Eastern, Tue 29 Sep 19:35 local (23:35Z; already 30 Sep in TRT)
const AN = new Date('2026-09-29T23:35:00Z')
const NY = { saatDilimi: 'America/New_York', simdi: AN }

describe('takvimSorusu — doctor timezone and calendar follow-ups', () => {
  it('"bugün" is the doctor\'s today, not TRT\'s', () => {
    const c = takvimSorusuCoz('Bugün hiçbir randevumuz var mı?', NY)
    assert.ok(c)
    assert.equal(c!.tarih, '2026-09-29')
    assert.equal(takvimSorusuCoz('Bugün hiçbir randevumuz var mı?', { saatDilimi: 'Europe/Istanbul', simdi: AN })!.tarih, '2026-09-30')
    assert.equal(takvimSorusuCoz('Bugün randevu var mı?', { saatDilimi: 'garbage', simdi: AN })!.tarih, '2026-09-30')
  })

  it('bare date questions are calendar questions without the noun', () => {
    for (const [m, tarih] of [
      ['Yarın var mı?', '2026-09-30'],
      ['yarın doluyum mu', '2026-09-30'],
      ['Yarın kaç hastam var?', '2026-09-30'],
      ['yarın kimler geliyor', '2026-09-30'],
      ['Öbür gün boş muyum?', '2026-10-01'],
      ['Cuma kimler geliyor hocam?', '2026-10-02'],
      ['Haftaya pazartesi program ne?', '2026-10-05'],
    ] as const) {
      const c = takvimSorusuCoz(m, NY)
      assert.ok(c, m)
      assert.equal(c!.tarih, tarih, m)
    }
    // Not calendar: clinical "var mı" about a patient, or a bare date with no question
    assert.equal(takvimSorusuMu('Bugün ateşi var mı?'), false)
    assert.equal(takvimSorusuMu('yarın'), false)
    assert.equal(takvimSorusuMu('Bugün Umutcan geldi mi?'), false)
  })

  it('after a calendar answer, a date-only follow-up continues the lookup', () => {
    const son = '29 Eylül 2026 Salı takviminde randevu yok.'
    for (const [m, tarih] of [
      ['Peki yarın var mı hocam?', '2026-09-30'],
      ['peki öbür gün?', '2026-10-01'],
      ['Ya cuma?', '2026-10-02'],
      ['haftaya', '2026-10-05'],
      ['yarın', '2026-09-30'],
    ] as const) {
      const t = takvimTakipCoz(m, son, NY)
      assert.ok(t, m)
      assert.equal(t!.tarih, tarih, m)
    }
    assert.equal(takvimTakipCoz('Peki yarın var mı hocam?', 'Hocam, iyiyim.', NY), null)
    assert.equal(takvimTakipCoz('Peki Umutcan yarın geliyor mu?', son, NY), null)
    assert.equal(takvimTakipCoz('Peki aşıları tam mı?', son, NY), null)
    // "emin misin" re-reads the day the last answer named (not today)
    assert.equal(takvimTakipCoz('Emin misin?', '30 Eylül 2026 Çarşamba takviminde randevu yok.', NY)!.tarih, '2026-09-30')
  })

  it('model sending the doctor to the menu is a recant', () => {
    assert.equal(takvimRecantMi('Yarının randevu listesi bu konuşmada görünmüyor; menüden Randevular bölümüne bakabilirsiniz.'), true)
  })
})

describe('NOTYA-AYSE-100 T1 — week questions and past-tense calendar verbs', () => {
  it('"bu hafta / haftaya" without a weekday is a Monday–Sunday range in the doctor tz', () => {
    const a = takvimSorusuCoz('bu hafta kac randevum var', NY)
    assert.deepEqual(a?.aralik, { bas: '2026-09-28', bit: '2026-10-04' })
    const b = takvimSorusuCoz('haftaya nasil gorunuyor', NY)
    assert.deepEqual(b?.aralik, { bas: '2026-10-05', bit: '2026-10-11' })
    assert.equal(takvimSorusuCoz('haftaya cuma bos muyum', NY)?.aralik, undefined)
    const takip = takvimTakipCoz('haftaya', '29 Eylül 2026 Salı takviminde randevu yok.', NY)
    assert.deepEqual(takip?.aralik, { bas: '2026-10-05', bit: '2026-10-11' })
  })
  it('"dün kim geldi" / "haftaya nasıl görünüyor" are calendar lookups, not model turns', () => {
    assert.equal(takvimSorusuCoz('dün kim geldi', NY)?.tarih, '2026-09-28')
    assert.equal(takvimSorusuCoz('dun kimler gelmisti', NY)?.tarih, '2026-09-28')
    assert.ok(takvimSorusuCoz('haftaya nasıl görünüyor', NY))
    assert.equal(takvimSorusuCoz('dün gelen ateşli çocuk', NY), null)
  })
  it('the week answer is recognised as a calendar answer for follow-ups', () => {
    assert.ok(sonTakvimCevabiMi('Bu hafta (28 Eylül – 4 Ekim) haftası takviminde 1 randevu. Pazartesi 28 Eylül: 11:30–11:50 R (muayene).'))
  })
})

describe('NOTYA-AYSE-100 T2 — spoken slots and free-slot wording', () => {
  it('"yarın sabah boşluk var mı" and "bugün öğleden sonra 3\'te yer var mı" are calendar lookups', () => {
    const a = takvimSorusuCoz('yarin sabah bosluk var mi', NY)
    assert.equal(a?.tarih, '2026-09-30')
    const b = takvimSorusuCoz("Bugün öğleden sonra 3'te yer var mı?", NY)
    assert.equal(b?.tarih, '2026-09-29')
    assert.equal(b?.saat, '15:00')
    assert.equal(takvimSorusuCoz('yarın saat 10 gibi müsait miyim', NY)?.saat, '10:00')
    assert.equal(takvimSorusuCoz('yarın 14:30 boş mu', NY)?.saat, '14:30')
  })
})

describe('NOTYA-KONUSMA-BAGLAMI-06 — takvimSapmasiMi', () => {
  it('detects the model sending the doctor to the calendar', () => {
    for (const m of ['Bunu takvimden kontrol etmek gerekir Hocam.', 'Yarın için takvimi kontrol etmenizi öneririm.', 'Randevu listesine bakmanız gerekir.', 'Takvime bakmak lazım.', 'Randevu bilgilerine erişemiyorum Hocam.']) assert.equal(takvimSapmasiMi(m), true, m)
  })
  it('a real calendar answer is not a deflection', () => {
    for (const m of ['1 Ekim 2026 Perşembe takviminde randevu yok.', 'Yarın 2 randevu var Hocam: 10:00 A.Y., 11:30 R.D.', '']) assert.equal(takvimSapmasiMi(m), false, m)
  })
})
