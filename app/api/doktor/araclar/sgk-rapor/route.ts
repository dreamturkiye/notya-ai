import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pseudonymize, restoreDeep, assertNoTckn } from '@/lib/security/pseudonymize'
import { decrypt } from '@/lib/security/encryption'
import { arsivsizNotlar } from '@/lib/doktor/arsiv'
import { aiCagir } from '@/lib/ai/cagir'
import {
  addDaysTr,
  resolveRaporTipi,
  systemPromptFor,
  type HekimKimlik,
  type SgkRaporDraft,
} from '@/lib/sgk/raporTipleri'

export const dynamic = 'force-dynamic'

// NOTYA-SGK-RAPOR-02 (Kaan, 2026-09-23): the SGK draft now uses the patient's approved notes.
// Routed through the same Anthropic path as every other clinical call (aiCagir, ai-model-politikasi)
// instead of Groq/xAI: no new processor for health data (KVKK), same logging/cost metering.
// The pseudonymize/restore map and the TCKN guard stay in front of the call.
async function taslakUret(system: string, user: string, doctorId: string): Promise<SgkRaporDraft> {
  const yanit = await aiCagir({
    gorev: 'klinik-analiz',
    maxTokens: 2200,
    doctorId,
    system,
    messages: [{ role: 'user', content: user }],
  })
  const blok = yanit.content.find((c) => c.type === 'text')
  const content = blok && blok.type === 'text' ? blok.text : ''
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
      process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
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

    // Notes link to the patient through sessions (notes has no patient_id). Only this doctor's
    // approved, non-archived notes (arsivsizNotlar), newest 3.
    const { data: notes } = await arsivsizNotlar(sb, 'content_degerlendirme, content_plan, content_objektif, sessions!inner(patient_id)')
      .eq('sessions.patient_id', hastaId)
      .eq('doctor_id', user.id)
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

    const rapor = restoreDeep(await taslakUret(systemPromptFor(tip), userPrompt, user.id), map) as SgkRaporDraft
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

    const { enabizSgkRapor } = await import('@/lib/enabiz/paket')
    const enabiz = enabizSgkRapor({
      raporTipiId: tip.id,
      raporTipiLabel: tip.label,
      draft: rapor,
      hekim,
    })

    return NextResponse.json({
      rapor,
      tarih,
      hekim,
      raporTipi: tip,
      enabiz,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ hata: message }, { status: 500 })
  }
}
