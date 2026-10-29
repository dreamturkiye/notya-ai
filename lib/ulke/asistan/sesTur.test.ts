/**
 * SES-OMURGA-V2 on the country mouth (lib/ulke/asistan/sunucu.ts + sesTur.ts) — the same failure patterns Türkiye's
 * lib/asistan/sesOmurgaV2.test.ts guards, through the REAL country route with the model stubbed:
 *   A  a burst of identical requests (ElevenLabs retries) = ONE model call, every request gets the answer;
 *      a grown transcript at the same turn aborts the older model call, only the newest speaks.
 *   C  pauses / fillers / scraps never reach the model (skip_turn); never a whitespace-only reply ("... " buffer).
 *   E  first byte ≤ 300 ms.
 * Synthetic text only — no patient data. Required by scripts/ses-ci.mjs (every build) and the founder lock.
 */
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { before, describe, it, mock } from 'node:test'

const SIR = 's'.repeat(32)
process.env.NOTYA_SES_JETON_SECRET = SIR
process.env.NOTYA_SES_LLM_SECRET = SIR

const KOK = join(__dirname, '../../..')
const url = (p: string) => pathToFileURL(join(KOK, p)).href

/** The model stub: counts calls, streams two sentences slowly, honours the abort signal. */
const model = { cagri: 0, iptalEdilen: 0, cevap: 'The usual dose is weight based. Check the label first.', gecikme: 120 }
type AkisGirdisi = { iptal?: AbortSignal }
async function sahteAkis(g: AkisGirdisi, parca: (p: string) => void): Promise<string | null> {
  model.cagri += 1
  const parcalar = model.cevap ? model.cevap.match(/.{1,12}/g) || [] : []
  for (const p of parcalar) {
    await new Promise((r) => setTimeout(r, model.gecikme / Math.max(1, parcalar.length)))
    if (g.iptal?.aborted) { model.iptalEdilen += 1; return null }
    parca(p)
  }
  await new Promise((r) => setTimeout(r, 5))
  if (g.iptal?.aborted) { model.iptalEdilen += 1; return null }
  return model.cevap
}

let canliLlmPost: (req: any) => Promise<Response>
let canliJetonuImzala: (g: { hesapId: string; kod: string; rol: string; cagri?: string | null }) => string | null
let SES_TAMPON: string
let ulkeOnKapi: (m: string, el: unknown, dil: string) => string | null
let dolguSozu: (dil: string) => { mesaj: string; ek: string[] }
let NextRequestSinifi: typeof import('next/server').NextRequest
let kod = ''
let rol = ''
let hazir = false

before(async () => {
  const t = await import(url('lib/ulke/asistan/sesTur.ts'))
  SES_TAMPON = t.SES_TAMPON
  ulkeOnKapi = t.ulkeOnKapi
  dolguSozu = t.dolguSozu
  // The country this branch builds — the first pack that brings a live assistant.
  for (const k of ['us', 'gb', 'ca', 'au', 'nz', 'uz']) {
    const yol = `countries/${k}/klinik/index.ts`
    if (!existsSync(join(KOK, yol))) continue
    const m = await import(url(yol)) as Record<string, { canliAsistan?: unknown; ses?: unknown } | undefined>
    const kl = Object.values(m).find((v) => v && typeof v === 'object' && 'canliAsistan' in v && v.canliAsistan && v.ses)
    if (kl) { kod = k; break }
  }
  if (!kod) return
  process.env.NOTYA_COUNTRY = kod
  const notModeli = await import(url('lib/ulke/uygulama/notModeli.ts'))
  mock.module(url('lib/ulke/uygulama/notModeli.ts'), { namedExports: { ...notModeli, modeldenAkis: sahteAkis } })
  const kota = await import(url('lib/ulke/uygulama/kota.ts'))
  mock.module(url('lib/ulke/uygulama/kota.ts'), { namedExports: { ...kota, kovaKotasiKullan: async () => true } })
  const oturum = await import(url('lib/ulke/sunucuOturum.ts'))
  mock.module(url('lib/ulke/sunucuOturum.ts'), { namedExports: { ...oturum, ulkeServisSupabase: () => ({}) } })
  // English packs name no persona (the screens show a neutral line); the mouth's mechanics are tested with a synthetic one.
  const arG = await import(url('lib/ulke/arayuz/index.ts'))
  const SENTETIK = { tamAd: 'QA Assistant', kisaAd: 'QA', makineTuretimi: false, cinsiyet: 'kadin' }
  mock.module(url('lib/ulke/arayuz/index.ts'), { namedExports: { ...arG, asistanKimligi: (x: unknown, d: unknown) => arG.asistanKimligi(x, d) ?? (arG.rolAdi(x, d) ? SENTETIK : null) } })
  const s = await import(url('lib/ulke/asistan/sunucu.ts'))
  const j = await import(url('lib/ulke/asistan/jeton.ts'))
  const r = await import(url('lib/ulke/uygulama/rol.ts'))
  canliLlmPost = s.canliLlmPost
  canliJetonuImzala = j.canliJetonuImzala
  const ar = await import(url('lib/ulke/arayuz/index.ts'))
  const dil = (await import(url('lib/ulke/ulke.ts'))).ulkePaketi().varsayilanDil
  rol = (r.uygulamaRolleri() as string[]).find((x) => ar.rolAdi(x, dil)) || ''
  NextRequestSinifi = (await import('next/server')).NextRequest
  hazir = Boolean(rol)
})

let cagriNo = 0
type Tur = { status: number; icerik: string[]; araclar: string[]; ilkBaytMs: number; ham: string }
async function tur(mesajlar: { role: string; content: string }[], o: { cagri?: string; tools?: string[] } = {}): Promise<Tur> {
  const jeton = canliJetonuImzala({ hesapId: 'qa-hesap', kod, rol, cagri: o.cagri ?? `qa-cagri-${++cagriNo}` })
  const govde = {
    model: 'notya-canli', messages: mesajlar,
    tools: (o.tools ?? ['skip_turn', 'end_call']).map((name) => ({ type: 'function', function: { name } })),
    elevenlabs_extra_body: { notya_jeton: jeton },
  }
  const t0 = Date.now()
  const res = await canliLlmPost(new NextRequestSinifi('http://qa.test/api/ulke/asistan-canli/ses-llm/v1/chat/completions', {
    method: 'POST', headers: { authorization: `Bearer ${SIR}`, 'content-type': 'application/json' }, body: JSON.stringify(govde),
  }))
  const okuyucu = res.body!.getReader()
  const dec = new TextDecoder()
  let ham = ''
  let ilkBaytMs = -1
  for (;;) {
    const { value, done } = await okuyucu.read()
    if (done) break
    if (ilkBaytMs < 0) ilkBaytMs = Date.now() - t0
    ham += dec.decode(value, { stream: true })
  }
  const icerik: string[] = []
  const araclar: string[] = []
  for (const satir of ham.split('\n')) {
    if (!satir.startsWith('data: ') || satir.includes('[DONE]')) continue
    const d = JSON.parse(satir.slice(6)).choices?.[0]?.delta || {}
    if (typeof d.content === 'string') icerik.push(d.content)
    for (const tc of d.tool_calls || []) araclar.push(tc.function?.name)
  }
  return { status: res.status, icerik, araclar, ilkBaytMs, ham }
}
const metin = (t: Tur) => t.icerik.join('')
const bosluklu = (t: Tur) => t.icerik.some((c) => c.length > 0 && !c.trim())

describe('SES-OMURGA-V2 — country mouth', () => {
  it('pure: fillers per language, the soft-timeout filler promises no time', () => {
    assert.ok(ulkeOnKapi('um', [], 'en'))
    assert.equal(ulkeOnKapi('um uh', [], 'en'), 'dolgu')
    assert.equal(ulkeOnKapi('...', [], 'en'), 'duraklama')
    assert.equal(ulkeOnKapi('yes', [], 'en'), null)
    assert.equal(ulkeOnKapi('What is the usual dose?', [], 'en'), null)
    assert.ok(ulkeOnKapi('eee', [], 'uz'))
    assert.equal(ulkeOnKapi('yoq', [], 'uz'), null)
    for (const d of ['en', 'uz']) {
      const f = dolguSozu(d)
      for (const s of [f.mesaj, ...f.ek]) assert.doesNotMatch(s, /second|moment|minute|soniya|daqiqa/i)
    }
    assert.equal(SES_TAMPON, '... ')
  })

  it('C: a pause, a filler or a scrap never reaches the model — skip_turn, no whitespace', async (t) => {
    if (!hazir) return t.skip('no pack on this branch brings the live assistant yet (route dormant)')
    const once = model.cagri
    for (const m of ['...', 'um', 'hmm']) {
      const r = await tur([{ role: 'assistant', content: 'Hello.' }, { role: 'user', content: m }])
      assert.equal(r.status, 200)
      assert.ok(r.araclar.includes('skip_turn'), `skip_turn for ${m}`)
      assert.equal(bosluklu(r), false)
    }
    assert.equal(model.cagri, once)
  })

  it('A: a burst of identical requests = one model call; every request gets the words, none whitespace', async (t) => {
    if (!hazir) return t.skip('no pack on this branch brings the live assistant yet (route dormant)')
    const once = model.cagri
    const cagri = 'qa-patlama'
    const m = [{ role: 'assistant', content: 'Hello.' }, { role: 'user', content: 'What is the usual dose for this drug?' }]
    const sonuclar = await Promise.all(Array.from({ length: 6 }, (_, i) => new Promise<Tur>((r) => setTimeout(() => r(tur(m, { cagri })), i * 10))))
    assert.equal(model.cagri - once, 1)
    for (const r of sonuclar) {
      assert.equal(bosluklu(r), false)
      assert.match(metin(r), /weight based/)
    }
  })

  it('A: a grown transcript at the same turn aborts the older call — only the newest speaks', async (t) => {
    if (!hazir) return t.skip('no pack on this branch brings the live assistant yet (route dormant)')
    const once = { c: model.cagri, i: model.iptalEdilen }
    model.gecikme = 400
    try {
      const cagri = 'qa-buyuyen'
      const eski = tur([{ role: 'assistant', content: 'Hello.' }, { role: 'user', content: 'What is the usual dose' }], { cagri })
      await new Promise((r) => setTimeout(r, 60))
      const yeni = await tur([{ role: 'assistant', content: 'Hello.' }, { role: 'user', content: 'What is the usual dose for this drug in children?' }], { cagri })
      const e = await eski
      assert.equal(model.cagri - once.c, 2)
      assert.equal(model.iptalEdilen - once.i, 1)
      assert.match(metin(yeni), /weight based/)
      assert.doesNotMatch(metin(e), /Check the label/)
      assert.equal(bosluklu(e), false)
    } finally { model.gecikme = 120 }
  })

  it('E + no whitespace: first byte ≤ 300 ms; an empty answer ends with the "... " buffer', async (t) => {
    if (!hazir) return t.skip('no pack on this branch brings the live assistant yet (route dormant)')
    const r = await tur([{ role: 'user', content: 'Summarise the guideline for me.' }])
    assert.ok(r.ilkBaytMs >= 0 && r.ilkBaytMs <= 300, `first byte ${r.ilkBaytMs} ms`)
    const eski = model.cevap
    model.cevap = ''
    try {
      const b = await tur([{ role: 'user', content: 'And the second point of it?' }], { tools: [] })
      assert.equal(bosluklu(b), false)
      assert.ok(b.icerik.length > 0)
    } finally { model.cevap = eski }
  })
})
