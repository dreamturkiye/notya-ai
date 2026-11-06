// ============================================================
// NOTYA-DEMO-EPOSTA-01 (Kaan, 2026-11-06) — POST /api/demo/cal-webhook
//
// Cal.com confirms demo bookings but sends the attendee no e-mail, so we send our own: in the booking country's
// language (lib/demo/calOnay/metinler.ts, keyed by the Cal.com event slug), with the time in the attendee's own time
// zone, the call link, an .ics invite and Cal.com's cancel / reschedule links for that booking.
//
// Cal.com → Settings → Developer → Webhooks: subscriber URL https://www.notya.io/api/demo/cal-webhook, triggers
// BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED, secret = CAL_WEBHOOK_SECRET (this project's env).
// Order of checks: rate limit (per IP) → body size → HMAC signature (X-Cal-Signature-256) → parse → known demo event
// → send (Resend, idempotent per booking + event + recipient). Nothing is stored.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { hizSiniri, istekIp } from '@/lib/belge/hizSiniri'
import { IMZA_BASLIGI, calImzasiGecerli, calOlayiCoz } from '@/lib/demo/calOnay/calOlayi'
import { demoEpostasi } from '@/lib/demo/calOnay/eposta'
import { demoEpostasiGonder } from '@/lib/demo/calOnay/gonder'
import { DEMO_ETKINLIKLERI } from '@/lib/demo/calOnay/metinler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const EN_FAZLA_BAYT = 64 * 1024
const sinir = hizSiniri(30, 60_000)

const yanit = (durum: number, govde: Record<string, unknown>) =>
  NextResponse.json(govde, { status: durum, headers: { 'Cache-Control': 'no-store' } })

export async function POST(req: NextRequest) {
  if (!sinir.izinli(istekIp(req.headers))) return yanit(429, { hata: 'cok-fazla-istek' })

  const sir = process.env.CAL_WEBHOOK_SECRET
  if (!sir) {
    console.error('[demo/cal-webhook] CAL_WEBHOOK_SECRET is not set — every delivery is refused.')
    return yanit(503, { hata: 'yapilandirilmamis' })
  }

  const uzunluk = Number(req.headers.get('content-length') || 0)
  if (uzunluk > EN_FAZLA_BAYT) return yanit(413, { hata: 'cok-buyuk' })
  const govde = await req.text()
  if (Buffer.byteLength(govde) > EN_FAZLA_BAYT) return yanit(413, { hata: 'cok-buyuk' })

  if (!calImzasiGecerli(govde, req.headers.get(IMZA_BASLIGI), sir)) return yanit(401, { hata: 'imza' })

  const c = calOlayiCoz(govde)
  if (c.tur === 'ping') return yanit(200, { tamam: true, ping: true })
  if (c.tur === 'yoksay') return yanit(200, { tamam: true, yoksayildi: c.neden })
  if (c.tur === 'hata') return yanit(400, { hata: c.neden })

  const r = c.r
  const etkinlik = DEMO_ETKINLIKLERI[r.etkinlik]
  if (!etkinlik) return yanit(200, { tamam: true, yoksayildi: `etkinlik:${r.etkinlik}` })

  const apiAnahtari = process.env.RESEND_API_KEY
  if (!apiAnahtari) {
    console.error('[demo/cal-webhook] RESEND_API_KEY is not set — demo e-mail not sent.', r.etkinlik, r.tetik)
    return yanit(503, { hata: 'eposta-yapilandirilmamis' })
  }

  const sonuclar = await Promise.all(
    r.katilimcilar.map(async (k) =>
      demoEpostasiGonder(demoEpostasi(r, etkinlik, k), r, k, { apiAnahtari, gonderen: process.env.DEMO_EPOSTA_GONDEREN }),
    ),
  )
  const basarisiz = sonuclar.filter((s) => !s.tamam)
  if (basarisiz.length) {
    console.error('[demo/cal-webhook] send failed', r.etkinlik, r.tetik, basarisiz.map((s) => (s.tamam ? '' : `${s.durum} ${s.neden}`)))
    // 502 lets Cal.com show the failure in its webhook log; the idempotency key makes a retry safe.
    return yanit(502, { hata: 'gonderilemedi', gonderilen: sonuclar.length - basarisiz.length })
  }
  return yanit(200, { tamam: true, ulke: etkinlik.ulke, gonderilen: sonuclar.length })
}
