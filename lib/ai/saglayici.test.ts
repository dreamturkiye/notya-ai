/**
 * NOTYA-MODEL-LUNA-01 — OpenRouter taşıma yolu ve iki kapı (Kaan, 2026-09-26, karar A).
 *  - TAŞIMA: Luna 5xx / 429 / ağ / boş gövde → 400 ms → Luna bir kez → Sonnet 5. 4xx istek hatası yükseltilmez.
 *  - KALİTE: görsel/PDF, güvenlik sinyali, klinik görev → çağrıdan önce Sonnet 5; Luna boş/ret/düşük güven → Sonnet 5.
 *  - Çeviri: system cache_control, görsel/PDF, tool_use ↔ tool_calls, usage, F3 (length → max_tokens), SSE akışı.
 *  - OPENROUTER_API_KEY yoksa eski Anthropic yolu birebir (SDK istemcisi), OpenAI modeli GÜÇLÜ'ye düşer.
 * Ağ erişimi yok: globalThis.fetch sahte.
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { aiAkis, aiCagir, dusukGuvenliYanit, TASIMA_BEKLEME, yanitMetni, type AiMesaj } from './cagir'
import { gucluModel, hizliModel, MODEL_GUCLU, MODEL_HIZLI } from './modeller'
import { dogrudanModelAdi, kullanimCevir, mesajlariCevir, openRouterGovdesi, openRouterModelAdi, openRouterYanitiniCevir, yolSec } from './saglayici'

const METIN: AiMesaj[] = [{ role: 'user', content: 'şifremi nasıl değiştiririm' }]
const GORSEL: AiMesaj[] = [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } }, { type: 'text', text: 'Bu nedir?' }] }]
const PDF: AiMesaj[] = [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: 'BBBB' } }, { type: 'text', text: 'Çıkar' }] }]

type Istek = { url: string; basliklar: Record<string, string>; govde: Record<string, any> }
type Cevap = { durum?: number; json?: unknown; ham?: string; ag?: boolean; sse?: string[] }

const orijinalFetch = globalThis.fetch
let istekler: Istek[] = []
let sira: Cevap[] = []

function tamam(metin: string, ek: Record<string, unknown> = {}) {
  return { json: { id: 'gen-1', model: ek.model ?? 'x', choices: [{ message: { role: 'assistant', content: metin, ...(ek.message as object || {}) }, finish_reason: ek.finish_reason ?? 'stop' }], usage: { prompt_tokens: 100, completion_tokens: 10 } } }
}

function sahteFetch() {
  globalThis.fetch = (async (url: unknown, o?: RequestInit) => {
    istekler.push({ url: String(url), basliklar: (o?.headers || {}) as Record<string, string>, govde: JSON.parse(String(o?.body || '{}')) })
    const c = sira.shift()
    if (!c) throw new Error('beklenmeyen istek')
    if (c.ag) throw new TypeError('fetch failed')
    if (c.sse) {
      const kod = new TextEncoder()
      const govde = new ReadableStream({ start(k) { for (const s of c.sse!) k.enqueue(kod.encode(s)); k.close() } })
      return new Response(govde, { status: 200, headers: { 'content-type': 'text/event-stream' } })
    }
    return new Response(c.ham ?? JSON.stringify(c.json ?? {}), { status: c.durum ?? 200 })
  }) as typeof fetch
}

const eskiOrtam = { k: process.env.OPENROUTER_API_KEY, h: process.env.NOTYA_MODEL_HIZLI, g: process.env.NOTYA_MODEL_GUCLU }
function ortamiGeriYukle() {
  for (const [ad, d] of [['OPENROUTER_API_KEY', eskiOrtam.k], ['NOTYA_MODEL_HIZLI', eskiOrtam.h], ['NOTYA_MODEL_GUCLU', eskiOrtam.g]] as const) {
    if (d === undefined) delete process.env[ad]; else process.env[ad] = d
  }
}

describe('OpenRouter açık — taşıma kapısı (Luna → 400 ms → Luna → Sonnet 5)', () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    delete process.env.NOTYA_MODEL_HIZLI
    delete process.env.NOTYA_MODEL_GUCLU
    istekler = []; sira = []; TASIMA_BEKLEME.ms = 1
    sahteFetch()
  })
  afterEach(() => { globalThis.fetch = orijinalFetch; TASIMA_BEKLEME.ms = 400; ortamiGeriYukle() })

  it('Luna 500 sonra 200 → Luna cevabı; Sonnet çağrılmaz', async () => {
    sira = [{ durum: 500, ham: 'upstream' }, tamam('Ayarlar > Şifre menüsünden değiştirebilirsiniz.')]
    const y = await aiCagir({ gorev: 'kisa-yanit', messages: METIN })
    assert.equal(istekler.length, 2)
    assert.deepEqual(istekler.map((i) => i.govde.model), [MODEL_HIZLI, MODEL_HIZLI])
    assert.match(yanitMetni(y), /Şifre/)
  })

  it('Luna 500 iki kez → Sonnet 5', async () => {
    sira = [{ durum: 500 }, { durum: 503 }, tamam('Sonnet cevabı')]
    const y = await aiCagir({ gorev: 'kisa-yanit', messages: METIN })
    assert.deepEqual(istekler.map((i) => i.govde.model), [MODEL_HIZLI, MODEL_HIZLI, MODEL_GUCLU])
    assert.equal(yanitMetni(y), 'Sonnet cevabı')
  })

  it('Luna 429 iki kez, ağ hatası, boş gövde → Sonnet 5', async () => {
    sira = [{ durum: 429 }, { durum: 429 }, tamam('S')]
    await aiCagir({ gorev: 'sohbet', messages: METIN })
    assert.equal(istekler[2].govde.model, MODEL_GUCLU)

    istekler = []; sira = [{ ag: true }, { ham: '' }, tamam('S')]
    await aiCagir({ gorev: 'sohbet', messages: METIN })
    assert.deepEqual(istekler.map((i) => i.govde.model), [MODEL_HIZLI, MODEL_HIZLI, MODEL_GUCLU])
  })

  it('Luna 200 ama boş cevap → Sonnet 5 (low_conf), Luna tekrar denenmez', async () => {
    sira = [tamam(''), tamam('Sonnet cevabı')]
    const y = await aiCagir({ gorev: 'kisa-yanit', messages: METIN })
    assert.deepEqual(istekler.map((i) => i.govde.model), [MODEL_HIZLI, MODEL_GUCLU])
    assert.equal(yanitMetni(y), 'Sonnet cevabı')
  })

  it('Luna ret / "daha fazla bilgi şart" → Sonnet 5', async () => {
    sira = [tamam('', { message: { refusal: 'no' } }), tamam('S1')]
    assert.equal(yanitMetni(await aiCagir({ gorev: 'kisa-yanit', messages: METIN })), 'S1')
    sira = [tamam('Bunun için daha fazla bilgi şart.'), tamam('S2')]
    assert.equal(yanitMetni(await aiCagir({ gorev: 'kisa-yanit', messages: METIN })), 'S2')
  })

  it('Luna 400 (istek hatası) yükseltilmez — hata çağırana gider', async () => {
    sira = [{ durum: 400, ham: 'bad request' }]
    await assert.rejects(aiCagir({ gorev: 'kisa-yanit', messages: METIN }), (e: { durum?: number }) => e.durum === 400)
    assert.equal(istekler.length, 1)
  })

  it('GÜÇLÜ görev tek çağrı; 500 çağırana gider (Luna kapısı yalnız HIZLI içindir)', async () => {
    sira = [{ durum: 500 }]
    await assert.rejects(aiCagir({ gorev: 'klinik-analiz', messages: METIN }), (e: { durum?: number }) => e.durum === 500)
    assert.equal(istekler.length, 1)
    assert.equal(istekler[0].govde.model, MODEL_GUCLU)
  })
})

describe('OpenRouter açık — kalite kapısı çağrıdan önce', () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    delete process.env.NOTYA_MODEL_HIZLI
    delete process.env.NOTYA_MODEL_GUCLU
    istekler = []; sira = []
    sahteFetch()
  })
  afterEach(() => { globalThis.fetch = orijinalFetch; ortamiGeriYukle() })

  it('görsel/PDF → HIZLI görevde bile Sonnet 5; görüntü image_url, PDF file parçası olur', async () => {
    sira = [tamam('ok'), tamam('ok')]
    await aiCagir({ gorev: 'siniflandirma', messages: GORSEL })
    await aiCagir({ gorev: 'ozet', messages: PDF })
    assert.deepEqual(istekler.map((i) => i.govde.model), [MODEL_GUCLU, MODEL_GUCLU])
    assert.deepEqual(istekler[0].govde.messages[0].content[0], { type: 'image_url', image_url: { url: 'data:image/png;base64,AAAA' } })
    assert.deepEqual(istekler[1].govde.messages[0].content[0], { type: 'file', file: { filename: 'belge.pdf', file_data: 'data:application/pdf;base64,BBBB' } })
  })

  it('güvenlik sinyali (gebe, warfarin, isotretinoin) → HIZLI görev Sonnet 5', async () => {
    for (const m of ['gebe hastada ne yazayım', 'warfarin ile etkileşim', 'isotretinoin']) {
      sira = [tamam('ok')]
      await aiCagir({ gorev: 'kisa-yanit', messages: [{ role: 'user', content: m }] })
    }
    assert.deepEqual(istekler.map((i) => i.govde.model), [MODEL_GUCLU, MODEL_GUCLU, MODEL_GUCLU])
  })

  it('klinik görevler (soap, klinik-analiz, sohbet-uzman) ilk istekte Sonnet 5 — Luna hiç görmez', async () => {
    for (const gorev of ['soap', 'klinik-analiz', 'sohbet-uzman', 'goruntu-inceleme', 'not-uretimi', 'uzman-analiz'] as const) {
      sira = [tamam('ok')]
      await aiCagir({ gorev, messages: METIN })
    }
    assert.ok(istekler.every((i) => i.govde.model === MODEL_GUCLU))
  })

  it('istek: başlıklar, gizlilik tercihi, cache_control yalnız sabit blokta, max_tokens / temperature', async () => {
    sira = [tamam('ok')]
    await aiCagir({ gorev: 'sohbet-uzman', system: [{ metin: 'SABİT PERSONA', onbellek: true }, { metin: 'HASTA BAĞLAMI' }], messages: METIN, maxTokens: 321, temperature: 0.2 })
    const i = istekler[0]
    assert.equal(i.url, 'https://openrouter.ai/api/v1/chat/completions')
    assert.equal(i.basliklar.Authorization, 'Bearer sk-or-test')
    assert.equal(i.basliklar['HTTP-Referer'], 'https://notya.ai')
    assert.equal(i.basliklar['X-Title'], 'Notya AI')
    assert.deepEqual(i.govde.provider, { data_collection: 'deny' })
    assert.deepEqual(i.govde.messages[0], { role: 'system', content: [
      { type: 'text', text: 'SABİT PERSONA', cache_control: { type: 'ephemeral' } },
      { type: 'text', text: 'HASTA BAĞLAMI' },
    ] })
    assert.equal(i.govde.max_tokens, 321)
    assert.equal(i.govde.temperature, 0.2)
  })

  it('SDK istemcisi verilse bile OpenRouter açıkken istemci çağrılmaz', async () => {
    let cagrildi = false
    const istemci = { messages: { create: async () => { cagrildi = true; return {} } } }
    sira = [tamam('ok')]
    await aiCagir({ istemci, gorev: 'sohbet-uzman', messages: METIN })
    assert.equal(cagrildi, false)
    assert.equal(istekler.length, 1)
  })

  it('F3: finish_reason length → stop_reason max_tokens (kesik JSON ham gösterilmez korumaları aynen çalışır)', async () => {
    sira = [tamam('{"a": "yarım', { finish_reason: 'length' })]
    const y = await aiCagir({ gorev: 'soap', messages: METIN })
    assert.equal(y.stop_reason, 'max_tokens')
  })
})

describe('çeviri — Anthropic ↔ OpenAI biçimi', () => {
  it('araçlar: tools → function, tool_choice any → required, tool_use ↔ tool_calls, tool_result → role tool', () => {
    const govde = openRouterGovdesi({
      model: MODEL_GUCLU, max_tokens: 100,
      tools: [{ name: 'hasta_bul', description: 'Hasta ara', input_schema: { type: 'object', properties: { ad: { type: 'string' } } } }],
      tool_choice: { type: 'any' },
      messages: [
        { role: 'user', content: 'Ayşe Yılmaz’ı bul' },
        { role: 'assistant', content: [{ type: 'text', text: 'Arıyorum.' }, { type: 'tool_use', id: 'toolu_1', name: 'hasta_bul', input: { ad: 'Ayşe' } }] },
        { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: 'bulundu' }, { type: 'text', text: 'devam' }] },
      ],
    })
    assert.deepEqual(govde.tools, [{ type: 'function', function: { name: 'hasta_bul', description: 'Hasta ara', parameters: { type: 'object', properties: { ad: { type: 'string' } } } } }])
    assert.equal(govde.tool_choice, 'required')
    const m = govde.messages as Record<string, any>[]
    assert.deepEqual(m[1], { role: 'assistant', content: 'Arıyorum.', tool_calls: [{ id: 'toolu_1', type: 'function', function: { name: 'hasta_bul', arguments: '{"ad":"Ayşe"}' } }] })
    assert.deepEqual(m[2], { role: 'tool', tool_call_id: 'toolu_1', content: 'bulundu' })
    assert.deepEqual(m[3], { role: 'user', content: [{ type: 'text', text: 'devam' }] })
    const tekArac = openRouterGovdesi({ model: MODEL_GUCLU, messages: [], tools: [{ name: 'x' }], tool_choice: { type: 'tool', name: 'x' } })
    assert.deepEqual(tekArac.tool_choice, { type: 'function', function: { name: 'x' } })
  })

  it('yanıt: tool_calls → tool_use blokları (input çözülür), stop_reason tool_use, Anthropic.Message şekli', () => {
    const y = openRouterYanitiniCevir({ id: 'g', model: MODEL_GUCLU, choices: [{ message: { content: null, tool_calls: [{ id: 'call_1', function: { name: 'hasta_bul', arguments: '{"ad":"Ayşe"}' } }] }, finish_reason: 'tool_calls' }], usage: {} }, MODEL_GUCLU)!
    assert.equal(y.type, 'message')
    assert.equal(y.role, 'assistant')
    assert.equal(y.stop_reason, 'tool_use')
    assert.deepEqual(y.content, [{ type: 'tool_use', id: 'call_1', name: 'hasta_bul', input: { ad: 'Ayşe' } }])
    assert.equal(dusukGuvenliYanit(y), false, 'araç çağrısı boş cevap sayılmaz')
    assert.equal(openRouterYanitiniCevir({}, 'm'), null, 'choices yok → boş gövde')
  })

  it('usage: prompt_tokens önbellek okuma/yazmayı içerir → Anthropic sayaçlarına ayrılır', () => {
    assert.deepEqual(kullanimCevir({ prompt_tokens: 5000, completion_tokens: 40, prompt_tokens_details: { cached_tokens: 3000, cache_write_tokens: 1500 } }), {
      input_tokens: 500, output_tokens: 40, cache_read_input_tokens: 3000, cache_creation_input_tokens: 1500,
    })
    assert.deepEqual(kullanimCevir(undefined), { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 })
  })

  it('tool_result içindeki görsel ayrı user mesajına taşınır (tool mesajı yalnız metin alır)', () => {
    const m = mesajlariCevir([{ role: 'user', content: [{ type: 'tool_result', tool_use_id: 't', content: [{ type: 'text', text: 'rapor' }, { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'CC' } }] }] }])
    assert.deepEqual(m, [
      { role: 'tool', tool_call_id: 't', content: 'rapor' },
      { role: 'user', content: [{ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,CC' } }] },
    ])
  })

  it('model adı dönüşümleri: doğrudan yol öneki atar, eski çıplak adlar OpenRouter slug’ına döner', () => {
    assert.equal(dogrudanModelAdi(MODEL_GUCLU), MODEL_GUCLU.replace('anthropic/', ''))
    assert.equal(dogrudanModelAdi('anthropic/claude-haiku-4.5'), 'claude-haiku-4-5')
    assert.equal(openRouterModelAdi('claude-sonnet-4-6'), 'anthropic/claude-sonnet-4.6')
    assert.equal(openRouterModelAdi('claude-haiku-4-5-20251001'), 'anthropic/claude-haiku-4.5')
    assert.equal(openRouterModelAdi(MODEL_HIZLI), MODEL_HIZLI)
  })
})

describe('akış (sesli Ayşe) — OpenRouter SSE', () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    delete process.env.NOTYA_MODEL_HIZLI
    delete process.env.NOTYA_MODEL_GUCLU
    istekler = []; sira = []; TASIMA_BEKLEME.ms = 1
    sahteFetch()
  })
  afterEach(() => { globalThis.fetch = orijinalFetch; TASIMA_BEKLEME.ms = 400; ortamiGeriYukle() })

  const sse = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`
  const istemci = { messages: { create: async () => { throw new Error('OpenRouter açıkken SDK çağrılmamalı') } } }

  it('metin parçaları aynı geri çağrıya akar; tool_calls birleşir; usage son parçadan', async () => {
    sira = [{ sse: [
      ': OPENROUTER PROCESSING\n\n',
      sse({ id: 'g', model: MODEL_GUCLU, choices: [{ delta: { content: 'Merha' } }] }),
      sse({ choices: [{ delta: { content: 'ba Hocam.' } }] }),
      sse({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'call_1', function: { name: 'hasta_bul', arguments: '{"ad":' } }] } }] }),
      sse({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '"Ayşe"}' } }] }, finish_reason: 'tool_calls' }] }),
      sse({ choices: [], usage: { prompt_tokens: 50, completion_tokens: 7, prompt_tokens_details: { cached_tokens: 20 } } }),
      'data: [DONE]\n\n',
    ] }]
    const parcalar: string[] = []
    const y = await aiAkis({ istemci, gorev: 'sohbet-uzman', messages: METIN }, (p) => parcalar.push(p))
    assert.deepEqual(parcalar, ['Merha', 'ba Hocam.'])
    assert.equal(istekler[0].govde.stream, true)
    assert.equal(yanitMetni(y), 'Merhaba Hocam.')
    assert.deepEqual((y.content as unknown[])[1], { type: 'tool_use', id: 'call_1', name: 'hasta_bul', input: { ad: 'Ayşe' } })
    assert.equal(y.stop_reason, 'tool_use')
    assert.deepEqual(y.usage, { input_tokens: 30, output_tokens: 7, cache_read_input_tokens: 20, cache_creation_input_tokens: 0 } as never)
  })

  it('Luna akışı başlamadan 500 → tekrar → yine 500 → Sonnet 5 akışı', async () => {
    sira = [{ durum: 500 }, { durum: 502 }, { sse: [sse({ choices: [{ delta: { content: 'Sonnet' } }] }), 'data: [DONE]\n\n'] }]
    const parcalar: string[] = []
    await aiAkis({ istemci, gorev: 'sohbet', messages: [{ role: 'user', content: 'merhaba' }] }, (p) => parcalar.push(p))
    assert.deepEqual(istekler.map((i) => i.govde.model), [MODEL_HIZLI, MODEL_HIZLI, MODEL_GUCLU])
    assert.deepEqual(parcalar, ['Sonnet'])
  })

  it('Luna akışı boş biterse Sonnet 5 akışı', async () => {
    sira = [{ sse: [sse({ choices: [{ delta: {}, finish_reason: 'stop' }] }), 'data: [DONE]\n\n'] }, { sse: [sse({ choices: [{ delta: { content: 'S' } }] })] }]
    const parcalar: string[] = []
    await aiAkis({ istemci, gorev: 'sohbet', messages: [{ role: 'user', content: 'merhaba' }] }, (p) => parcalar.push(p))
    assert.deepEqual(istekler.map((i) => i.govde.model), [MODEL_HIZLI, MODEL_GUCLU])
    assert.deepEqual(parcalar, ['S'])
  })
})

describe('OpenRouter kapalı — eski Anthropic yolu', () => {
  beforeEach(() => { delete process.env.OPENROUTER_API_KEY; delete process.env.NOTYA_MODEL_HIZLI; delete process.env.NOTYA_MODEL_GUCLU })
  afterEach(ortamiGeriYukle)

  it('GÜÇLÜ görev SDK istemcisine önek atılmış Sonnet 5 kimliğiyle gider', async () => {
    const giden: Record<string, unknown>[] = []
    const istemci = { messages: { create: async (g: never) => { giden.push(g); return { content: [{ type: 'text', text: 'ok' }], usage: {} } } } }
    await aiCagir({ istemci, gorev: 'soap', messages: METIN })
    assert.equal(giden[0].model, dogrudanModelAdi(gucluModel()))
    assert.ok(!String(giden[0].model).includes('/'))
    assert.equal(yolSec(gucluModel()), 'anthropic')
  })

  it('HIZLI (Luna) OpenRouter olmadan gidemez → GÜÇLÜ doğrudan yol, tek çağrı', async () => {
    const giden: Record<string, unknown>[] = []
    const istemci = { messages: { create: async (g: never) => { giden.push(g); return { content: [{ type: 'text', text: '' }], usage: {} } } } }
    await aiCagir({ istemci, gorev: 'kisa-yanit', messages: METIN })
    assert.equal(yolSec(hizliModel()), null)
    assert.equal(giden.length, 1, 'doğrudan yolda Luna kapısı yok — boş cevap tekrar denenmez (eski davranış)')
    assert.equal(giden[0].model, dogrudanModelAdi(gucluModel()))
  })

  it('geri dönüş anahtarı: NOTYA_MODEL_HIZLI=anthropic/claude-haiku-4.5 → doğrudan yolda claude-haiku-4-5', async () => {
    process.env.NOTYA_MODEL_HIZLI = 'anthropic/claude-haiku-4.5'
    const giden: Record<string, unknown>[] = []
    const istemci = { messages: { create: async (g: never) => { giden.push(g); return { content: [{ type: 'text', text: 'ok' }], usage: {} } } } }
    await aiCagir({ istemci, gorev: 'kisa-yanit', messages: METIN })
    assert.equal(giden[0].model, 'claude-haiku-4-5')
  })

  it('aiAkis doğrudan yolda SDK akışını eskisi gibi kullanır', async () => {
    let govde: Record<string, unknown> | null = null
    const istemci = { messages: { create: async (g: never) => { govde = g; return { content: [{ type: 'text', text: 'tam' }], usage: {} } } } }
    const parcalar: string[] = []
    await aiAkis({ istemci, gorev: 'sohbet-uzman', messages: METIN }, (p) => parcalar.push(p))
    assert.equal(govde!.stream, true)
    assert.equal(govde!.model, dogrudanModelAdi(gucluModel()))
    assert.deepEqual(parcalar, ['tam'])
  })
})
