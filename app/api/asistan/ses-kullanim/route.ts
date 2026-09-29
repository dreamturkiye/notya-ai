/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 / SADECE-01 — tarayıcının ölçtüğü sayılar: görüşmenin duvar saati süresi (dakikada
 * bir ve kapanırken, keepalive) ve tur başına aşama gecikmeleri (VAD söz sonu, ASR yükleme+dökme, Fish ilk ses,
 * toplam). Fish bayt/saniyesi ve sunucu gecikmeleri buradan KABUL EDİLMEZ — onları sunucu rotaları kendisi yazar.
 * Maliyet + gecikme raporu: scripts/fish-maliyet.mts.
 *
 * HASTA-IZOLASYON-01: sayaç yalnız oturum id + doctor_id eşleşirse yazılır; yabancı oturum 404, hiçbir şey yazılmaz.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { ISTEMCI_OLCULERI, kullanimSuz, sesKullanimYaz } from '@/lib/asistan/sesKullanim'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const govde = (await req.json().catch(() => ({}))) as { asistanSessionId?: unknown; satirlar?: unknown }
  const asistanSessionId = String(govde.asistanSessionId || '').trim()
  const satirlar = kullanimSuz(govde.satirlar).filter((s) => ISTEMCI_OLCULERI.has(s.olcu))
  if (!asistanSessionId) return NextResponse.json({ error: 'asistanSessionId gerekli.' }, { status: 400 })
  const sonuc = await sesKullanimYaz(supabase, user.id, asistanSessionId, satirlar)
  if (sonuc === 'oturum_yok') return NextResponse.json({ error: 'Asistan oturumu bulunamadı.' }, { status: 404 })
  if (sonuc === 'hata') return NextResponse.json({ error: 'Kullanım yazılamadı.' }, { status: 500 })
  return NextResponse.json({ ok: true, yazilan: satirlar.length })
}
