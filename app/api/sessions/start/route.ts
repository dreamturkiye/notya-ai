// ============================================================
// NOTYA AI - API Route: Seans Başlat
// POST /api/sessions/start
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createDeepgramToken } from '@/lib/transcription/deepgramClient'
import { logAccess } from '@/lib/security/auditLogger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Kimlik doğrulama
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Geçersiz token' }, { status: 401 })
    }

    // Kullanıcı ve abonelik kontrolü
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier, subscription_status, monthly_session_count')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Abonelik limit kontrolü
    if (userData.subscription_tier === 'starter' && userData.monthly_session_count >= 50) {
      return NextResponse.json({ 
        success: false, 
        error: 'Aylık seans limitinize ulaştınız (50/50). Pro plana geçin.',
        code: 'SESSION_LIMIT_EXCEEDED'
      }, { status: 403 })
    }

    // İstek gövdesini al
    const body = await req.json()
    const { patient_id, session_type, specialty } = body

    // Seans oluştur
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        doctor_id: user.id,
        patient_id: patient_id || null,
        session_type: session_type || 'muayene',
        specialty: specialty || 'genel',
        status: 'recording',
        patient_consent_given: body.patient_consent === true,
        patient_consent_at: body.patient_consent === true ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (sessionError || !session) {
      throw new Error('Seans oluşturulamadı: ' + sessionError?.message)
    }

    // Deepgram geçici token oluştur
    const { token: deepgramToken, expires_at } = await createDeepgramToken(session.id, 7200)

    // Aylık seans sayısını güncelle
    await supabase
      .from('users')
      .update({ monthly_session_count: (userData.monthly_session_count || 0) + 1 })
      .eq('id', user.id)

    // Denetim kaydı
    await logAccess(user.id, 'session', session.id, req)

    return NextResponse.json({
      success: true,
      data: {
        session_id: session.id,
        deepgram_token: deepgramToken,
        websocket_url: `wss://api.deepgram.com/v1/listen`,
        expires_at,
      }
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[API/sessions/start]', message)
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}
