/**
 * POST /api/ulke/meslek-kaydi { meslekKaydi }: the optional professional registration on THIS account.
 *
 * Written to auth user_metadata by the service role. Empty clears it. A value that is not the accepted shape is
 * 400 and changes nothing. Not checked against a register. No patient data.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { meslekKaydiGecerli } from '@/lib/ulke/uygulama/meslekKaydi'

export const dynamic = 'force-dynamic'

export const POST = sinirda('meslek-kaydi POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const meslek = meslekKaydiGecerli(g.meslekKaydi)
  if (meslek === null) return cevap({ code: 'GECERSIZ', alan: 'meslekKaydi' }, 400)
  const mevcut = oturum.user.user_metadata && typeof oturum.user.user_metadata === 'object' ? { ...oturum.user.user_metadata } : {}
  if (meslek) mevcut.meslekKaydi = meslek
  else delete mevcut.meslekKaydi
  const { error } = await oturum.supabase.auth.admin.updateUserById(oturum.user.id, { user_metadata: mevcut })
  if (error) return KOD.basarisiz()
  return cevap({ ok: true, ...(meslek ? { meslekKaydi: meslek } : {}) })
})
