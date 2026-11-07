/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — genital-aesthetic records of one patient, by the doctor's own branch
 * (lib/doktor/genitalEstetikBrans.ts): KD has everything; plastik cerrahi and the Özel Branş estetik & plastik cerrahi the
 * surgical part (COPS-L, photo consent, photos, the letterhead of the instruction sheet) — energy, injection, whitening,
 * FSFI / FGSIS and the lot recall answer 403 for them. Every other branch: 403.
 *
 *   GET  ?patientId=<id>            → { kapsam, kayitlar, fotolar, fotoOnamGecerli, yas, dogumTarihiVar }   (photo METADATA only)
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
import { doktorBransi, fotoListesi, fotoOnamlari, hastaDogumTarihi, kayitEkle, kayitlariListele, lotAra, yasBugun } from '@/lib/doktor/genitalEstetikSunucu'
import { geKayitAcik, genitalEstetikKapsami } from '@/lib/doktor/genitalEstetikBrans'
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
  const kapsam = genitalEstetikKapsami(await doktorBransi(oturum.supabase, oturum.doktorId))
  if (!kapsam) return { hata: yanit({ error: GE_HATA.kd_degil }, 403) }
  return { oturum, kapsam }
}

export async function GET(req: NextRequest) {
  const k = await kapi(req)
  if ('hata' in k) return k.hata
  const { supabase, doktorId } = k.oturum
  const sp = req.nextUrl.searchParams
  const lot = sp.get('lot')
  if (lot !== null) {
    if (!geKayitAcik(k.kapsam, 'enjeksiyon')) return yanit({ error: GE_HATA.yalniz_kd }, 403)
    return yanit({ sonuc: await lotAra(supabase, doktorId, lot) })
  }
  const patientId = sp.get('patientId') || ''
  if (!patientId) return BULUNAMADI()
  const tumu = await kayitlariListele(supabase, doktorId, patientId)
  if (!tumu) return BULUNAMADI()
  const kayitlar = tumu.filter((r) => geKayitAcik(k.kapsam, r.tur, r.veri.olcek))
  if (sp.get('baslik') === '1') return yanit({ baslik: await yazdirmaBasligi(supabase, doktorId, patientId) })
  const [fotolar, dogum] = await Promise.all([fotoListesi(supabase, doktorId, patientId), hastaDogumTarihi(supabase, doktorId, patientId)])
  const bugun = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)
  return yanit({ kapsam: k.kapsam, kayitlar, fotolar: fotolar || [], fotoOnamGecerli: fotoOnamiGecerli(fotoOnamlari(kayitlar), bugun), yas: yasBugun(dogum), dogumTarihiVar: !!dogum })
}

export async function POST(req: NextRequest) {
  const k = await kapi(req)
  if ('hata' in k) return k.hata
  const { supabase, doktorId } = k.oturum
  const b = (await req.json().catch(() => ({}))) as { patientId?: unknown; tur?: unknown; veri?: unknown }
  const patientId = typeof b.patientId === 'string' ? b.patientId : ''
  if (!patientId) return BULUNAMADI()
  const olcek = b.veri && typeof b.veri === 'object' ? (b.veri as { olcek?: unknown }).olcek : undefined
  if (!geKayitAcik(k.kapsam, String(b.tur ?? ''), olcek)) return yanit({ error: GE_HATA.yalniz_kd, kod: 'yalniz_kd' }, 403)
  try {
    const r = await kayitEkle(supabase, doktorId, patientId, b.tur, b.veri)
    if (!r.ok) return r.status === 404 ? BULUNAMADI() : yanit({ error: GE_HATA[r.hata] || 'Geçersiz kayıt.', kod: r.hata, alan: r.alan }, r.status)
    return yanit({ kayit: r.kayit }, 201)
  } catch { return yanit({ error: 'Kaydedilemedi.' }, 500) }
}
