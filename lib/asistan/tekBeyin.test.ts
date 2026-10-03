/**
 * NOTYA-TEK-BEYIN — yazılı ve sesli Ayşe tek beyin (Kaan, 2026-09-25).
 *
 * 1. Sözlü biçim (saf): liste / tablo / telefon / e-posta / T.C. okunmaz, en fazla 3 cümle, akışlı ve akışsız aynı.
 * 2. Kilitler: sunucu sırrı + imzalı konuşma jetonu; bozuk / süresi geçmiş / başka anahtarla imzalı jeton reddedilir.
 * 3. Gerçek rotalar (sahte Supabase + akış destekli sahte Claude): aynı soru yazı ve ses yolunda AYNI ekranı verir;
 *    kimlik değerleri sözlü biçime hiç girmez; ses ve yazı TEK konuşma ve TEK aktif hasta; sesli kart + "Evet"
 *    dokunuşun omurgasından kaydeder (model çağrılmadan); end_call; bekletme sözü ilk parçadır.
 *
 * Yalnız sentetik QA verisi.
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { adIndeksParcalari, tokenOzeti } from '../doktor/hastaAramaIndeksi'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-tek-beyin-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'
const SIR = 'qa-sentetik-ses-llm-sirri-0123456789abcdef'
process.env.NOTYA_SES_LLM_SECRET = SIR
process.env.NOTYA_SES_JETON_SECRET = 'qa-sentetik-ses-jeton-anahtari-0123456789ab'

let db = new SahteVeritabani()

function indeksle(doctorId: string, patientId: string, adPlaintext: string) {
  for (const parca of adIndeksParcalari(adPlaintext)) db.ekle('patient_search_tokens', { patient_id: patientId, doctor_id: doctorId, token_hash: tokenOzeti(parca) })
}

function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    auth: { getUser: (j?: string) => c().auth.getUser(j) },
    storage: { from: (k: string) => c().storage.from(k) },
    rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a),
  }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}

/** Sahte Claude: `yanit` her testte ayarlanır; stream:true istekte gerçek olay dizisini küçük parçalarla akıtır. */
const modelIstekleri: { stream: boolean; govde: string }[] = []
let yanit: { metin: string; araclar?: { name: string; input: Record<string, unknown> }[]; gecikmeMs?: number; gecikmeSonrasi?: string } = { metin: JSON.stringify({ speech: 'Sentetik yanıt.' }) }
function mesaj() {
  const content: Record<string, unknown>[] = [{ type: 'text', text: yanit.metin }]
  for (const [i, a] of (yanit.araclar || []).entries()) content.push({ type: 'tool_use', id: `toolu_${i}`, name: a.name, input: a.input })
  return { model: 'sahte', content, stop_reason: yanit.araclar?.length ? 'tool_use' : 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }
}
async function* akis() {
  const m = mesaj()
  yield { type: 'message_start', message: { model: 'sahte', usage: { input_tokens: 1 } } }
  yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
  for (let i = 0; i < yanit.metin.length; i += 7) yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: yanit.metin.slice(i, i + 7) } }
  // NOTYA-SES-ERKEN-01: a slow tail — the model keeps writing after a pause (simulates a 30 s+ screen answer).
  if (yanit.gecikmeMs) { await new Promise((r) => setTimeout(r, yanit.gecikmeMs)); for (const t of (yanit.gecikmeSonrasi || '').match(/[^]{1,7}/g) || []) yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t } } }
  yield { type: 'content_block_stop', index: 0 }
  for (const [i, a] of (yanit.araclar || []).entries()) {
    yield { type: 'content_block_start', index: i + 1, content_block: { type: 'tool_use', id: `toolu_${i}`, name: a.name, input: {} } }
    const j = JSON.stringify(a.input)
    yield { type: 'content_block_delta', index: i + 1, delta: { type: 'input_json_delta', partial_json: j.slice(0, 10) } }
    yield { type: 'content_block_delta', index: i + 1, delta: { type: 'input_json_delta', partial_json: j.slice(10) } }
    yield { type: 'content_block_stop', index: i + 1 }
  }
  yield { type: 'message_delta', delta: { stop_reason: m.stop_reason }, usage: { output_tokens: 1 } }
  yield { type: 'message_stop' }
}
class SahteAnthropic {
  messages = {
    create: async (istek: Record<string, unknown>) => {
      modelIstekleri.push({ stream: istek.stream === true, govde: JSON.stringify(istek) })
      return istek.stream === true ? akis() : mesaj()
    },
  }
}
{
  const kok = dirname(require.resolve('@anthropic-ai/sdk'))
  const pkg = JSON.parse(readFileSync(join(kok, 'package.json'), 'utf8')) as Record<string, any>
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.require, pkg.exports?.['.']?.import?.default, pkg.exports?.['.']?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter((x) => typeof x === 'string').map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { defaultExport: SahteAnthropic })
  }
}
mock.module(pathToFileURL(join(__dirname, '../doktor/hizLimiti.ts')).href, { namedExports: { aiKotaKullan: async () => ({ izin: true }), KOTA_MESAJI: 'kota', KOVA_LIMITLERI: {} } })
globalThis.fetch = (async (g: unknown) => { throw new Error(`tek beyin testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

let encrypt: (s: string) => string
let NextRequestSinifi: typeof import('next/server').NextRequest
let K: typeof import('./konusma')
let Y: typeof import('./yanitCoz')
let J: typeof import('./sesJetonu')
let L: typeof import('./sesLlm')
let R: Record<string, any>

const ANNE = 'QA-Anne-Nermin'
const BABA = 'QA-Baba-Kemal'
const TEL = '0532 700 11 22'

type Sahne = { doktor: { id: string; token: string }; diger: { id: string; token: string }; hasta: string; oturum: string }

function sahne(): Sahne {
  db = new SahteVeritabani()
  modelIstekleri.length = 0
  yanit = { metin: JSON.stringify({ speech: 'Sentetik yanıt.' }) }
  const kullanici = () => { const id = randomUUID(); const token = `qa-${id}`; db.kullanicilar.set(token, { id }); return { id, token } }
  const doktor = kullanici()
  const diger = kullanici()
  db.ekle('users', { id: doktor.id, full_name: 'QA Hekim', specialty: 'pediatri' })
  db.ekle('users', { id: diger.id, full_name: 'QA Hekim 2', specialty: 'pediatri' })
  const hasta = db.ekle('patients', {
    doctor_id: doktor.id, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: 'Umutcan Türkoğlu' })), dob_encrypted: encrypt('2019-04-10'),
    phone_encrypted: encrypt(TEL), email_encrypted: null,
    notes_encrypted: encrypt(JSON.stringify({ anneAdi: ANNE, babaAdi: BABA })),
  }).id
  indeksle(doktor.id, hasta, 'Umutcan Türkoğlu')
  const oturum = db.ekle('asistan_sessions', { doctor_id: doktor.id, persona_id: 'aysekaya', messages: [], active_context: { specialty: 'pediatri' } }).id
  return { doktor, diger, hasta, oturum }
}

function chatIste(token: string, govde: unknown) {
  return new NextRequestSinifi('http://localhost/api/asistan/chat', {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(govde),
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
async function yazi(s: Sahne, message: string, asistanSessionId?: string) {
  const y = await R.chat.POST(chatIste(s.doktor.token, { message, specialty: 'pediatri', ...(asistanSessionId ? { asistanSessionId } : {}) }))
  const j = await y.json()
  assert.equal(y.status, 200, JSON.stringify(j))
  return j.data as { speech: string; asistanSessionId: string; aktifHasta: string | null; eylemOnerileri: unknown[] }
}

type SesYaniti = { status: number; parcalar: string[]; metin: string; ham: string; aracCagrilari: { function: { name: string } }[]; bitis: string | null }
async function ses(g: { sahne: Sahne; mesaj: string; jeton?: string | null; sir?: string | null; tools?: unknown[]; oturum?: string; jetonVeri?: Partial<import('./sesJetonu').SesJetonu> }): Promise<SesYaniti> {
  const jeton = g.jeton !== undefined ? g.jeton : J.sesJetonuImzala({ d: g.sahne.doktor.id, o: g.oturum || g.sahne.oturum, s: 'pediatri', p: null, pe: 'aysekaya', ...(g.jetonVeri || {}) })
  const basliklar: Record<string, string> = { 'content-type': 'application/json' }
  const sir = g.sir !== undefined ? g.sir : SIR
  if (sir) basliklar.authorization = `Bearer ${sir}`
  const req = new NextRequestSinifi('http://localhost/api/asistan/ses-llm/v1/chat/completions', {
    method: 'POST', headers: basliklar,
    body: JSON.stringify({
      model: 'notya-ayse', stream: true, temperature: 0,
      messages: [{ role: 'system', content: 'ElevenLabs ajan promptu' }, { role: 'assistant', content: 'Merhaba Hocam.' }, { role: 'user', content: g.mesaj }],
      ...(g.tools ? { tools: g.tools } : {}),
      elevenlabs_extra_body: jeton === null ? {} : { notya_jeton: jeton },
    }),
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
  const y: Response = await R.sesLlm.POST(req)
  const ham = await y.text()
  const parcalar: string[] = []
  const aracCagrilari: SesYaniti['aracCagrilari'] = []
  let bitis: string | null = null
  if (y.status === 200) {
    assert.match(y.headers.get('content-type') || '', /text\/event-stream/)
    assert.ok(ham.trimEnd().endsWith('data: [DONE]'), 'akış [DONE] ile bitmeli')
    for (const satir of ham.split('\n')) {
      if (!satir.startsWith('data: ') || satir === 'data: [DONE]') continue
      const c = JSON.parse(satir.slice(6)).choices[0]
      if (typeof c.delta.content === 'string') parcalar.push(c.delta.content)
      if (c.delta.tool_calls) aracCagrilari.push(...c.delta.tool_calls)
      if (c.finish_reason) bitis = c.finish_reason
    }
  }
  return { status: y.status, parcalar, metin: parcalar.join(''), ham, aracCagrilari, bitis }
}
async function sesEkrani(s: Sahne, oturum = s.oturum) {
  const y = await R.sesEkran.GET(new NextRequestSinifi(`http://localhost/api/asistan/ses-ekran?oturum=${oturum}`, { headers: { authorization: `Bearer ${s.doktor.token}` } } as ConstructorParameters<typeof NextRequestSinifi>[1]))
  assert.equal(y.status, 200)
  return (await y.json()) as { turlar: { zaman: string; metin: string; soru: string | null; kartlar: string[]; hastaId: string | null; devam: boolean }[]; bekleyen: string[]; aktifHasta: string | null; devam: boolean; devamAnahtar: string | null; devamKalan: string | null }
}

before(async () => {
  ;({ encrypt } = await import('../security/encryption'))
  NextRequestSinifi = (await import('next/server')).NextRequest
  K = await import('./konusma')
  Y = await import('./yanitCoz')
  J = await import('./sesJetonu')
  L = await import('./sesLlm')
  R = {
    chat: await import('../../app/api/asistan/chat/route'),
    sesLlm: await import('../../app/api/asistan/ses-llm/v1/chat/completions/route'),
    sesEkran: await import('../../app/api/asistan/ses-ekran/route'),
    oturumHasta: await import('../../app/api/asistan/oturum-hasta/route'),
  }
})

describe('sözlü biçim — yazılı kadar ayrıntılı, doğal cümleler, kimlik değeri okumaz', () => {
  it('başlık ve maddeler cümle olarak okunur (kısaltılmaz); tablo satırları okunmaz, bir kez "Tabloyu ekranınıza yazdım"', () => {
    const k = K.konusmaYap('Hocam, son üç vizitte öksürük var.\n\n## Muayene\n- Akciğer: temiz\n- Ateş 38.5 derece\n\n**Tedavi:** amoksisilin 500 mg günde 3 kez.\n\n| Tarih | Ateş |\n|---|---|\n| 12.09 | 38.5 |\n---\nKontrol bir hafta sonra.')
    assert.equal(k, `Hocam, son üç vizitte öksürük var. Muayene. Akciğer: temiz. Ateş 38.5 derece. Tedavi: amoksisilin 500 mg günde 3 kez. ${K.TABLO_EKRANDA} Kontrol bir hafta sonra.`)
  })
  it('beş cümlelik cevap tamamen okunur; markdown ve emoji atılır', () => {
    const k = K.konusmaYap('**Birinci** cümle. İkinci cümle. Üçüncü cümle. Dördüncü cümle. Beşinci 😊')
    assert.equal(k, 'Birinci cümle. İkinci cümle. Üçüncü cümle. Dördüncü cümle. Beşinci.')
    assert.equal(K.konusmaYap('Ateş 38.5 derece. Tamam.'), 'Ateş 38.5 derece. Tamam.')
  })
  it('telefon, e-posta, T.C. kimlik numarası içeren cümle okunmaz; geri kalan okunur; bir kez "İletişim bilgisini ekranınıza yazdım"', () => {
    for (const deger of [TEL, '05327001122', 'qa@ornek.test', '12345678901']) {
      const k = K.konusmaYap(`Hocam, kayıt var. İletişim: ${deger}. Veli: ${deger}. Başka bir şey?`)
      assert.ok(!k.includes(deger), k)
      assert.equal(k, `Hocam, kayıt var. ${K.ILETISIM_EKRANDA} Başka bir şey?`)
    }
  })
  it('satır içi numaralı hasta listesi okunur, doğum tarihi (d.t.) okunmaz', () => {
    const k = K.konusmaYap('Bu hafta 2 hasta: 1. Ali Kaya (d.t. 01.01.2020) — ateş · 17.09.2026 muayene. 2. Veli Can (d.t. 02.02.2021) — öksürük. Hangisini istiyorsunuz?')
    assert.equal(k, 'Bu hafta 2 hasta: 1) Ali Kaya — ateş, 17.09.2026 muayene. 2) Veli Can — öksürük. Hangisini istiyorsunuz?')
    assert.ok(!k.includes('2020') && !k.includes('2021'))
  })
  it('akışlı (küçük parçalar) ve akışsız aynı sözü üretir; akış JSON "speech" önekinden okunur', () => {
    const ekran = 'Hocam, Umutcan’ın son vizitinde öksürük vardı. Akciğer sesleri temizdi.\n\n- madde\nSon cümle.'
    const ham = JSON.stringify({ speech: ekran, action: null })
    const parcalar: string[] = []
    const a = new K.SesAkisi((p) => parcalar.push(p))
    let biriken = ''
    for (let i = 0; i < ham.length; i += 5) { biriken += ham.slice(i, i + 5); a.ekle(Y.speechOneki(biriken)) }
    assert.ok(parcalar.length >= 2, 'ilk cümle akış bitmeden söylenmeli')
    assert.equal(a.bitir(), K.konusmaYap(ekran))
    assert.equal(Y.speechOneki('{"spe'), '')
    assert.equal(Y.speechOneki('```json\n{"speech": "Merhaba Hoc'), 'Merhaba Hoc')
    assert.equal(Y.speechOneki('Düz metin cevap'), 'Düz metin cevap')
  })
  it('NOTYA-SES-SLUR-01: yalnız BİTMİŞ cümle sese gider — ilk virgülde parça yok; cümle tamamlanınca gider; telefonlu cümle yine okunmaz', () => {
    const parcalar: string[] = []
    const a = new K.SesAkisi((p) => parcalar.push(p))
    a.ekle('Genel bilgi sorusu bu Hocam, yatış kararında CURB-65 en pratik a')
    assert.deepEqual(parcalar, [], 'yarım cümle sese gitmez')
    a.ekle('Genel bilgi sorusu bu Hocam, yatış kararında CURB-65 en pratik araçtır. Sonra')
    assert.deepEqual(parcalar, ['Genel bilgi sorusu bu Hocam, yatış kararında CURB-65 en pratik araçtır. '])
    assert.equal(a.bitir(), 'Genel bilgi sorusu bu Hocam, yatış kararında CURB-65 en pratik araçtır. Sonra.')
    const b = new K.SesAkisi(() => {})
    b.ekle(`Annesinin numarası ${TEL} olarak kayıtlı, ister misiniz`)
    assert.ok(!b.bitir().includes('0532'))
  })
  it('NOTYA-SES-SLUR-01: 3+ maddelik liste okunmaz — "N madde, ekranınızda"; 1-2 madde cümle olarak okunur; dosya cümlesi hastanın adıyla başlar', () => {
    const k = K.konusmaYap('Hocam, aşı durumu şöyle.\n\n**Hepatit B**\n- 1. doz — 15 Haziran 2024\n- 2. doz — 15 Temmuz 2024\n- 3. doz — Aralık 2024\n\nKontrol bir hafta sonra.')
    assert.equal(k, `Hocam, aşı durumu şöyle. Hepatit B. ${K.listeEkranda(3)} Kontrol bir hafta sonra.`)
    assert.equal(K.konusmaYap('İki madde:\n- bir\n- iki'), 'İki madde. bir. iki.')
    assert.equal(K.konusmaYap('Umutcan Türkoğlu — dosyada aşı: Hib 15 Ağustos 2025; KKK 15 Mayıs 2025.'), 'Umutcan Türkoğlu — dosyada aşı: Hib 15 Ağustos 2025; KKK 15 Mayıs 2025.')
  })
  it('NOTYA-SES-SLUR-01: sözlü tur en çok 5 cümle, sonra bir kez "Devamı ekranınızda"; notlar sayılmaz; ekran metni değişmez', () => {
    const k = K.konusmaYap('Bir. İki. Üç. Dört. Beş. Altı. Yedi.')
    assert.equal(k, `Bir. İki. Üç. Dört. Beş. ${K.DEVAMI_EKRANDA}`)
    assert.equal(K.konusmaYap('Bir. İki. Üç. Dört. Beş.'), 'Bir. İki. Üç. Dört. Beş.')
    const t = K.konusmaYap(`Bir. İki. Üç. Dört. İletişim: ${TEL}. Beş. Altı.`)
    assert.equal(t, `Bir. İki. Üç. Dört. ${K.ILETISIM_EKRANDA} Beş. ${K.DEVAMI_EKRANDA}`)
  })
  it('bekletme sözü yok (NOTYA-AYSE-ACILIS-01): aramada da sessiz; yalnız sesli onay teyitle başlar', () => {
    assert.equal(K.dolguSec('Umutcan’ın aşıları', { onay: false, vazgec: false, sosyal: false }), '')
    assert.equal(K.dolguSec('teşekkürler', { onay: false, vazgec: false, sosyal: true }), '')
    assert.equal(K.dolguSec('hayır', { onay: false, vazgec: true, sosyal: false }), '')
    assert.equal(K.dolguSec('evet', { onay: true, vazgec: false, sosyal: false }), K.DOLGU_KAYDEDIYORUM)
  })
  it('konuşmanın son doktor cümlesi; son mesaj doktorun değilse cevap yok; veda tanınır', () => {
    assert.equal(L.sonDoktorCumlesi([{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }, { role: 'user', content: [{ type: 'text', text: 'Umutcan  nasıl' }] }]), 'Umutcan nasıl')
    assert.equal(L.sonDoktorCumlesi([{ role: 'user', content: 'a' }, { role: 'tool', content: 'x' }]), null)
    assert.equal(L.sonAracMetni([{ role: 'user', content: 'bugün randevu' }, { role: 'tool', content: 'Bugün 1 randevu var Hocam.' }]), 'Bugün 1 randevu var Hocam.')
    assert.equal(L.sonAracMetni([{ role: 'user', content: 'a' }]), null)
    const ridvan = 'Rıdvan Dilmen dosyasına bakabilir misin?'
    const izolasyon = [{ role: 'user', content: ridvan, kanal: 'ses' }, { role: 'assistant', content: 'Hocam, yalnızca kendi hastalarınızın dosyalarına erişebiliyorum.' }]
    assert.equal(L.cevaplanmisSonSoruMu(izolasyon, ridvan), true)
    assert.equal(L.cevaplanmisSonSoruMu([{ role: 'user', content: ridvan }, { role: 'assistant', content: 'Yok.' }], ridvan), false, 'yazılı tur ses replay sayılmaz')
    assert.equal(L.cevaplanmisSonSoruMu(izolasyon, 'Umutcan nasıl?'), false)
    assert.equal(L.cevaplanmisSonSoruMu([{ role: 'user', content: ridvan }], ridvan), false)
    assert.equal(L.cevaplanmisSonSoruMu(izolasyon, '[devam]'), false)
    assert.ok(L.vedaMi('Görüşmeyi bitir Ayşe'))
    assert.ok(L.vedaMi('hoşça kal'))
    assert.ok(!L.vedaMi('Umutcan’ın görüşmesini bitir mi dedin'))
  })
})

describe('kilitler — sunucu sırrı + imzalı konuşma jetonu', () => {
  it('jeton imzalanır, doğrulanır; bozuk, süresi geçmiş, başka anahtarla imzalı jeton reddedilir', () => {
    const v = { d: 'd1', o: 'o1', s: 'pediatri', p: null, pe: 'aysekaya' }
    const t = J.sesJetonuImzala(v)!
    assert.deepEqual({ ...J.sesJetonuDogrula(t)!, exp: 0 }, { ...v, exp: 0 })
    const [g, i] = t.split('.')
    const sahte = Buffer.from(JSON.stringify({ ...v, d: 'baska-doktor', exp: Date.now() + 1e6 })).toString('base64url')
    assert.equal(J.sesJetonuDogrula(`${sahte}.${i}`), null)
    assert.equal(J.sesJetonuDogrula(`${g}.${i}x`), null)
    assert.equal(J.sesJetonuDogrula(`${g}`), null)
    assert.equal(J.sesJetonuDogrula(t, Date.now() + J.JETON_OMRU_MS + 1000), null)
    const eski = process.env.NOTYA_SES_JETON_SECRET
    process.env.NOTYA_SES_JETON_SECRET = 'baska-bir-anahtar-0123456789abcdefghijklmn'
    assert.equal(J.sesJetonuDogrula(t), null)
    process.env.NOTYA_SES_JETON_SECRET = 'kisa'
    assert.equal(J.sesJetonuImzala(v), null, 'kısa / eksik anahtarla jeton üretilmez')
    process.env.NOTYA_SES_JETON_SECRET = eski
  })
  it('bayrak: CORE default ON; off kills; only: allowlists; legacy list does not gate', () => {
    assert.equal(J.tekBeyinAcikMi('d1', ''), true)
    assert.equal(J.tekBeyinAcikMi('d1', undefined), true)
    assert.equal(J.tekBeyinAcikMi('d1', '*'), true)
    assert.equal(J.tekBeyinAcikMi('d1', 'hepsi'), true)
    assert.equal(J.tekBeyinAcikMi('d1', 'off'), false)
    assert.equal(J.tekBeyinAcikMi('d1', 'kapali'), false)
    assert.equal(J.tekBeyinAcikMi('d1', 'only:d0, d1'), true)
    assert.equal(J.tekBeyinAcikMi('d2', 'only:d0, d1'), false)
    assert.equal(J.tekBeyinAcikMi('d9', 'd0, d1'), true, 'legacy beta list is no longer a gate')
    assert.equal(J.tekBeyinAcikMi('', '*'), false)
  })
  it('uç: sırsız, yanlış sırlı, jetonsuz, sahte jetonlu istek 401 — model hiç çağrılmaz', async () => {
    const s = sahne()
    for (const g of [{ sir: null }, { sir: 'yanlis-sir-0123456789abcdef0123456789' }, { jeton: null }, { jeton: 'sahte.jeton' }] as const) {
      const y = await ses({ sahne: s, mesaj: 'Umutcan Türkoğlu’nun annesinin adı ne', ...g })
      assert.equal(y.status, 401, JSON.stringify(g))
      assert.ok(!y.ham.includes(ANNE))
    }
    assert.equal(modelIstekleri.length, 0)
    assert.equal(db.tablo('asistan_sessions').find((o) => o.id === s.oturum)?.messages.length, 0)
  })
  it('gövdedeki kimliklere güvenilmez: başka doktorun jetonu bu doktorun oturumunu / hastasını açamaz', async () => {
    const s = sahne()
    const y = await ses({ sahne: s, mesaj: 'Umutcan Türkoğlu’nun annesinin adı ne', jetonVeri: { d: s.diger.id } })
    assert.equal(y.status, 200)
    assert.ok(!y.metin.includes('Umutcan'), 'başka doktorun jetonuyla hasta çözülmemeli')
    assert.equal(db.tablo('asistan_sessions').find((o) => o.id === s.oturum)?.messages.length, 0, 'bu doktorun oturumuna yazılmamalı')
    const p = await ses({ sahne: s, mesaj: 'Durumu nasıl?', jetonVeri: { d: s.diger.id, p: s.hasta } })
    assert.match(p.metin, /bulamadım/)
    assert.ok(!modelIstekleri.some((m) => m.govde.includes(s.hasta)))
  })
})

describe('tek beyin — aynı soru, aynı ekran; ses aynı içeriği konuşur', () => {
  beforeEach(() => { sahne() })

  it('NOTYA-SES-ERKEN-01 + DEVAM-01: ses turu sözlü sınırda sessizce kapanır ([DONE]), ekran arka planda tamamlanır; [devam] kalanı modelsiz okur', async () => {
    const bas = 'Bir. İki. Üç. Dört. Beş. Altı. Yedi.'
    const kuyruk = ' Sekiz. Dokuz. Ekrana yazılan uzun tablo satırı.'
    const b = sahne()
    // speech JSON is cut mid-string on purpose: the first half streams fast, the tail after 2.5 s
    const tam = JSON.stringify({ speech: bas + kuyruk })
    const kes = tam.indexOf('Yedi.') + 'Yedi.'.length
    yanit = { metin: tam.slice(0, kes), gecikmeMs: 2500, gecikmeSonrasi: tam.slice(kes) }
    const t0 = Date.now()
    const v = await ses({ sahne: b, mesaj: 'Genel bir soru: bu yaşta uyku düzeni nasıl olmalı?' })
    const gecen = Date.now() - t0
    assert.equal(v.status, 200)
    assert.ok(gecen < 2000, `ses turu sınırda kapanmalı, ${gecen} ms sürdü`)
    // NOTYA-SES-DEVAM-01: a continuation follows, so the cut itself says nothing extra ("Devamı ekranınızda" is fallback only)
    assert.equal(v.metin.replace(/\s+/g, ' ').trim(), 'Bir. İki. Üç. Dört. Beş.')
    await new Promise((r) => setTimeout(r, 3500))
    const e = await sesEkrani(b)
    assert.ok((e.turlar.at(-1)?.metin || '').includes('Dokuz.'), 'ekran cevabı arka planda tamamlanmalı')
    const oturum = () => db.tablo('asistan_sessions').find((o) => o.id === b.oturum)!
    const kalan = 'Altı. Yedi. Sekiz. Dokuz. Ekrana yazılan uzun tablo satırı.'
    assert.equal(oturum().active_context.sesDevam?.kalan, kalan, 'söylenmeyen kalan oturuma yazılmalı')
    assert.equal(e.devam, true)
    assert.equal(e.devamAnahtar, e.turlar.at(-1)?.zaman, 'devam anahtarı kesilen turun zamanıdır')
    assert.equal(e.devamKalan, kalan)
    assert.equal(e.turlar.at(-1)?.devam, true)
    // the page's hidden continuation turn: exactly the remainder, uncapped, no model call, no new bubble
    const modelOnce = modelIstekleri.length
    const mesajOnce = oturum().messages.length
    const d = await ses({ sahne: b, mesaj: '[devam]' })
    assert.equal(d.status, 200)
    assert.equal(d.metin.replace(/\s+/g, ' ').trim(), kalan)
    assert.equal(modelIstekleri.length, modelOnce, '[devam] bir model turu değildir')
    assert.equal(oturum().active_context.sesDevam, undefined, 'okunan kalan silinmeli')
    assert.equal(oturum().messages.length, mesajOnce, '[devam] yeni baloncuk yazmaz')
    assert.equal((await sesEkrani(b)).devam, false)
    // a duplicate [devam] says nothing and still calls no model
    const tekrar = await ses({ sahne: b, mesaj: '[devam]' })
    assert.equal(tekrar.metin.trim(), '.', 'boş [devam] ElevenLabs soketini nokta ile tutar')
    assert.equal(modelIstekleri.length, modelOnce)
  })

  it('NOTYA-SES-DEVAM-01: sınıra varmayan tur kalan bırakmaz; yeni gerçek doktor turu eski kalanı siler', async () => {
    const b = sahne()
    yanit = { metin: JSON.stringify({ speech: 'Bir. İki. Üç.' }) }
    await ses({ sahne: b, mesaj: 'Genel bir soru: uyku düzeni?' })
    const oturum = () => db.tablo('asistan_sessions').find((o) => o.id === b.oturum)!
    assert.equal(oturum().active_context?.sesDevam, undefined, 'kesilmeyen turda sesDevam yok')
    oturum().active_context = { ...(oturum().active_context || {}), sesDevam: { anahtar: 'eski', kalan: 'Eski kalan cümle.', olusturma: new Date().toISOString() } }
    assert.equal((await sesEkrani(b)).devam, true)
    await ses({ sahne: b, mesaj: 'Başka bir soru: beslenme nasıl olmalı?' })
    assert.equal(oturum().active_context?.sesDevam, undefined, 'yeni gerçek tur eski kalanı düşürmeli')
    // "devam" with nothing left is an ordinary turn (the model answers)
    const once = modelIstekleri.length
    await ses({ sahne: b, mesaj: 'devam et' })
    assert.equal(modelIstekleri.length, once + 1)
  })

  it('aynı doktor sorusunun ikinci Custom LLM turu model çağırmaz (EL replay / izolasyon döngüsü)', async () => {
    const b = sahne()
    const soru = 'Rıdvan Dilmen dosyasına bakabilir misin?'
    yanit = { metin: JSON.stringify({ speech: 'Hocam, yalnızca kendi hastalarınızın dosyalarına erişebiliyorum.' }) }
    const ilk = await ses({ sahne: b, mesaj: soru })
    // NOTYA-SES-AKTIF-HASTA-01: a chart-open request for an unknown / foreign name is answered without the model.
    assert.match(ilk.metin, /bulamadım/)
    const n = modelIstekleri.length
    const tekrar = await ses({ sahne: b, mesaj: soru })
    assert.equal(modelIstekleri.length, n, 'replay yeni model turu açmaz')
    assert.equal(tekrar.metin.trim(), '.')
  })
  it('NOTYA-SES-TAKVIM-01: bugün randevu modelsiz okunur ve söylenir; yabancı doktorun günü sızmaz', async () => {
    const { bugunTRT } = await import('../../core/eylemler/types')
    const b = sahne()
    const gun = bugunTRT()
    db.ekle('randevular', {
      doktor_id: b.doktor.id, patient_id: b.hasta,
      baslangic: new Date(`${gun}T10:00:00+03:00`).toISOString(),
      bitis: new Date(`${gun}T10:20:00+03:00`).toISOString(),
      durum: 'planli', tur: 'muayene', hasta_adi_serbest: null,
    })
    db.ekle('randevular', {
      doktor_id: b.diger.id, patient_id: null,
      baslangic: new Date(`${gun}T11:00:00+03:00`).toISOString(),
      bitis: new Date(`${gun}T11:20:00+03:00`).toISOString(),
      durum: 'planli', tur: 'muayene', hasta_adi_serbest: 'Yabancı Hasta',
    })
    const once = modelIstekleri.length
    const v = await ses({ sahne: b, mesaj: 'Bugün randevu var mı?' })
    assert.equal(v.status, 200)
    assert.equal(modelIstekleri.length, once, 'takvim model turu değildir')
    assert.match(v.metin, /randevu/i)
    assert.ok(/Umutcan|10:00/.test(v.metin), v.metin)
    assert.doesNotMatch(v.metin, /Yabancı Hasta/)
    const e = await sesEkrani(b)
    assert.match(e.turlar.at(-1)?.metin || '', /randevu/)
    assert.match(e.turlar.at(-1)?.soru || '', /Bugün randevu/)

    const gurultu = await ses({ sahne: b, mesaj: '...' })
    assert.equal(gurultu.status, 200)
    assert.equal(modelIstekleri.length, once, '"..." model turu değildir')
    // NOTYA-SES-ESKI-02: this route is the ElevenLabs Custom LLM; right after a calendar answer the pause now gets
    // the fixed line instead of a lone period (Flash voiced the period as a sigh). Still no model turn, still no recant.
    assert.equal(gurultu.metin.trim(), 'Buradayım Hocam.', 'takvimden sonraki duraklama sabit sözdür, model cevabı değildir')
    assert.doesNotMatch(gurultu.metin, /Haklısınız|doğrulamadan|Ana Sayfa/)
    const emin = await ses({ sahne: b, mesaj: 'Emin misin?' })
    assert.equal(emin.status, 200)
    assert.equal(modelIstekleri.length, once, 'emin misin takvimi yeniden okur')
    assert.match(emin.metin, /randevu/i)
    assert.doesNotMatch(emin.metin, /Yabancı Hasta/)

    yanit = { metin: JSON.stringify({ speech: 'Haklısınız Hocam; az önce randevu olmadığını ve tarihi kesinmiş gibi söyledim. Bunu doğrulamadan belirtmemeliydim. Randevu durumunu Ana Sayfa’daki bugünkü randevular bölümünden kontrol edelim.' }) }
    const recant = await yazi(b, 'Peki başka ne var?', b.oturum)
    assert.doesNotMatch(recant.speech, /Ana Sayfa|doğrulamadan|Haklısınız/)
    assert.match(recant.speech, /takviminde.{0,20}randevu/)
  })
  it('model cevabı: yazı ve ses aynı ekranı verir; ses önce bekletme sözü, sonra model yazdıkça aynı içerik', async () => {
    const ekranMetni = 'Hocam, Umutcan’ın son vizitinde öksürük vardı. Akciğer sesleri temizdi.\n\n- Öneri 1\n- Öneri 2\n\nAnnesine 0532 700 11 22 numarasından ulaşabilirsiniz.'
    const soru = 'Merhaba Ayşe, bugün Umutcan Türkoğlu geldi, genel durumunu bir değerlendirir misin?'
    const a = sahne()
    yanit = { metin: JSON.stringify({ speech: ekranMetni }) }
    const t = await yazi(a, soru)
    assert.equal(modelIstekleri.at(-1)?.stream, false)
    const yaziIstegi = modelIstekleri.at(-1)!.govde

    const b = sahne()
    yanit = { metin: JSON.stringify({ speech: ekranMetni }) }
    const v = await ses({ sahne: b, mesaj: soru })
    assert.equal(v.status, 200)
    assert.equal(modelIstekleri.at(-1)?.stream, true, 'ses yolu modeli akışla çağırır')
    assert.ok(!v.parcalar[0].startsWith('Bakıyorum'), 'bekletme sözü yok — ilk parça doğrudan cevap')
    // NOTYA-SES-ELEVEN-GERI-01: as at f247ea1b — ElevenLabs Flash gets one breath, not a sentence drip (NOTYA-SES-KILIT-01).
    assert.ok(v.parcalar.length >= 1 && v.parcalar.length <= 3, 'nefes bloğu: cümle cümle damlamaz, tek seferde de boşalmaz')
    assert.ok(!v.metin.includes('0532'), v.metin)
    assert.equal(v.metin.replace(/\s+/g, ' ').trim(), `Hocam, Umutcan’ın son vizitinde öksürük vardı. Akciğer sesleri temizdi. Öneri 1. Öneri 2. ${K.ILETISIM_EKRANDA}`)

    const e = await sesEkrani(b)
    assert.equal(e.turlar.at(-1)?.metin, t.speech, 'ses turunun ekranı yazılı cevapla aynı')
    assert.match(e.turlar.at(-1)?.soru || '', /Umutcan/, 'ekran turu doktorun cümlesini de taşır')
    assert.equal(t.speech, ekranMetni)
    // Aynı model isteği (sistem, geçmiş, araçlar) — farklar yalnız stream bayrağı ve hasta dosyası bloğu:
    // NOTYA-SES-BAGLAM-KUCULT-01 sesli tur tam dosya yerine kısa, güvenlik-tam özeti taşır.
    const [ty, sy] = [JSON.parse(yaziIstegi), JSON.parse(modelIstekleri.at(-1)!.govde)]
    delete sy.stream
    const dosyaBlogu = /=== AKTİF HASTA DOSYASI:[\s\S]*?doktorundur\.\]/
    const hastaSatiri = /=== AKTİF HASTA ===\n[\s\S]*?(?=\n=== |\n\n|$)/
    const sistemMetni = (r: { system: { text: string }[] }, h: string, d: string) => r.system.map((x) => x.text).join('\n').replace(new RegExp(h, 'g'), 'H').replace(new RegExp(d, 'g'), 'D')
    const [sesSistem, yaziSistem] = [sistemMetni(sy, b.hasta, b.doktor.id), sistemMetni(ty, a.hasta, a.doktor.id)]
    assert.match(sesSistem, /SESLİ GÖRÜŞME DOSYA ÖZETİ/)
    assert.match(yaziSistem, /## VİZİT GEÇMİŞİ/)
    const strip = (s: string) => s.replace(dosyaBlogu, '<DOSYA>').replace(hastaSatiri, '<HASTA>')
    assert.equal(strip(sesSistem), strip(yaziSistem))
    assert.deepEqual(sy.tools, ty.tools)
    assert.deepEqual(sy.messages, ty.messages)
  })

  it('kimlik sorusu: iki yolda aynı ekran (değerlerle); ses değeri SÖYLEMEZ; model çağrılmaz, geçmiş değersiz', async () => {
    const soru = 'Umutcan Türkoğlu’nun anne ve babasının adı nedir'
    const a = sahne()
    const t = await yazi(a, soru)
    assert.match(t.speech, new RegExp(ANNE))
    const b = sahne()
    const v = await ses({ sahne: b, mesaj: soru })
    for (const deger of [ANNE, BABA, TEL]) assert.ok(!v.metin.includes(deger), `sözlü biçimde kimlik değeri: ${deger}`)
    assert.match(v.metin, /Umutcan Türkoğlu için istediğiniz bilgiyi ekranınıza yazdım/)
    assert.equal(modelIstekleri.length, 0)
    const gecmis = JSON.stringify(db.tablo('asistan_sessions').find((o) => o.id === b.oturum)?.messages)
    assert.ok(!gecmis.includes(ANNE) && !gecmis.includes(BABA), 'saklanan geçmiş değer taşımamalı')
    const e = await sesEkrani(b)
    assert.equal(e.turlar.at(-1)?.metin, t.speech, 'ekran biçimi sunucuda yeniden kurulur, yazılıyla aynı')
  })

  it('dosyadan kesin cevap (modelsiz): iki yolda aynı ekran', async () => {
    const soru = 'Umutcan Türkoğlu’nun alerjisi var mı'
    const a = sahne()
    const t = await yazi(a, soru)
    const b = sahne()
    const v = await ses({ sahne: b, mesaj: soru })
    assert.ok(v.metin.trim().length > 0)
    const e = await sesEkrani(b)
    assert.equal(e.turlar.at(-1)?.metin, t.speech)
    assert.equal(e.aktifHasta, 'Umutcan Türkoğlu')
  })

  it('TEK konuşma, TEK aktif hasta: sesle açılan hasta yazılı takip sorusunda aktif; yazılı tur sesin geçmişini görür', async () => {
    const s = sahne()
    yanit = { metin: JSON.stringify({ speech: 'Hocam, son vizitte öksürük vardı.' }) }
    await ses({ sahne: s, mesaj: 'Umutcan Türkoğlu’nun son muayenesinde ne vardı' })
    const oturum = db.tablo('asistan_sessions').find((o) => o.id === s.oturum)!
    assert.equal(oturum.active_context.currentPatientId, s.hasta)
    yanit = { metin: JSON.stringify({ speech: 'Öksürük için şurup düşünülebilir.' }) }
    const t = await yazi(s, 'Peki öksürüğü için ne önerirsin?', s.oturum)
    assert.equal(t.asistanSessionId, s.oturum)
    const son = JSON.parse(modelIstekleri.at(-1)!.govde)
    assert.ok(JSON.stringify(son.system).includes('=== AKTİF HASTA DOSYASI: Umutcan Türkoğlu'), 'aktif hasta yazılı turda da bağlamda (NOTYA-AKTIF-HASTA-01)')
    assert.ok(JSON.stringify(son.messages).includes('Umutcan Türkoğlu’nun son muayenesinde ne vardı'), 'sesli tur yazılı geçmişte')
    const mesajlar = db.tablo('asistan_sessions').find((o) => o.id === s.oturum)!.messages
    assert.equal(mesajlar.length, 4)
  })

  it('NOTYA-LUNA-ARAMA-01: dosyasız turda model "dosya yok" bloğunu görür; adla açılan hastaya İlk 10 sorusu dosyayı getirir', async () => {
    const s = sahne()
    yanit = { metin: JSON.stringify({ speech: 'Hangi hastayı soruyorsunuz Hocam?' }) }
    await yazi(s, 'Aşıları tam mı?', s.oturum)
    let son = JSON.parse(modelIstekleri.at(-1)!.govde)
    assert.ok(JSON.stringify(son.system).includes('[BU TURDA AÇIK HASTA DOSYASI YOK]'), 'açık hasta yokken blok var')
    assert.ok(!JSON.stringify(son.system).includes('=== AKTİF HASTA DOSYASI:'))

    yanit = { metin: JSON.stringify({ speech: 'Umutcan Türkoğlu — son vizitte öksürük vardı.' }) }
    const u = await yazi(s, 'Umutcan Türkoğlu’nun son muayenesinde ne vardı', s.oturum)
    assert.equal(u.aktifHasta, 'Umutcan Türkoğlu', 'adla açılan hasta oturumun aktif hastası')

    yanit = { metin: JSON.stringify({ speech: 'Umutcan Türkoğlu — aşı tablosunda kayıt yok.' }) }
    const t = await yazi(s, 'Aşıları tam mı?', s.oturum)
    son = JSON.parse(modelIstekleri.at(-1)!.govde)
    assert.ok(JSON.stringify(son.system).includes('=== AKTİF HASTA DOSYASI: Umutcan Türkoğlu'), 'iyelik ekli İlk 10 sorusu adla açılan hastaya döner')
    assert.equal(t.aktifHasta, 'Umutcan Türkoğlu')
  })

  it('sesli kart + "Evet": kart hazırlanır ve okunur; "Evet" modelsiz, dokunuşun omurgasından kaydeder', async () => {
    const s = sahne()
    yanit = {
      metin: JSON.stringify({ speech: 'Kartı hazırladım Hocam, onaylarsanız dosyaya işlenir.' }),
      araclar: [{ name: 'asi_kaydi_ekle', input: { asi_adi: 'Hepatit B', uygulama_tarihi: '2026-09-01', alan_kaynaklari: { asi_adi: { kaynak: 'doktor_soyledi' }, uygulama_tarihi: { kaynak: 'doktor_soyledi' } } } }],
    }
    const v = await ses({ sahne: s, mesaj: 'Umutcan Türkoğlu’na 1 Eylül 2026’da Hepatit B aşısı yapıldı, dosyaya kaydet' })
    assert.match(v.metin, /Onaylıyor musunuz\?/)
    const taslak = db.tablo('eylem_onerileri').find((o) => o.hasta_id === s.hasta && o.durum === 'taslak')
    assert.ok(taslak, 'taslak kart hazırlanmalı')
    assert.equal(taslak.yuzey, 'ses')
    assert.equal(db.tablo('asilar').length, 0, 'kart kayıt değildir')
    const e = await sesEkrani(s)
    assert.deepEqual(e.turlar.at(-1)?.kartlar, [taslak.id])
    assert.equal(e.turlar.at(-1)?.hastaId, s.hasta)
    assert.deepEqual(e.bekleyen, [taslak.id])

    const modelOnce = modelIstekleri.length
    const onay = await ses({ sahne: s, mesaj: 'Evet' })
    assert.equal(onay.parcalar[0], K.DOLGU_KAYDEDIYORUM)
    assert.match(onay.metin, /Kaydedildi Hocam — Aşı kaydı\./)
    assert.equal(modelIstekleri.length, modelOnce, '"Evet" bir model turu değildir')
    assert.equal(db.tablo('asilar').filter((x) => x.patient_id === s.hasta && x.doktor_id === s.doktor.id).length, 1)
    assert.equal((await sesEkrani(s)).bekleyen.length, 0)
    // bekleyen kart yokken "evet" sıradan sohbettir — hiçbir şey yazılmaz
    await ses({ sahne: s, mesaj: 'Evet' })
    assert.equal(db.tablo('asilar').length, 1)
  })

  it('sesli "Hayır": bekleyen kart vazgeçilir, dosyaya yazılmaz', async () => {
    const s = sahne()
    yanit = { metin: JSON.stringify({ speech: 'Kartı hazırladım.' }), araclar: [{ name: 'asi_kaydi_ekle', input: { asi_adi: 'KKK', uygulama_tarihi: '2026-09-01' } }] }
    await ses({ sahne: s, mesaj: 'Umutcan Türkoğlu’na KKK aşısı 1 Eylül 2026’da yapıldı, kaydet' })
    const h = await ses({ sahne: s, mesaj: 'Hayır' })
    assert.match(h.metin, /vazgeçtim/)
    assert.equal(db.tablo('eylem_onerileri').filter((o) => o.durum === 'taslak').length, 0)
    assert.equal(db.tablo('asilar').length, 0)
  })

  it('ElevenLabs sistem aracı end_call: veda cümlesinde çağrılır; araç yoksa sıradan tur; model çağrılmaz', async () => {
    const s = sahne()
    const y = await ses({ sahne: s, mesaj: 'Görüşmeyi bitir Ayşe', tools: [{ type: 'function', function: { name: 'end_call', parameters: {} } }, { type: 'function', function: { name: 'language_detection' } }] })
    assert.equal(y.aracCagrilari[0]?.function.name, 'end_call')
    assert.equal(y.bitis, 'tool_calls')
    assert.equal(modelIstekleri.length, 0)
    const z = await ses({ sahne: s, mesaj: 'Görüşmeyi bitir Ayşe' })
    assert.equal(z.aracCagrilari.length, 0)
    assert.equal(z.bitis, 'stop')
  })
})

describe('NOTYA-SES-DEVAM-01: kesilen sesli turun kalanı', () => {
  it('sesDevamKalani: söylenen cümleler baştan düşer; eşleşmezse tamamı; liste notu ve kart okuması kalanda', () => {
    const tum = K.sozCumleleri('Bir. İki. Üç. Dört. Beş. Altı. Yedi.')
    assert.deepEqual(tum, ['Bir.', 'İki.', 'Üç.', 'Dört.', 'Beş.', 'Altı.', 'Yedi.'])
    assert.equal(K.sesDevamKalani(tum, 'Bir. İki. Üç. Dört. Beş. '), 'Altı. Yedi.')
    // a holding sentence before the answer does not break the match
    assert.equal(K.sesDevamKalani(tum, 'Tamam Hocam... Bir. İki. '), 'Üç. Dört. Beş. Altı. Yedi.')
    // nothing of the answer was said (guard timer, holding sentence only) → the whole answer
    assert.equal(K.sesDevamKalani(tum, 'Dosyayı inceliyorum Hocam, cevabı ekranınıza yazıyorum. '), tum.join(' '))
    assert.equal(K.sesDevamKalani(tum, ''), tum.join(' '))
    // everything said → nothing left
    assert.equal(K.sesDevamKalani(tum, tum.join(' ')), '')
    const listeli = K.sozCumleleri('Özet hazır.\n- a\n- b\n- c\nSon cümle.')
    assert.equal(K.sesDevamKalani([...listeli, 'Kart ekranda.'], 'Özet hazır. '), `${K.listeEkranda(3)} Son cümle. Kart ekranda.`)
  })
  // NOTYA-SES-SLUR-02 (Dr. Gökhan, 2026-10-03): evidence answers are capped again (SES-OZET-TAM lifted briefly).
  it('sesSiniriSec: varsayılan SOZ_BEAT_SINIRI; tamSes sınırsız', () => {
    assert.equal(K.sesSiniriSec(true), K.SOZ_BEAT_SINIRI)
    assert.equal(K.sesSiniriSec(false), K.SOZ_BEAT_SINIRI)
    assert.equal(K.sesSiniriSec(true, 'tam'), Number.POSITIVE_INFINITY)
    assert.equal(K.sesSiniriSec(false, 'varsayilan'), K.SOZ_BEAT_SINIRI)
  })
  it('sesSiniriSec(true) ile SesAkisi 5 cümleden sonra "Devamı ekranınızda" der', () => {
    const parcalar: string[] = []
    const a = new K.SesAkisi((p) => parcalar.push(p), undefined, undefined, K.sesSiniriSec(true))
    const uzunOzet = Array.from({ length: 8 }, (_, i) => `Cümle ${i + 1} burada klinik bilgi anlatır.`).join(' ')
    a.ekle(uzunOzet)
    const tam = a.bitir()
    assert.match(tam, /Devamı ekranınızda/)
    assert.match(tam, /Cümle 1 /)
    assert.match(tam, /Cümle 5 /)
    assert.doesNotMatch(tam, /Cümle 8 /)
  })
  it('sesSiniriSec(..., tam) ile SesAkisi uzun özeti "Devamı ekranınızda" demeden tam okur', () => {
    const parcalar: string[] = []
    const a = new K.SesAkisi((p) => parcalar.push(p), undefined, undefined, K.sesSiniriSec(true, 'tam'))
    const uzunOzet = Array.from({ length: 8 }, (_, i) => `Cümle ${i + 1} burada klinik bilgi anlatır.`).join(' ')
    a.ekle(uzunOzet)
    const tam = a.bitir()
    assert.doesNotMatch(tam, /Devamı ekranınızda/)
    assert.match(tam, /Cümle 8 /)
  })
  it('NOTYA-SES-OKUNUS-01: hepsini anlat / yalnızca ekrana ses komutları', () => {
    for (const m of ['Hepsini anlat', 'tamamını oku', 'eksiksiz sesli anlat', 'Umutcan özetini hepsini anlat']) {
      assert.equal(K.sesOkunusModu(m), 'tam', m)
      assert.ok(K.tamSesIstegiMi(m), m)
    }
    for (const m of ['Yalnızca ekrana ver', 'sadece ekrana yaz', 'ekrana koy', 'sesli okuma', 'sadece yazılı ver']) {
      assert.equal(K.sesOkunusModu(m), 'ekran', m)
      assert.ok(K.sadeceEkranIstegiMi(m), m)
    }
    assert.equal(K.sesOkunusModu('bunu bana okuyacak mısın yoksa yalnızca yazılı olarak mı vereceksin?'), 'varsayilan')
    assert.equal(K.sesOkunusModu('Umutcan kaç kilo?'), 'varsayilan')
  })
  it('sessiz sınır: "Devamı ekranınızda" söylenmez, onSinir yine bir kez; varsayılan akış eski davranışta', () => {
    const parcalar: string[] = []
    let sinir = 0
    const a = new K.SesAkisi((p) => parcalar.push(p), undefined, () => { sinir++ }, K.SOZ_BEAT_SINIRI, true)
    a.ekle('Bir. İki. Üç. Dört. Beş. Altı. Yedi.')
    assert.equal(a.bitir(), 'Bir. İki. Üç. Dört. Beş.')
    assert.equal(sinir, 1)
    assert.ok(a.sinirAsildi)
    assert.ok(!parcalar.join('').includes(K.DEVAMI_EKRANDA))
    assert.equal(K.konusmaYap('Bir. İki. Üç. Dört. Beş. Altı.'), `Bir. İki. Üç. Dört. Beş. ${K.DEVAMI_EKRANDA}`)
  })
  it('devamIstegiMi: gizli işaret ve kısa "devam" sözü; başka cümle değil', () => {
    for (const m of ['[devam]', '[devam].', 'devam', 'Devam et', 'devam et hocam.', 'Devam edelim Ayşe']) assert.ok(K.devamIstegiMi(m), m)
    for (const m of ['devamını oku', 'tedaviye devam edelim mi', 'ilaca devam', 'Devam eden şikayeti var mı?']) assert.ok(!K.devamIstegiMi(m), m)
  })
})

describe('NOTYA-SES-OKU-01: "bana anlat" ekrandaki cevabı sınırsız okur, model çağrılmaz', () => {
  it('okumaIstegiMi ve sınırsız okuma', () => {
    for (const m of ['Bana anlatır mısın lütfen? Devamını ekranda görüyorum ama sen bana anlat.', 'devamını oku', 'Sesli anlat', 'oku', 'Hepsini anlat Ayşe']) assert.ok(K.okumaIstegiMi(m), m)
    for (const m of ['Umutcan Türkoğlu kaç kilo?', 'aşıları tam mı', 'anlatılan şikayet nedir']) assert.ok(!K.okumaIstegiMi(m), m)
    // NOTYA-KORPUS-KALAN-01 (G-28, Y-063): a sentence that names WHAT to read from the chart is a chart question — the
    // previous answer is not re-read. The words that point at the screen answer itself keep the route.
    for (const m of ['MCV ve MCHC değerlerini oku', 'Son SOAP notunu oku', 'Emircan Karaoğlu’nun son SOAP notunu oku', 'Hastanın özetini oku', 'Son reçeteyi oku', "MCV'yi oku", 'Son muayenesini bana anlat', 'İlaçlarını oku', 'Lab sonuçlarını bana oku']) assert.ok(!K.okumaIstegiMi(m), m)
    for (const m of ['Devamını ekranda görüyorum ama sen bana anlat', 'bunu bana oku', 'Tamamını oku hocam', 'Ekrandakini oku', 'cevabını sesli oku', 'kalanını da sesli oku', 'Hepsini oku Ayşe', 'listeyi bana oku', 'Peki, lütfen ekrandaki özetini okur musun?', 'bunu bana okuyacak mısın yoksa yalnızca yazılı olarak mı vereceksin?']) assert.ok(K.okumaIstegiMi(m), m)
    const uzun = 'Bir. İki. Üç. Dört. Beş. Altı. Yedi. Sekiz.'
    assert.equal(K.konusmaYap(uzun, undefined, { sinirsiz: true }), uzun)
    assert.equal(K.konusmaYap(uzun), `Bir. İki. Üç. Dört. Beş. ${K.DEVAMI_EKRANDA}`)
  })
})

/**
 * NOTYA-SAYFA-HASTA-01 (Dr. Gökhan canlı vaka, 2026-09-26): oturum Ayşe Yeşil'le başladı, doktor Umutcan Türkoğlu'nun
 * Büyüme sayfasına geçti; panel hâlâ "aktif hasta: Ayşe Yeşil" dedi ve Ayşe büyüme sorularını yanlış çocuğun
 * dosyasından cevapladı. Kural (Kaan): sayfayı açmak hastayı adıyla söylemekle eş değer; en son açık sinyal kazanır.
 * Kaan 2026-09-29: bu kural geri geldi (NOTYA-SES-DOSYA-ISTE-01 geri alındı).
 */
describe('NOTYA-SAYFA-HASTA-01: asistan doktorun açtığı hasta sayfasını takip eder', () => {
  const odakIste = (token: string | null, govde: unknown) => R.oturumHasta.POST(new NextRequestSinifi('http://localhost/api/asistan/oturum-hasta', {
    method: 'POST', headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json' }, body: JSON.stringify(govde),
  } as ConstructorParameters<typeof NextRequestSinifi>[1])) as Promise<Response>
  const oturumu = (id: string) => db.tablo('asistan_sessions').find((o) => o.id === id)!
  /** İkinci hasta (Ayşe Yeşil) + iki çocuğun da onaylı cihaz kilosu; oturum Ayşe Yeşil'e odaklı başlar. */
  function ikiHasta() {
    const s = sahne()
    const ayse = db.ekle('patients', { doctor_id: s.doktor.id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'Ayşe Yeşil' })), dob_encrypted: encrypt('2021-02-03') }).id
    indeksle(s.doktor.id, ayse, 'Ayşe Yeşil')
    db.ekle('cihaz_olcumleri', { doctor_id: s.doktor.id, patient_id: ayse, tur: 'kilo', deger: 18.4, birim: 'kg', alindi: '2026-09-20T09:00:00Z', onaylandi: true })
    db.ekle('cihaz_olcumleri', { doctor_id: s.doktor.id, patient_id: s.hasta, tur: 'kilo', deger: 21.7, birim: 'kg', alindi: '2026-09-22T09:00:00Z', onaylandi: true })
    oturumu(s.oturum).active_context = { specialty: 'pediatri', currentPatientId: ayse, patientName: 'Ayşe Yeşil' }
    return { ...s, ayse }
  }

  it('rota: sahibi 200 + ad, odak oturuma yazılır; başka doktorun hastası 404 (varlık sızmaz) ve hiçbir şey yazılmaz; bilinmeyen / yabancı oturum 404; girişsiz 401', async () => {
    const s = ikiHasta()
    const yabanciHasta = db.ekle('patients', { doctor_id: s.diger.id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Yabancı Hasta' })) }).id
    indeksle(s.diger.id, yabanciHasta, 'QA Yabancı Hasta')
    const yabanciOturum = db.ekle('asistan_sessions', { doctor_id: s.diger.id, persona_id: 'aysekaya', messages: [], active_context: {} }).id

    const ok = await odakIste(s.doktor.token, { asistanSessionId: s.oturum, patientId: s.hasta })
    assert.equal(ok.status, 200)
    assert.deepEqual(await ok.json(), { ad: 'Umutcan Türkoğlu' })
    const b = oturumu(s.oturum).active_context
    assert.equal(b.currentPatientId, s.hasta)
    assert.equal(b.patientName, 'Umutcan Türkoğlu')
    assert.equal(b.odakKaynak, 'sayfa')
    assert.ok(!Number.isNaN(Date.parse(b.odakZaman)))
    assert.equal(b.specialty, 'pediatri', 'oturum bağlamının geri kalanı korunur')
    assert.equal(oturumu(s.oturum).patient_id, s.hasta)

    const once = JSON.stringify(oturumu(s.oturum))
    const red = await odakIste(s.doktor.token, { asistanSessionId: s.oturum, patientId: yabanciHasta })
    assert.equal(red.status, 404) // NOTYA-SAYFA-HASTA-02: yabancı hasta 404 döner, 403 değil — var olan hasta sızmasın
    assert.ok(!JSON.stringify(await red.json()).includes('QA Yabancı Hasta'))
    assert.equal(JSON.stringify(oturumu(s.oturum)), once, '403: oturuma hiçbir şey yazılmaz')

    assert.equal((await odakIste(s.doktor.token, { asistanSessionId: randomUUID(), patientId: s.hasta })).status, 404)
    assert.equal((await odakIste(s.doktor.token, { asistanSessionId: yabanciOturum, patientId: s.hasta })).status, 404)
    assert.deepEqual(oturumu(yabanciOturum).active_context, {}, 'yabancı oturum değişmez')
    assert.equal((await odakIste(null, { asistanSessionId: s.oturum, patientId: s.hasta })).status, 401)
    assert.equal((await odakIste(s.doktor.token, { asistanSessionId: s.oturum })).status, 400)
  })

  it('sayfa geçişinden sonra adsız "kaç kilo" yeni hastanın dosyasından cevaplanır — yazı ve ses; model çağrılmaz', async () => {
    const s = ikiHasta()
    const once = await yazi(s, 'Kaç kilo?', s.oturum)
    assert.match(once.speech, /^Ayşe Yeşil — /)
    assert.ok(once.speech.includes('18.4') || once.speech.includes('18,4'), once.speech)

    assert.equal((await odakIste(s.doktor.token, { asistanSessionId: s.oturum, patientId: s.hasta })).status, 200)
    const t = await yazi(s, 'Kaç kilo?', s.oturum)
    assert.match(t.speech, /^Umutcan Türkoğlu — /, t.speech)
    assert.ok(t.speech.includes('21.7') || t.speech.includes('21,7'), t.speech)
    assert.ok(!t.speech.includes('18.4') && !t.speech.includes('18,4'), 'eski hastanın ölçümü gelmez')

    const v = await ses({ sahne: s, mesaj: 'Peki kaç kilo?' })
    assert.equal(v.status, 200)
    assert.ok(v.metin.startsWith('Umutcan Türkoğlu'), v.metin)
    assert.equal(modelIstekleri.length, 0, 'kesin dosya cevabı modelsiz')
    // Adsız takip odakta kalır (NOTYA-HASTA-ODAK-01) — sayfa sinyali tek seferliktir, her mesajda yeniden gelmez.
    assert.equal(oturumu(s.oturum).active_context.currentPatientId, s.hasta)
  })

  it('Q3 büyüme: sayfa geçişinden sonra kanıt bloğu yeni çocuğun ölçüm serisini Neyzi ile taşır, eskisini taşımaz', async () => {
    const s = ikiHasta()
    db.tablo('patients').find((p) => p.id === s.hasta)!.gender_encrypted = encrypt('male')
    db.ekle('cihaz_olcumleri', { doctor_id: s.doktor.id, patient_id: s.hasta, tur: 'kilo', deger: 19.9, birim: 'kg', alindi: '2026-03-22T09:00:00Z', onaylandi: true })
    await odakIste(s.doktor.token, { asistanSessionId: s.oturum, patientId: s.hasta })
    yanit = { metin: JSON.stringify({ speech: 'Umutcan Türkoğlu — büyüme değerlendirmesi.' }) }
    await yazi(s, 'Büyümesi nasıl, persentili ne?', s.oturum)
    assert.equal(modelIstekleri.length, 1)
    const sistem = JSON.stringify(JSON.parse(modelIstekleri[0].govde).system)
    assert.ok(sistem.includes('AKTİF HASTA DOSYASI: Umutcan Türkoğlu'), 'dosya bloğu yeni hastanın')
    assert.ok(sistem.includes('Neyzi'), 'büyüme kanıtı Neyzi referansıyla')
    assert.ok(/21[.,]7/.test(sistem) && /19[.,]9/.test(sistem), 'iki ölçüm de seride')
    // (persona kuralları örnek cümlede "Ayşe Yeşil" adını sabit metin olarak taşır — ölçüm değeri taşımaz)
    assert.ok(!/18[.,]4/.test(sistem) && !sistem.includes('AKTİF HASTA DOSYASI: Ayşe Yeşil'), 'eski hastanın ölçümü / dosyası bağlamda yok')
  })

  it('doktor sayfadan sonra başka hastayı adıyla söylerse o kazanır (en son açık sinyal)', async () => {
    const s = ikiHasta()
    await odakIste(s.doktor.token, { asistanSessionId: s.oturum, patientId: s.hasta })
    const t = await yazi(s, 'Ayşe Yeşil kaç kilo?', s.oturum)
    assert.match(t.speech, /^Ayşe Yeşil — /, t.speech)
    assert.equal(oturumu(s.oturum).active_context.currentPatientId, s.ayse)
    assert.equal(oturumu(s.oturum).active_context.odakKaynak, 'soz')
  })

  it('tur sürerken sayfa değişirse turun yazısı eski odağı geri getirmez', async () => {
    const s = ikiHasta()
    oturumu(s.oturum).active_context = { specialty: 'pediatri' }
    // the model's JSON tail arrives after 400 ms — the doctor opens Ayşe Yeşil's page in between
    const tam = JSON.stringify({ speech: 'Hocam, son vizitte öksürük vardı.' })
    yanit = { metin: tam.slice(0, -2), gecikmeMs: 400, gecikmeSonrasi: tam.slice(-2) }
    const tur = ses({ sahne: s, mesaj: 'Umutcan Türkoğlu için beslenme önerin nedir' })
    await new Promise((r) => setTimeout(r, 150))
    assert.equal((await odakIste(s.doktor.token, { asistanSessionId: s.oturum, patientId: s.ayse })).status, 200)
    await tur
    await new Promise((r) => setTimeout(r, 600))
    const b = oturumu(s.oturum).active_context
    assert.equal(b.currentPatientId, s.ayse, 'sayfa geçişi turdan yenidir — kazanır')
    assert.equal(b.patientName, 'Ayşe Yeşil')
    assert.equal(oturumu(s.oturum).patient_id, s.ayse)
    assert.equal(modelIstekleri.length, 1, 'model turu — yazı modelden sonra gelir (yarış gerçekten kurulur)')
    assert.ok(oturumu(s.oturum).messages.length >= 2, 'turun konuşması yine kaydedilir')
  })
})

describe('NOTYA-SES-BAGLAM-KUCULT-01: sesli turda kısa, güvenlik-tam dosya; İlk-10 kanıtı aynen; yazı değişmedi', () => {
  const oturumu = (id: string) => db.tablo('asistan_sessions').find((o) => o.id === id)!
  const KANIT = 'AYŞE KLİNİK DOSYA SORGULAMA STANDARDI'
  let F: typeof import('./tests/gercekciHasta')
  let D: typeof import('../doktor/hastaDosyaKisa')
  let S: typeof import('./sesDosya')
  before(async () => {
    F = await import('./tests/gercekciHasta')
    D = await import('../doktor/hastaDosyaKisa')
    S = await import('./sesDosya')
  })
  /** Gerçekçi hasta (14 vizit, 5 ilaç, 18 aşı, 22 lab) açık; her tur temiz geçmişle başlar. */
  function gercekci() {
    const s = sahne()
    const h = F.gercekciHastaEkle(db, encrypt, s.doktor.id)
    return { ...s, h }
  }
  function odakla(s: Sahne & { h: string }) {
    oturumu(s.oturum).active_context = { specialty: 'pediatri', currentPatientId: s.h, patientName: F.GERCEKCI_HASTA_ADI }
    oturumu(s.oturum).messages = []
    modelIstekleri.length = 0
  }
  const sistem = () => {
    // [0] asıl tur; "bana" gibi bir söz arka plan öğrenme çağrısını (sohbettenOgren) da tetikleyebilir.
    assert.ok(modelIstekleri.length >= 1, 'model turu')
    return (JSON.parse(modelIstekleri[0].govde).system as { text: string }[]).map((b) => b.text).join('\n')
  }
  async function paket(s: Sahne & { h: string }) {
    const sb = db.istemci() as never
    const p = (await (await import('../doktor/hastaDosyaDerleyici')).hastaDosyaPaketiniDerle(sb, s.doktor.id, s.h))!
    const q = (await (await import('../doktor/dosyaOlaylari')).dosyaSorguVerisiDerle(sb, s.doktor.id, s.h))!
    return { ...p, olaylar: q.olaylar }
  }

  it("kanal:'ses' + sıradan / adsız soru → açık hastanın yalnız kısa özeti (tam dosya, kanıt yok) — NOTYA-AKTIF-HASTA-01", async () => {
    const s = gercekci()
    yanit = { metin: JSON.stringify({ speech: 'Hocam, buradayım.' }) }
    for (const mesaj of ['Merhaba Ayşe, nasılsınız?', 'Bu hastaya sefuroksim versem olur mu?']) {
      odakla(s)
      assert.equal((await ses({ sahne: s, mesaj })).status, 200)
      const t = sistem()
      assert.ok(t.includes(`=== AKTİF HASTA DOSYASI: ${F.GERCEKCI_HASTA_ADI} ===`), mesaj)
      assert.ok(t.includes(D.SES_OZET_BASLIK), `${mesaj}: kısa özet`)
      assert.ok(!t.includes('## VİZİT GEÇMİŞİ') && !t.includes('[TAM SOAP]') && !t.includes('## AŞILAR') && !t.includes('## BELGELER'), `${mesaj}: tam dosya gövdesi yok`)
      assert.ok(!t.includes(KANIT), `${mesaj}: kanıt bloğu yok`)
      assert.ok(t.includes('Tegretol') && t.includes('Penisilin') && t.includes('SpO₂ %91'), `${mesaj}: güvenlik bilgisi özette`)
    }
  })

  it("kanal:'ses' + adlı klinik soru → yalnız kısa özet (tam dosya, kanıt yok)", async () => {
    const s = gercekci()
    odakla(s)
    const mesaj = `${F.GERCEKCI_HASTA_ADI} için sefuroksim versem olur mu?`
    yanit = { metin: JSON.stringify({ speech: `${F.GERCEKCI_HASTA_ADI} — sefuroksim değerlendirmesi.` }) }
    assert.equal((await ses({ sahne: s, mesaj })).status, 200)
    const t = sistem()
    assert.ok(t.includes(`=== AKTİF HASTA DOSYASI: ${F.GERCEKCI_HASTA_ADI} ===`), mesaj)
    assert.ok(t.includes(D.SES_OZET_BASLIK), `${mesaj}: kısa özet`)
    assert.ok(!t.includes('## VİZİT GEÇMİŞİ') && !t.includes('[TAM SOAP]') && !t.includes('## AŞILAR') && !t.includes('## BELGELER'), `${mesaj}: tam dosya gövdesi yok`)
    assert.ok(!t.includes(KANIT), `${mesaj}: kanıt bloğu yok`)
    assert.ok(t.includes('Tegretol') && t.includes('Penisilin') && t.includes('SpO₂ %91'), `${mesaj}: güvenlik bilgisi özette`)
  })

  it("kanal:'ses' + İlk-10 sorusu (adsız, açık hasta) → kısa özet + kanıt bloğu (ikisi de); kanıt yazıdakiyle aynı", async () => {
    const s = gercekci()
    odakla(s)
    yanit = { metin: JSON.stringify({ speech: `${F.GERCEKCI_HASTA_ADI} — özet.` }) }
    const soru = 'Bu hastayı bana kısaca özetler misin?'
    await ses({ sahne: s, mesaj: soru })
    const t = sistem()
    assert.ok(t.includes(D.SES_OZET_BASLIK), 'kısa özet')
    assert.ok(t.includes(KANIT), 'kanıt bloğu')
    assert.ok(!t.includes('## VİZİT GEÇMİŞİ'), 'tam dosya gövdesi yok')
    const kanitSes = t.slice(t.indexOf(KANIT))

    odakla(s)
    await yazi(s, soru, s.oturum)
    const y = sistem()
    assert.ok(y.includes('## VİZİT GEÇMİŞİ') && y.includes(KANIT), 'yazı: tam dosya + kanıt')
    assert.equal(kanitSes, y.slice(y.indexOf(KANIT)), 'kanıt bloğu (ve sonrası) iki kanalda bayt bayt aynı')
  })

  it("kanal:'yazi' → soru türünden bağımsız TAM dosya (adsız da adlı da; açık hasta)", async () => {
    const s = gercekci()
    for (const mesaj of ['Merhaba Ayşe, nasılsınız?', 'Bu hastaya sefuroksim versem olur mu?', `${F.GERCEKCI_HASTA_ADI} geçen sonbaharda kulak için ne yazmıştık?`]) {
      odakla(s)
      yanit = { metin: JSON.stringify({ speech: `${F.GERCEKCI_HASTA_ADI} — değerlendirme.` }) }
      await yazi(s, mesaj, s.oturum)
      const t = sistem()
      assert.ok(t.includes('## VİZİT GEÇMİŞİ') && t.includes('[TAM SOAP]') && t.includes('## AŞILAR'), `${mesaj}: tam dosya`)
      assert.ok(!t.includes(D.SES_OZET_BASLIK), `${mesaj}: kısa özet yok`)
      assert.ok(t.includes('Vizit özetleri yoğun ve yaklaşık 1 dakikada okunur'), `${mesaj}: tam dosyanın kuralları aynen`)
    }
  })

  it("kanal:'ses' + özette olmayan kaydı soran tur (eski vizit, tarih, görüntüleme) → tam dosya — \"dosyada yok\" denmesin", async () => {
    const s = gercekci()
    odakla(s)
    yanit = { metin: JSON.stringify({ speech: `${F.GERCEKCI_HASTA_ADI} — sonbahar viziti.` }) }
    await ses({ sahne: s, mesaj: `${F.GERCEKCI_HASTA_ADI} geçen sonbaharda kulak için ne yazmıştık?` })
    const t = sistem()
    assert.ok(t.includes('## VİZİT GEÇMİŞİ') && !t.includes(D.SES_OZET_BASLIK))
    for (const m of ['Merhaba Ayşe, nasılsınız?', 'Bu hastaya sefuroksim versem olur mu?', 'teşekkürler', 'ibuprofen dozu ne olmalı']) assert.equal(S.sesTamDosyaGerekirMi(m), false, m)
    for (const m of ['önceki vizitte ne demiştik', 'röntgen sonucu neydi', 'epikrizde ne yazıyor', 'mart ayında geldiğinde', 'Tegretol ne zaman başlandı']) assert.equal(S.sesTamDosyaGerekirMi(m), true, m)
  })

  it('kısa özet tam dosyanın yarısından küçük', async () => {
    const s = gercekci()
    const p = await paket(s)
    const kisa = D.hastaOzetiKisa(p)
    assert.ok(kisa.length * 2 < p.metin.length, `${kisa.length} / ${p.metin.length}`)
  })

  it('güvenlik olguları kısa özette: alerji, alerji çatışması, bütün aktif ilaçlar, etkileşim, KRİTİK, acil bayrak, kronik tanı, kilo, kan grubu', async () => {
    const s = gercekci()
    const p = await paket(s)
    const kisa = D.hastaOzetiKisa(p)
    const G = F.GUVENLIK_OLGULARI
    assert.ok(kisa.includes(`Alerji: ${G.alerji}`), 'alerji (HIZLI KART)')
    assert.ok(kisa.includes(G.alerjiCatismasi), 'penisilin alerjisi ↔ Augmentin reçetesi')
    for (const ilac of G.aktifIlaclar) assert.ok(kisa.includes(`- ${ilac}`), `aktif ilaç ${ilac}`)
    assert.match(kisa, /İlaç etkileşimi \(ciddi\): Karbamazepin \+ "Klacid"/, 'Tegretol ↔ Klacid')
    assert.ok(kisa.includes(`⚠ KRİTİK`) && kisa.includes(G.kritik), 'kritik bulgu')
    assert.ok(kisa.includes('⚠ acil bayrak') && kisa.includes(G.acilBelge), 'acil bayraklı belge')
    assert.match(kisa, new RegExp(`G40\\.9 ${G.kronik}`), 'kronik hastalık vizit tanısından')
    assert.ok(kisa.includes(`Güncel kilo: ${G.kilo}`), 'doz için kilo')
    assert.ok(kisa.includes(G.kanGrubu), 'kan grubu')
    // Tam dosyanın ilaç bölümü satır satır ve her KRİTİK satırı kısa özette.
    const bolum = p.metin.split('## SÜREKLİ / KAYITLI İLAÇLAR\n')[1].split('\n\n')[0].split('\n').filter(Boolean)
    for (const satir of bolum) assert.ok(kisa.includes(satir), `ilaç satırı: ${satir}`)
    for (const k of p.metin.split('\n').filter((x) => x.startsWith('KRİTİK:'))) assert.ok(kisa.includes(k.slice(8).trim()), k)
    // Bulk düşer.
    for (const baslik of ['## VİZİT GEÇMİŞİ', '## AŞILAR', '## ONAYLI LAB', '## GÖRÜNTÜLEME', '## BELGELER', '## RANDEVULAR']) assert.ok(!kisa.includes(baslik), baslik)
  })

  it('eski önbellek satırı (kart / olay dizini yok): metinden ilaç, kritik bulgu ve HIZLI KART yine gelir', async () => {
    const s = gercekci()
    const p = await paket(s)
    const kisa = D.hastaOzetiKisa({ metin: p.metin, kart: {}, olaylar: [] })
    assert.ok(kisa.includes('## HIZLI KART') && kisa.includes('Alerji: Penisilin'))
    for (const ilac of F.GUVENLIK_OLGULARI.aktifIlaclar) assert.ok(kisa.includes(`- ${ilac}`), ilac)
    assert.ok(kisa.includes(F.GUVENLIK_OLGULARI.kritik))
    assert.match(kisa, /Epilepsi/)
  })
})
