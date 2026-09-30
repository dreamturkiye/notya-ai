/**
 * NOTYA-FISH-AYSE-02 — Ayşe spoken turn. Doctor Bearer auth (no ElevenLabs).
 * Same brain as written chat (ayseCevapla, kanal ses). Speech chunks SSE as they exist.
 *
 * NOTYA-FISH-WS-01 — when the browser sends `ses: "ws"` and NOTYA_FISH_WS is not `0`, one Fish
 * live socket is opened for the turn (in parallel with the LLM). Finished sentences go to the
 * socket as the model writes; PCM comes back as `ses` events (base64) on this same SSE, so the
 * browser never holds a Fish credential. Event order: `ses_hazir` (before the first `soz`) →
 * `soz`* → `soz_bit` → `ses`* → `ses_bit` → `bit`. Socket failure before the first sentence: no
 * `ses_hazir`, browser speaks per sentence via /fish-ses as before. Failure mid-turn: `ses_dus`
 * with the transcript offset already handed to Fish; the browser speaks the rest via REST.
 */
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ayseCevapla } from '@/lib/asistan/ayseCevapla'
import { CumleKesici, fishWsAcikMi, pcmBase64 } from '@/lib/asistan/fishWs'
import { fishWsAc, type FishWsOturumu } from '@/lib/asistan/fishWsSunucu'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { istekSaatDilimi } from '@/lib/doktor/saatDilimi'
import { saatDilimiSec } from '@/lib/randevu/tarihCozumle'

export const runtime = 'nodejs'
export const maxDuration = 60
// NOTYA-FISH-BOLGE-01: this route makes the most Supabase calls of the voice loop; Supabase is us-east-1.
export const preferredRegion = ['iad1']

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
    ses?: unknown
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

  const anahtar = process.env.FISH_API_KEY || ''
  const wsIstendi = govde?.ses === 'ws' && fishWsAcikMi() && Boolean(anahtar)

  const enc = new TextEncoder()
  let kapali = false
  let wsOturum: FishWsOturumu | null = null
  const akis = new ReadableStream<Uint8Array>({
    async start(controller) {
      const gonder = (nesne: unknown) => {
        if (kapali) return
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(nesne)}\n\n`)) } catch { kapali = true }
      }
      // Socket opens while the LLM thinks; the first sentence never waits for the handshake.
      const t0 = Date.now()
      const kesici = new CumleKesici()
      let wsAktif = false
      let wsBildirildi = false
      let wsHata: string | null = null
      let sesBayt = 0
      let ilkSesMs: number | null = null
      const dus = (neden: string) => {
        if (!wsAktif) return
        wsAktif = false
        wsHata = neden
        gonder({ t: 'ses_dus', islenen: kesici.islenen.length })
        wsOturum?.kapat()
      }
      const wsHazir: Promise<boolean> = wsIstendi
        ? fishWsAc({
            anahtar,
            onSes: (pcm) => {
              if (ilkSesMs === null) ilkSesMs = Date.now() - t0
              sesBayt += pcm.byteLength
              if (wsAktif) gonder({ t: 'ses', b: pcmBase64(pcm) })
            },
            onHata: dus,
          }).then((o) => { wsOturum = o; return !kapali }).catch((e) => { wsHata = e instanceof Error ? e.message : 'hata'; return false })
        : Promise.resolve(false)
      let zincir: Promise<void> = Promise.resolve()
      const sozParcasi = (p: string) => {
        zincir = zincir.then(async () => {
          if (!wsBildirildi) {
            wsBildirildi = true
            wsAktif = await wsHazir
            if (wsAktif) gonder({ t: 'ses_hazir' })
          }
          gonder({ t: 'soz', m: p })
          if (!wsAktif || !wsOturum) return
          for (const c of kesici.ekle(p)) if (!wsOturum.metin(c)) dus('ws_yazma')
        })
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
          sozParcasi: (p) => { if (p) { soylendi = true; sozParcasi(p) } },
        })
        if (!sonuc.ok) gonder({ t: 'hata', m: sonuc.soz })
        else if (!soylendi && sonuc.cevap.konusma) sozParcasi(sonuc.cevap.konusma)
        await zincir
        gonder({ t: 'soz_bit' })
        if (wsAktif && wsOturum) {
          for (const c of kesici.bitir()) if (!wsOturum.metin(c)) dus('ws_yazma')
        }
        if (wsAktif && wsOturum) {
          await wsOturum.bitir()
          if (wsAktif) gonder({ t: 'ses_bit' })
        }
        if (wsIstendi) {
          console.info('[fish-ws]', {
            ws: wsAktif ? 'tam' : (wsBildirildi && wsHata ? 'dustu' : 'acilmadi'), hata: wsHata, ilk_ses_ms: ilkSesMs,
            ses_bayt: sesBayt, karakter: kesici.birikim.length, sure_ms: Date.now() - t0,
          })
        }
        gonder({ t: 'bit' })
      } catch (e) {
        console.error('[fish-tur]', e instanceof Error ? e.name : 'hata')
        gonder({ t: 'hata', m: 'Şu an cevap veremiyorum Hocam.' })
        gonder({ t: 'bit' })
      }
      kapali = true
      // The socket may still be handshaking on an early error path — close it whenever it settles.
      void wsHazir.then(() => wsOturum?.kapat())
      try { controller.close() } catch { /* */ }
    },
    cancel() {
      // Browser aborted (barge-in after the text finished, or a newer turn): stop paying Fish.
      kapali = true
      wsOturum?.kapat()
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
