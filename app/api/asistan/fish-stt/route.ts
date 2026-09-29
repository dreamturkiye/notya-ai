/**
 * NOTYA-FISH-AYSE-02 — Ayşe mic. Audio in, Turkish transcript out. No patient id.
 * Language is pinned to Turkish on every call; junk clips never reach Fish; one
 * structured latency line per call.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  FISH_ASR_DIL, FISH_ASR_MODEL, FISH_ASR_YENIDEN, FISH_ASR_ZAMAN_MS, FISH_KLIP_AZAMI_BAYT,
  asrKlipDenetle, fishAsrDilKoduUyumluMu, fishAsrDilUyumluMu, fishAsrDosyaAdi, fishAsrGovde, fishAsrMetni, fishAsrYenidenDenenirMi,
} from '@/lib/asistan/fishSes'

export const runtime = 'nodejs'
export const maxDuration = 30

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

type AsrDeneme = { durum: number | null; metin: string; hata: string | null; dil?: string | null }

async function fishAsrCagir(anahtar: string, bayt: Uint8Array): Promise<AsrDeneme> {
  const kontrol = new AbortController()
  const zaman = setTimeout(() => kontrol.abort(), FISH_ASR_ZAMAN_MS)
  try {
    const yanit = await fetch('https://api.fish.audio/v1/asr', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anahtar}`,
        model: FISH_ASR_MODEL,
        'Content-Type': 'application/msgpack',
      },
      body: Buffer.from(fishAsrGovde(bayt)),
      signal: kontrol.signal,
      cache: 'no-store',
    })
    if (!yanit.ok) return { durum: yanit.status, metin: '', hata: `http_${yanit.status}` }
    const j = (await yanit.json().catch(() => null)) as { text?: unknown; language_code?: unknown } | null
    return {
      durum: yanit.status, metin: fishAsrMetni(typeof j?.text === 'string' ? j.text : ''), hata: null,
      dil: typeof j?.language_code === 'string' ? j.language_code : null,
    }
  } catch (e) {
    return { durum: null, metin: '', hata: e instanceof Error ? e.name : 'hata' }
  } finally {
    clearTimeout(zaman)
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

  const ad = ses instanceof File && ses.name ? ses.name : fishAsrDosyaAdi(ses.type)
  const bayt = new Uint8Array(await ses.arrayBuffer())
  const klip = asrKlipDenetle(bayt, ses.type || ad)
  if (!klip.uygun) {
    // Filtered clips never hit Fish and never become a transcript entry.
    console.info('[fish-stt]', { atlandi: klip.neden, klip_ms: klip.sureMs, bayt: klip.bayt, rms: klip.rms })
    return NextResponse.json({ metin: '', atlandi: klip.neden })
  }

  const t0 = Date.now()
  let deneme: AsrDeneme = { durum: null, metin: '', hata: 'baslamadi' }
  let tekrar = 0
  for (let i = 0; i <= FISH_ASR_YENIDEN; i++) {
    tekrar = i
    deneme = await fishAsrCagir(anahtar, bayt)
    const dilOk = !deneme.hata && fishAsrDilUyumluMu(deneme.metin) && fishAsrDilKoduUyumluMu(deneme.dil)
    if (dilOk) break
    if (deneme.hata && !fishAsrYenidenDenenirMi(deneme.durum)) break
  }
  const asr_latency_ms = Date.now() - t0
  // Pin is `language: "tr"` in the MessagePack body. Non-Turkish transcripts are still junk.
  const asr_dil_uyusmazligi = !deneme.hata && !(fishAsrDilUyumluMu(deneme.metin) && fishAsrDilKoduUyumluMu(deneme.dil))
  console.info('[fish-stt]', {
    asr_latency_ms, klip_ms: klip.sureMs, bayt: klip.bayt, dil: FISH_ASR_DIL, dil_tespit: deneme.dil ?? null, model: FISH_ASR_MODEL,
    durum: deneme.durum, tekrar, karakter: deneme.metin.length, hata: deneme.hata, asr_dil_uyusmazligi,
  })
  if (deneme.hata) return NextResponse.json({ error: 'Çözülemedi' }, { status: 502 })
  if (asr_dil_uyusmazligi) return NextResponse.json({ metin: '', atlandi: 'dil' })
  return NextResponse.json({ metin: deneme.metin })
}
