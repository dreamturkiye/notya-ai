/**
 * NOTYA-SES-ELEVEN-GERI-01 — /api/asistan/signed-url for Ayşe Kaya, the real handler on the in-memory scene.
 *
 * Default (no AYSE_SES_SAGLAYICI, even with a Fish key): the ConvAI signed URL of her base agent with `fish: false`
 * and her ElevenLabs voice. A doctor with the TEK BEYİN flag gets the Custom-LLM copy plus the signed voice token
 * (`tek_beyin`, `notya_jeton`, `asistan_session_id`, `baslangic`), as at f247ea1b. The agent check writes the TTS
 * Flash lock only — never the turn settings (5e5014ee's SES_DONUS_KILIT is gone). Fish only with the switch AND
 * the key, and only for Ayşe.
 *
 * The flag is the NOTYA_TEK_BEYIN_DOKTORLAR list; signing uses a test secret and the token is verified with the real
 * verifier. ElevenLabs is a stub (no network). Synthetic QA data only.
 */
import { ortam, sahneHazirla, sahneKur, type Sahne } from './tests/ayseSahne'
import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

process.env.ELEVENLABS_API_KEY = 'qa-sahte-eleven-anahtari'
process.env.NOTYA_SES_JETON_SECRET = 'qa-sahte-ses-jetonu-sirri-en-az-otuz-iki-karakter'
process.env.FISH_API_KEY = 'qa-sahte-fish-anahtari'
delete process.env.AYSE_SES_SAGLAYICI
delete process.env.NOTYA_TEK_BEYIN_DOKTORLAR

const AYSE_TABAN = 'agent_3601ktc884ntf3dbdkjtyx6vdfwa'
const AYSE_TEK_BEYIN = 'agent_6701m3cyqgc3fvxszstap39atqhm'
const AYSE_SES = 'ir8YO3t6kXwbDO3roXIT'

/** Every ElevenLabs request the route made; the agent read answers with a Flash-locked TTS and a slow turn setting. */
const el: { url: string; method: string; govde: string | null }[] = []
const sahneFetch = globalThis.fetch
globalThis.fetch = (async (g: unknown, o?: RequestInit) => {
  const url = typeof g === 'string' ? g : g instanceof URL ? g.href : String((g as { url?: string })?.url || g)
  if (!url.startsWith('https://api.elevenlabs.io/')) return sahneFetch(g as string, o)
  el.push({ url, method: o?.method || 'GET', govde: typeof o?.body === 'string' ? o.body : null })
  if (url.includes('/convai/conversation/get_signed_url')) {
    const ajan = new URL(url).searchParams.get('agent_id')
    return new Response(JSON.stringify({ signed_url: `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${ajan}&conversation_signature=sahte` }), { status: 200 })
  }
  if (url.includes('/convai/agents/') && (o?.method || 'GET') === 'GET') {
    return new Response(JSON.stringify({
      conversation_config: {
        tts: { model_id: 'eleven_flash_v2_5', voice_id: AYSE_SES, expressive_mode: false, speed: 1, stability: 0.55, similarity_boost: 0.75 },
        turn: { turn_eagerness: 'normal', speculative_turn: false },
      },
    }), { status: 200 })
  }
  return new Response('{}', { status: 200 })
}) as typeof fetch

let GET: (r: any) => Promise<Response>
let NextRequestSinifi: typeof import('next/server').NextRequest
let sesJetonuDogrula: typeof import('./sesJetonu').sesJetonuDogrula
let s: Sahne

async function iste(o: { persona?: string; specialty?: string; token?: string; ek?: string } = {}) {
  const q = `specialty=${o.specialty || 'pediatri'}&persona=${o.persona || 'aysekaya'}${o.ek || ''}`
  const r = await GET(new NextRequestSinifi(`http://localhost/api/asistan/signed-url?${q}`, {
    headers: { authorization: `Bearer ${o.token || s.doktor.token}` },
  } as ConstructorParameters<typeof NextRequestSinifi>[1]))
  return { status: r.status, j: (await r.json()) as Record<string, any> }
}

before(async () => {
  await sahneHazirla()
  NextRequestSinifi = (await import('next/server')).NextRequest
  GET = (await import('../../app/api/asistan/signed-url/route')).GET
  sesJetonuDogrula = (await import('./sesJetonu')).sesJetonuDogrula
})

beforeEach(() => {
  s = sahneKur()
  el.length = 0
  delete process.env.AYSE_SES_SAGLAYICI
  delete process.env.NOTYA_TEK_BEYIN_DOKTORLAR
})

describe('signed-url: Ayşe Kaya ElevenLabs’te (NOTYA-SES-ELEVEN-GERI-01)', () => {
  it('varsayılan: Fish anahtarı olsa da ConvAI adresi, fish false, taban ajan, Ayşe’nin sesi', async () => {
    const { status, j } = await iste()
    assert.equal(status, 200, JSON.stringify(j))
    assert.equal(j.fish, false)
    assert.match(String(j.signed_url), /^wss:\/\/api\.elevenlabs\.io\//)
    assert.equal(j.agent_id, AYSE_TABAN)
    assert.equal(j.voice_id, AYSE_SES)
    assert.equal(j.persona_id, 'aysekaya')
    assert.equal(j.tek_beyin, undefined, 'bayraksız doktor tek beyin kopyasını almaz')
    assert.equal(j.notya_jeton, undefined)
    assert.ok(el.some((c) => c.url.includes(`get_signed_url?agent_id=${AYSE_TABAN}`)))
  })

  it('ajan denetimi yalnız TTS Flash kilidini bilir: dönüş ayarı (turn) hiç yazılmaz', async () => {
    await iste()
    const yamalar = el.filter((c) => c.method === 'PATCH')
    assert.deepEqual(yamalar, [], 'kilitli TTS + yavaş dönüş ayarı → yama yok')
    assert.ok(!el.some((c) => (c.govde || '').includes('turn_eagerness')))
  })

  it('TEK BEYİN bayraklı doktor: Custom-LLM kopyası + imzalı ses jetonu, oturum doktorun', async () => {
    process.env.NOTYA_TEK_BEYIN_DOKTORLAR = `baska-bir-id, ${s.doktor.id}`
    const { status, j } = await iste({ ek: '&tz=America%2FNew_York' })
    assert.equal(status, 200, JSON.stringify(j))
    assert.equal(j.fish, false)
    assert.equal(j.agent_id, AYSE_TEK_BEYIN)
    assert.ok(el.some((c) => c.url.includes(`get_signed_url?agent_id=${AYSE_TEK_BEYIN}`)))
    assert.equal(j.tek_beyin, true)
    assert.equal(typeof j.asistan_session_id, 'string')
    assert.ok(!Number.isNaN(Date.parse(j.baslangic)), 'baslangic sunucu saati')
    const jeton = sesJetonuDogrula(j.notya_jeton)
    assert.ok(jeton, 'jeton gerçek doğrulayıcıdan geçer')
    assert.equal(jeton!.d, s.doktor.id)
    assert.equal(jeton!.o, j.asistan_session_id)
    assert.equal(jeton!.pe, 'aysekaya')
    assert.equal(jeton!.tz, 'America/New_York')
    const oturum = ortam.db.tablo('asistan_sessions').find((r) => r.id === j.asistan_session_id)
    assert.equal(oturum?.doctor_id, s.doktor.id)
  })

  it('TEK BEYİN: yazılı sohbetin oturumu verilirse aynı oturum; başka doktorun oturumu verilirse yeni oturum', async () => {
    process.env.NOTYA_TEK_BEYIN_DOKTORLAR = s.doktor.id
    const ayni = await iste({ ek: `&asistanSessionId=${s.oturum}` })
    assert.equal(ayni.j.asistan_session_id, s.oturum)
    const yabanci = ortam.db.ekle('asistan_sessions', { doctor_id: s.diger.id, persona_id: 'aysekaya', messages: [], active_context: {} }).id as string
    const r = await iste({ ek: `&asistanSessionId=${yabanci}` })
    assert.equal(r.status, 200)
    assert.notEqual(r.j.asistan_session_id, yabanci, 'HASTA-IZOLASYON: yabancı oturum jetona girmez')
  })

  it('bayrak başka doktorda: bu doktor taban ajanda kalır', async () => {
    process.env.NOTYA_TEK_BEYIN_DOKTORLAR = s.diger.id
    const { j } = await iste()
    assert.equal(j.agent_id, AYSE_TABAN)
    assert.equal(j.tek_beyin, undefined)
  })

  it('AYSE_SES_SAGLAYICI=fish + anahtar: Fish oturumu, ElevenLabs çağrısı yok', async () => {
    process.env.AYSE_SES_SAGLAYICI = 'fish'
    const { status, j } = await iste()
    assert.equal(status, 200, JSON.stringify(j))
    assert.equal(j.fish, true)
    assert.equal(j.signed_url, null)
    assert.equal(typeof j.asistan_session_id, 'string')
    assert.deepEqual(el, [])
  })

  it('AYSE_SES_SAGLAYICI=fish ama anahtar yok: ElevenLabs', async () => {
    process.env.AYSE_SES_SAGLAYICI = 'fish'
    const anahtar = process.env.FISH_API_KEY
    delete process.env.FISH_API_KEY
    try {
      const { j } = await iste()
      assert.equal(j.fish, false)
      assert.equal(j.agent_id, AYSE_TABAN)
    } finally {
      process.env.FISH_API_KEY = anahtar
    }
  })

  it('başka uzman bayrak + anahtarla da asla Fish değil', async () => {
    process.env.AYSE_SES_SAGLAYICI = 'fish'
    const { status, j } = await iste({ persona: 'mehmetdemir', specialty: 'kardiyoloji' })
    assert.equal(status, 200, JSON.stringify(j))
    assert.equal(j.fish, false)
    assert.match(String(j.signed_url), /^wss:/)
    assert.equal(j.persona_id, 'mehmetdemir')
  })

  it('kimliksiz istek 401', async () => {
    const { status } = await iste({ token: 'gecersiz' })
    assert.equal(status, 401)
  })
})
