/**
 * NOTYA-OGRENME-03 — canlı sesli Ayşe (ElevenLabs gerçek zamanlı konuşma ajanı, muayene kaydı DEĞİL)
 * konuşma bitince doktor tarafı metinlerini buraya gönderir. Bu, doktorun Ayşe'yle GERÇEK sohbet
 * ettiği ama Next.js sunucusuna hiç uğramayan tek yüzeydi — sohbettenOgren önceden yalnız yazılı
 * sohbete (asistan/chat) bağlıydı. app/asistan/page.tsx onMessage ile zaten her turu tarayıcıya
 * veriyor (SDK'nın kendisi); bu rota o metni alıp aynı öğrenme kapısından geçirir.
 * Klinik tabloya YAZMAZ — yalnız doktor_hafiza/doktor_iliski (core/eylemler kapsamı dışında, hasta
 * verisi değil, doktorun kendi tercih/rutin kaydı).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { seansIsle, ogrenmeyeDeger, sohbettenOgren } from '@/lib/doktor/hafiza'

export const dynamic = 'force-dynamic'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
)
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ ok: false, error: 'Yetkisiz' }, { status: 401 })
  }
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser(authHeader.split(' ')[1])
  if (!user) return NextResponse.json({ ok: false, error: 'Geçersiz token' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const doktorSozleri = String(body?.doktorSozleri || '').trim().slice(0, 4000)

  try {
    await seansIsle(supabase, user.id, 'sohbet')
    if (doktorSozleri && ogrenmeyeDeger(doktorSozleri)) {
      await sohbettenOgren(getAnthropic(), supabase, user.id, [{ role: 'user', content: doktorSozleri }])
    }
  } catch (e) {
    console.error('[hafiza] ses-ogren', e)
  }
  return NextResponse.json({ ok: true })
}
