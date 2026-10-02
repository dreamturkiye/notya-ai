/**
 * NOTYA-SES-NORMAL-01 — the medical speech layer changes ONLY the text handed to the speech engine.
 *
 * The real /api/asistan/fish-tur handler runs with `ses: "ws"` and a stand-in for the Fish socket (no network). The
 * stand-in records what the route hands to the socket; the engine text is then built with the socket's own function
 * (fishWsMetinOlayi), exactly as lib/asistan/fishWsSunucu.ts does. Checked here: the screen text, the `soz` events,
 * the stored message, the doctor's transcript and the model request are the written text; the engine text is the
 * spoken form; the detail flag follows the doctor's sentence.
 */
import { ortam, sahneHazirla, sahneKur, fishTur, sonAsistanMesaji, sonModelIstegi, type Sahne } from './tests/ayseSahne'
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { FishWsDinleyici, FishWsOturumu } from './fishWsSunucu'
import { fishWsMetinOlayi } from './fishWs'
import { fishIstegi, fishMetni } from './fishSes'
import { konusmaYap } from './konusma'
import { seslendirilmemisler, type SeslendirmeSecenegi } from '@/lib/ses/tibbiSeslendirme'

const verilen: { cumle: string; secenek: SeslendirmeSecenegi | undefined }[] = []

function sahteOturum(): FishWsOturumu {
  let d: FishWsDinleyici = { onSes: () => {}, onHata: () => {} }
  let kapali = false
  return {
    bagla: (x) => { d = x },
    yas: () => 0,
    metin: (cumle, secenek) => { verilen.push({ cumle, secenek }); d.onSes(new Uint8Array(480)); return true },
    bitir: async () => {},
    kapat: () => { kapali = true },
    acik: () => !kapali,
    bayt: () => 0,
  }
}
mock.module(pathToFileURL(join(__dirname, 'fishWsSunucu.ts')).href, { namedExports: { fishWsAc: async () => sahteOturum() } })

let s: Sahne
const CEVAP = 'Son ölçüm 12,8 kg ve 87,5 cm Hocam. DaBT-İPA-Hib 2. dozu 30.09.2026 tarihinde yapılmış, KPA planlı.'
const motorMetni = () => verilen.map((v) => fishWsMetinOlayi(v.cumle, v.secenek)?.text || '').join('').replace(/\s+/g, ' ').trim()

before(async () => {
  process.env.FISH_API_KEY = 'qa-sahte-fish-anahtari'
  delete process.env.NOTYA_FISH_WS
  await sahneHazirla()
})

async function tur(soru: string) {
  s = sahneKur()
  ortam.yanit = { metin: JSON.stringify({ speech: CEVAP }) }
  // The pool opens the next socket when a turn ends: one throw-away turn gives the turn under test a recording socket.
  await fishTur(s, 'Merhaba nasılsın bugün?', { govde: { ses: 'ws' } })
  verilen.length = 0
  return fishTur(s, soru, { govde: { ses: 'ws' } })
}

describe('sesli tur — tıbbi seslendirme yalnız ses motoruna giden metni değiştirir', () => {
  it('ekran metni, söz olayları, saklanan mesaj ve doktorun sözü yazıldığı gibi; motor metni konuşma dilinde', async () => {
    const soru = 'Akut otitte ilk seçenek nedir?'
    const t = await tur(soru)
    assert.equal(t.hata, null)
    assert.equal(t.soz, CEVAP, 'söz olayları: yazılı metin (ekran balonu bunlardan kurulur)')
    assert.equal(t.stt, soru, 'doktorun sözü değişmez')
    assert.equal(sonAsistanMesaji(s.oturum), CEVAP, 'saklanan mesaj: yazılı metin')
    assert.equal(verilen.map((v) => v.cumle).join(' ').replace(/\s+/g, ' ').trim(), CEVAP, 'sokete verilen ham metin: yazılı metin')
    assert.ok(verilen.every((v) => !v.secenek?.detay), 'varsayılan: kısa doğal biçim')

    const motor = motorMetni()
    assert.equal(motor, 'Son ölçüm on iki virgül sekiz kilogram ve seksen yedi virgül beş santimetre Hocam. beşli karma aşı ikinci dozu otuz Eylül iki bin yirmi altı tarihinde yapılmış, konjuge pnömokok aşısı planlı.')
    assert.doesNotMatch(motor, /\d|DaBT|KPA|kg|cm/)
    assert.deepEqual(seslendirilmemisler(motor), [])

    // The model never sees the spoken form: nothing of the layer's output is in the request.
    assert.doesNotMatch(JSON.stringify(sonModelIstegi()?.govde ?? {}), /beşli karma aşı|konjuge pnömokok|virgül sekiz kilogram/)
  })

  it('doktor ayrıntı isterse o turun sesi tam biçimle okunur; ekran yine aynı', async () => {
    const t = await tur('Akut otitte ilk seçenek nedir? Ayrıntılı söyler misin?')
    assert.equal(t.soz, CEVAP)
    assert.equal(sonAsistanMesaji(s.oturum), CEVAP)
    assert.ok(verilen.length > 0 && verilen.every((v) => v.secenek?.detay === true))
    assert.match(motorMetni(), /difteri aselüler boğmaca tetanos inaktif polio ve Hib aşısı ikinci dozu/)
  })

  it('kademeli cevabın ikinci aşaması ("devam et") tam biçimle okunur; ilk aşama kısa biçimle', async () => {
    s = sahneKur()
    const yedi = ['Birinci cümle budur.', 'İkinci cümle budur.', 'Üçüncü cümle budur.', 'Dördüncü cümle budur.', 'KPA yapıldı.', 'MCV 74 fL ölçüldü.', 'DaBT-İPA-Hib planlı.'].join(' ')
    ortam.yanit = { metin: JSON.stringify({ speech: yedi }) }
    await fishTur(s, 'Merhaba nasılsın bugün?', { govde: { ses: 'ws' } })
    verilen.length = 0
    await fishTur(s, 'Akut otitte ilk seçenek nedir?', { govde: { ses: 'ws' } })
    assert.ok(verilen.every((v) => !v.secenek?.detay))
    assert.match(motorMetni(), /konjuge pnömokok aşısı yapıldı/)
    verilen.length = 0
    const devam = await fishTur(s, 'devam et', { govde: { ses: 'ws' } })
    assert.match(devam.soz, /MCV 74 fL ölçüldü\. DaBT-İPA-Hib planlı\./, 'söz olayı yine yazılı metin')
    assert.ok(verilen.length > 0 && verilen.every((v) => v.secenek?.detay === true))
    assert.match(motorMetni(), /ortalama eritrosit hacmi yetmiş dört femtolitre ölçüldü\. difteri aselüler boğmaca tetanos inaktif polio ve Hib aşısı planlı\./)
  })
})

describe('tek geçiş noktası — fishMetni: REST ve soket aynı metni üretir', () => {
  it('REST isteği (selam, yedek, sayfanın kendi okuması) ve soket olayı aynı katmandan geçer', () => {
    const rest = String(fishIstegi(CEVAP)?.govde.text)
    assert.equal(rest, fishMetni(CEVAP))
    assert.equal(rest.replace(/\s*\[break\]\s*/g, ' '), fishWsMetinOlayi(CEVAP)?.text.trim())
    assert.match(rest, /on iki virgül sekiz kilogram/)
    assert.match(rest, /\[break\]/)
    assert.match(String(fishIstegi(CEVAP, { detay: true })?.govde.text), /inaktif polio ve Hib aşısı/)
    assert.match(String(fishWsMetinOlayi('KPA yapıldı.', { detay: false })?.text), /^konjuge pnömokok aşısı yapıldı\. $/)
  })

  it('sabit sözler de aynı noktadan geçer ve bozulmaz', () => {
    for (const soz of ['Merhaba Hocam, ben Ayşe.', 'Sizi tam anlayamadım, tekrar söyler misiniz?', 'Şu an cevap veremiyorum Hocam.', 'Tabloyu ekranınıza yazdım.', 'Devamı ekranınızda Hocam.']) {
      assert.equal(fishMetni(soz), soz)
    }
    assert.equal(fishMetni('3 madde, ekranınızda.'), 'üç madde, ekranınızda.')
  })

  it('ekran metni katmandan geçmez: sözlü biçim ekran metninden türetilir, ekran metni aynı kalır', () => {
    const ekran = '**Aşılar**\n\nDaBT-İPA-Hib 2. doz 30.09.2026 tarihinde yapıldı. Kilo 12,8 kg (p50).'
    const once = ekran
    const soz = konusmaYap(ekran)
    const okunus = fishMetni(soz)
    assert.equal(ekran, once)
    assert.match(soz, /DaBT-İPA-Hib 2\. doz 30\.09\.2026/, 'söz metni (döküm) kısaltmayı korur')
    assert.match(okunus, /beşli karma aşı ikinci doz otuz Eylül iki bin yirmi altı tarihinde yapıldı/)
    assert.match(okunus, /on iki virgül sekiz kilogram \(yüzdelik elli\)/)
  })
})
