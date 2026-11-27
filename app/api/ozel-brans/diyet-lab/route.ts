/**
 * BRANS-PAKETI (diyetisyen) — lab follow-up panel: the physician-ordered glucose, HbA1c, insulin, TSH and lipid results
 * of ONE patient as series across visits, plus the drug–food notes for the medicines on file. HOMA-IR is not computed
 * (TEMD Obezite 2024 § 5.6). Diyetisyen only (branş gate), numbers only, no interpretation.
 * HASTA-IZOLASYON: doktorOturum; 404 unless the session doctor is a diyetisyen AND hastaSahibiMi(session user, patientId);
 * lab_satirlar and hasta_ilaclar are read with patient_id AND doctor_id = session user.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { hekimBransi } from '@/lib/doktor/hekimAdi'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'
import { arsivsizIlaclar } from '@/lib/doktor/arsiv'
import { aktifIlacAdlari } from '@/lib/saglikEvi/ilacSinifi'
import { HOMA_IR_NOTU, LAB_NOTU, labSerileri } from '@/specialties/diyetisyen/engines/lab'
import { ilacBesinNotlari } from '@/specialties/diyetisyen/engines/ilacBesin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await doktorOturum(req)
  if ('hata' in o) return o.hata
  const { user, supabase } = o
  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  if (klinikSlugCoz(await hekimBransi(supabase, user.id)) !== 'diyetisyen' || !patientId || !(await hastaSahibiMi(supabase, user.id, patientId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  const [lab, ilac] = await Promise.all([
    supabase.from('lab_satirlar').select('canonical_key, raw_name, value_num, unit, numune_tarihi').eq('patient_id', patientId).eq('doctor_id', user.id).eq('onayli', true).order('numune_tarihi', { ascending: false }).limit(500),
    arsivsizIlaclar(supabase, 'ilac_adi, aktif, bitis_tarihi').eq('patient_id', patientId).eq('doctor_id', user.id).eq('onay_durumu', 'onayli').eq('aktif', true).limit(60),
  ])
  const bugun = new Date().toISOString().slice(0, 10)
  return NextResponse.json({
    seriler: labSerileri((lab.data || []) as Array<Record<string, any>>),
    notlar: [LAB_NOTU, HOMA_IR_NOTU],
    ilacBesin: ilacBesinNotlari(aktifIlacAdlari((ilac.data || []) as Array<Record<string, any>>, bugun)),
  })
}
