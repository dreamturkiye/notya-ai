import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSecureToken } from '@/lib/mali/musteriPortalEngine'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const sb = getSupabase()
    const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.split(' ')[1])
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, musteriId, tokenId, daysValid } = await req.json()

    if (action === 'generate') {
      if (!musteriId) return NextResponse.json({ error: 'musteriId gerekli' }, { status: 400 })

      const { data: musteri } = await sb
        .from('mali_musteriler')
        .select('id, sirket_adi')
        .eq('id', musteriId)
        .eq('musavir_id', user.id)
        .single()
      if (!musteri) {
        return NextResponse.json({ error: 'Bu müşteriye erişim yetkiniz yok' }, { status: 403 })
      }

      // Only one live link per müşteri: retire the previous ones first.
      await sb
        .from('mali_portal_tokens')
        .update({ is_active: false })
        .eq('musteri_id', musteriId)
        .eq('musavir_id', user.id)
        .eq('is_active', true)

      const result = generateSecureToken(musteriId, user.id, daysValid || 30)
      const { error: insertError } = await sb.from('mali_portal_tokens').insert({
        musteri_id: musteriId,
        musavir_id: user.id,
        token_hash: result.tokenHash,
        expires_at: result.expiresAt.toISOString(),
        is_active: true,
      })
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://notya-ai.vercel.app'
      return NextResponse.json({
        success: true,
        token: result.token,
        expiresAt: result.expiresAt,
        portalUrl: `${baseUrl}/portal/mali/${result.token}`,
        musteriAdi: musteri.sirket_adi,
      })
    }

    if (action === 'revoke') {
      if (!tokenId) return NextResponse.json({ error: 'tokenId gerekli' }, { status: 400 })
      const { error } = await sb
        .from('mali_portal_tokens')
        .update({ is_active: false })
        .eq('id', tokenId)
        .eq('musavir_id', user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: 'Token iptal edildi' })
    }

    if (action === 'list') {
      const { data, error } = await sb
        .from('mali_portal_tokens')
        .select('*')
        .eq('musavir_id', user.id)
        .order('created_at', { ascending: false })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, data: data || [] })
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
