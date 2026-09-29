/**
 * NOTYA-FISH-AYSE-02 — Ayşe spoken turn. Doctor Bearer auth (no ElevenLabs).
 * Same brain as written chat (ayseCevapla, kanal ses). Speech chunks SSE as they exist.
 */
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ayseCevapla } from '@/lib/asistan/ayseCevapla'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { istekSaatDilimi } from '@/lib/doktor/saatDilimi'
import { saatDilimiSec } from '@/lib/randevu/tarihCozumle'

export const runtime = 'nodejs'
export const maxDuration = 60

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } },
)

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Yetkisiz' }), { status: 401 })
  }
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7))
  if (!user) return new Response(JSON.stringify({ error: 'Geçersiz token' }), { status: 401 })

  const govde = (await req.json().catch(() => null)) as {
    mesaj?: unknown
    asistanSessionId?: unknown
    specialty?: unknown
    personaId?: unknown
    patientId?: unknown
    saatDilimi?: unknown
  } | null
  const mesaj = typeof govde?.mesaj === 'string' ? govde.mesaj.trim().slice(0, 4000) : ''
  const oturumId = typeof govde?.asistanSessionId === 'string' ? govde.asistanSessionId.trim() : ''
  if (!mesaj || !oturumId) {
    return new Response(JSON.stringify({ error: 'Eksik' }), { status: 400 })
  }

  const { data: oturum } = await supabase
    .from('asistan_sessions')
    .select('id')
    .eq('id', oturumId)
    .eq('doctor_id', user.id)
    .maybeSingle()
  if (!oturum) return new Response(JSON.stringify({ error: 'Oturum bulunamadı' }), { status: 404 })

  // NOTYA-TAKVIM-TZ-01: doctor's timezone — body first, then the notya_tz cookie, then TRT.
  const saatDilimi = saatDilimiSec(typeof govde?.saatDilimi === 'string' ? govde.saatDilimi : null, istekSaatDilimi())
  const istenenHasta = typeof govde?.patientId === 'string' ? govde.patientId.trim() : ''
  const patientId = istenenHasta && (await hastaSahibiMi(supabase, user.id, istenenHasta)) ? istenenHasta : null

  const enc = new TextEncoder()
  const akis = new ReadableStream<Uint8Array>({
    async start(controller) {
      let kapali = false
      const gonder = (nesne: unknown) => {
        if (kapali) return
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(nesne)}\n\n`)) } catch { kapali = true }
      }
      try {
        let soylendi = false
        const sonuc = await ayseCevapla({
          supabase,
          doktorId: user.id,
          oturumId,
          mesaj,
          kanal: 'ses',
          specialty: typeof govde?.specialty === 'string' ? govde.specialty : 'pediatri',
          personaId: typeof govde?.personaId === 'string' ? govde.personaId : 'aysekaya',
          patientId,
          saatDilimi,
          sozParcasi: (p) => { if (p) { soylendi = true; gonder({ t: 'soz', m: p }) } },
        })
        if (!sonuc.ok) gonder({ t: 'hata', m: sonuc.soz })
        else if (!soylendi && sonuc.cevap.konusma) gonder({ t: 'soz', m: sonuc.cevap.konusma })
        gonder({ t: 'bit' })
      } catch (e) {
        console.error('[fish-tur]', e instanceof Error ? e.name : 'hata')
        gonder({ t: 'hata', m: 'Şu an cevap veremiyorum Hocam.' })
        gonder({ t: 'bit' })
      }
      try { controller.close() } catch { /* */ }
    },
  })
  return new Response(akis, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
