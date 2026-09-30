/**
 * NOTYA-FISH-LATENCY-01 — Fish latency measurement (run from a machine that can reach api.fish.audio).
 *
 *   npx tsx scripts/fish-olcum.mts            # reads FISH_API_KEY from .env.local
 *
 * (a) ASR: one 2 s Turkish WAV (made once via Fish TTS) sent 5× cold (fresh agent each time) and
 *     5× on the keep-alive agent → median asr_latency_ms.
 * (b) TTS: a 3-sentence Turkish paragraph — REST per sentence (time-to-first-audio per sentence,
 *     sequential like the old client) vs one live socket (TTFA, and the gap between the end of
 *     sentence N's audio and the start of N+1's, measured in audio-time vs arrival-time).
 * (c) End-to-end simulated turn: ASR of the fixture + TTS of the paragraph, REST vs WS.
 * Budget: 1 (fixture) + 10 (ASR) + 3×2 REST + 2 WS + 2 e2e ≈ 21 Fish calls (≤ 40).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { Agent, fetch as undiciFetch } from 'undici'
import WebSocket from 'ws'
import { fishAsrGovde, fishIstegi, FISH_ASR_MODEL, FISH_ORNEK_HZ } from '../lib/asistan/fishSes'
import { FISH_WS_DUR, FISH_WS_URL, fishWsBaslangic, fishWsKodla, fishWsMetinOlayi, fishWsModel, fishWsOlayCoz } from '../lib/asistan/fishWs'

function envOku(): string {
  if (process.env.FISH_API_KEY) return process.env.FISH_API_KEY
  const yol = join(process.cwd(), '.env.local')
  if (!existsSync(yol)) return ''
  const m = readFileSync(yol, 'utf8').match(/^FISH_API_KEY=(.+)$/m)
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''
}

const ANAHTAR = envOku()
if (!ANAHTAR) {
  console.error('FISH_API_KEY yok (.env.local) — ölçüm yapılmadı.')
  process.exit(2)
}

const CUMLELER = [
  'Merhaba Hocam, bugün üç hastanız var.',
  'İlk hasta saat onda geliyor ve kontrol muayenesi.',
  'İkinci hastanın tahlil sonuçları dosyasına düştü.',
]
const FIXTURE_METNI = 'Merhaba Hocam, bugün üç hastanız var.'
const FIXTURE = join(process.cwd(), 'scripts', '_fish-olcum-fixture.wav')

const medyan = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN }
const ms = () => performance.now()
let cagri = 0

function wavYaz(pcm: Uint8Array, hz: number): Uint8Array {
  const n = pcm.byteLength
  const b = new Uint8Array(44 + n)
  const v = new DataView(b.buffer)
  const yaz = (o: number, s: string) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i) }
  yaz(0, 'RIFF'); v.setUint32(4, 36 + n, true); yaz(8, 'WAVE'); yaz(12, 'fmt '); v.setUint32(16, 16, true)
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, hz, true); v.setUint32(28, hz * 2, true)
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); yaz(36, 'data'); v.setUint32(40, n, true)
  b.set(pcm, 44)
  return b
}

async function restTts(metin: string, ajan: Agent): Promise<{ ttfa: number; toplam: number; pcm: Uint8Array }> {
  const istek = fishIstegi(metin)!
  cagri += 1
  const t0 = ms()
  const r = await undiciFetch('https://api.fish.audio/v1/tts', {
    method: 'POST', dispatcher: ajan,
    headers: { Authorization: `Bearer ${ANAHTAR}`, 'Content-Type': 'application/json', model: istek.model },
    body: JSON.stringify(istek.govde),
  })
  if (!r.ok || !r.body) throw new Error(`tts http_${r.status}`)
  const parcalar: Uint8Array[] = []
  let ttfa = 0
  for await (const p of r.body as AsyncIterable<Uint8Array>) {
    if (!ttfa && p.byteLength) ttfa = ms() - t0
    parcalar.push(p)
  }
  const n = parcalar.reduce((s, x) => s + x.byteLength, 0)
  const pcm = new Uint8Array(n)
  let i = 0
  for (const p of parcalar) { pcm.set(p, i); i += p.byteLength }
  return { ttfa, toplam: ms() - t0, pcm }
}

async function asr(wav: Uint8Array, ajan: Agent): Promise<number> {
  cagri += 1
  const t0 = ms()
  const r = await undiciFetch('https://api.fish.audio/v1/asr', {
    method: 'POST', dispatcher: ajan,
    headers: { Authorization: `Bearer ${ANAHTAR}`, model: FISH_ASR_MODEL, 'Content-Type': 'application/msgpack' },
    body: Buffer.from(fishAsrGovde(wav)),
  })
  const j = (await r.json().catch(() => null)) as { text?: string } | null
  const sure = ms() - t0
  if (!r.ok) throw new Error(`asr http_${r.status}`)
  console.info('   asr →', JSON.stringify(j?.text || '').slice(0, 60), Math.round(sure), 'ms')
  return sure
}

/** One socket, sentences fed back to back (as fish-tur does), audio timeline reconstructed. */
async function wsTts(cumleler: string[]): Promise<{ ttfa: number; toplam: number; bosluklar: number[]; bayt: number }> {
  cagri += 1
  const t0 = ms()
  return new Promise((coz, reddet) => {
    const ws = new WebSocket(FISH_WS_URL, { headers: { Authorization: `Bearer ${ANAHTAR}`, model: fishWsModel() }, perMessageDeflate: false })
    ws.binaryType = 'nodebuffer'
    let ttfa = 0
    let bayt = 0
    // Arrival-time vs audio-time: a gap is when the audio already delivered would have run out before the next chunk came.
    let sesSonu = 0 // ms of audio delivered, on the arrival clock (starts at first chunk)
    let ilkVaris = 0
    const bosluklar: number[] = []
    const zaman = setTimeout(() => { ws.terminate(); reddet(new Error('ws zaman')) }, 40_000)
    ws.on('open', () => {
      ws.send(fishWsKodla(fishWsBaslangic()), { binary: true })
      for (const c of cumleler) { const o = fishWsMetinOlayi(c); if (o) ws.send(fishWsKodla(o), { binary: true }) }
      ws.send(fishWsKodla(FISH_WS_DUR), { binary: true })
    })
    ws.on('message', (veri) => {
      const ham = Buffer.isBuffer(veri) ? new Uint8Array(veri.buffer, veri.byteOffset, veri.byteLength) : new Uint8Array(veri as ArrayBuffer)
      const olay = fishWsOlayCoz(ham)
      if (olay.tur === 'audio' && olay.ses.byteLength) {
        const simdi = ms()
        if (!ttfa) { ttfa = simdi - t0; ilkVaris = simdi; sesSonu = 0 }
        const varis = simdi - ilkVaris
        if (varis > sesSonu + 120) bosluklar.push(Math.round(varis - sesSonu - 120)) // beyond the client's 120 ms jitter buffer
        sesSonu = Math.max(sesSonu, varis) + (olay.ses.byteLength / 2 / FISH_ORNEK_HZ) * 1000
        bayt += olay.ses.byteLength
      } else if (olay.tur === 'finish') {
        clearTimeout(zaman)
        ws.close()
        coz({ ttfa, toplam: ms() - t0, bosluklar, bayt })
      }
    })
    ws.on('error', (e) => { clearTimeout(zaman); reddet(e) })
    ws.on('unexpected-response', (_r, res) => { clearTimeout(zaman); reddet(new Error(`ws http_${res.statusCode}`)) })
  })
}

async function main() {
  const sicak = new Agent({ keepAliveTimeout: 60_000, keepAliveMaxTimeout: 120_000, connections: 4, pipelining: 1 })
  const soguk = () => new Agent({ keepAliveTimeout: 1, connections: 1 })

  // fixture
  let wav: Uint8Array
  if (existsSync(FIXTURE)) wav = new Uint8Array(readFileSync(FIXTURE))
  else {
    console.info('1) fixture WAV via Fish TTS…')
    const r = await restTts(FIXTURE_METNI, sicak)
    wav = wavYaz(r.pcm, FISH_ORNEK_HZ)
    writeFileSync(FIXTURE, wav)
  }
  console.info(`   fixture: ${Math.round((wav.byteLength - 44) / 2 / FISH_ORNEK_HZ * 1000)} ms, ${wav.byteLength} B`)

  console.info('2) ASR ×5 cold (new agent per call) vs ×5 keep-alive')
  const asrSoguk: number[] = []
  for (let i = 0; i < 5; i++) asrSoguk.push(await asr(wav, soguk()))
  const asrSicak: number[] = []
  for (let i = 0; i < 5; i++) asrSicak.push(await asr(wav, sicak))
  console.info(`   ASR median: cold ${Math.round(medyan(asrSoguk))} ms → keep-alive ${Math.round(medyan(asrSicak))} ms`)

  console.info('3) TTS REST per sentence (sequential, like the old client) ×2 runs')
  const restTtfa: number[][] = []
  const restBoslukSim: number[] = []
  for (let k = 0; k < 2; k++) {
    const satir: number[] = []
    let onceki: { toplam: number; pcm: Uint8Array } | null = null
    for (const c of CUMLELER) {
      const r = await restTts(c, sicak)
      satir.push(Math.round(r.ttfa))
      // Old client fetched N+1 only when N was queued for play: the audible gap ≈ TTFA(N+1) minus whatever of N was still playing after its download.
      if (onceki) {
        const kalanCalma = (onceki.pcm.byteLength / 2 / FISH_ORNEK_HZ) * 1000 - onceki.toplam
        restBoslukSim.push(Math.max(0, Math.round(r.ttfa - Math.max(0, kalanCalma))))
      }
      onceki = r
    }
    restTtfa.push(satir)
  }
  console.info(`   REST TTFA per sentence (ms): ${JSON.stringify(restTtfa)}; simulated inter-sentence gap median ${medyan(restBoslukSim)} ms`)

  console.info('4) TTS WebSocket, one socket, 3 sentences ×2 runs')
  const wsSonuc = [await wsTts(CUMLELER), await wsTts(CUMLELER)]
  for (const w of wsSonuc) console.info(`   WS TTFA ${Math.round(w.ttfa)} ms, total ${Math.round(w.toplam)} ms, audio ${Math.round(w.bayt / 2 / FISH_ORNEK_HZ * 1000)} ms, gaps>120ms buffer: ${JSON.stringify(w.bosluklar)}`)

  console.info('5) end-to-end simulated turn (ASR + TTS of the paragraph, LLM excluded): REST vs WS')
  const e2eRest = ms(); await asr(wav, sicak); const r1 = await restTts(CUMLELER[0], sicak); const e2eRestTtfa = ms() - e2eRest - (r1.toplam - r1.ttfa)
  const e2eWs = ms(); await asr(wav, sicak); const w1 = await wsTts(CUMLELER); const e2eWsTtfa = ms() - e2eWs - (w1.toplam - w1.ttfa)
  console.info(`   e2e to first audio: REST ${Math.round(e2eRestTtfa)} ms vs WS ${Math.round(e2eWsTtfa)} ms`)
  console.info(`Fish API calls used: ${cagri}`)
  await sicak.close()
}

main().catch((e) => { console.error('ölçüm hatası:', e instanceof Error ? e.message : e); process.exit(1) })
