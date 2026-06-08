// ============================================================
// NOTYA AI - WhatsApp Not Gönderimi
// POST /api/notes/whatsapp
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { formatNotification } from '@/lib/notifications'
import { toAddressableUser, type DoctorProfile } from '@/lib/userProfile'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const { noteId } = await req.json()
  if (!noteId) return NextResponse.json({ success: false, error: 'noteId gerekli' }, { status: 400 })

  const { data: note } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('doctor_id', user.id)
    .single()

  if (!note) return NextResponse.json({ success: false, error: 'Not bulunamadı' }, { status: 404 })

  const { data: doctor } = await supabase
    .from('users')
    .select('whatsapp_number, whatsapp_enabled, full_name, first_name, last_name, title, gender, addressing_preference')
    .eq('id', user.id)
    .single()

  if (!doctor?.whatsapp_enabled || !doctor?.whatsapp_number) {
    return NextResponse.json({ success: false, error: 'WhatsApp aktif değil' }, { status: 400 })
  }

  const noteBody = formatNoteForWhatsApp(note as Record<string, unknown>)
  const message = formatNotification(
    toAddressableUser(doctor as unknown as DoctorProfile),
    noteBody
  )

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: doctor.whatsapp_number.replace(/\D/g, ''),
        type: 'text',
        text: { body: message },
      }),
    }
  )

  const result = await response.json() as { messages?: Array<{ id: string }> }

  if (!response.ok) {
    return NextResponse.json({ success: false, error: 'WhatsApp gönderilemedi' }, { status: 500 })
  }

  await supabase
    .from('notes')
    .update({ whatsapp_sent_at: new Date().toISOString() })
    .eq('id', noteId)

  return NextResponse.json({ success: true, data: { message_id: result.messages?.[0]?.id } })
}

function formatNoteForWhatsApp(note: Record<string, unknown>): string {
  const lines: string[] = [
    '📋 *NOTYA AI - KLİNİK NOT*',
    `🕐 ${new Date(note.created_at as string).toLocaleString('tr-TR')}`,
    '',
  ]

  if (note.content_subjektif) lines.push(`*S - Subjektif:*\n${note.content_subjektif}`, '')
  if (note.content_objektif) lines.push(`*O - Objektif:*\n${note.content_objektif}`, '')
  if (note.content_degerlendirme) lines.push(`*A - Değerlendirme:*\n${note.content_degerlendirme}`, '')
  if (note.content_plan) lines.push(`*P - Plan:*\n${note.content_plan}`, '')

  if (note.content_ilaclar && Array.isArray(note.content_ilaclar) && (note.content_ilaclar as unknown[]).length > 0) {
    lines.push('*💊 REÇETE:*')
    for (const med of note.content_ilaclar as Array<{ ad: string; doz: string; kullanim: string; sure: string }>) {
      lines.push(`• ${med.ad} ${med.doz} - ${med.kullanim} - ${med.sure}`)
    }
    lines.push('')
  }

  if (note.takip_suresi) lines.push(`*📅 TAKİP:* ${note.takip_suresi}`)
  if (note.kritik_bulgular && Array.isArray(note.kritik_bulgular) && (note.kritik_bulgular as unknown[]).length > 0) {
    lines.push(`\n⚠️ *KRİTİK:* ${(note.kritik_bulgular as string[]).join(', ')}`)
  }

  lines.push('\n_Notya AI tarafından oluşturulmuştur_')
  return lines.join('\n')
}
