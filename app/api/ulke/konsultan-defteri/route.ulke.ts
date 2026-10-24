/**
 * /api/ulke/konsultan-defteri — the caller's own address book of colleagues to consult.
 *   GET     200 { defter: [...] }
 *   POST    { ad, brans?, ofisTelefon?, telefon?, whatsapp?, eposta?, adres?, not?, kurumIci? }   200 { kayit }   400 { code: 'GECERSIZ', alan }   409 { code: 'DOLU' }
 *   PATCH   { id, …same }   200 { kayit }   404
 *   DELETE  ?id=   200 { ok: true }   404
 * Every row is read and written by the authenticated account's id; an id that is not the caller's is "not found".
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { defterDogrula, defterEkle, defterGuncelle, defterListele, defterSil } from '@/lib/ulke/uygulama/konsultanDefteri'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const acik = () => ozellikAcik('cekirdekMuayene') && ozellikAcik('konsultasyon')

export const GET = sinirda('konsultan-defteri GET', async (req: NextRequest) => {
  if (!acik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const defter = await defterListele(oturum.supabase, oturum.user.id)
  return defter ? cevap({ defter }) : KOD.basarisiz()
})

export const POST = sinirda('konsultan-defteri POST', async (req: NextRequest) => {
  if (!acik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const d = defterDogrula(await govdeOku(req))
  if (!d.tamam) return KOD.gecersiz(d.alan)
  const k = await defterEkle(oturum.supabase, oturum.user.id, d.girdi)
  if (k === 'DOLU') return cevap({ code: 'DOLU' }, 409)
  return k ? cevap({ kayit: k }) : KOD.basarisiz()
})

export const PATCH = sinirda('konsultan-defteri PATCH', async (req: NextRequest) => {
  if (!acik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.id)) return KOD.yok()
  const d = defterDogrula(g)
  if (!d.tamam) return KOD.gecersiz(d.alan)
  const k = await defterGuncelle(oturum.supabase, oturum.user.id, g.id, d.girdi)
  return k ? cevap({ kayit: k }) : KOD.yok()
})

export const DELETE = sinirda('konsultan-defteri DELETE', async (req: NextRequest) => {
  if (!acik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const id = req.nextUrl.searchParams.get('id')
  if (!uuidMi(id)) return KOD.yok()
  return (await defterSil(oturum.supabase, oturum.user.id, id)) ? cevap({ ok: true }) : KOD.yok()
})
