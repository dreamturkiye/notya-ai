/**
 * NOTYA-ONBURO-FISILTI-01 — Ön büro fısıltısı: desk-only items for the secretary (and practice).
 *
 * Deliberately separate from the doctor's clinical Fısıltı (kohort / kalkan / lab). Ön büro tracks
 * what the front desk must clear: unanswered portal messages, appointment requests, unfiled
 * incoming documents, today's appointments without a phone, today's no-shows, and filled intake
 * forms awaiting review. Clear by resolving — no hide layer in v1.
 */
import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MESAJ_GECIKME_SAAT } from '@/lib/doktor/fisiltiOrtak'
import { hastaAdiCoz, tabloYokMu } from '@/lib/iletisim/sunucu'
import { decrypt } from '@/lib/security/encryption'
import { talepListesi } from '@/lib/randevu/v2/sunucu'
import { yeniSayisi } from '@/lib/gelenBelgeler/sunucu'
import { gelenBelgeErisimi, sekreterErisimiAcikMi } from '@/lib/gelenBelgeler/yetki'
import type { PratikRol } from '@/lib/doktor/pratikOturum'

export type OnBuroKaynak = 'mesaj' | 'talep' | 'belge' | 'telefon' | 'gelmedi' | 'form'

export interface OnBuroFisiltiItem {
  id: string
  kaynak: OnBuroKaynak
  /** Patient name, or a practice-level label (e.g. "Gelen belgeler"). */
  ad: string
  baslik: string
  detay: string[]
  enErkenTarih: string | null
  hedefYol: string
  /** Lower = more urgent. Used before date sort. */
  oncelik: number
  patientId?: string | null
  toplamBekleyen?: number
}

/** TR calendar day (Europe/Istanbul) as YYYY-MM-DD. */
export function trtGunIso(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

export function trtGunAraligi(gunIso: string): { bas: string; bit: string } {
  return {
    bas: new Date(`${gunIso}T00:00:00+03:00`).toISOString(),
    bit: new Date(`${gunIso}T23:59:59.999+03:00`).toISOString(),
  }
}

/** Pure: unread threads older than the delay become fısıltı candidates. */
export function mesajOgeleri(
  threads: Array<{ id: string; patientId: string; hastaAdi: string; ozet: string; sonMesajAt: string }>,
  simdi: number = Date.now(),
  gecikmeSaat: number = MESAJ_GECIKME_SAAT,
): OnBuroFisiltiItem[] {
  const esik = simdi - gecikmeSaat * 3600_000
  return threads
    .filter((t) => new Date(t.sonMesajAt).getTime() <= esik)
    .map((t) => ({
      id: `mesaj:${t.patientId}:${t.id}`,
      kaynak: 'mesaj' as const,
      ad: t.hastaAdi || 'Hasta',
      baslik: 'yanıt bekleyen mesaj',
      detay: t.ozet ? [t.ozet] : [`${gecikmeSaat} saatten uzun süredir okunmadı`],
      enErkenTarih: t.sonMesajAt,
      hedefYol: `/dashboard/doktor/mesajlar?konu=${t.id}`,
      oncelik: 1,
      patientId: t.patientId,
    }))
}

/** Pure: open portal appointment requests. Escalated / past-due pin first. */
export function talepOgeleri(
  talepler: Array<{
    id: string
    hastaAdi: string
    patientId?: string | null
    gun: string
    saat: string
    baslangic?: string
    talepAt?: string | null
    oneriBekliyor?: boolean
    gecikti?: boolean
    zamaniGecti?: boolean
  }>,
): OnBuroFisiltiItem[] {
  return talepler.map((t) => {
    const acil = !!(t.gecikti || t.zamaniGecti)
    const baslik = t.oneriBekliyor
      ? 'öneriye yanıt bekleniyor'
      : t.zamaniGecti
        ? 'randevu talebi — saati geçti'
        : t.gecikti
          ? 'randevu talebi — yanıt bekliyor'
          : 'randevu talebi'
    return {
      id: `talep:${t.id}`,
      kaynak: 'talep' as const,
      ad: t.hastaAdi || 'Hasta',
      baslik,
      detay: [`${t.gun} ${t.saat}`.trim()],
      enErkenTarih: t.talepAt || t.baslangic || null,
      hedefYol: '/dashboard/doktor/randevular',
      oncelik: acil ? 0 : 2,
      patientId: t.patientId || null,
    }
  })
}

/** Pure: one practice-level item when there are unfiled incoming documents. */
export function belgeOgesi(sayi: number, enEskiAt: string | null = null): OnBuroFisiltiItem | null {
  if (sayi <= 0) return null
  return {
    id: 'belge:inbox',
    kaynak: 'belge',
    ad: 'Gelen belgeler',
    baslik: sayi === 1 ? '1 yeni belge dosyalanmayı bekliyor' : `${sayi} yeni belge dosyalanmayı bekliyor`,
    detay: ['Notya okudu, hastayı önerdi — dosyaya eklemek tek dokunuş.'],
    enErkenTarih: enEskiAt,
    hedefYol: '/dashboard/doktor/gelen-belgeler',
    oncelik: 2,
  }
}

/** Pure: today's appointments with no usable phone number. */
export function telefonOgeleri(
  randevular: Array<{
    id: string
    hastaAdi: string
    hastaTelefon?: string | null
    baslangic: string
    durum: string
    patientId?: string | null
  }>,
): OnBuroFisiltiItem[] {
  return randevular
    .filter((r) => r.durum !== 'iptal' && r.durum !== 'talep')
    .filter((r) => !String(r.hastaTelefon || '').trim())
    .map((r) => ({
      id: `telefon:${r.id}`,
      kaynak: 'telefon' as const,
      ad: r.hastaAdi || 'Hasta',
      baslik: 'telefon numarası yok',
      detay: ['Bugünkü randevu — hatırlatma / WhatsApp için numara ekleyin.'],
      enErkenTarih: r.baslangic,
      hedefYol: '/dashboard/doktor/randevular',
      oncelik: 3,
      patientId: r.patientId || null,
    }))
}

/** Pure: today's no-shows that still need a callback. */
export function gelmediOgeleri(
  randevular: Array<{
    id: string
    hastaAdi: string
    baslangic: string
    durum: string
    patientId?: string | null
  }>,
): OnBuroFisiltiItem[] {
  return randevular
    .filter((r) => r.durum === 'gelmedi')
    .map((r) => ({
      id: `gelmedi:${r.id}`,
      kaynak: 'gelmedi' as const,
      ad: r.hastaAdi || 'Hasta',
      baslik: 'gelmedi — aranacak',
      detay: ['Bugün gelmedi olarak işaretlendi; hastayı arayıp yeni saat önerin.'],
      enErkenTarih: r.baslangic,
      hedefYol: '/dashboard/doktor/randevular',
      oncelik: 3,
      patientId: r.patientId || null,
    }))
}

/** Pure: filled intake forms awaiting practice review. */
export function formOgeleri(
  formlar: Array<{
    id: string
    patientId: string
    hastaAdi: string
    doldurulduAt: string | null
  }>,
): OnBuroFisiltiItem[] {
  return formlar.map((f) => ({
    id: `form:${f.id}`,
    kaynak: 'form' as const,
    ad: f.hastaAdi || 'Hasta',
    baslik: 'bilgi formu dolduruldu — inceleme bekliyor',
    detay: ['Hasta formu gönderdi; inceleyip dosyaya işleyin.'],
    enErkenTarih: f.doldurulduAt,
    hedefYol: `/dashboard/doktor/hastalar/${f.patientId}`,
    oncelik: 4,
    patientId: f.patientId,
  }))
}

export function onBuroSirala(ogeler: OnBuroFisiltiItem[]): OnBuroFisiltiItem[] {
  return [...ogeler].sort((a, b) => {
    if (a.oncelik !== b.oncelik) return a.oncelik - b.oncelik
    return String(a.enErkenTarih || '9999').localeCompare(String(b.enErkenTarih || '9999'))
  })
}

async function bugunRandevulari(
  supabase: SupabaseClient,
  doktorId: string,
  gunIso: string,
): Promise<Array<{
  id: string
  hastaAdi: string
  hastaTelefon: string
  baslangic: string
  durum: string
  patientId: string | null
}>> {
  const { bas, bit } = trtGunAraligi(gunIso)
  const { data, error } = await supabase
    .from('randevular')
    .select('id, baslangic, durum, patient_id, hasta_adi_serbest, hasta_telefon_serbest')
    .eq('doktor_id', doktorId)
    .lt('baslangic', bit)
    .gt('bitis', bas)
    .order('baslangic', { ascending: true })
    .limit(200)
  if (error || !data?.length) return []

  const patientIds = [...new Set(data.map((r) => r.patient_id).filter(Boolean))] as string[]
  const telefonlar = new Map<string, string>()
  const adlar = new Map<string, string>()
  if (patientIds.length) {
    const { data: hastalar } = await supabase
      .from('patients')
      .select('id, name_encrypted, phone_encrypted')
      .eq('doctor_id', doktorId)
      .in('id', patientIds)
    for (const h of hastalar || []) {
      const ad = hastaAdiCoz(h.name_encrypted)
      if (ad) adlar.set(String(h.id), ad)
      try {
        if (h.phone_encrypted) {
          const tel = decrypt(String(h.phone_encrypted)) || ''
          if (tel.trim()) telefonlar.set(String(h.id), tel.trim())
        }
      } catch { /* blank */ }
    }
  }

  return data.map((r) => {
    const pid = r.patient_id ? String(r.patient_id) : null
    return {
      id: String(r.id),
      baslangic: String(r.baslangic),
      durum: String(r.durum || ''),
      patientId: pid,
      hastaAdi: (pid && adlar.get(pid)) || String(r.hasta_adi_serbest || '').trim() || 'Hasta',
      hastaTelefon: (pid && telefonlar.get(pid)) || String(r.hasta_telefon_serbest || '').trim() || '',
    }
  })
}

async function doldurulmusFormlar(
  supabase: SupabaseClient,
  doktorId: string,
): Promise<Array<{ id: string; patientId: string; hastaAdi: string; doldurulduAt: string | null }>> {
  const { data, error } = await supabase
    .from('hasta_intake_formlari')
    .select('id, patient_id, dolduruldu_at')
    .eq('doktor_id', doktorId)
    .eq('durum', 'dolduruldu')
    .order('dolduruldu_at', { ascending: true })
    .limit(50)
  if (error) {
    if (tabloYokMu(error)) return []
    return []
  }
  if (!data?.length) return []
  const ids = [...new Set(data.map((f) => String(f.patient_id)))]
  const adlar = new Map<string, string>()
  const { data: hastalar } = await supabase
    .from('patients')
    .select('id, name_encrypted')
    .eq('doctor_id', doktorId)
    .in('id', ids)
  for (const h of hastalar || []) {
    const ad = hastaAdiCoz(h.name_encrypted)
    if (ad) adlar.set(String(h.id), ad)
  }
  return data.map((f) => ({
    id: String(f.id),
    patientId: String(f.patient_id),
    hastaAdi: adlar.get(String(f.patient_id)) || 'Hasta',
    doldurulduAt: f.dolduruldu_at ? String(f.dolduruldu_at) : null,
  }))
}

/**
 * Collect every Ön büro fısıltı candidate for the practice. Uses the same pratik-scoped sources
 * the desk already sees (mesajlar, talepler, gelen belgeler, bugünün randevuları, intake).
 */
export async function onBuroFisiltiOgeleri(
  req: NextRequest,
  supabase: SupabaseClient,
  doktorId: string,
  rol: PratikRol,
): Promise<OnBuroFisiltiItem[]> {
  const auth = req.headers.get('authorization') || ''
  const ogeler: OnBuroFisiltiItem[] = []
  const bugun = trtGunIso()

  // Mesajlar (>24h unread) — reuse practice inbox route (doktor + sekreter).
  try {
    const iç = await fetch(new URL('/api/doktor/mesajlar?unread=1', req.url), {
      headers: { Authorization: auth },
      cache: 'no-store',
    })
    if (iç.ok) {
      const j = await iç.json()
      const threads: Array<{ id: string; patientId: string; hastaAdi: string; ozet: string; sonMesajAt: string }> =
        Array.isArray(j?.threads) ? j.threads : []
      ogeler.push(...mesajOgeleri(threads))
    }
  } catch { /* fısıltı kritik değil */ }

  // Randevu talepleri
  try {
    const liste = await talepListesi(supabase, doktorId)
    if (liste?.talepler?.length) ogeler.push(...talepOgeleri(liste.talepler))
  } catch { /* soft */ }

  // Gelen belgeler (sekreter only when Ayarlar switch is on)
  try {
    const erisim = gelenBelgeErisimi(
      rol,
      rol === 'sekreter' ? await sekreterErisimiAcikMi(supabase, doktorId) : true,
    )
    if (erisim) {
      const sayi = await yeniSayisi(supabase, doktorId)
      let enEski: string | null = null
      if (sayi > 0) {
        const { data } = await supabase
          .from('gelen_belgeler')
          .select('created_at')
          .eq('doctor_id', doktorId)
          .eq('durum', 'yeni')
          .order('created_at', { ascending: true })
          .limit(1)
        enEski = data?.[0]?.created_at ? String(data[0].created_at) : null
      }
      const b = belgeOgesi(sayi, enEski)
      if (b) ogeler.push(b)
    }
  } catch { /* soft */ }

  // Bugünün telefon eksikleri + gelmedi
  try {
    const bugunku = await bugunRandevulari(supabase, doktorId, bugun)
    ogeler.push(...telefonOgeleri(bugunku))
    ogeler.push(...gelmediOgeleri(bugunku))
  } catch { /* soft */ }

  // Doldurulmuş bilgi formları
  try {
    ogeler.push(...formOgeleri(await doldurulmusFormlar(supabase, doktorId)))
  } catch { /* soft */ }

  return onBuroSirala(ogeler)
}
