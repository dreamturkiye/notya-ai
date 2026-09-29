/**
 * NOTYA-FISH-AYSE-02 — Ayşe mic. Audio in, Turkish transcript out. No patient id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { FISH_ASR_MODEL, fishAsrMetni } from '@/lib/asistan/fishSes'

export const runtime = 'nodejs'
export const maxDuration = 30

const AZAMI_BAYT = 3 * 1024 * 1024

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

  const form = await req.formData().catch(() => null)
  const ses = form?.get('audio')
  if (!(ses instanceof Blob) || !ses.size) {
    return NextResponse.json({ error: 'Ses yok' }, { status: 400 })
  }
  if (ses.size > AZAMI_BAYT) {
    return NextResponse.json({ error: 'Ses çok uzun' }, { status: 413 })
  }

  const giden = new FormData()
  giden.append('audio', ses, 'tur.webm')
  giden.append('language', 'tr')
  giden.append('ignore_timestamps', 'true')

  const kontrol = new AbortController()
  const zaman = setTimeout(() => kontrol.abort(), 20_000)
  try {
    const yanit = await fetch('https://api.fish.audio/v1/asr', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anahtar}`,
        model: FISH_ASR_MODEL,
      },
      body: giden,
      signal: kontrol.signal,
      cache: 'no-store',
    })
    if (!yanit.ok) {
      console.error('[fish-stt]', yanit.status)
      return NextResponse.json({ error: 'Çözülemedi' }, { status: 502 })
    }
    const j = (await yanit.json()) as { text?: unknown }
    const metin = fishAsrMetni(typeof j.text === 'string' ? j.text : '')
    return NextResponse.json({ metin })
  } catch (e) {
    console.error('[fish-stt]', e instanceof Error ? e.name : 'hata')
    return NextResponse.json({ error: 'Çözülemedi' }, { status: 502 })
  } finally {
    clearTimeout(zaman)
  }
}
