/**
 * ESNEK-GELISIM (Kaan, 2026-11-24) — weekly El Notu regression run (vercel.json crons: Mondays, five invocations an hour
 * apart; SEC-CRON-01: cronYetkiliMi only). Each invocation: pending set pages older than 30 days are deleted, then this
 * week's run continues where the previous invocation stopped (time-boxed) — every consented set page re-read through the
 * PRODUCTION reader path (lib/elNotu/model.ts → central policy; branş seed incl. founder-approved pairs; no personal
 * memory), its masking proven again first, only numbers stored (lib/elNotu/regresyon.ts).
 */
import { NextResponse } from 'next/server'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { bayatAdaylariTemizle, haftalikRegresyon } from '@/lib/elNotu/regresyon'
import { bransTohumu } from '@/lib/elNotu/bransSozluk'
import { elNotuModeli } from '@/lib/elNotu/model'
import { ilacEslesmesi } from '@/lib/elNotu/ilac'
import { sayfaMaskeKaniti } from '@/lib/elNotu/maskeDogrula'
import { anahatTr } from '@/core/elNotu/tohum'
import { EL_NOTU_TR } from '@/core/elNotu/metinTr'
import { SPECIALTIES } from '@/lib/doktor/specialties'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  if (!cronYetkiliMi(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 })
  const sb = servisSupabase()
  const silinen = await bayatAdaylariTemizle(sb).catch(() => 0)
  const r = await haftalikRegresyon(sb, {
    butceMs: 240_000,
    model: () => elNotuModeli({ doctorId: null }),
    maskeKaniti: (p, s) => sayfaMaskeKaniti(p, s, true).tamam === true,
    surum: process.env.VERCEL_GIT_COMMIT_SHA || null,
    ortam: {
      dil: EL_NOTU_TR.dil, ilac: ilacEslesmesi,
      tohum: (b) => bransTohumu(sb, b), anahat: (b) => anahatTr(b),
      bransAdi: (b) => SPECIALTIES.find((x) => x.key === b)?.label || b || 'genel',
    },
  })
  return NextResponse.json({ ok: true, silinen, ...r })
}
