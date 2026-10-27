// ============================================================
// NOTYA AI - API Route: Seans Başlat
// POST /api/sessions/start
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createDeepgramToken } from '@/lib/transcription/deepgramClient'
import { logAccess } from '@/lib/security/auditLogger'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { protokolNumarasiAta } from '@/lib/doktor/protokolNo'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
)

export async function POST(req: NextRequest) {
  try {
    // Kimlik doğrulama
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await getSupabase().auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Geçersiz token' }, { status: 401 })
    }

    // Kullanıcı ve abonelik kontrolü
    const { data: userData } = await getSupabase()
      .from('users')
      .select('subscription_tier, subscription_status, monthly_session_count, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // STRIPE-NOTYA-01: only a doctor who actually went through the new Stripe checkout flow
    // (stripe_subscription_id set) can be blocked here, and only on a terminal status. Every
    // hand-onboarded doctor (subscription_status defaults to 'active', no stripe_subscription_id)
    // is untouched by this check — never retroactively gated. past_due is deliberately NOT
    // blocked: no grace-period policy exists yet, this is Kaan's call (see OPEN-COMMITMENTS).
    if (userData.stripe_subscription_id && ['canceled', 'unpaid'].includes(String(userData.subscription_status))) {
      return NextResponse.json({
        success: false,
        error: 'Notya aboneliğiniz sona erdi. Devam etmek için abonenliğinizi yenileyin.',
        code: 'SUBSCRIPTION_INACTIVE',
      }, { status: 403 })
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

    // HASTA-IZOLASYON-01: a session may only be linked to the doctor's OWN patient — the note, the
    // prescription transfer and the portal all trust sessions.patient_id downstream.
    if (patient_id && !(await hastaSahibiMi(getSupabase(), user.id, String(patient_id)))) {
      return NextResponse.json({ success: false, error: 'Hasta bulunamadı' }, { status: 404 })
    }

    // NOTYA-PROTOKOL-NO-01: atomically reserved BEFORE the insert, then written into the SAME
    // insert() payload — a session can never be created without one (lib/doktor/protokolNo.ts).
    // A failure here fails the whole request rather than silently creating a protokol_no-less
    // muayene.
    const protokol = await protokolNumarasiAta(getSupabase(), user.id)
    if (!protokol) {
      return NextResponse.json({ success: false, error: 'Protokol numarası oluşturulamadı.' }, { status: 500 })
    }

    // Seans oluştur
    const { data: session, error: sessionError } = await getSupabase()
      .from('sessions')
      .insert({
        doctor_id: user.id,
        patient_id: patient_id || null,
        session_type: session_type || 'muayene',
        specialty: specialty || 'genel',
        status: 'recording',
        patient_consent_given: body.patient_consent === true,
        patient_consent_at: body.patient_consent === true ? new Date().toISOString() : null,
        protokol_no: protokol.protokolNo,
        protokol_scope_id: protokol.scopeId,
      })
      .select()
      .single()

    if (sessionError || !session) {
      throw new Error('Seans oluşturulamadı: ' + sessionError?.message)
    }

    // Deepgram geçici token oluştur
    const { token: deepgramToken, expires_at } = await createDeepgramToken(session.id, 7200)

    // Aylık seans sayısını güncelle
    await getSupabase()
      .from('users')
      .update({ monthly_session_count: (userData.monthly_session_count || 0) + 1 })
      .eq('id', user.id)

    // Denetim kaydı
    await logAccess(user.id, 'session', session.id, req)

    return NextResponse.json({
      success: true,
      data: {
        session_id: session.id,
        protokol_no: session.protokol_no,
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
