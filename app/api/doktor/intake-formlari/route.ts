/**
 * NOTYA-INTAKE-01 — hasta bilgi formu oluşturma/listeleme.
 *
 * POST bir form linki üretir (davet_token_hash desenindeki gibi: satırın kendisi token taşır,
 * ayrı bir tablo yok). SMTP kurulmadığı için (docs/OPEN-COMMITMENTS.md) e-posta GÖNDERİLMİYOR —
 * link WhatsApp üzerinden gönderiliyor (mevcut Twilio altyapısı) veya doktora/sekretere kopyalama
 * için döndürülüyor ("elden" paylaşım). Kanal alanı yalnızca kayıt amaçlı; e-posta kanalı
 * eklendiğinde tek değişen şey gönderim yöntemi olacak.
 */
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'
import { sendTwilioMessage } from '@/lib/doktor/twilioNotify'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const url = new URL(req.url)
  const patientId = url.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })

  const { data, error } = await supabase
    .from('hasta_intake_formlari')
    .select('id, brans, durum, gonderim_kanali, gonderildi_at, dolduruldu_at, incelendi_at')
    .eq('doktor_id', doktorId)
    .eq('patient_id', patientId)
    .order('gonderildi_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Formlar al\u0131namad\u0131.' }, { status: 500 })
  return NextResponse.json({ formlar: data || [] })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({}))
  const { patientId, randevuId, brans, kanal } = body as {
    patientId?: string
    randevuId?: string
    brans?: string
    kanal?: 'whatsapp' | 'eposta' | 'elden'
  }
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })

  const { data: hasta } = await supabase
    .from('patients')
    .select('id, name_encrypted, phone_encrypted')
    .eq('id', patientId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamad\u0131.' }, { status: 404 })

  const token = randomBytes(24).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 g\u00fcn

  const { data: form, error } = await supabase
    .from('hasta_intake_formlari')
    .insert({
      doktor_id: doktorId,
      patient_id: patientId,
      randevu_id: randevuId || null,
      brans: brans || 'genel',
      gonderim_kanali: kanal || 'elden',
      token_hash: tokenHash,
      token_expires_at: expiresAt,
    })
    .select('id')
    .single()

  if (error || !form) return NextResponse.json({ error: 'Form olu\u015fturulamad\u0131.' }, { status: 500 })

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://notya-ai.vercel.app'
  const link = `${site}/intake/${token}`

  let whatsappGonderildi = false
  if (kanal === 'whatsapp') {
    let telefon = ''
    let ad = 'Hastam\u0131z'
    try { if (hasta.phone_encrypted) telefon = decrypt(hasta.phone_encrypted) || '' } catch { /* ignore */ }
    try { if (hasta.name_encrypted) ad = (JSON.parse(decrypt(hasta.name_encrypted)).ad || '').trim() || ad } catch { /* ignore */ }
    if (telefon) {
      const mesaj = `Merhaba ${ad}, randevunuzdan \u00f6nce doldurman\u0131z\u0131 rica etti\u011fimiz Hasta Bilgi Formu haz\u0131r: ${link}\n\nBu k\u0131sa formu doldurman\u0131z muayene s\u00fcresini sizin i\u00e7in daha verimli k\u0131lacak. Te\u015fekk\u00fcrler.`
      const sonuc = await sendTwilioMessage({ channel: 'whatsapp', toPhone: telefon, body: mesaj })
      whatsappGonderildi = sonuc.ok
    }
  }

  return NextResponse.json({ formId: form.id, link, whatsappGonderildi })
}
