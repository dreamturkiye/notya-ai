/**
 * NOTYA-SES-FISH-SADECE-01 — Ayşe Kaya'nın kulağı: bitmiş BİR doktor sözü (WAV) → Fish /v1/asr → metin.
 *
 * Tarayıcı sözü yerelde algılar (lib/asistan/sozAlgilayici.ts); yalnız VAD'ın bitirdiği söz buraya gelir — büyüyen
 * tampon için ara çağrı yoktur. Bir söz = bir istek = bir Fish ASR çağrısı. Dönen metin tarayıcıdan tek nonce ile
 * /api/asistan/fish-tur'a gider (tek dağıtım yolu). Fish anahtarı tarayıcıya hiç inmez.
 *
 * Fish hatasında başka satıcıya DÜŞÜLMEZ (Kaan: Ayşe %100 Fish, başka satıcı yok): 502 döner, tarayıcı hatayı
 * gösterir, doktor tekrar söyler. İstek biçimi ve belge kaynağı: lib/asistan/fishSes.ts (fishAsrFormu).
 *
 * Ölçüm: Fish'in döndürdüğü ses süresi (istek başına yukarı yuvarlanmış saniye — Fish böyle faturalar) ve Fish
 * round trip'i (asr_ms) ses_kullanim'a + Vercel günlüğüne [ses-gecikme] satırı olarak yazılır.
 *
 * HASTA-IZOLASYON-01: doktor kendi Bearer jetonundan (doktorOturum); asistanSessionId Fish'e ses gitmeden ÖNCE
 * id + doctor_id birlikte çözülür, yabancı / bilinmeyen oturum 404 (Fish çağrılmaz, hiçbir şey yazılmaz). Hasta
 * kimliği istekten alınmaz; ses ve metin saklanmaz, günlüğe yazılmaz.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { FISH_ASR_MODEL, FISH_ASR_URL, fishAsrCevabi, fishAsrFormu, fishUctanUcaAcik } from '@/lib/asistan/fishSes'
import { arkadaYaz, sesGecikmesiYaz, sesKullanimYaz } from '@/lib/asistan/sesKullanim'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

/** Tarayıcı sözü EN_UZUN_SOZ_MS'de (30 sn ≈ 960 KB) keser; bunun üstü istemci hatasıdır. */
const UST_BAYT = 2 * 1024 * 1024
/** WAV başlığı (44) + en az ~50 ms ses. */
const ALT_BAYT = 44 + 1600
const ZAMAN_ASIMI_MS = 15_000

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const doktorId = user.id
  if (!fishUctanUcaAcik('aysekaya')) return NextResponse.json({ error: 'Ses hattı kapalı' }, { status: 409 })

  const asistanSessionId = String(req.nextUrl.searchParams.get('asistanSessionId') || '').trim()
  if (!asistanSessionId) return NextResponse.json({ error: 'asistanSessionId gerekli.' }, { status: 400 })
  const beyan = Number(req.headers.get('content-length') || 0)
  if (beyan > UST_BAYT) return NextResponse.json({ error: 'Ses çok uzun.' }, { status: 413 })

  const { data: kayit } = await supabase.from('asistan_sessions').select('id').eq('id', asistanSessionId).eq('doctor_id', doktorId).maybeSingle()
  if (!kayit) return NextResponse.json({ error: 'Asistan oturumu bulunamadı.' }, { status: 404 })

  const ses = new Uint8Array(await req.arrayBuffer().catch(() => new ArrayBuffer(0)))
  if (ses.byteLength > UST_BAYT) return NextResponse.json({ error: 'Ses çok uzun.' }, { status: 413 })
  if (ses.byteLength < ALT_BAYT) return NextResponse.json({ error: 'Ses yok.' }, { status: 400 })

  const kontrol = new AbortController()
  const zaman = setTimeout(() => kontrol.abort(), ZAMAN_ASIMI_MS)
  const iptal = () => kontrol.abort()
  req.signal?.addEventListener?.('abort', iptal, { once: true })
  const bas = Date.now()
  try {
    const yanit = await fetch(FISH_ASR_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.FISH_API_KEY}`, model: FISH_ASR_MODEL },
      body: fishAsrFormu(ses),
      signal: kontrol.signal,
      cache: 'no-store',
    })
    if (!yanit.ok) {
      console.error('[fish-dinle]', yanit.status)
      return NextResponse.json({ error: 'Ses yazıya dökülemedi' }, { status: 502 })
    }
    const sonuc = fishAsrCevabi(await yanit.json().catch(() => null))
    const asrMs = Date.now() - bas
    if (!sonuc) {
      console.error('[fish-dinle] beklenmeyen yanıt')
      return NextResponse.json({ error: 'Ses yazıya dökülemedi' }, { status: 502 })
    }
    if (sonuc.sureSn > 0) {
      arkadaYaz(sesKullanimYaz(supabase, doktorId, asistanSessionId, [{ kaynak: 'fish_asr', olcu: 'ses_saniye', miktar: Math.ceil(sonuc.sureSn), model: FISH_ASR_MODEL }]))
    }
    arkadaYaz(sesGecikmesiYaz(supabase, doktorId, asistanSessionId, { asr_ms: asrMs }, FISH_ASR_MODEL))
    return NextResponse.json({ metin: sonuc.metin, sure: sonuc.sureSn, dil: sonuc.dil, asr_ms: asrMs }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[fish-dinle]', e instanceof Error ? e.name : 'hata')
    return NextResponse.json({ error: 'Ses yazıya dökülemedi' }, { status: 502 })
  } finally {
    clearTimeout(zaman)
    req.signal?.removeEventListener?.('abort', iptal)
  }
}
