/**
 * NOTYA-TEK-BEYIN — sesli turların EKRAN biçimi (/asistan sayfası görüşme sırasında hafifçe yoklar).
 *
 * Sesli Ayşe ElevenLabs'ten yalnız kısa sözlü biçimi konuşur; tam cevap (liste, tablo, kimlik değerleri) ve onay
 * kartları ortak asistan oturumuna yazılır, sayfa burada okur. NOTYA-SES-DEVAM-01: kesilen turun okunmamış kalanı
 * varsa `devam` / `devamAnahtar` / `devamKalan` döner; sayfa ajan susunca gizli `[devam]` turunu bir kez yollar
 * (Fish'te, AYSE_SES_SAGLAYICI=fish, kalanı sayfa kendisi okur). Kimlik cevabının değerleri saklanmaz — turun sorusu
 * burada, sunucuda, yeniden cevaplanır (kimlikSorusunuCevapla, doctor_id kapsamlı).
 *
 * HASTA-IZOLASYON-01: oturum id + doctor_id birlikte; yabancı oturum → 404. Kart hastası oturumun kendi satırından,
 * kart ve hasta okuması /api/doktor/eylem'de yine doctor_id kapsamlı.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { kimlikSorusunuCevapla } from '@/lib/doktor/kimlikSorusu'
import type { OturumMesaji, SesDevam } from '@/lib/asistan/ayseCevapla'
import { alanlariYerineKoy, verilmeyenleriSil, yerTutucuVarMi } from '@/lib/asistan/hastaAlan'
import { oturumPenceresi } from '@/lib/asistan/oturumYaz'
import { createHash } from 'node:crypto'

export const dynamic = 'force-dynamic'
// SES-OMURGA-V2 (E): next to the database.
export const preferredRegion = 'iad1'

/**
 * SES-OMURGA-V2 (E/H): this route is polled twice a second during a call. A verified bearer is remembered for 30 s per
 * instance (keyed by its hash, never stored), so a poll is one windowed DB read instead of an auth call + the whole
 * history. The poll volume is logged once a minute per instance: `[ses-ekran/hacim] {istek, sn}`.
 */
const KIMLIK_ONBELLEK_MS = 30_000
const kimlikOnbellegi = new Map<string, { id: string; zaman: number }>()
let hacim = { istek: 0, bas: Date.now() }
function hacimSay(): void {
  hacim.istek++
  const sure = Date.now() - hacim.bas
  if (sure >= 60_000) {
    console.info('[ses-ekran/hacim]', JSON.stringify({ istek: hacim.istek, sn: Math.round(sure / 1000) }))
    hacim = { istek: 0, bas: Date.now() }
  }
}

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  hacimSay()
  const supabase = getSupabase()
  const ozet = createHash('sha256').update(auth.slice(7)).digest('hex')
  const bilinen = kimlikOnbellegi.get(ozet)
  let user: { id: string } | null = bilinen && Date.now() - bilinen.zaman < KIMLIK_ONBELLEK_MS ? { id: bilinen.id } : null
  if (!user) {
    const { data } = await supabase.auth.getUser(auth.slice(7))
    user = data.user ? { id: data.user.id } : null
    if (user) {
      kimlikOnbellegi.set(ozet, { id: user.id, zaman: Date.now() })
      if (kimlikOnbellegi.size > 500) kimlikOnbellegi.delete(kimlikOnbellegi.keys().next().value as string)
    }
  }
  if (!user) return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })

  const oturumId = String(req.nextUrl.searchParams.get('oturum') || '').trim()
  const sonra = String(req.nextUrl.searchParams.get('sonra') || '')
  if (!oturumId) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 400 })
  // HASTA-IZOLASYON-01: id AND doctor_id; a window of the history (the stored history is no longer cut at 20).
  const oturum = await oturumPenceresi(supabase, oturumId, user.id, 40)
  if (!oturum) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })

  const mesajlar = ((oturum as { messages?: OturumMesaji[] }).messages || [])
  const baglam = ((oturum as { active_context?: Record<string, unknown> }).active_context || {})
  const sesDevam = baglam.sesDevam as SesDevam | undefined
  const devamAnahtar = sesDevam && typeof sesDevam.kalan === 'string' && sesDevam.kalan.trim() ? String(sesDevam.anahtar || '') || null : null
  const devamBuCagri = Boolean(devamAnahtar && (!sonra || devamAnahtar > sonra))
  const devamKalan = devamBuCagri ? String(sesDevam!.kalan).trim() : null
  const turlar: { zaman: string; metin: string; soru: string | null; kartlar: string[]; hastaId: string | null; devam: boolean }[] = []
  for (let i = 0; i < mesajlar.length; i++) {
    const m = mesajlar[i]
    if (m?.role !== 'assistant' || m.kanal !== 'ses' || !m.zaman || (sonra && m.zaman <= sonra)) continue
    let metin = String(m.content || '')
    const onceki = mesajlar[i - 1]
    const soru = onceki?.role === 'user' ? String(onceki.content || '').trim() : ''
    if (m.kimlik) {
      // NOTYA-AYSE-ARAC-PARITE: when the model's hasta_bul call produced the identity answer, the screen is rebuilt
      // from the sentence the tool was called with (stored on the turn; a question, never a value).
      const soru = m.kimlikSorusu || (mesajlar[i - 1]?.role === 'user' ? String(mesajlar[i - 1].content || '') : '')
      try {
        const k = soru ? await kimlikSorusunuCevapla(supabase, user.id, soru, m.hastaId || null) : null
        if (k) metin = k.ekran
      } catch { /* değersiz metin kalır */ }
    }
    // NOTYA-AYSE-ALAN-01: the stored turn keeps identity placeholders plus references (field, patient id). The
    // values are put in here, for the screen only, read with the authenticated doctor's id — a reference to a
    // patient who is not this doctor's reads nothing and its placeholder is removed.
    if (yerTutucuVarMi(metin)) {
      metin = await alanlariYerineKoy(supabase, user.id, metin, Array.isArray(m.alanlar) ? m.alanlar : []).catch(() => verilmeyenleriSil(metin, null).metin)
    }
    turlar.push({ zaman: m.zaman, metin, soru: soru || null, kartlar: Array.isArray(m.kartlar) ? m.kartlar.map(String) : [], hastaId: m.hastaId || null, devam: devamBuCagri && devamAnahtar === m.zaman })
  }
  return NextResponse.json({
    turlar,
    // Bu görüşmeden önceki kesik tur okunmaz — mikrofon açılınca eski vaka konuşulmaz.
    devam: devamBuCagri,
    devamAnahtar: devamBuCagri ? devamAnahtar : null,
    devamKalan,
    aktifHasta: typeof baglam.patientName === 'string' ? baglam.patientName : null,
    // Sesle onaylanan / vazgeçilen kart artık bekleyen değildir — sayfa kartı kapatır.
    bekleyen: Array.isArray(baglam.bekleyenOneriler) ? baglam.bekleyenOneriler.map(String) : [],
  })
}
