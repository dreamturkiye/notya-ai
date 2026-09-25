/**
 * NOTYA-INTAKE-01 — hasta bilgi formu oluşturma/listeleme.
 *
 * POST bir form linki üretir (davet_token_hash desenindeki gibi: satırın kendisi token taşır,
 * ayrı bir tablo yok) ve linki döndürür. Sunucu HİÇBİR ŞEY GÖNDERMEZ (NOTYA-ILETISIM-01, Kaan
 * 2026-09-25): link, hasta dosyasındaki tek gönder düğmesiyle (components/doktor/iletisim/GonderDugmesi)
 * doktorun ya da sekreterin KENDİ WhatsApp'ından / e-postasından açılır; eski Twilio gönderimi kaldırıldı.
 * Kanal alanı yalnızca kayıt amaçlı.
 */
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { bransAnahtari } from '@/lib/specialties/kapsam'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'

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
    .select('id')
    .eq('id', patientId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamad\u0131.' }, { status: 404 })

  // HASTA-IZOLASYON-01: randevuId de g\u00f6vdeden gelir \u2014 yaln\u0131z bu doktorun, bu hastaya ait randevusu ba\u011flan\u0131r.
  let bagliRandevu: string | null = null
  if (randevuId) {
    const { data: rv } = await supabase.from('randevular').select('id')
      .eq('id', randevuId).eq('doktor_id', doktorId).eq('patient_id', patientId).maybeSingle()
    bagliRandevu = rv?.id ?? null
  }
  // NOTYA-BETA-0925: bran\u015f verilmezse (randevu penceresi, sekreter) prati\u011fin hekiminin bran\u015f\u0131 \u2014 pediatri hastas\u0131
  // genel form de\u011fil pediatri formu als\u0131n (HastaIntake varsay\u0131lan\u0131yla ayn\u0131 karar).
  let formBransi = brans || ''
  if (!formBransi) {
    const { data: hekim } = await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
    const k = bransAnahtari((hekim as { specialty?: string } | null)?.specialty)
    formBransi = k && Object.prototype.hasOwnProperty.call(BRANS_ETIKETLERI, k) ? k : 'genel'
  }

  const token = randomBytes(24).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 g\u00fcn

  const { data: form, error } = await supabase
    .from('hasta_intake_formlari')
    .insert({
      doktor_id: doktorId,
      patient_id: patientId,
      randevu_id: bagliRandevu,
      brans: formBransi,
      gonderim_kanali: kanal || 'elden',
      token_hash: tokenHash,
      token_expires_at: expiresAt,
    })
    .select('id')
    .single()

  if (error || !form) return NextResponse.json({ error: 'Form olu\u015fturulamad\u0131.' }, { status: 500 })

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.notya.io'
  const link = `${site}/intake/${token}`

  return NextResponse.json({ formId: form.id, link })
}
