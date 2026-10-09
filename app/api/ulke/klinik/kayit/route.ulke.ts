/**
 * NOTYA-ULKE-KLINIK-01 — GET /api/ulke/klinik/kayit: THE RECORD of everything done about THE CALLER's patients
 * through a grant — given, withdrawn, ended, and every read and write — newest first.
 *
 *   GET   200 { kayitlar: [{ id, an, olay, tur, ne, kisiId, kisiAdi, alanId, alanAdi, hastaId, hastaAdi }] }
 *
 *   404 { code: 'NOT_FOUND' }   the country has no clinic accounts
 *   401 { code: 'OTURUM_YOK' }  500 { code: 'BASARISIZ' }
 *
 * THE OWNING DOCTOR'S, AND NOBODY ELSE'S: read by the authenticated account's own id — no id is read from the
 * request — so the owner or an administrator of a clinic reads no doctor's record, and a member reads no record of
 * their own reads. Patient names are read by doctor AND patient id. The record stays the doctor's after the doctor,
 * or the member it names, has left the clinic.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { klinikAyarlari } from '@/lib/ulke/klinikHesabi/klinik'
import { erisimKayitlari } from '@/lib/ulke/klinikHesabi/yetki'

export const dynamic = 'force-dynamic'

export const GET = sinirda('klinik/kayit GET', async (req: NextRequest) => {
  if (!klinikAyarlari()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  return cevap({ kayitlar: await erisimKayitlari(oturum.supabase, oturum.user.id) })
})
