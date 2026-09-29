/**
 * NOTYA-FISH-AYSE-01 — Ayşe'nin sesi. Anahtar tarayıcıya hiç inmez.
 * Ayşe tests are Fish-only: failure stays silent (client never unmutes ElevenLabs).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fishIstegi } from '@/lib/asistan/fishSes'

export const runtime = 'nodejs'
export const maxDuration = 30

const UST_KARAKTER = 2000

async function doktorMu(req: NextRequest): Promise<boolean> {
  const baslik = req.headers.get('authorization')
  if (!baslik?.startsWith('Bearer ')) return false
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
    })
    const { data: { user }, error } = await sb.auth.getUser(baslik.slice(7))
    return !error && Boolean(user)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  if (!(await doktorMu(req))) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const anahtar = process.env.FISH_API_KEY
  if (!anahtar) return NextResponse.json({ error: 'Ses motoru yok' }, { status: 503 })

  const govde = (await req.json().catch(() => null)) as { metin?: unknown } | null
  const metin = typeof govde?.metin === 'string' ? govde.metin.slice(0, UST_KARAKTER) : ''
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
