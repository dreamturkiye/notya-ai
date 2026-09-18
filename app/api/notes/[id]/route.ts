/**
 * NOTYA-SOAP-03 — Tek not görünümü (yazdır/PDF sayfası için).
 * Kimlik başlığı SUNUCUDA birleşir: ad/doğum/cinsiyet hasta kaydından, TC (varsa)
 * şifreli intake formundan çözülür — modele hiçbir aşamada kimlik gitmemiştir.
 * Attestasyon verisi: onay tarihi + doktor adı + düzenleme sayısı (not_duzenlemeleri).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'
import { yasHesapla } from '@/lib/doktor/yas'
import { cinsiyetTr } from '@/lib/utils/cinsiyet'
import { persentilHesapla, vkiSiniflandir, vkiSinifEtiket, ayFarki, persentilMetni, type Cinsiyet } from '@/lib/clinical/buyumeEgrisi'
import { notKapsamiGetir } from '@/lib/specialties/kapsamSunucu'

export const dynamic = 'force-dynamic'

function coz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}

/**
 * Kaan (2026-09-13): kilo/boy/baş çevresi/VKİ persentili Neyzi standartlarına göre —
 * türetilmiş veri, saklanmaz; her görüntülemede vitaller + doğum tarihinden yeniden hesaplanır.
 * 18 yaş üstü veya doğum tarihi/cinsiyet bilinmiyorsa boş döner.
 */
function buyumePersentilleriniHesapla(
  vitaller: unknown,
  dogumIso: string | null,
  cinsiyet: Cinsiyet | null,
  olcumIso: string | null,
): { kilo?: string; boy?: string; basCevresi?: string; vki?: string; vkiSinif?: string } | null {
  if (!vitaller || typeof vitaller !== 'object' || !dogumIso || !cinsiyet) return null
  const ayYas = ayFarki(dogumIso, olcumIso || undefined)
  if (ayYas === null || ayYas > 216) return null
  const v = vitaller as Record<string, unknown>
  const say = (x: unknown): number | null => { const n = parseFloat(String(x ?? '').replace(',', '.').replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? n : null }
  const out: { kilo?: string; boy?: string; basCevresi?: string; vki?: string; vkiSinif?: string } = {}
  const kilo = say(v.kilo), boy = say(v.boy), bas = say(v.basCevresi)
  if (kilo != null) { const r = persentilHesapla('kilo', cinsiyet, ayYas, kilo); if (r) out.kilo = persentilMetni(r.persentil) }
  if (boy != null) { const r = persentilHesapla('boy', cinsiyet, ayYas, boy); if (r) out.boy = persentilMetni(r.persentil) }
  if (bas != null) { const r = persentilHesapla('basCevresi', cinsiyet, ayYas, bas); if (r) out.basCevresi = persentilMetni(r.persentil) }
  if (kilo != null && boy != null && ayYas >= 24) {
    const vki = kilo / Math.pow(boy / 100, 2)
    const r = persentilHesapla('vki', cinsiyet, ayYas, vki)
    if (r) { out.vki = persentilMetni(r.persentil); out.vkiSinif = vkiSinifEtiket(vkiSiniflandir(r.persentil)) }
  }
  return Object.keys(out).length ? out : null
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
  let dogumIso: string | null = null
  let cinsiyetHam: 'male' | 'female' | null = null
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
          hasta.yas = yasHesapla(dogum)
        }
      }
      hasta.cinsiyet = cinsiyetTr(coz(p.gender_encrypted))
      // Kaan (2026-09-13): büyüme persentili için ham doğum tarihi + cinsiyet saklanır (Neyzi standartları)
      dogumIso = dogum || null
      cinsiyetHam = coz(p.gender_encrypted) === 'male' || coz(p.gender_encrypted) === 'female' ? (coz(p.gender_encrypted) as 'male' | 'female') : null
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
  let diplomaNo = ''
  let ozelBaslikSatirlari: string[] = []
  let ozelLogo = ''
  try {
    const { data: u } = await supabase.from('users').select('full_name, email, recete_baslik').eq('id', doktorId).maybeSingle()
    doktorAd = String(u?.full_name || u?.email?.split('@')[0] || '')
    // Kaan (2026-09-10): diploma no bir kez girilir (reçete başlığı), muayene notu çıktısında da imzanın altında basılır
    const rb = (u?.recete_baslik && typeof u.recete_baslik === 'object' ? u.recete_baslik : {}) as { diplomaNo?: string; satirlar?: string[]; logoDataUrl?: string }
    diplomaNo = String(rb.diplomaNo || '')
    ozelBaslikSatirlari = Array.isArray(rb.satirlar) ? rb.satirlar.map(String).filter(Boolean) : []
    ozelLogo = String(rb.logoDataUrl || '')
  } catch { /* boş kalır */ }

  let duzenlemeSayisi = 0
  try {
    const { count } = await supabase
      .from('not_duzenlemeleri')
      .select('id', { count: 'exact', head: true })
      .eq('note_id', id)
    duzenlemeSayisi = count || 0
  } catch { /* 0 kalır */ }

  // BRANS-ALAN-SIZMASI: not sayfası / yazdır branşa göre çizilir (ölçüm alanları: branş; hasta/veli hitabı: yaş — VELI-YASAL-ONAM)
  const kapsam = await notKapsamiGetir(supabase, { doctorId: doktorId, seansBransi: seans?.specialty ?? null, hastaDogumIso: dogumIso })
  const bransKapsami = { brans: kapsam.brans, pediatrik: kapsam.pediatrik, veliDili: kapsam.veliDili, olcumler: kapsam.olcumler, hitap: kapsam.hitap }

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
      // Neyzi persentili pediatrik içeriktir — yalnız pediatrik bağlamda
      buyumePersentilleri: kapsam.pediatrik ? buyumePersentilleriniHesapla(not.vitaller, dogumIso, cinsiyetHam, not.created_at) : null,
      bransKapsami,
      hastaOzeti: not.hasta_ozeti || '',
      takipSuresi: not.takip_suresi || '',
    },
    hasta: { ...hasta, patientId: seans?.patient_id ? String(seans.patient_id) : null },
    doktor: { ad: doktorAd, diplomaNo, ozelBaslikSatirlari, ozelLogo },
    duzenlemeSayisi,
  })
}
