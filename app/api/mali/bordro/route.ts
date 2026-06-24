import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// 2026 constants
const ASGARI_UCRET = 22104.67
const SGK_ISCI_ORANI = 0.14
const SGK_ISVEREN_ORANI = 0.155
const ISSIZLIK_ISCI = 0.01
const ISSIZLIK_ISVEREN = 0.02
const DAMGA_VERGISI_ORANI = 0.00759
const KIDEM_TAZMINATI_TAVAN = 35058.58

function hesaplaBordro(brutMaas: number, kidemYili = 0, engellilikDerecesi: number | null = null) {
  // SGK
  const sgkMatrahi = Math.min(brutMaas, ASGARI_UCRET * 7.5)
  const sgkIsciBrut = sgkMatrahi * SGK_ISCI_ORANI
  const issizlikIsci = sgkMatrahi * ISSIZLIK_ISCI
  const sgkIsveren = sgkMatrahi * SGK_ISVEREN_ORANI
  const issizlikIsveren = sgkMatrahi * ISSIZLIK_ISVEREN

  // Gelir vergisi
  const engellilikIndirimi = engellilikDerecesi === 1 ? 6900 : engellilikDerecesi === 2 ? 4000 : engellilikDerecesi === 3 ? 1800 : 0
  const gvMatrahi = brutMaas - sgkIsciBrut - issizlikIsci - engellilikIndirimi
  const aylikAsgari = ASGARI_UCRET
  const asgariGvMatrahi = aylikAsgari - (aylikAsgari * (SGK_ISCI_ORANI + ISSIZLIK_ISCI))
  
  let gelirVergisi = 0
  // 2026 GV dilimleri (aylik)
  if (gvMatrahi <= 26000) gelirVergisi = gvMatrahi * 0.15
  else if (gvMatrahi <= 58000) gelirVergisi = 3900 + (gvMatrahi - 26000) * 0.20
  else if (gvMatrahi <= 150000) gelirVergisi = 10300 + (gvMatrahi - 58000) * 0.27
  else if (gvMatrahi <= 600000) gelirVergisi = 35140 + (gvMatrahi - 150000) * 0.35
  else gelirVergisi = 192640 + (gvMatrahi - 600000) * 0.40

  // Asgari ucret GV istisna
  const asgariGv = asgariGvMatrahi <= 26000 ? asgariGvMatrahi * 0.15 : 3900 + (asgariGvMatrahi - 26000) * 0.20
  gelirVergisi = Math.max(0, gelirVergisi - asgariGv)

  const damgaVergisi = brutMaas * DAMGA_VERGISI_ORANI
  const toplamKesinti = sgkIsciBrut + issizlikIsci + gelirVergisi + damgaVergisi
  const netMaas = brutMaas - toplamKesinti
  const isverenToplamMaliyet = brutMaas + sgkIsveren + issizlikIsveren
  const kidemTazminatiTavan = kidemYili > 0 ? Math.min(KIDEM_TAZMINATI_TAVAN, KIDEM_TAZMINATI_TAVAN) * kidemYili : 0

  return {
    brutMaas: Math.round(brutMaas * 100) / 100,
    sgkIsciBrut: Math.round(sgkIsciBrut * 100) / 100,
    issizlikIsci: Math.round(issizlikIsci * 100) / 100,
    sgkIsveren: Math.round(sgkIsveren * 100) / 100,
    issizlikIsveren: Math.round(issizlikIsveren * 100) / 100,
    gelirVergisi: Math.round(gelirVergisi * 100) / 100,
    damgaVergisi: Math.round(damgaVergisi * 100) / 100,
    netMaas: Math.round(netMaas * 100) / 100,
    isverenToplamMaliyet: Math.round(isverenToplamMaliyet * 100) / 100,
    kidemTazminatiTavan: Math.round(kidemTazminatiTavan * 100) / 100,
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization') || req.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth.split(' ')[1])
    if (ae || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { brutMaas, engellilikDerecesi, kidemYili } = body
    if (typeof brutMaas !== 'number' || brutMaas <= 0) {
      return NextResponse.json({ success: false, error: 'Gecersiz brut maas' }, { status: 400 })
    }

    const result = hesaplaBordro(brutMaas, kidemYili ?? 0, engellilikDerecesi ?? null)
    return NextResponse.json({ success: true, data: result })
  } catch (e: unknown) {
    console.error('[bordro]', e)
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Sunucu hatasi' }, { status: 500 })
  }
}
