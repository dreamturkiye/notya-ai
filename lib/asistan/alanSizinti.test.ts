/**
 * NOTYA-AYSE-ALAN-01 — leak test: identity and contact values reach the DOCTOR and never a MODEL.
 *
 * Real routes (/api/asistan/chat, /api/asistan/fish-tur, /api/asistan/ses-ekran) over the in-memory scene. Every
 * request the brain sends to the model is captured whole (system prompt with its cached prefix, history, tool
 * definitions, tool results) over multi-turn conversations on both channels, and searched for every identity value of
 * the fixture. The delivered answer must carry the value; nothing sent to a model, nothing stored, nothing spoken
 * and nothing logged may.
 *
 * The doctor's sentences are ones the identity router does NOT recognise (asserted) — the gap this tool closes. The
 * fake model does what the prompt rule says: it calls hasta_alan for the field asked and writes the placeholder the
 * tool gave it.
 */
import { ortam, sahneHazirla, sahneKur, oturumAc, yazi, fishTur, sonRota, encrypt, aracSonuclari, sunulanAraclar, type Sahne, type SahteArac, type SahteYanit } from './tests/ayseSahne'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { KIMLIK, YABANCI_KIMLIK, kimlikDegerleri, kimlikHastasiEkle } from './tests/kimlikHastasi'
import { kimlikSorusu } from '../doktor/kimlikSorusu'

const TZ = 'Europe/Istanbul'
let sesEkran: { GET: (r: any) => Promise<Response> }
let Istek: typeof import('next/server').NextRequest

before(async () => {
  await sahneHazirla()
  Istek = (await import('next/server')).NextRequest
  sesEkran = await import('../../app/api/asistan/ses-ekran/route')
})

type Kurulum = { s: Sahne; hasta: string; yabanci: string }
function kur(): Kurulum {
  const s = sahneKur()
  return { s, hasta: kimlikHastasiEkle(ortam.db, encrypt, s.doktor.id), yabanci: kimlikHastasiEkle(ortam.db, encrypt, s.diger.id, YABANCI_KIMLIK) }
}

async function ekranTurlari(s: Sahne, oturum: string, token = s.doktor.token): Promise<{ status: number; metinler: string[] }> {
  const y = await sesEkran.GET(new Istek(`http://localhost/api/asistan/ses-ekran?oturum=${oturum}`, { headers: { authorization: `Bearer ${token}` } } as ConstructorParameters<typeof Istek>[1]))
  const j = await y.json()
  return { status: y.status, metinler: ((j.turlar || []) as { metin: string }[]).map((t) => String(t.metin)) }
}

const alan = (ad: string, hastaAdi?: string): SahteArac => ({ name: 'hasta_alan', input: { alan: ad, ...(hastaAdi ? { hasta_adi: hastaAdi } : {}) } })
const YER = /\{\{ALAN:[^}]+\}\}/g

/** A model that follows the rule: call hasta_alan, then write the placeholder(s) the tool returned into a sentence. */
function alanSoran(cagrilar: SahteArac[], cumle: (yerler: string[]) => string): (istek: Record<string, any>) => SahteYanit {
  return (istek) => {
    const sonuclar = aracSonuclari({ stream: false, govde: istek })
    if (!sonuclar.length) return { metin: '', araclar: cagrilar }
    return { metin: JSON.stringify({ speech: cumle(sonuclar.flatMap((r) => r.match(YER) || [])) }) }
  }
}

/** Everything that left for a model in this scene, as one string: system (cached prefix included), messages, tools. */
const modeleGiden = (): string => JSON.stringify(ortam.modelIstekleri)
const saklanan = (oturum: string): string => JSON.stringify(ortam.db.tablo('asistan_sessions').find((x) => x.id === oturum) || {})
const tablo = (ad: string): string => JSON.stringify(ortam.db.tablo(ad))

function degerYok(metin: string, nerede: string, k = KIMLIK): void {
  for (const d of kimlikDegerleri(k)) assert.ok(!metin.includes(d), `SIZINTI — ${nerede}: ${d}`)
}

type Tur = { soz: string; model: (istek: Record<string, any>) => SahteYanit; teslim: (string | RegExp)[]; rota?: string }
const HITAP = (y: string[]) => `Hocam, annesinin adı ${y[0]}.`

/** The conversation, with the patient named in the first sentence (`adli`) or with the chart already open. */
function konusma(adli: boolean): Tur[] {
  const ad = adli ? KIMLIK.ad : undefined
  return [
    { soz: adli ? `${KIMLIK.ad}’nin annesine nasıl hitap edeyim?` : 'Annesine nasıl hitap edeyim?', model: alanSoran([alan('anne_adi', ad)], HITAP), teslim: [`annesinin adı ${KIMLIK.annesi}.`] },
    { soz: 'Peki babasına nasıl hitap edeyim?', model: alanSoran([alan('baba_adi')], (y) => `Babasının adı ${y[0]}.`), teslim: [`Babasının adı ${KIMLIK.babasi}.`] },
    { soz: 'Bu aile nerede oturuyor, çocuk hangi şehirde dünyaya gelmiş?', model: alanSoran([alan('adres'), alan('dogum_yeri')], (y) => `Oturdukları yer: ${y[0]}. Doğduğu yer: ${y[1]}.`), teslim: [`${KIMLIK.adres}, ${KIMLIK.il}`, KIMLIK.dogumYeri] },
    { soz: 'Aileye hangi numaradan ulaşırım, kiminle konuşacağım?', model: alanSoran([alan('telefon'), alan('veli')], (y) => `Kayıtlı numara ${y[0]}. Yasal temsilci: ${y[1]}.`), teslim: [KIMLIK.telefon, `${KIMLIK.veliAd} ${KIMLIK.veliSoyad} (Anne) — ${KIMLIK.veliTelefon}`] },
    { soz: 'Yazılı olarak aileye nereden ulaşırım?', model: alanSoran([alan('eposta')], (y) => `${y[0]}`), teslim: [/E-posta kayıtlı değil — hasta dosyasında Özet › Demografik bilgiler › Düzenle’den ekleyebilirsiniz\./] },
    // The identity router's own sentence, in the middle of the conversation: the fast path is untouched.
    { soz: `${KIMLIK.ad} annesinin adı ne?`, model: () => ({ metin: JSON.stringify({ speech: 'kullanılmaz' }) }), teslim: [`Anne adı: ${KIMLIK.annesi}`], rota: 'kimlik' },
    // A clinical question after all of it: the history the model now reads holds placeholders, not values.
    { soz: 'Bu tabloyu bir sonraki görüşmede aileye nasıl anlatmalıyım sence?', model: () => ({ metin: JSON.stringify({ speech: `${KIMLIK.ad} için son muayenedeki öksürük ve burun akıntısı tablosunu aileye sade bir dille anlatabilirsiniz Hocam.` }) }), teslim: [/öksürük ve burun akıntısı/] },
    // A model that copies an old placeholder without asking the tool again: not issued in this turn → removed.
    { soz: 'O hanımefendiye nasıl hitap edecektim, bir daha söyler misin?', model: () => ({ metin: JSON.stringify({ speech: 'Annesinin adı {{ALAN:anne_adi}} olarak kayıtlı Hocam.' }) }), teslim: [/^Annesinin adı olarak kayıtlı Hocam\.$/] },
  ]
}

describe('hekimin cümleleri kimlik yönlendiricisinin tanımadığı cümleler (kapanan boşluk)', () => {
  it('yönlendirici bu cümlelerde alan bulmuyor; kendi cümlesini buluyor', () => {
    for (const t of konusma(true)) assert.equal(kimlikSorusu(t.soz).length > 0, t.rota === 'kimlik', t.soz)
  })
})

for (const adli of [true, false]) {
  const durum = adli ? 'dosya kapalı (hasta adıyla)' : 'dosya açık'

  describe(`yazı, ${durum}: değer hekime gider, modele gitmez`, () => {
    it('çok turlu konuşma — her turda teslim edilen cevapta değer var; hiçbir model isteğinde, saklanan oturumda, günlükte yok', async () => {
      const k = kur()
      const oturum = adli ? oturumAc(k.s) : oturumAc(k.s, { id: k.hasta, ad: KIMLIK.ad })
      for (const [i, t] of konusma(adli).entries()) {
        ortam.yanit = t.model
        const once = ortam.modelIstekleri.length
        const y = await yazi(k.s, t.soz, { oturum, saatDilimi: TZ })
        assert.equal(y.rota, t.rota || 'model', `tur ${i + 1} rota (${t.soz})`)
        for (const d of t.teslim) typeof d === 'string' ? assert.ok(y.speech.includes(d), `tur ${i + 1}: teslim edilen cevapta "${d}" yok → ${y.speech}`) : assert.match(y.speech, d, `tur ${i + 1}`)
        assert.ok(!/\{\{|\}\}/.test(y.speech), `tur ${i + 1}: hekime yer tutucu gitti → ${y.speech}`)
        // (Background learning calls of earlier turns land in the same capture — they are searched for values too.)
        if (!t.rota) assert.ok(ortam.modelIstekleri.slice(once).some((r) => sunulanAraclar(r).includes('hasta_alan')), `tur ${i + 1}: hasta_alan sunuldu`)
        degerYok(modeleGiden(), `tur ${i + 1} sonrası model istekleri`)
      }
      // The model did read the placeholder form of earlier answers (the test is not vacuous).
      assert.ok(modeleGiden().includes('Hocam, annesinin adı {{ALAN:anne_adi}}.'), 'geçmiş modele yer tutuculu biçimde gitti')
      assert.ok(ortam.modelIstekleri.some((r) => aracSonuclari(r).join(' ').includes('{{ALAN:anne_adi}}')), 'araç sonucu yer tutucuyu verdi')
      degerYok(saklanan(oturum), 'saklanan oturum (geçmiş + bağlam)')
      degerYok(tablo('asistan_actions'), 'asistan_actions')
      // Audit rows: field and patient references, no value.
      await new Promise((r) => setTimeout(r, 20))
      const denetim = ortam.db.tablo('audit_logs').filter((r) => r.resource_type === 'hasta_kimlik_alani')
      assert.ok(denetim.length >= 4, 'her değer tesliminde denetim kaydı')
      assert.ok(denetim.every((r) => r.resource_id === k.hasta && r.user_id === k.s.doktor.id && Array.isArray(r.new_values?.alanlar)))
      assert.deepEqual(denetim[0].new_values.alanlar, ['anneAdi'])
      degerYok(JSON.stringify(denetim), 'denetim kaydı')
    })
  })

  describe(`ses, ${durum}: değer ekrana gider; modele gitmez, söylenmez`, () => {
    it('çok turlu konuşma — ekran biçiminde değer var; model isteklerinde, söylenen metinde, saklanan oturumda yok', async () => {
      const k = kur()
      const oturum = adli ? oturumAc(k.s) : oturumAc(k.s, { id: k.hasta, ad: KIMLIK.ad })
      const turlar = konusma(adli)
      const sozler: string[] = []
      for (const [i, t] of turlar.entries()) {
        ortam.yanit = t.model
        const v = await fishTur(k.s, t.soz, { oturum, saatDilimi: TZ })
        assert.equal(v.status, 200)
        assert.equal(v.hata, null, `tur ${i + 1}`)
        assert.equal(sonRota(), t.rota || 'model', `tur ${i + 1} rota (${t.soz})`)
        sozler.push(v.soz)
        const ekran = (await ekranTurlari(k.s, oturum)).metinler.at(-1) || ''
        for (const d of t.teslim) typeof d === 'string' ? assert.ok(ekran.includes(d), `tur ${i + 1}: ekranda "${d}" yok → ${ekran}`) : assert.match(ekran, d, `tur ${i + 1}`)
        assert.ok(!/\{\{|\}\}/.test(ekran + v.soz), `tur ${i + 1}: yer tutucu hekime gitti → ${ekran} / ${v.soz}`)
        degerYok(modeleGiden(), `tur ${i + 1} sonrası model istekleri`)
        // Spoken text is what goes to the speech provider: no identity value in it, as on the identity router's path.
        degerYok(v.soz, `tur ${i + 1} söylenen metin`)
      }
      assert.match(sozler[0], new RegExp(`${KIMLIK.ad} için istediğiniz bilgiyi ekranınıza yazdım Hocam`))
      // A missing field carries no value: its "where to add it" sentence is spoken.
      assert.match(sozler[4], /E-posta kayıtlı değil/)
      degerYok(saklanan(oturum), 'saklanan oturum (geçmiş + bağlam + okunmamış kalan)')
      degerYok(tablo('asistan_actions'), 'asistan_actions')
    })
  })
}

describe('başka hekimin hastası: hiçbir şey dönmez', () => {
  for (const kanal of ['yazi', 'ses'] as const) {
    for (const acik of [false, true]) {
      it(`${kanal}, dosya ${acik ? 'açık' : 'kapalı'}: yabancı hastanın alanı sorulur — değer yok, yer tutucu yok, açık dosyanın değeri de verilmez`, async () => {
        const k = kur()
        const oturum = acik ? oturumAc(k.s, { id: k.hasta, ad: KIMLIK.ad }) : oturumAc(k.s)
        const soz = `${YABANCI_KIMLIK.ad}’in annesine nasıl hitap edeyim, hangi numaradan ulaşırım?`
        // The model also tries to write a placeholder the tool never gave it.
        ortam.yanit = (istek) => {
          const sonuclar = aracSonuclari({ stream: false, govde: istek })
          if (!sonuclar.length) return { metin: '', araclar: [alan('anne_adi', YABANCI_KIMLIK.ad), alan('telefon', YABANCI_KIMLIK.ad)] }
          return { metin: JSON.stringify({ speech: `Hocam, ${sonuclar.join(' ')} Annesinin adı {{ALAN:anne_adi}}, telefonu {{ALAN:telefon}}.` }) }
        }
        const cevap = kanal === 'yazi' ? (await yazi(k.s, soz, { oturum, saatDilimi: TZ })).speech : (await fishTur(k.s, soz, { oturum, saatDilimi: TZ })).soz
        const ekran = kanal === 'ses' ? (await ekranTurlari(k.s, oturum)).metinler.join('\n') : ''
        const hepsi = [cevap, ekran, saklanan(oturum), modeleGiden()].join('\n')
        degerYok(hepsi, 'yabancı hastanın değeri', YABANCI_KIMLIK)
        degerYok(hepsi, 'açık dosyanın değeri yabancı adın yerine verildi')
        assert.ok(!hepsi.includes(k.yabanci), 'yabancı hastanın kimliği')
        assert.ok(aracSonuclari(ortam.modelIstekleri.at(-1) ?? null).every((r) => r === 'Bu hastayı kayıtlarınızda bulamadım.'), 'araç: bulunamadı — yer tutucu vermedi')
        assert.ok(!/\{\{|\}\}/.test(cevap + ekran), 'verilmeyen yer tutucu silindi')
        assert.equal(ortam.db.tablo('audit_logs').filter((r) => r.resource_type === 'hasta_kimlik_alani').length, 0)
      })
    }
  }

  it('araç doğrudan: yabancı hastanın adı, kimsenin olmayan adla aynı sonucu verir; sahibi için çalışır', async () => {
    const { okumaAraciCalistir } = await import('./okumaAraclari')
    const { AlanDefteri } = await import('./hastaAlan')
    const k = kur()
    const b = (doktorId: string) => ({ supabase: ortam.db.istemci() as never, doktorId, saatDilimi: TZ, aktifHasta: null, alanDefteri: new AlanDefteri() })
    const yabanci = await okumaAraciCalistir('hasta_alan', { alan: 'anne_adi', hasta_adi: YABANCI_KIMLIK.ad }, b(k.s.doktor.id))
    const olmayan = await okumaAraciCalistir('hasta_alan', { alan: 'anne_adi', hasta_adi: 'Bartu Hiçyokoğlu' }, b(k.s.doktor.id))
    assert.equal(yabanci.sonuc, olmayan.sonuc)
    assert.equal(yabanci.hasta ?? null, null)
    const sahibi = await okumaAraciCalistir('hasta_alan', { alan: 'anne_adi', hasta_adi: YABANCI_KIMLIK.ad }, b(k.s.diger.id))
    assert.equal(sahibi.hasta?.id, k.yabanci)
    assert.ok(sahibi.sonuc.includes('{{ALAN:anne_adi}}') && !sahibi.sonuc.includes(YABANCI_KIMLIK.annesi), 'sahibine de değer değil yer tutucu döner')
    // The open patient's id is re-checked: a foreign id handed in as "open chart" reads nothing.
    const sahteAcik = await okumaAraciCalistir('hasta_alan', { alan: 'anne_adi' }, { ...b(k.s.doktor.id), aktifHasta: { id: k.yabanci, ad: YABANCI_KIMLIK.ad } })
    assert.ok(!sahteAcik.sonuc.includes('{{ALAN') && (sahteAcik.hasta ?? null) === null)
  })

  it('ses-ekran: oturuma yabancı hastayı gösteren bir başvuru yazılmış olsa bile değer okunmaz; başka hekim oturumu okuyamaz', async () => {
    const k = kur()
    const oturum = ortam.db.ekle('asistan_sessions', {
      doctor_id: k.s.doktor.id, persona_id: 'aysekaya', active_context: { specialty: 'pediatri' },
      messages: [
        { role: 'user', content: 'soru', kanal: 'ses', zaman: '2026-10-02T08:00:00.000Z' },
        { role: 'assistant', content: 'Annesinin adı {{ALAN:anne_adi}}.', kanal: 'ses', zaman: '2026-10-02T08:00:01.000Z', alanlar: [{ anahtar: 'anne_adi', alan: 'anneAdi', hastaId: k.yabanci }] },
        { role: 'user', content: 'soru', kanal: 'ses', zaman: '2026-10-02T08:01:00.000Z' },
        { role: 'assistant', content: 'Annesinin adı {{ALAN:anne_adi}}.', kanal: 'ses', zaman: '2026-10-02T08:01:01.000Z', alanlar: [{ anahtar: 'anne_adi', alan: 'anneAdi', hastaId: k.hasta }] },
      ],
    }).id as string
    const kendi = await ekranTurlari(k.s, oturum)
    assert.deepEqual(kendi.metinler, ['Annesinin adı.', `Annesinin adı ${KIMLIK.annesi}.`])
    const baskasi = await ekranTurlari(k.s, oturum, k.s.diger.token)
    assert.equal(baskasi.status, 404)
  })
})
