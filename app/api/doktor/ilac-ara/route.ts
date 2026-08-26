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
  if (q.length < 2) return NextResponse.json({ sonuclar: [] })

  // Search wide, then group — otherwise one brand with many packs crowds out every other drug.
  const ham = ilacAra(veri(), q, 60)

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

  const sonuclar = [...gruplar.values()]
    .map((g) => ({ ...g, sunumlar: g.sunumlar.sort((a, b) => a.ad.localeCompare(b.ad, 'tr')) }))
    .slice(0, 8)

  return NextResponse.json({ sonuclar, toplam: veri().length })
}
