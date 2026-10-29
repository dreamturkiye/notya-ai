/**
 * AU-CANLI-01 — SERVER SIDE of a country's live assistant. Three entry points, each used by one route:
 *
 *   canliDurumCevabi   GET  /api/ulke/asistan-canli   is it available for this account? (the screen draws a microphone
 *                                                      only on `hazir: true`)
 *   canliBaglantiCevabi POST /api/ulke/asistan-canli  open a call: lock the agent, mint the one-time address and the call token
 *   canliLlmPost       POST /api/ulke/asistan-canli/ses-llm/v1/chat/completions   the agent's "brain" (Custom LLM, SSE)
 *
 * The map of how Türkiye does the same is in docs/COUNTRY-PACK-HOWTO.md ("Live assistant"). Reused from core: the token
 * and secret check (lib/asistan/sesJetonu.ts), the model gateway (lib/ai/cagir.ts, ai-model-politikasi: no model name
 * here), the account/role plumbing of the kit. Not reused: Türkiye's brain (ayseCevapla) — it reads Türkiye's patient
 * tables and speaks Turkish — and its patient tools.
 *
 * HASTA-IZOLASYON: no route here takes a patient id, a note id or any id from the request. The only identity is the
 * signed-in account (bearer session) or the signed call token (account + role). Nothing patient-derived is read or
 * written; the prompt says so and asks for de-identified descriptions. A later version that opens a patient file must
 * add the ownership check first (lib/ulke/uygulama/hastalar.ts) — see docs/OPEN-COMMITMENTS.md.
 *
 * Logs name the KIND of failure only, never a message or a transcript.
 */
import { randomUUID } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { dolguGecikmesiMs } from '@/lib/asistan/konusma'
import type { AiMesaj } from '@/lib/ai/cagir'
import { modeldenAkis } from '@/lib/ulke/uygulama/notModeli'
import { asistanKimligi, rolAdi } from '@/lib/ulke/arayuz'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { KOVA_ASISTAN_BAGLANTI, KOVA_ASISTAN_TUR, kovaKotasiKullan } from '@/lib/ulke/uygulama/kota'
import { hekimRolunuOku, uygulamaRoluMu } from '@/lib/ulke/uygulama/rol'
import { ulkeServisSupabase } from '@/lib/ulke/sunucuOturum'
import { canliDurum, type CanliDurum } from './ajan'
import { canliIstem } from './istem'
import { canliJetonuDogrula, canliJetonuImzala, llmSirriGecerliMi } from './jeton'
import { imzaliAdresAl, konusmaJetonuAl, motoruSabitle } from './motorKilidi'
import { atlaCagrisi, dolguSozu, SES_TAMPON, turOlcumuYaz, ulkeOnKapi, ulkeTurKarsila } from './sesTur'
import { sesAjaniniSabitle } from '@/lib/asistan/sesMotoru'
import type { SesTurKaydi } from '@/lib/asistan/sesTurYoneticisi'
import { sesMetni } from './okunus'
import { SesAkisi } from './konusma'
import type { SupabaseClient, User } from '@supabase/supabase-js'

/** Calls one account may open per day: a cost ceiling, not a clinical rule. */
export const GUNLUK_BAGLANTI_LIMITI = 40
/** The voice turn never runs longer than this; the model call is given the same budget. */
export const TUR_BUTCESI_MS = 20_000
export const EKRAN_ARACI = 'show_on_screen'
/** The agent's speech language (ASR + soft-timeout filler); the same value the call start overrides. */
export const AJAN_DILI = 'en'
const GECMIS_TUR = 12
const MESAJ_AZAMI = 2_000

function durumOku(rol: string | null): { durum: CanliDurum; kimlik: ReturnType<typeof asistanKimligi> } {
  const paket = ulkePaketi()
  const kimlik = rol ? asistanKimligi(rol, paket.varsayilanDil) : null
  return { kimlik, durum: canliDurum({ kod: paket.kod, ses: AKTIF_KLINIK?.ses, canli: AKTIF_KLINIK?.canliAsistan, kimlik }) }
}

export async function canliDurumCevabi(oturum: { user: User; supabase: SupabaseClient }): Promise<Response> {
  const rol = await hekimRolunuOku(oturum.supabase, oturum.user.id)
  const { durum, kimlik } = durumOku(rol)
  if (!durum.hazir || !kimlik) return cevap({ hazir: false })
  return cevap({ hazir: true, ad: kimlik.tamAd, kisaAd: kimlik.kisaAd, cinsiyet: durum.cinsiyet })
}

export async function canliBaglantiCevabi(oturum: { user: User; supabase: SupabaseClient }): Promise<Response> {
  const rol = await hekimRolunuOku(oturum.supabase, oturum.user.id)
  const { durum, kimlik } = durumOku(rol)
  const canli = AKTIF_KLINIK?.canliAsistan
  if (!durum.hazir || !kimlik || !rol || !canli) return KOD.yok()
  if (!(await kovaKotasiKullan(oturum.supabase, oturum.user.id, KOVA_ASISTAN_BAGLANTI, GUNLUK_BAGLANTI_LIMITI))) {
    return cevap({ code: 'LIMIT' }, 429)
  }
  const anahtar = (process.env.ELEVENLABS_API_KEY ?? '').trim()
  const paket = ulkePaketi()
  // The agent is held to the pack's voice and the fixed delivery BEFORE the call starts.
  await motoruSabitle(durum.ajan, durum.sesId, anahtar)
  // SES-OMURGA-V2 (G): turn v3, soft-timeout filler in the agent's language, scribe_realtime, skip_turn, cascade 10 s,
  // ASR keyword override — the pack's voice and delivery stay with motoruSabitle (tts: false). No hosted backup LLM.
  const anahtarKelimeler = [kimlik.kisaAd, kimlik.tamAd, 'Notya'].filter(Boolean).map(String)
  await sesAjaniniSabitle(durum.ajan, anahtar, { dil: AJAN_DILI, tts: false, ozelLlm: true, anahtarKelimeler, dolgu: dolguSozu(AJAN_DILI) })
  const [adres, konusmaJetonu] = await Promise.all([imzaliAdresAl(durum.ajan, anahtar), konusmaJetonuAl(durum.ajan, anahtar)])
  if (!adres) return cevap({ code: 'BASARISIZ' }, 502)
  const jeton = canliJetonuImzala({ hesapId: oturum.user.id, kod: paket.kod, rol, cagri: randomUUID() })
  if (!jeton) return KOD.yok()
  return cevap({
    signed_url: adres,
    voice_id: durum.sesId,
    persona_ad: kimlik.tamAd,
    first_message: canli.acilis({ tamAd: kimlik.tamAd, kisaAd: kimlik.kisaAd, rolAdi: rolAdi(rol, paket.varsayilanDil) ?? '', doktorAdi: null }),
    language: AJAN_DILI,
    notya_jeton: jeton,
    // SES-OMURGA-V2 (C): WebRTC when a token was minted; the client falls back to the signed URL otherwise.
    baglanti: konusmaJetonu ? 'webrtc' : 'websocket',
    ...(konusmaJetonu ? { conversation_token: konusmaJetonu } : {}),
    asr_keywords: anahtarKelimeler.slice(0, 50),
    ekran_araci: EKRAN_ARACI,
  })
}

// ───────────────────────── the agent's brain ─────────────────────────

type ElMesaj = { role?: string; content?: unknown }
type ElArac = { type?: string; function?: { name?: string }; name?: string }

function metinOku(icerik: unknown): string {
  if (typeof icerik === 'string') return icerik
  if (Array.isArray(icerik)) return icerik.map((p) => (p && typeof p === 'object' && typeof (p as { text?: unknown }).text === 'string' ? (p as { text: string }).text : '')).join(' ')
  return ''
}

const aracVarMi = (araclar: unknown, ad: string): boolean => Array.isArray(araclar) && (araclar as ElArac[]).some((a) => (a?.function?.name || a?.name) === ad)

/** The conversation as the model sees it: the clinician's and the assistant's own words only, bounded, starting with the clinician. */
export function modelMesajlari(ham: unknown): AiMesaj[] {
  const liste = Array.isArray(ham) ? (ham as ElMesaj[]) : []
  const temiz: AiMesaj[] = []
  for (const m of liste) {
    if (m?.role !== 'user' && m?.role !== 'assistant') continue // system, tool and anything else from the caller is dropped
    const t = metinOku(m.content).replace(/\s+/g, ' ').trim().slice(0, MESAJ_AZAMI)
    if (!t) continue
    const son = temiz[temiz.length - 1]
    if (son && son.role === m.role) son.content = `${String(son.content)} ${t}`.slice(0, MESAJ_AZAMI)
    else temiz.push({ role: m.role, content: t })
  }
  while (temiz.length && temiz[0].role !== 'user') temiz.shift()
  return temiz.slice(-GECMIS_TUR)
}

export function sonKullaniciCumlesi(ham: unknown): string | null {
  const liste = Array.isArray(ham) ? (ham as ElMesaj[]) : []
  const son = liste[liste.length - 1]
  if (!son || son.role !== 'user') return null
  const t = metinOku(son.content).replace(/\s+/g, ' ').trim()
  return t ? t.slice(0, 4000) : null
}

const VEDA = /^(?:ok(?:ay)?[,.]?\s+|thanks?[,.]?\s+|thank you[,.]?\s+)?(?:goodbye|good bye|bye(?:\s+bye)?|that'?s all|that will be all|end (?:the )?(?:call|conversation)|stop (?:the )?(?:assistant|call)|hang up|close (?:the )?assistant)(?:\s+(?:for now|thanks|thank you|please))*[.!]?$/i
export const vedaMi = (m: string): boolean => VEDA.test(m.trim())

export async function canliLlmPost(req: NextRequest): Promise<Response> {
  const paket = ulkePaketi()
  const canli = AKTIF_KLINIK?.canliAsistan
  if (!canli || !AKTIF_KLINIK?.ses) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  if (!llmSirriGecerliMi(req.headers)) return NextResponse.json({ code: 'UNAUTHORISED' }, { status: 401 })
  const govde = (await req.json().catch(() => null)) as { messages?: unknown; tools?: unknown; model?: string; elevenlabs_extra_body?: Record<string, unknown> } | null
  if (!govde) return NextResponse.json({ code: 'GECERSIZ' }, { status: 400 })
  const jeton = canliJetonuDogrula(govde.elevenlabs_extra_body?.notya_jeton, paket.kod)
  if (!jeton || !uygulamaRoluMu(jeton.rol)) return NextResponse.json({ code: 'UNAUTHORISED' }, { status: 401 })
  const kimlik = asistanKimligi(jeton.rol, paket.varsayilanDil)
  const rolun = rolAdi(jeton.rol, paket.varsayilanDil)
  if (!kimlik || !rolun) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })

  const mesaj = sonKullaniciCumlesi(govde.messages)
  const kimlikNo = `chatcmpl-${randomUUID()}`
  const olusturma = Math.floor(Date.now() / 1000)
  const model = String(govde.model || 'notya-canli')
  const enc = new TextEncoder()
  // SES-OMURGA-V2 (A/H): call key, turn registry entry, timing.
  const cagri = jeton.cagri || `h:${jeton.hesapId}`
  const t0 = Date.now()
  let ilkSoz: number | null = null
  let kayit: SesTurKaydi | null = null
  let turNo = 0
  let karar = 'yok'
  let rota = 'model'

  const akis = new ReadableStream<Uint8Array>({
    async start(controller) {
      let ilk = true
      let kapali = false
      let icerikGitti = false
      const gonder = (nesne: unknown) => {
        if (kapali) return
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(nesne)}\n\n`)) } catch { kapali = true }
      }
      const parca = (delta: Record<string, unknown>, bitis: string | null = null) => {
        // Guard (Kaan 2026-10-25): content with no letter or digit is never spoken (a click) — SES-OMURGA-V2: dropped,
        // never turned into whitespace (a whitespace-only reply is what ElevenLabs retries). A superseded request says
        // nothing more: ElevenLabs plays the newer one.
        if (typeof delta.content === 'string') {
          if (!delta.content || !/[\p{L}\p{N}]/u.test(delta.content) || kayit?.iptalEdildi) {
            const { content: _c, ...geri } = delta
            if (!Object.keys(geri).length && !bitis) return
            delta = geri
          } else {
            icerikGitti = true
            if (ilkSoz === null) ilkSoz = Date.now() - t0
            kayit?.yay(delta.content)
          }
        }
        gonder({ id: kimlikNo, object: 'chat.completion.chunk', created: olusturma, model, choices: [{ index: 0, delta: ilk ? { role: 'assistant', ...delta } : delta, finish_reason: bitis }] })
        ilk = false
      }
      let sozGitti = false
      const soyle = (t: string) => { const m = t.trim(); if (m) { sozGitti = true; parca({ content: `${m} ` }) } }
      let bitis = 'stop'
      /** SES-OMURGA-V2 (C): no answer needed — ElevenLabs' skip_turn (silent, keeps listening), else the buffer chunk at the end. */
      const atla = (neden: string) => {
        rota = `atla:${neden}`
        if (aracVarMi(govde.tools, 'skip_turn')) { parca(atlaCagrisi(neden, `call_${randomUUID().slice(0, 8)}`)); bitis = 'tool_calls' }
      }
      let onNeden: string | null = null
      let kopyasi: SesTurKaydi | null = null
      try {
        // Open the stream at once: an empty first chunk lets the provider commit the clinician's transcript while we work.
        parca({})
        const sonMesaj = Array.isArray(govde.messages) ? (govde.messages as ElMesaj[])[(govde.messages as ElMesaj[]).length - 1] : null
        if (!mesaj) {
          // A client-tool round trip (the screen tool) or nothing to answer: stay silent, keep the socket.
          if (sonMesaj?.role !== 'tool' && sonMesaj?.role !== 'function') atla('bos')
        } else if (vedaMi(mesaj) && aracVarMi(govde.tools, 'end_call')) {
          soyle(canli.ekranSozleri.veda)
          parca({ tool_calls: [{ index: 0, id: `call_${randomUUID().slice(0, 8)}`, type: 'function', function: { name: 'end_call', arguments: JSON.stringify({ reason: 'The clinician ended the conversation.' }) } }] })
          bitis = 'tool_calls'
        } else if ((onNeden = ulkeOnKapi(mesaj, govde.messages, AJAN_DILI))) {
          // SES-OMURGA-V2 (C): a pause, a filler, a scrap or the assistant's own echo — never the model.
          atla(onNeden)
        } else if ((() => { const k = ulkeTurKarsila(cagri, govde.messages, mesaj); karar = k.karar; turNo = k.turNo; if (k.karar !== 'kopya') kayit = k.kayit; else kopyasi = k.kayit; return k.karar === 'kopya' })()) {
          // SES-OMURGA-V2 (A): the same turn again — served the first request's words, no second model call.
          rota = 'kopya'
          await kopyasi!.paylas((p) => parca({ content: p }))
          if (!icerikGitti) atla('kopya')
        } else {
          const sb = ulkeServisSupabase()
          if (!(await kovaKotasiKullan(sb, jeton.hesapId, KOVA_ASISTAN_TUR, canli.gunlukTurLimiti))) {
            soyle(canli.ekranSozleri.gunlukSinir)
          } else {
            // SES-DOLGU-02 (same rule as Türkiye, 2026-10-26): a slow turn may not sit in silence — past ~8 s with
            // no content ElevenLabs retries the request as failed (duplicate turns). One localized holding phrase,
            // only when the deadline passes before the first spoken sentence.
            const bekletme = canli.ekranSozleri.bekletme && dolguGecikmesiMs() > 0
              ? setTimeout(() => { if (!sozGitti && !kapali) soyle(canli.ekranSozleri.bekletme!) }, dolguGecikmesiMs())
              : null
            const sozAkisi = new SesAkisi((c) => soyle(sesMetni(c)), canli.ekranSozleri)
            let tam = ''
            let hata = false
            const istem = canliIstem({ canli, tamAd: kimlik.tamAd, kisaAd: kimlik.kisaAd, rolAdi: rolun, rol: jeton.rol, acilNumara: paket.uygulama?.portal?.acilNumara ?? null })
            const sonuc = await modeldenAkis({ talimat: istem, mesajlar: modelMesajlari(govde.messages), doktorId: jeton.hesapId, butceMs: TUR_BUTCESI_MS, iptal: kayit?.iptal.signal }, (p) => { tam += p; sozAkisi.ekle(p) })
            if (sonuc === null) hata = true
            else if (!tam) tam = sonuc // a gateway fallback answers whole, not in pieces
            if (tam && sozAkisi.beatSayisi === 0 && !sozAkisi.ekranaKaldi) sozAkisi.ekle(tam)
            sozAkisi.bitir()
            if (bekletme) clearTimeout(bekletme)
            if (hata && !icerikGitti) soyle(canli.ekranSozleri.anlasilmadi)
            // The screen gets the full answer. Only when the agent offers the screen tool; otherwise the transcript is the screen.
            if (tam.trim() && aracVarMi(govde.tools, EKRAN_ARACI) && !kayit?.iptalEdildi) {
              parca({ tool_calls: [{ index: 0, id: `call_${randomUUID().slice(0, 8)}`, type: 'function', function: { name: EKRAN_ARACI, arguments: JSON.stringify({ text: tam.trim().slice(0, 8000) }) } }] })
              bitis = 'tool_calls'
            }
          }
        }
      } catch (e) {
        console.error(`[ulke/asistan] stream: ${e instanceof Error ? e.name : typeof e}`)
        if (!icerikGitti) soyle(canli.ekranSozleri.anlasilmadi)
      }
      // An empty stream is what the provider reports as a lost connection. SES-OMURGA-V2: never whitespace-only — the
      // documented buffer chunk "... " (sent directly: it carries no letter, so not through the guard).
      if (!icerikGitti && bitis === 'stop') { gonder({ id: kimlikNo, object: 'chat.completion.chunk', created: olusturma, model, choices: [{ index: 0, delta: ilk ? { role: 'assistant', content: SES_TAMPON } : { content: SES_TAMPON }, finish_reason: null }] }); ilk = false }
      parca({}, bitis)
      if (!kapali) { try { controller.enqueue(enc.encode('data: [DONE]\n\n')); controller.close() } catch { /* the caller hung up */ } }
      kayit?.bitir()
      turOlcumuYaz({ cagri, turNo, karar, rota: kayit?.iptalEdildi ? 'iptal' : rota, ilkBayt: 0, ilkSoz, toplam: Date.now() - t0 })
    },
  })

  return new Response(akis, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' },
  })
}
