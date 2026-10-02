/**
 * NOTYA-AYSE-GERI-07 (audit §7, PR 13) — a route's time budget inside aiCagir. Fake fetch, no network; the slow
 * primary is a request that never answers until its AbortSignal fires. Synthetic data only.
 *  - without a budget nothing changes (two primary attempts, unbounded guard);
 *  - with one, a slow primary leaves time for the guard, the retry that cannot fit is skipped, and a call that
 *    cannot finish at all fails as an ordinary transport error inside the budget.
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

delete process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.NOTYA_TIER_KAPALI = '1'

import { aiCagir, AiCagriHatasi, rotaButcesiMs, sureHesabi, SURE_AYARI, TASIMA_BEKLEME, yanitKademesi, type AiMesaj } from './cagir'
import { MODEL_GUCLU, MODEL_HIZLI } from './modeller'
import { devreSifirla } from './devre'

type Cevap = 'yavas' | { durum?: number; metin?: string }
const orijinalFetch = globalThis.fetch
let istekler: string[] = []
let cevap: (model: string) => Cevap = () => ({ metin: 'tamam' })
const METIN: AiMesaj[] = [{ role: 'user', content: 'üç gündür öksürük' }]
const govde = (metin: string) => JSON.stringify({ id: 'g', model: 'x', choices: [{ message: { role: 'assistant', content: metin }, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 5 } })

const eski = { k: process.env.OPENROUTER_API_KEY, asgari: SURE_AYARI.asgariMs }
beforeEach(() => {
  process.env.OPENROUTER_API_KEY = 'sk-or-test'
  istekler = []; TASIMA_BEKLEME.ms = 1; SURE_AYARI.asgariMs = 40
  devreSifirla()
  globalThis.fetch = (async (_url: unknown, o?: RequestInit) => {
    const model = String(JSON.parse(String(o?.body || '{}')).model)
    istekler.push(model)
    const c = cevap(model)
    if (c === 'yavas') {
      // Never answers; rejects the way fetch does when the caller's timeout signal fires.
      return new Promise<Response>((_coz, reddet) => {
        const s = o?.signal
        if (!s) return
        s.addEventListener('abort', () => reddet(Object.assign(new Error('timeout'), { name: 'TimeoutError' })))
      })
    }
    return new Response(c.durum && c.durum >= 400 ? '' : govde(c.metin ?? 'tamam'), { status: c.durum ?? 200 })
  }) as typeof fetch
})
afterEach(() => {
  globalThis.fetch = orijinalFetch
  TASIMA_BEKLEME.ms = 400; SURE_AYARI.asgariMs = eski.asgari
  if (eski.k === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = eski.k
})

describe('süre hesabı (saf)', () => {
  it('bütçe yoksa birincil kendi tavanını alır, koruyucu sınırsızdır', () => {
    const s = sureHesabi(undefined)
    assert.equal(s.birincil(60_000), 60_000)
    assert.equal(s.koruyucu(), undefined)
  })
  it('bütçenin ilk %55\'i birincilin; sığmayan deneme atlanır; koruyucu kalanı alır', () => {
    SURE_AYARI.asgariMs = 5_000
    let t = 0
    const s = sureHesabi(100_000, () => t)
    assert.equal(s.birincil(60_000), 55_000, 'ilk deneme: pencere tavandan kısa')
    assert.equal(s.birincil(25_000), 25_000, 'kısa iş kendi tavanında kalır')
    t = 52_000
    assert.equal(s.birincil(60_000), null, '3 sn kaldı — yeniden deneme başlamaz')
    assert.equal(s.koruyucu(), 48_000)
    t = 99_000
    assert.equal(s.koruyucu(), 5_000, 'koruyucuya en az bir deneme süresi')
  })
  it('rota bütçesi: maxDuration eksi pay', () => {
    assert.equal(rotaButcesiMs(120), 112_000)
    assert.equal(rotaButcesiMs(60), 52_000)
    assert.equal(rotaButcesiMs(5), 10_000)
  })
})

describe('aiCagir — rota bütçesi', () => {
  it('yavaş birincil: tek deneme, sonra koruyucu bütçe içinde cevap verir', async () => {
    cevap = (m) => (m === MODEL_HIZLI ? 'yavas' : { metin: 'koruyucu' })
    const bas = Date.now()
    const y = await aiCagir({ gorev: 'klinik-analiz', messages: METIN, butceMs: 400 })
    const gecen = Date.now() - bas
    assert.deepEqual(istekler, [MODEL_HIZLI, MODEL_GUCLU], 'ikinci birincil denemesi pencereye sığmadı')
    assert.deepEqual(yanitKademesi(y), { kademe: 'guclu', neden: 'transport' })
    assert.ok(gecen >= 200 && gecen < 400, `bütçe içinde: ${gecen} ms`)
  })
  it('hızlı düşen birincil: iki deneme de yapılır (davranış aynı)', async () => {
    cevap = (m) => (m === MODEL_HIZLI ? { durum: 500 } : { metin: 'koruyucu' })
    await aiCagir({ gorev: 'klinik-analiz', messages: METIN, butceMs: 400 })
    assert.deepEqual(istekler, [MODEL_HIZLI, MODEL_HIZLI, MODEL_GUCLU])
  })
  it('birincil cevap verirse bütçe hiçbir şeyi değiştirmez', async () => {
    cevap = () => ({ metin: 'birincil' })
    const y = await aiCagir({ gorev: 'klinik-analiz', messages: METIN, butceMs: 400 })
    assert.deepEqual(istekler, [MODEL_HIZLI])
    assert.deepEqual(yanitKademesi(y), { kademe: 'hizli', neden: null })
  })
  it('koruyucu da yavaşsa çağrı bütçe içinde taşıma hatasıyla biter (rota 502 döner, platform öldürmez)', async () => {
    cevap = () => 'yavas'
    const bas = Date.now()
    await assert.rejects(aiCagir({ gorev: 'klinik-analiz', messages: METIN, butceMs: 400 }), (e: unknown) => e instanceof AiCagriHatasi && e.durum === 504)
    const gecen = Date.now() - bas
    assert.ok(gecen < 600, `bütçe civarında: ${gecen} ms`)
    assert.deepEqual(istekler, [MODEL_HIZLI, MODEL_GUCLU])
  })
})
