/**
 * NOTYA-FISH-AYSE-02 — Ayşe spoken turn. Doctor Bearer auth (no ElevenLabs).
 * Same brain as written chat (ayseCevapla, kanal ses). Speech chunks SSE as they exist.
 *
 * NOTYA-FISH-WS-01 — when the browser sends `ses: "ws"` and NOTYA_FISH_WS is not `0`, one Fish
 * live socket is opened for the turn. Word-sized text events go to the socket as Luna writes;
 * PCM comes back as `ses` events (base64) on this same SSE, so the browser never holds a Fish
 * credential. Event order: `stt` (or `atlandi` / `kapat`) → `ses_hazir` (before the first `soz`) →
 * `soz`* → `soz_bit` → `ses`* → `ses_bit` → `bit`. The socket opens while Transcribe-1 runs so
 * handshake overlaps ASR. Socket failure before the first word: no `ses_hazir`, browser speaks
 * via /fish-ses as before. Failure mid-turn: `ses_dus` with the transcript offset already handed
 * to Fish; the browser speaks the rest via REST.
 *
 * NOTYA-FISH-HAVUZ-01 — the turn's socket comes from fishWsHavuzu(): a socket pre-opened when the
 * previous turn ended (or by the `isit` warm-up the browser sends once the mic is granted), so the
 * doctor's sentence never waits for a Fish handshake. `{ isit: true, asistanSessionId }` warms
 * this instance (socket pre-open + one tiny REST TTS on the keep-alive agent) and returns JSON.
 */
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { kendiSelamiMi } from '@/lib/asistan/acilis'
import { ayseCevapla } from '@/lib/asistan/ayseCevapla'
import { fishAsrBlob } from '@/lib/asistan/fishAsr'
import { FISH_KLIP_AZAMI_BAYT, fishAsrDilUyumluMu } from '@/lib/asistan/fishSes'
import { KelimeKesici, fishWsAcikMi, pcmBase64 } from '@/lib/asistan/fishWs'
import { fishWsHavuzu } from '@/lib/asistan/fishWsHavuz'
import type { FishWsOturumu } from '@/lib/asistan/fishWsSunucu'
import { fishIsinma } from '@/lib/asistan/fishIsinma'
import { sesGurultusuMu } from '@/lib/asistan/sesGurultu'
import { asistaniKapatMi } from '@/lib/asistan/uyandirSoz'
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

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

async function turGirdi(req: NextRequest): Promise<{
  mesaj: string
  audio: Blob | null
  asistanSessionId: string
  specialty: string
  personaId: string
  patientId: string
  ses: string
  saatDilimi: string | null
  isit: boolean
} | null> {
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('multipart/form-data')) {
    const form = await req.formData().catch(() => null)
    if (!form) return null
    const ses = form.get('audio')
    return {
      mesaj: str(form.get('mesaj')).slice(0, 4000),
      audio: ses instanceof Blob && ses.size ? ses : null,
      asistanSessionId: str(form.get('asistanSessionId')),
      specialty: str(form.get('specialty')),
      personaId: str(form.get('personaId')),
      patientId: str(form.get('patientId')),
      ses: str(form.get('ses')),
      saatDilimi: str(form.get('saatDilimi')) || null,
      isit: str(form.get('isit')) === '1',
    }
  }
  const govde = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!govde) return null
  return {
    mesaj: str(govde.mesaj).slice(0, 4000),
    audio: null,
    asistanSessionId: str(govde.asistanSessionId),
    specialty: str(govde.specialty),
    personaId: str(govde.personaId),
    patientId: str(govde.patientId),
    ses: str(govde.ses),
    saatDilimi: str(govde.saatDilimi) || null,
    isit: govde.isit === true || govde.isit === '1',
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Yetkisiz' }), { status: 401 })
  }
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7))
  if (!user) return new Response(JSON.stringify({ error: 'Geçersiz token' }), { status: 401 })

  const girdi = await turGirdi(req)
  const oturumId = girdi?.asistanSessionId || ''
  if (!girdi || !oturumId) {
    return new Response(JSON.stringify({ error: 'Eksik' }), { status: 400 })
  }
  if (girdi.audio && girdi.audio.size > FISH_KLIP_AZAMI_BAYT) {
    return new Response(JSON.stringify({ error: 'Ses çok uzun' }), { status: 413 })
  }

  const { data: oturum } = await supabase
    .from('asistan_sessions')
    .select('id')
    .eq('id', oturumId)
    .eq('doctor_id', user.id)
    .maybeSingle()
  if (!oturum) return new Response(JSON.stringify({ error: 'Oturum bulunamadı' }), { status: 404 })

  if (girdi.isit) {
    const anahtar = process.env.FISH_API_KEY || ''
    if (!anahtar) return new Response(JSON.stringify({ error: 'Ses motoru yok' }), { status: 503 })
    const ws = fishWsAcikMi()
    if (ws) fishWsHavuzu().hazirla(anahtar)
    const sonuc = await fishIsinma(anahtar)
    console.info('[fish-isinma]', { ws, ...sonuc })
    return new Response(JSON.stringify({ ok: true, ws, ...sonuc }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  // NOTYA-TAKVIM-TZ-01: doctor's timezone — body first, then the notya_tz cookie, then TRT.
  const saatDilimi = saatDilimiSec(girdi.saatDilimi, istekSaatDilimi())
  const istenenHasta = girdi.patientId
  const patientId = istenenHasta && (await hastaSahibiMi(supabase, user.id, istenenHasta)) ? istenenHasta : null

  const anahtar = process.env.FISH_API_KEY || ''
  if (girdi.audio && !anahtar) {
    return new Response(JSON.stringify({ error: 'Ses motoru yok' }), { status: 503 })
  }
  const wsIstendi = girdi.ses === 'ws' && fishWsAcikMi() && Boolean(anahtar)

  const enc = new TextEncoder()
  let kapali = false
  // NOTYA-SES-TUR-02: the browser's `cancel()` below used to stop only the SSE/Fish socket -- the
  // in-flight ayseCevapla() brain call kept running and could still write its answer afterwards.
  const turSinyali = new AbortController()
  let wsOturum: FishWsOturumu | null = null
  const akis = new ReadableStream<Uint8Array>({
    async start(controller) {
      const gonder = (nesne: unknown) => {
        if (kapali) return
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(nesne)}\n\n`)) } catch { kapali = true }
      }
      const t0 = Date.now()
      const kesici = new KelimeKesici()
      let wsAktif = false
      let wsBildirildi = false
      let wsHata: string | null = null
      let havuzdan = false
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
        ? fishWsHavuzu().al(anahtar).then(({ oturum, havuzdan: h }) => {
            oturum.bagla({
              onSes: (pcm) => {
                if (ilkSesMs === null) ilkSesMs = Date.now() - t0
                sesBayt += pcm.byteLength
                if (wsAktif) gonder({ t: 'ses', b: pcmBase64(pcm) })
              },
              onHata: dus,
            })
            wsOturum = oturum
            havuzdan = h
            return !kapali
          }).catch((e) => { wsHata = e instanceof Error ? e.message : 'hata'; return false })
        : Promise.resolve(false)
      const asrSozu = girdi.audio
        ? fishAsrBlob(anahtar, girdi.audio, '[fish-tur]')
        : Promise.resolve(null)
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
      const bitirWs = async () => {
        await zincir
        if (wsAktif && wsOturum) {
          for (const c of kesici.bitir()) if (!wsOturum.metin(c)) dus('ws_yazma')
        }
        if (wsAktif && wsOturum) {
          await wsOturum.bitir()
          if (wsAktif) gonder({ t: 'ses_bit' })
        }
        if (wsIstendi) {
          console.info('[fish-ws]', {
            ws: wsAktif ? 'tam' : (wsBildirildi && wsHata ? 'dustu' : 'acilmadi'), hata: wsHata, havuzdan, ilk_ses_ms: ilkSesMs,
            ses_bayt: sesBayt, karakter: kesici.birikim.length, sure_ms: Date.now() - t0,
          })
        }
      }
      try {
        const asr = await asrSozu
        let mesaj = girdi.mesaj
        if (asr) {
          if (asr.tur === 'hata') {
            gonder({ t: 'hata', m: 'Sesinizi çözemedim Hocam, tekrar söyler misiniz?' })
            gonder({ t: 'bit' })
            return
          }
          if (asr.tur === 'atlandi') {
            gonder({ t: 'atlandi', neden: asr.neden })
            gonder({ t: 'bit' })
            return
          }
          mesaj = asr.metin.trim().slice(0, 4000)
        }
        if (!mesaj) {
          gonder({ t: 'atlandi', neden: 'bos' })
          gonder({ t: 'bit' })
          return
        }
        if (sesGurultusuMu(mesaj) || !fishAsrDilUyumluMu(mesaj) || kendiSelamiMi(mesaj)) {
          gonder({ t: 'atlandi', neden: kendiSelamiMi(mesaj) ? 'selam' : 'gurultu' })
          gonder({ t: 'bit' })
          return
        }
        if (asistaniKapatMi(mesaj)) {
          gonder({ t: 'kapat', m: mesaj })
          gonder({ t: 'bit' })
          return
        }
        gonder({ t: 'stt', m: mesaj })
        let soylendi = false
        const sonuc = await ayseCevapla({
          supabase,
          doktorId: user.id,
          oturumId,
          mesaj,
          kanal: 'ses',
          specialty: girdi.specialty || 'pediatri',
          personaId: girdi.personaId || 'aysekaya',
          patientId,
          saatDilimi,
          sinyal: turSinyali.signal,
          sozParcasi: (p) => { if (p) { soylendi = true; sozParcasi(p) } },
        })
        if (!sonuc.ok) gonder({ t: 'hata', m: sonuc.soz })
        else if (!soylendi && sonuc.cevap.konusma) sozParcasi(sonuc.cevap.konusma)
        gonder({ t: 'soz_bit' })
        await bitirWs()
        gonder({ t: 'bit' })
      } catch (e) {
        console.error('[fish-tur]', e instanceof Error ? e.name : 'hata')
        gonder({ t: 'hata', m: 'Şu an cevap veremiyorum Hocam.' })
        gonder({ t: 'bit' })
      } finally {
        kapali = true
        void wsHazir.then(() => wsOturum?.kapat())
        // NOTYA-FISH-HAVUZ-01: the next sentence's socket opens while the doctor listens.
        if (wsIstendi) fishWsHavuzu().hazirla(anahtar)
        try { controller.close() } catch { /* */ }
      }
    },
    cancel() {
      kapali = true
      turSinyali.abort()
      wsOturum?.kapat()
      // NOTYA-SES-TUR-01: the browser cancels a turn to merge two sentences / barge in and sends the next
      // one at once — pre-open its socket now rather than when the abandoned brain call returns.
      if (wsIstendi) fishWsHavuzu().hazirla(anahtar)
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
