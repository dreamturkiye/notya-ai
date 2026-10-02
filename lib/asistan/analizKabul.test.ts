/**
 * NOTYA-AYSE-ANALIZ-01 — acceptance: analysis across a patient's visits, with the same source as the Fısıltı whispers.
 *
 * Real routes (/api/asistan/chat, /api/asistan/fish-tur) over the in-memory scene, chat and voice, chart open and
 * closed, with the read routers stubbed to null (NOTYA_HIZLI_YOL_KAPALI=1): the only way to the answer is the model
 * and its read tools. The patient is synthetic: four approved visits and four deliberate gaps (a missed vaccine, a
 * visit without weight, a follow-up never scheduled, a lab asked and never resulted — tests/dortMuayeneHastasi.ts).
 *
 * "What Fısıltı reports" is taken from the REAL whisper route, GET /api/doktor/fisilti, which fetches the branch's
 * kohort route over HTTP; here that fetch is delivered to the real kohort handler in process. The tool's Fısıltı
 * section must be exactly that card.
 *
 * The other doctor has a patient with the same four visits under another name and marked drug / test names. None of
 * it may reach an answer, a tool result or a model request.
 */
import { ortam, sahneHazirla, sahneKur, oturumAc, yazi, fishTur, sonRota, sonAsistanMesaji, sunulanAraclar, aracSonuclari, aracCagiranModel, encrypt, type Sahne, type SahteArac } from './tests/ayseSahne'
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { dortMuayeneHastasiEkle, DORT_MUAYENE_ADI as AD, DORT_MUAYENE_ILAC as ILAC, type DortMuayene } from './tests/dortMuayeneHastasi'
import { OKUMA_ARACLARI } from './okumaAraclari'

const TZ = 'Europe/Istanbul'
const YABANCI = { ad: 'Kerem Uzaklı', ilac: 'GIZLI-İlaç-Zinnat', tetkik: 'GIZLI-Tetkik' }

let Istek: typeof import('next/server').NextRequest
let fisiltiRota: { GET: (r: any) => Promise<Response> }
const sahneFetch = globalThis.fetch

before(async () => {
  await sahneHazirla()
  Istek = (await import('next/server')).NextRequest
  fisiltiRota = await import('../../app/api/doktor/fisilti/route')
  const kohortRota = await import('../../app/api/doktor/pediatri/kohort/route')
  const mesajRota = await import('../../app/api/doktor/mesajlar/route')
  // Fısıltı's own data path: a same-origin fetch to the branch kohort route (and to the unread-messages route).
  // Both are delivered to the real handlers; anything else still hits the scene's "no network" guard.
  globalThis.fetch = (async (g: unknown, o?: RequestInit) => {
    const url = g instanceof URL ? g.href : typeof g === 'string' ? g : String((g as { url?: string })?.url || g)
    const istek = () => new Istek(url, { headers: o?.headers as Record<string, string> } as ConstructorParameters<typeof Istek>[1])
    if (url.includes('/api/doktor/pediatri/kohort')) return kohortRota.GET(istek())
    if (url.includes('/api/doktor/mesajlar')) return mesajRota.GET(istek())
    return sahneFetch(g as never, o)
  }) as typeof fetch
})
after(() => { globalThis.fetch = sahneFetch })

type Kurulum = { s: Sahne; h: DortMuayene; yabanci: DortMuayene }
function kur(): Kurulum {
  const s = sahneKur()
  return { s, h: dortMuayeneHastasiEkle(ortam.db, encrypt, s.doktor.id), yabanci: dortMuayeneHastasiEkle(ortam.db, encrypt, s.diger.id, YABANCI) }
}

/** The Fısıltı card of a doctor, from the real route. */
async function fisiltiKarti(token: string): Promise<{ patientId: string; baslik: string; detay: string[] } | null> {
  const y = await fisiltiRota.GET(new Istek('http://localhost/api/doktor/fisilti', { headers: { authorization: `Bearer ${token}` } } as ConstructorParameters<typeof Istek>[1]))
  assert.equal(y.status, 200)
  return (await y.json()).item ?? null
}

/** Section A of an `eksikler` tool result: the lines the tool says come from Fısıltı. */
function fisiltiBolumu(sonuc: string): string[] {
  const m = sonuc.match(/A\) FISILTI[^\n]*\n([\s\S]*?)\nB\) /)
  return (m?.[1] || '').split('\n').filter((s) => s.startsWith('- ')).map((s) => s.slice(2))
}

const tekrar = (r: string[]) => `Hocam, ${r.join('\n\n')}`
type Durum = 'acik' | 'yok'
const oturum = (k: Kurulum, d: Durum) => (d === 'acik' ? oturumAc(k.s, { id: k.h.id, ad: AD }) : oturumAc(k.s))
const adla = (d: Durum) => (d === 'yok' ? { hasta_adi: AD } : {})

/** One turn on either channel: the answer the doctor sees (voice: the screen form) and what was spoken. */
async function tur(k: Kurulum, kanal: 'yazi' | 'ses', soz: string, o: string): Promise<{ ekran: string; soz: string }> {
  if (kanal === 'yazi') {
    const y = await yazi(k.s, soz, { oturum: o, saatDilimi: TZ })
    assert.equal(y.rota, 'model')
    return { ekran: y.speech, soz: '' }
  }
  const v = await fishTur(k.s, soz, { oturum: o, saatDilimi: TZ })
  assert.equal(v.status, 200)
  assert.equal(v.hata, null)
  assert.equal(sonRota(), 'model')
  return { ekran: sonAsistanMesaji(o), soz: v.soz }
}

function sizintiYok(metinler: string[], k: Kurulum): void {
  const hepsi = [...metinler, JSON.stringify(ortam.modelIstekleri)].join('\n')
  for (const iz of ['GIZLI', YABANCI.ad, k.yabanci.id]) assert.ok(!hepsi.includes(iz), `SIZINTI: başka hekimin verisi (${iz})`)
}

describe('yönlendiriciler devre dışı: model analiz araçlarıyla doğru cevaba ulaşır', () => {
  before(() => { process.env.NOTYA_HIZLI_YOL_KAPALI = '1' })
  after(() => { delete process.env.NOTYA_HIZLI_YOL_KAPALI })

  for (const kanal of ['yazi', 'ses'] as const) {
    for (const durum of ['acik', 'yok'] as const) {
      const etiket = `${kanal === 'yazi' ? 'yazı' : 'ses'}, dosya ${durum === 'acik' ? 'açık' : 'kapalı'}`

      it(`${etiket} — "hangi muayenesinde ${ILAC} yazıldı": yazıldığı tek muayene, tarihi ve durumu`, async () => {
        const k = kur()
        const o = oturum(k, durum)
        const soz = durum === 'acik' ? `Bu hastanın hangi muayenesinde ${ILAC} yazıldı?` : `${AD} hangi muayenesinde ${ILAC} aldı?`
        ortam.yanit = aracCagiranModel({ name: 'muayene_ara', input: { terim: ILAC, ...adla(durum) } }, tekrar)
        const c = await tur(k, kanal, soz, o)
        assert.deepEqual(sunulanAraclar(ortam.modelIstekleri[0]).filter((a) => OKUMA_ARACLARI.some((x) => x.name === a)), OKUMA_ARACLARI.map((a) => a.name), 'okuma araçları sunuldu')
        assert.equal(ortam.okumaTurlari.length, 1, 'bir araç turu')
        assert.match(c.ekran, new RegExp(`"${ILAC}": 4 onaylı muayenenin 1 tanesinde geçiyor`))
        assert.match(c.ekran, new RegExp(`- ${k.h.tarih[1].replace(/\./g, '\\.')} — 2\\. muayene \\(muayene\\): .*reçete edildi — ${ILAC}`))
        for (const baska of [k.h.tarih[0], k.h.tarih[2], k.h.tarih[3]]) assert.ok(!c.ekran.includes(`- ${baska}`), `yanlış muayene: ${baska}`)
        if (kanal === 'ses') assert.ok(c.soz.includes(k.h.tarih[1]) && /reçete edildi/.test(c.soz), `söylenen cevap: ${c.soz}`)
        sizintiYok([c.ekran, c.soz], k)
      })

      it(`${etiket} — "hangi muayenesinde hemogram istendi": istendiği muayene; durum "istendi", sonuçlandı değil`, async () => {
        const k = kur()
        const o = oturum(k, durum)
        const soz = durum === 'acik' ? 'Bu çocuğa hangi muayenesinde hemogram istemiştim?' : `${AD} için hangi muayenede hemogram istemiştim?`
        ortam.yanit = aracCagiranModel({ name: 'muayene_ara', input: { terim: 'hemogram', ...adla(durum) } }, tekrar)
        const c = await tur(k, kanal, soz, o)
        assert.match(c.ekran, new RegExp(`- ${k.h.tarih[0].replace(/\./g, '\\.')} — 1\\. muayene \\(Sağlam çocuk muayenesi / rutin kontrol\\): not metni — istendi: "Hemogram ve ferritin istendi`))
        assert.ok(!/sonuçlandı/.test(c.ekran.split('Durumlar kayıttaki')[0]), 'istenen tetkik sonuçlanmış gibi yazılmadı')
        sizintiYok([c.ekran, c.soz], k)
      })

      it(`${etiket} — "son 4 muayeneden sonra eksikler var mı, nelerdir": dört eksik de cevapta; Fısıltı bölümü Fısıltı kartının aynısı`, async () => {
        const k = kur()
        const o = oturum(k, durum)
        const soz = durum === 'acik' ? 'Son 4 muayeneden sonra eksikler var mı, nelerdir?' : `${AD} için son 4 muayeneden sonra eksikler var mı, nelerdir?`
        const cagrilar: SahteArac[] = [{ name: 'eksikler', input: { ...adla(durum) } }, { name: 'muayeneleri_oku', input: { adet: 4, ...adla(durum) } }]
        ortam.yanit = aracCagiranModel(cagrilar, tekrar)
        const c = await tur(k, kanal, soz, o)
        assert.equal(ortam.okumaTurlari.length, 1, 'iki araç tek turda')
        const sonuclar = aracSonuclari(ortam.modelIstekleri.find((r) => aracSonuclari(r).length) ?? null)
        assert.equal(sonuclar.length, 2)

        // The same source as the whispers: section A is the Fısıltı card of this patient, line for line.
        const kart = await fisiltiKarti(k.s.doktor.token)
        assert.ok(kart, 'Fısıltı bu hasta için bir kart üretiyor (vaka boşa koşmuyor)')
        assert.equal(kart.patientId, k.h.id)
        assert.ok(kart.detay.length >= 1)
        assert.deepEqual(fisiltiBolumu(sonuclar[0]), kart.detay, 'araçtaki Fısıltı bölümü ≠ Fısıltı kartı')
        for (const d of kart.detay) assert.ok(c.ekran.includes(`- ${d}`), `Fısıltı satırı cevapta yok: ${d}`)

        // The four deliberate gaps, each from the place that owns it.
        assert.match(c.ekran, /- Aşı: Hep B 3\. doz \(/, '1) kaçan aşı — Fısıltı')
        assert.match(c.ekran, new RegExp(`Ölçüm kaydı olmayan muayeneler: kilo — ${k.h.tarih[2].replace(/\./g, '\\.')};`), '2) kilosuz muayene — muayene dökümü')
        assert.match(c.ekran, new RegExp(`- Kontrol \\d{2}\\.\\d{2}\\.\\d{4} için planlanmıştı \\(${k.h.tarih[3].replace(/\./g, '\\.')} notu: "1 ay sonra kontrol"\\); sonraki vizit kaydı yok — pencere (\\d+ gün önce doldu|bugün doluyor)\\.`), '3) planlanıp verilmeyen kontrol — açık işler')
        assert.match(c.ekran, new RegExp(`- Ferritin — istendi, sonuç yok \\(istem: ${k.h.tarih[0].replace(/\./g, '\\.')}`), '4) istenip sonuçlanmayan tetkik — açık işler')
        assert.match(c.ekran, new RegExp(`### 3\\. muayene — ${k.h.tarih[2].replace(/\./g, '\\.')}[\\s\\S]*?Ölçümler: kilo: kayıt yok`))

        // The divergence, pinned: Fısıltı has a rule for the vaccine only. The other three are not Fısıltı rules today;
        // if one becomes a rule, this fails and section B must stop repeating it.
        const kartMetni = kart.detay.join(' | ')
        assert.match(kartMetni, /Aşı: Hep B 3\. doz/)
        assert.ok(!/hemogram|ferritin|tetkik|sonuç/i.test(kartMetni), 'Fısıltı artık istenip sonuçlanmayan tetkiği de söylüyor')
        assert.ok(!/kilo|ölçüm/i.test(kartMetni), 'Fısıltı artık kilosuz muayeneyi de söylüyor')
        assert.ok(!/1 ay sonra kontrol|randevu/i.test(kartMetni), 'Fısıltı artık planlanıp verilmeyen kontrolü de söylüyor')
        if (kanal === 'ses') assert.ok(/eksikler ve açık işler/.test(c.soz), `söylenen cevap: ${c.soz}`)
        sizintiYok([c.ekran, c.soz], k)
      })
    }
  }
})

describe('istem: analiz kuralları model isteğinde, araçlarla birlikte', () => {
  it('okuma araçlarının sunulduğu turda kural bloğu üç aracı adıyla söyler', async () => {
    const k = kur()
    ortam.yanit = { metin: JSON.stringify({ speech: 'Sentetik yanıt.' }) }
    process.env.NOTYA_HIZLI_YOL_KAPALI = '1'
    try { await yazi(k.s, 'Son 4 muayeneden sonra eksikler var mı, nelerdir?', { oturum: oturum(k, 'acik'), saatDilimi: TZ }) } finally { delete process.env.NOTYA_HIZLI_YOL_KAPALI }
    const sistem = JSON.stringify(ortam.modelIstekleri[0].govde.system)
    assert.ok(sistem.includes('MUAYENELER ARASI ANALİZ'))
    for (const a of ['muayene_ara', 'muayeneleri_oku', 'eksikler']) assert.ok(sistem.includes(a) && sunulanAraclar(ortam.modelIstekleri[0]).includes(a), a)
  })
})

describe('başka hekimin hastası analiz araçlarıyla da okunamaz', () => {
  before(() => { process.env.NOTYA_HIZLI_YOL_KAPALI = '1' })
  after(() => { delete process.env.NOTYA_HIZLI_YOL_KAPALI })

  for (const kanal of ['yazi', 'ses'] as const) {
    for (const durum of ['acik', 'yok'] as const) {
      it(`${kanal}, dosya ${durum === 'acik' ? 'açık' : 'kapalı'}: yabancı hastanın adıyla üç araç — üçü de "bulunamadı"; açık dosya onun yerine okunmaz`, async () => {
        const k = kur()
        const o = oturum(k, durum)
        const soz = `${YABANCI.ad}’nın hangi muayenesinde ${YABANCI.ilac} yazıldı, eksikleri neler?`
        ortam.yanit = aracCagiranModel([
          { name: 'muayene_ara', input: { terim: YABANCI.ilac, hasta_adi: YABANCI.ad } },
          { name: 'muayeneleri_oku', input: { adet: 4, hasta_adi: YABANCI.ad } },
          { name: 'eksikler', input: { hasta_adi: YABANCI.ad } },
        ], tekrar)
        const c = kanal === 'yazi' ? (await yazi(k.s, soz, { oturum: o, saatDilimi: TZ })).speech : (await fishTur(k.s, soz, { oturum: o, saatDilimi: TZ })).soz
        const sonuclar = aracSonuclari(ortam.modelIstekleri.find((r) => aracSonuclari(r).length) ?? null)
        assert.deepEqual(sonuclar, Array(3).fill('Bu hastayı kayıtlarınızda bulamadım.'))
        const hepsi = [c, sonAsistanMesaji(o), JSON.stringify(ortam.modelIstekleri.map((r) => r.govde.messages))].join('\n')
        for (const iz of ['GIZLI-Tetkik', k.yabanci.id, 'eksikler ve açık işler', 'onaylı muayenenin']) assert.ok(!hepsi.includes(iz), `SIZINTI / yanlış dosya: ${iz}`)
      })
    }
  }

  it('araç doğrudan: yabancı hastanın adı kimsenin olmayan adla aynı sonucu verir; sahibi için çalışır; kendi dosyasında yabancı ilaç "geçmiyor"', async () => {
    const { okumaAraciCalistir } = await import('./okumaAraclari')
    const k = kur()
    const b = (doktorId: string, aktif: { id: string; ad: string } | null = null) => ({ supabase: ortam.db.istemci() as never, doktorId, saatDilimi: TZ, aktifHasta: aktif })
    for (const [ad, g] of [['muayene_ara', { terim: YABANCI.ilac }], ['muayeneleri_oku', { adet: 4 }], ['eksikler', {}]] as const) {
      const yabanci = await okumaAraciCalistir(ad, { ...g, hasta_adi: YABANCI.ad }, b(k.s.doktor.id))
      const olmayan = await okumaAraciCalistir(ad, { ...g, hasta_adi: 'Bartu Hiçyokoğlu' }, b(k.s.doktor.id))
      assert.equal(yabanci.sonuc, olmayan.sonuc, ad)
      assert.equal(yabanci.hasta ?? null, null)
      const sahibi = await okumaAraciCalistir(ad, { ...g, hasta_adi: YABANCI.ad }, b(k.s.diger.id))
      assert.equal(sahibi.hasta?.id, k.yabanci.id, `${ad}: sahibi için çalışır`)
      // A foreign id handed in as the "open chart" is re-checked and reads nothing.
      const sahteAcik = await okumaAraciCalistir(ad, g, b(k.s.doktor.id, { id: k.yabanci.id, ad: YABANCI.ad }))
      assert.equal(sahteAcik.hasta ?? null, null, `${ad}: yabancı açık dosya okunmadı`)
      assert.ok(!sahteAcik.sonuc.includes('GIZLI'))
    }
    const kendi = await okumaAraciCalistir('muayene_ara', { terim: YABANCI.ilac }, b(k.s.doktor.id, { id: k.h.id, ad: AD }))
    assert.match(kendi.sonuc, /hiçbirinde ve diğer kayıtlarda geçmiyor/)
    // Fısıltı for the other doctor's patient is that doctor's card, never this doctor's.
    const kendiKart = await fisiltiKarti(k.s.doktor.token), digerKart = await fisiltiKarti(k.s.diger.token)
    assert.equal(kendiKart?.patientId, k.h.id)
    assert.equal(digerKart?.patientId, k.yabanci.id)
  })
})
