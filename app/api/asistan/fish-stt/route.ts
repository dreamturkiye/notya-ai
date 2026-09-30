/**
 * NOTYA-FISH-AYSE-02 — Ayşe mic. Audio in, Turkish transcript out. No patient id.
 * Language is pinned to Turkish on every call; junk clips never reach Fish; one
 * structured latency line per call. Kept as a standalone probe; the live loop
 * now sends the clip on fish-tur so the TTS socket can open during ASR.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fishAsrBlob } from '@/lib/asistan/fishAsr'
import { FISH_KLIP_AZAMI_BAYT } from '@/lib/asistan/fishSes'

export const runtime = 'nodejs'
export const maxDuration = 30
// NOTYA-FISH-BOLGE-01: Supabase (auth + DB) is us-east-1; the app default fra1 put an Atlantic
// round trip in front of every Fish call. Fish's own region is undocumented (see OPEN-COMMITMENTS).
export const preferredRegion = ['iad1']

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
  if (ses.size > FISH_KLIP_AZAMI_BAYT) {
    return NextResponse.json({ error: 'Ses çok uzun' }, { status: 413 })
  }

  const sonuc = await fishAsrBlob(anahtar, ses)
  if (sonuc.tur === 'hata') return NextResponse.json({ error: 'Çözülemedi' }, { status: 502 })
  if (sonuc.tur === 'atlandi') {
    if (sonuc.neden === 'uzun') return NextResponse.json({ error: 'Ses çok uzun' }, { status: 413 })
    return NextResponse.json({ metin: '', atlandi: sonuc.neden })
  }
  return NextResponse.json({ metin: sonuc.metin })
}
