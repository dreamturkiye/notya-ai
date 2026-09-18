/**
 * PEDI-ARACLAR-01 — Araçlar › Pediatri: seçili hastanın özeti (doğum tarihi, cinsiyet, yaş).
 * GET ?patientId= → { dogumIso, cinsiyet, yasAy }. Sahiplik pediHasta() ile (doctor_id kapsamlı); yabancı kimlik 404.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pediOturum, pediHasta, bulunamadi, bugunTr } from './_ortak'
import { tamAy } from '@/specialties/pediatri/engines/girdi'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await pediOturum(req)
  if ('hata' in o) return o.hata
  const h = await pediHasta(o.sb, o.doktorId, req.nextUrl.searchParams.get('patientId'))
  if (!h) return bulunamadi()
  return NextResponse.json({ dogumIso: h.dogumIso, cinsiyet: h.cinsiyet, yasAy: h.dogumIso ? tamAy(h.dogumIso, bugunTr()) : null })
}
