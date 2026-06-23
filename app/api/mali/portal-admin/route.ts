import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSecureToken } from '@/lib/mali/müşteriPortalEngine'

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
    const { data: { user }, error: authError } = await getSupabase().auth.getUser(
      authHeader.split(' ')[1]
    )
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { action, müşteriId, tokenId, daysValid } = await req.json()
    if (action === 'generate') {
      const { data: müşteri } = await supabase
        .from('mali_müşteriler')
        .select('id, şirket_adi')
        .eq('id', müşteriId)
        .eq('müşavir_id', user.id)
        .single()
      if (!müşteri) {
        return NextResponse.json({ error: 'Bu müşteriye erisim yetkiniz yok' }, { status: 403 })
      }
      // Revoke existing active tokens for this müşteri
      await supabase
        .from('mali_portal_tokens')
        .update({ is_active: false })
        .eq('müşteri_id', müşteriId)
        .eq('müşavir_id', user.id)
        .eq('is_active', true)
      const result = generateSecureToken(müşteriId, user.id, daysValid || 30)
      await getSupabase().from('mali_portal_tokens').insert({
        müşteri_id: müşteriId,
        müşavir_id: user.id,
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
        müşteriAdi: müşteri.şirket_adi,
      })
    }
    if (action === 'revoke') {
      await supabase
        .from('mali_portal_tokens')
        .update({ is_active: false })
        .eq('id', tokenId)
        .eq('müşavir_id', user.id)
      return NextResponse.json({ success: true, message: 'Token iptal edildi' })
    }
    if (action === 'list') {
      const { data } = await supabase
        .from('mali_portal_tokens')
        .select('*, mali_müşteriler(şirket_adi)')
        .eq('müşavir_id', user.id)
        .order('created_at', { ascending: false })
      return NextResponse.json({ success: true, data })
    }
    return NextResponse.json({ error: 'Gecersiz action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
