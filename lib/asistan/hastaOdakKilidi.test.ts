import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hastaOdakTemizle, ilkAd } from './hastaOdakKilidi'

const UMUTCAN = {
  ad: 'Umutcan Türkoğlu',
  dosyaMetni: '=== AKTİF HASTA DOSYASI: Umutcan Türkoğlu ===\nAşı: kayıtlı aşı yok\nİlaç: elementer demir\n=== DOSYA SONU ===',
  yasMetin: '2 yaş',
  cinsiyet: 'erkek',
}

test('ilkAd takes the given name', () => {
  assert.equal(ilkAd('Umutcan Türkoğlu'), 'Umutcan')
})

test('recant with uydurdum is replaced by the open-file line', () => {
  const r = hastaOdakTemizle(
    'Önceki listeyi uydurdum Hocam. Aslında 5 yaşında kız, aşı yok.',
    UMUTCAN,
  )
  assert.ok(r.ihlal.includes('recant'))
  assert.match(r.metin, /^Umutcan Türkoğlu — /)
  assert.doesNotMatch(r.metin, /uydurdum/i)
  assert.doesNotMatch(r.metin, /5 yaşında kız/)
  assert.match(r.metin, /kayıtlı aşı yok|dosyadaki kayıt/i)
})

test('invented vaccine list is stripped when the file has no vaccines', () => {
  const r = hastaOdakTemizle(
    'Umutcan Türkoğlu — Hepatit B, KKK, DaBT ve Hib aşıları yapılmış.',
    UMUTCAN,
  )
  assert.ok(r.ihlal.includes('uydurma-asi-listesi'))
  assert.match(r.metin, /kayıtlı aşı yok/)
  assert.doesNotMatch(r.metin, /Hepatit B|KKK|DaBT/)
})

test('wrong demographics (girl / other age) fall back to the open file', () => {
  const r = hastaOdakTemizle('5 yaşında kız, aşı kartı boş.', UMUTCAN)
  assert.ok(r.ihlal.includes('yanlis-demografik'))
  assert.match(r.metin, /^Umutcan Türkoğlu — /)
})

test('a file-grounded answer that names the patient is left alone', () => {
  const r = hastaOdakTemizle(
    'Umutcan Türkoğlu — dosyada kayıtlı aşı yok. Aktif ilaç: elementer demir.',
    UMUTCAN,
  )
  assert.deepEqual(r.ihlal, [])
  assert.match(r.metin, /elementer demir/)
})

test('without an open patient, recant still refuses to invent', () => {
  const r = hastaOdakTemizle('Aşıları uydurdum, erişimim yok.', null)
  assert.ok(r.ihlal.includes('recant'))
  assert.match(r.metin, /hangi hastanın/i)
})

test('NOTYA-AYSE-STANDART-01 uyumu: takvime göre EKSİK aşıları adıyla saymak uydurma liste değildir; uygulandı iddiası hâlâ yakalanır', () => {
  const dosya = 'Hasta: Sentetik Bebek Test\nAşı: kayıtlı aşı yok'
  const standart = 'Sentetik Bebek Test — aşı tablosunda hiç kayıtlı doz yok.\n| KKK | 1 doz (12.ay) | Kayıt yok |\n| Hepatit B | 3 doz | Kayıt yok |\nDikkat: uygulandığına dair kayıt bulamadım; karne yüklenmemiş.'
  const a = hastaOdakTemizle(standart, { ad: 'Sentetik Bebek Test', dosyaMetni: dosya })
  assert.deepEqual(a.ihlal, [], 'eksik aşı listesi ihlal sayılmamalı')
  assert.equal(a.metin, standart)
  const b = hastaOdakTemizle('Sentetik Bebek Test — KKK ve Hepatit B aşıları uygulandı, karne tam.', { ad: 'Sentetik Bebek Test', dosyaMetni: dosya })
  assert.ok(b.ihlal.includes('uydurma-asi-listesi'), 'uygulandı iddiası hâlâ yakalanmalı')
  const c = hastaOdakTemizle('Sentetik Bebek Test — KKK ve Hepatit B aşıları uygulandı.', { ad: 'Sentetik Bebek Test', dosyaMetni: dosya, kanitYolu: true })
  assert.deepEqual(c.ihlal, [], 'kanıt yolunda aşı kuralı çalışmaz')
})
