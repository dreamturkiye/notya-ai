/** AU-BETA-01 — GET /api/ulke/fatura/uzlasma: invoices against what the payment adapter reports (match / mismatch). The CSV is made in the browser from this answer. */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { uzlasma } from '@/lib/ulke/fatura/fatura'

export const dynamic = 'force-dynamic'
export const GET = sinirda('fatura uzlasma GET', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.fatura) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  return cevap(await uzlasma(oturum.supabase, oturum.user.id))
})
