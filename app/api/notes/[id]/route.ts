/**
 * NOTYA-SOAP-03 — Tek not görünümü (yazdır/PDF sayfası için).
 * Kimlik başlığı SUNUCUDA birleşir: ad/doğum/cinsiyet hasta kaydından, TC (varsa)
 * şifreli intake formundan çözülür — modele hiçbir aşamada kimlik gitmemiştir.
 * Attestasyon verisi: onay tarihi + doktor adı + düzenleme sayısı (not_duzenlemeleri).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'

function coz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const { id } = await params

  const { data: not } = await supabase
    .from('notes')
    .select('*, sessions(patient_id, specialty)')
    .eq('id', id)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!not) return NextResponse.json({ error: 'Not bulunamadı.' }, { status: 404 })

  const seans = Array.isArray(not.sessions) ? not.sessions[0] : not.sessions
  const hasta: { ad: string; dogum: string; yas: string; cinsiyet: string; tc: string } = { ad: '', dogum: '', yas: '', cinsiyet: '', tc: '' }
  if (seans?.patient_id) {
    const { data: p } = await supabase
      .from('patients')
      .select('name_encrypted, dob_encrypted, gender_encrypted')
      .eq('id', seans.patient_id)
      .eq('doctor_id', doktorId)
      .maybeSingle()
    if (p) {
      const hamAd = coz(p.name_encrypted)
      try { hasta.ad = String(JSON.parse(hamAd).ad || hamAd) } catch { hasta.ad = hamAd }
      const dogum = coz(p.dob_encrypted)
      if (dogum) {
        const d = new Date(dogum)
        if (!isNaN(d.getTime())) {
          hasta.dogum = d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })
          const ay = Math.floor((Date.now() - d.getTime()) / (30.44 * 86400000))
          hasta.yas = ay < 24 ? `${ay} aylık` : `${Math.floor(ay / 12)} yaşında`
        }
      }
      hasta.cinsiyet = coz(p.gender_encrypted)
    }
    // TC yalnız intake formunda (şifreli) tutuluyor — varsa oradan çöz
    try {
      const { data: intake } = await supabase
        .from('hasta_intake_formlari')
        .select('form_data_encrypted')
        .eq('patient_id', seans.patient_id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (intake?.[0]?.form_data_encrypted) {
        const y = JSON.parse(decrypt(intake[0].form_data_encrypted)) as Record<string, unknown>
        hasta.tc = String(y.tcKimlik || y.tcKimlikNo || '')
      }
    } catch { /* tc yoksa boş kalır */ }
  }

  let doktorAd = ''
  try {
    const { data: u } = await supabase.from('users').select('full_name, email').eq('id', doktorId).maybeSingle()
    doktorAd = String(u?.full_name || u?.email?.split('@')[0] || '')
  } catch { /* boş kalır */ }

  let duzenlemeSayisi = 0
  try {
    const { count } = await supabase
      .from('not_duzenlemeleri')
      .select('id', { count: 'exact', head: true })
      .eq('note_id', id)
    duzenlemeSayisi = count || 0
  } catch { /* 0 kalır */ }

  return NextResponse.json({
    not: {
      id: not.id,
      createdAt: not.created_at,
      approvedAt: not.approved_at,
      specialty: seans?.specialty || not.specialty || 'genel',
      basvuruYakinmasi: not.basvuru_yakinmasi || '',
      subjektif: not.content_subjektif || '',
      objektif: not.content_objektif || '',
      degerlendirme: not.content_degerlendirme || '',
      plan: not.content_plan || '',
      tani: not.content_tani || '',
      ilaclar: Array.isArray(not.content_ilaclar) ? not.content_ilaclar : [],
      receteOnerisi: Array.isArray(not.recete_onerisi) ? not.recete_onerisi : [],
      icdKodlari: Array.isArray(not.icd10_codes) ? not.icd10_codes : [],
      kritikBulgular: Array.isArray(not.kritik_bulgular) ? not.kritik_bulgular : [],
      alarmBulgulari: Array.isArray(not.alarm_bulgulari) ? not.alarm_bulgulari : [],
      vitaller: not.vitaller || null,
      hastaOzeti: not.hasta_ozeti || '',
      takipSuresi: not.takip_suresi || '',
    },
    hasta,
    doktor: { ad: doktorAd },
    duzenlemeSayisi,
  })
}
