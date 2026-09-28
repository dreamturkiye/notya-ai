/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 — Ayşe Kaya uçtan uca Fish (ElevenLabs yok).
 *
 * Gerçek rotalar (fish-oturum, fish-tur, ses-kullanim, fish-ses, ses-llm, ses-ekran) + gerçek tarayıcı orkestrası
 * (FishOturumu, TurAlgilayici); sahte olan yalnız Supabase, model (akışlı sahte Claude), Deepgram soketi, mikrofon ve
 * Fish çalar. Ağ yok: ElevenLabs'e (ya da başka bir yere) giden her istek testi düşürür — Fish yolunun ElevenLabs'e
 * hiç dokunmadığı burada da sınanır.
 *
 *   1. Tur algılama: ara + kesin + UtteranceEnd dizisi → TEK tur → TEK model çağrısı.
 *   2. Aynı nonce iki kez → TEK model çağrısı, iki yanıt aynı.
 *   3. Söz kesme: Fish çalarken doktor konuşur → Fish susar, sürmekte olan tur iptal (oturuma yazılmaz), yeni tur işlenir.
 *   4. Yankı kapısı: Fish duyulurken mikrofon Deepgram'a gitmez.
 *   5. Persona geçişi: aysekaya (Fish) ↔ mehmetdemir (ElevenLabs Custom LLM) aynı ortak oturumda — geçmiş / hasta sızmaz;
 *      Fish oturumu kapanışı çift çağrıda da temiz.
 *   6. Kullanım sayaçları (Deepgram saniyesi, Fish baytı) yalnız doktorun kendi oturumuna.
 *
 * Yalnız sentetik QA verisi.
 */
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import type { FishOturumu as FishOturumuT, FishSesi, MikrofonKaynagi, SoketAc, TurIstegi } from './fishOturumu'
import type { TurOlayi } from './turKilidi'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-fish-uctan-uca-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'
process.env.FISH_API_KEY = 'qa-sahte-fish'
process.env.DEEPGRAM_API_KEY = 'qa-sahte-deepgram'
process.env.DEEPGRAM_PROJECT_ID = 'qa-sahte-proje'
const SIR = 'qa-sentetik-ses-llm-sirri-0123456789abcdef'
process.env.NOTYA_SES_LLM_SECRET = SIR
process.env.NOTYA_SES_JETON_SECRET = 'qa-sentetik-ses-jeton-anahtari-0123456789ab'
delete process.env.OPENROUTER_API_KEY

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

/** Sahte Claude. `bekle` verilirse ilk metinden sonra akış orada durur (model hâlâ yazıyor) — söz kesme için. */
type SahteYanit = { metin: string; bekle?: Promise<void>; kuyruk?: string }
const modelIstekleri: string[] = []
/** Cevap çağrıları (akışlı). Arka plandaki öğrenme çağrısı (sohbettenOgren — doktor kendinden söz edince) akışsızdır, ayrı görevdir. */
const cevapCagrilari = () => modelIstekleri.filter((m) => JSON.parse(m).stream === true).length
let yanit: SahteYanit = { metin: JSON.stringify({ speech: 'Sentetik yanıt.' }) }
const parcala = (s: string) => s.match(/[^]{1,7}/g) || []
async function* akis(y: SahteYanit) {
  yield { type: 'message_start', message: { model: 'sahte', usage: { input_tokens: 1 } } }
  yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
  for (const t of parcala(y.metin)) yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t } }
  if (y.bekle) {
    await y.bekle
    for (const t of parcala(y.kuyruk || '')) yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t } }
  }
  yield { type: 'content_block_stop', index: 0 }
  yield { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 1 } }
  yield { type: 'message_stop' }
}
class SahteAnthropic {
  messages = {
    create: async (istek: Record<string, unknown>) => {
      modelIstekleri.push(JSON.stringify(istek))
      const y = yanit
      return istek.stream === true ? akis(y) : { model: 'sahte', content: [{ type: 'text', text: y.metin }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }
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
const deepgramAnahtarlari: { oturum: string; omur: number }[] = []
mock.module(pathToFileURL(join(__dirname, '../transcription/deepgramClient.ts')).href, {
  namedExports: {
    createDeepgramToken: async (oturum: string, omur: number) => {
      deepgramAnahtarlari.push({ oturum, omur })
      return { token: 'qa-deepgram-anahtari', expires_at: new Date(Date.now() + omur * 1000).toISOString() }
    },
  },
})
/** Ağ yok. Tek izin: Fish TTS (fish-ses rotası) — sahte PCM. ElevenLabs'e giden istek testi düşürür. */
const disIstekler: string[] = []
globalThis.fetch = (async (g: unknown) => {
  const url = String(g)
  disIstekler.push(url)
  if (url.startsWith('https://api.fish.audio/')) return new Response(new Uint8Array(480), { status: 200 })
  throw new Error(`fish uçtan uca testi ağ erişimi yapamaz: ${url}`)
}) as typeof fetch

let encrypt: (s: string) => string
let NextRequestSinifi: typeof import('next/server').NextRequest
let F: typeof import('./fishOturumu')
let C: typeof import('./canliDinleme')
let J: typeof import('./sesJetonu')
let R: Record<string, any>

type Hekim = { id: string; token: string }
type Sahne = { doktor: Hekim; diger: Hekim; hasta: string; oturum: string; digerOturum: string }

function sahne(): Sahne {
  db = new SahteVeritabani()
  modelIstekleri.length = 0
  disIstekler.length = 0
  deepgramAnahtarlari.length = 0
  yanit = { metin: JSON.stringify({ speech: 'Sentetik yanıt.' }) }
  const kullanici = () => { const id = randomUUID(); const token = `qa-${id}`; db.kullanicilar.set(token, { id }); return { id, token } }
  const doktor = kullanici()
  const diger = kullanici()
  db.ekle('users', { id: doktor.id, full_name: 'QA Hekim', specialty: 'pediatri' })
  db.ekle('users', { id: diger.id, full_name: 'QA Hekim 2', specialty: 'pediatri' })
  const hasta = db.ekle('patients', {
    doctor_id: doktor.id, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: 'Umutcan Qatestoğlu' })), dob_encrypted: encrypt('2019-04-10'),
    phone_encrypted: null, email_encrypted: null, notes_encrypted: null,
  }).id
  const oturum = db.ekle('asistan_sessions', { doctor_id: doktor.id, persona_id: 'aysekaya', messages: [], active_context: { specialty: 'pediatri' } }).id
  const digerOturum = db.ekle('asistan_sessions', { doctor_id: diger.id, persona_id: 'aysekaya', messages: [{ role: 'user', content: 'QA-GIZLI-DIGER soru' }], active_context: { specialty: 'pediatri' } }).id
  return { doktor, diger, hasta, oturum, digerOturum }
}

function istek(yol: string, token: string, yontem = 'POST', govde?: unknown, sinyal?: AbortSignal) {
  return new NextRequestSinifi(`http://localhost${yol}`, {
    method: yontem,
    headers: { authorization: `Bearer ${token}`, ...(govde !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: govde !== undefined ? JSON.stringify(govde) : undefined,
    ...(sinyal ? { signal: sinyal } : {}),
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
async function olaylar(y: Response): Promise<TurOlayi[]> {
  const out: TurOlayi[] = []
  for await (const o of F.ndjsonOku(y.body!)) out.push(o)
  return out
}
const turPost = (s: Sahne, g: { metin: string; nonce: string; oturum?: string; token?: string; sinyal?: AbortSignal }) =>
  R.fishTur.POST(istek('/api/asistan/fish-tur', g.token || s.doktor.token, 'POST', { asistanSessionId: g.oturum || s.oturum, nonce: g.nonce, metin: g.metin }, g.sinyal)) as Promise<Response>
/** Tarayıcının fishTurIstegi'nin aynısı, fetch yerine rotayı süreç içinde çağırır. */
const rotaIstegi = (s: Sahne, sayac?: { n: number }): TurIstegi => (g) => ({
  async *[Symbol.asyncIterator]() {
    if (sayac) sayac.n += 1
    const y = await turPost(s, { metin: g.metin, nonce: g.nonce, sinyal: g.sinyal })
    if (y.status !== 200 || !y.body) throw new Error(`tur ${y.status}`)
    yield* F.ndjsonOku(y.body)
  },
})
const oturumSatiri = (id: string) => db.tablo('asistan_sessions').find((o) => o.id === id)!

async function bekle(kosul: () => boolean, ms = 3000, neden = 'koşul') {
  const son = Date.now() + ms
  while (!kosul()) {
    if (Date.now() > son) throw new Error(`zaman aşımı: ${neden}`)
    await new Promise((r) => setTimeout(r, 5))
  }
}

// ─── Sahte tarayıcı parçaları ───────────────────────────────────────────────────────────────────
class SahteFish implements FishSesi {
  soylenen: string[] = []
  caliyor = false
  kesildi = 0
  kapandi = 0
  constructor(private readonly fo: () => FishOturumuT | null) {}
  soyle(m: string) { this.soylenen.push(m); this.caliyor = true }
  kes() { this.kesildi += 1; const vardi = this.caliyor; this.caliyor = false; if (vardi) this.fo()?.fishDurdu() }
  caliyorMu() { return this.caliyor }
  kapat() { this.kapandi += 1; this.caliyor = false }
  /** Çalma bitti (son cümle hoparlörden çıktı). */
  bitir() { this.caliyor = false; this.fo()?.fishDurdu() }
}
class SahteMikrofon implements MikrofonKaynagi {
  private cb: ((pcm: ArrayBuffer, rms: number, ms: number) => void) | null = null
  durdu = 0
  async baslat(cb: (pcm: ArrayBuffer, rms: number, ms: number) => void) { this.cb = cb }
  durdur() { this.durdu += 1 }
  /** n × 20 ms çerçeve (640 bayt = 320 örnek @16 kHz). */
  ver(rms: number, n = 1) { for (let i = 0; i < n; i++) this.cb?.(new ArrayBuffer(640), rms, 20) }
}
class SahteSoket {
  gonderilen: (ArrayBuffer | string)[] = []
  kapandi = 0
  constructor(readonly url: string, readonly anahtar: string, readonly olay: { acildi: () => void; mesaj: (v: string) => void; kapandi: () => void }) {}
  gonder(v: ArrayBuffer | string) { this.gonderilen.push(v) }
  kapat() { this.kapandi += 1 }
  sesBayti() { return this.gonderilen.filter((v) => v instanceof ArrayBuffer).reduce((a, v) => a + (v as ArrayBuffer).byteLength, 0) }
  metinler() { return this.gonderilen.filter((v): v is string => typeof v === 'string') }
}
const dg = {
  ara: (t: string) => JSON.stringify({ type: 'Results', is_final: false, speech_final: false, channel: { alternatives: [{ transcript: t }] }, start: 0, duration: 0.5 }),
  kesin: (t: string, speechFinal = false) => JSON.stringify({ type: 'Results', is_final: true, speech_final: speechFinal, channel: { alternatives: [{ transcript: t }] }, start: 0, duration: 1 }),
  son: () => JSON.stringify({ type: 'UtteranceEnd', channel: [0, 1], last_word_end: 2.4 }),
}

async function oturumKur(s: Sahne, o: { turIstegi?: TurIstegi; simdi?: () => number } = {}) {
  let fo: FishOturumuT | null = null
  const fish = new SahteFish(() => fo)
  const mik = new SahteMikrofon()
  const soketler: SahteSoket[] = []
  const soketAc: SoketAc = (url, anahtar, olay) => {
    const k = new SahteSoket(url, anahtar, olay)
    soketler.push(k)
    queueMicrotask(() => olay.acildi())
    return k
  }
  const kayit = { durum: [] as string[], soz: [] as { metin: string; yerine?: string }[], kapat: 0, hata: [] as string[] }
  fo = new F.FishOturumu({
    mikrofon: mik, soketAc, deepgram: { url: 'wss://sahte.deepgram/v1/listen', anahtar: 'qa' },
    turIstegi: o.turIstegi ?? rotaIstegi(s), fish,
    olay: {
      durum: (d) => kayit.durum.push(d),
      doktorSozu: (metin, yerine) => kayit.soz.push({ metin, ...(yerine ? { yerine } : {}) }),
      kapatIstendi: () => { kayit.kapat += 1 },
      hata: (m) => kayit.hata.push(m),
    },
    ...(o.simdi ? { simdi: o.simdi } : {}),
  })
  await fo.baslat()
  await bekle(() => kayit.durum.includes('listening'), 1000, 'soket açıldı')
  const soket = () => soketler[soketler.length - 1]
  return { fo, fish, mik, soketler, soket, kayit, dgVer: (m: string) => soket().olay.mesaj(m) }
}

before(async () => {
  ;({ encrypt } = await import('../security/encryption'))
  NextRequestSinifi = (await import('next/server')).NextRequest
  F = await import('./fishOturumu')
  C = await import('./canliDinleme')
  J = await import('./sesJetonu')
  R = {
    fishTur: await import('../../app/api/asistan/fish-tur/route'),
    fishOturum: await import('../../app/api/asistan/fish-oturum/route'),
    sesKullanim: await import('../../app/api/asistan/ses-kullanim/route'),
    fishSes: await import('../../app/api/asistan/fish-ses/route'),
    sesLlm: await import('../../app/api/asistan/ses-llm/v1/chat/completions/route'),
    sesEkran: await import('../../app/api/asistan/ses-ekran/route'),
  }
})

describe('1. Deepgram tur algılama — ara sonuç tur açmaz, bir söz bir tur', () => {
  it('ara + kesin + speech_final + UtteranceEnd → tam söz bir kez', () => {
    const turlar: string[] = []
    const a = new C.TurAlgilayici({ tur: (m) => turlar.push(m) })
    for (const m of [dg.ara('Hocam'), dg.ara('Hocam ateşli'), dg.kesin('Hocam ateşli çocukta'), dg.ara('hangi'), dg.ara('hangi durumda sevk'), dg.kesin('hangi durumda sevk ederiz?', true), dg.son()]) a.isle(m)
    assert.deepEqual(turlar, ['Hocam ateşli çocukta hangi durumda sevk ederiz?'])
  })
  it('speech_final kaçarsa (gürültü) UtteranceEnd yedeği turu bir kez kapatır; yalnız ara sonuç tur açmaz', () => {
    const turlar: string[] = []
    const a = new C.TurAlgilayici({ tur: (m) => turlar.push(m) })
    a.isle(dg.kesin('Umutcan kaç'))
    a.isle(dg.kesin('kilo?'))
    a.isle(dg.son())
    a.isle(dg.son())
    a.isle(dg.ara('eee'))
    a.isle(dg.son())
    a.isle('bozuk json')
    assert.deepEqual(turlar, ['Umutcan kaç kilo?'])
  })
  it('konuşma turu ayarı: nova-3 + tr, ara sonuç açık, diarize YOK, adlandırılmış sessizlik sabiti', () => {
    const p = C.deepgramCanliParametreleri()
    assert.equal(p.model, 'nova-3')
    assert.equal(p.language, 'tr')
    assert.equal(p.interim_results, 'true')
    assert.equal(p.endpointing, String(C.DG_SESSIZLIK_MS))
    assert.ok(C.DG_SESSIZLIK_MS >= 300 && C.DG_SESSIZLIK_MS <= 500)
    assert.equal(p.utterance_end_ms, '1000')
    assert.equal(p.encoding, 'linear16')
    assert.equal(p.sample_rate, '16000')
    assert.equal('diarize' in p, false)
    assert.match(C.deepgramCanliUrl(), /^wss:\/\/api\.deepgram\.com\/v1\/listen\?.*model=nova-3.*language=tr/)
  })
})

describe('2. Tek dağıtım — Deepgram olayları → fish-tur → model', () => {
  it('bir sözün ara + kesin olayları TAM BİR model çağrısı açar; Fish cevabı okur; oturumda tek tur', async () => {
    const s = sahne()
    yanit = { metin: JSON.stringify({ speech: 'Çok naziksiniz Hocam. Kahve molasında sohbet ederiz.' }) }
    const t = await oturumKur(s)
    try {
      // 5e5014ee'nin canlı hatası: bu tek söz iki Luna-Pro çağrısı açmıştı (ElevenLabs ara + kesin döküm).
      for (const m of [dg.ara('Ben de'), dg.ara('Ben de iyiyim'), dg.kesin('Ben de iyiyim.'), dg.ara('Bir kahve'), dg.ara('Bir kahve içelim mi'), dg.kesin('Bir kahve içelim mi sizinle bugün?', true), dg.son()]) t.dgVer(m)
      await bekle(() => !t.fo.turSuruyor() && t.fish.soylenen.length >= 2, 3000, 'tur bitti')
      assert.equal(cevapCagrilari(), 1, 'bir doktor sözü = bir cevap (model) çağrısı')
      assert.deepEqual(t.kayit.soz, [{ metin: 'Ben de iyiyim. Bir kahve içelim mi sizinle bugün?' }])
      assert.deepEqual(t.fish.soylenen, ['Çok naziksiniz Hocam.', 'Kahve molasında sohbet ederiz.'], 'bitmiş cümleler ayrı ayrı Fish\'e')
      const m = oturumSatiri(s.oturum).messages as { role: string; content: string; kanal?: string }[]
      assert.deepEqual(m.map((x) => x.role), ['user', 'assistant'])
      assert.equal(m[0].content, 'Ben de iyiyim. Bir kahve içelim mi sizinle bugün?', 'ekran yoklaması aynı metinle eşleşir — ikinci doktor balonu yok')
      assert.equal(m[1].kanal, 'ses')
      assert.equal(disIstekler.length, 0, 'ElevenLabs (ya da başka bir dış uç) çağrılmadı')
    } finally { t.fo.kapat() }
  })

  it('doktor duraklayıp sürdürürse (Ayşe henüz konuşmadan): iki parça TEK söz, tek cevap, oturumda tek tur', async () => {
    const s = sahne()
    let birak: () => void = () => {}
    yanit = { metin: '', bekle: new Promise<void>((r) => { birak = r }) }
    const t = await oturumKur(s)
    try {
      t.dgVer(dg.kesin('Ben de iyiyim.', true))
      await bekle(() => cevapCagrilari() === 1, 3000, 'ilk parça modele gitti')
      yanit = { metin: JSON.stringify({ speech: 'Çok naziksiniz Hocam.' }) }
      t.dgVer(dg.kesin('Bir kahve içelim mi sizinle bugün?', true))
      await bekle(() => !t.fo.turSuruyor() && t.fish.soylenen.length === 1, 3000, 'birleşik tur bitti')
      assert.deepEqual(t.kayit.soz, [{ metin: 'Ben de iyiyim.' }, { metin: 'Ben de iyiyim. Bir kahve içelim mi sizinle bugün?', yerine: 'Ben de iyiyim.' }])
      assert.deepEqual(t.fish.soylenen, ['Çok naziksiniz Hocam.'], 'yalnız birleşik sözün cevabı konuşulur')
      const m = oturumSatiri(s.oturum).messages as { role: string; content: string }[]
      assert.deepEqual(m.filter((x) => x.role === 'user').map((x) => x.content), ['Ben de iyiyim. Bir kahve içelim mi sizinle bugün?'], 'bırakılan yarım söz oturuma yazılmaz')
    } finally { birak(); t.fo.kapat() }
  })

  it('istemci de bırakır: yeni söz gelince önceki isteğin sinyali iptal edilir (sunucunun yeni-nonce iptaline ek)', async () => {
    const s = sahne()
    const sinyaller: { metin: string; sinyal: AbortSignal }[] = []
    const sahteIstek: TurIstegi = (g) => ({
      async *[Symbol.asyncIterator]() {
        sinyaller.push({ metin: g.metin, sinyal: g.sinyal })
        await new Promise((r) => g.sinyal.addEventListener('abort', r, { once: true }))
      },
    })
    const t = await oturumKur(s, { turIstegi: sahteIstek })
    try {
      t.dgVer(dg.kesin('Ben de iyiyim.', true))
      t.dgVer(dg.kesin('Bir kahve içelim mi?', true))
      await bekle(() => sinyaller.length === 2, 1000)
      assert.equal(sinyaller[0].sinyal.aborted, true, 'önceki istek bırakıldı')
      assert.equal(sinyaller[1].sinyal.aborted, false)
      assert.equal(sinyaller[1].metin, 'Ben de iyiyim. Bir kahve içelim mi?')
    } finally { t.fo.kapat() }
  })
})

describe('3. Kilit — aynı nonce iki kez modeli çağırmaz', () => {
  it('eşzamanlı iki istek + geç gelen üçüncü: TEK model çağrısı, üçü aynı satırları alır, oturumda tek tur', async () => {
    const s = sahne()
    yanit = { metin: JSON.stringify({ speech: 'Tek cevap. İkinci cümle.' }) }
    const nonce = `qa-${randomUUID()}`
    const [a, b] = await Promise.all([turPost(s, { metin: 'Aynı soru?', nonce }), turPost(s, { metin: 'Aynı soru?', nonce })])
    assert.equal(a.status, 200)
    assert.equal(b.status, 200)
    const [ao, bo] = await Promise.all([olaylar(a), olaylar(b)])
    assert.equal(modelIstekleri.length, 1)
    assert.deepEqual(ao, bo)
    assert.deepEqual(ao.filter((o) => o.t === 'soz').map((o) => (o as { metin: string }).metin), ['Tek cevap.', 'İkinci cümle.'])
    assert.deepEqual(ao.at(-1), { t: 'bitti', iptal: false })
    const c = await olaylar(await turPost(s, { metin: 'Aynı soru?', nonce }))
    assert.deepEqual(c, ao, 'geç gelen tekrar aynı turu baştan okur')
    assert.equal(modelIstekleri.length, 1)
    assert.equal((oturumSatiri(s.oturum).messages as unknown[]).length, 2)
  })

  it('HASTA-IZOLASYON-01: başka doktorun oturumu 404, model çağrılmaz; bozuk nonce / boş metin 400; girişsiz 401', async () => {
    const s = sahne()
    const y = await turPost(s, { metin: 'Az önce ne demiştin?', nonce: `qa-${randomUUID()}`, oturum: s.digerOturum })
    assert.equal(y.status, 404)
    assert.equal(modelIstekleri.length, 0)
    assert.equal((oturumSatiri(s.digerOturum).messages as unknown[]).length, 1, 'yabancı oturum değişmedi')
    assert.equal((await turPost(s, { metin: 'x', nonce: 'kisa' })).status, 400)
    assert.equal((await turPost(s, { metin: '   ', nonce: `qa-${randomUUID()}` })).status, 400)
    assert.equal((await R.fishTur.POST(new NextRequestSinifi('http://localhost/api/asistan/fish-tur', { method: 'POST', body: '{}' } as ConstructorParameters<typeof NextRequestSinifi>[1]))).status, 401)
  })
})

describe('4. Söz kesme ve yankı kapısı', () => {
  it('Fish çalarken doktor konuşur → Fish susar, akan tur iptal (oturuma yazılmaz), kapı açılır, yeni söz işlenir', async () => {
    const s = sahne()
    let birak: () => void = () => {}
    yanit = { metin: '{"speech":"Kahve molası güzel fikir. Bir', bekle: new Promise<void>((r) => { birak = r }), kuyruk: ' de çay."}' }
    const t = await oturumKur(s)
    try {
      t.dgVer(dg.kesin('Bir kahve içelim mi sizinle bugün?', true))
      await bekle(() => t.fish.soylenen.length === 1, 3000, 'ilk cümle Fish\'te')
      t.fo.fishBasladi()
      assert.equal(t.fo.turSuruyor(), true, 'model hâlâ yazıyor')
      const once = t.soket().sesBayti()
      t.mik.ver(0.01, 5) // yankı artığı: eşik altı
      assert.equal(t.soket().sesBayti(), once, 'Fish duyulurken mikrofon Deepgram\'a gitmez')
      assert.equal(t.fish.kesildi, 0)
      t.mik.ver(0.2, Math.ceil(F.KESME_SURE_MS / 20)) // doktor konuşuyor
      assert.equal(t.fish.kesildi, 1, 'Fish anında susar')
      assert.equal(t.fo.yankiKapisiKapali(), false, 'kapı açıldı')
      assert.ok(t.soket().sesBayti() > once, 'sözün başı (ön kayıt) Deepgram\'a verildi')
      assert.equal(t.fo.turSuruyor(), false)
      assert.equal(cevapCagrilari(), 1)
      yanit = { metin: JSON.stringify({ speech: 'Çay da olur Hocam.' }) }
      t.dgVer(dg.kesin('Peki çay olur mu?', true))
      await bekle(() => t.fish.soylenen.includes('Çay da olur Hocam.') && !t.fo.turSuruyor(), 3000, 'yeni tur')
      assert.equal(cevapCagrilari(), 2, 'kesilen tur + yeni tur; kesilen tur yeniden denenmedi')
      const m = oturumSatiri(s.oturum).messages as { role: string; content: string }[]
      assert.deepEqual(m.filter((x) => x.role === 'user').map((x) => x.content), ['Peki çay olur mu?'], 'kesilen tur oturuma yazılmadı')
      assert.equal(t.kayit.hata.length, 0)
    } finally { birak(); t.fo.kapat() }
  })

  it('yankı kapısı: Fish sustuktan sonra YANKI_KUYRUK_MS boyunca da kapalı; açılınca ön kayıt (Fish yankısı) atılır', async () => {
    const s = sahne()
    let saat = 1_000_000
    const t = await oturumKur(s, { simdi: () => saat })
    try {
      t.fo.soyle('Merhaba Hocam. Nasıl yardımcı olabilirim?')
      t.fo.fishBasladi()
      assert.equal(t.fo.yankiKapisiKapali(), true)
      t.mik.ver(0.02, 10)
      assert.equal(t.soket().sesBayti(), 0)
      t.fish.bitir()
      saat += F.YANKI_KUYRUK_MS - 50
      t.mik.ver(0.02)
      assert.equal(t.soket().sesBayti(), 0, 'oda yankısı kuyruğu')
      saat += 100
      t.mik.ver(0.02)
      assert.equal(t.soket().sesBayti(), 640, 'yalnız yeni çerçeve — Fish yankısı taşıyan ön kayıt gönderilmedi')
      assert.equal(t.fish.kesildi, 0, 'eşik altı ses Fish\'i kesmez')
    } finally { t.fo.kapat() }
  })

  it('kapı kapalıyken Deepgram bağlantısı KeepAlive ile canlı tutulur', async () => {
    const s = sahne()
    let saat = 5_000_000
    const t = await oturumKur(s, { simdi: () => saat })
    try {
      t.fo.soyle('Uzun bir cümle.')
      t.fo.fishBasladi()
      saat += C.DG_CANLI_TUT_MS + 1
      await bekle(() => t.soket().metinler().some((m) => m.includes('KeepAlive')), 2500, 'KeepAlive')
      assert.equal(t.soket().sesBayti(), 0)
    } finally { t.fo.kapat() }
  })
})

describe('5. Persona geçişi ve oturum kapanışı', () => {
  it('fish-oturum: yalnız aysekaya; ElevenLabs çağrılmaz; Deepgram anahtarı kısa ömürlü; başka persona fish:false (oturum/anahtar açılmaz)', async () => {
    const s = sahne()
    const al = async (q: string, token = s.doktor.token) => {
      const y: Response = await R.fishOturum.GET(istek(`/api/asistan/fish-oturum?${q}`, token, 'GET'))
      return { status: y.status, j: await y.json() }
    }
    const baska = await al('persona=mehmetdemir')
    assert.deepEqual(baska.j, { fish: false })
    assert.equal(deepgramAnahtarlari.length, 0)
    const oturumSayisi = db.tablo('asistan_sessions').length
    const a = await al(`persona=aysekaya&asistanSessionId=${s.oturum}`)
    assert.equal(a.j.fish, true)
    assert.equal(a.j.asistan_session_id, s.oturum, 'ortak oturum yeniden kullanılır (yazı + ses tek konuşma)')
    assert.equal(a.j.deepgram.anahtar, 'qa-deepgram-anahtari')
    assert.match(a.j.deepgram.url, /model=nova-3/)
    assert.ok(deepgramAnahtarlari[0].omur <= 900, 'kısa ömürlü anahtar')
    assert.equal(db.tablo('asistan_sessions').length, oturumSayisi)
    // B, A'nın oturumunu ve A'nın hastasını ister: A'nın oturumu kullanılmaz, B'ye yeni oturum, hasta yazılmaz.
    const yabanci = await al(`persona=aysekaya&asistanSessionId=${s.oturum}&patientId=${s.hasta}`, s.diger.token)
    assert.equal(yabanci.j.fish, true)
    assert.notEqual(yabanci.j.asistan_session_id, s.oturum)
    const yeni = oturumSatiri(yabanci.j.asistan_session_id)
    assert.equal(yeni.doctor_id, s.diger.id)
    assert.equal(yeni.patient_id ?? null, null, 'başka doktorun hastası yeni oturuma yazılmaz')
    assert.equal((oturumSatiri(s.oturum).messages as unknown[]).length, 0, 'A\'nın oturumu değişmedi')
    assert.equal(disIstekler.length, 0)
    const eski = process.env.DEEPGRAM_API_KEY
    delete process.env.DEEPGRAM_API_KEY
    try { assert.deepEqual((await al('persona=aysekaya')).j, { fish: false }) } finally { process.env.DEEPGRAM_API_KEY = eski }
    assert.equal(F.sesHattiSec('aysekaya', { fish: true }), 'fish')
    assert.equal(F.sesHattiSec('mehmetdemir', { fish: true }), 'elevenlabs')
    assert.equal(F.sesHattiSec('aysekaya', { fish: false }), 'elevenlabs')
    assert.equal(F.sesHattiSec('aysekaya', null), 'elevenlabs')
  })

  it('aysekaya (Fish) → mehmetdemir (ElevenLabs Custom LLM) → aysekaya, aynı ortak oturum: geçmiş ve hasta sızmaz', async () => {
    const s = sahne()
    yanit = { metin: JSON.stringify({ speech: 'QA-AYSE-CEVABI ateşi düştü.' }) }
    const ayse1 = await olaylar(await turPost(s, { metin: 'Umutcan Qatestoğlu nasıl?', nonce: `qa-${randomUUID()}` }))
    assert.ok(ayse1.some((o) => o.t === 'soz'))
    assert.equal(oturumSatiri(s.oturum).active_context.currentPatientId, s.hasta, 'Ayşe turu hastayı odağa aldı')

    yanit = { metin: JSON.stringify({ speech: 'QA-MEHMET-CEVABI kalp sesleri normal.' }) }
    const mehmetOncesi = modelIstekleri.length
    const jeton = J.sesJetonuImzala({ d: s.doktor.id, o: s.oturum, s: 'kardiyoloji', p: null, pe: 'mehmetdemir' })
    const el: Response = await R.sesLlm.POST(new NextRequestSinifi('http://localhost/api/asistan/ses-llm/v1/chat/completions', {
      method: 'POST', headers: { authorization: `Bearer ${SIR}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'notya', stream: true, messages: [{ role: 'user', content: 'Az önce ne konuştuk?' }], elevenlabs_extra_body: { notya_jeton: jeton } }),
    } as ConstructorParameters<typeof NextRequestSinifi>[1]))
    assert.equal(el.status, 200)
    await el.text()
    assert.equal(modelIstekleri.length, mehmetOncesi + 1, 'Mehmet turu modele gitti (vaka boşa koşmadı)')
    const mehmetIstegi = modelIstekleri.at(-1)!
    assert.ok(!mehmetIstegi.includes('QA-AYSE-CEVABI'), 'Ayşe\'nin geçmişi Mehmet\'in ağzına geçmedi')
    assert.ok(!mehmetIstegi.includes('Qatestoğlu') && !mehmetIstegi.includes(s.hasta), 'Ayşe\'nin hastası Mehmet\'e taşınmadı')
    assert.equal(oturumSatiri(s.oturum).persona_id, 'mehmetdemir')
    assert.equal(oturumSatiri(s.oturum).active_context.currentPatientId ?? null, null)

    yanit = { metin: JSON.stringify({ speech: 'Buyurun Hocam.' }) }
    const onceki = modelIstekleri.length
    await olaylar(await turPost(s, { metin: 'Bir kahve içelim mi sizinle bugün?', nonce: `qa-${randomUUID()}` }))
    assert.equal(modelIstekleri.length, onceki + 1, 'Ayşe turu modele gitti (vaka boşa koşmadı)')
    const ayse2 = modelIstekleri.at(-1)!
    assert.ok(!ayse2.includes('QA-MEHMET-CEVABI'), 'Mehmet\'in geçmişi Ayşe\'ye geri gelmedi')
    assert.equal(oturumSatiri(s.oturum).persona_id, 'aysekaya')
    assert.equal(disIstekler.length, 0)
  })

  it('Fish oturumu kapanışı: çift kapat güvenli; mikrofon, soket (CloseStream), Fish, akan tur — bir kez; kapandıktan sonra olay yok', async () => {
    const s = sahne()
    let birak: () => void = () => {}
    yanit = { metin: '', bekle: new Promise<void>((r) => { birak = r }) }
    const sayac = { n: 0 }
    const t = await oturumKur(s, { turIstegi: rotaIstegi(s, sayac) })
    try {
      t.dgVer(dg.kesin('Bir soru?', true))
      await bekle(() => cevapCagrilari() === 1, 3000)
      t.fo.kapat()
      t.fo.kapat()
      assert.equal(t.mik.durdu, 1)
      assert.equal(t.soket().kapandi, 1)
      assert.ok(t.soket().metinler().some((m) => m.includes('CloseStream')))
      assert.equal(t.fish.kapandi, 1)
      assert.equal(t.fo.turSuruyor(), false)
      const durumlar = t.kayit.durum.length
      t.fo.fishBasladi()
      t.dgVer(dg.kesin('Kapandıktan sonra?', true))
      t.mik.ver(0.3, 20)
      await new Promise((r) => setTimeout(r, 30))
      assert.equal(t.kayit.durum.length, durumlar)
      assert.equal(sayac.n, 1, 'kapandıktan sonra tur açılmaz')
      assert.equal(t.fo.gizliTur('[devam]'), false)
    } finally { birak(); t.fo.kapat() }
  })

  it('istemci kod yolu: Fish yolu Conversation.startSession / imzalı URL / ElevenLabs paketine dokunmaz', () => {
    const kok = join(__dirname, '../..')
    const ctx = readFileSync(join(kok, 'components/asistan/AsistanOturumContext.tsx'), 'utf8')
    const fishBas = ctx.indexOf('async function fishIleBasla(')
    const fishSon = ctx.indexOf('async function startConversationWithoutFirstMessage(')
    assert.ok(fishBas > 0 && fishSon > fishBas)
    const govde = ctx.slice(fishBas, fishSon)
    for (const yasak of ['Conversation.', 'signed-url', 'fetchSignedUrl', 'startConversationWithoutFirstMessage(', 'setVolume']) {
      assert.ok(!govde.includes(yasak), `fishIleBasla içinde ${yasak} var`)
    }
    const baslat = ctx.slice(ctx.indexOf('async function startConversation()'), fishBas)
    const fishCagri = baslat.indexOf('await fishIleBasla(')
    assert.ok(fishCagri > 0 && fishCagri < baslat.indexOf('fetchSignedUrl(p, sayfaHastasi)'), 'Fish yolu imzalı URL isteğinden ÖNCE döner')
    assert.match(baslat, /p\.id === "aysekaya" && \(await fishIleBasla\([^)]*\)\)\) return/)
    assert.ok(!ctx.includes('setVolume'), 'ElevenLabs yolunda Fish için susturma kalmadı')
    for (const f of ['lib/asistan/fishOturumu.ts', 'lib/asistan/fishTarayici.ts', 'lib/asistan/canliDinleme.ts', 'app/api/asistan/fish-tur/route.ts', 'app/api/asistan/fish-oturum/route.ts']) {
      const k = readFileSync(join(kok, f), 'utf8')
      assert.ok(!/@elevenlabs|api\.elevenlabs\.io|AsistanConversation/.test(k), `${f} ElevenLabs'e bağlı`)
    }
    const imzali = readFileSync(join(kok, 'app/api/asistan/signed-url/route.ts'), 'utf8')
    assert.ok(!/fish/i.test(imzali), 'ElevenLabs imzalı URL yanıtında Fish bayrağı kalmadı')
  })
})

describe('6. Kullanım sayaçları — dakika başı maliyetin girdisi', () => {
  it('fish-ses Fish\'e giden metnin UTF-8 baytını doktorun kendi oturumuna yazar; yabancı oturuma yazmaz', async () => {
    const s = sahne()
    const y: Response = await R.fishSes.POST(istek('/api/asistan/fish-ses', s.doktor.token, 'POST', { metin: 'Ateş düştü. İyi.', asistanSessionId: s.oturum }))
    assert.equal(y.status, 200)
    await y.arrayBuffer()
    await bekle(() => db.tablo('ses_kullanim').length === 2, 1000, 'sayaç')
    const bayt = db.tablo('ses_kullanim').find((r) => r.olcu === 'utf8_bayt')!
    assert.equal(bayt.kaynak, 'fish')
    assert.equal(bayt.asistan_session_id, s.oturum)
    assert.equal(bayt.doctor_id, s.doktor.id)
    assert.equal(bayt.miktar, new TextEncoder().encode('Ateş düştü. [break] İyi.').length)
    assert.equal(bayt.model, 's2.1-pro-free')
    const y2: Response = await R.fishSes.POST(istek('/api/asistan/fish-ses', s.doktor.token, 'POST', { metin: 'Başka.', asistanSessionId: s.digerOturum }))
    assert.equal(y2.status, 200)
    await y2.arrayBuffer()
    await new Promise((r) => setTimeout(r, 20))
    assert.equal(db.tablo('ses_kullanim').filter((r) => r.asistan_session_id === s.digerOturum).length, 0)
  })

  it('ses-kullanim: tarayıcının Deepgram saniyeleri kendi oturumuna; yabancı oturum 404 ve yazı yok; saçma sayı atılır', async () => {
    const s = sahne()
    const gonder = (oturum: string, satirlar: unknown) => R.sesKullanim.POST(istek('/api/asistan/ses-kullanim', s.doktor.token, 'POST', { asistanSessionId: oturum, satirlar })) as Promise<Response>
    const y = await gonder(s.oturum, [
      { kaynak: 'deepgram', olcu: 'ses_saniye', miktar: 42.5, model: 'nova-3' },
      { kaynak: 'deepgram', olcu: 'oturum_saniye', miktar: 60 },
      { kaynak: 'deepgram', olcu: 'ses_saniye', miktar: -1 },
      { kaynak: 'deepgram', olcu: 'ses_saniye', miktar: 1e9 },
      { kaynak: 'fish', olcu: 'utf8_bayt', miktar: 100 },
      { kaynak: 'deepgram', olcu: 'bilinmeyen', miktar: 3 },
    ])
    assert.equal(y.status, 200)
    assert.deepEqual(db.tablo('ses_kullanim').map((r) => [r.olcu, r.miktar]), [['ses_saniye', 42.5], ['oturum_saniye', 60]])
    const yabanci = await gonder(s.digerOturum, [{ kaynak: 'deepgram', olcu: 'ses_saniye', miktar: 5 }])
    assert.equal(yabanci.status, 404)
    assert.equal(db.tablo('ses_kullanim').length, 2)
  })
})
