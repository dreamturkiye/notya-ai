/**
 * HASTA-ALANI-MARKA — the home-screen / PWA icon of a patient's portal link, in the doctor's identity: his logo, else his
 * photo, else his monogram in his accent (never the Notya icon). ?b=192 | 512 | 180 (apple-touch). The token decides the
 * doctor; only that doctor's rows / files are read. No patient data. Cached a day in the browser (the doctor may change
 * his logo; the manifest re-reads it).
 */
import { NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { hamMarkaOku, hamdanMarka, portalFotoYolu, tokenDoktoru } from '@/lib/portal/markaSunucu'
import { BILINMEYEN_MARKA } from '@/lib/portal/marka'
import { cizilebilirDataUrl, markaGorselBaytlari, markaIkonuCiz, onbellekliPng } from '@/lib/portal/markaCizim'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BOYUTLAR = new Set([180, 192, 512])

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const b = Number(new URL(req.url).searchParams.get('b') || 192)
  const boyut = BOYUTLAR.has(b) ? b : 192
  const sb = servisSupabase()
  const t = await tokenDoktoru(sb, params.token)
  if (!t) return onbellekliPng(markaIkonuCiz(BILINMEYEN_MARKA, null, boyut), 'no-store')
  const marka = hamdanMarka(await hamMarkaOku(sb, t.doctorId), (v) => portalFotoYolu(params.token, v))
  const dataUrl = cizilebilirDataUrl(await markaGorselBaytlari(sb, t.doctorId, marka))
  try {
    return await onbellekliPng(markaIkonuCiz(marka, dataUrl, boyut), 'private, max-age=86400')
  } catch (e) {
    console.error('[portal-marka] ikon:', (e as Error).message)
    return NextResponse.json({ error: 'ikon' }, { status: 500 })
  }
}
