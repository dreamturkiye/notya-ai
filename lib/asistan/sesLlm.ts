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
 * (ya da doktor "devam" deyince) modelsiz, sınırsız okunur.
 * Günlüğe klinik içerik yazılmaz — yalnız hata türü.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { sesTurunuYurut, vedaMi } from '@/lib/asistan/sesTuru'
import { sesJetonuDogrula, sesSirriGecerliMi } from '@/lib/asistan/sesJetonu'

export { vedaMi }

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
)

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
      // Tur kuralları (selam, devam, sözlü onay, model, sınır / bekçi) lib/asistan/sesTuru.ts'te — Fish ucuyla ortak.
      const sonuc = await sesTurunuYurut({
        supabase: getSupabase, doktorId: jeton.d, oturumId: jeton.o, specialty: jeton.s, patientId: jeton.p,
        personaId: jeton.pe || null, mesaj,
        yay: (t) => { parca({ content: t }); ilk = false },
        // ElevenLabs sistem aracı: yalnız ajan end_call'u tanımladıysa veda cümlesi görüşmeyi kapatır.
        veda: aracVarMi(govde.tools, 'end_call')
          ? () => {
            parca({ tool_calls: [{ index: 0, id: `call_${randomUUID().slice(0, 8)}`, type: 'function', function: { name: 'end_call', arguments: JSON.stringify({ reason: 'Doktor görüşmeyi bitirdi.' }) } }] })
            ilk = false
          }
          : null,
      })
      parca({}, sonuc.veda ? 'tool_calls' : 'stop')
      if (!kapali) {
        try { controller.enqueue(enc.encode('data: [DONE]\n\n')); controller.close() } catch { /* bağlantı kapandı */ }
      }
    },
  })

  return new Response(akis, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' },
  })
}
