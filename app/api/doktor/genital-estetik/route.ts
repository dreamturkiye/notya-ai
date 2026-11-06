/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — cosmetic gynaecology records of one patient. KD ONLY (the doctor's own branch).
 *
 *   GET  ?patientId=<id>            → { kayitlar, fotolar, fotoOnamGecerli, yas, dogumTarihiVar }   (photo METADATA only)
 *   GET  ?patientId=<id>&baslik=1   → { baslik }   the letterhead for the patient instruction sheet
 *   GET  ?lot=<lot>                 → { sonuc }    product recall: this doctor's injections with that lot number
 *   POST { patientId, tur, veri }   → { kayit }    tur: enerji | enjeksiyon | beyazlatma | olcek | foto_onam
 *
 * HASTA-IZOLASYON: lib/doktor/genitalEstetikSunucu.ts proves the patient first; a foreign id answers 404. A cosmetic record
 * of a patient under 18 (or without a birth date) is refused with 422 BEFORE anything is written. Doctor only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { fotoOnamiGecerli } from '@/lib/clinical/genitalEstetik'
import { doktorBransi, fotoListesi, fotoOnamlari, genitalEstetikBransi, hastaDogumTarihi, kayitEkle, kayitlariListele, lotAra, yasBugun } from '@/lib/doktor/genitalEstetikSunucu'
import { yazdirmaBasligi } from '@/lib/doktor/ameliyatNotuSunucu'
import { GE_HATA } from '@/specialties/kadin-dogum/engines/genitalEstetikMetinleri'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'private, no-store' }
const yanit = (g: unknown, status = 200) => NextResponse.json(g, { status, headers: NO_STORE })
const BULUNAMADI = () => yanit({ error: 'Hasta bulunamadı.' }, 404)

async function kapi(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return { hata: oturum.hata }
  const engel = sadeceDoktor(oturum)
  if (engel) return { hata: engel }
  if (!genitalEstetikBransi(await doktorBransi(oturum.supabase, oturum.doktorId))) return { hata: yanit({ error: GE_HATA.kd_degil }, 403) }
  return { oturum }
}

export async function GET(req: NextRequest) {
  const k = await kapi(req)
  if ('hata' in k) return k.hata
  const { supabase, doktorId } = k.oturum
  const sp = req.nextUrl.searchParams
  const lot = sp.get('lot')
  if (lot !== null) return yanit({ sonuc: await lotAra(supabase, doktorId, lot) })
  const patientId = sp.get('patientId') || ''
  if (!patientId) return BULUNAMADI()
  const kayitlar = await kayitlariListele(supabase, doktorId, patientId)
  if (!kayitlar) return BULUNAMADI()
  if (sp.get('baslik') === '1') return yanit({ baslik: await yazdirmaBasligi(supabase, doktorId, patientId) })
  const [fotolar, dogum] = await Promise.all([fotoListesi(supabase, doktorId, patientId), hastaDogumTarihi(supabase, doktorId, patientId)])
  const bugun = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)
  return yanit({ kayitlar, fotolar: fotolar || [], fotoOnamGecerli: fotoOnamiGecerli(fotoOnamlari(kayitlar), bugun), yas: yasBugun(dogum), dogumTarihiVar: !!dogum })
}

export async function POST(req: NextRequest) {
  const k = await kapi(req)
  if ('hata' in k) return k.hata
  const { supabase, doktorId } = k.oturum
  const b = (await req.json().catch(() => ({}))) as { patientId?: unknown; tur?: unknown; veri?: unknown }
  const patientId = typeof b.patientId === 'string' ? b.patientId : ''
  if (!patientId) return BULUNAMADI()
  try {
    const r = await kayitEkle(supabase, doktorId, patientId, b.tur, b.veri)
    if (!r.ok) return r.status === 404 ? BULUNAMADI() : yanit({ error: GE_HATA[r.hata] || 'Geçersiz kayıt.', kod: r.hata, alan: r.alan }, r.status)
    return yanit({ kayit: r.kayit }, 201)
  } catch { return yanit({ error: 'Kaydedilemedi.' }, 500) }
}
