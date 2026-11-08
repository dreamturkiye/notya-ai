/**
 * DENEME-BILDIRIM-02 (Kaan, 2026-11-08) — POST /api/internal/signup-notify: a country build's signup alert, sent on from
 * Kaan's own mailbox. Only this (Türkiye) project holds the mailbox password, so the six country builds post here instead
 * of sending mail themselves (lib/ulke/kurucu/kurucuUlke.ts).
 *
 *   202 { ok: true }  a valid body-bound signature (FOUNDER_STATS_SECRET, purpose 'signup-notify', at most 5 minutes old,
 *                     nonce not seen before) over a body that is exactly an alert payload; the e-mail goes out after the
 *                     response (arkaPlanda). Excluded addresses (Kaan's test account, founders) are accepted and not sent.
 *   404               anything else: no secret configured, missing/bad/expired/replayed signature, a body that is not
 *                     exactly the payload (any extra key — a patient field included — is refused). No hint why.
 *   429               more than 30 calls in 5 minutes from one address, or more than 20 alerts in 10 minutes for one
 *                     country (per instance).
 *
 * Takes no id and reads no table. The payload is the doctor's own account details only (lib/kurucu/denemeBildirimi.ts).
 */
import { NextRequest, NextResponse } from 'next/server'
import { govdeImzaDogrula, IMZA_BASLIGI, sinirlayici } from '@/lib/kurucu/imza'
import { arkaPlanda, bildirimDisiMi, bildirimEpostasi, bildirimYukuCoz, SIGNUP_NOTIFY_AMAC } from '@/lib/kurucu/denemeBildirimi'
import { bildirimGonder, gonderimiGunlukle } from '@/lib/kurucu/smtpGonder'
export const dynamic = 'force-dynamic'

const BASLIK = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
const AZAMI_GOVDE = 4096
const ipSiniri = sinirlayici(30, 5 * 60 * 1000)
const ulkeSiniri = sinirlayici(20, 10 * 60 * 1000)

const yok = () => NextResponse.json({ code: 'NOT_FOUND' }, { status: 404, headers: BASLIK })
const cok = () => NextResponse.json({ code: 'COK_DENEME' }, { status: 429, headers: BASLIK })

/** Any other method looks like a path that does not exist, too. */
export function GET() {
  return yok()
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'yok'
  if (!ipSiniri.izinli(ip)) return cok()
  const uzunluk = Number(req.headers.get('content-length') || 0)
  if (uzunluk > AZAMI_GOVDE) return yok()
  let govde: string
  try {
    govde = await req.text()
  } catch {
    return yok()
  }
  if (!govde || govde.length > AZAMI_GOVDE) return yok()
  const imza = govdeImzaDogrula(process.env.FOUNDER_STATS_SECRET, req.headers.get(IMZA_BASLIGI), SIGNUP_NOTIFY_AMAC, govde)
  if (!imza.ok) return yok()
  let ham: unknown
  try {
    ham = JSON.parse(govde)
  } catch {
    return yok()
  }
  const kayit = bildirimYukuCoz(ham)
  if (!kayit) return yok()
  if (!ulkeSiniri.izinli(kayit.ulke)) return cok()
  if (bildirimDisiMi(kayit.eposta)) return NextResponse.json({ ok: true }, { status: 202, headers: BASLIK })

  const tekrarAnahtari = `notya-deneme/${kayit.ulke}/${kayit.eposta.toLowerCase()}`
  arkaPlanda(async () => {
    const s = await bildirimGonder(bildirimEpostasi(kayit), tekrarAnahtari)
    gonderimiGunlukle(s)
  }, 'deneme-bildirim/signup-notify')
  return NextResponse.json({ ok: true }, { status: 202, headers: BASLIK })
}
