/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 — tarayıcının ölçtüğü Deepgram kullanımı (gönderilen ses saniyesi, bağlantı ve görüşme
 * süresi). Sunucu sesi görmez; sayıyı tarayıcı yollar (görüşme sürerken dakikada bir ve kapanırken, keepalive).
 * Maliyet raporu: scripts/fish-maliyet.mts.
 *
 * HASTA-IZOLASYON-01: sayaç yalnız oturum id + doctor_id eşleşirse yazılır; yabancı oturum 404, hiçbir şey yazılmaz.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { kullanimSuz, sesKullanimYaz } from '@/lib/asistan/sesKullanim'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const govde = (await req.json().catch(() => ({}))) as { asistanSessionId?: unknown; satirlar?: unknown }
  const asistanSessionId = String(govde.asistanSessionId || '').trim()
  const satirlar = kullanimSuz(govde.satirlar).filter((s) => s.kaynak === 'deepgram')
  if (!asistanSessionId) return NextResponse.json({ error: 'asistanSessionId gerekli.' }, { status: 400 })
  const sonuc = await sesKullanimYaz(supabase, user.id, asistanSessionId, satirlar)
  if (sonuc === 'oturum_yok') return NextResponse.json({ error: 'Asistan oturumu bulunamadı.' }, { status: 404 })
  if (sonuc === 'hata') return NextResponse.json({ error: 'Kullanım yazılamadı.' }, { status: 500 })
  return NextResponse.json({ ok: true, yazilan: satirlar.length })
}
