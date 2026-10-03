import { test } from 'node:test'
import assert from 'node:assert/strict'
import { benzerCevapMi, cevapEkle, kullaniciEkle, yetimCevapYeri, type Balon } from './balonSirasi'

const ekle = (role: 'user' | 'ai', text: string, olay?: number): Balon => ({ role, text, ...(olay != null ? { olay } : {}) })

const SELAM = 'Merhaba Hocam, teşekkür ederim; iyiyim. Siz nasılsınız?'
const KAHVE = 'Çok naziksiniz Hocam! Gerçekten kahve içemem ama kahve molasında size eşlik edip sohbet edebilirim.'
const SORU = 'Ben de iyiyim. Bir kahve içelim mi sizinle bugün?'

test('ekran cevabı doktorun cümlesini kendi önüne koyar, selamın önüne değil', () => {
  const once = cevapEkle([{ role: 'ai', text: SELAM }], SORU, KAHVE, ekle)
  assert.deepEqual(once.map((m) => m.role + ':' + m.text.slice(0, 12)), [
    'ai:Merhaba Hoca',
    'user:Ben de iyiyi',
    'ai:Çok naziksin',
  ])
  const tekrar = cevapEkle(once, SORU, KAHVE, ekle)
  assert.equal(tekrar.length, 3, 'aynı tur ikinci kez eklenmez')
})

test('geç gelen kullanıcı dökümü cevabın arkasına değil önüne oturur', () => {
  const selam: Balon = { role: 'ai', text: SELAM }
  const cevap: Balon = { role: 'ai', text: KAHVE, olay: 5 }
  const sirali = kullaniciEkle([selam, cevap], SORU, 4, ekle)
  assert.deepEqual(sirali.map((m) => m.role), ['ai', 'user', 'ai'])
  assert.equal(sirali[1].text, SORU)
  const ayni = kullaniciEkle(sirali, SORU, 4, ekle)
  assert.equal(ayni.filter((m) => m.role === 'user').length, 1)
})

test('olaysız ekran balonu dururken geç gelen döküm soruyu cevabın arkasına taşımaz', () => {
  const yerlesmis = cevapEkle([{ role: 'ai', text: SELAM }], SORU, KAHVE, ekle)
  const sonra = kullaniciEkle(yerlesmis, SORU, 4, ekle)
  assert.deepEqual(sonra.map((m) => m.role), ['ai', 'user', 'ai'])
})

test('NOTYA-SES-SIRA-02: olaysız ekran cevabından sonra gelen döküm soruyu cevabın önüne koyar (Kaan ekran görüntüsü)', () => {
  const selam: Balon = { role: 'ai', text: 'Merhaba Kaan Hocam. Nasıl yardımcı olabilirim?' }
  const cevap: Balon = { role: 'ai', text: 'Merhaba Hocam, iyiyim teşekkür ederim. Siz nasılsınız?' }
  const soru = 'Merhaba hocam, bugün nasılsınız? İyi misiniz?'
  // Screen poll painted the answer first (no olay); ElevenLabs transcript arrives late.
  const sirali = kullaniciEkle([selam, cevap], soru, 12, ekle)
  assert.deepEqual(sirali.map((m) => m.role), ['ai', 'user', 'ai'])
  assert.equal(sirali[0].text, selam.text)
  assert.equal(sirali[1].text, soru)
  assert.equal(sirali[2].text, cevap.text)
  assert.equal(yetimCevapYeri([selam, cevap]), 1)
  assert.equal(yetimCevapYeri([selam]), null)
  assert.equal(yetimCevapYeri([selam, { role: 'user', text: soru }, cevap]), null)
})

test('NOTYA-SES-SIRA-02: bitmiş turun ardından gelen yeni soru cevabın önüne çekilmez', () => {
  const once = [
    { role: 'ai' as const, text: SELAM },
    { role: 'user' as const, text: SORU },
    { role: 'ai' as const, text: KAHVE },
  ]
  const yeni = 'Peki Umutcan’ın kilosu kaç?'
  const sonra = kullaniciEkle(once, yeni, undefined, ekle)
  assert.deepEqual(sonra.map((m) => m.role), ['ai', 'user', 'ai', 'user'])
  assert.equal(sonra.at(-1)?.text, yeni)
})

test('aynı izolasyonun ikinci modeli yeni balon açmaz', () => {
  const a = 'Hocam, yalnızca kendi hastalarınızın dosyalarına erişebiliyorum; başka bir hekimin hastası olan Rıdvan Dilmen\'in dosya bilgilerini görüntüleyemem.'
  const b = 'Hocam, yalnızca kendi hastalarınızın dosyalarına erişebiliyorum; başka bir hekimin hastası olan Rıdvan Dilmen\'in dosyasını açamam. Dr. Gökhan Mamur\'un kendi hesabından kontrol etmesi gerekir.'
  assert.ok(benzerCevapMi(a, b))
  const soru = 'Rıdvan Dilmen dosyasına bakabilir misin?'
  const once = cevapEkle([{ role: 'ai', text: SELAM }], soru, a, ekle)
  const tekrar = cevapEkle(once, soru, b, ekle)
  assert.equal(tekrar.filter((m) => m.role === 'ai').length, 2, 'selam + bir izolasyon')
  assert.equal(tekrar.at(-1)?.text, a)
})

test('NOTYA-BUYUME-KISA-01: araya kullanıcı girse de aynı büyüme cevabı ikinci balon açmaz', () => {
  const a = 'Rıdvan Dilmen\'in büyümesi yaşına uygun: son ölçümünde (28.09.2026) kilo 13,3 kg (p42), boy 91 cm (p48), baş çevresi 49,7 cm (p55).'
  const b = 'Rıdvan Dilmen\'in büyümesi yaşına uygun görünüyor — 28.09.2026 kilo 13,3 kg (p42), boy 91 cm (p48), baş çevresi 49,7 cm (p55); kayma yok.'
  assert.ok(benzerCevapMi(a, b))
  const soru = 'Rıdvan Dilmen\'in büyümesi yaşına uygun mu?'
  const once = cevapEkle([{ role: 'ai', text: SELAM }], soru, a, ekle)
  const araya = [...once, { role: 'user' as const, text: 'teşekkürler' }]
  const tekrar = cevapEkle(araya, soru, b, ekle)
  assert.equal(tekrar.filter((m) => m.role === 'ai' && benzerCevapMi(m.text, a)).length, 1)
})

test('NOTYA-SES-TEK-CEVAP-01: 24 ay muayene özeti parafrazı ikinci balon açmaz', () => {
  const a = [
    '**Kayıt:** Ali Kara, 24 aylık sağlam çocuk muayenesi için dosya hazır.',
    '**Öykü:** Beslenme, uyku, tuvalet, ekran süresi sorulacak; prematüre doğum kaydı var.',
    '**Büyüme ve muayene:** Kilo, boy, baş çevresi ölç; büyüme eğrisine işle.',
    '**Gelişim:** Dil, motor, sosyal iletişim; 24 ay otizm taraması (M-CHAT) kontrol.',
    '**Aşılar:** e-Nabız aşı karnesini doğrula; eksik doz varsa planla.',
    '**Danışmanlık:** Güvenlik, beslenme, ekran süresi önerileri.',
    '**Dikkat / Takip:** Otizm tarama kaydı eksikse bu vizitte tamamla; D vitamini ve probiyotik devam.',
  ].join('\n')
  const b = [
    'Ali Kara için 24 aylık muayene özeti Hocam:',
    '**Öykü:** Beslenme uyku tuvalet ekran — prematüre öyküsü dosyada.',
    '**Büyüme ve muayene:** Antropometri ve sistem muayenesi.',
    '**Gelişim:** Dil / motor / sosyal; M-CHAT 24 ay taraması.',
    '**Aşılar:** e-Nabız karne kontrolü.',
    '**Danışmanlık:** Güvenlik ve beslenme.',
    '**Dikkat / Takip:** Tarama eksikse tamamla; D vitamini + probiyotik.',
  ].join('\n')
  assert.ok(benzerCevapMi(a, b), 'bölüm başlığı + token örtüşmesi')
  const soru = '24 aylık sağlam çocuk muayenesini yapacağım. Bu muayenede dikkat etmem gerekenler nelerdir?'
  const once = cevapEkle([{ role: 'ai', text: SELAM }], soru, a, ekle)
  const tekrar = cevapEkle(once, soru, b, ekle)
  assert.equal(tekrar.filter((m) => m.role === 'ai').length, 2, 'selam + tek özet')
  const ucuncu = cevapEkle(tekrar, soru, a.replace('dosya hazır', 'hazırlandı'), ekle)
  assert.equal(ucuncu.filter((m) => m.role === 'ai').length, 2)
})
