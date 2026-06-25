import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

// MERNiS / e-Devlet TC lookup
// PRODUCTION: Requires institutional e-Devlet API access via gov partnership
// CURRENT: Validates TC checksum + returns structured demo response
// Real integration: POST to https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx with SOAP

function validateTC(tc: string): boolean {
  if (!/^[1-9][0-9]{10}$/.test(tc)) return false
  const d = tc.split('').map(Number)
  const odd = d[0]+d[2]+d[4]+d[6]+d[8]
  const even = d[1]+d[3]+d[5]+d[7]
  if ((odd*7 - even) % 10 !== d[9]) return false
  if ((d.slice(0,10).reduce((a,b)=>a+b,0)) % 10 !== d[10]) return false
  return true
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const token = auth.slice(7)

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Gecersiz token' }, { status: 401 })

  const { tc } = await req.json()
  if (!tc || !validateTC(tc)) return NextResponse.json({ error: 'Gecersiz TC Kimlik' }, { status: 400 })

  // PRODUCTION INTEGRATION POINT:
  // const soapBody = buildMernisSOAP(tc, ad, soyad, dogumYili)
  // const response = await fetch('https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx', {
  //   method: 'POST', headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '...' },
  //   body: soapBody
  // })
  // Requires: institutional application to NVI (Nufus ve Vatandaslik Isleri)

  // DEMO MODE: Return validated structure
  // In real integration, NVI returns: kimlikNo, ad, soyad, babaAd, anaAd, dogumYer, dogumTarih, uyruk
  await new Promise(r => setTimeout(r, 800)) // Simulate network latency

  return NextResponse.json({
    success: true,
    source: 'demo', // 'mernis' in production
    data: {
      tc,
      // In production these come from MERNiS:
      // ad: decryptedName, soyad: decryptedSurname, dogumTarihi: '1990-01-15'
      // For demo: TC checksum passed, prompt manual fill
      verified: true,
      message: 'TC Kimlik dogrulandi. Bilgileri manuel girin.' +
               ' (MERNiS entegrasyonu kurum basvurusu gerektirir)',
      integration_status: 'pending_activation',
      integration_url: 'https://e-devlet.gov.tr/api/kurum-basvurusu'
    }
  })
}
