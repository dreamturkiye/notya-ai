import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ayniSozMu, benzerCevapMi, cevapEkle, kullaniciEkle, siraAraya, sorusuzCevapYeri, turZamanlari, yetimCevapYeri, type Balon } from './balonSirasi'

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

/* ───────────────── NOTYA-AYSE-SAYI-SIRA-01 (Kaan live, voice, 2026-10-11 01:07–01:08 UTC) ───────────────── */

type SiraliBalon = Balon & { sira: number }
/** The page's own bubble factory: every new bubble takes the next number of one counter (AsistanOturumContext `yeniBalon`). */
function sayfa() {
  let n = 0
  const yeni = (role: 'user' | 'ai', text: string, olay?: number): SiraliBalon => ({ role, text, sira: ++n, ...(olay != null ? { olay } : {}) })
  return { yeni }
}
/** What the floating panel and the saved history show: the bubbles sorted by `sira`. */
const panelSirasi = (liste: SiraliBalon[]) => [...liste].sort((a, b) => a.sira - b.sira).map((m) => m.text)

const KONUSMA: [string, string][] = [
  ['Merhaba hocam. Bugün iyi misiniz?', 'Merhaba Hocam, iyiyim teşekkür ederim. Siz nasılsınız?'],
  ['Ben de iyiyim. Bugün bir randevumuz var mı hocam?', '10 Ekim 2026 Cumartesi takviminde randevu yok.'],
  ['Aaa, iyiymiş. Yani, bugün seninle takılacağız, ha?', 'Ben buradayım Hocam; klinik işler, hasta dosyaları ya da uygulamayla ilgili ne varsa birlikte hallederiz.'],
  ['Tabii, tabii. Hocam, kaç tane hastamız var şu anda bizim?', 'Kayıtlarda 1 hasta: Deneme Hasta.'],
]
const ACILIS = 'Merhaba Kaan Hocam. Nasıl yardımcı olabilirim?'

test('NOTYA-AYSE-SAYI-SIRA-01: üçüncü cümlenin dökümü cevabından sonra gelirse cümle cevabın önünde durur — listede de, panelde de', () => {
  const { yeni } = sayfa()
  // ElevenLabs tek beyin: the doctor bubble comes from the transcript, the reply from the screen poll (no doctor bubble made).
  let ekran: SiraliBalon[] = [yeni('ai', ACILIS, 1)]
  KONUSMA.forEach(([soru, cevap], i) => {
    const olay = 10 + i * 4
    if (i === 2) {
      // Turn 3 of the live conversation: the poll painted the reply before the final transcript arrived.
      ekran = cevapEkle(ekran, null, cevap, yeni, soru)
      ekran = kullaniciEkle(ekran, soru, olay, yeni)
    } else {
      ekran = kullaniciEkle(ekran, soru, olay, yeni)
      ekran = cevapEkle(ekran, null, cevap, yeni, soru)
    }
  })
  const beklenen = [ACILIS, ...KONUSMA.flat()]
  assert.deepEqual(ekran.map((m) => m.text), beklenen, 'list order')
  assert.deepEqual(panelSirasi(ekran), beklenen, 'order by sira (floating panel, saved history)')
  assert.equal(new Set(ekran.map((m) => m.sira)).size, ekran.length, 'sira stays unique')
})

test('NOTYA-AYSE-SAYI-SIRA-01: her turda döküm geç gelse de sıra kayıttaki sıradır', () => {
  const { yeni } = sayfa()
  let ekran: SiraliBalon[] = [yeni('ai', ACILIS, 1)]
  KONUSMA.forEach(([soru, cevap], i) => {
    ekran = cevapEkle(ekran, null, cevap, yeni, soru)
    ekran = kullaniciEkle(ekran, soru, 10 + i * 4, yeni)
  })
  const beklenen = [ACILIS, ...KONUSMA.flat()]
  assert.deepEqual(ekran.map((m) => m.text), beklenen)
  assert.deepEqual(panelSirasi(ekran), beklenen)
})

test('NOTYA-AYSE-SAYI-SIRA-01: döküm ile saklanan cümle büyük-küçük harf / noktalama farkıyla da aynı cümledir; başka cümle değildir', () => {
  assert.equal(ayniSozMu('Aaa, iyiymiş. Yani, bugün seninle takılacağız, ha?', 'aaa iyiymiş yani bugün seninle takılacağız ha'), true)
  assert.equal(ayniSozMu('Yani, bugün seninle takılacağız, ha?', 'Aaa, iyiymiş. Yani, bugün seninle takılacağız, ha?'), true, 'a clipped edge')
  assert.equal(ayniSozMu('Evet', 'Evet, tamam. Kaç hastam var?'), false, 'a short word is not a match by containment')
  assert.equal(ayniSozMu('Kaç hastam var?', 'Bugün randevum var mı?'), false)
  assert.equal(ayniSozMu('...', '...'), false)
  const { yeni } = sayfa()
  let ekran: SiraliBalon[] = [yeni('ai', ACILIS, 1)]
  ekran = kullaniciEkle(ekran, KONUSMA[0][0], 10, yeni)
  ekran = cevapEkle(ekran, null, KONUSMA[0][1], yeni, KONUSMA[0][0])
  ekran = cevapEkle(ekran, null, KONUSMA[2][1], yeni, KONUSMA[2][0])
  ekran = kullaniciEkle(ekran, 'aaa iyiymiş, yani bugün seninle takılacağız ha', 14, yeni)
  assert.deepEqual(ekran.map((m) => m.role), ['ai', 'user', 'ai', 'user', 'ai'])
  assert.equal(sorusuzCevapYeri(ekran, KONUSMA[2][0]), null, 'the reply now has its doctor line in front of it')
})

test('NOTYA-AYSE-SAYI-SIRA-01: duraklama turunun cevabı ("...") yeni cümleyi önüne çekmez; gizli turun cevabı etiket taşımaz', () => {
  const { yeni } = sayfa()
  let ekran: SiraliBalon[] = [yeni('ai', ACILIS, 1)]
  ekran = kullaniciEkle(ekran, KONUSMA[3][0], 10, yeni)
  ekran = cevapEkle(ekran, null, KONUSMA[3][1], yeni, KONUSMA[3][0])
  // Turn 5 of the live conversation: the pause has no doctor bubble; the page passes no line for it.
  ekran = cevapEkle(ekran, null, 'Buradayım Hocam.', yeni, null)
  assert.equal(ekran.at(-1)?.soru, undefined)
  const yeniSoz = 'Peki yarın randevum var mı?'
  ekran = kullaniciEkle(ekran, yeniSoz, 20, yeni)
  assert.deepEqual(ekran.map((m) => m.text), [ACILIS, KONUSMA[3][0], KONUSMA[3][1], 'Buradayım Hocam.', yeniSoz])
  assert.deepEqual(panelSirasi(ekran), ekran.map((m) => m.text))
})

test('NOTYA-AYSE-SAYI-SIRA-01: Fish yolunda (soru balonu yoklamadan) öne alınan cümlenin sırası da cevabın önündedir', () => {
  const { yeni } = sayfa()
  let ekran: SiraliBalon[] = [yeni('ai', ACILIS), yeni('ai', KAHVE)]
  ekran = cevapEkle(ekran, SORU, KAHVE, yeni, SORU)
  assert.deepEqual(ekran.map((m) => m.text), [ACILIS, SORU, KAHVE])
  assert.deepEqual(panelSirasi(ekran), [ACILIS, SORU, KAHVE])
  // A bubble that is already in front of later ones is left alone.
  assert.equal(siraAraya(ekran, 0), ekran)
})

test('NOTYA-AYSE-SAYI-SIRA-01: saklanan turda doktorun cümlesi kendi zamanını taşır, cevap kesin olarak sonradır', () => {
  const geldi = '2026-10-11T01:08:12.625Z'
  // The reply is written 2.4 s after the sentence arrived.
  assert.deepEqual(turZamanlari(geldi, new Date('2026-10-11T01:08:15.025Z')), { soru: geldi, cevap: '2026-10-11T01:08:15.025Z' })
  // Same millisecond (a model-free answer): still strictly after — the live record carried one instant for both.
  const ayniAn = turZamanlari(geldi, new Date(geldi))
  assert.equal(ayniAn.soru, geldi)
  assert.ok(ayniAn.cevap > ayniAn.soru, `${ayniAn.cevap} > ${ayniAn.soru}`)
  // A clock that went backwards or an unreadable start never puts the reply first.
  const geri = turZamanlari(geldi, new Date('2026-10-11T01:08:12.000Z'))
  assert.ok(geri.cevap > geri.soru)
  const bozuk = turZamanlari('', new Date(geldi))
  assert.ok(bozuk.cevap > bozuk.soru)
})
