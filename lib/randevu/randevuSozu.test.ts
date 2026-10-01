/**
 * NOTYA-AYSE-GERI-03 — spoken appointment vocabulary (intent, day, time, the person named). Pure.
 * Ported with the parsers from the unmerged branch fix/ayse-randevu-capability (db856260).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { anilanKisi, randevuNiyetiBul, randevuSaatiBul, randevuTarihiBul, soylenenAd, soylenenTarih } from './randevuSozu'
import { yerelAnI } from './tarihCozumle'

describe('randevu niyeti — eylem fiili şart; takvim sorusu niyet değildir', () => {
  it('oluştur / taşı / iptal', () => {
    const beklenen: [string, ReturnType<typeof randevuNiyetiBul>][] = [
      ['Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?', 'olustur'],
      ['Bir randevu yapmak istiyorum bir hasta icin yardimci olur musun?', 'olustur'],
      ['Umutcan Türkoğlu için yarın saat 14:30 randevu oluştur', 'olustur'],
      ['Umutcan’a cuma günü randevu verelim', 'olustur'],
      ['Yarın 10’a randevu yazar mısın', 'olustur'],
      ['Umutcan için randevu alabilir miyiz', 'olustur'],
      ['Umutcan Türkoğlu randevusunu cuma 15:00’e al', 'tasi'],
      ['Umutcan’ın randevusunu erteleyelim', 'tasi'],
      ['Randevunun saatini değiştir', 'tasi'],
      ['Umutcan Türkoğlu’nun randevusunu iptal et', 'iptal'],
      ['Yarınki randevuyu iptal edelim', 'iptal'],
      ['Umutcan’ın randevusunu sil', 'iptal'],
    ]
    for (const [cumle, niyet] of beklenen) assert.equal(randevuNiyetiBul(cumle), niyet, cumle)
  })
  it('takvim sorusu, geçmiş zaman ve olumsuz buyruk niyet değildir', () => {
    for (const cumle of [
      'Yarın randevum var mı?', 'Bugün kaç randevu var', 'Randevuları listele', 'Bu hafta randevularım neler',
      'Umutcan’ın randevusu ne zaman', 'Dün kimler randevu aldı', 'İptal edilen randevular hangileri',
      'Randevuyu iptal etme', 'Randevu bilgisi ver', 'Yarın saat 15:00 boş mu', 'Bugün hava nasıl?',
      // the verb acts on something else, or on many appointments at once
      'Randevu ekranını aç', 'Umutcan’ın randevusuna not ekle', 'Randevu hatırlatma mesajı yaz', 'Yarınki randevuları iptal et',
      // "randevu" is only the setting of another sentence, or a question about someone else / the past
      'Hastalarım online randevu alabiliyor mu?', 'Randevu takvimini aç', 'Randevusu olan hastaya reçete yaz',
      'Randevusu yarın olan Ali Yılmaz için ilaç yaz', 'Yarınki randevu için hazırlık gerek mi?', 'Ali Yılmaz randevu alacak mıydı?',
      'Randevudan önce kan alır mıyız', 'Randevu saatlerini 20 dakika yap', 'Ali Yılmaz randevusuna geldi mi, tahlilini aç',
    ]) assert.equal(randevuNiyetiBul(cumle), null, cumle)
  })
})

describe('gün ve saat — doktorun saat diliminde, konuşulduğu gibi', () => {
  it('saat: rakam, söz, ek, buçuk; 1–7 öğleden sonradır', () => {
    const beklenen: [string, boolean, string | null][] = [
      ['yarın saat 14:30', false, '14:30'], ['14.30 olsun', false, '14:30'], ['saat 3’te', false, '15:00'], ['sabah saat 9’da', false, '09:00'],
      ['randevusunu 15:00’e al', false, '15:00'], ['saat üç buçukta', false, '15:30'], ['cuma günü üçe alalım', false, '15:00'], ['saat 10', false, '10:00'],
      ['akşam 8’de', false, '20:00'], ['saat 14 30', false, '14:30'], ['on bire', false, '11:00'], ['üç', true, '15:00'], ['15', true, '15:00'],
      ['saat on dörtte', false, '14:00'], ['on beş buçukta', false, '15:30'], ['saat on', false, '10:00'], ['on altı', true, '16:00'],
      ['saat on dört otuzda', false, '14:30'], ['saat dörde', false, '16:00'], ['gece 11’de', false, '23:00'], ['sabahleyin 7’de', false, '07:00'],
      ['cumaya saat 10’a alalım', false, '10:00'], ['üçe çeyrek var', false, null],
      // not a time: a date, a pronoun, a bare number outside the "Saat kaçta?" answer
      ['3 Ekim', false, null], ['03.10.2026', false, null], ['ona randevu ver', false, null], ['15', false, null], ['yarın', true, null],
    ]
    for (const [cumle, ciplak, saat] of beklenen) assert.equal(randevuSaatiBul(cumle, ciplak), saat, cumle)
  })
  it('gün: doktorun saat diliminde “yarın”; gg.aa.yyyy', () => {
    // 2026-10-01 22:30 UTC = 2 Ekim 01:30 İstanbul, 1 Ekim 18:30 New York
    const simdi = new Date('2026-10-01T22:30:00Z')
    assert.equal(randevuTarihiBul('yarın saat 3’te', 'Europe/Istanbul', simdi), '2026-10-03')
    assert.equal(randevuTarihiBul('yarın saat 3’te', 'America/New_York', simdi), '2026-10-02')
    assert.equal(randevuTarihiBul('05.11.2026 günü', 'Europe/Istanbul', simdi), '2026-11-05')
    assert.equal(randevuTarihiBul('saat 3’te', 'Europe/Istanbul', simdi), null)
    // case-suffixed day words (2 Ekim 2026 is a Friday in İstanbul)
    assert.equal(randevuTarihiBul('yarına alalım', 'Europe/Istanbul', simdi), '2026-10-03')
    assert.equal(randevuTarihiBul('pazartesiye', 'Europe/Istanbul', simdi), '2026-10-05')
    assert.equal(randevuTarihiBul('gelecek hafta salıya', 'Europe/Istanbul', simdi), '2026-10-06')
    assert.equal(randevuTarihiBul('15 Ekim’de', 'Europe/Istanbul', simdi), '2026-10-15')
    assert.equal(randevuTarihiBul('5 Ocak', 'Europe/Istanbul', simdi), '2027-01-05', 'yılsız gün-ay randevuda geçmişte olamaz')
    assert.equal(randevuTarihiBul('32.13.2026', 'Europe/Istanbul', simdi), null)
    assert.equal(yerelAnI('2026-10-03', '14:30', 'Europe/Istanbul'), '2026-10-03T11:30:00.000Z')
    assert.equal(yerelAnI('2026-10-03', '14:30', 'America/New_York'), '2026-10-03T18:30:00.000Z')
  })
  it('geçmişe dönük kayıt tarihi: "dün", "bugün", yılsız gün-ay bu yılda kalır', () => {
    const simdi = new Date('2026-10-01T22:30:00Z')
    assert.equal(soylenenTarih('Hepatit B aşısı dün yapıldı', 'America/New_York', simdi), '2026-09-30')
    assert.equal(soylenenTarih('Hepatit B aşısı dün yapıldı', 'Europe/Istanbul', simdi), '2026-10-01')
    assert.equal(soylenenTarih('bugün yapılan KKK aşısını kaydet', 'America/New_York', simdi), '2026-10-01')
    assert.equal(soylenenTarih('bugün yapılan KKK aşısını kaydet', 'Europe/Istanbul', simdi), '2026-10-02')
    assert.equal(soylenenTarih('3 Eylül’de yapıldı', 'Europe/Istanbul', simdi), '2026-09-03')
    assert.equal(soylenenTarih('aşıyı kaydet', 'Europe/Istanbul', simdi), null)
  })
})

describe('adı anılan kişi', () => {
  it('söylenen ad: yalnız baş harfi büyük en az iki kelime; cümle başı ve takvim sözcükleri ad değildir', () => {
    assert.equal(soylenenAd('Zeynep Kara için yarın 10:00 randevu oluştur'), 'Zeynep Kara')
    assert.equal(soylenenAd('Yarın Zeynep Kara’ya randevu ver'), 'Zeynep Kara')
    assert.equal(soylenenAd('Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?'), null)
    assert.equal(soylenenAd('Randevu oluştur Cuma günü'), null)
  })
  it('anılan kişi: "için" / hal eki / "adlı" ile işaretlenmiş tam ad; ilaç ve terim değil', () => {
    assert.equal(anilanKisi('Ali Yılmaz için randevu oluştur'), 'Ali Yılmaz')
    assert.equal(anilanKisi('Yarın Zeynep Kara’ya randevu ver'), 'Zeynep Kara')
    assert.equal(anilanKisi('Ali Yılmaz’ın penisilin alerjisini ekle'), 'Ali Yılmaz')
    assert.equal(anilanKisi('Hastam Mert Öz 12 kilo, kaydet'), 'Mert Öz')
    assert.equal(anilanKisi('Selin Ak adlı hastaya not ekle'), 'Selin Ak')
    for (const m of ['Augmentin BID 400 mg ekle', 'Hepatit B aşısını dosyaya gir', 'Penisilin alerjisini ekle', 'Kontrol Randevusu oluştur', 'Kilosunu 12,4 kilo olarak ekle', 'Baş Çevresi 47 santim, kaydet']) {
      assert.equal(anilanKisi(m), null, m)
    }
  })
})
