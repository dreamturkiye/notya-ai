/**
 * NOTYA-DASHBOARD — "Son notlar" paneli için hasta adıyla son 5 not.
 * Kaan (2026-09-10): listede hangi hastanın notu olduğu anlaşılmıyordu; adı notun başına yazalım.
 * Hasta adı şifreli (name_encrypted) olduğundan istemci çözemez; bu uç sunucuda çözer ve
 * KVKK gereği yalnız "Ad S." biçiminde döndürür (portal/liste görünümü için yeterli).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

function kisaAd(nameEncrypted: string | null | undefined): string {
  if (!nameEncrypted) return ''
  try {
    const n = JSON.parse(decrypt(nameEncrypted)) as { ad?: string; soyad?: string }
    const ad = (n.ad || '').trim()
    const soyad = (n.soyad || '').trim()
    return soyad ? `${ad} ${soyad[0].toLocaleUpperCase('tr-TR')}.` : ad
  } catch { return '' }
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const { data, error } = await supabase
    .from('notes')
    .select('id, created_at, content_subjektif, basvuru_yakinmasi, approved_at, sessions(specialty, patient_id)')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(5)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  type Satir = { id: string; created_at: string; content_subjektif: string | null; basvuru_yakinmasi: string | null; approved_at: string | null; sessions: { specialty?: string | null; patient_id?: string | null } | { specialty?: string | null; patient_id?: string | null }[] | null }
  const satirlar = (data || []) as Satir[]
  const pidler = [...new Set(satirlar.map((s) => (Array.isArray(s.sessions) ? s.sessions[0]?.patient_id : s.sessions?.patient_id)).filter(Boolean))] as string[]
  const adlar = new Map<string, string>()
  if (pidler.length) {
    const { data: hastalar } = await supabase.from('patients').select('id, name_encrypted').in('id', pidler)
    for (const h of (hastalar || []) as { id: string; name_encrypted: string | null }[]) adlar.set(h.id, kisaAd(h.name_encrypted))
  }
  return NextResponse.json({
    notlar: satirlar.map((s) => {
      const seans = Array.isArray(s.sessions) ? s.sessions[0] : s.sessions
      return {
        id: s.id,
        created_at: s.created_at,
        specialty: seans?.specialty || 'genel',
        hastaAdi: (seans?.patient_id && adlar.get(seans.patient_id)) || '',
        ozet: s.basvuru_yakinmasi || s.content_subjektif || '',
        approved_at: s.approved_at,
      }
    }),
  })
}
