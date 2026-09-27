/**
 * e-Nabız yapıştırma masası. pratikOturum — sekreter aynı masayı okur.
 * Hasta/not/seans id doğrulanmadan okuma yok (HASTA-IZOLASYON).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { hastaAdiCoz } from '@/lib/doktor/hastaCozumleyici'
import { notAlanlariCoz } from '@/lib/doktor/hastaKayitAlanlari'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { arsivsizIlaclar, arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { enabizEpikriz } from '@/lib/enabiz/paket'
import {
  ENABIZ_PORTAL,
  MASA_KISA_REHBER,
  bosMasaGirdi,
  izinKilitliMi,
  masaAlanlari,
  masaCiktiListesi,
  masaTurCoz,
} from '@/lib/enabiz/masa'

export const dynamic = 'force-dynamic'

function metin(v: unknown): string {
  return String(v ?? '').trim()
}

function tarihTr(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })
}

function ilacSatir(v: unknown): string {
  if (!Array.isArray(v)) return ''
  return v
    .map((x) => {
      if (!x || typeof x !== 'object') return ''
      const o = x as Record<string, unknown>
      return [o.ad || o.ilac_adi, o.doz, o.kullanim || o.kullanim_sikli].filter(Boolean).join(' ')
    })
    .filter(Boolean)
    .join('\n')
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const hastaIdQ = String(req.nextUrl.searchParams.get('hastaId') || '').trim()
  const notIdQ = String(req.nextUrl.searchParams.get('notId') || '').trim()
  const seansIdQ = String(req.nextUrl.searchParams.get('seansId') || '').trim()
  const tur = masaTurCoz(req.nextUrl.searchParams.get('tur'))

  if (!hastaIdQ && !notIdQ && !seansIdQ) {
    const { data } = await supabase
      .from('patients')
      .select('id, name_encrypted, updated_at')
      .eq('doctor_id', doktorId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(80)
    return NextResponse.json({
      portal: ENABIZ_PORTAL,
      rehber: MASA_KISA_REHBER,
      hastalar: (data || []).map((p) => ({ id: String(p.id), ad: hastaAdiCoz(p.name_encrypted as string) })),
    })
  }

  let hastaId = hastaIdQ
  let notId = notIdQ
  let seansId = seansIdQ

  if (notId) {
    const { data: not } = await supabase
      .from('notes')
      .select('id, session_id')
      .eq('id', notId)
      .eq('doctor_id', doktorId)
      .maybeSingle()
    if (!not) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
    const seans = await seansSahibi(supabase, doktorId, String(not.session_id))
    if (!seans?.patient_id) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
    if (hastaId && hastaId !== seans.patient_id) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
    hastaId = seans.patient_id
    seansId = seansId || String(not.session_id)
  }

  if (seansId) {
    const seans = await seansSahibi(supabase, doktorId, seansId)
    if (!seans?.patient_id) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
    if (hastaId && hastaId !== seans.patient_id) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
    hastaId = seans.patient_id
  }

  if (!(await hastaSahibiMi(supabase, doktorId, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  const { data: hasta } = await supabase
    .from('patients')
    .select('id, name_encrypted, notes_encrypted, enabiz_gonderilmesin')
    .eq('id', hastaId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  const hastaAd = hastaAdiCoz(hasta.name_encrypted as string)
  const kart = notAlanlariCoz(hasta.notes_encrypted as string | null)
  const tcKimlik = metin(kart.tcKimlik || kart.tcKimlikNo)
  const istemiyor = hasta.enabiz_gonderilmesin === true

  const { data: seanslarHam } = await arsivsizSeanslar(supabase, 'id, created_at')
    .eq('doctor_id', doktorId)
    .eq('patient_id', hastaId)
    .order('created_at', { ascending: false })
    .limit(20)
  const seansIds = (seanslarHam || []).map((s) => String((s as { id: string }).id))
  const { data: notlarHam } = seansIds.length
    ? await arsivsizNotlar(supabase, 'id, session_id, created_at, approved_at, basvuru_yakinmasi, content_subjektif, content_objektif, content_tani, content_degerlendirme, content_plan, content_ilaclar, icd10_codes')
        .eq('doctor_id', doktorId)
        .in('session_id', seansIds)
        .order('created_at', { ascending: false })
    : { data: [] as Record<string, unknown>[] }

  const vizitler = (notlarHam || []).map((n) => ({
    id: String(n.id),
    seansId: String(n.session_id),
    tarih: tarihTr(String(n.created_at || '')),
    onayli: Boolean(n.approved_at),
  }))

  let not = (notlarHam || []).find((n) => notId && String(n.id) === notId)
    || (notlarHam || []).find((n) => seansId && String(n.session_id) === seansId && n.approved_at)
    || (notlarHam || []).find((n) => n.approved_at)
    || (notlarHam || [])[0]
    || null
  if (not) notId = String(not.id)

  const { data: ilaclarHam } = await arsivsizIlaclar(supabase, 'ilac_adi, doz, kullanim_sikli, aktif')
    .eq('doctor_id', doktorId)
    .eq('patient_id', hastaId)
    .eq('aktif', true)
    .limit(40)

  const { data: goruntu } = await supabase
    .from('hasta_goruntulemeler')
    .select('modalite, rapor_metni, goruntuleme_tarihi')
    .eq('doctor_id', doktorId)
    .eq('patient_id', hastaId)
    .order('goruntuleme_tarihi', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: hekim } = await supabase
    .from('users')
    .select('specialty, recete_baslik, erecete_ayar')
    .eq('id', doktorId)
    .maybeSingle()

  const brans = bransAnahtari(String(hekim?.specialty || ''))
  const gebeGoster = brans === 'kadin-hastaliklari-dogum'
  let gebeSat = ''
  let gebeDogum = ''
  let gebeDurum = ''
  if (gebeGoster) {
    const { data: geb } = await supabase
      .from('gebelikler')
      .select('sat, dogum_tarihi, durum')
      .eq('doctor_id', doktorId)
      .eq('patient_id', hastaId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    gebeSat = metin(geb?.sat)
    gebeDogum = metin(geb?.dogum_tarihi)
    gebeDurum = metin(geb?.durum)
  }

  const rb = (hekim?.recete_baslik && typeof hekim.recete_baslik === 'object' ? hekim.recete_baslik : {}) as { diplomaNo?: string }
  const ayar = (hekim?.erecete_ayar && typeof hekim.erecete_ayar === 'object' ? hekim.erecete_ayar : {}) as { tesisKodu?: number }
  const icdHam = not && Array.isArray(not.icd10_codes) ? not.icd10_codes : []
  const icd10 = icdHam
    .map((x) => {
      if (!x || typeof x !== 'object') return ''
      const o = x as { kod?: string; code?: string; ad?: string; aciklama?: string }
      return [o.kod || o.code, o.ad || o.aciklama].filter(Boolean).join(' ')
    })
    .filter(Boolean)
    .join(', ')

  const girdi = bosMasaGirdi()
  girdi.hastaAd = hastaAd
  girdi.tcKimlik = tcKimlik
  girdi.muayeneTarihi = tarihTr(not ? String(not.created_at || '') : '')
  girdi.sikayet = metin(not?.basvuru_yakinmasi) || metin(not?.content_subjektif)
  girdi.fizik = metin(not?.content_objektif)
  girdi.tani = metin(not?.content_tani) || metin(not?.content_degerlendirme)
  girdi.icd10 = icd10
  girdi.plan = metin(not?.content_plan)
  girdi.ilaclar = ilacSatir(not?.content_ilaclar) || (ilaclarHam || []).map((i) => [i.ilac_adi, i.doz, i.kullanim_sikli].filter(Boolean).join(' ')).join('\n')
  girdi.tesisKodu = ayar.tesisKodu != null ? String(ayar.tesisKodu) : ''
  girdi.diplomaNo = metin(rb.diplomaNo)
  girdi.usgBaslik = goruntu ? metin(goruntu.modalite) : ''
  girdi.usgGovde = goruntu ? metin(goruntu.rapor_metni) : ''
  girdi.gebeSat = gebeSat
  girdi.gebeDogum = gebeDogum
  girdi.gebeDurum = gebeDurum

  const ciktilar = masaCiktiListesi({ usgVar: !!goruntu, gebeGoster })
  const turGecerli = ciktilar.some((c) => c.tur === tur) ? tur : 'muayene'
  const kilit = izinKilitliMi(istemiyor)
  const cikti = kilit ? null : masaAlanlari(turGecerli, girdi)
  const paket = kilit || !cikti
    ? null
    : enabizEpikriz({
        hastaAd: girdi.hastaAd || 'Hasta',
        hastaId,
        taniVeTedavi: [girdi.tani, girdi.icd10, girdi.ilaclar].filter(Boolean).join('\n') || '—',
        taburcuOzeti: [girdi.sikayet, girdi.fizik, girdi.plan].filter(Boolean).join('\n') || '—',
      })

  return NextResponse.json({
    portal: ENABIZ_PORTAL,
    rehber: MASA_KISA_REHBER,
    hastaId,
    hastaAd,
    notId: notId || null,
    izin: { istemiyor, kilit },
    vizitler,
    ciktilar,
    tur: turGecerli,
    cikti,
    paket,
  })
}
