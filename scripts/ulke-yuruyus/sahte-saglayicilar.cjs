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
 *   <dir>/senaryo.json     { "stt": "yuksek" | "dusuk", "model": "tamam" | "hata" }   written by the walk-through before a visit
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

// Synthetic notes, one per language a note can be written in.
const notlar = {
  'uz-Latn': { s: 'Onasining aytishicha, qizida uch kundan beri isitma (38,5 gacha), yoʻtal va burun bitishi. Ishtahasi pasaygan, suyuqlikni yaxshi ichyapti.', o: 'Tomogʻi qizargan. Oʻpkada xirillash yoʻq, nafas olishi erkin.', a: 'Shifokor tashxisni aytmadi.', p: 'Koʻp suyuqlik. Isitma koʻtarilsa paratsetamol. Uch kundan keyin qayta koʻrik.' },
  'uz-Cyrl': { s: 'Онасининг айтишича, қизида уч кундан бери иситма, йўтал ва бурун битиши.', o: 'Томоғи қизарган. Ўпкада хириллаш йўқ.', a: 'Шифокор ташхисни айтмади.', p: 'Кўп суюқлик. Уч кундан кейин қайта кўрик.' },
  ru: { s: 'Со слов матери, у девочки третий день температура (до 38,5), кашель и заложенность носа. Аппетит снижен, пьёт хорошо.', o: 'Зев гиперемирован. Хрипов в лёгких нет, дыхание свободное.', a: 'Врач диагноз не назвал.', p: 'Обильное питьё. При повышении температуры парацетамол. Повторный приём через три дня.' },
  // A rewrite keeps what the doctor changed: the stand-in carries the edited dose over, as a faithful rewrite would.
  ruYeniden: (kullanici) => ({ ...notlar.ru, p: kullanici.includes('250 mg') ? 'Обильное питьё. При повышении температуры парацетамол 250 мг. Повторный приём через три дня.' : notlar.ru.p }),
}

// NOTYA-UZ-BRANSLAR-01 — synthetic FIELDS, the same for every role on purpose: paediatric, cardiology, dietetic and
// audiology fields together, the guardian field, and one key that belongs to nobody. The application must keep only
// what the note's own template owns; the walk-through proves it for three roles.
const alanlar = {
  'uz-Latn': { history_giver: 'Onasi.', feeding: 'Kuniga toʻrt mahal ovqatlanadi.', temperature: '38,5 gacha koʻtarilgan.', head_circumference: '', chest_pain: 'Koʻkrakda ogʻriq yoʻq.', ecg: 'Oʻzgarishsiz.', diet_history: 'Shirinlikni koʻp yeydi.', nutrition_plan: 'Koʻp suyuqlik.', audiometry: 'Bajarilmadi.', made_up_key: 'XATO-MAYDON' },
  'uz-Cyrl': { history_giver: 'Онаси.', feeding: 'Кунига тўрт маҳал овқатланади.', temperature: '38,5 гача кўтарилган.', chest_pain: 'Кўкракда оғриқ йўқ.', ecg: 'Ўзгаришсиз.', diet_history: 'Ширинликни кўп ейди.', nutrition_plan: 'Кўп суюқлик.', audiometry: 'Бажарилмади.', made_up_key: 'XATO-MAYDON' },
  ru: { history_giver: 'Мать.', feeding: 'Ест четыре раза в день.', temperature: 'До 38,5.', chest_pain: 'Боли в груди нет.', ecg: 'Без изменений.', diet_history: 'Любит сладкое.', nutrition_plan: 'Обильное питьё.', audiometry: 'Не проводилась.', made_up_key: 'XATO-MAYDON' },
}

// NOTYA-ULKE-SABLON-01 — YURUYUS_GENEL=1: the pack-neutral walk-through. Answers hold no language's text on purpose.
const GENEL = process.env.YURUYUS_GENEL === '1'
const GENEL_METIN = 'synthetic visit one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen'

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
    // NOTYA-ULKE-SABLON-01 — pack-neutral walk-through (./genel.mjs): one confident pass in the language code the pack expects.
    if (GENEL) return json(scribe(GENEL_METIN, process.env.YURUYUS_STT_KODU || 'und', 0.97, -0.08))
    if (senaryo().stt === 'dusuk') {
      // First pass: the engine is unsure of the language and of the words. The forced pass is better, and still low.
      return dil ? json(scribe(UZ_IKINCI, dil, 1, -0.5)) : json(scribe(UZ_BULANIK, 'uzb', 0.52, -0.7))
    }
    return json(scribe(UZ_ILK, 'uzb', 0.97, -0.08))
  }

  if (u.origin === 'https://openrouter.ai' && u.pathname === '/api/v1/chat/completions') {
    let b = {}
    try { b = JSON.parse(String(secenek?.body ?? '{}')) } catch { /* answered as an empty request below */ }
    const mesajlar = Array.isArray(b.messages) ? b.messages : []
    const duz = (c) => (typeof c === 'string' ? c : Array.isArray(c) ? c.map((p) => p?.text ?? '').join('\n') : '')
    const sistem = duz(mesajlar.find((m) => m.role === 'system')?.content)
    const kullanici = mesajlar.filter((m) => m.role === 'user').map((m) => duz(m.content)).join('\n')
    const yeniden = /^(QAYD|ҚАЙД|ЗАПИСЬ):/.test(kullanici)
    const dil = sistem.includes('на русском языке') ? 'ru' : sistem.includes('кирилл ёзувида') ? 'uz-Cyrl' : sistem.includes('lotin yozuvida') ? 'uz-Latn' : '?'
    // The log keeps what the walk-through must be able to prove — never the text itself.
    kaydet({
      tur: 'model', is: yeniden ? 'yeniden' : 'not', dil, model: String(b.model || ''), veriToplama: b.provider?.data_collection ?? null,
      sistemUzunluk: sistem.length, kimlikVar: /Karimova|Dilnoza|Rustam|Иванов|\+998|aaaaaaaa-0000/.test(sistem + kullanici),
      yasVar: /yoshi — 5 yosh|возраст — /.test(kullanici), duzeltmeVar: kullanici.includes('250 mg'),
      // pack-neutral walk-through: its synthetic patient is "QA-PATIENT …", its accounts are aaaaaaaa-0000-…
      genelKimlikVar: /QA-PATIENT|WALKTHROUGH|aaaaaaaa-0000/.test(sistem + kullanici), kullaniciUzunluk: kullanici.length,
      // Which fields the instruction asks for (keys only), and whether it says the colleague is not a doctor.
      alanAnahtarlari: [...sistem.matchAll(/^- ([a-z][a-z0-9_]*) — /gm)].map((x) => x[1]).join(), muttefik: /shifokor emas|шифокор эмас|не врач/.test(sistem),
    })
    if (senaryo().model === 'hata') return json({ error: { code: 503, message: 'stand-in: the model provider is down' } }, 503)
    if (GENEL) {
      // Four sections of synthetic text, every field the instruction asked for, and one key that belongs to nobody.
      const istenen = [...sistem.matchAll(/^- ([a-z][a-z0-9_]*) — /gm)].map((x) => x[1])
      const cevapGenel = { s: 'SYNTHETIC-S reported at the visit.', o: 'SYNTHETIC-O examined.', a: 'SYNTHETIC-A stated by the doctor.', p: 'SYNTHETIC-P plan.', fields: { ...Object.fromEntries(istenen.map((k) => [k, `SYNTHETIC-FIELD ${k}`])), not_a_field_of_anybody: 'SYNTHETIC-LEAK' } }
      return json({ id: 'sahte', model: b.model, choices: [{ message: { role: 'assistant', content: JSON.stringify(cevapGenel) }, finish_reason: 'stop' }], usage: { prompt_tokens: 800, completion_tokens: 200 } })
    }
    const dort = yeniden ? (dil === 'ru' ? notlar.ruYeniden(kullanici) : notlar[dil]) : notlar[dil]
    const cevap = dort ? { ...dort, fields: alanlar[dil] } : null
    if (!cevap) return json({ error: { code: 400, message: 'stand-in: no instruction it knows' } }, 400)
    return json({ id: 'sahte', model: b.model, choices: [{ message: { role: 'assistant', content: JSON.stringify(cevap) }, finish_reason: 'stop' }], usage: { prompt_tokens: 800, completion_tokens: 200 } })
  }

  kaydet({ tur: 'REFUSED', adres: u.origin + u.pathname })
  throw new Error(`stand-in providers: an outside address was refused: ${u.origin}`)
}
