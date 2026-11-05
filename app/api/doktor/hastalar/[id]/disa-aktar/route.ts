/**
 * HASTA-DISA-AKTAR-01 (Kaan, 2026-11-05) — GET /api/doktor/hastalar/<id>/disa-aktar?bicim=json|pdf
 *   json → a FHIR R4 collection Bundle as a file download
 *   pdf  → the same content as data for the printable page (/dashboard/doktor/hastalar/<id>/disa-aktar/yazdir)
 *
 * Doctor only (sadeceDoktor): a record export is the doctor's own act. HASTA-IZOLASYON: only the doctor's own patient
 * (hastaSahibiMi, 404 otherwise). Every export writes an audit row (audit_logs via hasta_disa_aktarim_kaydet: who, when,
 * which patient, which format). Rate-limited: 10 exports a minute per doctor. Never cached.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { fhirDisaAktarim, hastaKaydiOku } from '@/lib/doktor/hastaDisaAktarim'
import { hizSiniri } from '@/lib/belge/hizSiniri'

export const dynamic = 'force-dynamic'
const SINIR = hizSiniri(10, 60_000)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const patientId = params.id
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const bicim = req.nextUrl.searchParams.get('bicim') === 'pdf' ? 'pdf' : 'json'
  if (!SINIR.izinli(doktorId)) return NextResponse.json({ error: 'Çok fazla dışa aktarım. Lütfen bir dakika sonra tekrar deneyin.' }, { status: 429 })

  const kayit = await hastaKaydiOku(supabase, doktorId, patientId)
  if (!kayit) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const { error } = await supabase.rpc('hasta_disa_aktarim_kaydet', { p_doctor_id: doktorId, p_patient_id: patientId, p_bicim: bicim, p_ulke: 'tr' })
  if (error) return NextResponse.json({ error: 'Dışa aktarım kaydedilemedi; işlem yapılmadı.' }, { status: 500 })

  const basliklar = { 'Cache-Control': 'no-store' }
  if (bicim === 'pdf') return NextResponse.json({ veri: kayit.veri }, { headers: basliklar })
  const dosya = `notya-hasta-${patientId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.fhir.json`
  return new NextResponse(JSON.stringify(fhirDisaAktarim(kayit.veri, kayit.notSatirlari), null, 2), {
    headers: { ...basliklar, 'Content-Type': 'application/fhir+json; charset=utf-8', 'Content-Disposition': `attachment; filename="${dosya}"` },
  })
}
