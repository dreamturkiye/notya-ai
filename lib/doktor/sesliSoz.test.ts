import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { hitapsiz, sesliSozTokenlari, tumAdParcalariVar, adTaramasiGereksizMi } from './hastaCozumleyici'

test('kahve sohbeti hasta listesini taramaz; ad geçen cümle tarar', () => {
  assert.equal(adTaramasiGereksizMi('Ben de iyiyim. Bir kahve içelim mi sizinle bugün?'), true)
  assert.equal(adTaramasiGereksizMi('Merhaba, nasılsınız?'), true)
  assert.equal(adTaramasiGereksizMi('Elif’in ateşi nasıl?'), false)
  assert.equal(adTaramasiGereksizMi('Umutcan Türkoğlu kaç kilo?'), false)
  assert.equal(adTaramasiGereksizMi('son hastamın ilaçları'), false)
})

test('NOTYA-SES-DOLGU-02 (Kaan, canlı vaka 2026-09-28): Fish ASR yazım varyantı — "nasılsınız" -> "nasınsınız" hâlâ sohbet sayılır', () => {
  assert.equal(adTaramasiGereksizMi('Merhaba hocam bugün nasınsınız iyi misiniz?'), true)
  assert.equal(adTaramasiGereksizMi('Merhaba hocam bugun nasilsiniz'), true) // aksansız/yazım farkı da
  assert.equal(adTaramasiGereksizMi('tesekur ederim iyiyim'), true) // 'teşekkür' -> tek harf eksik yazım hatası
  // Kısa (<5) kelimede tolerans yok — 'bir' <-> 'bin' gibi bir yanlış yazım hâlâ taramayı tetikler.
  assert.equal(adTaramasiGereksizMi('Bin kahve alalım mı'), false)
  // Gerçek bir isme 1 düzenleme mesafesindeki bir dolgu kelimesi varsa bile isim hâlâ taranır —
  // guvenliKelimeMi yalnız kelime AD_OLMAYAN'a yakınsa güvenli sayar, adayları etkilemez.
  assert.equal(adTaramasiGereksizMi('Umutcan nasil bugun'), false)
})
test('NOTYA-SES-DOLGU-01: dolgu sözcükleri ve ayrık ad (Dr. Gökhan)', () => {
  const t = sesliSozTokenlari('gokhan eee s umutcan eee turkoglu nun dosyasina bakmani istiyorum')
  assert.equal(tumAdParcalariVar('umutcan turkoglu', t), true)
  assert.equal(tumAdParcalariVar('umutcan turkoglu', sesliSozTokenlari('umut can turkoglu nun dosyasi')), true)
  assert.equal(tumAdParcalariVar('umutcan turkoglu', sesliSozTokenlari('turkoglu umutcan kac kilo')), true)
  assert.equal(tumAdParcalariVar('umutcan turkoglu', sesliSozTokenlari('umutcan kac yasinda')), false)
})

test('NOTYA-SES-DOLGU-01: asistana hitap hasta adı sayılmaz', () => {
  assert.doesNotMatch(hitapsiz('Merhaba Ayşe, bu hafta ateşli hasta var mı'), /Ayşe/)
  assert.doesNotMatch(hitapsiz('Ayşe, en son ne zaman geldi'), /Ayşe/)
  assert.match(hitapsiz('Merhaba Ayşe. Bizim bir hastamız vardı, Ayşe Yeşil adında'), /Ayşe Yeşil/)
})

test('NOTYA-HASTA-ODAK-01: cümle ortasındaki hitap (Dr. Gökhan canlı vaka) ve tüm persona adları hasta adı sayılmaz', () => {
  // The exact sentence that opened Ayşe Yeşil's file while the doctor was talking about Umutcan Türkoğlu.
  assert.doesNotMatch(hitapsiz('Biraz koy. Ayşe, benim spesifik, eee, arzum şeydi, aşı karnesini göstermendi.'), /Ayşe/)
  assert.doesNotMatch(hitapsiz('Eee, merhaba Ayşe Hocam. Bana, eee, Uğurcan Türkoğlu\'nun hanesini gösterir misin'), /Ayşe/)
  assert.match(hitapsiz('Eee, merhaba Ayşe Hocam. Bana Uğurcan Türkoğlu\'nun hanesini gösterir misin'), /Uğurcan Türkoğlu/)
  assert.doesNotMatch(hitapsiz('Peki Ayşe, Umutcan Türkoğlu kaç kilo?'), /Ayşe/)
  assert.match(hitapsiz('Peki Ayşe, Umutcan Türkoğlu kaç kilo?'), /Umutcan Türkoğlu/)
  // Other personas: Mehmet (kardiyoloji), Selin (dermatoloji), İrem — same rule, anywhere in the sentence.
  assert.doesNotMatch(hitapsiz('Tamam Mehmet, EKG sonucunu söyle'), /Mehmet/)
  assert.doesNotMatch(hitapsiz('Bak Selin Hanım şu lezyona'), /Selin/)
  // A full patient name is never a vocative, even when it shares the persona's first name.
  assert.match(hitapsiz('Bana Ayşe Hocam, Ayşe Yeşil dosyasını aç'), /Ayşe Yeşil/)
  assert.match(hitapsiz('Ayşe Yeşil adında bir hastamız vardı'), /Ayşe Yeşil/)
})

test('NOTYA-HASTA-ODAK-01: hastaAdiCoz JSON {ad} yükünü de düz adı da çözer — dosya cümlesi ham JSON söylemez', async () => {
  process.env.ENCRYPTION_MASTER_KEY ||= 'qa-sentetik-tek-beyin-anahtari'
  const { encrypt } = await import('../security/encryption')
  const { hastaAdiCoz } = await import('./hastaCozumleyici')
  assert.equal(hastaAdiCoz(encrypt(JSON.stringify({ ad: 'Sentetik Bebek Test' }))), 'Sentetik Bebek Test')
  assert.equal(hastaAdiCoz(encrypt('Umutcan Türkoğlu')), 'Umutcan Türkoğlu')
  assert.equal(hastaAdiCoz(null), '')
})
