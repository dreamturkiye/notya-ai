import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pseudonymize, restoreDeep, assertNoTckn } from '@/lib/security/pseudonymize'
import { decrypt } from '@/lib/security/encryption'
import {
  addDaysTr,
  resolveRaporTipi,
  systemPromptFor,
  type HekimKimlik,
  type SgkRaporDraft,
} from '@/lib/sgk/raporTipleri'

export const dynamic = 'force-dynamic'

async function groqChat(system: string, user: string): Promise<SgkRaporDraft> {
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
        max_tokens: 2200,
      }),
    }
  )

  if (!response.ok) throw new Error('LLM API hatası')
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Yanıt boş')

  const cleaned = String(content)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return JSON.parse(cleaned) as SgkRaporDraft
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
    const hekimNotu = String(body?.hekimNotu || '').trim().slice(0, 2000)
    const tip = resolveRaporTipi(String(body?.raporTipi || body?.raporTipiId || ''))
    const sureRaw = Number(body?.sure)
    if (!hastaId || !Number.isFinite(sureRaw)) {
      return NextResponse.json({ hata: 'Eksik parametreler' }, { status: 400 })
    }
    const sure = Math.min(tip.sureMax, Math.max(tip.sureMin, Math.round(sureRaw)))

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
      .select('content_degerlendirme, content_plan, content_objektif')
      .eq('patient_id', hastaId)
      .not('approved_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3)

    const notMetinleri =
      (notes || [])
        .map((n) =>
          `${n.content_objektif || ''} ${n.content_degerlendirme || ''} ${n.content_plan || ''}`.trim()
        )
        .filter(Boolean)
        .join('\n') ||
      (hasta.notes_encrypted ? 'Hasta notları mevcut.' : 'Hasta notu yok.')

    const { text: guvenliNotlar, map } = pseudonymize(notMetinleri, [hastaAdi])
    const sureLabel = tip.sureBirimi === 'gun' ? `${sure} gün` : `${sure} ay`
    const userPrompt = `Rapor tipi: ${tip.label} (${tip.id}). Süre: ${sureLabel}. Hasta: [HASTA]. Hasta notları: ${guvenliNotlar}`
    assertNoTckn(userPrompt, 'sgk-rapor')

    const rapor = restoreDeep(await groqChat(systemPromptFor(tip), userPrompt), map) as SgkRaporDraft
    rapor.hastaAdi = hastaAdi
    rapor.tcSon4 = ''
    rapor.hekim_notu = hekimNotu
    rapor.raporBasligi = rapor.raporBasligi || tip.label
    if (!rapor.tani || typeof rapor.tani !== 'object') {
      rapor.tani = { icd10: '', aciklama: '' }
    }
    if (!Array.isArray(rapor.etkenMaddeler)) rapor.etkenMaddeler = []
    if (!Array.isArray(rapor.malzemeOnerileri)) rapor.malzemeOnerileri = []
    if (!Array.isArray(rapor.zorunluTetkikler)) rapor.zorunluTetkikler = []

    // Strip legacy non-SGK field if model still emits it
    delete (rapor as { calismaKapasitesi?: unknown }).calismaKapasitesi

    const bugun = new Date()
    const tarih = bugun.toLocaleDateString('tr-TR')
    rapor.baslangicTarihi = rapor.baslangicTarihi || tarih

    if (tip.sureBirimi === 'gun') {
      const gun = Math.min(tip.sureMax, Math.max(tip.sureMin, Number(rapor.istirahat_suresi_gun) || sure))
      rapor.istirahat_suresi_gun = gun
      rapor.bitisTarihi = addDaysTr(bugun, gun)
      delete rapor.onerilen_sure_ay
    } else {
      const ay = Math.min(tip.sureMax, Math.max(tip.sureMin, Number(rapor.onerilen_sure_ay) || sure))
      rapor.onerilen_sure_ay = ay
      delete rapor.istirahat_suresi_gun
    }

    if (tip.id === 'is_goremezlik' && !rapor.raporTuru) rapor.raporTuru = 'Ilk'

    const [{ data: profil }, { data: medula }] = await Promise.all([
      sb.from('users').select('full_name, specialty').eq('id', user.id).maybeSingle(),
      sb
        .from('doctor_integrations')
        .select('meta')
        .eq('user_id', user.id)
        .eq('provider', 'medula')
        .eq('is_active', true)
        .maybeSingle(),
    ])
    const meta = (medula?.meta || {}) as {
      tesisKodu?: string
      sicilNo?: string
      diplomaTescilNo?: string
      saglikKurumu?: string
      kurumAdi?: string
    }

    const hekim: HekimKimlik = {
      adSoyad: profil?.full_name || user.user_metadata?.full_name || '',
      uzmanlik: profil?.specialty || user.user_metadata?.specialty || '',
      diplomaTescilNo: meta.diplomaTescilNo || meta.sicilNo || '',
      saglikKurumu: meta.saglikKurumu || meta.kurumAdi || '',
      tesisKodu: meta.tesisKodu || '',
      medulaBagli: !!medula,
    }

    return NextResponse.json({
      rapor,
      tarih,
      hekim,
      raporTipi: tip,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ hata: message }, { status: 500 })
  }
}
