/**
 * NOTYA-ILAC-05 — ilaç arama servisi (SGK EK-4/A, 8.649 ürün).
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
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'
import { ilacAra, type IlacKaydi } from '@/lib/ilac/ilacArama'

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

export interface SunumSecenegi {
  ad: string
  barkod: string
  esdegerGrubu?: string
}
export interface GruplanmisIlac {
  marka: string
  etkenMadde?: string
  sgk: boolean
  sunumlar: SunumSecenegi[]
}

export async function GET(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
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

  const gruplar = new Map<string, GruplanmisIlac>()
  for (const k of ham) {
    const anahtar = (k.marka || k.ad).toLocaleUpperCase('tr')
    let g = gruplar.get(anahtar)
    if (!g) {
      g = { marka: k.marka || k.ad, etkenMadde: k.etkenMadde, sgk: k.sgk !== false, sunumlar: [] }
      gruplar.set(anahtar, g)
    }
    if (!g.sunumlar.some((s) => s.barkod === k.barkod)) {
      g.sunumlar.push({ ad: k.ad, barkod: k.barkod || '', esdegerGrubu: k.esdegerGrubu })
    }
  }

  let sonuclar = [...gruplar.values()]
    .map((g) => ({ ...g, sunumlar: g.sunumlar.sort((a, b) => a.ad.localeCompare(b.ad, 'tr')) }))

  if (kisaSorgu) {
    sonuclar = sonuclar.sort((a, b) =>
      b.sunumlar.length - a.sunumlar.length ||       // more pack sizes ≈ more widely prescribed
      a.marka.length - b.marka.length ||             // a short brand is usually the familiar one
      a.marka.localeCompare(b.marka, 'tr'))
  }

  sonuclar = sonuclar.slice(0, 8)

  return NextResponse.json({ sonuclar, toplam: veri().length })
}
