// ============================================================
// NOTYA AI - API Route: Seans Bitir + Not Üret
// POST /api/sessions/[id]/end
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateNote, type ProfessionType } from '@/lib/ai/noteGenerator'
import { mergeTranscriptSegments } from '@/lib/transcription/deepgramClient'
import { logAccess } from '@/lib/security/auditLogger'
import type { SessionContext } from '@/types/notya'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Geçersiz token' }, { status: 401 })
    }

    const sessionId = params.id

    // Seans sahipliği ve durumu kontrol et
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('doctor_id', user.id)
      .single()

    if (!session) {
      return NextResponse.json({ success: false, error: 'Seans bulunamadı' }, { status: 404 })
    }

    if (session.status !== 'recording') {
      return NextResponse.json({ 
        success: false, 
        error: 'Seans zaten tamamlanmış veya işleniyor' 
      }, { status: 400 })
    }

    // İstek gövdesi - frontend'den gelen transkript segmentleri
    const body = await req.json()
    const { segments, profession, context } = body

    // Seans süresini hesapla
    const durationSeconds = Math.round(
      (Date.now() - new Date(session.started_at).getTime()) / 1000
    )

    // Seansı işleniyor olarak işaretle
    await supabase
      .from('sessions')
      .update({ 
        status: 'processing', 
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', sessionId)

    // Transkripti birleştir
    const transcript = mergeTranscriptSegments(segments || [])
    
    // Transkripti kaydet
    await supabase
      .from('sessions')
      .update({ transcript_cleaned: transcript })
      .eq('id', sessionId)

    // AI not üret
    let generatedNote: Record<string, unknown>
    try {
      const professionType = (profession || 'doktor') as ProfessionType
      const noteContext: SessionContext = {
        specialty: session.specialty || 'genel',
        session_type: session.session_type,
        ...context,
      }
      
      generatedNote = await generateNote(professionType, transcript, noteContext)
    } catch (aiError) {
      console.error('[API/sessions/end] AI not üretme hatası:', aiError)
      await supabase.from('sessions').update({ status: 'failed', error_message: String(aiError) }).eq('id', sessionId)
      return NextResponse.json({ success: false, error: 'Not üretilemedi' }, { status: 500 })
    }

    // Notu kaydet
    const noteData = generatedNote as Record<string, unknown>
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        session_id: sessionId,
        doctor_id: user.id,
        note_type: 'soap',
        content_subjektif: noteData?.soap?.subjektif || null,
        content_objektif: noteData?.soap?.objektif || null,
        content_degerlendirme: noteData?.soap?.degerlendirme || null,
        content_plan: noteData?.soap?.plan || null,
        content_anamnez: noteData?.anamnez || null,
        content_fizik_muayene: noteData?.fizik_muayene || null,
        content_tani: noteData?.tani || noteData?.dosya_ozeti || null,
        content_tedavi: noteData?.tedavi || noteData?.strateji_onerileri || null,
        content_ilaclar: noteData?.ilaclar || null,
        content_lab_istekleri: noteData?.lab_istekleri || null,
        content_goruntulemeler: noteData?.goruntulemeler || null,
        icd10_codes: noteData?.icd10_codes || null,
        kritik_bulgular: noteData?.kritik_bulgular || null,
        takip_suresi: noteData?.takip_suresi || null,
        ai_model: 'claude-sonnet-4',
        ai_confidence: noteData?.ai_confidence || null,
      })
      .select()
      .single()

    if (noteError || !note) {
      throw new Error('Not kaydedilemedi: ' + noteError?.message)
    }

    // Seansı tamamlandı olarak işaretle
    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId)

    await logAccess(user.id, 'note', note.id, req)

    // Kritik bulgular varsa Telegram uyarısı gönder
    if (noteData?.kritik_bulgular && (noteData.kritik_bulgular as string[]).length > 0) {
      await sendCriticalAlert(user.id, sessionId, noteData.kritik_bulgular as string[])
    }

    return NextResponse.json({
      success: true,
      data: {
        session_id: sessionId,
        note_id: note.id,
        status: 'completed',
        note: note,
      }
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[API/sessions/end]', message)
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}

async function sendCriticalAlert(doctorId: string, sessionId: string, findings: string[]) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!botToken || !chatId) return

  const message = `⚠️ KRİTİK BULGU - Notya AI\n\nDoktor ID: ${doctorId}\nSeans: ${sessionId}\n\nBulgular:\n${findings.map(f => `• ${f}`).join('\n')}`
  
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  })
}
