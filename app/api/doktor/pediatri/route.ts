/**
 * PEDI-ARACLAR-01 — Araçlar › Pediatri: seçili hastanın özeti (doğum tarihi, cinsiyet, yaş).
 * GET ?patientId= → { dogumIso, cinsiyet, yasAy, dogumBilgisi }. Sahiplik pediHasta() ile (doctor_id kapsamlı); yabancı kimlik 404.
 * PEDI-ARACLAR-02: dogumBilgisi = hekimin kendi bebek kartı (KD taburcu paketi) — gebelik haftası + doğum ağırlığı (aşı planı).
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
  const { data: kart } = await o.sb.from('bebek_kartlari').select('gebelik_haftasi, kilo_gram')
    .eq('doctor_id', o.doktorId).eq('bebek_patient_id', h.id).order('created_at', { ascending: false }).limit(1)
  const k = kart?.[0] as { gebelik_haftasi?: number | null; kilo_gram?: number | null } | undefined
  const dogumBilgisi = k && (k.gebelik_haftasi != null || k.kilo_gram != null)
    ? { gebelikHaftasi: k.gebelik_haftasi != null ? Number(k.gebelik_haftasi) : null, kiloGram: k.kilo_gram != null ? Number(k.kilo_gram) : null }
    : null
  return NextResponse.json({ dogumIso: h.dogumIso, cinsiyet: h.cinsiyet, yasAy: h.dogumIso ? tamAy(h.dogumIso, bugunTr()) : null, dogumBilgisi })
}
