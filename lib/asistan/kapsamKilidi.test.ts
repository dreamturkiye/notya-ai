import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { kapsamDisiMi, KAPSAM_RED, kapsamRedMi } from '@/lib/asistan/kapsamKilidi'
import { KAPSAM_RED as RED2 } from '@/lib/asistan/kapsamRed'
import { PERSONAS, buildSystemPrompt } from '@/lib/asistan/personaEngine'

// NOTYA-KAPSAM-01: off-topic asks are refused; everything medical / in-app passes (a false refusal is worse than a leak).
const KAPSAM_DISI: string[] = [
  `Tesla almak istiyorum`,
  `araba almak istiyorum`,
  `Tesla Model Y mi Model 3 mü daha iyi`,
  `bana yeni bir otomobil öner`,
  `hava durumu bugün nasıl`,
  `yarın hava soğuk mu`,
  `bugün hava nasıl`,
  `yarın yağmur yağacak mı`,
  `İstanbul'da hava kaç derece`,
  `Fenerbahçe maçı kaç kaç bitti`,
  `Galatasaray dün kimle oynadı`,
  `dün akşamki maç sonucu ne`,
  `dolar kaç TL`,
  `bitcoin al mı`,
  `borsada hangi hisse senedi yükselir`,
  `altın fiyatları ne durumda`,
  `faiz oranları düşecek mi`,
  `bana yemek tarifi ver`,
  `makarna nasıl yapılır`,
  `Python kodu yaz`,
  `bana bir javascript fonksiyonu yaz`,
  `İstanbul'a uçak bileti bakar mısın`,
  `tatil için otel öner`,
  `son dakika haberleri neler`,
  `seçim sonuçları ne oldu`,
  `Trump ne dedi`,
  `bana bir fıkra anlat`,
  `iyi bir film öner`,
  `Netflix'te ne izlesem`,
  `Türkiye'nin başkenti neresi`,
  `burcum bu hafta ne diyor`,
  `yeni bir iPhone almalı mıyım`,
  `Ayşe, Tesla almak istiyorum`,
  `Ankara'da bugün yağmur var mı`,
]

const KAPSAM_ICI: string[] = [
  `Ayşe Yeşil'in son muayenesini özetle`,
  `amoksisilin 12 kg çocuk için doz`,
  `paracetamol ile ibuprofen birlikte verilir mi`,
  `bugün kaç randevum var`,
  `yarın kaç randevum var`,
  `teşekkürler`,
  `tamam`,
  `tekrar söyler misin`,
  `bu ilaç yan etkisi`,
  `aşı takvimi 6 aylık`,
  `hastanın ateşi 39 derece ne yapmalı`,
  `sen kimsin`,
  `ne yapabilirsin`,
  `merhaba`,
  `günaydın Ayşe`,
  `hasta ateşi hava sıcaklığına bağlı olabilir mi`,
  `hava değişimi astımı tetikler mi`,
  `hava yolu obstrüksiyonu nasıl yönetilir`,
  `çocuk soğuk havada öksürüyor`,
  `sepsis algoritması nedir`,
  `evet`,
  `hayır yanlış anladın`,
  `onaylıyorum`,
  `peki yarın`,
  `dozu`,
  `kimler`,
  `bu hastaya hangi antibiyotik uygun`,
  `Ahmet Kaya'nın dosyasını aç`,
  `son tahlil sonuçlarını göster`,
  `CRP yüksekliği ne anlama gelir`,
  `bronşiolit tedavisi nasıl`,
  `3 yaşında çocukta kabızlık için ne önerirsin`,
  `hastaya WhatsApp mesajı gönder`,
  `bu hastanın faturasını hazırla`,
  `SGK raporu nasıl yazılır`,
  `notyada not nasıl düzenlenir`,
  `uygulamada randevu nasıl iptal edilir`,
  `bebeğin boy kilo persentili nedir`,
  `kendimi çok yorgun hissediyorum`,
  `tatilde aşı olabilir mi`,
  `araba koltuğunda bebek nöbet geçirdi`,
  `Fenerbahçe'li bir hastam var, diz ağrısı şikayeti`,
  `hastanın kredi kartı ile ödeme alındı mı`,
  `makrolid ile statin etkileşimi var mı`,
  `ICD kodu nedir`,
  `SOAP notunu özetle`,
  `düzeltme: soyadı Yılmaz değil Yıldız`,
  `hayır ben dünkü randevuyu sordum`,
  `yeni doğanda sarılık takibi`,
  `Python ile yazılmış bir tahlil raporu okuyabilir misin`,
  `bugün kaç hastam var`,
  `ok`,
  `anladım teşekkür ederim`,
  `bu çocuğa kaç mg parasetamol verilir`,
  `ateş düşürücü olarak hangisi daha iyi`,
]

test('tablo boyutu', () => {
  assert.ok(KAPSAM_DISI.length >= 25)
  assert.ok(KAPSAM_ICI.length >= 40)
})
for (const m of KAPSAM_DISI) test(`reddeder: ${m}`, () => assert.equal(kapsamDisiMi(m), true))
for (const m of KAPSAM_ICI) test(`geçirir: ${m}`, () => assert.equal(kapsamDisiMi(m), false))
test('boş / tanımsız girdi geçer', () => {
  assert.equal(kapsamDisiMi(''), false)
  assert.equal(kapsamDisiMi(null), false)
  assert.equal(kapsamDisiMi(undefined), false)
})
test('ret sonrası aynı konunun devamı reddedilir; kapsam-içi devam geçer', () => {
  assert.equal(kapsamDisiMi('peki hangisi daha iyi', { oncekiRed: true }), true)
  assert.equal(kapsamDisiMi('kaç km menzili var', { oncekiRed: true }), true)
  assert.equal(kapsamDisiMi('fiyatı ne kadar', { oncekiRed: true }), true)
  assert.equal(kapsamDisiMi('peki hangisi daha iyi', { oncekiRed: false }), false)
  assert.equal(kapsamDisiMi('peki bugünkü randevularım', { oncekiRed: true }), false)
  assert.equal(kapsamDisiMi('tamam', { oncekiRed: true }), false)
  assert.equal(kapsamDisiMi('teşekkürler', { oncekiRed: true }), false)
  assert.equal(kapsamDisiMi('Ahmet Kaya dosyası peki', { oncekiRed: true }), false)
})
test('sabit ret cümlesi: tek dizgi, tanınır, sistem isteminde var', () => {
  assert.equal(KAPSAM_RED, RED2)
  assert.equal(kapsamRedMi(KAPSAM_RED), true)
  assert.equal(kapsamRedMi('başka bir cümle'), false)
  const p = Object.values(PERSONAS)[0]
  assert.ok(buildSystemPrompt(p, null, null).includes(KAPSAM_RED))
})

// NOTYA-KAPSAM-05 (2026-10-01): live voice bug — "Bugün İstanbul'da hava yağışlı mı?" → "Bugün 0 hasta. Filtre: bugün · Şehir."
import { kapsamKarari, KAPSAM_SORU } from '@/lib/asistan/kapsamKilidi'
import { readFileSync } from 'node:fs'

test('NOTYA-KAPSAM-05: canlı cümle reddedilir (hasta sayımı değil)', () => {
  assert.equal(kapsamKarari(`Bugün İstanbul'da hava yağışlı mı?`), 'disi')
  for (const m of [`yarın Ankara'da hava yağmurlu olacak mı`, `hafta sonu İzmir'de hava güneşli mi`, `bugün yağış bekleniyor mu`, `meteoroloji ne diyor`, `yağmurlu bir hava var mı dışarıda`]) {
    assert.equal(kapsamKarari(m), 'disi', m)
  }
})
test('NOTYA-KAPSAM-05: belirsizse netleştirme sorusu (hasta aracı yok)', () => {
  for (const m of [`hava güzel mi`, `İstanbul'da havalar nasıl gidiyor`, `maç ne oldu`, `gündemde ne var`]) assert.equal(kapsamKarari(m), 'belirsiz', m)
  assert.ok(KAPSAM_SORU.includes('Hocam') && KAPSAM_SORU.endsWith('?'))
})
test('NOTYA-KAPSAM-05: hasta / klinik sorular geçer', () => {
  for (const m of [`bugün kaç hastam var?`, `Bugün kaç hastam var`, `İstanbul'da oturan hastalarım kimler`, `hava yolu açık mı`, `oda havasında satürasyon kaç`, `bugün randevularım neler`, `peki yarın?`]) {
    assert.equal(kapsamKarari(m), 'ic', m)
  }
})
test('NOTYA-KAPSAM-05: kapı her araçtan önce ve takip turunda da çalışır', () => {
  const k = readFileSync(new URL('./ayseCevapla.ts', import.meta.url), 'utf8')
  const kapi = k.indexOf('kapsamKarari(hamMesaj')
  assert.ok(kapi > 0)
  for (const arac of ['takvimSorusuCoz(message', 'kimlikSorusunuCevapla(supabase', 'hastaninSozunuCoz(supabase']) {
    assert.ok(k.indexOf(arac) > kapi, `${arac} kapıdan sonra olmalı`)
  }
  assert.match(k, /kapsam === 'disi' \|\| \(kapsam === 'belirsiz' && !takip\)/)
  const bul = readFileSync(new URL('../../app/api/asistan/hasta-bul/route.ts', import.meta.url), 'utf8')
  assert.ok(bul.indexOf('kapsamKarari(soz)') > 0 && bul.indexOf('kapsamKarari(soz)') < bul.indexOf('hastaninSozunuCoz(supabase'))
})
