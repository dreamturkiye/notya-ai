import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'

interface SGKRapor {
  raporBasligi: string
  hastaAdi: string
  tcSon4: string
  tani: { icd10: string; aciklama: string }
  anamnez: string
  mevcutDurum: string
  calismaKapasitesi: 'tam' | 'kisitli' | 'yok'
  onerilen_sure_ay: number
  hekim_notu: string
  zorunluTetkikler: string[]
}

async function groqChat(system: string, user: string): Promise<SGKRapor> {
  const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY || process.env.GROK_API_KEY || ''
  if (!apiKey) throw new Error('GROQ_API_KEY tanımlı değil')

  const response = await fetch(
    process.env.GROQ_API_KEY
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.x.ai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'grok-3-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    }
  )

  if (!response.ok) throw new Error('LLM API hatası')
  const data = await response.json()
  const content = data.choices[0]?.message?.content
  if (!content) throw new Error('Yanıt boş')

  const cleaned = String(content)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return JSON.parse(cleaned) as SGKRapor
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ hata: 'Yetkisiz erişim' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const {
      data: { user },
      error: authError,
    } = await sb.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ hata: 'Geçersiz oturum' }, { status: 401 })
    }

    const body = await request.json()
    const hastaId = String(body?.hastaId || '')
    const raporTipi = String(body?.raporTipi || '')
    const sure = Number(body?.sure)
    if (!hastaId || !raporTipi || !Number.isFinite(sure)) {
      return NextResponse.json({ hata: 'Eksik parametreler' }, { status: 400 })
    }

    const { data: hasta, error: hastaError } = await sb
      .from('patients')
      .select('id, name_encrypted, notes_encrypted')
      .eq('id', hastaId)
      .eq('doctor_id', user.id)
      .maybeSingle()

    if (hastaError || !hasta) {
      return NextResponse.json({ hata: 'Hasta bulunamadı' }, { status: 404 })
    }

    let hastaAdi = 'Hasta'
    try {
      if (hasta.name_encrypted) {
        const parsed = JSON.parse(decrypt(hasta.name_encrypted))
        hastaAdi = `${parsed.ad || ''} ${parsed.soyad || ''}`.trim() || 'Hasta'
      }
    } catch {
      /* keep default */
    }

    const { data: notes } = await sb
      .from('notes')
      .select('content_degerlendirme, content_plan')
      .eq('patient_id', hastaId)
      .not('approved_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3)

    const notMetinleri =
      (notes || [])
        .map((n) => `${n.content_degerlendirme || ''} ${n.content_plan || ''}`.trim())
        .filter(Boolean)
        .join('\n') ||
      (hasta.notes_encrypted ? 'Hasta notları mevcut.' : 'Hasta notu yok.')

    const systemPrompt =
      'SGK resmi rapor yazma uzmanısın. SADECE JSON: {raporBasligi,hastaAdi,tcSon4,tani:{icd10,aciklama},anamnez,mevcutDurum,calismaKapasitesi:tam|kisitli|yok,onerilen_sure_ay:number,hekim_notu,zorunluTetkikler:[]}'
    const userPrompt = `Rapor tipi: ${raporTipi}. Sure: ${sure} ay. Hasta: ${hastaAdi}. Hasta notlari: ${notMetinleri}`

    const rapor = await groqChat(systemPrompt, userPrompt)
    if (!rapor.hastaAdi) rapor.hastaAdi = hastaAdi

    const tarih = new Date().toLocaleDateString('tr-TR')
    return NextResponse.json({ rapor, tarih })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ hata: message }, { status: 500 })
  }
}
