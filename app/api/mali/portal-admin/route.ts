import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSecureToken } from '@/lib/mali/musteriPortalEngine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.split(' ')[1]
    )
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { action, musteriId, tokenId, daysValid } = await req.json()
    if (action === 'generate') {
      const { data: musteri } = await supabase
        .from('mali_musteriler')
        .select('id, sirket_adi')
        .eq('id', musteriId)
        .eq('musavir_id', user.id)
        .single()
      if (!musteri) {
        return NextResponse.json({ error: 'Bu musteriye erisim yetkiniz yok' }, { status: 403 })
      }
      // Revoke existing active tokens for this musteri
      await supabase
        .from('mali_portal_tokens')
        .update({ is_active: false })
        .eq('musteri_id', musteriId)
        .eq('musavir_id', user.id)
        .eq('is_active', true)
      const result = generateSecureToken(musteriId, user.id, daysValid || 30)
      await supabase.from('mali_portal_tokens').insert({
        musteri_id: musteriId,
        musavir_id: user.id,
        token_hash: result.tokenHash,
        expires_at: result.expiresAt.toISOString(),
        is_active: true,
      })
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://notya-ai.vercel.app'
      return NextResponse.json({
        success: true,
        token: result.token,
        expiresAt: result.expiresAt,
        portalUrl: `${baseUrl}/portal/${result.token}`,
        musteriAdi: musteri.sirket_adi,
      })
    }
    if (action === 'revoke') {
      await supabase
        .from('mali_portal_tokens')
        .update({ is_active: false })
        .eq('id', tokenId)
        .eq('musavir_id', user.id)
      return NextResponse.json({ success: true, message: 'Token iptal edildi' })
    }
    if (action === 'list') {
      const { data } = await supabase
        .from('mali_portal_tokens')
        .select('*, mali_musteriler(sirket_adi)')
        .eq('musavir_id', user.id)
        .order('created_at', { ascending: false })
      return NextResponse.json({ success: true, data })
    }
    return NextResponse.json({ error: 'Gecersiz action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
