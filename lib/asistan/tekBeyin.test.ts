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

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-tek-beyin-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'
const SIR = 'qa-sentetik-ses-llm-sirri-0123456789abcdef'
process.env.NOTYA_SES_LLM_SECRET = SIR
process.env.NOTYA_SES_JETON_SECRET = 'qa-sentetik-ses-jeton-anahtari-0123456789ab'

let db = new SahteVeritabani()
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
let yanit: { metin: string; araclar?: { name: string; input: Record<string, unknown> }[] } = { metin: JSON.stringify({ speech: 'Sentetik yanıt.' }) }
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
  return (await y.json()) as { turlar: { metin: string; kartlar: string[]; hastaId: string | null }[]; bekleyen: string[]; aktifHasta: string | null }
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
  it('bayrak: varsayılan boş = kimse geçmedi', () => {
    assert.equal(J.tekBeyinAcikMi('d1', ''), false)
    assert.equal(J.tekBeyinAcikMi('d1', undefined), false)
    assert.equal(J.tekBeyinAcikMi('d1', 'd0, d1'), true)
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
    assert.ok(v.parcalar.length >= 3, 'cevap tek parça değil, cümle cümle akar')
    assert.ok(!v.metin.includes('0532'), v.metin)
    assert.equal(v.metin.replace(/\s+/g, ' ').trim(), `Hocam, Umutcan’ın son vizitinde öksürük vardı. Akciğer sesleri temizdi. Öneri 1. Öneri 2. ${K.ILETISIM_EKRANDA}`)

    const e = await sesEkrani(b)
    assert.equal(e.turlar.at(-1)?.metin, t.speech, 'ses turunun ekranı yazılı cevapla aynı')
    assert.equal(t.speech, ekranMetni)
    // Aynı model isteği (sistem, geçmiş, araçlar) — tek fark stream bayrağı
    const [ty, sy] = [JSON.parse(yaziIstegi), JSON.parse(modelIstekleri.at(-1)!.govde)]
    delete sy.stream
    assert.equal(JSON.stringify(sy.system).replace(new RegExp(b.hasta, 'g'), 'H').replace(new RegExp(b.doktor.id, 'g'), 'D'), JSON.stringify(ty.system).replace(new RegExp(a.hasta, 'g'), 'H').replace(new RegExp(a.doktor.id, 'g'), 'D'))
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
    assert.ok(JSON.stringify(son.system).includes(s.hasta), 'aktif hasta yazılı turda da bağlamda')
    assert.ok(JSON.stringify(son.messages).includes('Umutcan Türkoğlu’nun son muayenesinde ne vardı'), 'sesli tur yazılı geçmişte')
    const mesajlar = db.tablo('asistan_sessions').find((o) => o.id === s.oturum)!.messages
    assert.equal(mesajlar.length, 4)
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
