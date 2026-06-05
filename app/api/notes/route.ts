// ============================================================
// NOTYA AI - API Route: Not Al / Onayla
// GET/PUT /api/notes/[id]
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAccess, logNoteApproval } from '@/lib/security/auditLogger'

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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const { data: note } = await supabase
    .from('notes')
    .select('*')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .single()

  if (!note) return NextResponse.json({ success: false, error: 'Not bulunamadı' }, { status: 404 })

  await logAccess(user.id, 'note', params.id, req)
  return NextResponse.json({ success: true, data: note })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const { action, ...updates } = body

  // Not sahipliği kontrol et
  const { data: existing } = await supabase
    .from('notes')
    .select('id, doctor_id, approved_at')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .single()

  if (!existing) return NextResponse.json({ success: false, error: 'Not bulunamadı' }, { status: 404 })

  // Onay işlemi
  if (action === 'approve') {
    const { data: note, error } = await supabase
      .from('notes')
      .update({
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        ...updates,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    await logNoteApproval(user.id, params.id, req)

    // WhatsApp gönderimi isteği varsa tetikle
    if (updates.send_whatsapp) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notes/${params.id}/whatsapp`, {
        method: 'POST',
        headers: { Authorization: req.headers.get('Authorization')! },
      })
    }

    return NextResponse.json({ success: true, data: note })
  }

  // Normal güncelleme
  const { data: note, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: note })
}

// ============================================================
// NOTYA AI - WhatsApp Not Gönderimi
// POST /api/notes/[id]/whatsapp
// ============================================================

export async function POST_WHATSAPP(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  // Notu ve doktor bilgilerini al
  const { data: note } = await supabase
    .from('notes')
    .select('*')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .single()

  if (!note) return NextResponse.json({ success: false, error: 'Not bulunamadı' }, { status: 404 })

  const { data: doctor } = await supabase
    .from('users')
    .select('whatsapp_number, whatsapp_enabled, full_name')
    .eq('id', user.id)
    .single()

  if (!doctor?.whatsapp_enabled || !doctor?.whatsapp_number) {
    return NextResponse.json({ success: false, error: 'WhatsApp aktif değil' }, { status: 400 })
  }

  // Notu WhatsApp mesajı olarak formatla
  const message = formatNoteForWhatsApp(note)

  // WhatsApp Business API ile gönder
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

  const result = await response.json()
  
  if (!response.ok) {
    return NextResponse.json({ success: false, error: 'WhatsApp gönderilemedi' }, { status: 500 })
  }

  // Gönderim zamanını kaydet
  await supabase
    .from('notes')
    .update({ whatsapp_sent_at: new Date().toISOString() })
    .eq('id', params.id)

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

// ============================================================
// NOTYA AI - iyzico Ödeme Webhook
// POST /api/billing/webhook
// ============================================================

export async function POST_IYZICO_WEBHOOK(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-iyz-signature') || ''
  
  // İmza doğrula
  const { verifyWebhookSignature } = await import('@/lib/security/encryption')
  const isValid = verifyWebhookSignature(body, signature, process.env.IYZICO_SECRET_KEY!)
  
  if (!isValid) {
    return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const { iyziEventType, subscriptionReferenceCode, customerEmail, status } = event

  switch (iyziEventType) {
    case 'SUBSCRIPTION_RENEWED':
      await supabase
        .from('subscriptions')
        .update({ 
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('iyzico_subscription_id', subscriptionReferenceCode)
      break

    case 'SUBSCRIPTION_CANCELLED':
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('iyzico_subscription_id', subscriptionReferenceCode)
      
      // Kullanıcı aboneliğini de güncelle
      await supabase
        .from('users')
        .update({ subscription_status: 'cancelled', subscription_tier: 'free' })
        .eq('email', customerEmail)
      break

    case 'PAYMENT_FAILED':
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('iyzico_subscription_id', subscriptionReferenceCode)
      
      // Telegram uyarısı
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
      if (botToken && chatId) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `💳 NOTYA AI - ÖDEME HATASI\nMüşteri: ${customerEmail}\nAbonelik: ${subscriptionReferenceCode}\nDurum: ${status}`
          }),
        })
      }
      break
  }

  return NextResponse.json({ received: true })
}


