/**
 * NOTYA-AYSE-ARAC-PARITE-05 — what a read-tool round trip adds to a turn.
 *
 * Runs the acceptance questions (./okumaSorulari) through the real routes on the in-memory scene, twice each:
 *   • `arac`  — read routers switched off (NOTYA_HIZLI_YOL_KAPALI=1): model call → read tool → model call;
 *   • `hizli` — routers on: the model-free answer, as a reference.
 * The numbers come from the product's own log line (`[asistan/chat] okuma araci`: aracMs = tool execution, modelMs =
 * the model call after it, ekMs = both), plus the wall clock of the whole turn.
 *
 * The model is reached through the production wire path (lib/ai/saglayici.ts). With no key it is `vekilOkuma`, a
 * stand-in that speaks that wire format and answers at once: its numbers are the SERVER's share of the round trip
 * (tool execution, request building, parsing), not a model's latency. With a real key the same runner measures the
 * real primary model, and also whether it calls the tool unprompted.
 */
import { ortam, yazi, fishTur, sonAsistanMesaji, sonRota, agOkumalariBitsin, type SahteArac } from './ayseSahne'
import { OKUMA_SORULARI, OKUMA_TZ, okumaOturumu, okumaSahnesiKur, type OkumaSorusu } from './okumaSorulari'

export type Kanal = 'yazi' | 'ses'
export type Yol = 'arac' | 'hizli'

export interface GecikmeSatiri {
  soru: string; kanal: Kanal; durum: 'acik' | 'yok'; yol: Yol
  /** Wall clock of the whole turn through the route. */
  toplamMs: number
  /** From the product log; null when no read tool ran in the turn. */
  aracMs: number | null; modelMs: number | null; ekMs: number | null
  /** Did a read tool run (always false on the fast path; on the tool path "no" means the model did not call one). */
  aracCagrildi: boolean
  /** The expected facts are in the answer shown to the doctor. */
  dogru: boolean
}

/** What the stand-in calls on its first request of the turn (set by the runner before each turn). */
let siradaki: SahteArac | null = null

/**
 * Stand-in for the model endpoint: on a request with no tool result it calls `siradaki`; once the request carries
 * tool results it reads them back. Speaks the chat.completions wire format, streamed or not. NOT a model.
 */
export function vekilOkuma(govde: Record<string, any>): Response {
  const sonuclar = ((govde.messages || []) as { role?: string; content?: unknown }[]).filter((m) => m.role === 'tool').map((m) => String(m.content ?? ''))
  const arac = !sonuclar.length ? siradaki : null
  const metin = arac ? '' : JSON.stringify({ speech: sonuclar.length ? `Hocam, ${sonuclar.join(' ')}` : 'Vekil yanıt Hocam.' })
  const cagri = arac ? [{ index: 0, id: 'call_vekil', type: 'function', function: { name: arac.name, arguments: JSON.stringify(arac.input) } }] : null
  const usage = { prompt_tokens: 100, completion_tokens: 10, cost: 0 }
  const bitis = cagri ? 'tool_calls' : 'stop'
  if (govde.stream !== true) {
    return new Response(JSON.stringify({ id: 'vekil', model: govde.model, choices: [{ message: { role: 'assistant', content: metin || null, ...(cagri ? { tool_calls: cagri } : {}) }, finish_reason: bitis }], usage }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  const olay = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`
  const parcalar = [
    olay({ id: 'vekil', model: govde.model, choices: [{ delta: cagri ? { tool_calls: cagri } : { content: metin } }] }),
    olay({ choices: [{ delta: {}, finish_reason: bitis }], usage }),
    'data: [DONE]\n\n',
  ]
  const kod = new TextEncoder()
  return new Response(new ReadableStream({ start(k) { for (const p of parcalar) k.enqueue(kod.encode(p)); k.close() } }), { status: 200, headers: { 'content-type': 'text/event-stream' } })
}

async function turKos(soru: OkumaSorusu, kanal: Kanal, durum: 'acik' | 'yok', yol: Yol): Promise<GecikmeSatiri> {
  const k = okumaSahnesiKur()
  const oturum = okumaOturumu(k, soru, durum)
  const soz = soru[durum]
  siradaki = soru.arac(soz, k)
  if (yol === 'arac') process.env.NOTYA_HIZLI_YOL_KAPALI = '1'
  else delete process.env.NOTYA_HIZLI_YOL_KAPALI
  const t0 = Date.now()
  let ekran = ''
  try {
    if (kanal === 'yazi') ekran = (await yazi(k.s, soz, { oturum, saatDilimi: OKUMA_TZ })).speech
    else { await fishTur(k.s, soz, { oturum, saatDilimi: OKUMA_TZ }); ekran = sonAsistanMesaji(oturum) }
  } finally {
    delete process.env.NOTYA_HIZLI_YOL_KAPALI
  }
  const toplamMs = Date.now() - t0
  await agOkumalariBitsin()
  const tur = ortam.okumaTurlari
  const topla = (f: (t: (typeof tur)[number]) => number) => (tur.length ? tur.reduce((n, t) => n + f(t), 0) : null)
  // The identity answer of a voice turn is rebuilt for the screen by /ses-ekran; here the route is the proof.
  const dogru = soru.kimlik && kanal === 'ses' ? sonRota() === 'kimlik' : (yol === 'hizli' ? soru.yonlendirici || soru.dogru : soru.dogru).every((d) => d.test(ekran))
  return { soru: soru.ad, kanal, durum, yol, toplamMs, aracMs: topla((t) => t.aracMs), modelMs: topla((t) => t.modelMs), ekMs: topla((t) => t.ekMs), aracCagrildi: tur.length > 0, dogru }
}

export async function okumaGecikmesiniOlc(g: { tekrar: number; kanallar?: Kanal[]; ilerleme?: (s: GecikmeSatiri) => void }): Promise<GecikmeSatiri[]> {
  const satirlar: GecikmeSatiri[] = []
  const eskiKoruyucu = process.env.NOTYA_KORUYUCU_KAPALI
  // A failure of the primary is a failure of the measurement, not something the guard should paper over.
  process.env.NOTYA_KORUYUCU_KAPALI = '1'
  try {
    for (let i = 0; i < g.tekrar; i++) {
      for (const soru of OKUMA_SORULARI) for (const durum of ['acik', 'yok'] as const) for (const kanal of g.kanallar || (['yazi', 'ses'] as const)) for (const yol of ['arac', 'hizli'] as const) {
        const s = await turKos(soru, kanal, durum, yol)
        satirlar.push(s)
        g.ilerleme?.(s)
      }
    }
  } finally {
    if (eskiKoruyucu === undefined) delete process.env.NOTYA_KORUYUCU_KAPALI; else process.env.NOTYA_KORUYUCU_KAPALI = eskiKoruyucu
  }
  return satirlar
}

export function yuzdelik(degerler: number[], p: number): number | null {
  if (!degerler.length) return null
  const s = [...degerler].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))]
}

export interface GecikmeOzeti {
  kanal: Kanal | 'hepsi'
  aracTur: number; aracCagrilan: number; aracDogru: number
  ekP50: number | null; ekP90: number | null; aracP50: number | null; modelP50: number | null
  aracYoluToplamP50: number | null; hizliYolToplamP50: number | null
  hizliTur: number; hizliDogru: number
}

export function gecikmeOzeti(satirlar: GecikmeSatiri[], kanal: Kanal | 'hepsi' = 'hepsi'): GecikmeOzeti {
  const s = satirlar.filter((x) => kanal === 'hepsi' || x.kanal === kanal)
  const arac = s.filter((x) => x.yol === 'arac'), hizli = s.filter((x) => x.yol === 'hizli')
  const sayi = (l: (number | null)[]) => l.filter((x): x is number => x != null)
  return {
    kanal,
    aracTur: arac.length, aracCagrilan: arac.filter((x) => x.aracCagrildi).length, aracDogru: arac.filter((x) => x.dogru).length,
    ekP50: yuzdelik(sayi(arac.map((x) => x.ekMs)), 50), ekP90: yuzdelik(sayi(arac.map((x) => x.ekMs)), 90),
    aracP50: yuzdelik(sayi(arac.map((x) => x.aracMs)), 50), modelP50: yuzdelik(sayi(arac.map((x) => x.modelMs)), 50),
    aracYoluToplamP50: yuzdelik(arac.map((x) => x.toplamMs), 50), hizliYolToplamP50: yuzdelik(hizli.map((x) => x.toplamMs), 50),
    hizliTur: hizli.length, hizliDogru: hizli.filter((x) => x.dogru).length,
  }
}

const ms = (n: number | null) => (n == null ? '—' : `${n} ms`)

export function gecikmeRaporu(g: { tarih: string; model: string; vekil: boolean; tekrar: number; satirlar: GecikmeSatiri[] }): string {
  const ozetler = [gecikmeOzeti(g.satirlar), gecikmeOzeti(g.satirlar, 'yazi'), gecikmeOzeti(g.satirlar, 'ses')]
  const soruSatiri = (ad: string) => {
    const s = g.satirlar.filter((x) => x.soru === ad && x.yol === 'arac')
    const sayi = s.map((x) => x.ekMs).filter((x): x is number => x != null)
    return `| ${ad} | ${s.length} | ${s.filter((x) => x.aracCagrildi).length} | ${s.filter((x) => x.dogru).length} | ${ms(yuzdelik(sayi, 50))} | ${ms(yuzdelik(sayi, 90))} |`
  }
  return [
    `# Read-tool round trip: added time (${g.tarih})`,
    '',
    `Ledger: NOTYA-AYSE-ARAC-PARITE-05. Model: **${g.model}**. ${g.tekrar} repetition(s) of ${OKUMA_SORULARI.length} questions × chart open / closed × chat / voice, real routes, in-memory scene, synthetic patients.`,
    '',
    g.vekil
      ? '**Stand-in run.** The model endpoint was a stand-in that speaks the production wire format and answers at once. These numbers are the server\'s share of a round trip (tool execution, building the second request, parsing the answer) — NOT a model\'s latency. Live, a round trip also costs one more call of the primary model; that was not measured here (no key in this environment).'
      : 'Real primary model through the production wire path; the read routers were switched off (`NOTYA_HIZLI_YOL_KAPALI=1`) so the model had to decide by itself to call a tool.',
    '',
    '| Channel | Tool-path turns | Tool was called | Right answer | Added time p50 | Added time p90 | of which tool p50 | of which model call p50 | Whole turn p50 (tool path) | Whole turn p50 (router) |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...ozetler.map((o) => `| ${o.kanal === 'hepsi' ? 'both' : o.kanal === 'yazi' ? 'chat' : 'voice'} | ${o.aracTur} | ${o.aracCagrilan} | ${o.aracDogru} | ${ms(o.ekP50)} | ${ms(o.ekP90)} | ${ms(o.aracP50)} | ${ms(o.modelP50)} | ${ms(o.aracYoluToplamP50)} | ${ms(o.hizliYolToplamP50)} |`),
    '',
    '"Added time" is `ekMs` of the product log line `[asistan/chat] okuma araci`: the tool execution plus the model call that follows it. The same value is written to `ai_hiz_olcum` under görev `sohbet-okuma-araci`.',
    '',
    '| Question | Turns | Tool was called | Right answer | Added p50 | Added p90 |',
    '|---|---|---|---|---|---|',
    ...OKUMA_SORULARI.map((q) => soruSatiri(q.ad)),
    '',
  ].join('\n')
}
