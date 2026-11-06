/**
 * GENITAL-ESTETIK-01 — upload ONE intimate photo of a patient (KD only, doctor only).
 *   POST { patientId, gorunum, cekimTarihi?, gorsel: <JPEG/PNG data URL, ≤ 3 MB> }  → { foto }  (metadata only)
 * Requires a separate, valid photo consent of the patient (422 otherwise). Metadata (EXIF/GPS) is stripped, bytes are
 * encrypted into genital_estetik_fotolar (never the document vault). No thumbnail is made. Nothing is sent to a model.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { doktorBransi, fotoYukle, genitalEstetikBransi } from '@/lib/doktor/genitalEstetikSunucu'
import { GE_HATA } from '@/specialties/kadin-dogum/engines/genitalEstetikMetinleri'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const NO_STORE = { 'Cache-Control': 'private, no-store' }
const yanit = (g: unknown, status = 200) => NextResponse.json(g, { status, headers: NO_STORE })

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  if (!genitalEstetikBransi(await doktorBransi(supabase, doktorId))) return yanit({ error: GE_HATA.kd_degil }, 403)
  if (Number(req.headers.get('content-length') || 0) > 4_500_000) return yanit({ error: GE_HATA.foto_gecersiz }, 400)
  const b = (await req.json().catch(() => ({}))) as { patientId?: unknown; gorunum?: unknown; cekimTarihi?: unknown; gorsel?: unknown }
  const patientId = typeof b.patientId === 'string' ? b.patientId : ''
  if (!patientId) return yanit({ error: 'Hasta bulunamadı.' }, 404)
  try {
    const r = await fotoYukle(supabase, doktorId, patientId, { gorunum: b.gorunum, cekimTarihi: b.cekimTarihi, gorsel: b.gorsel })
    if (!r.ok) return r.status === 404 ? yanit({ error: 'Hasta bulunamadı.' }, 404) : yanit({ error: GE_HATA[r.hata] || 'Geçersiz.', kod: r.hata }, r.status)
    return yanit({ foto: r.foto }, 201)
  } catch { return yanit({ error: 'Fotoğraf kaydedilemedi.' }, 500) }
}
