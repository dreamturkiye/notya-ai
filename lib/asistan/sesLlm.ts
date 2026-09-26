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
 * Günlüğe klinik içerik yazılmaz — yalnız hata türü.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { ayseCevapla } from '@/lib/asistan/ayseCevapla'
import { DEVAMI_EKRANDA, dolguSec } from '@/lib/asistan/konusma'
import { waitUntil } from '@vercel/functions'
import { sesJetonuDogrula, sesSirriGecerliMi } from '@/lib/asistan/sesJetonu'
import { eskiSesTaslaklariniCek, sesliKarariUygula } from '@/lib/asistan/sesliOnay'
import { sesOnayMetniGecerliMi, sesVazgecMetniMi } from '@/core/eylemler/sesKapilari'
import { netSosyalMi } from '@/lib/ai/modeller'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
)

/** NOTYA-SES-ERKEN-01: the voice turn never runs longer than this; the screen answer is not bound by it. */
const SES_BEKCI_MS = 22_000
/** Keep a background promise alive after the SSE closes (Vercel freezes the function otherwise). */
function arkaPlandaSurdur(p: Promise<unknown>): void {
  try { waitUntil(p) } catch { void p /* yerel çalışma: söz zaten sürer */ }
}

type ElMesaj = { role?: string; content?: unknown }
type ElArac = { type?: string; function?: { name?: string }; name?: string }

function metin(icerik: unknown): string {
  if (typeof icerik === 'string') return icerik
  if (Array.isArray(icerik)) return icerik.map((p) => (p && typeof p === 'object' && typeof (p as { text?: unknown }).text === 'string' ? (p as { text: string }).text : '')).join(' ')
  return ''
}

/** Konuşmanın son doktor cümlesi. Son mesaj doktorun değilse (ör. araç sonucu) cevaplanacak bir şey yoktur. */
export function sonDoktorCumlesi(mesajlar: unknown): string | null {
  const liste = Array.isArray(mesajlar) ? (mesajlar as ElMesaj[]) : []
  const son = liste[liste.length - 1]
  if (!son || son.role !== 'user') return null
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
      const gonder = (nesne: unknown) => {
        if (kapali) return
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(nesne)}\n\n`)) } catch { kapali = true }
      }
      const parca = (delta: Record<string, unknown>, bitis: string | null = null) => gonder({
        id: kimlik, object: 'chat.completion.chunk', created: olusturma, model,
        choices: [{ index: 0, delta: ilk ? { role: 'assistant', ...delta } : delta, finish_reason: bitis }],
      })
      const yaz = (t: string) => { if (!t) return; parca({ content: t }); ilk = false }
      let cevapSoylendi = false
      const cevapYaz = (t: string) => { if (t.trim()) cevapSoylendi = true; yaz(t) }
      let bitis = 'stop'
      try {
        if (mesaj && vedaMi(mesaj) && aracVarMi(govde.tools, 'end_call')) {
          yaz('Görüşmek üzere Hocam.')
          parca({ tool_calls: [{ index: 0, id: `call_${randomUUID().slice(0, 8)}`, type: 'function', function: { name: 'end_call', arguments: JSON.stringify({ reason: 'Doktor görüşmeyi bitirdi.' }) } }] })
          ilk = false
          bitis = 'tool_calls'
        } else if (mesaj) {
          yaz(dolguSec(mesaj, { onay: sesOnayMetniGecerliMi(mesaj), vazgec: sesVazgecMetniMi(mesaj), sosyal: netSosyalMi(mesaj) }))
          const supabase = getSupabase()
          // Sözlü onay / ret bir model turu değildir: bekleyen kart varsa dokunuşun omurgasından geçer, model çağrılmaz.
          const karar = await sesliKarariUygula(supabase, jeton.d, jeton.o, mesaj)
          if (karar) {
            cevapYaz(karar.soz)
          } else {
            // NOTYA-SES-ERKEN-01 (Dr. Gökhan, 2026-09-26 — "Bağlantı kurulamadı"): ElevenLabs drops a Custom LLM
            // stream that runs ~30 s (LLM Cascade TimeoutError). Long file answers (özet, aşı, açık işler) take
            // longer than that on the screen. So the VOICE turn ends at the spoken cap ("Devamı ekranınızda") or
            // at the guard timer, whichever comes first; the screen answer keeps generating in the background.
            let sesSinirCoz: () => void = () => {}
            const sesSiniri = new Promise<void>((r) => { sesSinirCoz = r })
            const sonucSozu = ayseCevapla({
              supabase, doktorId: jeton.d, oturumId: jeton.o, mesaj, kanal: 'ses',
              specialty: jeton.s, patientId: jeton.p, personaId: jeton.pe || null, sozParcasi: cevapYaz,
              sesSiniri: () => sesSinirCoz(),
            })
            const sonrasi = sonucSozu.then(async (sonuc) => {
              if (!sonuc.ok) { cevapYaz(sonuc.soz); return }
              if (!cevapSoylendi) cevapYaz(sonuc.cevap.konusma || 'Ekranınıza yazdım Hocam.')
              if (sonuc.cevap.kartlar.length) await eskiSesTaslaklariniCek(supabase, jeton.d, sonuc.cevap.oncekiBekleyen || [], sonuc.cevap.kartlar, sonuc.cevap.kartHastaId ?? null)
            }).catch((e) => { console.error('[ses-llm/arka]', e instanceof Error ? e.name : 'hata') })
            const bekci = new Promise<'bekci'>((r) => setTimeout(() => r('bekci'), SES_BEKCI_MS))
            const kim = await Promise.race([sonrasi.then(() => 'bitti' as const), sesSiniri.then(() => 'sinir' as const), bekci])
            if (kim !== 'bitti') {
              if (kim === 'bekci') cevapYaz(cevapSoylendi ? DEVAMI_EKRANDA : 'Dosyayı inceliyorum Hocam, cevabı ekranınıza yazıyorum.')
              arkaPlandaSurdur(sonrasi)
            }
          }
        }
      } catch (e) {
        console.error('[ses-llm]', e instanceof Error ? e.name : 'hata')
        cevapYaz('Şu an dosyaya ulaşamadım Hocam, bir daha söyler misiniz?')
      }
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
