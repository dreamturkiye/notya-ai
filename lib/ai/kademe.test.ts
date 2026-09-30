/**
 * NOTYA-KADEME-01 — model tiering on the Luna family (docs/ARCH-MODEL-TIERING.md): tier selection, reasoning.effort
 * emission, luna-none → luna tier_up fallback (before the G1/G2 koruyucu chain) and the NOTYA_TIER_KAPALI kill-switch.
 * Fake fetch, no network, synthetic data.
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

delete process.env.NEXT_PUBLIC_SUPABASE_URL

import { aiAkis, aiCagir, girdiTokenTahmini, istekGovdesi, kademeYukseltKodu, TASIMA_BEKLEME, UZUN_GIRDI_TOKEN, yanitKademesi, yanitMetni, type AiMesaj } from './cagir'
import { GOREV_POLITIKASI, kademeAdi, MODEL_DERIN, MODEL_GUCLU, MODEL_HIZLI, modelSec, sohbetKademesi, type Gorev } from './modeller'
import { openRouterGovdesi } from './saglayici'

type Cevap = { durum?: number; json?: unknown; sse?: string[] }
type Istek = { govde: Record<string, any> }
const orijinalFetch = globalThis.fetch
let istekler: Istek[] = []
let sira: Cevap[] = []
function sahteFetch() {
  globalThis.fetch = (async (_url: unknown, o?: RequestInit) => {
    const govde = JSON.parse(String(o?.body || '{}'))
    istekler.push({ govde })
    const c = sira.shift()
    if (!c) throw new Error('beklenmeyen istek')
    if (c.sse) {
      const kod = new TextEncoder()
      const g = new ReadableStream({ start(k) { for (const s of c.sse!) k.enqueue(kod.encode(s)); k.close() } })
      return new Response(g, { status: 200 })
    }
    return new Response(JSON.stringify(c.json ?? {}), { status: c.durum ?? 200 })
  }) as typeof fetch
}
function tamam(metin: string | null, ek: { finish_reason?: string; tool_calls?: unknown[] } = {}): Cevap {
  return { json: { id: 'g', model: 'x', choices: [{ message: { role: 'assistant', content: metin, ...(ek.tool_calls ? { tool_calls: ek.tool_calls } : {}) }, finish_reason: ek.finish_reason ?? 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 5 } } }
}
const sse = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`
const modeller = () => istekler.map((i) => i.govde.model)
const cabalar = () => istekler.map((i) => i.govde.reasoning?.effort ?? null)
const METIN: AiMesaj[] = [{ role: 'user', content: 'günaydın Ayşe' }]

const eski = { k: process.env.OPENROUTER_API_KEY, h: process.env.NOTYA_MODEL_HIZLI, d: process.env.NOTYA_MODEL_DERIN, t: process.env.NOTYA_TIER_KAPALI, ko: process.env.NOTYA_KORUYUCU_KAPALI }
beforeEach(() => {
  process.env.OPENROUTER_API_KEY = 'sk-or-test'
  delete process.env.NOTYA_MODEL_HIZLI
  delete process.env.NOTYA_MODEL_DERIN
  delete process.env.NOTYA_TIER_KAPALI
  delete process.env.NOTYA_KORUYUCU_KAPALI
  TASIMA_BEKLEME.ms = 0
  istekler = []; sira = []
  sahteFetch()
})
afterEach(() => {
  globalThis.fetch = orijinalFetch
  for (const [ad, v] of [['OPENROUTER_API_KEY', eski.k], ['NOTYA_MODEL_HIZLI', eski.h], ['NOTYA_MODEL_DERIN', eski.d], ['NOTYA_TIER_KAPALI', eski.t], ['NOTYA_KORUYUCU_KAPALI', eski.ko]] as const) {
    if (v === undefined) delete process.env[ad]; else process.env[ad] = v
  }
})

describe('kademe tablosu ve modelSec', () => {
  it('luna-none görevleri: sohbet, cikarim, ozet, siniflandirma, bicimlendirme, kisa-yanit → caba none; kademe adı luna-none', () => {
    for (const g of ['sohbet', 'cikarim', 'ozet', 'siniflandirma', 'bicimlendirme', 'kisa-yanit'] as Gorev[]) {
      const s = modelSec(g)
      assert.equal(s.caba, 'none', g)
      assert.equal(s.model, MODEL_HIZLI, g)
      assert.equal(kademeAdi(s), 'luna-none', g)
    }
  })
  it('luna görevleri: sohbet-uzman, klinik-analiz, not-uretimi → caba yok, Luna', () => {
    for (const g of ['sohbet-uzman', 'klinik-analiz', 'not-uretimi'] as Gorev[]) {
      const s = modelSec(g)
      assert.equal(s.caba, undefined, g)
      assert.equal(kademeAdi(s), 'luna', g)
    }
  })
  it('luna-pro görevleri: soap, goruntu-inceleme, uzman-analiz → derin, NOTYA_MODEL_DERIN ile değişir', () => {
    for (const g of ['soap', 'goruntu-inceleme', 'uzman-analiz'] as Gorev[]) {
      assert.equal(modelSec(g).model, MODEL_DERIN, g)
      assert.equal(kademeAdi(modelSec(g)), 'luna-pro', g)
    }
    process.env.NOTYA_MODEL_DERIN = 'openai/gpt-7-derin'
    assert.equal(modelSec('soap').model, 'openai/gpt-7-derin')
    assert.equal(modelSec('sohbet').model, MODEL_HIZLI)
  })
  it('çağrı yeri aşımı: klinik-analiz + kademe derin → Luna-Pro; sohbet-uzman + caba none → luna-none; derin kademede caba yok', () => {
    assert.equal(modelSec('klinik-analiz', { kademe: 'derin' }).model, MODEL_DERIN)
    assert.equal(modelSec('sohbet-uzman', { caba: 'none' }).caba, 'none')
    assert.equal(modelSec('soap', { caba: 'none' }).caba, undefined)
    assert.equal(kademeAdi({ kademe: 'guclu' }), 'sonnet')
  })
  it('kill-switch NOTYA_TIER_KAPALI=1: her görev hizli/Luna, caba yok, aşımlar yok sayılır', () => {
    process.env.NOTYA_TIER_KAPALI = '1'
    for (const g of Object.keys(GOREV_POLITIKASI) as Gorev[]) {
      const s = modelSec(g, { kademe: 'derin', caba: 'none' })
      assert.equal(s.kademe, 'hizli', g)
      assert.equal(s.model, MODEL_HIZLI, g)
      assert.equal(s.caba, undefined, g)
    }
    assert.equal(sohbetKademesi({ gorev: 'sohbet', mesaj: 'günaydın', aracSayisi: 0 }).caba, undefined)
  })
})

describe('sohbetKademesi — sohbet turunun kademesi', () => {
  it('sohbet → none; sohbet-uzman tek-slot ≤ 12 kelime takip → none', () => {
    assert.equal(sohbetKademesi({ gorev: 'sohbet', mesaj: 'teşekkürler', aracSayisi: 0 }).caba, 'none')
    for (const n of ['hasta-dosya', 'recete', 'tahlil', 'asi', 'buyume', 'genel']) {
      assert.equal(sohbetKademesi({ gorev: 'sohbet-uzman', mesaj: 'Klacid dozu neydi?', sonNiyet: n, aracSayisi: 0 }).caba, 'none', n)
    }
  })
  it('araç turu / eylem niyeti / ağır soru / > 20k token / uzun soru / niyetsiz → luna', () => {
    const uzman = { gorev: 'sohbet-uzman' as const, sonNiyet: 'hasta-dosya', aracSayisi: 0 }
    assert.equal(sohbetKademesi({ ...uzman, mesaj: 'Klacid dozu neydi?', aracSayisi: 2 }).caba, undefined)
    assert.equal(sohbetKademesi({ ...uzman, mesaj: 'reçete yaz', niyet: 'ADD_PRESCRIPTION' }).caba, undefined)
    assert.equal(sohbetKademesi({ ...uzman, mesaj: 'Muayene raporu hazırla' }).caba, undefined)
    assert.equal(sohbetKademesi({ ...uzman, mesaj: 'gözümden kaçan bir şey var mı' }).caba, undefined)
    assert.equal(sohbetKademesi({ ...uzman, mesaj: 'son muayeneden bu yana neler değişmiş' }).caba, undefined)
    assert.equal(sohbetKademesi({ ...uzman, mesaj: 'ilaçlarını listele' }).caba, undefined)
    assert.equal(sohbetKademesi({ ...uzman, mesaj: 'dozu?', girdiToken: 25_000 }).caba, undefined)
    assert.equal(sohbetKademesi({ ...uzman, mesaj: 'bu hastanın son üç vizitindeki ilaç dozlarını ve tahlil sonuçlarını birlikte yorumlar mısın lütfen' }).caba, undefined)
    assert.equal(sohbetKademesi({ gorev: 'sohbet-uzman', mesaj: 'Klacid dozu neydi?', sonNiyet: null, aracSayisi: 0 }).caba, undefined)
    assert.equal(sohbetKademesi({ gorev: 'sohbet-uzman', mesaj: 'peki yarın?', sonNiyet: 'takvim', aracSayisi: 0 }).caba, undefined)
  })
})

describe('istek gövdesi — reasoning.effort ve derin model', () => {
  it('sohbet gövdesi reasoning.effort none taşır; OpenRouter gövdesi yalnız openai/* için reasoning yazar', () => {
    const g = istekGovdesi({ gorev: 'sohbet', messages: METIN })
    assert.deepEqual(g.reasoning, { effort: 'none' })
    assert.equal(openRouterGovdesi(g).reasoning && (openRouterGovdesi(g).reasoning as { effort: string }).effort, 'none')
    assert.equal(openRouterGovdesi({ ...g, model: MODEL_GUCLU }).reasoning, undefined)
    assert.equal(istekGovdesi({ gorev: 'sohbet-uzman', messages: METIN }).reasoning, undefined)
    assert.deepEqual(istekGovdesi({ gorev: 'sohbet-uzman', messages: METIN, caba: 'none' }).reasoning, { effort: 'none' })
  })
  it('soap → Luna-Pro; klinik-analiz + kademe derin → Luna-Pro; > 20k token arka plan girdisi → Luna-Pro, sohbet asla', () => {
    assert.equal(istekGovdesi({ gorev: 'soap', messages: METIN }).model, MODEL_DERIN)
    assert.equal(istekGovdesi({ gorev: 'klinik-analiz', messages: METIN }).model, MODEL_HIZLI)
    assert.equal(istekGovdesi({ gorev: 'klinik-analiz', messages: METIN, kademe: 'derin' }).model, MODEL_DERIN)
    const uzun: AiMesaj[] = [{ role: 'user', content: 'a'.repeat((UZUN_GIRDI_TOKEN + 1) * 4) }]
    assert.ok(girdiTokenTahmini({ messages: uzun }) > UZUN_GIRDI_TOKEN)
    assert.equal(istekGovdesi({ gorev: 'klinik-analiz', messages: uzun }).model, MODEL_DERIN)
    assert.equal(istekGovdesi({ gorev: 'not-uretimi', messages: uzun }).model, MODEL_DERIN)
    assert.equal(istekGovdesi({ gorev: 'sohbet-uzman', messages: uzun }).model, MODEL_HIZLI)
    assert.equal(istekGovdesi({ gorev: 'sohbet', messages: uzun }).model, MODEL_HIZLI)
    // görüntü ikili verisi sayılmaz
    const gorsel: AiMesaj[] = [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'x'.repeat(200_000) } }, { type: 'text', text: 'oku' }] }]
    assert.ok(girdiTokenTahmini({ messages: gorsel }) < 10)
  })
  it('kill-switch: soap Luna, reasoning yok', () => {
    process.env.NOTYA_TIER_KAPALI = '1'
    const g = istekGovdesi({ gorev: 'soap', messages: METIN })
    assert.equal(g.model, MODEL_HIZLI)
    assert.equal(g.reasoning, undefined)
    assert.equal(istekGovdesi({ gorev: 'sohbet', messages: METIN }).reasoning, undefined)
  })
})

describe('aiCagir — luna-none → luna (tier_up) → koruyucu', () => {
  it('luna-none iyi cevap → tek çağrı, effort none, kademe hizli/none', async () => {
    sira = [tamam('Günaydın Hocam, bugün üç randevunuz var.')]
    const y = await aiCagir({ gorev: 'sohbet', messages: METIN })
    assert.deepEqual(modeller(), [MODEL_HIZLI])
    assert.deepEqual(cabalar(), ['none'])
    assert.deepEqual(yanitKademesi(y), { kademe: 'hizli', neden: null, caba: 'none' })
  })
  it('luna-none boş → aynı gövde luna (reasoning yok) bir kez, neden tier_up; Sonnet çağrılmaz', async () => {
    sira = [tamam(''), tamam('Günaydın Hocam.')]
    const y = await aiCagir({ gorev: 'sohbet', messages: METIN })
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_HIZLI])
    assert.deepEqual(cabalar(), ['none', null])
    assert.deepEqual(istekler[0].govde.messages, istekler[1].govde.messages)
    assert.equal(yanitMetni(y), 'Günaydın Hocam.')
    assert.deepEqual(yanitKademesi(y), { kademe: 'hizli', neden: 'tier_up' })
  })
  it('luna-none < 3 kelime ("Tamam.") → tier_up; araç çağrısı kısa sayılmaz', async () => {
    sira = [tamam('Tamam.'), tamam('Tamam Hocam, notu açıyorum.')]
    const y = await aiCagir({ gorev: 'sohbet', messages: METIN })
    assert.equal(modeller().length, 2)
    assert.equal(yanitMetni(y), 'Tamam Hocam, notu açıyorum.')
    assert.equal(kademeYukseltKodu({ gorev: 'sohbet' }, { content: [{ type: 'text', text: 'İyi çalışmalar Hocam.' }], stop_reason: 'end_turn' } as never), null)
    assert.equal(kademeYukseltKodu({ gorev: 'sohbet' }, { content: [{ type: 'text', text: 'Peki.' }], stop_reason: 'end_turn' } as never), 'kisa')
    assert.equal(kademeYukseltKodu({ gorev: 'cikarim' }, { content: [{ type: 'text', text: '{"kayitlar":[]}' }], stop_reason: 'end_turn' } as never), null, 'JSON gövdesi kısa sayılmaz')
    assert.equal(kademeYukseltKodu({ gorev: 'sohbet', araclar: [{ name: 'a' }] }, { content: [{ type: 'tool_use', id: '1', name: 'a', input: {} }], stop_reason: 'tool_use' } as never), null)
  })
  it('luna-none boş → luna boş → koruyucu Sonnet 5 (low_conf), reasoning hiçbir Sonnet gövdesinde yok', async () => {
    sira = [tamam(''), tamam(''), tamam('Sonnet cevabı.')]
    const y = await aiCagir({ gorev: 'sohbet', messages: METIN })
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_HIZLI, MODEL_GUCLU])
    assert.deepEqual(cabalar(), ['none', null, null])
    assert.deepEqual(yanitKademesi(y), { kademe: 'guclu', neden: 'low_conf' })
  })
  it('luna-none ret → tier_up; NOTYA_KORUYUCU_KAPALI ile luna da boşsa 599 luna_fail:low_conf:bos', async () => {
    process.env.NOTYA_KORUYUCU_KAPALI = '1'
    sira = [{ json: { id: 'g', model: 'x', choices: [{ message: { role: 'assistant', content: null, refusal: 'no' }, finish_reason: 'stop' }] } }, tamam('')]
    await assert.rejects(aiCagir({ gorev: 'cikarim', messages: METIN }), (e: { durum: number; govde: string }) => e.durum === 599 && e.govde === 'luna_fail:low_conf:bos')
    assert.deepEqual(cabalar(), ['none', null])
  })
  it('soap → Luna-Pro tek çağrı; G1 taşıma hatası Luna-Pro üzerinde tekrar, sonra Sonnet', async () => {
    sira = [tamam('{"soap":{}}'), { durum: 502 }, { durum: 502 }, tamam('{"soap":{}}')]
    const y1 = await aiCagir({ gorev: 'soap', messages: METIN })
    assert.deepEqual(modeller(), [MODEL_DERIN])
    assert.deepEqual(yanitKademesi(y1), { kademe: 'derin', neden: null })
    istekler = []
    const y2 = await aiCagir({ gorev: 'soap', messages: METIN })
    assert.deepEqual(modeller(), [MODEL_DERIN, MODEL_DERIN, MODEL_GUCLU])
    assert.deepEqual(yanitKademesi(y2), { kademe: 'guclu', neden: 'transport' })
  })
  it('kill-switch: sohbet boş → doğrudan koruyucu (tier_up yok), reasoning yok, soap Luna', async () => {
    process.env.NOTYA_TIER_KAPALI = '1'
    sira = [tamam(''), tamam('Sonnet.'), tamam('{"soap":{}}')]
    const y = await aiCagir({ gorev: 'sohbet', messages: METIN })
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_GUCLU])
    assert.deepEqual(cabalar(), [null, null])
    assert.deepEqual(yanitKademesi(y), { kademe: 'guclu', neden: 'low_conf' })
    await aiCagir({ gorev: 'soap', messages: METIN })
    assert.equal(modeller()[2], MODEL_HIZLI)
  })
})

describe('aiAkis — sesli yolda tier_up yalnız ilk sözden önce', () => {
  it('luna-none akışı hiç söz vermeden biterse luna akışı (tier_up), sonra söz', async () => {
    sira = [
      { sse: [sse({ id: 'a', choices: [{ delta: {}, finish_reason: 'stop' }] }), 'data: [DONE]\n\n'] },
      { sse: [sse({ id: 'b', choices: [{ delta: { content: 'Günaydın ' } }] }), sse({ choices: [{ delta: { content: 'Hocam.' }, finish_reason: 'stop' }] }), 'data: [DONE]\n\n'] },
    ]
    const parcalar: string[] = []
    const y = await aiAkis({ gorev: 'sohbet', messages: METIN }, (p) => parcalar.push(p))
    assert.deepEqual(modeller(), [MODEL_HIZLI, MODEL_HIZLI])
    assert.deepEqual(cabalar(), ['none', null])
    assert.equal(parcalar.join(''), 'Günaydın Hocam.')
    assert.deepEqual(yanitKademesi(y), { kademe: 'hizli', neden: 'tier_up' })
  })
  it('luna-none akışı söz verdiyse kısa da olsa yükseltilmez (söylenen söz geri alınmaz)', async () => {
    sira = [{ sse: [sse({ id: 'a', choices: [{ delta: { content: 'Peki.' }, finish_reason: 'stop' }] }), 'data: [DONE]\n\n'] }]
    const y = await aiAkis({ gorev: 'sohbet', messages: METIN }, () => { /* */ })
    assert.equal(modeller().length, 1)
    assert.equal(yanitMetni(y), 'Peki.')
  })
})
