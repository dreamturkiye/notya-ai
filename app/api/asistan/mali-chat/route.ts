// app/api/asistan/mali-chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildMaliSystemPrompt, DERYA_PERSONA, type MaliPreferences } from '@/lib/mali/maliPersonaEngine'
import { toAddressableUser, type DoctorProfile } from '@/lib/userProfile'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer '))
      return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

    const { data: { user } } = await supabase.auth.getUser(authHeader.split(' ')[1])
    if (!user) return NextResponse.json({ success: false, error: 'Gecersiz token' }, { status: 401 })

    const body = await req.json()
    const { message, maliSessionId, musteriId } = body

    // Load musavir profile
    const { data: musavirRow } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
    const musavirProfile = toAddressableUser(musavirRow as DoctorProfile | null)

    // Load mali preferences (learning system)
    const { data: prefs } = await supabase
      .from('mali_preferences').select('*').eq('musavir_id', user.id).single()

    // Load or create mali session
    let maliSession: Record<string, unknown> | null = null
    if (maliSessionId) {
      const { data } = await supabase.from('mali_sessions')
        .select('*').eq('id', maliSessionId).eq('musavir_id', user.id).single()
      maliSession = data
    }
    if (!maliSession) {
      const { data } = await supabase.from('mali_sessions').insert({
        musavir_id: user.id,
        musteri_id: musteriId || null,
        messages: [],
        active_context: {}
      }).select().single()
      maliSession = data
    }

    // Load current musteri if any
    let currentMusteri = null
    const ctxMusteriId = (maliSession?.active_context as Record<string, unknown>)?.currentMusteriId || musteriId
    if (ctxMusteriId) {
      const { data } = await supabase.from('clients').select('*').eq('id', ctxMusteriId).single()
      currentMusteri = data
    }

    // Build conversation history
    const messages: { role: string; content: string }[] = (maliSession?.messages as { role: string; content: string }[]) || []

    // Build system prompt with full learning context
    const systemPrompt = buildMaliSystemPrompt(
      prefs as Partial<MaliPreferences> | null,
      currentMusteri,
      musavirProfile
    )

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages: [
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        { role: 'user', content: message }
      ]
    })

    const rawResponse = response.content[0].type === 'text' ? response.content[0].text : ''

    let aiData: { speech: string; action: Record<string, unknown> | null; proactiveWarning: string | null }
    try {
      const cleanJson = rawResponse.replace(/```[a-z]*/g, '').replace(/```/g, '').trim()
      aiData = JSON.parse(cleanJson)
    } catch {
      aiData = { speech: rawResponse, action: null, proactiveWarning: null }
    }

    // Execute action if any
    if (aiData.action?.type === 'CREATE_MUSTERI') {
      const d = (aiData.action.data || {}) as Record<string, unknown>
      await supabase.from('clients').insert({
        doctor_id: user.id,
        name_encrypted: String(d.name || 'Yeni Musteri'),
        notes_encrypted: String(d.notes || '')
      })
    }

    // Update conversation history (keep last 20)
    const updatedMessages = [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: aiData.speech }
    ].slice(-20)
    await supabase.from('mali_sessions').update({ messages: updatedMessages }).eq('id', maliSession?.id)

    // Log to mali_actions
    await supabase.from('mali_actions').insert({
      musavir_id: user.id,
      mali_session_id: maliSession?.id,
      action_type: 'CHAT',
      input_text: message,
      ai_response: aiData.speech,
      action_data: aiData.action || {}
    }).select()

    // Update sessions count (learning system)
    if (!prefs) {
      await supabase.from('mali_preferences').insert({
        musavir_id: user.id,
        sessions_completed: 1,
        last_session_at: new Date().toISOString()
      })
    } else {
      await supabase.from('mali_preferences').update({
        sessions_completed: (prefs.sessions_completed || 0) + 1,
        last_session_at: new Date().toISOString()
      }).eq('musavir_id', user.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        speech: aiData.speech,
        proactiveWarning: aiData.proactiveWarning,
        action: aiData.action,
        maliSessionId: maliSession?.id,
        personaName: DERYA_PERSONA.name,
      }
    })
  } catch (error) {
    console.error('[mali-chat]', error)
    return NextResponse.json({ success: false, error: 'Asistan yanit veremedi' }, { status: 500 })
  }
}