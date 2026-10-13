/**
 * POST /api/ulke/not/ek { notId, ek }: the addendum of an approved note.
 *
 * The four sections are not written. A draft answers 400 GECERSIZ (alan: taslak). A foreign id is 404.
 * A database without migration 146 answers 500 BASARISIZ; the approved note is left as it was.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { notEkKaydet } from '@/lib/ulke/uygulama/notlar'
import { NOT_DURUMU } from '@/lib/ulke/uygulama/notDurumu'

export const dynamic = 'force-dynamic'

export const POST = sinirda('not ek POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.notId)) return KOD.yok()
  const r = await notEkKaydet(oturum.supabase, oturum.user.id, g.notId, g.ek)
  if (!r.tamam) return cevap({ code: r.kod, ...(r.alan ? { alan: r.alan } : {}) }, NOT_DURUMU[r.kod])
  return cevap({ ok: true })
})
