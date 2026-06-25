import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildProvizionSOAP, callMedulaSOAP, parseMedulaResponse, sgkUyumKontrol, SGK_MEDULA_BASE } from '@/lib/sgk/medula'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: { user }, error } = await sb.auth.getUser(auth.slice(7))
  if (error || !user) return NextResponse.json({ error: 'Gecersiz token' }, { status: 401 })

  const body = await req.json()
  const { action, credentials, hastaTc, ilacBarkod, icd10 } = body

  if (action === 'uyum') {
    const result = await sgkUyumKontrol(ilacBarkod || '', icd10 || '')
    return NextResponse.json(result)
  }

  if (action === 'provizyon') {
    if (!credentials?.hekimTc || !credentials?.sifre || !hastaTc) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }
    // PRODUCTION: Real SOAP call to Medula
    // try {
    //   const soap = buildProvizionSOAP({ hastaTc, hekimTc: credentials.hekimTc, sifre: credentials.sifre, tesiKodu: credentials.tesiKodu || '' })
    //   const xml = await callMedulaSOAP(`${SGK_MEDULA_BASE}/provizyon`, soap, 'medulaProvizyon')
    //   const parsed = parseMedulaResponse(xml)
    //   return NextResponse.json({ success: true, data: parsed })
    // } catch(e) { return NextResponse.json({ error: 'SGK baglanti hatasi' }, { status: 502 }) }

    // DEMO MODE: Simulate Medula response
    await new Promise(r => setTimeout(r, 1200))
    return NextResponse.json({
      success: true, source: 'demo',
      data: {
        aktifSigorta: true,
        sgkTuru: 'Genel Saglik Sigortasi',
        muafiyet: 'Yok',
        katilimPayi: '20',
        takipNo: 'DEMO-' + Date.now(),
        basvuruNo: 'BA' + Math.random().toString(36).slice(2,8).toUpperCase()
      }
    })
  }

  return NextResponse.json({ error: 'Bilinmeyen action' }, { status: 400 })
}
