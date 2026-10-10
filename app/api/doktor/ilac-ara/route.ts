/**
 * NOTYA-ILAC-05 — ilaç arama servisi (SGK EK-4/A).
 *
 * Server-side on purpose: the dataset is 1.2 MB, and shipping it to the browser would add more
 * weight to the page than the rest of the application combined — on a phone, on hospital wifi,
 * before the doctor has typed a single letter.
 *
 * Results are GROUPED BY BRAND rather than returned flat. SGK lists every pack separately, so a
 * flat search for "largopen" returns five identical-looking rows (1 GR 16 TB, 125 MG/5 ML SUSP,
 * 200 MG kuru toz, 250 MG/5 ML SUSP, 500 MG 16 TB). A doctor picking from that list cannot tell
 * them apart at a glance and has no reason to prefer one. Grouping gives the real workflow:
 * choose the drug, then choose the presentation — which is also how e-reçete works, where the
 * chosen product's BARCODE is what enters the system.
 *
 * NOTYA-ILAC-07: `etkenMadde` and `atc` come from TİTCK's licensed-products list, joined by
 * barcode (scripts/import-titck-etken.mjs). The group carries the first pack's ingredient for
 * display; each presentation carries its own, and the presentation's value is what gets recorded.
 *
 * NOTYA-SUT-RAPOR-01i: the catalogue is the EK-4/A list in force from 02.10.2026. Products passive on that list or
 * no longer on it stay searchable and are marked not reimbursed, pack by pack (lib/ilac/ilacGrupla.ts).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'
import { ilacAra, type IlacKaydi } from '@/lib/ilac/ilacArama'
import { ilaclariGrupla } from '@/lib/ilac/ilacGrupla'

export const dynamic = 'force-dynamic'

// Loaded once per lambda instance, not per request — parsing 8.649 records on every keystroke
// would make the search feel slower the more the doctor types.
let KAYITLAR: IlacKaydi[] | null = null
function veri(): IlacKaydi[] {
  if (KAYITLAR) return KAYITLAR
  try {
    const p = path.join(process.cwd(), 'data', 'sgk-ilaclar.json')
    KAYITLAR = (JSON.parse(readFileSync(p, 'utf8')).ilaclar || []) as IlacKaydi[]
  } catch {
    KAYITLAR = []
  }
  return KAYITLAR
}

// Types and grouping live in lib/ilac/ilacGrupla.ts (tested there); re-exported for the pickers that import them from here.
export type { GruplanmisIlac, SunumSecenegi } from '@/lib/ilac/ilacGrupla'

export async function GET(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } })
  const auth = request.headers.get('authorization')
  const tok = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined
  const { data: { user }, error } = await supabase.auth.getUser(tok)
  if (error || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 })
  }

  const q = (new URL(request.url).searchParams.get('q') || '').trim()
  if (q.length < 1) return NextResponse.json({ sonuclar: [] })

  /**
   * NOTYA-ILAC-06: answer from the FIRST character and narrow as the doctor types.
   *
   * Previously the minimum was two characters, so typing "A" showed nothing — the doctor got a
   * dead box and had to guess how much more to type before the tool would react. The list should
   * respond immediately and narrow: A -> the well-known A drugs, AU -> the AU ones, AUG ->
   * Augmentin and its neighbours.
   *
   * For one and two characters, fuzzy matching is switched off deliberately: at that length an
   * edit distance of one matches most of the alphabet, and the result is noise dressed up as
   * intelligence. Short queries are prefix-only, which is also what the doctor means — nobody
   * types "A" hoping for a typo correction.
   *
   * Ranking for short queries uses presentation count as a stand-in for prevalence: a brand SGK
   * reimburses in seven pack sizes is more widely prescribed than one sold in a single pack. It is
   * a proxy, not prescription data — worth replacing later with the practice's own history, which
   * is the only genuinely accurate signal.
   */
  const kisaSorgu = q.length <= 2
  const ham = ilacAra(veri(), q, kisaSorgu ? 400 : 60, { prefixOnly: kisaSorgu })

  let sonuclar = ilaclariGrupla(ham)

  if (kisaSorgu) {
    sonuclar = sonuclar.sort((a, b) =>
      b.sunumlar.length - a.sunumlar.length ||       // more pack sizes ≈ more widely prescribed
      a.marka.length - b.marka.length ||             // a short brand is usually the familiar one
      a.marka.localeCompare(b.marka, 'tr'))
  }

  sonuclar = sonuclar.slice(0, 8)

  return NextResponse.json({ sonuclar, toplam: veri().length })
}
