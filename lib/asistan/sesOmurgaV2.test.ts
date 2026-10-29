/**
 * SES-OMURGA-V2 (Kaan, 2026-10-29) — regression tests that replay Dr. Gökhan's 10-25 / 10-26 failure patterns
 * STRUCTURALLY, through the real ElevenLabs Custom-LLM route (/api/asistan/ses-llm) and the real brain (ayseCevapla),
 * against the in-memory database and a fake model. Synthetic QA data only — no real patient, no clinical record.
 *
 * Required in CI (ses-omurga-kilidi.mdc v2): one brain per utterance, no whitespace-only replies, first chunk ≤ 300 ms
 * on the synthetic path, and the fast-path correctness cases below.
 */
import { ortam, sahneHazirla, sahneKur, hastaEkle, oturumAc, elTur, yazi, sonRota, sonModelIstegi, sistemde, zorlananArac, sunulanAraclar, type Sahne } from './tests/ayseSahne'
import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { komutNiyetiBul } from './komutNiyeti'
import { dosyaSoruCevap, bosKart } from '../doktor/hastaDosyaKart'
import { asiSozuVarMi, cevapReddiMi, eylemDurumuSorusuMu, genelTibbiSoruMu } from './soruNiyeti'
import { sesOnKapisi } from './sesTurKapisi'
import { sesTuruKarsila, sesTurKayitlariniSil } from './sesTurYoneticisi'
import { SES_TAMPON } from './sesLlm'
import { LISTE_TEKLIF } from './konusma'

const AD = 'QA Çocuk Sentetik'
const YAZMA_ARACLARI = /_ekle$|_kaldir$|_sonlandir$|_degistir$|_olustur$|_tasi$|_iptal$|_duzelt$/

let s: Sahne
let hasta: string
let acikOturum: string

before(async () => { await sahneHazirla() })
beforeEach(() => {
  s = sahneKur()
  hasta = hastaEkle(s.doktor.id, AD, { dogum: '2023-01-10' })
  acikOturum = oturumAc(s, { id: hasta, ad: AD })
  sesTurKayitlariniSil()
  ortam.modelIstekleri.length = 0
  ortam.rotalar.length = 0
  ortam.yanit = { metin: JSON.stringify({ speech: 'Hocam, genel bilgi olarak doz kilo başına hesaplanır.' }) }
})

const oturumMesajlari = (id: string) => ((ortam.db.tablo('asistan_sessions').find((x) => x.id === id)?.messages as { role: string; content: string }[]) || [])

describe('B — router correctness (pure)', () => {
  it('the vaccine word is whole-word and Turkish-folded; "asit" / "asistan" / "Aşı hocam" are not it', () => {
    for (const m of ['aşı', 'Aşıları tam mı?', 'aşısı yapıldı mı', 'aşılarını göster']) assert.ok(asiSozuVarMi(m), m)
    for (const m of ['klavulanik asit dozu', 'asistan', 'Aşı hocam bir sorum var', 'folik asit']) assert.ok(!asiSozuVarMi(m), m)
  })
  it('the quick card does not answer a general dose question, an address, or an action-status question', () => {
    const k = bosKart()
    assert.equal(dosyaSoruCevap('Amoksisilin klavulanik asit dozu kilo başına ne kadar?', k), null)
    assert.equal(dosyaSoruCevap('Aşı hocam, amoksisilin klavulanik asit dozunu söyler misin rica ediyorum', k), null)
    assert.equal(dosyaSoruCevap('Randevuyu takvime koydun mu?', k), null)
    assert.equal(dosyaSoruCevap('Bu hastaya randevu verdin mi?', k), null)
    assert.match(dosyaSoruCevap('Aşıları tam mı?', k) || '', /aşı/, 'a real vaccine question still gets the card')
    assert.match(dosyaSoruCevap('Randevusu ne zaman?', k) || '', /randevu/, 'a data question still gets the card')
  })
  it('the command detector never forces a write tool on a question', () => {
    assert.equal(komutNiyetiBul('Aşı hocam, amoksisilin klavulanik asit dozunu söyler misin rica ediyorum'), null)
    assert.equal(komutNiyetiBul('Amoksisilin dozu kilo başına ne kadar?'), null)
    assert.equal(komutNiyetiBul('Randevuyu takvime koydun mu?'), null)
    assert.equal(komutNiyetiBul('Alerjisini ekledin mi?'), null)
    assert.ok(komutNiyetiBul('Penisilin alerjisini ekle'), 'an imperative is still a command')
    assert.ok(komutNiyetiBul('Hepatit B aşısını kaydet'), 'a vaccine record order is still a command')
  })
  it('question kinds', () => {
    assert.ok(genelTibbiSoruMu('Amoksisilin dozu kilo başına ne kadar?'))
    assert.ok(!genelTibbiSoruMu('Bu hastanın kilosuna göre amoksisilin dozu ne olmalı?'))
    assert.ok(eylemDurumuSorusuMu('Randevuyu takvime koydun mu?'))
    assert.ok(cevapReddiMi('Hayır, o hastadan ve aşılarından bahsetmiyorum'))
    assert.ok(!cevapReddiMi('Hayır'), 'a bare "Hayır" is a card decision, not a rejection')
  })
})

describe('B — router correctness through the voice route (chart open)', () => {
  it('antibiotic dose with "klavulanik asit" while a chart is open → model, no vaccine card, no write tool', async () => {
    const v = await elTur(s, 'Amoksisilin klavulanik asit dozu kilo başına ne kadar?', { oturum: acikOturum })
    assert.equal(v.status, 200)
    assert.equal(sonRota(), 'model')
    assert.ok(!asiSozuVarMi(v.metin) && !/dosyada/i.test(v.metin), v.metin)
    const istek = sonModelIstegi()
    assert.equal(zorlananArac(istek), null)
    assert.ok(!sunulanAraclar(istek).some((a) => YAZMA_ARACLARI.test(a)), sunulanAraclar(istek).join(','))
    assert.ok(sistemde(/GENEL TIBBİ SORU/), 'the model is told it is a general question')
  })
  it('"Aşı hocam, …dozu…" → no vaccine card, no forced vaccine-add tool', async () => {
    const v = await elTur(s, 'Aşı hocam, amoksisilin klavulanik asit dozunu söyler misin rica ediyorum', { oturum: acikOturum })
    assert.equal(sonRota(), 'model')
    assert.ok(!asiSozuVarMi(v.metin), v.metin)
    assert.equal(zorlananArac(sonModelIstegi()), null)
    assert.ok(!sunulanAraclar(sonModelIstegi()).includes('asi_kaydi_ekle'))
  })
  it('"randevuyu takvime koydun mu" → model, not the card field', async () => {
    const v = await elTur(s, 'Randevuyu takvime koydun mu?', { oturum: acikOturum })
    assert.equal(sonRota(), 'model')
    assert.ok(ortam.modelIstekleri.length >= 1)
    assert.doesNotMatch(v.metin, /planlanmış randevu yok/)
  })
  it('"o hastadan ve aşılarından bahsetmiyorum" → model (escape hatch), no card', async () => {
    const v = await elTur(s, 'Hayır, o hastadan ve aşılarından bahsetmiyorum', { oturum: acikOturum })
    assert.equal(sonRota(), 'model')
    assert.doesNotMatch(v.metin, /dosyada/i)
    assert.ok(sistemde(/ÖNCEKİ CEVAP İŞE YARAMADI/))
    assert.ok(sistemde(/GENEL TIBBİ SORU/))
  })
  it('the same voice question asked again as a NEW turn bypasses the fast path (escape hatch)', async () => {
    const ilk = await elTur(s, 'Alerjisi var mı?', { oturum: acikOturum })
    assert.notEqual(sonRota(), 'model', 'first time: the quick card answers')
    assert.ok(ilk.metin.trim())
    await elTur(s, 'Alerjisi var mı?', { oturum: acikOturum, gecmis: [{ role: 'user', content: 'Alerjisi var mı?' }, { role: 'assistant', content: ilk.metin }] })
    assert.equal(sonRota(), 'model', 'repeated by the doctor: the model answers')
  })
})

describe('C — noise, pause and echo never reach the brain', () => {
  it('"..." → no model call; skip_turn when the agent offers it, the buffer chunk otherwise', async () => {
    const a = await elTur(s, '...', { tools: ['skip_turn'] })
    assert.deepEqual(a.araclar, ['skip_turn'])
    assert.equal(a.metin, '')
    assert.equal(a.bitis, 'tool_calls')
    const b = await elTur(s, 'eee hmm')
    assert.equal(b.metin, SES_TAMPON)
    assert.equal(ortam.modelIstekleri.length, 0)
  })
  it('the echo of the last spoken text is ignored', async () => {
    const soylenen = 'Hocam amoksisilin için günlük doz kilo başına kırk beş miligramdır ve iki dozda verilir.'
    const v = await elTur(s, 'amoksisilin için günlük doz kilo başına kırk beş miligramdır', { tools: ['skip_turn'], gecmis: [{ role: 'user', content: 'Amoksisilin dozu?' }, { role: 'assistant', content: soylenen }] })
    assert.deepEqual(v.araclar, ['skip_turn'])
    assert.equal(ortam.modelIstekleri.length, 0)
    assert.ok(sesOnKapisi('Evet', soylenen) === null, 'a real short turn passes')
    assert.ok(sesOnKapisi('Peki çocuğun kilosu 12 ise?', soylenen) === null, 'a real follow-up passes')
  })
})

describe('A — one utterance, one brain, latest wins', () => {
  it('a duplicate POST burst (×9 within 2 s) → one brain; every reply carries the answer; none is whitespace-only', async () => {
    ortam.yanit = { gecikmeMs: 400, metin: JSON.stringify({ speech: 'Hocam, ateş için parasetamol kilo başına on beş miligram verilir.' }) }
    const soru = 'Ateş için parasetamol dozu ne kadar?'
    const istekler: Promise<Awaited<ReturnType<typeof elTur>>>[] = []
    for (let i = 0; i < 9; i++) {
      istekler.push(elTur(s, soru, { arkaBekle: false }))
      await new Promise((r) => setTimeout(r, 150))
    }
    const sonuclar = await Promise.all(istekler)
    assert.equal(ortam.modelIstekleri.length, 1, 'one brain')
    for (const r of sonuclar) {
      assert.equal(r.status, 200)
      assert.ok(r.ham.trimEnd().endsWith('data: [DONE]'))
      assert.ok(!r.parcalar.some((p) => p.length > 0 && !p.trim()), 'no whitespace-only content')
      assert.match(r.metin, /parasetamol/, 'the duplicate is served the shared answer')
    }
  })
  it('a growing transcript → the old brain is aborted and the newest request is answered, once in the history', async () => {
    ortam.yanit = (istek) => {
      const son = JSON.stringify(istek.messages?.at(-1)?.content ?? '')
      return son.includes('kilo başına')
        ? { gecikmeMs: 50, metin: JSON.stringify({ speech: 'Hocam, kilo başına günde kırk beş miligram.' }) }
        : { gecikmeMs: 900, metin: JSON.stringify({ speech: 'Eski kısmi cevap.' }) }
    }
    const eski = elTur(s, 'Amoksisilin dozu', { arkaBekle: false })
    await new Promise((r) => setTimeout(r, 200))
    const yeni = await elTur(s, 'Amoksisilin dozu kilo başına ne kadar', { arkaBekle: false })
    const e = await eski
    await (await import('./sesLlm')).sesArkaPlaniBekle()
    assert.match(yeni.metin, /kırk beş/)
    assert.doesNotMatch(e.metin, /Eski kısmi/, 'the superseded request says nothing more')
    const kullanici = oturumMesajlari(s.oturum).filter((m) => m.role === 'user').map((m) => m.content)
    assert.deepEqual(kullanici, ['Amoksisilin dozu kilo başına ne kadar'], 'only the newest request reaches the history')
    assert.ok(!oturumMesajlari(s.oturum).some((m) => /Eski kısmi/.test(m.content)))
  })
  it('a new turn while the previous one has said nothing yet is merged (one utterance split in two)', () => {
    sesTurKayitlariniSil()
    const a = sesTuruKarsila({ cagri: 'qa', turNo: 3, mesaj: 'Amoksisilin klavulanik', simdi: 1000 })
    const b = sesTuruKarsila({ cagri: 'qa', turNo: 4, mesaj: 'asit dozu ne kadar', simdi: 2500 })
    assert.equal(b.karar, 'birlesik')
    assert.equal(b.metin, 'Amoksisilin klavulanik asit dozu ne kadar')
    assert.ok(a.kayit.iptalEdildi)
  })
  it('first chunk ≤ 300 ms on the synthetic path, and the stream always ends with [DONE]', async () => {
    ortam.yanit = { gecikmeMs: 600, metin: JSON.stringify({ speech: 'Hocam, sentetik cevap.' }) }
    const v = await elTur(s, 'Genel bir soru: uyku düzeni nasıl olmalı?')
    assert.ok(v.ilkBaytMs !== null && v.ilkBaytMs <= 300, `first byte ${v.ilkBaytMs} ms`)
    assert.ok(v.ham.trimEnd().endsWith('data: [DONE]'))
  })
})

describe('D — spoken = written', () => {
  it('"oku" reads the stored screen text verbatim (every list item), no model call', async () => {
    const ekran = 'Hocam, bu yaşta takip şöyle:\n- Göz kontrolü\n- İşitme taraması\n- Diş kontrolü\n- Gelişim takibi\n- Beslenme danışmanlığı\nKontrol bir ay sonra.'
    ortam.yanit = { metin: JSON.stringify({ speech: ekran }) }
    const ilk = await elTur(s, 'Genel olarak bu yaşta takip nasıl olmalı?')
    assert.match(ilk.metin, new RegExp(LISTE_TEKLIF.slice(0, 20)), 'a long list is summarised with the offer to read')
    const n = ortam.modelIstekleri.length
    const oku = await elTur(s, 'Yazdığını oku', { gecmis: [{ role: 'user', content: 'Genel olarak bu yaşta takip nasıl olmalı?' }, { role: 'assistant', content: ilk.metin }] })
    assert.equal(ortam.modelIstekleri.length, n, 'no model call')
    for (const m of ['Göz kontrolü', 'İşitme taraması', 'Diş kontrolü', 'Gelişim takibi', 'Beslenme danışmanlığı', 'Kontrol bir ay sonra']) assert.ok(oku.metin.includes(m), `${m} in: ${oku.metin}`)
  })
})

describe('F — append-only history', () => {
  it('two overlapping turns (voice + text) → no lost history', async () => {
    ortam.yanit = { gecikmeMs: 120, metin: JSON.stringify({ speech: 'Sentetik cevap.' }) }
    await Promise.all([
      elTur(s, 'Genel soru bir: uyku nasıl olmalı?'),
      yazi(s, 'Genel soru iki: beslenme nasıl olmalı?'),
    ])
    const kullanici = oturumMesajlari(s.oturum).filter((m) => m.role === 'user').map((m) => m.content).sort()
    assert.deepEqual(kullanici, ['Genel soru bir: uyku nasıl olmalı?', 'Genel soru iki: beslenme nasıl olmalı?'])
    assert.equal(oturumMesajlari(s.oturum).length, 4)
  })
  it('the stored history is no longer cut at 20 messages', async () => {
    const satir = ortam.db.tablo('asistan_sessions').find((x) => x.id === s.oturum)!
    satir.messages = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `eski ${i}` }))
    await yazi(s, 'Genel bir soru: diş çıkarma ne zaman başlar?')
    assert.equal(oturumMesajlari(s.oturum).length, 32)
  })
})
