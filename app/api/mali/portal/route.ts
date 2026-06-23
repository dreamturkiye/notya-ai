import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { createHmac } from 'crypto'
import { verifyToken, buildMusteriSystemPrompt, type MusteriPortalSession } from '@/lib/mali/musteriPortalEngine'
import { getBeyanlarimForMusteri } from '@/lib/mali/beyanTakvimiEngine'
import { checkRateLimit, getRateLimitKey } from '@/lib/mali/portalRateLimit'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const SECRET = process.env.PORTAL_TOKEN_SECRET || 'notya-portal-secret-2026-change-in-prod'

export async function POST(req: NextRequest) {
  try {
    const { token, message, history } = await req.json()
    if (!token || !message) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Gecersiz veya suresi dolmus erisim linki' }, { status: 401 })
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const rl = checkRateLimit(getRateLimitKey(token.substring(0, 20), ip), 10, 60000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Cok fazla istek. 1 dakika bekleyin.' }, { status: 429 })
    }
    const tokenHash = createHmac('sha256', SECRET).update(token).digest('hex')
    const { data: tokenRecord } = await supabase
      .from('mali_portal_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('is_active', true)
      .single()
    if (!tokenRecord) {
      return NextResponse.json({ error: 'Link iptal edilmis veya bulunamadi' }, { status: 401 })
    }
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link suresi dolmus' }, { status: 401 })
    }
    const { data: musteri } = await supabase
      .from('mali_musteriler')
      .select('*')
      .eq('id', payload.musteriId)
      .single()
    if (!musteri) {
      return NextResponse.json({ error: 'Musteri bulunamadi' }, { status: 404 })
    }
    const { data: musavir } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', payload.musavirId)
      .single()
    const aktifBeyanlar = getBeyanlarimForMusteri(
      payload.musteriId,
      musteri.sirket_adi,
      new Date(new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }))
    ).slice(0, 5)
    const session: MusteriPortalSession = {
      musteriId: payload.musteriId,
      musteriAdi: musteri.sirket_adi,
      musavirAdi: musavir?.full_name || musavir?.email || 'Mali Musaviriniz',
      vergiNo: musteri.vergi_no,
      faaliyetAlani: musteri.faaliyet_alani,
      aktifBeyanlar,
      sonOdemeler: [],
    }
    const systemPrompt = buildMusteriSystemPrompt(session)
    const aiResponse = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        ...(Array.isArray(history) ? history.slice(-6) : []),
        { role: 'user', content: message },
      ],
    })
    const reply = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : 'Bir hata oluştu.'
    await supabase
      .from('mali_portal_tokens')
      .update({
        last_used_at: new Date(new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })).toISOString(),
        use_count: (tokenRecord.use_count || 0) + 1,
      })
      .eq('id', tokenRecord.id)
    return NextResponse.json({ success: true, reply, musteriAdi: musteri.sirket_adi })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token gerekli' }, { status: 400 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Gecersiz link' }, { status: 401 })
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const rl = checkRateLimit(getRateLimitKey(token.substring(0, 20), ip), 20, 60000)
    if (!rl.allowed) return NextResponse.json({ error: 'Cok fazla istek' }, { status: 429 })
    const tokenHash = createHmac('sha256', SECRET).update(token).digest('hex')
    const { data: tokenRecord } = await supabase
      .from('mali_portal_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('is_active', true)
      .single()
    if (!tokenRecord || new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link gecersiz veya suresi dolmus' }, { status: 401 })
    }
    const { data: musteri } = await supabase
      .from('mali_musteriler')
      .select('*')
      .eq('id', payload.musteriId)
      .single()
    const { data: musavir } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', payload.musavirId)
      .single()
    const aktifBeyanlar = getBeyanlarimForMusteri(
      payload.musteriId,
      musteri?.sirket_adi || '',
      new Date(new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }))
    ).slice(0, 5)
    return NextResponse.json({
      success: true,
      data: {
        musteriAdi: musteri?.sirket_adi,
        aktifBeyanlar,
        musavirAdi: musavir?.full_name || musavir?.email || 'Mali Musaviriniz',
        tokenExpiresAt: tokenRecord.expires_at,
        useCount: tokenRecord.use_count,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
