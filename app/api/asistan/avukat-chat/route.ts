// app/api/asistan/avukat-chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { AVUKAT_PERSONAS, type AvukatPersonaId } from '@/lib/avukat/personas'
import { buildAvukatSystemPrompt, getPersonaForBranch, type AvukatPreferences } from '@/lib/avukat/avukatPersonaEngine'
import { quickClassifyLegal } from '@/lib/avukat/avukatIntentParser'
import { toAddressableUser, type DoctorProfile } from '@/lib/userProfile'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

async function executeAvukatAction(
  type: string,
  data: Record<string, unknown>,
  avukatId: string,
  sessionId: string | null
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  switch (type) {
    case 'CREATE_MUVEKKEL': {
      const { data: row, error } = await supabase
        .from('musevvekiller')
        .insert({
          avukat_id: avukatId,
          name: String(data.name || 'Bilinmiyor'),
          case_type: String(data.case_type || ''),
          branch: String(data.branch || ''),
          opposing_party: String(data.opposing_party || ''),
          notes: String(data.notes || ''),
        })
        .select().single()
      if (error) return { success: false, message: 'Muvekkel olusturulamadi: ' + error.message }
      return { success: true, message: String(data.name || 'Muvekkel') + ' kaydedildi', data: { muvekkel: row } }
    }
    case 'ADD_SURE_UYARISI': {
      const { error } = await supabase.from('sure_takibi').insert({
        avukat_id: avukatId,
        muvekkel_id: data.muvekkel_id || null,
        sure_turu: String(data.sure_turu || ''),
        son_tarih: String(data.son_tarih || ''),
        kanun: String(data.kanun || ''),
        kritik: Boolean(data.kritik || false),
      })
      if (error) return { success: false, message: 'Sure uyarisi eklenemedi: ' + error.message }
      return { success: true, message: 'Sure takvime eklendi' }
    }
    case 'GENERATE_DILEKCE': {
      const { error } = await supabase.from('dilekce_kuyrugu').insert({
        avukat_id: avukatId,
        muvekkel_id: data.muvekkel_id || null,
        dilekce_turu: String(data.dilekce_turu || ''),
        icerik: String(data.icerik || ''),
        taslak: true,
      })
      if (error) return { success: false, message: 'Dilekce olusturulamadi: ' + error.message }
      return { success: true, message: 'Dilekce kuyruguna eklendi' }
    }
    case 'UPDATE_DAVA': {
      const { error } = await supabase.from('musevvekiller')
        .update({ notes: String(data.notes || ''), updated_at: new Date().toISOString() })
        .eq('id', data.muvekkel_id).eq('avukat_id', avukatId)
      if (error) return { success: false, message: 'Dava guncellenemedi: ' + error.message }
      return { success: true, message: 'Dava guncellendi' }
    }
    default:
      return { success: false, message: 'Bilinmeyen aksiyon: ' + type }
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer '))
      return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

    const { data: { user } } = await supabase.auth.getUser(authHeader.split(' ')[1])
    if (!user) return NextResponse.json({ success: false, error: 'Gecersiz token' }, { status: 401 })

    const body = await req.json()
    const {
      message, avukatSessionId, muvekkeilId, sessionId,
      branch = 'genel', personaId: requestedPersona
    } = body

    // Load avukat profile
    const { data: avukatRow } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
    const avukatProfile = toAddressableUser(avukatRow as DoctorProfile | null)

    // Load avukat preferences (learning system)
    const { data: prefs } = await supabase
      .from('avukat_preferences')
      .select('*').eq('avukat_id', user.id).single()

    // Load or create avukat session
    let avukatSession: Record<string, unknown> | null = null
    if (avukatSessionId) {
      const { data } = await supabase.from('avukat_sessions')
        .select('*').eq('id', avukatSessionId).eq('avukat_id', user.id).single()
      avukatSession = data
    }
    if (!avukatSession) {
      const personaId: AvukatPersonaId = requestedPersona ||
        prefs?.preferred_persona ||
        getPersonaForBranch(branch)
      const { data } = await supabase.from('avukat_sessions').insert({
        avukat_id: user.id,
        muvekkel_id: muvekkeilId || null,
        session_id: sessionId || null,
        persona_id: personaId,
        messages: [],
        active_context: { branch, currentMuvekkelId: muvekkeilId }
      }).select().single()
      avukatSession = data
    }

    const personaId = (avukatSession?.persona_id as AvukatPersonaId) || 'kemal_bey'
    const persona = AVUKAT_PERSONAS[personaId]

    // Load current muvekkel
    let currentMuvekkel = null
    const contextMuvekkelId = (avukatSession?.active_context as Record<string, unknown>)?.currentMuvekkelId || muvekkeilId
    if (contextMuvekkelId) {
      const { data } = await supabase.from('musevvekiller').select('*').eq('id', contextMuvekkelId).single()
      currentMuvekkel = data
    }

    // Build conversation history
    const messages: { role: string; content: string }[] = (avukatSession?.messages as { role: string; content: string }[]) || []

    // Quick classify intent
    const quickIntent = quickClassifyLegal(message)

    // Build system prompt with full learning context
    const systemPrompt = buildAvukatSystemPrompt(
      persona,
      prefs as Partial<AvukatPreferences> | null,
      currentMuvekkel,
      avukatProfile
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

    // Execute action if requested
    let actionResult = null
    if (aiData.action?.type) {
      actionResult = await executeAvukatAction(
        String(aiData.action.type),
        (aiData.action.data as Record<string, unknown>) || {},
        user.id,
        String(avukatSession?.id || '')
      )
      if (aiData.action.type === 'CREATE_MUVEKKEL' && actionResult.data?.muvekkel) {
        await supabase.from('avukat_sessions').update({
          muvekkel_id: (actionResult.data.muvekkel as Record<string, unknown>).id,
          active_context: {
            ...(avukatSession?.active_context as Record<string, unknown> || {}),
            currentMuvekkelId: (actionResult.data.muvekkel as Record<string, unknown>).id
          }
        }).eq('id', avukatSession?.id)
      }
    }

    // Update conversation history (keep last 20)
    const updatedMessages = [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: aiData.speech }
    ].slice(-20)
    await supabase.from('avukat_sessions').update({ messages: updatedMessages }).eq('id', avukatSession?.id)

    // Log to avukat_actions
    await supabase.from('avukat_actions').insert({
      avukat_id: user.id,
      avukat_session_id: avukatSession?.id,
      action_type: quickIntent || 'GENEL_SORU',
      input_text: message,
      ai_response: aiData.speech,
      action_data: aiData.action || {}
    })

    // Update sessions count in preferences (learning system)
    if (!prefs) {
      await supabase.from('avukat_preferences').insert({
        avukat_id: user.id,
        sessions_completed: 1,
        last_session_at: new Date().toISOString()
      })
    } else {
      await supabase.from('avukat_preferences').update({
        sessions_completed: (prefs.sessions_completed || 0) + 1,
        last_session_at: new Date().toISOString()
      }).eq('avukat_id', user.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        speech: aiData.speech,
        proactiveWarning: aiData.proactiveWarning,
        action: aiData.action,
        actionResult,
        avukatSessionId: avukatSession?.id,
        personaId,
        personaName: persona.name,
      }
    })
  } catch (error) {
    console.error('[avukat-chat]', error)
    return NextResponse.json({ success: false, error: 'Asistan yanit veremedi' }, { status: 500 })
  }
}