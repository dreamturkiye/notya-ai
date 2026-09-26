/**
 * NOTYA-TEK-BEYIN — sesli turların EKRAN biçimi (/asistan sayfası görüşme sırasında hafifçe yoklar).
 *
 * Sesli Ayşe ElevenLabs'ten yalnız kısa sözlü biçimi konuşur; tam cevap (liste, tablo, kimlik değerleri) ve onay
 * kartları ortak asistan oturumuna yazılır, sayfa burada okur. NOTYA-SES-DEVAM-01: kesilen turun okunmamış kalanı
 * varsa `devam` / `devamAnahtar` döner; sayfa ajan susunca gizli `[devam]` turunu bir kez yollar. Kimlik cevabının değerleri saklanmaz — turun sorusu
 * burada, sunucuda, yeniden cevaplanır (kimlikSorusunuCevapla, doctor_id kapsamlı).
 *
 * HASTA-IZOLASYON-01: oturum id + doctor_id birlikte; yabancı oturum → 404. Kart hastası oturumun kendi satırından,
 * kart ve hasta okuması /api/doktor/eylem'de yine doctor_id kapsamlı.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { kimlikSorusunuCevapla } from '@/lib/doktor/kimlikSorusu'
import type { OturumMesaji, SesDevam } from '@/lib/asistan/ayseCevapla'

export const dynamic = 'force-dynamic'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7))
  if (!user) return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })

  const oturumId = String(req.nextUrl.searchParams.get('oturum') || '').trim()
  const sonra = String(req.nextUrl.searchParams.get('sonra') || '')
  if (!oturumId) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 400 })
  const { data: oturum } = await supabase
    .from('asistan_sessions')
    .select('id, messages, active_context')
    .eq('id', oturumId)
    .eq('doctor_id', user.id)
    .maybeSingle()
  if (!oturum) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })

  const mesajlar = ((oturum as { messages?: OturumMesaji[] }).messages || [])
  const baglam = ((oturum as { active_context?: Record<string, unknown> }).active_context || {})
  const sesDevam = baglam.sesDevam as SesDevam | undefined
  const devamAnahtar = sesDevam && typeof sesDevam.kalan === 'string' && sesDevam.kalan.trim() ? String(sesDevam.anahtar || '') || null : null
  const turlar: { zaman: string; metin: string; kartlar: string[]; hastaId: string | null; devam: boolean }[] = []
  for (let i = 0; i < mesajlar.length; i++) {
    const m = mesajlar[i]
    if (m?.role !== 'assistant' || m.kanal !== 'ses' || !m.zaman || (sonra && m.zaman <= sonra)) continue
    let metin = String(m.content || '')
    if (m.kimlik) {
      const soru = mesajlar[i - 1]?.role === 'user' ? String(mesajlar[i - 1].content || '') : ''
      try {
        const k = soru ? await kimlikSorusunuCevapla(supabase, user.id, soru, m.hastaId || null) : null
        if (k) metin = k.ekran
      } catch { /* değersiz metin kalır */ }
    }
    turlar.push({ zaman: m.zaman, metin, kartlar: Array.isArray(m.kartlar) ? m.kartlar.map(String) : [], hastaId: m.hastaId || null, devam: devamAnahtar === m.zaman })
  }
  return NextResponse.json({
    turlar,
    // Cursor-independent: the page waits for Ayşe to stop speaking and re-checks on every poll until consumed.
    devam: Boolean(devamAnahtar),
    devamAnahtar,
    aktifHasta: typeof baglam.patientName === 'string' ? baglam.patientName : null,
    // Sesle onaylanan / vazgeçilen kart artık bekleyen değildir — sayfa kartı kapatır.
    bekleyen: Array.isArray(baglam.bekleyenOneriler) ? baglam.bekleyenOneriler.map(String) : [],
  })
}
