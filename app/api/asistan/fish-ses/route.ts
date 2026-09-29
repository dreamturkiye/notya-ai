/**
 * NOTYA-FISH-AYSE-01 — Ayşe'nin sesi. Anahtar tarayıcıya hiç inmez.
 * NOTYA-SES-FISH-UCTAN-UCA-01: Ayşe'nin tek sesi budur (ElevenLabs yok). Başarısızlıkta cevap ekranda kalır.
 * Kullanım: gövdede asistanSessionId varsa Fish'e giden metnin UTF-8 bayt sayısı ses_kullanim'a yazılır (Fish bayt
 * başına ücretlendirir) — yalnız oturum id + doctor_id eşleşirse (HASTA-IZOLASYON-01); metin yazılmaz.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { fishFaturaBayti, fishIstegi } from '@/lib/asistan/fishSes'
import { arkadaYaz, sesKullanimYaz } from '@/lib/asistan/sesKullanim'

export const runtime = 'nodejs'
export const maxDuration = 30

const UST_KARAKTER = 2000

async function doktor(req: NextRequest): Promise<{ id: string; sb: SupabaseClient } | null> {
  const baslik = req.headers.get('authorization')
  if (!baslik?.startsWith('Bearer ')) return null
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
    })
    const { data: { user }, error } = await sb.auth.getUser(baslik.slice(7))
    return !error && user ? { id: user.id, sb } : null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const kim = await doktor(req)
  if (!kim) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const anahtar = process.env.FISH_API_KEY
  if (!anahtar) return NextResponse.json({ error: 'Ses motoru yok' }, { status: 503 })

  const govde = (await req.json().catch(() => null)) as { metin?: unknown; asistanSessionId?: unknown } | null
  const metin = typeof govde?.metin === 'string' ? govde.metin.slice(0, UST_KARAKTER) : ''
  const oturumId = typeof govde?.asistanSessionId === 'string' ? govde.asistanSessionId.trim() : ''
  const istek = fishIstegi(metin)
  if (!istek) return NextResponse.json({ error: 'Boş' }, { status: 400 })

  const kontrol = new AbortController()
  const zaman = setTimeout(() => kontrol.abort(), 20_000)
  try {
    const yanit = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anahtar}`,
        'Content-Type': 'application/json',
        model: istek.model,
      },
      body: JSON.stringify(istek.govde),
      signal: kontrol.signal,
      cache: 'no-store',
    })
    if (!yanit.ok || !yanit.body) {
      console.error('[fish-ses]', yanit.status)
      return NextResponse.json({ error: 'Ses üretilemedi' }, { status: 502 })
    }
    if (oturumId) {
      const sentezlenen = String(istek.govde.text)
      arkadaYaz(sesKullanimYaz(kim.sb, kim.id, oturumId, [
        { kaynak: 'fish', olcu: 'utf8_bayt', miktar: fishFaturaBayti(sentezlenen), model: istek.model },
        { kaynak: 'fish', olcu: 'karakter', miktar: [...sentezlenen].length, model: istek.model },
      ]))
    }
    return new NextResponse(yanit.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'no-store',
        'X-Sample-Rate': '24000',
      },
    })
  } catch (e) {
    console.error('[fish-ses]', e instanceof Error ? e.name : 'hata')
    return NextResponse.json({ error: 'Ses üretilemedi' }, { status: 502 })
  } finally {
    clearTimeout(zaman)
  }
}
