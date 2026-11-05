/**
 * POST /api/ulke/meslek-kaydi { meslekKaydi?, unvan?, unvanEki? }: the optional professional registration on THIS
 * account and (OP-DR-01) the title and post-nominals its printed records carry (lib/ulke/uygulama/hekimUnvani.ts). Each
 * is written only when the body names it; the others are left as they are.
 *
 * Written to auth user_metadata by the service role. Empty clears it. A value that is not the accepted shape is
 * 400 and changes nothing. Not checked against a register. No patient data.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { meslekKaydiGecerli } from '@/lib/ulke/uygulama/meslekKaydi'
import { unvanEkiGecerli, unvanGecerli } from '@/lib/ulke/uygulama/hekimUnvani'

export const dynamic = 'force-dynamic'

export const POST = sinirda('meslek-kaydi POST', async (req: NextRequest) => {
  if (!ozellikAcik('cekirdekMuayene')) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const mevcut = oturum.user.user_metadata && typeof oturum.user.user_metadata === 'object' ? { ...oturum.user.user_metadata } : {}
  const cikti: Record<string, string> = {}
  if ('meslekKaydi' in g) {
    // LOOK-PARITY-04: where practice details carry the number, this second store no longer exists (the title stays here: OP-DR-01).
    if (ulkePaketi().uzanti?.muayenehane?.meslekKaydiTasi) return KOD.yok()
    const meslek = meslekKaydiGecerli(g.meslekKaydi)
    if (meslek === null) return cevap({ code: 'GECERSIZ', alan: 'meslekKaydi' }, 400)
    if (meslek) { mevcut.meslekKaydi = meslek; cikti.meslekKaydi = meslek } else delete mevcut.meslekKaydi
  }
  // OP-DR-01: the title is one of the pack's; the post-nominals are the doctor's own text of an accepted shape.
  if ('unvan' in g || 'unvanEki' in g) {
    const paket = ulkePaketi().hekimUnvani
    const unvan = unvanGecerli(paket, g.unvan)
    if (unvan === null) return cevap({ code: 'GECERSIZ', alan: 'unvan' }, 400)
    const ek = unvanEkiGecerli(g.unvanEki)
    if (ek === null) return cevap({ code: 'GECERSIZ', alan: 'unvanEki' }, 400)
    if (unvan) { mevcut.unvan = unvan; cikti.unvan = unvan } else delete mevcut.unvan
    if (ek) { mevcut.unvanEki = ek; cikti.unvanEki = ek } else delete mevcut.unvanEki
  }
  if (!Object.keys(g).some((k) => k === 'meslekKaydi' || k === 'unvan' || k === 'unvanEki')) return cevap({ code: 'GECERSIZ', alan: 'meslekKaydi' }, 400)
  const { error } = await oturum.supabase.auth.admin.updateUserById(oturum.user.id, { user_metadata: mevcut })
  if (error) return KOD.basarisiz()
  return cevap({ ok: true, ...cikti })
})
