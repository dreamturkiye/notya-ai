/**
 * NOTYA-UZ-MUAYENE-01 — STAND-IN PROVIDERS for the walk-through (./yuruyus.mjs). Loaded INTO the server process:
 *
 *   NODE_OPTIONS="--require <repo>/scripts/ulke-yuruyus/sahte-saglayicilar.cjs" npx next start -p 3111
 *
 * It replaces the server's `fetch` before the application loads, so that
 *   - speech recognition (api.elevenlabs.io/v1/speech-to-text) and
 *   - the note model (openrouter.ai/api/v1/chat/completions)
 * are answered here, in this process, with synthetic text. NOTHING is sent to either provider: no audio, no
 * transcript, no note. Requests to this machine (the stand-in Supabase) pass through. Every other address is
 * refused and logged as REFUSED — the walk-through fails if one appears.
 *
 * Never part of a build and never loaded in a deployment: it exists only on the command line above.
 *
 * Scenario and log are two files, because the command above starts more than one process:
 *   <dir>/senaryo.json     { "stt": "yuksek" | "dusuk" }       written by the walk-through before a visit
 *   <dir>/cagrilar.jsonl   one line per provider call           read by the walk-through
 * <dir> = $YURUYUS_DIZIN or <os tmp>/notya-yuruyus.
 */
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const DIZIN = process.env.YURUYUS_DIZIN || path.join(os.tmpdir(), 'notya-yuruyus')
fs.mkdirSync(DIZIN, { recursive: true })
const SENARYO = path.join(DIZIN, 'senaryo.json')
const GUNLUK = path.join(DIZIN, 'cagrilar.jsonl')
const senaryo = () => { try { return JSON.parse(fs.readFileSync(SENARYO, 'utf8')) } catch { return {} } }
const kaydet = (satir) => { try { fs.appendFileSync(GUNLUK, JSON.stringify(satir) + '\n') } catch { /* the log is for the walk-through only */ } }
const json = (govde, status = 200) => new Response(JSON.stringify(govde), { status, headers: { 'content-type': 'application/json' } })

// Synthetic visits. Not real patients, not real recordings.
const UZ_ILK = 'Shifokor: Assalomu alaykum, nima bezovta qilyapti? Ona: Qizimning uch kundan beri isitmasi bor, oʻttiz sakkiz yarimgacha koʻtarildi. Yoʻtal va burun bitishi ham bor. Ishtahasi pasaygan, lekin suyuqlikni yaxshi ichyapti. Shifokor: Tomogʻi qizargan, oʻpkada xirillash yoʻq, nafas olishi erkin. Koʻp suyuqlik bering, isitma koʻtarilsa paratsetamol bering, uch kundan keyin qayta koʻrikka keling.'
const UZ_BULANIK = 'shifokor salom nima bezovta ona qizim uch kun isitma yotal burun ishtaha past suyuqlik ichadi tomoq qizil opka toza suyuqlik bering uch kundan keyin keling'
const UZ_IKINCI = 'Shifokor: Salom, nima bezovta qilyapti? Ona: Qizimda uch kundan beri isitma, yoʻtal va burun bitishi bor. Ishtahasi past, suyuqlik ichyapti. Shifokor: Tomogʻi qizargan, oʻpkasi toza. Koʻp suyuqlik bering, uch kundan keyin keling.'
const kelimeler = (metin, logprob) => metin.split(' ').flatMap((k, i) => [{ text: k, type: 'word', start: i * 0.4, end: i * 0.4 + 0.3, logprob }, { text: ' ', type: 'spacing', start: i * 0.4 + 0.3, end: i * 0.4 + 0.4, logprob: 0 }])
const scribe = (metin, dil, olasilik, logprob) => ({ language_code: dil, language_probability: olasilik, text: metin, words: kelimeler(metin, logprob) })

const gercek = globalThis.fetch
globalThis.fetch = async function sahteFetch(girdi, secenek) {
  const adres = typeof girdi === 'string' ? girdi : girdi instanceof URL ? girdi.href : girdi?.url ?? String(girdi)
  let u
  try { u = new URL(adres) } catch { return gercek(girdi, secenek) }
  if (u.hostname === '127.0.0.1' || u.hostname === 'localhost' || u.hostname === '::1') return gercek(girdi, secenek)

  if (u.origin === 'https://api.elevenlabs.io' && u.pathname === '/v1/speech-to-text') {
    const form = secenek?.body
    const dosya = form?.get?.('file')
    const dil = form?.get?.('language_code') ?? null
    kaydet({ tur: 'stt', model: form?.get?.('model_id') ?? null, dil, bayt: dosya?.size ?? 0, anahtar: Boolean(secenek?.headers?.['xi-api-key']) })
    if (!dosya || !dosya.size) return json({ detail: 'empty file' }, 400)
    if (senaryo().stt === 'dusuk') {
      // First pass: the engine is unsure of the language and of the words. The forced pass is better, and still low.
      return dil ? json(scribe(UZ_IKINCI, dil, 1, -0.5)) : json(scribe(UZ_BULANIK, 'uzb', 0.52, -0.7))
    }
    return json(scribe(UZ_ILK, 'uzb', 0.97, -0.08))
  }

  kaydet({ tur: 'REFUSED', adres: u.origin + u.pathname })
  throw new Error(`stand-in providers: an outside address was refused: ${u.origin}`)
}
