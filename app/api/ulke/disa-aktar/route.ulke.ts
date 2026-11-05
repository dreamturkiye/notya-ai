/**
 * HASTA-DISA-AKTAR-01 (Kaan, 2026-11-05) — /api/ulke/disa-aktar?hasta=<id>&bicim=json|pdf: ONE PATIENT'S RECORD, exported
 * by the doctor from Settings (never promoted).
 *
 *   json  a FHIR R4 `collection` Bundle as a file download (Patient, Encounter + Composition per approved note, Observation
 *         per kept tool result)
 *   pdf   the same content as data for the printable page (the browser makes the PDF)
 *   404 NOT_FOUND (not this doctor's patient: another doctor's answers exactly the same) · 401 · 429 · 500
 *
 * A DOCTOR'S SESSION; only the doctor's own patient (hasta-izolasyon). Every export writes an audit row first (who, when,
 * which patient, which format: hasta_disa_aktarim_kaydet); no row, no export. 10 exports a minute per doctor. Never cached.
 */
import { NextRequest, NextResponse } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { ulkeIslevi } from '@/lib/ulke/uygulama/tablolar'
import { hizSiniri } from '@/lib/belge/hizSiniri'
import { fhirBundle, hastaKaydiOku } from '@/lib/ulke/belge/sunucu'

export const dynamic = 'force-dynamic'
const SINIR = hizSiniri(10, 60_000)

export const GET = sinirda('disa-aktar GET', async (req: NextRequest) => {
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const id = req.nextUrl.searchParams.get('hasta')
  if (!uuidMi(id)) return KOD.yok()
  if (!SINIR.izinli(oturum.user.id)) return cevap({ code: 'COK_FAZLA' }, 429)
  const bicim = req.nextUrl.searchParams.get('bicim') === 'pdf' ? 'pdf' : 'json'
  const veri = await hastaKaydiOku(oturum.supabase, oturum.user.id, id)
  if (!veri) return KOD.yok()
  const { error } = await ulkeIslevi(oturum.supabase, 'hasta_disa_aktarim_kaydet', { p_doctor_id: oturum.user.id, p_patient_id: veri.hasta.id, p_bicim: bicim })
  if (error) return KOD.basarisiz()
  if (bicim === 'pdf') return cevap({ veri })
  const dosya = `notya-patient-${veri.hasta.id.slice(0, 8)}-${veri.olusturuldu.slice(0, 10)}.fhir.json`
  return new NextResponse(JSON.stringify(fhirBundle(veri), null, 2), { headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/fhir+json; charset=utf-8', 'Content-Disposition': `attachment; filename="${dosya}"` } })
})
