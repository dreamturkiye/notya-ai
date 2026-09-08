import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import Anthropic from '@anthropic-ai/sdk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * NOTYA-DOZ-ONER-01 (Gökhan, 2026-09-08): "Yeni İlaç Ekle" ekranında doktor bir ilaç seçince,
 * AI hastanın KİLO (son onaylı muayene notunun vitalleri) ve YAŞ (doğum tarihi) bilgisinden
 * mg/kg doz + kullanım sıklığı ÖNERİR. Bu YALNIZ öneridir — doktor kabul edip düzenler ya da
 * elle yazar. Kilo/yaş sunucuda (şifreli veriden) çözülür, istemciye ham gitmez.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }
    const token = auth.slice(7)
    const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    const { data: { user }, error: authErr } = await sb.auth.getUser(token)
    if (authErr || !user) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const patientId = String(body.patientId || '')
    const ilacAdi = String(body.ilacAdi || '')
    const etkenMadde = String(body.etkenMadde || '')
    if (!patientId || (!ilacAdi && !etkenMadde)) {
      return NextResponse.json({ error: 'patientId ve ilaç bilgisi gerekli' }, { status: 400 })
    }

    // Hasta doğum tarihi (şifreli) → yaş, ve sahiplik kontrolü
    const { data: patient } = await sb
      .from('patients')
      .select('dob_encrypted, doctor_id')
      .eq('id', patientId)
      .maybeSingle()
    if (!patient || patient.doctor_id !== user.id) {
      return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
    }
    let dob = ''
    try { if (patient.dob_encrypted) dob = decrypt(patient.dob_encrypted) } catch { /* yaş atlanır */ }
    let yasMetni = 'bilinmiyor'
    if (dob) {
      const d = new Date(dob)
      if (!isNaN(d.getTime())) {
        const ayFarki = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.4)
        yasMetni = ayFarki < 24 ? `${Math.round(ayFarki)} aylık` : `${Math.floor(ayFarki / 12)} yaşında`
      }
    }

    // Son onaylı notun vitallerinden kilo
    const { data: notlar } = await sb
      .from('notes')
      .select('vitaller, created_at, sessions!inner(patient_id)')
      .eq('sessions.patient_id', patientId)
      .not('approved_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
    let kilo: number | null = null
    const v = (notlar && notlar[0]?.vitaller) as Record<string, unknown> | null
    if (v && v.kilo != null) {
      const k = Number(v.kilo)
      if (!isNaN(k) && k > 0) kilo = k
    }

    // Kilo yoksa güvenli mg/kg hesabı yapılamaz — dürüst dön, elle giriş önerisiyle.
    if (kilo == null) {
      return NextResponse.json({
        oneri: null,
        neden: 'Son muayene notunda kilo bulunamadı — doz önerisi için kilo gerekli. Doz ve sıklığı elle girebilirsiniz.',
        kilo: null,
        yas: yasMetni,
      })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const prompt = `Türkiye'de ruhsatlı ilaçlar ve Türk pediatri/erişkin doz pratiğine göre öneri ver.
İlaç: ${ilacAdi}${etkenMadde ? ` (etken madde: ${etkenMadde})` : ''}
Hasta: ${yasMetni}, kilo ${kilo} kg.
Bu ilaç için uygun DOZ (pediatride mg/kg hesabıyla, bu kiloya göre somut mg veya mL) ve KULLANIM SIKLIĞI öner.
SADECE geçerli JSON döndür, başka metin yazma:
{"doz": "<örn. 560 mg veya 11 mL>", "kullanim": "<örn. 2x1>", "aciklama": "<tek cümle: mg/kg hesabı veya gerekçe>"}
Kiloya/yaşa uygun değilse veya bu ilaç bu yaşta önerilmezse doz'u boş bırak, aciklama'da nedenini yaz.`

    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = resp.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { text: string }).text)
      .join('')
    let parsed: { doz?: string; kullanim?: string; aciklama?: string } = {}
    try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) } catch { /* boş öneri döner */ }

    return NextResponse.json({
      oneri: {
        doz: String(parsed.doz || ''),
        kullanim: String(parsed.kullanim || ''),
        aciklama: String(parsed.aciklama || ''),
      },
      kilo,
      yas: yasMetni,
    })
  } catch {
    return NextResponse.json({ error: 'Doz önerisi üretilemedi' }, { status: 500 })
  }
}
