/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 / SADECE-01 — Ayşe Kaya uçtan uca Fish (ElevenLabs yok, Deepgram yok).
 *
 * Gerçek rotalar (fish-oturum, fish-dinle, fish-tur, ses-kullanim, fish-ses, ses-llm, ses-ekran) + gerçek tarayıcı
 * orkestrası (FishOturumu, SozAlgilayici, wavKodla); sahte olan yalnız Supabase, model (akışlı sahte Claude), Fish'in
 * kendi uçları (ASR: sıradaki sentetik döküm, TTS: sahte PCM), mikrofon ve Fish çalar. Ağ yok: Fish dışında bir yere
 * (ElevenLabs, Deepgram…) giden her istek testi düşürür.
 *
 *   1. Söz algılama (yerel VAD): bir söz = bir WAV; kısa ses / tık / cümle içi duraklama tur açmaz; büyüyen tampon
 *      için ASR çağrısı yok.
 *   2. Tek dağıtım: mikrofon → VAD → fish-dinle (TEK Fish ASR) → fish-tur (TEK model çağrısı) → Fish. ASR hatası görünür,
 *      başka satıcıya düşülmez.
 *   3. Aynı nonce iki kez → TEK model çağrısı, iki yanıt aynı.
 *   4. Söz kesme + yankı kapısı: Fish duyulurken mikrofon VAD'a gitmez; doktor araya girince Fish susar, akan tur
 *      iptal, sözün başı korunur.
 *   5. Persona geçişi: aysekaya (Fish) ↔ mehmetdemir (ElevenLabs Custom LLM) aynı ortak oturumda — geçmiş / hasta sızmaz;
 *      Fish oturumu kapanışı çift çağrıda da temiz; istemci kod yolu ElevenLabs'e hiç ulaşmaz.
 *   6. Kullanım + gecikme sayaçları (Fish ASR saniyesi, Fish TTS baytı, aşama gecikmeleri) yalnız doktorun kendi oturumuna.
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
import type { DinlemeIstegi, FishOturumu as FishOturumuT, FishSesi, MikrofonKaynagi, TurGecikmesi, TurIstegi } from './fishOturumu'
import type { TurOlayi } from './turKilidi'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-fish-uctan-uca-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'
process.env.FISH_API_KEY = 'qa-sahte-fish'
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
/**
 * Ağ yok. Tek izin: Fish'in kendi uçları. /v1/asr → sıradaki sentetik döküm (asrKuyrugu) ya da asrDavranis;
 * /v1/tts → sahte PCM. Başka her uç (ElevenLabs, Deepgram…) testi düşürür.
 */
const disIstekler: string[] = []
type AsrIstegi = { model: string | null; auth: string | null; dil: string | null; zamanDamgasi: string | null; ses: Blob | null }
const asrIstekleri: AsrIstegi[] = []
let asrKuyrugu: string[] = []
let asrDavranis: (() => Response | Promise<Response>) | null = null
globalThis.fetch = (async (g: unknown, init?: RequestInit) => {
  const url = String(g)
  disIstekler.push(url)
  if (url === 'https://api.fish.audio/v1/asr') {
    const h = new Headers(init?.headers)
    const f = init?.body as FormData
    const ses = f.get('audio')
    asrIstekleri.push({ model: h.get('model'), auth: h.get('authorization'), dil: f.get('language') as string | null, zamanDamgasi: f.get('ignore_timestamps') as string | null, ses: ses instanceof Blob ? ses : null })
    if (asrDavranis) return asrDavranis()
    const metin = asrKuyrugu.shift() ?? ''
    return new Response(JSON.stringify({ text: metin, duration: 1.3, segments: [], language_code: 'tr', language: 'Turkish' }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  if (url === 'https://api.fish.audio/v1/tts') return new Response(new Uint8Array(480), { status: 200 })
  throw new Error(`fish uçtan uca testi ağ erişimi yapamaz: ${url}`)
}) as typeof fetch
const fishDisi = () => disIstekler.filter((u) => !u.startsWith('https://api.fish.audio/'))

let encrypt: (s: string) => string
let NextRequestSinifi: typeof import('next/server').NextRequest
let F: typeof import('./fishOturumu')
let V: typeof import('./sozAlgilayici')
let J: typeof import('./sesJetonu')
let R: Record<string, any>

type Hekim = { id: string; token: string }
type Sahne = { doktor: Hekim; diger: Hekim; hasta: string; oturum: string; digerOturum: string }

function sahne(): Sahne {
  db = new SahteVeritabani()
  modelIstekleri.length = 0
  disIstekler.length = 0
  asrIstekleri.length = 0
  asrKuyrugu = []
  asrDavranis = null
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

/** Tarayıcının fishDinleIstegi'nin aynısı, fetch yerine rotayı süreç içinde çağırır (ham WAV gövdesi). */
const dinlePost = (s: Sahne, wav: ArrayBuffer | Uint8Array, o: { oturum?: string; token?: string; sinyal?: AbortSignal } = {}) =>
  R.fishDinle.POST(new NextRequestSinifi(`http://localhost/api/asistan/fish-dinle?asistanSessionId=${o.oturum || s.oturum}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${o.token || s.doktor.token}`, 'content-type': 'audio/wav' },
    body: wav instanceof Uint8Array ? wav : new Uint8Array(wav),
    ...(o.sinyal ? { signal: o.sinyal } : {}),
  } as ConstructorParameters<typeof NextRequestSinifi>[1])) as Promise<Response>
const rotaDinle = (s: Sahne, sayac?: { n: number; wavlar: ArrayBuffer[] }): DinlemeIstegi => async (g) => {
  if (sayac) { sayac.n += 1; sayac.wavlar.push(g.wav) }
  const y = await dinlePost(s, g.wav, { sinyal: g.sinyal })
  if (y.status !== 200) throw new Error(`dinle ${y.status}`)
  const j = await y.json() as { metin?: string }
  return { metin: j.metin || '' }
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
const CERCEVE_BAYT = 640
class SahteMikrofon implements MikrofonKaynagi {
  private cb: ((pcm: ArrayBuffer, rms: number, ms: number) => void) | null = null
  durdu = 0
  async baslat(cb: (pcm: ArrayBuffer, rms: number, ms: number) => void) { this.cb = cb }
  durdur() { this.durdu += 1 }
  /** n × 20 ms çerçeve (640 bayt = 320 örnek @16 kHz). */
  ver(rms: number, n = 1) { for (let i = 0; i < n; i++) this.cb?.(new ArrayBuffer(CERCEVE_BAYT), rms, 20) }
}
const KONUSMA = 0.2
const SESSIZ = 0.001
const SESSIZLIK_KARE = () => Math.ceil(V.SOZ_SONU_SESSIZLIK_MS / 20)

async function oturumKur(s: Sahne, o: { turIstegi?: TurIstegi; dinle?: DinlemeIstegi; simdi?: () => number; dinleSayac?: { n: number; wavlar: ArrayBuffer[] } } = {}) {
  let fo: FishOturumuT | null = null
  const fish = new SahteFish(() => fo)
  const mik = new SahteMikrofon()
  const kayit = { durum: [] as string[], soz: [] as { metin: string; yerine?: string }[], kapat: 0, hata: [] as string[], gecikme: [] as TurGecikmesi[] }
  fo = new F.FishOturumu({
    mikrofon: mik,
    dinle: o.dinle ?? rotaDinle(s, o.dinleSayac),
    turIstegi: o.turIstegi ?? rotaIstegi(s), fish,
    olay: {
      durum: (d) => kayit.durum.push(d),
      doktorSozu: (metin, yerine) => kayit.soz.push({ metin, ...(yerine ? { yerine } : {}) }),
      kapatIstendi: () => { kayit.kapat += 1 },
      hata: (m) => kayit.hata.push(m),
      gecikme: (g) => kayit.gecikme.push(g),
    },
    ...(o.simdi ? { simdi: o.simdi } : {}),
  })
  await fo.baslat()
  assert.ok(kayit.durum.includes('listening'))
  /** Doktor bir söz söyler: n kare konuşma + söz sonu sessizliği (VAD sözü tam burada bitirir). */
  const konus = (n = 20) => { mik.ver(KONUSMA, n); mik.ver(SESSIZ, SESSIZLIK_KARE()) }
  return { fo, fish, mik, kayit, konus }
}

before(async () => {
  ;({ encrypt } = await import('../security/encryption'))
  NextRequestSinifi = (await import('next/server')).NextRequest
  F = await import('./fishOturumu')
  V = await import('./sozAlgilayici')
  J = await import('./sesJetonu')
  R = {
    fishTur: await import('../../app/api/asistan/fish-tur/route'),
    fishDinle: await import('../../app/api/asistan/fish-dinle/route'),
    fishOturum: await import('../../app/api/asistan/fish-oturum/route'),
    sesKullanim: await import('../../app/api/asistan/ses-kullanim/route'),
    fishSes: await import('../../app/api/asistan/fish-ses/route'),
    sesLlm: await import('../../app/api/asistan/ses-llm/v1/chat/completions/route'),
    sesEkran: await import('../../app/api/asistan/ses-ekran/route'),
  }
})


describe('1. Söz algılama (yerel VAD) — bir söz bir WAV, ara ASR yok', () => {
  const surucu = () => {
    const sozler: import('./sozAlgilayici').BitenSoz[] = []
    const atilan: number[] = []
    let saat = 1_000
    const a = new V.SozAlgilayici({ soz: (x) => sozler.push(x), atildi: (ms) => atilan.push(ms) })
    const ver = (rms: number, n: number) => { for (let i = 0; i < n; i++) { saat += 20; a.cerceve(new ArrayBuffer(CERCEVE_BAYT), rms, 20, saat) } }
    return { a, sozler, atilan, ver, saat: () => saat }
  }
  const kuyrukKare = () => SESSIZLIK_KARE() - Math.floor((V.SOZ_SONU_SESSIZLIK_MS - V.SOZ_KUYRUK_MS) / 20)

  it('sessizlik + konuşma + söz sonu sessizliği → TAM bir söz; ön kayıt dahil, uzun kuyruk kırpılmış; bir kare erken bitmez', () => {
    const d = surucu()
    d.ver(SESSIZ, 10)
    d.ver(KONUSMA, 20)
    assert.equal(d.a.konusuyorMu(), true)
    d.ver(SESSIZ, SESSIZLIK_KARE() - 1)
    assert.equal(d.sozler.length, 0, 'söz sonu sessizliği dolmadan söz bitmez')
    d.ver(SESSIZ, 1)
    assert.equal(d.sozler.length, 1)
    const s = d.sozler[0]
    const onKayitKare = V.SOZ_ON_KAYIT_MS / 20
    // ön kayıt (başlama penceresi dahil) + başlamadan sonraki konuşma + bırakılan kuyruk
    assert.equal(s.pcm.length, onKayitKare + (20 - V.SOZ_BASLAMA_MS / 20) + kuyrukKare())
    assert.equal(s.sesliMs, 400)
    assert.equal(s.ilan - s.sonSes, V.SOZ_SONU_SESSIZLIK_MS, 'söz sonu = son sesten tam SOZ_SONU_SESSIZLIK_MS sonra')
    assert.equal(s.kesildi, false)
    assert.equal(d.a.konusuyorMu(), false)
    d.ver(SESSIZ, 100)
    assert.equal(d.sozler.length, 1, 'sessizlik ikinci söz açmaz')
  })

  it('kısa ses (öksürük) Fish\'e gitmez; tık söz başlatmaz; cümle içi kısa duraklama sözü bölmez', () => {
    const d = surucu()
    d.ver(KONUSMA, Math.floor(V.EN_KISA_SOZ_MS / 20) - 1)
    d.ver(SESSIZ, SESSIZLIK_KARE())
    assert.equal(d.sozler.length, 0)
    assert.equal(d.atilan.length, 1)
    for (let i = 0; i < 20; i++) { d.ver(KONUSMA, V.SOZ_BASLAMA_MS / 20 - 1); d.ver(SESSIZ, 1) }
    assert.equal(d.a.konusuyorMu(), false, 'SOZ_BASLAMA_MS altındaki tıklar söz sayılmaz')
    d.ver(KONUSMA, 20)
    d.ver(SESSIZ, SESSIZLIK_KARE() - 5) // ~400 ms nefes
    d.ver(KONUSMA, 20)
    d.ver(SESSIZ, SESSIZLIK_KARE())
    assert.equal(d.sozler.length, 1, 'duraklama < SOZ_SONU_SESSIZLIK_MS → tek söz')
    assert.equal(d.sozler[0].sesliMs, 800)
  })

  it('EN_UZUN_SOZ_MS\'de söz kapatılır (kesildi) — tampon sınırsız büyümez', () => {
    const d = surucu()
    d.ver(KONUSMA, V.EN_UZUN_SOZ_MS / 20 + 10)
    assert.equal(d.sozler.length, 1)
    assert.equal(d.sozler[0].kesildi, true)
    assert.ok(d.sozler[0].sureMs >= V.EN_UZUN_SOZ_MS && d.sozler[0].sureMs < V.EN_UZUN_SOZ_MS + 400)
  })

  it('adlandırılmış, ayarlanabilir sabitler: söz sonu 400–600 ms; söz eşiği söz kesme eşiğinin altında', () => {
    assert.ok(V.SOZ_SONU_SESSIZLIK_MS >= 400 && V.SOZ_SONU_SESSIZLIK_MS <= 600)
    assert.ok(V.SOZ_ESIGI_RMS < F.KESME_ESIGI_RMS)
    assert.ok(V.SOZ_KUYRUK_MS < V.SOZ_SONU_SESSIZLIK_MS)
  })

  it('wavKodla: 44 baytlık PCM16 mono 16 kHz başlığı + çerçeveler sırayla', () => {
    const a = new Int16Array([1, 2, 3]).buffer
    const b = new Int16Array([-4, 5]).buffer
    const w = V.wavKodla([a, b])
    const v = new DataView(w)
    const str = (o: number, n: number) => String.fromCharCode(...new Uint8Array(w, o, n))
    assert.equal(w.byteLength, 44 + 10)
    assert.equal(str(0, 4), 'RIFF')
    assert.equal(v.getUint32(4, true), 36 + 10)
    assert.equal(str(8, 8), 'WAVEfmt ')
    assert.equal(v.getUint16(20, true), 1)
    assert.equal(v.getUint16(22, true), 1)
    assert.equal(v.getUint32(24, true), 16_000)
    assert.equal(v.getUint32(28, true), 32_000)
    assert.equal(v.getUint16(34, true), 16)
    assert.equal(str(36, 4), 'data')
    assert.equal(v.getUint32(40, true), 10)
    assert.deepEqual([...new Int16Array(w, 44)], [1, 2, 3, -4, 5])
  })

  it('3 sn konuşma boyunca Fish ASR çağrılmaz; söz bitince TAM bir çağrı (transcribe-1, dil ipucu tr, anahtar sunucuda)', async () => {
    const s = sahne()
    asrKuyrugu = ['Hocam bugün hava çok güzel, bir kahve içelim mi?']
    const sayac = { n: 0, wavlar: [] as ArrayBuffer[] }
    const t = await oturumKur(s, { dinleSayac: sayac })
    try {
      for (let i = 0; i < 15; i++) {
        t.mik.ver(KONUSMA, 10)
        t.mik.ver(SESSIZ, 5) // 100 ms'lik hece arası — söz sürer
      }
      await new Promise((r) => setTimeout(r, 20))
      assert.equal(sayac.n, 0, 'büyüyen tampon için ASR yok')
      assert.equal(asrIstekleri.length, 0)
      t.mik.ver(SESSIZ, SESSIZLIK_KARE())
      await bekle(() => !t.fo.turSuruyor() && t.fish.soylenen.length > 0, 3000, 'tur bitti')
      assert.equal(sayac.n, 1)
      assert.equal(asrIstekleri.length, 1)
      const a = asrIstekleri[0]
      assert.equal(a.model, 'transcribe-1')
      assert.equal(a.dil, 'tr')
      assert.equal(a.zamanDamgasi, 'true')
      assert.equal(a.auth, 'Bearer qa-sahte-fish')
      assert.equal(a.ses?.type, 'audio/wav')
      assert.equal(a.ses?.size, sayac.wavlar[0].byteLength, 'tarayıcının WAV\'ı Fish\'e değişmeden gider')
      assert.equal(cevapCagrilari(), 1)
      assert.deepEqual(t.kayit.soz, [{ metin: 'Hocam bugün hava çok güzel, bir kahve içelim mi?' }])
    } finally { t.fo.kapat() }
  })
})

describe('2. Tek dağıtım — mikrofon → VAD → fish-dinle → fish-tur → model → Fish', () => {
  it('bir söz: TEK Fish ASR, TEK model çağrısı; Fish cevabı cümle cümle okur; oturumda tek tur; Fish dışı ağ yok', async () => {
    const s = sahne()
    asrKuyrugu = ['Ben de iyiyim. Bir kahve içelim mi sizinle bugün?']
    yanit = { metin: JSON.stringify({ speech: 'Çok naziksiniz Hocam. Kahve molasında sohbet ederiz.' }) }
    const t = await oturumKur(s)
    try {
      t.konus(40)
      await bekle(() => !t.fo.turSuruyor() && t.fish.soylenen.length >= 2, 3000, 'tur bitti')
      assert.equal(asrIstekleri.length, 1, 'bir söz = bir ASR çağrısı')
      assert.equal(cevapCagrilari(), 1, 'bir doktor sözü = bir cevap (model) çağrısı')
      assert.deepEqual(t.kayit.soz, [{ metin: 'Ben de iyiyim. Bir kahve içelim mi sizinle bugün?' }])
      assert.deepEqual(t.fish.soylenen, ['Çok naziksiniz Hocam.', 'Kahve molasında sohbet ederiz.'], 'bitmiş cümleler ayrı ayrı Fish\'e')
      const m = oturumSatiri(s.oturum).messages as { role: string; content: string; kanal?: string }[]
      assert.deepEqual(m.map((x) => x.role), ['user', 'assistant'])
      assert.equal(m[0].content, 'Ben de iyiyim. Bir kahve içelim mi sizinle bugün?', 'ekran yoklaması aynı metinle eşleşir — ikinci doktor balonu yok')
      assert.equal(m[1].kanal, 'ses')
      assert.deepEqual(fishDisi(), [], 'ElevenLabs / Deepgram (ya da Fish dışı bir uç) çağrılmadı')
      assert.equal(t.kayit.hata.length, 0)
    } finally { t.fo.kapat() }
  })

  it('doktor duraklayıp sürdürürse (Ayşe henüz konuşmadan): iki söz iki ASR, ama TEK birleşik tur ve tek cevap', async () => {
    const s = sahne()
    let birak: () => void = () => {}
    asrKuyrugu = ['Ben de iyiyim.', 'Bir kahve içelim mi sizinle bugün?']
    yanit = { metin: '', bekle: new Promise<void>((r) => { birak = r }) }
    const t = await oturumKur(s)
    try {
      t.konus()
      await bekle(() => cevapCagrilari() === 1, 3000, 'ilk parça modele gitti')
      yanit = { metin: JSON.stringify({ speech: 'Çok naziksiniz Hocam.' }) }
      t.konus()
      await bekle(() => !t.fo.turSuruyor() && t.fish.soylenen.length === 1, 3000, 'birleşik tur bitti')
      assert.equal(asrIstekleri.length, 2)
      assert.deepEqual(t.kayit.soz, [{ metin: 'Ben de iyiyim.' }, { metin: 'Ben de iyiyim. Bir kahve içelim mi sizinle bugün?', yerine: 'Ben de iyiyim.' }])
      assert.deepEqual(t.fish.soylenen, ['Çok naziksiniz Hocam.'], 'yalnız birleşik sözün cevabı konuşulur')
      const m = oturumSatiri(s.oturum).messages as { role: string; content: string }[]
      assert.deepEqual(m.filter((x) => x.role === 'user').map((x) => x.content), ['Ben de iyiyim. Bir kahve içelim mi sizinle bugün?'], 'bırakılan yarım söz oturuma yazılmaz')
    } finally { birak(); t.fo.kapat() }
  })

  it('istemci de bırakır: yeni söz gelince önceki tur isteğinin sinyali iptal edilir', async () => {
    const s = sahne()
    const sinyaller: { metin: string; sinyal: AbortSignal }[] = []
    const sahteIstek: TurIstegi = (g) => ({
      async *[Symbol.asyncIterator]() {
        sinyaller.push({ metin: g.metin, sinyal: g.sinyal })
        await new Promise((r) => g.sinyal.addEventListener('abort', r, { once: true }))
      },
    })
    asrKuyrugu = ['Ben de iyiyim.', 'Bir kahve içelim mi?']
    const t = await oturumKur(s, { turIstegi: sahteIstek })
    try {
      t.konus()
      await bekle(() => sinyaller.length === 1, 1000)
      t.konus()
      await bekle(() => sinyaller.length === 2, 1000)
      assert.equal(sinyaller[0].sinyal.aborted, true, 'önceki istek bırakıldı')
      assert.equal(sinyaller[1].sinyal.aborted, false)
      assert.equal(sinyaller[1].metin, 'Ben de iyiyim. Bir kahve içelim mi?')
    } finally { t.fo.kapat() }
  })

  it('ASR sonuçları söz sırasıyla işlenir: ikinci sözün dökümü önce dönse de birleşik söz A + B', async () => {
    const s = sahne()
    const bekleyen: { coz: (m: string) => void }[] = []
    const dinle: DinlemeIstegi = () => new Promise((coz) => { bekleyen.push({ coz: (metin) => coz({ metin }) }) })
    const metinler: string[] = []
    const sahteIstek: TurIstegi = (g) => ({
      async *[Symbol.asyncIterator]() {
        metinler.push(g.metin)
        await new Promise((r) => g.sinyal.addEventListener('abort', r, { once: true }))
      },
    })
    const t = await oturumKur(s, { dinle, turIstegi: sahteIstek })
    try {
      t.konus()
      t.konus()
      assert.equal(bekleyen.length, 2)
      assert.equal(t.fo.dinlemeSuruyor(), true)
      bekleyen[1].coz('sonra söylenen')
      await new Promise((r) => setTimeout(r, 10))
      assert.equal(t.kayit.soz.length, 0, 'ilk sözün dökümü gelmeden ikinci işlenmez')
      bekleyen[0].coz('önce söylenen')
      await bekle(() => metinler.length === 2, 1000)
      assert.deepEqual(t.kayit.soz.map((x) => x.metin), ['önce söylenen', 'önce söylenen sonra söylenen'])
      assert.equal(t.fo.dinlemeSuruyor(), false)
    } finally { t.fo.kapat() }
  })

  it('Fish ASR hatası: tur açılmaz, yeniden denenmez, başka satıcıya düşülmez, hata görünür; doktor tekrar söyleyince yürür', async () => {
    const s = sahne()
    asrDavranis = () => new Response('aşırı yük', { status: 503 })
    const t = await oturumKur(s)
    try {
      t.konus()
      await bekle(() => t.kayit.hata.length === 1, 3000, 'hata')
      assert.deepEqual(t.kayit.hata, [F.DINLEME_HATASI])
      assert.equal(asrIstekleri.length, 1, 'tek deneme')
      assert.equal(cevapCagrilari(), 0)
      assert.deepEqual(t.kayit.soz, [])
      assert.deepEqual(fishDisi(), [], 'yedek satıcı yok')
      asrDavranis = null
      asrKuyrugu = ['Tekrar söylüyorum Hocam.']
      yanit = { metin: JSON.stringify({ speech: 'Buyurun Hocam.' }) }
      t.konus()
      await bekle(() => t.fish.soylenen.includes('Buyurun Hocam.') && !t.fo.turSuruyor(), 3000, 'ikinci deneme')
      assert.equal(cevapCagrilari(), 1)
    } finally { t.fo.kapat() }
  })

  it('boş döküm (gürültü) ve Ayşe\'nin kendi selamı tur açmaz; "asistanı kapat" modele gitmez', async () => {
    const s = sahne()
    asrKuyrugu = ['   ', 'Merhaba Hocam. Nasıl yardımcı olabilirim?', 'Asistanı kapat']
    const t = await oturumKur(s)
    try {
      t.konus(); t.konus(); t.konus()
      await bekle(() => t.kayit.kapat === 1, 3000, 'kapat')
      assert.equal(cevapCagrilari(), 0)
      assert.deepEqual(t.kayit.soz.map((x) => x.metin), ['Asistanı kapat'])
      assert.equal(t.kayit.hata.length, 0)
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
  it('Fish çalarken: yankı artığı VAD\'a gitmez; doktor araya girince Fish susar, akan tur iptal, sözün başı WAV\'da, yeni söz işlenir', async () => {
    const s = sahne()
    let birak: () => void = () => {}
    asrKuyrugu = ['Bir kahve içelim mi sizinle bugün?', 'Peki çay olur mu?']
    yanit = { metin: '{"speech":"Kahve molası güzel fikir. Bir', bekle: new Promise<void>((r) => { birak = r }), kuyruk: ' de çay."}' }
    const sayac = { n: 0, wavlar: [] as ArrayBuffer[] }
    const t = await oturumKur(s, { dinleSayac: sayac })
    try {
      t.konus()
      await bekle(() => t.fish.soylenen.length === 1, 3000, 'ilk cümle Fish\'te')
      t.fo.fishBasladi()
      assert.equal(t.fo.turSuruyor(), true, 'model hâlâ yazıyor')
      t.mik.ver(0.05, 30) // yankı artığı: söz eşiğinin üstünde, söz kesme eşiğinin altında
      assert.equal(t.fo.dinlemeSuruyor(), false, 'Fish duyulurken mikrofon söz algılayıcıya gitmez')
      assert.equal(sayac.n, 1)
      assert.equal(t.fish.kesildi, 0)
      const kesmeKare = Math.ceil(F.KESME_SURE_MS / 20)
      t.mik.ver(KONUSMA, kesmeKare) // doktor konuşuyor
      assert.equal(t.fish.kesildi, 1, 'Fish anında susar')
      assert.equal(t.fo.yankiKapisiKapali(), false, 'kapı açıldı')
      assert.equal(t.fo.turSuruyor(), false)
      assert.equal(t.fo.dinlemeSuruyor(), true, 'ön kayıt söz algılayıcıya verildi — söz başladı')
      yanit = { metin: JSON.stringify({ speech: 'Çay da olur Hocam.' }) }
      t.konus(20)
      await bekle(() => sayac.n === 2, 3000, 'ikinci ASR')
      const onKayitKare = F.ON_KAYIT_MS / 20
      assert.ok(sayac.wavlar[1].byteLength >= 44 + (onKayitKare + 20) * CERCEVE_BAYT, 'sözün başı (500 ms ön kayıt) WAV\'da')
      await bekle(() => t.fish.soylenen.includes('Çay da olur Hocam.') && !t.fo.turSuruyor(), 3000, 'yeni tur')
      assert.equal(cevapCagrilari(), 2, 'kesilen tur + yeni tur; kesilen tur yeniden denenmedi')
      const m = oturumSatiri(s.oturum).messages as { role: string; content: string }[]
      assert.deepEqual(m.filter((x) => x.role === 'user').map((x) => x.content), ['Peki çay olur mu?'], 'kesilen tur oturuma yazılmadı')
      assert.equal(t.kayit.hata.length, 0)
    } finally { birak(); t.fo.kapat() }
  })

  it('yankı kapısı: Fish sustuktan sonra YANKI_KUYRUK_MS boyunca da kapalı; kapalıyken gelen ses WAV\'a hiç girmez', async () => {
    const s = sahne()
    let saat = 1_000_000
    asrKuyrugu = ['Umutcan kaç kilo?']
    const sayac = { n: 0, wavlar: [] as ArrayBuffer[] }
    const t = await oturumKur(s, { simdi: () => saat, dinleSayac: sayac })
    try {
      t.fo.soyle('Merhaba Hocam. Nasıl yardımcı olabilirim?')
      t.fo.fishBasladi()
      assert.equal(t.fo.yankiKapisiKapali(), true)
      t.mik.ver(0.05, 10)
      t.fish.bitir()
      saat += F.YANKI_KUYRUK_MS - 50
      t.mik.ver(0.05, 5)
      assert.equal(t.fo.yankiKapisiKapali(), true, 'oda yankısı kuyruğu')
      assert.equal(t.fo.dinlemeSuruyor(), false)
      saat += 100
      assert.equal(t.fo.yankiKapisiKapali(), false)
      t.konus(20)
      await bekle(() => sayac.n === 1, 3000, 'ASR')
      const kuyrukKare = SESSIZLIK_KARE() - Math.floor((V.SOZ_SONU_SESSIZLIK_MS - V.SOZ_KUYRUK_MS) / 20)
      assert.equal(sayac.wavlar[0].byteLength, 44 + (20 + kuyrukKare) * CERCEVE_BAYT, 'yalnız kapı açıldıktan sonraki ses — Fish yankısı taşıyan ön kayıt atıldı')
      assert.equal(t.fish.kesildi, 0, 'eşik altı ses Fish\'i kesmez')
    } finally { t.fo.kapat() }
  })

  it('NOTYA-SES-DEVAM-01: gizli [devam] turu doktor konuşurken ya da sözü yazıya dökülürken gönderilmez', async () => {
    const s = sahne()
    let coz: (m: { metin: string }) => void = () => {}
    const dinle: DinlemeIstegi = () => new Promise((c) => { coz = c })
    const t = await oturumKur(s, { dinle, turIstegi: () => ({ async *[Symbol.asyncIterator]() { /* boş tur */ } }) })
    try {
      t.mik.ver(KONUSMA, 20)
      assert.equal(t.fo.gizliTur('[devam]'), false, 'doktor konuşuyor')
      t.mik.ver(SESSIZ, SESSIZLIK_KARE())
      assert.equal(t.fo.dinlemeSuruyor(), true)
      assert.equal(t.fo.gizliTur('[devam]'), false, 'döküm bekleniyor')
      coz({ metin: '' })
      await bekle(() => !t.fo.dinlemeSuruyor(), 1000)
      assert.equal(t.fo.gizliTur('[devam]'), true)
    } finally { t.fo.kapat() }
  })
})

describe('5. Persona geçişi ve oturum kapanışı', () => {
  it('fish-oturum: yalnız aysekaya; başka satıcı anahtarı yok; ortak oturum; yabancı oturum/hasta taşınmaz; Fish anahtarı yoksa fish:false', async () => {
    const s = sahne()
    const al = async (q: string, token = s.doktor.token) => {
      const y: Response = await R.fishOturum.GET(istek(`/api/asistan/fish-oturum?${q}`, token, 'GET'))
      return { status: y.status, j: await y.json() }
    }
    const baska = await al('persona=mehmetdemir')
    assert.deepEqual(baska.j, { fish: false })
    const oturumSayisi = db.tablo('asistan_sessions').length
    const a = await al(`persona=aysekaya&asistanSessionId=${s.oturum}`)
    assert.deepEqual(Object.keys(a.j).sort(), ['asistan_session_id', 'baslangic', 'fish'], 'yanıtta başka satıcı anahtarı / URL yok')
    assert.equal(a.j.fish, true)
    assert.equal(a.j.asistan_session_id, s.oturum, 'ortak oturum yeniden kullanılır (yazı + ses tek konuşma)')
    assert.equal(db.tablo('asistan_sessions').length, oturumSayisi)
    const yabanci = await al(`persona=aysekaya&asistanSessionId=${s.oturum}&patientId=${s.hasta}`, s.diger.token)
    assert.equal(yabanci.j.fish, true)
    assert.notEqual(yabanci.j.asistan_session_id, s.oturum)
    const yeni = oturumSatiri(yabanci.j.asistan_session_id)
    assert.equal(yeni.doctor_id, s.diger.id)
    assert.equal(yeni.patient_id ?? null, null, 'başka doktorun hastası yeni oturuma yazılmaz')
    assert.equal((oturumSatiri(s.oturum).messages as unknown[]).length, 0, 'A\'nın oturumu değişmedi')
    assert.equal(disIstekler.length, 0)
    const eski = process.env.FISH_API_KEY
    delete process.env.FISH_API_KEY
    try { assert.deepEqual((await al('persona=aysekaya')).j, { fish: false }) } finally { process.env.FISH_API_KEY = eski }
    assert.equal(F.sesHattiSec('aysekaya'), 'fish')
    assert.equal(F.sesHattiSec('mehmetdemir'), 'elevenlabs')
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

  it('Fish oturumu kapanışı: çift kapat güvenli; mikrofon, bekleyen ASR, akan tur, Fish — bir kez; kapandıktan sonra tur yok', async () => {
    const s = sahne()
    let birak: () => void = () => {}
    yanit = { metin: '', bekle: new Promise<void>((r) => { birak = r }) }
    asrKuyrugu = ['Bir soru?']
    const sayac = { n: 0 }
    let asrSinyali: AbortSignal | null = null
    let asrCoz: (m: { metin: string }) => void = () => {}
    let ilk = true
    const dinle: DinlemeIstegi = async (g) => {
      if (ilk) { ilk = false; return rotaDinle(s)(g) }
      asrSinyali = g.sinyal
      return new Promise((c) => { asrCoz = c })
    }
    const t = await oturumKur(s, { dinle, turIstegi: rotaIstegi(s, sayac) })
    try {
      t.konus()
      await bekle(() => cevapCagrilari() === 1, 3000)
      t.konus()
      await bekle(() => asrSinyali !== null, 1000, 'ikinci ASR bekliyor')
      t.fo.kapat()
      t.fo.kapat()
      assert.equal(t.mik.durdu, 1)
      assert.equal(t.fish.kapandi, 1)
      assert.equal(t.fo.turSuruyor(), false)
      assert.equal(asrSinyali!.aborted, true, 'bekleyen ASR bırakıldı')
      assert.equal(t.fo.dinlemeSuruyor(), false)
      const durumlar = t.kayit.durum.length
      asrCoz({ metin: 'Kapandıktan sonra gelen döküm' })
      t.fo.fishBasladi()
      t.konus()
      await new Promise((r) => setTimeout(r, 30))
      assert.equal(t.kayit.durum.length, durumlar)
      assert.equal(sayac.n, 1, 'kapandıktan sonra tur açılmaz')
      assert.deepEqual(t.kayit.soz.map((x) => x.metin), ['Bir soru?'])
      assert.equal(t.fo.gizliTur('[devam]'), false)
    } finally { birak(); t.fo.kapat() }
  })

  it('istemci kod yolu: Ayşe yalnız Fish — Conversation.startSession / imzalı URL / ElevenLabs yedeği yok; hiçbir dosyada Deepgram yok', () => {
    const kok = join(__dirname, '../..')
    const ctx = readFileSync(join(kok, 'components/asistan/AsistanOturumContext.tsx'), 'utf8')
    const fishBas = ctx.indexOf('async function fishIleBasla(')
    const fishSon = ctx.indexOf('async function startConversationWithoutFirstMessage(')
    assert.ok(fishBas > 0 && fishSon > fishBas)
    const govde = ctx.slice(fishBas, fishSon)
    for (const yasak of ['Conversation.', 'signed-url', 'fetchSignedUrl', 'startConversationWithoutFirstMessage(', 'setVolume', 'return false', 'elevenlabs']) {
      assert.ok(!govde.includes(yasak), `fishIleBasla içinde ${yasak} var`)
    }
    const baslat = ctx.slice(ctx.indexOf('async function startConversation()'), fishBas)
    const fishCagri = baslat.indexOf('await fishIleBasla(')
    assert.ok(fishCagri > 0 && fishCagri < baslat.indexOf('fetchSignedUrl(p, sayfaHastasi)'), 'Fish yolu imzalı URL isteğinden ÖNCE döner')
    assert.match(baslat, /if \(sesHattiSec\(p\.id\) === "fish"\) \{ await fishIleBasla\([^)]*\); return \}/, 'Ayşe için koşulsuz dönüş — Fish açılamazsa ElevenLabs\'e düşülmez')
    assert.ok(!ctx.includes('setVolume'), 'ElevenLabs yolunda Fish için susturma kalmadı')
    const fishDosyalari = [
      'lib/asistan/fishOturumu.ts', 'lib/asistan/fishTarayici.ts', 'lib/asistan/sozAlgilayici.ts', 'lib/asistan/fishSes.ts',
      'lib/asistan/fishMaliyet.ts', 'lib/asistan/sesKullanim.ts', 'lib/asistan/turKilidi.ts', 'lib/asistan/sesTuru.ts',
      'app/api/asistan/fish-dinle/route.ts', 'app/api/asistan/fish-tur/route.ts', 'app/api/asistan/fish-oturum/route.ts',
      'app/api/asistan/fish-ses/route.ts', 'app/api/asistan/ses-kullanim/route.ts', 'public/ses/mikrofon-islemcisi.js',
      'lib/db/migrations/110_ses_kullanim.sql', 'scripts/fish-maliyet.mts', 'components/asistan/AsistanOturumContext.tsx',
    ]
    for (const f of fishDosyalari) {
      const k = readFileSync(join(kok, f), 'utf8')
      assert.ok(!/deepgram/i.test(k), `${f} Deepgram'a atıf yapıyor`)
      if (f !== 'components/asistan/AsistanOturumContext.tsx') assert.ok(!/@elevenlabs|api\.elevenlabs\.io|AsistanConversation/.test(k), `${f} ElevenLabs'e bağlı`)
    }
    assert.throws(() => readFileSync(join(kok, 'lib/asistan/canliDinleme.ts')), 'Deepgram tur algılayıcısı kaldırıldı')
    const imzali = readFileSync(join(kok, 'app/api/asistan/signed-url/route.ts'), 'utf8')
    assert.ok(!/fish/i.test(imzali), 'ElevenLabs imzalı URL yanıtında Fish bayrağı kalmadı')
  })
})

describe('6. Kullanım ve gecikme sayaçları — maliyet ve "doğal konuşma" ölçüsünün girdisi', () => {
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


  it('fish-dinle: Fish ASR saniyesi (yukarı yuvarlanmış) + asr_ms kendi oturumuna; yabancı oturum 404 ve Fish çağrılmaz; bozuk girdi Fish\'e gitmez', async () => {
    const s = sahne()
    asrKuyrugu = ['  Umutcan   kaç kilo?  ']
    const wav = new Uint8Array(44 + 32_000)
    const y = await dinlePost(s, wav)
    assert.equal(y.status, 200)
    const j = await y.json() as { metin: string; sure: number }
    assert.equal(j.metin, 'Umutcan kaç kilo?')
    assert.equal(j.sure, 1.3)
    assert.equal(asrIstekleri.length, 1)
    assert.equal(asrIstekleri[0].ses?.size, wav.byteLength)
    await bekle(() => db.tablo('ses_kullanim').length === 2, 1000, 'sayaç')
    const asr = db.tablo('ses_kullanim').find((r) => r.kaynak === 'fish_asr')!
    assert.deepEqual([asr.olcu, asr.miktar, asr.model, asr.asistan_session_id, asr.doctor_id], ['ses_saniye', 2, 'transcribe-1', s.oturum, s.doktor.id])
    const gec = db.tablo('ses_kullanim').find((r) => r.kaynak === 'gecikme')!
    assert.equal(gec.olcu, 'asr_ms')
    assert.ok(gec.miktar >= 0)

    const yabanci = await dinlePost(s, wav, { oturum: s.digerOturum })
    assert.equal(yabanci.status, 404)
    assert.equal((await dinlePost(s, wav, { oturum: randomUUID() })).status, 404)
    assert.equal((await dinlePost(s, new Uint8Array(44))).status, 400, 'boş WAV')
    const buyuk = await R.fishDinle.POST(new NextRequestSinifi(`http://localhost/api/asistan/fish-dinle?asistanSessionId=${s.oturum}`, {
      method: 'POST', headers: { authorization: `Bearer ${s.doktor.token}`, 'content-type': 'audio/wav', 'content-length': String(3 * 1024 * 1024) }, body: new Uint8Array(10),
    } as ConstructorParameters<typeof NextRequestSinifi>[1])) as Response
    assert.equal(buyuk.status, 413)
    assert.equal((await R.fishDinle.POST(new NextRequestSinifi(`http://localhost/api/asistan/fish-dinle?asistanSessionId=${s.oturum}`, { method: 'POST', body: wav } as ConstructorParameters<typeof NextRequestSinifi>[1]))).status, 401)
    assert.equal(asrIstekleri.length, 1, 'yabancı / bozuk / yetkisiz istek Fish\'e hiç gitmedi')
    assert.equal(db.tablo('ses_kullanim').filter((r) => r.asistan_session_id !== s.oturum).length, 0)

    asrDavranis = () => new Response(JSON.stringify({ beklenmeyen: true }), { status: 200 })
    assert.equal((await dinlePost(s, wav)).status, 502, 'beklenmeyen Fish yanıtı tur açmaz')
    asrDavranis = () => new Response('ödeme', { status: 402 })
    assert.equal((await dinlePost(s, wav)).status, 502)
    const eski = process.env.FISH_API_KEY
    delete process.env.FISH_API_KEY
    try { assert.equal((await dinlePost(s, wav)).status, 409) } finally { process.env.FISH_API_KEY = eski }
    assert.deepEqual(fishDisi(), [], 'Fish hatasında başka satıcı çağrılmadı')
  })

  it('ses-kullanim: yalnız tarayıcının ölçebildiği sayılar (görüşme süresi, tur gecikmeleri); Fish bayt/saniye ve sunucu gecikmeleri reddedilir; yabancı oturum 404', async () => {
    const s = sahne()
    const gonder = (oturum: string, satirlar: unknown) => R.sesKullanim.POST(istek('/api/asistan/ses-kullanim', s.doktor.token, 'POST', { asistanSessionId: oturum, satirlar })) as Promise<Response>
    const y = await gonder(s.oturum, [
      { kaynak: 'oturum', olcu: 'oturum_saniye', miktar: 60 },
      { kaynak: 'gecikme', olcu: 'toplam_ms', miktar: 2150 },
      { kaynak: 'gecikme', olcu: 'dinle_ms', miktar: 640 },
      { kaynak: 'gecikme', olcu: 'asr_ms', miktar: 1 },
      { kaynak: 'fish', olcu: 'utf8_bayt', miktar: 100 },
      { kaynak: 'fish_asr', olcu: 'ses_saniye', miktar: 5 },
      { kaynak: 'deepgram', olcu: 'ses_saniye', miktar: 42.5 },
      { kaynak: 'gecikme', olcu: 'toplam_ms', miktar: 1e9 },
      { kaynak: 'oturum', olcu: 'oturum_saniye', miktar: -1 },
      { kaynak: 'gecikme', olcu: 'bilinmeyen', miktar: 3 },
    ])
    assert.equal(y.status, 200)
    assert.deepEqual(db.tablo('ses_kullanim').map((r) => [r.olcu, r.miktar]), [['oturum_saniye', 60], ['toplam_ms', 2150], ['dinle_ms', 640]])
    const yabanci = await gonder(s.digerOturum, [{ kaynak: 'oturum', olcu: 'oturum_saniye', miktar: 5 }])
    assert.equal(yabanci.status, 404)
    assert.equal(db.tablo('ses_kullanim').length, 3)
  })

  it('fish-tur: istek → ilk cümle (ilk_soz_ms) tur başına BİR kez yazılır — aynı nonce tekrarında yeniden yazılmaz', async () => {
    const s = sahne()
    yanit = { metin: JSON.stringify({ speech: 'Bir. İki.' }) }
    const nonce = `qa-${randomUUID()}`
    await olaylar(await turPost(s, { metin: 'Soru?', nonce }))
    await olaylar(await turPost(s, { metin: 'Soru?', nonce }))
    await bekle(() => db.tablo('ses_kullanim').some((r) => r.olcu === 'ilk_soz_ms'), 1000, 'ilk_soz_ms')
    await new Promise((r) => setTimeout(r, 20))
    const satirlar = db.tablo('ses_kullanim').filter((r) => r.olcu === 'ilk_soz_ms')
    assert.equal(satirlar.length, 1)
    assert.equal(satirlar[0].kaynak, 'gecikme')
    assert.equal(satirlar[0].asistan_session_id, s.oturum)
  })

  it('FishOturumu aşama gecikmesi: son ses → söz sonu → ASR → ilk cümle → Fish sesi; toplam = aşamaların toplamı; tur başına bir rapor', async () => {
    const s = sahne()
    let saat = 10_000
    const dinle: DinlemeIstegi = async () => { saat += 700; return { metin: 'Ateş kaç derece?' } }
    const turIstegi: TurIstegi = () => ({
      async *[Symbol.asyncIterator]() {
        saat += 900
        yield { t: 'soz', metin: 'Otuz sekiz buçuk Hocam.' } as const
        yield { t: 'bitti', iptal: false } as const
      },
    })
    const t = await oturumKur(s, { dinle, turIstegi, simdi: () => saat })
    try {
      const ver = (rms: number, n: number) => { for (let i = 0; i < n; i++) { saat += 20; t.mik.ver(rms, 1) } }
      ver(KONUSMA, 20)
      ver(SESSIZ, SESSIZLIK_KARE())
      await bekle(() => t.fish.soylenen.length === 1 && !t.fo.turSuruyor(), 1000, 'tur')
      assert.equal(t.kayit.gecikme.length, 0, 'Fish sesi duyulmadan rapor yok')
      saat += 300
      t.fo.fishBasladi()
      t.fo.fishBasladi()
      assert.deepEqual(t.kayit.gecikme, [{ sozSonuMs: V.SOZ_SONU_SESSIZLIK_MS, dinleMs: 700, ilkSozMs: 900, ilkSesMs: 300, toplamMs: V.SOZ_SONU_SESSIZLIK_MS + 700 + 900 + 300 }])
    } finally { t.fo.kapat() }
  })
})
