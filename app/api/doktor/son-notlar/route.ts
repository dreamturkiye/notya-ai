/**
 * NOTYA-DASHBOARD (revised NOTYA-DASHBOARD-BEKLEYEN-01, Kaan 2026-09-24) -- ana sayfadaki panel
 * artık hastanın son notlarını değil, ONAY BEKLEYEN son 5 muayene notunu döndürür. Kaan: bir
 * ONAYLI notu tıklayıp jenerik İnceleme Kuyruğu'na düşmek (o not zaten kuyrukta olmadığı için
 * "bekleyen not yok" görünmesi) kafa karıştırıyordu -- panel yalnız gerçekten onay bekleyeni
 * göstermeli, tıklayınca da DOĞRUDAN o notun düzenleme ekranına götürmeli. Eski davranış
 * (son 5, durumdan bağımsız) başka bir sorun da taşıyordu: limit(5) onay durumundan önce
 * uygulandığı için, 5'ten fazla yeni onaylı not varsa eski bekleyen bir not listeden hiç
 * çıkmayabiliyordu -- filtre artık sorguya kendisi girdi.
 * Hasta adı şifreli (name_encrypted) olduğundan istemci çözemez; bu uç sunucuda çözer ve
 * KVKK gereği yalnız "Ad S." biçiminde döndürür (portal/liste görünümü için yeterli).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'
import { arsivsizNotlar } from '@/lib/doktor/arsiv'

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

  // NOTYA-ARSIV-01: arşivlenmiş muayenenin notu bu panelde görünmez.
  const { data, error } = await arsivsizNotlar(supabase, 'id, created_at, content_subjektif, basvuru_yakinmasi, approved_at, sessions(specialty, patient_id)')
    .eq('doctor_id', doktorId)
    .is('approved_at', null)
    .order('created_at', { ascending: false })
    .limit(5)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type Satir = { id: string; created_at: string; content_subjektif: string | null; basvuru_yakinmasi: string | null; approved_at: string | null; sessions: { specialty?: string | null; patient_id?: string | null } | { specialty?: string | null; patient_id?: string | null }[] | null }
  const satirlar = (data || []) as Satir[]
  const pidler = [...new Set(satirlar.map((s) => (Array.isArray(s.sessions) ? s.sessions[0]?.patient_id : s.sessions?.patient_id)).filter(Boolean))] as string[]
  const adlar = new Map<string, string>()
  if (pidler.length) {
    const { data: hastalar } = await supabase.from('patients').select('id, name_encrypted').eq('doctor_id', doktorId).in('id', pidler)
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
