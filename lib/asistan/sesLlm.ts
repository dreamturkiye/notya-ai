/**
 * NOTYA-TEK-BEYIN — ElevenLabs Custom LLM ucu (OpenAI Chat Completions uyumlu, text/event-stream).
 *
 * ElevenLabs ajanı (scripts/tek-beyin-ajanlari.mts) LLM olarak bu ucu çağırır: yalnız dinler, sıra alır, konuşur. Beyin
 * burada: konuşmanın SON doktor cümlesi ayseCevapla'ya (kanal: 'ses') gider — ElevenLabs'in gönderdiği sistem promptu
 * kullanılmaz; hafıza, yazılı sohbetle ORTAK asistan oturumudur.
 *
 * SES-OMURGA-V2 (Kaan, 2026-10-29 — docs/SES-MIMARI-V2.md, .cursor/rules/ses-omurga-kilidi.mdc v2):
 *   A. one utterance → one brain, latest wins: a request is keyed by the call (token `c`) and the turn POSITION in
 *      ElevenLabs' history; an exact duplicate is served from the first request's stream (lib/asistan/sesTurYoneticisi.ts),
 *      a grown / corrected transcript supersedes and aborts the in-flight brain, the database refuses a superseded
 *      request's history write (ses_turu_ac_v2 / asistan_gecmis_ekle). No lock-loser wait, no DB polling.
 *   C. pauses, fillers, scraps and Ayşe's own echo never reach the brain: ElevenLabs' `skip_turn` system tool.
 *   E. one database round trip before the brain (turn + history window + profile + prefs + ownership + chart version);
 *      the session write, learning and bookkeeping run after the speech stream (waitUntil).
 *   H. one timing row per turn (ses_tur_olcum) and one `[ses-llm/tur]` log line — no text, no ids but the call key.
 * Never a whitespace-only response: a turn with nothing to say ends with skip_turn, or with ElevenLabs' documented buffer
 * chunk "... " when the agent has no skip_turn tool. Every stream ends with `data: [DONE]`.
 *
 * Güvenlik: iki kilit (lib/asistan/sesJetonu.ts) — sunucu sırrı başlığı VE imzalı konuşma jetonu
 * (elevenlabs_extra_body.notya_jeton). Doktor, oturum, branş, hasta, çağrı YALNIZ jetondan okunur.
 * NOTYA-SES-DEVAM-01 / NOTYA-AYSE-GURULTU-02: gizli `[devam]` / `[kesinti-devam]` turları modelsiz okunur.
 * Günlüğe klinik içerik yazılmaz — yalnız hata türü ve süreler.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { ayseCevapla } from '@/lib/asistan/ayseCevapla'
import { klinikCevapla } from '@/lib/asistan/klinikCevapla'
import { klinikSlugJetonndan } from '@/lib/asistan/agentSec'
import { kendiSelamiMi } from '@/lib/asistan/acilis'
import { bekletmeSec, DEVAM_ISARETI, devamIstegiMi, dolguGecikmesiMs, dolguSec, SesAkisi } from '@/lib/asistan/konusma'
import { elevenMetni } from '@/lib/asistan/elevenMetni'
import { detayIstegiMi } from '@/lib/ses/tibbiSeslendirme'
import { SesYayKapisi, sesEtiketTemizle } from '@/lib/asistan/sesYay'
import { sesDevamAl } from '@/lib/asistan/sesDevam'
import { sesJetonuDogrula, sesSirriGecerliMi } from '@/lib/asistan/sesJetonu'
import { eskiSesTaslaklariniCek, sesliKarariUygula } from '@/lib/asistan/sesliOnay'
import { sesOnayMetniGecerliMi, sesVazgecMetniMi } from '@/core/eylemler/sesKapilari'
import { netSosyalMi } from '@/lib/ai/modeller'
import { takvimSorusuMu, sesGurultusuMu, takvimTakibiMi } from '@/lib/randevu/takvimSorusu'
import { sesOnKapisi, sesTurKapisi } from '@/lib/asistan/sesTurKapisi'
import { sesTuruAcV2 } from '@/lib/asistan/sesTurKilit'
import { elSonAsistan, elTurNo, sesTuruKarsila, type SesTurKaydi } from '@/lib/asistan/sesTurYoneticisi'
import { asistaniKapatMi } from '@/lib/asistan/uyandirSoz'
import { kesintiKalani, kesintiMesajiMi } from '@/lib/asistan/kesintiDevam'
import { iptalMi } from '@/lib/ai/cagir'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
)

/** NOTYA-SES-ERKEN-01: the voice turn never runs longer than this; the screen answer is not bound by it. */
const SES_BEKCI_MS = 22_000
/**
 * SES-OMURGA-V2 (A/G): no spoken content yet after this long → ONE neutral holding sentence, so the turn has content
 * well inside ElevenLabs' cascade timeout (10 s, lib/asistan/sesMotoru.ts) and is never retried as failed. ElevenLabs'
 * own 3 s soft-timeout filler ("Hmm, Hocam...") covers the first seconds.
 */
export const ILK_SOZ_BEKCI_MS = 7_000
export const ILK_SOZ_BEKLETME = 'Cevabı hazırlıyorum Hocam.'
/**
 * ElevenLabs' documented buffer chunk (ellipsis + trailing space): the ONLY content a turn with nothing to say may carry
 * when the agent offers no skip_turn tool. Whitespace-only replies (the 10-25 guard) read to ElevenLabs as an empty LLM
 * answer and were re-POSTed every 0.4–2 s (10-26: 9 in 17 s) — never sent again.
 */
export const SES_TAMPON = '... '
/** Something a voice can actually say: at least one letter or digit. */
export const SESLENEBILIR = /[\p{L}\p{N}]/u
/** Back-compat name: what a turn with nothing to say carries (now the buffer chunk, never whitespace). */
export const SESSIZ = SES_TAMPON

/** Background work after the stream (Vercel freezes the function otherwise). Tracked so tests can await it. */
const arkaIsler = new Set<Promise<unknown>>()
function arkaPlandaSurdur(p: Promise<unknown>): void {
  const izli = p.catch(() => {}).finally(() => { arkaIsler.delete(izli) })
  arkaIsler.add(izli)
  try {
    const mod = require('@vercel/functions') as { waitUntil?: (x: Promise<unknown>) => void }
    if (mod.waitUntil) mod.waitUntil(izli)
  } catch { /* yerel çalışma: söz zaten sürer */ }
}
/** Test helper: every background write of finished turns has settled. */
export async function sesArkaPlaniBekle(): Promise<void> {
  while (arkaIsler.size) await Promise.allSettled([...arkaIsler])
}

type ElMesaj = { role?: string; content?: unknown; kanal?: string }
type ElArac = { type?: string; function?: { name?: string }; name?: string }

function metin(icerik: unknown): string {
  if (typeof icerik === 'string') return icerik
  if (Array.isArray(icerik)) return icerik.map((p) => (p && typeof p === 'object' && typeof (p as { text?: unknown }).text === 'string' ? (p as { text: string }).text : '')).join(' ')
  return ''
}

function sozNorm(s: string): string {
  return String(s || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr-TR')
}

/** Konuşmanın son doktor cümlesi. Son mesaj doktorun değilse (ör. araç sonucu) cevaplanacak bir şey yoktur. */
export function sonDoktorCumlesi(mesajlar: unknown): string | null {
  const liste = Array.isArray(mesajlar) ? (mesajlar as ElMesaj[]) : []
  const son = liste[liste.length - 1]
  if (!son || son.role !== 'user') return null
  const t = metin(son.content).replace(/\s+/g, ' ').trim()
  return t ? t.slice(0, 4000) : null
}

/**
 * Pre-v2 replay check by text equality (kept for the Fish route and its tests). On the ElevenLabs route replays are
 * recognised by turn position (lib/asistan/sesTurYoneticisi.ts) — a doctor repeating himself is a NEW turn.
 */
export function cevaplanmisSonSoruMu(oturumMesajlari: unknown, mesaj: string): boolean {
  const hedef = sozNorm(mesaj)
  if (!hedef || devamIstegiMi(mesaj)) return false
  const liste = Array.isArray(oturumMesajlari) ? (oturumMesajlari as ElMesaj[]) : []
  for (let i = liste.length - 1; i >= 0; i--) {
    if (liste[i]?.role !== 'user') continue
    const t = metin(liste[i].content).replace(/\s+/g, ' ').trim()
    if (!t || devamIstegiMi(t) || sesGurultusuMu(t) || kendiSelamiMi(t)) continue
    if (sozNorm(t) !== hedef) return false
    const cevapVar = liste.slice(i + 1).some((m) => m.role === 'assistant' && metin(m.content).trim())
    return cevapVar && liste[i].kanal === 'ses'
  }
  return false
}

/** Client-tool round-trip (randevu_takvim on the non-tek-beyin agent): last message is the tool string. */
export function sonAracMetni(mesajlar: unknown): string | null {
  const liste = Array.isArray(mesajlar) ? (mesajlar as ElMesaj[]) : []
  const son = liste[liste.length - 1]
  if (!son || (son.role !== 'tool' && son.role !== 'function')) return null
  const t = metin(son.content).replace(/\s+/g, ' ').trim()
  return t ? t.slice(0, 4000) : null
}

const VEDA = /^(?:tamam\s+|peki\s+)?(?:(?:görüşmeyi|konuşmayı|aramayı)\s+(?:bitir|kapat|sonlandır)\w*|hoşça\s*kal\w*|görüşürüz|kapatabilirsin\w*|bitirelim)(?:\s+(?:hocam|ayşe|lütfen))*[.!]?$/i

export function vedaMi(mesaj: string): boolean {
  return VEDA.test(String(mesaj || '').trim().toLocaleLowerCase('tr-TR'))
}

function aracVarMi(araclar: unknown, ad: string): boolean {
  return Array.isArray(araclar) && (araclar as ElArac[]).some((a) => (a?.function?.name || a?.name) === ad)
}

/** SES-OMURGA-V2 (H): one per-turn timing record. Times in ms since the request body was read. */
type TurOlcumu = {
  karar?: string; rota?: string; neden?: string; ilkBayt?: number; ilkSoz?: number; modelIlk?: number; araclar?: string[]
}

export async function sesLlmPost(req: NextRequest): Promise<Response> {
  if (!sesSirriGecerliMi(req.headers)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const govde = (await req.json().catch(() => null)) as { messages?: unknown; tools?: unknown; model?: string; elevenlabs_extra_body?: Record<string, unknown> } | null
  if (!govde) return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  const jeton = sesJetonuDogrula(govde.elevenlabs_extra_body?.notya_jeton)
  if (!jeton) return NextResponse.json({ error: 'Geçersiz konuşma jetonu' }, { status: 401 })

  const varis = new Date()
  const ilkMesaj = sonDoktorCumlesi(govde.messages)
  const turNo = elTurNo(govde.messages)
  const cagri = jeton.c || `o:${jeton.o}`
  const kimlik = `chatcmpl-${randomUUID()}`
  const olusturma = Math.floor(Date.now() / 1000)
  const model = String(govde.model || 'notya-ayse')
  const enc = new TextEncoder()
  const skipVar = aracVarMi(govde.tools, 'skip_turn')

  // NOTYA-SES-SURE-01 / SES-OMURGA-V2 (H): where a voice turn's time goes (ms since the body was read; no text).
  const t0 = Date.now()
  const ani: Record<string, number> = {}
  const isaret = (k: string) => { if (ani[k] === undefined) ani[k] = Date.now() - t0 }
  const olcum: TurOlcumu = {}
  let kayit: SesTurKaydi | null = null
  let seq = 0
  /** HASTA-IZOLASYON-01: the session id goes into the timing row only once the DB proved it is this doctor's. */
  let oturumDogrulandi = false

  const akis = new ReadableStream<Uint8Array>({
    async start(controller) {
      let ilk = true
      let kapali = false
      let icerikGitti = false
      let aracGitti = false
      const gonder = (nesne: unknown) => {
        if (kapali) return
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(nesne)}\n\n`)) } catch { kapali = true }
      }
      const parca = (delta: Record<string, unknown>, bitis: string | null = null) => {
        if (typeof delta.content === 'string') {
          // GUARD (Kaan 2026-10-25): content with no letter or digit is never spoken (a click) — dropped, not turned into
          // whitespace. SES-OMURGA-V2: a superseded request says nothing more (ElevenLabs plays the newer one).
          if (!delta.content || !SESLENEBILIR.test(delta.content) || kayit?.iptalEdildi) {
            const { content: _c, ...geri } = delta
            if (!Object.keys(geri).length && !bitis) return
            delta = geri
          } else {
            icerikGitti = true
            isaret('ilkSoz')
            kayit?.yay(delta.content)
          }
        }
        gonder({
          id: kimlik, object: 'chat.completion.chunk', created: olusturma, model,
          choices: [{ index: 0, delta: ilk ? { role: 'assistant', ...delta } : delta, finish_reason: bitis }],
        })
        ilk = false
      }
      /** A raw spoken delta (already speech form) — used to serve a duplicate from the first request's stream. */
      const hamYay = (t: string) => parca({ content: t })
      const kapi = new SesYayKapisi((t) => { if (t) parca({ content: t }) })
      const yaz = (t: string, hemen = false) => kapi.ekle(t, hemen)
      let cevapSoylendi = false
      let turKapandi = false
      let soylenen = ''
      let bitis = 'stop'
      let mesaj = ilkMesaj
      // NOTYA-SES-ELEVEN-NORMAL-01: medical speech layer only on what ElevenLabs hears — screen stays written.
      const cevapYaz = (t: string) => {
        const temiz = sesEtiketTemizle(t)
        if (!temiz.trim()) return
        const okunus = elevenMetni(temiz, { detay: detayIstegiMi(mesaj || '') || devamIstegiMi(mesaj || '') })
        if (!okunus.trim()) return
        cevapSoylendi = true
        if (!turKapandi) soylenen += okunus.endsWith(' ') ? okunus : `${okunus} `
        yaz(okunus.endsWith(' ') ? okunus : `${okunus} `)
      }
      /** SES-OMURGA-V2 (C): this turn needs no answer — ElevenLabs stays silent and keeps listening. */
      const atla = (neden: string) => {
        olcum.rota = olcum.rota || `atla:${neden}`
        if (skipVar) {
          parca({ tool_calls: [{ index: 0, id: `call_${randomUUID().slice(0, 8)}`, type: 'function', function: { name: 'skip_turn', arguments: JSON.stringify({ reason: neden }) } }] })
          aracGitti = true
          bitis = 'tool_calls'
        }
      }
      const devamiOku = async (m: string): Promise<boolean> => {
        const kalan = await sesDevamAl(getSupabase(), jeton.d, jeton.o).catch(() => null)
        if (!kalan) return m === DEVAM_ISARETI
        const a = new SesAkisi(cevapYaz, undefined, undefined, Number.POSITIVE_INFINITY)
        a.ekle(kalan)
        a.bitir()
        return true
      }
      try {
        // The SSE opens before any DB/model work: the role chunk is the first byte, within milliseconds.
        parca({})
        isaret('ilkBayt')
        const aracSonucu = !mesaj ? sonAracMetni(govde.messages) : null
        if (aracSonucu) {
          cevapYaz(aracSonucu)
        } else if (!mesaj) {
          atla('bos')
        } else if (kesintiMesajiMi(mesaj)) {
          // NOTYA-AYSE-GURULTU-02: the remainder is already spoken form — no model, no session write.
          const kalan = kesintiKalani(mesaj)
          if (kalan) yaz(`${kalan} `)
        } else if ((asistaniKapatMi(mesaj) || vedaMi(mesaj)) && aracVarMi(govde.tools, 'end_call')) {
          yaz('Görüşmek üzere Hocam.', true)
          parca({ tool_calls: [{ index: 0, id: `call_${randomUUID().slice(0, 8)}`, type: 'function', function: { name: 'end_call', arguments: JSON.stringify({ reason: 'Doktor görüşmeyi bitirdi.' }) } }] })
          aracGitti = true
          bitis = 'tool_calls'
          olcum.rota = 'veda'
        } else if (kendiSelamiMi(mesaj)) {
          // The greeting came back through the microphone: not the doctor.
          atla('selam_eko')
        } else if (devamIstegiMi(mesaj) && (await devamiOku(mesaj))) {
          olcum.rota = 'devam'
        } else {
          // SES-OMURGA-V2 (C): pause / filler / scrap / Ayşe's own echo — judged against ElevenLabs' own history, no DB.
          const on = sesOnKapisi(mesaj, elSonAsistan(govde.messages))
          if (on) {
            atla(on.neden)
          } else {
            // SES-OMURGA-V2 (A): one utterance → one brain, latest wins.
            const k = sesTuruKarsila({ cagri, turNo, mesaj })
            olcum.karar = k.karar
            if (k.karar === 'kopya') {
              // The same turn again: serve what the first request says (what exists, then live) — no second brain.
              await k.kayit.paylas(hamYay)
              olcum.rota = 'kopya'
              if (!icerikGitti) atla('kopya')
            } else {
              kayit = k.kayit
              mesaj = k.metin
              await beyin(mesaj)
            }
          }
        }
      } catch (e) {
        if (!iptalMi(e)) {
          console.error('[ses-llm]', e instanceof Error ? e.name : 'hata')
          if (!kayit?.iptalEdildi) cevapYaz('Şu an dosyaya ulaşamadım Hocam, bir daha söyler misiniz?')
        }
      }
      // Flush the breath still held in the gate BEFORE the SSE closes, including on a cut.
      kapi.bitir()
      isaret('bitis')
      if (!icerikGitti && !aracGitti) {
        // Never whitespace-only: the documented buffer chunk, sent directly (it carries no letter, so not via the guard).
        gonder({ id: kimlik, object: 'chat.completion.chunk', created: olusturma, model, choices: [{ index: 0, delta: ilk ? { role: 'assistant', content: SES_TAMPON } : { content: SES_TAMPON }, finish_reason: null }] })
        ilk = false
      }
      parca({}, bitis)
      if (!kapali) {
        try { controller.enqueue(enc.encode('data: [DONE]\n\n')); controller.close() } catch { /* bağlantı kapandı */ }
      }
      kayit?.bitir()
      olcumuYaz()

      /** The brain path: one DB round trip, the turn gate, then the decision / clinic / ayseCevapla. */
      async function beyin(m: string): Promise<void> {
        const J = jeton!
        const G = govde!
        const supabase = getSupabase()
        const ac = await sesTuruAcV2(supabase as never, { doktorId: J.d, oturumId: J.o, cagri, tur: turNo, mesaj: m, hastaId: J.p })
          .catch((e) => { console.error('[ses-llm/ac]', e instanceof Error ? e.name : 'hata'); return null })
        isaret('gecmis')
        if (!ac) { cevapYaz('Şu an dosyaya ulaşamadım Hocam, bir daha söyler misiniz?'); olcum.rota = 'db_hata'; return }
        if (ac.yok) { console.error('[ses-llm/ac]', 'oturum_yok'); olcum.rota = 'oturum_yok'; return }
        oturumDogrulandi = true
        seq = ac.seq
        if (kayit) kayit.seq = ac.seq
        olcum.karar = ac.karar === 'kopya' ? 'kopya_db' : olcum.karar === 'yeni' && ac.karar === 'ustune' ? 'ustune_db' : olcum.karar
        if (ac.karar === 'kopya') {
          // Another instance answered exactly this turn: say what it said (stored with the turn), no brain.
          const soz = String(ac.onceki?.soz || '').trim()
          olcum.rota = 'kopya'
          if (soz) hamYay(soz.endsWith(' ') ? soz : `${soz} `)
          return
        }
        const oturum = (ac.satir?.messages ?? []) as ElMesaj[]
        const tur = sesTurKapisi({ mesaj: m, oturumMesajlari: oturum, el: true })
        olcum.neden = tur.neden
        if (tur.tip === 'sessiz') { atla(tur.neden); return }
        if (tur.tip === 'devam_oku') { await devamiOku(m); olcum.rota = 'devam'; return }
        if (tur.tip === 'veda' && aracVarMi(G.tools, 'end_call')) {
          yaz('Görüşmek üzere Hocam.', true)
          parca({ tool_calls: [{ index: 0, id: `call_${randomUUID().slice(0, 8)}`, type: 'function', function: { name: 'end_call', arguments: JSON.stringify({ reason: 'Doktor görüşmeyi bitirdi.' }) } }] })
          aracGitti = true
          bitis = 'tool_calls'
          olcum.rota = 'veda'
          return
        }
        yaz(dolguSec(m, { onay: sesOnayMetniGecerliMi(m), vazgec: sesVazgecMetniMi(m), sosyal: netSosyalMi(m) }), true)
        // SES-DOLGU-02: optional server filler (OFF unless NOTYA_SES_DOLGU_MS) — the 3 s filler is ElevenLabs' soft timeout.
        const dolguMs = dolguGecikmesiMs()
        const bekletme = dolguMs > 0 && !netSosyalMi(m)
          ? setTimeout(() => { if (!cevapSoylendi && !turKapandi && !kapali && !kayit?.iptalEdildi) { isaret('bekletme'); yaz(bekletmeSec(oturum.length), true) } }, dolguMs)
          : null
        // SES-OMURGA-V2: content well inside ElevenLabs' cascade timeout, whatever the model does.
        const ilkSozBekci = setTimeout(() => {
          if (!cevapSoylendi && !turKapandi && !kapali && !kayit?.iptalEdildi) { isaret('bekletme'); cevapYaz(ILK_SOZ_BEKLETME) }
        }, ILK_SOZ_BEKCI_MS)
        const zamanlayicilariKapat = () => { if (bekletme) clearTimeout(bekletme); clearTimeout(ilkSozBekci) }
        const klinikSlug = klinikSlugJetonndan(J.pe)
        try {
          if (klinikSlug) {
            // NOTYA-TEK-BEYIN-CORE-01: klinik experts use the same mouth; brain is klinikCevapla (no chart tools).
            const klinik = await klinikCevapla({ slug: klinikSlug, mesaj: m, doctorId: J.d, sozParcasi: cevapYaz })
            if (!klinik.ok && !cevapSoylendi) cevapYaz('Şu an yanıt veremedim, bir daha söyler misiniz?')
            olcum.rota = 'klinik'
            return
          }
          // Spoken yes/no to a pending card is not a model turn (the tap's spine). Calendar questions skip the read.
          const karar = (takvimSorusuMu(m) || takvimTakibiMi(m)) ? null : await sesliKarariUygula(supabase, J.d, J.o, m, J.tz || null)
          isaret('kararMs')
          if (karar) {
            cevapYaz(karar.soz)
            olcum.rota = 'karar'
            await sesDevamAl(supabase, J.d, J.o).catch(() => null)
            return
          }
          // NOTYA-SES-ERKEN-01 / DEVAM-01: the VOICE turn ends at the guard; the screen answer keeps generating in the
          // background and the page reads the rest with a hidden [devam] turn.
          let sesSinirCoz: () => void = () => {}
          let sinirGeldi = false
          const sesSiniri = new Promise<void>((r) => { sesSinirCoz = r })
          const sonucSozu = ayseCevapla({
            supabase, doktorId: J.d, oturumId: J.o, oturumSatiri: ac.satir as unknown as Record<string, unknown> | null, mesaj: m, kanal: 'ses', saglayici: 'elevenlabs',
            specialty: J.s, patientId: J.p, personaId: J.pe || null, saatDilimi: J.tz || null, sozParcasi: cevapYaz,
            sesSiniri: () => { sinirGeldi = true; sesSinirCoz() },
            sesDurumu: () => ({ kesildi: sinirGeldi || turKapandi, soylenen }),
            sinyal: kayit?.iptal.signal,
            onYukleme: ac.yedek ? null : { profil: ac.profil, tercih: ac.tercih, hastaSahibi: ac.hastaSahibi, acikHasta: ac.acikHasta, acikHastaSahibi: ac.acikHastaSahibi, surumler: ac.surumler },
            yazimiErtele: arkaPlandaSurdur,
            sesTur: ac.yedek ? null : { cagri, tur: turNo, seq: ac.seq, soylenen: () => soylenen.trim() },
            modelIlkParca: (ms) => { olcum.modelIlk = ms },
            araclarRaporu: (adlar) => { olcum.araclar = adlar },
          })
          const sonrasi = sonucSozu.then(async (sonuc) => {
            if (kayit?.iptalEdildi) return
            if (!sonuc.ok) { cevapYaz(sonuc.soz); olcum.rota = 'hata'; return }
            olcum.rota = sonuc.cevap.rota
            if (!cevapSoylendi) {
              if (sonuc.cevap.konusma) cevapYaz(sonuc.cevap.konusma)
              else if (!sesGurultusuMu(m)) cevapYaz('Ekranınıza yazdım Hocam.')
            }
            if (sonuc.cevap.kartlar.length) await eskiSesTaslaklariniCek(supabase, J.d, sonuc.cevap.oncekiBekleyen || [], sonuc.cevap.kartlar, sonuc.cevap.kartHastaId ?? null)
          }).catch((e) => {
            if (iptalMi(e) || kayit?.iptalEdildi) { olcum.rota = 'iptal'; return }
            console.error('[ses-llm/arka]', e instanceof Error ? e.name : 'hata')
            if (!cevapSoylendi && !turKapandi) cevapYaz('Şu an cevap veremedim Hocam, bir daha söyler misiniz?')
          })
          const bekci = new Promise<'bekci'>((r) => setTimeout(() => r('bekci'), SES_BEKCI_MS))
          const iptal = new Promise<'iptal'>((r) => { const s = kayit?.iptal.signal; if (s) s.addEventListener('abort', () => r('iptal'), { once: true }) })
          const kim = await Promise.race([sonrasi.then(() => 'bitti' as const), sesSiniri.then(() => 'sinir' as const), bekci, iptal])
          if (kim !== 'bitti') {
            if (kim === 'bekci' && !cevapSoylendi) cevapYaz('Dosyayı inceliyorum Hocam, cevabı ekranınıza yazıyorum.')
            // Close the gate BEFORE turKapandi so a sentence still in the breath is sent and counted.
            kapi.bitir()
            turKapandi = true
            if (kim !== 'iptal') arkaPlandaSurdur(sonrasi)
          }
        } finally {
          zamanlayicilariKapat()
        }
      }

      function olcumuYaz(): void {
        const J = jeton!
        const toplam = Date.now() - t0
        const satir = {
          doctor_id: J.d, oturum_id: oturumDogrulandi ? J.o : null, cagri: cagri.slice(0, 64), tur_no: turNo, seq,
          karar: olcum.karar || null, rota: olcum.rota || null, neden: olcum.neden || null,
          ustune_yazildi: Boolean(kayit?.iptalEdildi), iptal: olcum.rota === 'iptal',
          varis: varis.toISOString(), ilk_bayt_ms: ani.ilkBayt ?? null, ilk_soz_ms: ani.ilkSoz ?? null,
          model_ttft_ms: olcum.modelIlk ?? null, toplam_ms: toplam,
          araclar: olcum.araclar ?? null, arac_sayisi: olcum.araclar ? olcum.araclar.length : null,
          bolge: process.env.VERCEL_REGION || null,
        }
        console.log('[ses-llm/tur]', JSON.stringify({ ...satir, doctor_id: undefined, oturum_id: undefined, ...ani }))
        arkaPlandaSurdur((async () => {
          try { await getSupabase().from('ses_tur_olcum').insert(satir) } catch { /* ölçüm turu asla düşürmez */ }
        })())
      }
    },
  })

  return new Response(akis, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' },
  })
}
