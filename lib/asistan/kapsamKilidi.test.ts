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
  const kapi = k.indexOf('kapsamKarariHastayla(supabase, doktorId, hamMesaj')
  assert.ok(kapi > 0)
  for (const arac of ['takvimSorusuCoz(message', 'kimlikSorusunuCevapla(supabase', 'hastaninSozunuCoz(supabase']) {
    assert.ok(k.indexOf(arac) > kapi, `${arac} kapıdan sonra olmalı`)
  }
  assert.match(k, /kapsam === 'disi' \|\| \(kapsam === 'belirsiz' && !takip\)/)
  const bul = readFileSync(new URL('../../app/api/asistan/hasta-bul/route.ts', import.meta.url), 'utf8')
  const bulKapi = bul.indexOf('kapsamKarariHastayla(supabase, doktorId, soz)')
  assert.ok(bulKapi > 0 && bulKapi < bul.indexOf('kimlikSorusunuCevapla(supabase') && bulKapi < bul.indexOf('hastaninSozunuCoz(supabase'))
})

// NOTYA-KAPSAM-06 (2026-10-01): the gate refused real patients and real clinical questions — bare-substring patterns
// ('burc' in Burcu, 'kripto' in kriptorşidizm, 'react' in C-reactive, 'erdogan' / 'faiz' as names, 'araba' / 'otel' /
// 'secim' in a clinical sentence). Audit: ayse-capability-regression-audit.md §4.2.
const KAPSAM_06_GECER: string[] = [
  `Burcu Yılmaz en son ne zaman geldi?`,
  `Mehmet Erdoğan en son ne zaman geldi?`,
  `Ali Erdoğan kim?`,
  `Faiz Demir bugün geldi mi`,
  `Kriptorşidizm ne zaman opere edilir?`,
  `Araba tutması için ne önerirsin?`,
  `İlk seçim ne olmalı?`,
  `C-reactive protein yüksekliği nedenleri`,
  `Otel dönüşü döküntü yapan şey ne olabilir`,
]
for (const m of KAPSAM_06_GECER) test(`NOTYA-KAPSAM-06 geçirir: ${m}`, () => assert.equal(kapsamKarari(m), 'ic'))

// The same collision classes, beyond the nine audit sentences.
const KAPSAM_06_KLINIK: string[] = [
  `Burcu geldi mi?`,
  `Burcu'nun aşıları tam mı`,
  `Erdoğan ailesinin ikizleri yarın geliyor mu`,
  `Faiz'i yarına alalım`,
  `kriptokok menenjiti nasıl tedavi edilir`,
  `C-reaktif protein kaç olmalı`,
  `reaktif artrit ayırıcı tanısı`,
  `arabada kusuyor, ne önerirsin`,
  `araba kazası sonrası boyun tutulması`,
  `tatil dönüşü döküntü`,
  `uçuş sonrası kulakta dolgunluk`,
  `seçim kriterleri neler`,
  `mesane ne kadar sürede dolar`,
  `3 Tesla MR gerekir mi`,
  `audiometri ne zaman istenir`,
  `kekemelik değerlendirmesi nasıl yapılır`,
  `CSS vaskülitinde ilk basamak ne`,
]
for (const m of KAPSAM_06_KLINIK) test(`NOTYA-KAPSAM-06 geçirir (çakışma sınıfı): ${m}`, () => assert.equal(kapsamKarari(m), 'ic'))

// Real off-topic input is still refused after the patterns were tightened.
const KAPSAM_06_RED: string[] = [
  `bugün hava nasıl`,
  `Bugün İstanbul'da hava yağışlı mı?`,
  `yarın yağmur yağacak mı`,
  `Türkiye başbakanı 1950`,
  `1950'de Türkiye'nin başbakanı kimdi`,
  `burcum bu hafta ne diyor`,
  `günlük burç yorumu`,
  `koç burcu bugün nasıl`,
  `burçlar ne diyor`,
  `Fenerbahçe maçı kaç kaç bitti`,
  `Galatasaray'ın maçı ne zaman`,
  `seçim sonuçları ne oldu`,
  `erken seçim olacak mı`,
  `cumhurbaşkanı ne dedi`,
  `Tayyip Erdoğan ne dedi`,
  `faiz oranları düşecek mi`,
  `faiz kararı ne oldu`,
  `dolar kaç TL`,
  `euro ne kadar oldu`,
  `kripto para almalı mıyım`,
  `kriptoya girmeli miyim`,
  `bitcoin al mı`,
  `Python kodu yaz`,
  `React component yazar mısın`,
  `bana bir javascript fonksiyonu yaz`,
  `araba almak istiyorum`,
  `hangi arabayı önerirsin`,
  `tatil için otel öner`,
  `en iyi otel hangisi`,
  `Tesla almak istiyorum`,
]
for (const m of KAPSAM_06_RED) test(`NOTYA-KAPSAM-06 reddeder: ${m}`, () => assert.equal(kapsamKarari(m), 'disi'))

// A message that names one of the doctor's own patients is never refused; another doctor's patient changes nothing.
import { randomUUID } from 'node:crypto'
import { describe, it, before, beforeEach } from 'node:test'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { adIndeksParcalari, tokenOzeti } from '../doktor/hastaAramaIndeksi'
import { kapsamKarariHastayla } from '@/lib/asistan/kapsamKilidi'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-kapsam-isim-anahtari'

describe('NOTYA-KAPSAM-06 — doktorun kendi hastasının adı kapıdan geçer', () => {
  let encrypt: (s: string) => string
  let db: SahteVeritabani
  let doktorA = ''
  let doktorB = ''
  const hastaEkle = (doktorId: string, ad: string) => {
    const id = db.ekle('patients', { doctor_id: doktorId, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad })), dob_encrypted: encrypt('2020-01-01') }).id
    for (const parca of adIndeksParcalari(ad)) db.ekle('patient_search_tokens', { patient_id: id, doctor_id: doktorId, token_hash: tokenOzeti(parca) })
  }
  const karar = (doktorId: string, m: string, secenek: { oncekiRed?: boolean } = {}) => kapsamKarariHastayla(db.istemci() as never, doktorId, m, secenek)

  before(async () => { ;({ encrypt } = await import('../security/encryption')) })
  beforeEach(() => {
    db = new SahteVeritabani()
    doktorA = randomUUID()
    doktorB = randomUUID()
    db.ekle('users', { id: doktorA, full_name: 'QA Hekim A', specialty: 'pediatri' })
    db.ekle('users', { id: doktorB, full_name: 'QA Hekim B', specialty: 'pediatri' })
    // Synthetic names that still collide with an off-topic pattern after the tightening (weather words).
    hastaEkle(doktorA, 'Hava Güneş')
    hastaEkle(doktorA, 'Yağmur Kar')
    hastaEkle(doktorB, 'QA Hasta B')
  })

  it('full name of the doctor’s own patient: in scope, although the bare gate refuses the sentence', async () => {
    for (const m of [`Hava Güneş bugün geldi mi`, `Hava Güneş'in annesi aradı mı`, `Hava Güneşin annesi aradı mı`, `yarın Hava Güneş gelecek mi`]) {
      assert.equal(kapsamKarari(m), 'disi', m)
      assert.equal(await karar(doktorA, m), 'ic', m)
    }
  })
  it('first name only lifts the clarifying question, never a clear off-topic pattern', async () => {
    assert.equal(kapsamKarari(`Yağmur bugün geldi mi`), 'belirsiz')
    assert.equal(await karar(doktorA, `Yağmur bugün geldi mi`), 'ic')
    for (const m of [`yarın yağmur yağacak mı`, `bugün hava güneşli mi`, `Bugün İstanbul'da hava yağışlı mı?`, `kar yağacak mı`]) {
      assert.equal(await karar(doktorA, m), 'disi', m)
    }
  })
  it('off-topic stays refused for a doctor with patients; follow-up after a refusal too', async () => {
    for (const m of [`Türkiye başbakanı 1950`, `burcum bu hafta ne diyor`, `Tesla almak istiyorum`, `dolar kaç TL`]) assert.equal(await karar(doktorA, m), 'disi', m)
    assert.equal(await karar(doktorA, `peki hangisi daha iyi`, { oncekiRed: true }), 'disi')
    assert.equal(await karar(doktorA, `peki Hava Güneş hangisi`, { oncekiRed: true }), 'ic')
  })
  it('isolation: another doctor’s patient name gets the same verdict as a name nobody has', async () => {
    const yabanci = `Hava Güneş bugün geldi mi`
    const olmayan = `Hava Bulut bugün geldi mi`
    assert.equal(await karar(doktorB, yabanci), 'disi')
    assert.equal(await karar(doktorB, olmayan), 'disi')
    assert.equal(await karar(doktorB, `Yağmur bugün geldi mi`), 'belirsiz')
    // The verdict for B does not change when A's patients are removed: it never depended on them.
    const bos = new SahteVeritabani()
    bos.ekle('users', { id: doktorB, full_name: 'QA Hekim B', specialty: 'pediatri' })
    assert.equal(await kapsamKarariHastayla(bos.istemci() as never, doktorB, yabanci), 'disi')
    assert.equal(await kapsamKarariHastayla(bos.istemci() as never, doktorB, `Yağmur bugün geldi mi`), 'belirsiz')
  })
  it('the name lookup reads only this doctor’s rows and runs only when the bare gate does not pass', async () => {
    const cagri: { tablo: string; doktor: unknown }[] = []
    const sahte = { from: (tablo: string) => { const s = { doktor: undefined as unknown }; cagri.push({ tablo, get doktor() { return s.doktor } }); const z: Record<string, unknown> = {}; for (const y of ['select', 'in', 'limit']) z[y] = () => z; z.eq = (kolon: string, deger: unknown) => { if (kolon === 'doctor_id') s.doktor = deger; return z }; z.then = (coz: (v: unknown) => unknown) => coz({ data: [], error: null }); return z } }
    assert.equal(await kapsamKarariHastayla(sahte as never, doktorA, `Burcu Yılmaz en son ne zaman geldi?`), 'ic')
    assert.equal(cagri.length, 0)
    assert.equal(await kapsamKarariHastayla(sahte as never, doktorA, `Hava Güneş bugün geldi mi`), 'disi')
    assert.ok(cagri.length > 0)
    for (const c of cagri) assert.equal(c.doktor, doktorA, c.tablo)
  })
  it('a failing lookup keeps the bare verdict', async () => {
    const bozuk = { from: () => { throw new Error('db yok') } }
    assert.equal(await kapsamKarariHastayla(bozuk as never, doktorA, `Hava Güneş bugün geldi mi`), 'disi')
    assert.equal(await kapsamKarariHastayla(bozuk as never, doktorA, `Burcu Yılmaz en son ne zaman geldi?`), 'ic')
  })
})
