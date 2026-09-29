/**
 * NOTYA-MODEL-LUNAPRO-01 — birincil (GPT-6 Luna-Pro) → koruyucu (Sonnet 5) kapıları, uçtan uca (sahte fetch, ağ yok).
 *  G1 transport, G2 (a)–(f) low_conf, G3 safety (LUNAPRO-02: kaldırıldı, yalnız işaret), G4 devre; sesli akışta ilk sözden önce / sonra.
 * Her yanıtın hangi kademeden ve hangi nedenle geldiği yanitKademesi() ile okunur (ölçüm satırıyla aynı değer).
 * Sentetik veri — hasta verisi yok.
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

delete process.env.NEXT_PUBLIC_SUPABASE_URL

import { aiAkis, aiCagir, AiIptalHatasi, kaliteKodu, TASIMA_BEKLEME, yanitKademesi, yanitMetni, type AiMesaj } from './cagir'
import { MODEL_GUCLU, MODEL_HIZLI } from './modeller'
import { devreDurumu, devreSifirla } from './devre'
import { jsonOnar } from './jsonOnar'
import { soapNotuUret, SOAP_GUVEN_ESIGI } from '@/lib/doktor/soapUret'
process.env.NOTYA_DEVRE_ACIK = '1' // LUNAPRO-03: breaker is off by default; these suites test it explicitly

type Cevap = { durum?: number; json?: unknown; ham?: string; sse?: string[]; sseKop?: string[]; sseAsili?: string[]; yanitsiz?: boolean }
type Istek = { govde: Record<string, any> }

const orijinalFetch = globalThis.fetch
let istekler: Istek[] = []
let sira: Cevap[] = []
/** Verilirse sıra yerine istek gövdesine göre cevap seçer (paralel çağrılar için). */
let secici: ((govde: Record<string, any>) => Cevap) | null = null

function sahteFetch() {
  globalThis.fetch = (async (_url: unknown, o?: RequestInit) => {
    const govde = JSON.parse(String(o?.body || '{}'))
    istekler.push({ govde })
    const c = secici ? secici(govde) : sira.shift()
    if (!c) throw new Error('beklenmeyen istek')
    const kod = new TextEncoder()
    if (c.yanitsiz) {
      // Sağlayıcı henüz başlık bile dönmedi (kuyrukta) — istek yalnız çağıranın sinyaliyle biter.
      return new Promise<Response>((_, red) => o?.signal?.addEventListener('abort', () => red(new DOMException('aborted', 'AbortError')), { once: true }))
    }
    if (c.sse) {
      const g = new ReadableStream({ start(k) { for (const s of c.sse!) k.enqueue(kod.encode(s)); k.close() } })
      return new Response(g, { status: 200 })
    }
    if (c.sseAsili) {
      // Parçaları verir, sonra model yazmaya devam ediyormuş gibi bekler — yalnız çağıranın sinyali akışı keser.
      const parcalar = [...c.sseAsili]
      const g = new ReadableStream({
        start(k) {
          for (const p of parcalar) k.enqueue(kod.encode(p))
          o?.signal?.addEventListener('abort', () => k.error(new DOMException('aborted', 'AbortError')), { once: true })
        },
      })
      return new Response(g, { status: 200 })
    }
    if (c.sseKop) {
      // Parçaları tek tek verir, sonra akış koparır (ağ kesintisi).
      const parcalar = [...c.sseKop]
      const g = new ReadableStream({ pull(k) { const p = parcalar.shift(); if (p !== undefined) k.enqueue(kod.encode(p)); else k.error(new TypeError('socket hang up')) } })
      return new Response(g, { status: 200 })
    }
    return new Response(c.ham ?? JSON.stringify(c.json ?? {}), { status: c.durum ?? 200 })
  }) as typeof fetch
}

function tamam(metin: string | null, ek: { finish_reason?: string; tool_calls?: unknown[] } = {}): Cevap {
  return { json: { id: 'g', model: 'x', choices: [{ message: { role: 'assistant', content: metin, ...(ek.tool_calls ? { tool_calls: ek.tool_calls } : {}) }, finish_reason: ek.finish_reason ?? 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 5 } } }
}
const sse = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`
const modeller = () => istekler.map((i) => i.govde.model)
const METIN: AiMesaj[] = [{ role: 'user', content: 'üç gündür öksürük' }]

const eski = { k: process.env.OPENROUTER_API_KEY, h: process.env.NOTYA_MODEL_HIZLI, g: process.env.NOTYA_MODEL_GUCLU }
beforeEach(() => {
  process.env.OPENROUTER_API_KEY = 'sk-or-test'
  delete process.env.NOTYA_MODEL_HIZLI
  delete process.env.NOTYA_MODEL_GUCLU
  istekler = []; sira = []; secici = null; TASIMA_BEKLEME.ms = 1
  devreSifirla()
  sahteFetch()
})
afterEach(() => {
  globalThis.fetch = orijinalFetch
  TASIMA_BEKLEME.ms = 400
  for (const [ad, d] of [['OPENROUTER_API_KEY', eski.k], ['NOTYA_MODEL_HIZLI', eski.h], ['NOTYA_MODEL_GUCLU', eski.g]] as const) {
    if (d === undefined) delete process.env[ad]; else process.env[ad] = d
  }
})

describe('G1 transport', () => {
  it('birincil 500 → 200: birincil cevabı, koruyucu yok', async () => {
    sira = [{ durum: 500 }, tamam('tamam')]
    const y = await aiCagir({ gorev: 'sohbet-uzman', messages: METIN })
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_HIZLI])
    assert.deepEqual(yanitKademesi(y), { kademe: 'hizli', neden: null })
  })
  it('birincil 500, 500 → koruyucu, neden transport', async () => {
    sira = [{ durum: 500 }, { durum: 500 }, tamam('koruyucu')]
    const y = await aiCagir({ gorev: 'klinik-analiz', messages: METIN })
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_HIZLI, MODEL_GUCLU])
    assert.deepEqual(yanitKademesi(y), { kademe: 'guclu', neden: 'transport' })
  })
  it('boş gövde iki kez → koruyucu (transport); boş içerik → koruyucu (low_conf)', async () => {
    sira = [{ ham: '' }, { ham: '' }, tamam('k')]
    assert.equal(yanitKademesi(await aiCagir({ gorev: 'sohbet', messages: METIN }))?.neden, 'transport')
    istekler = []
    sira = [tamam('   '), tamam('k')]
    assert.equal(yanitKademesi(await aiCagir({ gorev: 'sohbet', messages: METIN }))?.neden, 'low_conf')
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_GUCLU])
  })
})

describe('G2 (d) yapılandırılmış iş — JSON', () => {
  it('ayrıştırılamayan ve kurtarılamayan JSON (soap) → koruyucu bir kez, neden low_conf', async () => {
    sira = [tamam('Muayene notu: hasta üç gündür öksürüyor, bronşit düşünüldü.'), tamam('{"soap":{"subjektif":"öksürük"}}')]
    const y = await aiCagir({ gorev: 'soap', messages: METIN })
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_GUCLU])
    assert.deepEqual(yanitKademesi(y), { kademe: 'guclu', neden: 'low_conf' })
  })
  it('max_tokens kesilmesi (length) → koruyucu, kesik JSON F3 ile kurtarılabilse bile', async () => {
    sira = [tamam('{"soap":{"subjektif":"öksürük"},"ilaclar":[{"ad":"x"', { finish_reason: 'length' }), tamam('{"soap":{}}')]
    const y = await aiCagir({ gorev: 'goruntu-inceleme', messages: METIN })
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_GUCLU])
    assert.equal(yanitKademesi(y)?.neden, 'low_conf')
  })
  it('kurtarılabilir JSON (çit, sondaki düzyazı, stop ile yarım dizi) → koruyucu YOK', async () => {
    for (const metin of [
      '```json\n{"soap":{"subjektif":"öksürük"}}\n```',
      'İşte not: {"soap":{"subjektif":"öksürük"}} Umarım faydalı olur.',
      '{"soap":{"subjektif":"öksürük"},"ilaclar":[{"ad":"x"},{"ad":"y"',
    ]) {
      assert.ok(jsonOnar(metin), metin)
      istekler = []
      sira = [tamam(metin)]
      const y = await aiCagir({ gorev: 'soap', messages: METIN })
      assert.deepEqual(modeller(), [MODEL_HIZLI], metin)
      assert.deepEqual(yanitKademesi(y), { kademe: 'hizli', neden: null })
    }
  })
  it('düzyazı görevleri JSON kontrolünden geçmez; klinik-analiz yalnız jsonBekleniyor ile, görüntü işi false ile kapanır', async () => {
    const duz = 'Hasta için 1 hafta sonra kontrol uygun olur.'
    assert.equal(kaliteKodu({ gorev: 'klinik-analiz' }, (await (async () => { sira = [tamam(duz)]; return aiCagir({ gorev: 'klinik-analiz', messages: METIN }) })())), null)
    assert.deepEqual(modeller(), [MODEL_HIZLI])
    istekler = []
    sira = [tamam(duz)]
    await aiCagir({ gorev: 'goruntu-inceleme', jsonBekleniyor: false, messages: METIN })
    assert.deepEqual(modeller(), [MODEL_HIZLI])
    istekler = []
    sira = [tamam(duz), tamam('{"doz":"250 mg"}')]
    await aiCagir({ gorev: 'klinik-analiz', jsonBekleniyor: true, messages: METIN })
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_GUCLU])
  })
  it('istek başına en fazla BİR düşüş: koruyucunun cevabı da bozuksa üçüncü çağrı yok', async () => {
    sira = [tamam('bozuk'), tamam('yine bozuk')]
    const y = await aiCagir({ gorev: 'soap', messages: METIN })
    assert.equal(istekler.length, 2)
    assert.equal(yanitMetni(y), 'yine bozuk')
  })
})

describe('G2 (e) araç çağrısı', () => {
  const ARACLAR = [{ name: 'vital_ekle', description: 'Vital ekle', input_schema: { type: 'object', properties: {} } }]
  const cagri = (ad: string, args: string) => [{ id: 'c1', type: 'function', function: { name: ad, arguments: args } }]
  it('bilinmeyen araç adı → koruyucu', async () => {
    sira = [tamam(null, { tool_calls: cagri('hasta_sil', '{}'), finish_reason: 'tool_calls' }), tamam('k')]
    const y = await aiCagir({ gorev: 'sohbet-uzman', messages: METIN, araclar: ARACLAR })
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_GUCLU])
    assert.equal(yanitKademesi(y)?.neden, 'low_conf')
  })
  it('JSON olmayan araç argümanı → koruyucu', async () => {
    sira = [tamam(null, { tool_calls: cagri('vital_ekle', '{"ates": 38,'), finish_reason: 'tool_calls' }), tamam('k')]
    await aiCagir({ gorev: 'sohbet-uzman', messages: METIN, araclar: ARACLAR })
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_GUCLU])
  })
  it('geçerli araç çağrısı → birincil, input çözülür', async () => {
    sira = [tamam(null, { tool_calls: cagri('vital_ekle', '{"ates":38}'), finish_reason: 'tool_calls' })]
    const y = await aiCagir({ gorev: 'sohbet-uzman', messages: METIN, araclar: ARACLAR })
    assert.deepEqual(modeller(), [MODEL_HIZLI])
    assert.deepEqual((y.content as { input?: unknown }[])[0].input, { ates: 38 })
  })
})

describe('G2 (f) SOAP gövdesi ai_confidence', () => {
  const govde = (guven: number) => JSON.stringify({ basvuruYakinmasi: 'Öksürük', soap: { subjektif: 'Şikayet: öksürük', objektif: 'Genel durum: iyi', degerlendirme: '1. Akut bronşit', plan: '1. Bol sıvı' }, vitaller: {}, ilaclar: [], asilar: [], icd10_codes: [], ai_confidence: guven })
  const ONERI = JSON.stringify({ aiDegerlendirme: 'Öneri (doktor onayına tabi): izlem.', receteOnerisi: [], kritik_bulgular: [], alarmBulgulari: [], hasta_ozeti: 'Akut bronşit saptandı.' })
  const GIRDI = { transcript: 'Sentetik: üç gündür öksürük, ateş yok. Bol sıvı.', specialty: 'dahiliye' }
  const govdeIstegi = (g: Record<string, any>) => JSON.stringify(g.messages.at(-1)).includes('YALNIZ (A) NOT GÖVDESİ')
  const istemci = { messages: { create: async () => { throw new Error('OpenRouter açıkken SDK çağrılmamalı') } } }

  it(`eşik ${SOAP_GUVEN_ESIGI}: birincil gövde 0.4 → gövde koruyucuda yeniden yazılır, öneri (B) tekrarlanmaz`, async () => {
    secici = (g) => govdeIstegi(g) ? tamam(g.model === MODEL_GUCLU ? govde(0.92).replace('Akut bronşit', 'Akut bronşit (koruyucu)') : govde(0.4)) : tamam(ONERI)
    const not = await soapNotuUret(istemci as never, GIRDI)
    const govdeModelleri = istekler.filter((i) => govdeIstegi(i.govde)).map((i) => i.govde.model)
    assert.deepEqual(govdeModelleri, [MODEL_HIZLI, MODEL_GUCLU])
    assert.equal(istekler.filter((i) => !govdeIstegi(i.govde)).length, 1)
    assert.match(String(not.soap?.degerlendirme), /koruyucu/)
    assert.equal(not.ai_confidence, 0.92)
  })
  it('birincil gövde 0.9 → yeniden yazma yok (uzun ya da iyi cevap tetiklemez)', async () => {
    secici = (g) => govdeIstegi(g) ? tamam(govde(0.9)) : tamam(ONERI)
    const not = await soapNotuUret(istemci as never, GIRDI)
    assert.deepEqual(modeller().filter((m) => m === MODEL_GUCLU), [])
    assert.equal(not.ai_confidence, 0.9)
  })
  it('gövde zaten koruyucudan geldiyse (G1) düşük güven ikinci düşüşe yol açmaz', async () => {
    let govdeSayac = 0
    secici = (g) => {
      if (!govdeIstegi(g)) return tamam(ONERI)
      govdeSayac++
      return govdeSayac <= 2 ? { durum: 500 } : tamam(govde(0.3))
    }
    const not = await soapNotuUret(istemci as never, GIRDI)
    assert.deepEqual(istekler.filter((i) => govdeIstegi(i.govde)).map((i) => i.govde.model), [MODEL_HIZLI, MODEL_HIZLI, MODEL_GUCLU])
    assert.equal(not.ai_confidence, 0.3)
  })
  it('koruyucu yeniden yazımı düşerse birincilin notu kullanılır (hekim boş not görmez)', async () => {
    secici = (g) => govdeIstegi(g) ? (g.model === MODEL_GUCLU ? { durum: 500 } : tamam(govde(0.4))) : tamam(ONERI)
    const not = await soapNotuUret(istemci as never, GIRDI)
    assert.equal(not.ai_confidence, 0.4)
    assert.equal(not.soap?.degerlendirme, '1. Akut bronşit')
  })
})

describe('G3 safety ve görsel', () => {
  it('LUNAPRO-02: güvenlik sinyali yönlendirmeyi DEĞİŞTİRMEZ — birincil çağrılır, neden null (Sonnet yalnız başarısızlıkta)', async () => {
    sira = [tamam('k')]
    const y = await aiCagir({ gorev: 'klinik-analiz', messages: [{ role: 'user', content: 'hasta gebe, warfarin alıyor, 10 mg/kg ibuprofen ne verelim' }] })
    assert.deepEqual(modeller(), [MODEL_HIZLI])
    assert.deepEqual(yanitKademesi(y), { kademe: 'hizli', neden: null })
  })
  it('görsel/PDF → BİRİNCİL (GÖRSEL = GÜÇLÜ emekli)', async () => {
    sira = [tamam('{"satirlar":[]}')]
    await aiCagir({ gorev: 'goruntu-inceleme', messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AA' } }, { type: 'text', text: 'Karneyi oku' }] }] })
    assert.deepEqual(modeller(), [MODEL_HIZLI])
  })
})

describe('G4 devre — uçtan uca', () => {
  it('5 başarısız istekten sonra devre açık: birincil çağrılmaz, neden devre; iyi cevap tek başına kapatmaz', async () => {
    for (let i = 0; i < 5; i++) {
      sira = [tamam(''), tamam('k')] // G2 (a) boş → koruyucu
      await aiCagir({ gorev: 'sohbet', messages: METIN })
    }
    assert.equal(devreDurumu(MODEL_HIZLI), 'acik')
    istekler = []
    sira = [tamam('koruyucu')]
    const y = await aiCagir({ gorev: 'sohbet', messages: METIN })
    assert.deepEqual(modeller(), [MODEL_GUCLU])
    assert.deepEqual(yanitKademesi(y), { kademe: 'guclu', neden: 'devre' })
  })
})

describe('sesli akış (aiAkis)', () => {
  const istemci = { messages: { create: async () => { throw new Error('OpenRouter açıkken SDK çağrılmamalı') } } }
  it('ilk sözden ÖNCE kopan akış → birincil bir kez daha → koruyucu akışı', async () => {
    sira = [{ sseKop: [': OPENROUTER PROCESSING\n\n'] }, { durum: 502 }, { sse: [sse({ choices: [{ delta: { content: 'Koruyucu' } }] }), 'data: [DONE]\n\n'] }]
    const parcalar: string[] = []
    const y = await aiAkis({ istemci, gorev: 'sohbet-uzman', messages: METIN }, (p) => parcalar.push(p))
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_HIZLI, MODEL_GUCLU])
    assert.deepEqual(parcalar, ['Koruyucu'])
    assert.equal(yanitKademesi(y)?.neden, 'transport')
  })
  it('ilk sözden SONRA kopan akış → yeniden söylenmez, koruyucu çağrılmaz; kesik tur (max_tokens) olarak döner', async () => {
    sira = [{ sseKop: [sse({ choices: [{ delta: { content: '{"speech":"Hocam hasta' } }] }), sse({ choices: [{ delta: { content: ' üç gündür' } }] })] }]
    const parcalar: string[] = []
    const y = await aiAkis({ istemci, gorev: 'sohbet-uzman', messages: METIN }, (p) => parcalar.push(p))
    assert.deepEqual(modeller(), [MODEL_HIZLI])
    assert.deepEqual(parcalar, ['{"speech":"Hocam hasta', ' üç gündür'])
    assert.equal(y.stop_reason, 'max_tokens')
    assert.equal(yanitMetni(y), '{"speech":"Hocam hasta üç gündür')
    assert.deepEqual(yanitKademesi(y), { kademe: 'hizli', neden: null })
  })
  it('hiç söz söylenmeden bozuk araç çağrısı → koruyucu akışı', async () => {
    sira = [
      { sse: [sse({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'c', function: { name: 'yok_boyle_arac', arguments: '{}' } }] }, finish_reason: 'tool_calls' }] }), 'data: [DONE]\n\n'] },
      { sse: [sse({ choices: [{ delta: { content: 'K' } }] }), 'data: [DONE]\n\n'] },
    ]
    await aiAkis({ istemci, gorev: 'sohbet-uzman', messages: METIN, araclar: [{ name: 'vital_ekle' }] }, () => {})
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_GUCLU])
  })
  it('NOTYA-SES-FISH-UCTAN-UCA-01: çağıran iptal ederse (söz kesme) akış durur — yeniden deneme yok, koruyucu yok, kesik tur yok', async () => {
    sira = [{ sseAsili: [sse({ choices: [{ delta: { content: '{"speech":"Hocam' } }] })] }]
    const kontrol = new AbortController()
    const parcalar: string[] = []
    const soz = aiAkis({ istemci, gorev: 'sohbet-uzman', messages: METIN, iptal: kontrol.signal }, (p) => { parcalar.push(p); kontrol.abort() })
    await assert.rejects(soz, (e) => e instanceof AiIptalHatasi)
    assert.deepEqual(modeller(), [MODEL_HIZLI], 'tek istek: iptal ikinci bir model çağrısı doğurmaz')
    assert.deepEqual(parcalar, ['{"speech":"Hocam'])
  })
  it('NOTYA-SES-FISH-UCTAN-UCA-01: ilk sözden ÖNCE iptal taşıma hatası sayılmaz (birincil tekrar + koruyucu = üç çağrı olurdu)', async () => {
    sira = [{ sseAsili: [': OPENROUTER PROCESSING\n\n'] }]
    const kontrol = new AbortController()
    const soz = aiAkis({ istemci, gorev: 'sohbet-uzman', messages: METIN, iptal: kontrol.signal }, () => {})
    setTimeout(() => kontrol.abort(), 5)
    await assert.rejects(soz, (e) => e instanceof AiIptalHatasi)
    assert.deepEqual(modeller(), [MODEL_HIZLI])
  })
  it('NOTYA-SES-FISH-UCTAN-UCA-01: istek daha yanıt başlığı almadan iptal edilirse 504 taşıma hatası sayılmaz (tekrar + koruyucu yok)', async () => {
    sira = [{ yanitsiz: true }]
    const kontrol = new AbortController()
    const soz = aiAkis({ istemci, gorev: 'sohbet-uzman', messages: METIN, iptal: kontrol.signal }, () => {})
    setTimeout(() => kontrol.abort(), 5)
    await assert.rejects(soz, (e) => e instanceof AiIptalHatasi)
    assert.deepEqual(modeller(), [MODEL_HIZLI])
  })
  it('NOTYA-SES-FISH-UCTAN-UCA-01: zaten iptal edilmiş tur modele hiç gitmez; OpenRouter yokken doğrudan akış da durur', async () => {
    const kontrol = new AbortController()
    kontrol.abort()
    await assert.rejects(aiAkis({ istemci, gorev: 'sohbet-uzman', messages: METIN, iptal: kontrol.signal }, () => {}), (e) => e instanceof AiIptalHatasi)
    assert.equal(istekler.length, 0)

    delete process.env.OPENROUTER_API_KEY
    let olay = 0
    const k2 = new AbortController()
    const dogrudan = { messages: { create: async () => (async function* () {
      yield { type: 'message_start', message: { model: 'sahte', usage: {} } }
      for (;;) { olay += 1; yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'a' } }; await new Promise((r) => setTimeout(r, 1)) }
    })() } }
    await assert.rejects(aiAkis({ istemci: dogrudan, gorev: 'sohbet-uzman', messages: METIN, iptal: k2.signal }, () => { if (olay >= 3) k2.abort() }), (e) => e instanceof AiIptalHatasi)
    assert.ok(olay < 10, 'akış iptalden sonra okunmaya devam etmedi')
  })
  it('devre açıkken akış doğrudan koruyucuya gider', async () => {
    for (let i = 0; i < 5; i++) { sira = [tamam(''), tamam('k')]; await aiCagir({ gorev: 'sohbet', messages: METIN }) }
    istekler = []
    sira = [{ sse: [sse({ choices: [{ delta: { content: 'K' } }] }), 'data: [DONE]\n\n'] }]
    const y = await aiAkis({ istemci, gorev: 'sohbet', messages: METIN }, () => {})
    assert.deepEqual(modeller(), [MODEL_GUCLU])
    assert.equal(yanitKademesi(y)?.neden, 'devre')
  })
})
