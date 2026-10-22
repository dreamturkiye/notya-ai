/** AU-BETA-01/02 — GET /api/ulke/fatura/uzlasma?from=YYYY-MM-DD&to=YYYY-MM-DD: invoices against what the payment provider LISTS for the range (default: last 30 days). Demo mode: the labelled demo check. The CSV is made in the browser from this answer. */
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
  const q = new URL(req.url).searchParams
  const gun = (x: string | null, son: boolean) => (x && /^\d{4}-\d{2}-\d{2}$/.test(x) && Number.isFinite(Date.parse(`${x}T00:00:00Z`)) ? Date.parse(`${x}T00:00:00Z`) + (son ? 86_399_999 : 0) : null)
  const gte = gun(q.get('from'), false), lte = gun(q.get('to'), true)
  if ((q.get('from') && gte === null) || (q.get('to') && lte === null) || (gte !== null && lte !== null && (gte > lte || lte - gte > 366 * 86_400_000))) return KOD.gecersiz('range')
  return cevap(await uzlasma(oturum.supabase, oturum.user.id, gte !== null && lte !== null ? { gte, lte } : undefined))
})
