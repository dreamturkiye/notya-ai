/**
 * NOTYA-TEK-BEYIN — ElevenLabs Custom LLM ucu (OpenAI Chat Completions uyumlu, text/event-stream).
 *
 * ElevenLabs ajanı (test kopyası, scripts/tek-beyin-ajanlari.mts) LLM olarak bu ucu çağırır: yalnız dinler, sıra alır,
 * konuşur. Beyin burada: konuşmanın SON doktor cümlesi ayseCevapla'ya (kanal: 'ses') gider — ElevenLabs'in gönderdiği
 * geçmiş ve sistem promptu kullanılmaz; hafıza, yazılı sohbetle ORTAK asistan oturumudur.
 *
 * Güvenlik: iki kilit (lib/asistan/sesJetonu.ts) — sunucu sırrı başlığı VE imzalı konuşma jetonu
 * (elevenlabs_extra_body.notya_jeton). Doktor, oturum, branş, hasta YALNIZ jetondan okunur.
 * Hız: arama / model gerekiyorsa hemen kısa bir bekletme sözü ("Bakıyorum Hocam... "), sonra cevap model yazdıkça
 * (yazılı cevapla aynı içerik, doğal cümlelerle — lib/asistan/konusma.ts).
 * ElevenLabs sistem araçları (tools): yalnız end_call kullanılır (doktor görüşmeyi bitirince); diğerleri yok sayılır.
 * NOTYA-SES-DEVAM-01: kesilen sesli turun söylenmeyen kalanı (active_context.sesDevam) gizli `[devam]` turunda
 * (ya da doktor "devam" deyince) modelsiz, sınırsız okunur. Ayşe yalnız AYSE_SES_SAGLAYICI=fish iken bu rotaya
 * gelmez; kalanı Fish'te sayfa okur (NOTYA-SES-ELEVEN-GERI-01).
 * Günlüğe klinik içerik yazılmaz — yalnız hata türü.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { ayseCevapla } from '@/lib/asistan/ayseCevapla'
import { klinikCevapla } from '@/lib/asistan/klinikCevapla'
import { klinikSlugJetonndan } from '@/lib/asistan/agentSec'
import { kendiSelamiMi } from '@/lib/asistan/acilis'
import { DEVAM_ISARETI, devamIstegiMi, dolguSec, SesAkisi } from '@/lib/asistan/konusma'
import { elevenMetni } from '@/lib/asistan/elevenMetni'
import { detayIstegiMi } from '@/lib/ses/tibbiSeslendirme'
import { SesYayKapisi, sesEtiketTemizle } from '@/lib/asistan/sesYay'
import { sesDevamAl } from '@/lib/asistan/sesDevam'
import { sesJetonuDogrula, sesSirriGecerliMi } from '@/lib/asistan/sesJetonu'
import { eskiSesTaslaklariniCek, sesliKarariUygula } from '@/lib/asistan/sesliOnay'
import { sesOnayMetniGecerliMi, sesVazgecMetniMi } from '@/core/eylemler/sesKapilari'
import { netSosyalMi } from '@/lib/ai/modeller'
import { takvimSorusuMu, sesGurultusuMu, takvimTakibiMi } from '@/lib/randevu/takvimSorusu'
import { sesTurKapisi } from '@/lib/asistan/sesTurKapisi'
import { sesTurKilidiAl, sesTurKilidiBirak } from '@/lib/asistan/sesTurKilit'
import { asistaniKapatMi } from '@/lib/asistan/uyandirSoz'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
)

/** NOTYA-SES-ERKEN-01: the voice turn never runs longer than this; the screen answer is not bound by it. */
const SES_BEKCI_MS = 22_000
/** Keep a background promise alive after the SSE closes (Vercel freezes the function otherwise). */
function arkaPlandaSurdur(p: Promise<unknown>): void {
  try {
    const mod = require('@vercel/functions') as { waitUntil?: (x: Promise<unknown>) => void }
    if (mod.waitUntil) mod.waitUntil(p)
    else void p
  } catch { void p /* yerel çalışma: söz zaten sürer */ }
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
 * Hidden `[devam]` is sendUserMessage, but ElevenLabs often POSTs the previous doctor
 * question as the last user turn. A second model pass on that question is the double
 * isolation bubble; the empty third SSE is "Bağlantı kurulamadı".
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
    // Written-then-spoken is a real second turn. Only a VOICE user line already answered is EL replaying.
    return cevapVar && liste[i].kanal === 'ses'
  }
  return false
}

/**
 * Client-tool round-trip (randevu_takvim on the non-tek-beyin agent): last message is the
 * tool string. An empty Custom LLM reply here is what ElevenLabs reports as "Bağlantı kurulamadı".
 */
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

async function oturumMesajlari(supabase: ReturnType<typeof getSupabase>, doktorId: string, oturumId: string): Promise<ElMesaj[]> {
  const { data } = await supabase.from('asistan_sessions').select('messages').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
  const liste = (data as { messages?: ElMesaj[] } | null)?.messages
  return Array.isArray(liste) ? liste : []
}

function aracVarMi(araclar: unknown, ad: string): boolean {
  return Array.isArray(araclar) && (araclar as ElArac[]).some((a) => (a?.function?.name || a?.name) === ad)
}

export async function sesLlmPost(req: NextRequest): Promise<Response> {
  if (!sesSirriGecerliMi(req.headers)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const govde = (await req.json().catch(() => null)) as { messages?: unknown; tools?: unknown; model?: string; elevenlabs_extra_body?: Record<string, unknown> } | null
  if (!govde) return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  const jeton = sesJetonuDogrula(govde.elevenlabs_extra_body?.notya_jeton)
  if (!jeton) return NextResponse.json({ error: 'Geçersiz konuşma jetonu' }, { status: 401 })

  const mesaj = sonDoktorCumlesi(govde.messages)
  const kimlik = `chatcmpl-${randomUUID()}`
  const olusturma = Math.floor(Date.now() / 1000)
  const model = String(govde.model || 'notya-ayse')
  const enc = new TextEncoder()

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
        if (typeof delta.content === 'string' && delta.content) icerikGitti = true
        gonder({
          id: kimlik, object: 'chat.completion.chunk', created: olusturma, model,
          choices: [{ index: 0, delta: ilk ? { role: 'assistant', ...delta } : delta, finish_reason: bitis }],
        })
      }
      // NOTYA-SES-KILIT-01: sentences leave as one breath, not a drip and not a dump.
      // Expressive tags are stripped inside the gate. `hemen` is only the acknowledgement.
      const kapi = new SesYayKapisi((t) => { if (!t) return; parca({ content: t }); ilk = false })
      const yaz = (t: string, hemen = false) => kapi.ekle(t, hemen)
      let cevapSoylendi = false
      // NOTYA-SES-DEVAM-01: what actually reached ElevenLabs before the voice turn closed (the continuation starts after it).
      let turKapandi = false
      let soylenen = ''
      // NOTYA-SES-ELEVEN-NORMAL-01: medical speech layer only on what ElevenLabs hears — screen stays written.
      const cevapYaz = (t: string) => {
        const temiz = sesEtiketTemizle(t)
        if (!temiz.trim()) return
        const okunus = elevenMetni(temiz, {
          detay: detayIstegiMi(mesaj || '') || devamIstegiMi(mesaj || ''),
        })
        if (!okunus.trim()) return
        cevapSoylendi = true
        if (!turKapandi) soylenen += okunus.endsWith(' ') ? okunus : `${okunus} `
        yaz(okunus.endsWith(' ') ? okunus : `${okunus} `)
      }
      /**
       * NOTYA-SES-DEVAM-01: the rest of the cut turn, uncapped, sentence by sentence — no model call, no new screen
       * bubble (the screen already holds the full answer). A hidden [devam] with nothing left (already read, or the
       * doctor moved on) is not a question: nothing is said. A spoken "devam" with nothing left is a normal turn.
       */
      const devamiOku = async (m: string): Promise<boolean> => {
        const kalan = await sesDevamAl(getSupabase(), jeton.d, jeton.o).catch(() => null)
        if (!kalan) return m === DEVAM_ISARETI
        const akis = new SesAkisi(cevapYaz, undefined, undefined, Number.POSITIVE_INFINITY)
        akis.ekle(kalan)
        akis.bitir()
        return true
      }
      let bitis = 'stop'
      try {
        // Open the SSE before any DB/model work. Empty content + role is enough for
        // ElevenLabs to commit the user transcript; waiting for first speech was the
        // 10s "voice to text" delay (and the cascade timeout → "Bağlantı kurulamadı").
        parca({})
        ilk = false
        const aracSonucu = !mesaj ? sonAracMetni(govde.messages) : null
        if (aracSonucu) {
          cevapYaz(aracSonucu)
        } else if (mesaj && (asistaniKapatMi(mesaj) || vedaMi(mesaj)) && aracVarMi(govde.tools, 'end_call')) {
          yaz('Görüşmek üzere Hocam.', true)
          parca({ tool_calls: [{ index: 0, id: `call_${randomUUID().slice(0, 8)}`, type: 'function', function: { name: 'end_call', arguments: JSON.stringify({ reason: 'Doktor görüşmeyi bitirdi.' }) } }] })
          bitis = 'tool_calls'
        } else if (mesaj && kendiSelamiMi(mesaj)) {
          // Açılış cümlesi mikrofon veya ElevenLabs tarafından doktora ait sanıldı. Cevap yok.
          parca({ content: '.' })
        } else if (mesaj && devamIstegiMi(mesaj) && (await devamiOku(mesaj))) {
          // okundu (ya da söylenecek bir şey kalmadı — boş SSE aşağıda nokta ile tutulur)
        } else if (mesaj) {
          const supabase = getSupabase()
          const oturum = await oturumMesajlari(supabase, jeton.d, jeton.o)
          // NOTYA-SES-ARKA-01: eko / aynı istek / arka plan — model + dolgu yok (maliyet/hız).
          const tur = sesTurKapisi({ mesaj, oturumMesajlari: oturum })
          if (tur.tip === 'sessiz') {
            parca({ content: '.' })
          } else if (tur.tip === 'devam_oku') {
            // Birebir EL replay — kalanı oku, modeli yeniden çalıştırma.
            await devamiOku(mesaj)
          } else if (tur.tip === 'veda' && aracVarMi(govde.tools, 'end_call')) {
            yaz('Görüşmek üzere Hocam.', true)
            parca({ tool_calls: [{ index: 0, id: `call_${randomUUID().slice(0, 8)}`, type: 'function', function: { name: 'end_call', arguments: JSON.stringify({ reason: 'Doktor görüşmeyi bitirdi.' }) } }] })
            bitis = 'tool_calls'
          } else if (cevaplanmisSonSoruMu(oturum, mesaj)) {
            // NOTYA-SES-TEK-CEVAP-01: EL önceki ses sorusunu yeniden POST ederse ikinci beyin yok.
            await devamiOku(mesaj)
            if (!icerikGitti) parca({ content: '.' })
          } else {
          // NOTYA-BUYUME-KISA-01 / NOTYA-SES-TEK-CEVAP-01: kilit fail-closed — hata = ikinci tur yok.
          const kilitAlindi = await sesTurKilidiAl(supabase, jeton.d, jeton.o, mesaj).catch(() => false)
          if (!kilitAlindi) {
            parca({ content: '.' })
          } else {
          yaz(dolguSec(mesaj, { onay: sesOnayMetniGecerliMi(mesaj), vazgec: sesVazgecMetniMi(mesaj), sosyal: netSosyalMi(mesaj) }), true)
          // Sözlü onay / ret bir model turu değildir: bekleyen kart varsa dokunuşun omurgasından geçer, model çağrılmaz.
          // Takvim: modelsiz ve hızlı — bekleyen-kart okumasını atla.
          // NOTYA-TEK-BEYIN-CORE-01: klinik experts use the same Custom LLM mouth; brain is klinikCevapla (no chart tools).
          const klinikSlug = klinikSlugJetonndan(jeton.pe)
          try {
          if (klinikSlug) {
            const klinik = await klinikCevapla({ slug: klinikSlug, mesaj, doctorId: jeton.d, sozParcasi: cevapYaz })
            if (!klinik.ok && !cevapSoylendi) cevapYaz('Şu an yanıt veremedim, bir daha söyler misiniz?')
          } else {
          const karar = (takvimSorusuMu(mesaj) || takvimTakibiMi(mesaj)) ? null : await sesliKarariUygula(supabase, jeton.d, jeton.o, mesaj, jeton.tz || null)
          if (karar) {
            cevapYaz(karar.soz)
            await sesDevamAl(supabase, jeton.d, jeton.o).catch(() => null) // yeni gerçek tur: önceki turun kalanı düşer
          } else {
            // NOTYA-SES-ERKEN-01 (Dr. Gökhan, 2026-09-26 — "Bağlantı kurulamadı"): ElevenLabs drops a Custom LLM
            // stream that runs ~30 s (LLM Cascade TimeoutError). Long file answers (özet, aşı, açık işler) take
            // longer than that on the screen. So the VOICE turn ends at the spoken cap or at the guard timer,
            // whichever comes first; the screen answer keeps generating in the background.
            // NOTYA-SES-DEVAM-01: a cut turn is no longer the end of the answer — ayseCevapla stores the unspoken rest
            // and the /asistan page asks for it with a hidden [devam] turn as soon as the screen answer is ready.
            let sesSinirCoz: () => void = () => {}
            let sinirGeldi = false
            const sesSiniri = new Promise<void>((r) => { sesSinirCoz = r })
            const sonucSozu = ayseCevapla({
              supabase, doktorId: jeton.d, oturumId: jeton.o, mesaj, kanal: 'ses', saglayici: 'elevenlabs',
              specialty: jeton.s, patientId: jeton.p, personaId: jeton.pe || null, saatDilimi: jeton.tz || null, sozParcasi: cevapYaz,
              sesSiniri: () => { sinirGeldi = true; sesSinirCoz() },
              sesDurumu: () => ({ kesildi: sinirGeldi || turKapandi, soylenen }),
            })
            const sonrasi = sonucSozu.then(async (sonuc) => {
              if (!sonuc.ok) { cevapYaz(sonuc.soz); return }
              if (!cevapSoylendi) {
                if (sonuc.cevap.konusma) cevapYaz(sonuc.cevap.konusma)
                else if (!sesGurultusuMu(mesaj)) cevapYaz('Ekranınıza yazdım Hocam.')
              }
              if (sonuc.cevap.kartlar.length) await eskiSesTaslaklariniCek(supabase, jeton.d, sonuc.cevap.oncekiBekleyen || [], sonuc.cevap.kartlar, sonuc.cevap.kartHastaId ?? null)
            }).catch((e) => { console.error('[ses-llm/arka]', e instanceof Error ? e.name : 'hata') })
              .finally(() => { void sesTurKilidiBirak(supabase, jeton.d, jeton.o, mesaj).catch(() => {}) })
            const bekci = new Promise<'bekci'>((r) => setTimeout(() => r('bekci'), SES_BEKCI_MS))
            const kim = await Promise.race([sonrasi.then(() => 'bitti' as const), sesSiniri.then(() => 'sinir' as const), bekci])
            if (kim !== 'bitti') {
              // Nothing extra at a cut: the pause is the gap before the continuation. Only a turn that said nothing yet
              // gets a holding sentence (the continuation then reads the whole answer).
              // Close the gate BEFORE turKapandi so a sentence still in the breath is sent and counted,
              // and anything the background generates after the cut cannot sneak into this turn.
              if (kim === 'bekci' && !cevapSoylendi) cevapYaz('Dosyayı inceliyorum Hocam, cevabı ekranınıza yazıyorum.')
              kapi.bitir()
              turKapandi = true
              arkaPlandaSurdur(sonrasi)
            }
          }
          }
          } finally {
            // Takvim / klinik / karar yolları: kilit burada bırakılır. Arka plan ayse yolu finally'de bırakır.
            if (!turKapandi) await sesTurKilidiBirak(supabase, jeton.d, jeton.o, mesaj).catch(() => {})
          }
          }
          }
        }
      } catch (e) {
        console.error('[ses-llm]', e instanceof Error ? e.name : 'hata')
        cevapYaz('Şu an dosyaya ulaşamadım Hocam, bir daha söyler misiniz?')
      }
      // Flush the breath still held in the gate BEFORE the SSE closes, including on a cut,
      // so the sentences already counted in `soylenen` actually reach ElevenLabs.
      kapi.bitir()
      // Empty Custom LLM SSE (hidden `[devam]` with nothing left, or a replayed question)
      // is what ElevenLabs reports as "Bağlantı kurulamadı". A period keeps the socket;
      // Fish treats punctuation as noise and does not speak it.
      if (!icerikGitti) parca({ content: '.' })
      parca({}, bitis)
      if (!kapali) {
        try { controller.enqueue(enc.encode('data: [DONE]\n\n')); controller.close() } catch { /* bağlantı kapandı */ }
      }
    },
  })

  return new Response(akis, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' },
  })
}
