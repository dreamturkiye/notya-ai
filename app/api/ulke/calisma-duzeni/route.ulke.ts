/**
 * NOTYA-UZ-RANDEVU-01 — /api/ulke/calisma-duzeni: the caller's own working pattern.
 *
 *   GET   200 { duzen: { gunler, baslangic, bitis, sureDk, molalar: [{ baslangic, bitis }] }, kayitli,
 *               sureSecenekleri, haftaBasi, tarihDeseni, bugun }
 *             `kayitli` false = the account has saved none yet: `duzen` is the country pack's own.
 *             Weekdays are ISO (1 = Monday … 7 = Sunday); times are 'HH:MM' of the country's wall clock.
 *   POST  { gunler, baslangic, bitis, sureDk, molalar }
 *         200 { ok: true, duzen }
 *         400 { code: 'GECERSIZ', alan: 'gunler' | 'saatler' | 'sure' | 'molalar' }
 *
 *   401 { code: 'OTURUM_YOK' }   404 { code: 'NOT_FOUND' } (feature off)   500 { code: 'BASARISIZ' }
 *
 * Takes no id from the request: everything is read and written by the authenticated account's own id. No patient data.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { calismaDuzeniniOku, calismaDuzeniniYaz, duzenCoz, sureSecenekleri, type CalismaDuzeni } from '@/lib/ulke/uygulama/calismaDuzeni'
import { ulkeGunu } from '@/lib/ulke/uygulama/gun'
import { saatYazDk } from '@/lib/ulke/uygulama/zaman'

export const dynamic = 'force-dynamic'

const acik = () => ozellikAcik('cekirdekMuayene') && ozellikAcik('randevu')
const disari = (d: CalismaDuzeni) => ({
  gunler: d.gunler, baslangic: saatYazDk(d.baslangicDk), bitis: saatYazDk(d.bitisDk), sureDk: d.sureDk,
  molalar: d.molalar.map((m) => ({ baslangic: saatYazDk(m.bas), bitis: saatYazDk(m.bit) })),
})

export const GET = sinirda('calisma-duzeni GET', async (req: NextRequest) => {
  if (!acik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const d = await calismaDuzeniniOku(oturum.supabase, oturum.user.id)
  if (!d) return KOD.yok()
  const p = ulkePaketi()
  return cevap({ duzen: disari(d.duzen), kayitli: d.kayitli, sureSecenekleri: sureSecenekleri(), haftaBasi: p.bicim.haftaBasi, tarihDeseni: p.bicim.tarihDeseni, bugun: ulkeGunu() })
})

export const POST = sinirda('calisma-duzeni POST', async (req: NextRequest) => {
  if (!acik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const c = duzenCoz(await govdeOku(req))
  if (!c.tamam) return KOD.gecersiz(c.alan)
  if (!(await calismaDuzeniniYaz(oturum.supabase, oturum.user.id, c.duzen))) return KOD.basarisiz()
  return cevap({ ok: true, duzen: disari(c.duzen) })
})
