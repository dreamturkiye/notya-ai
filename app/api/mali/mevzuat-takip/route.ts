import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const GIB_SOURCES = [
  { url: 'https://www.gib.gov.tr/haberler', name: 'GIB Haberler' },
  { url: 'https://www.gib.gov.tr/sirkuler', name: 'GIB Sirkuler' },
]
async function fetchGIB(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) })
    const html = await res.text()
    // Extract titles from common GIB page patterns
    const matches = html.match(/<h[23][^>]*>([^<]{10,200})<\/h[23]>/g) || []
    const titles = matches.slice(0,10).map((m: string) => m.replace(/<[^>]+>/g,'').trim()).filter((t: string) => t.length > 15)
    return titles
  } catch { return [] }
}
// Static mevzuat reference - always available even without scraping
const STATIC_MEVZUAT = [
  { baslik: 'KDV Beyannamesi Son Gunu: Her ayin 26si', kaynak: 'KDV K. Md.41', oncelik: 'yuksek' },
  { baslik: 'Muhtasar Beyanname: Her ayin 26si', kaynak: 'GVK Md.98', oncelik: 'yuksek' },
  { baslik: 'SGK Bildirgesi: Her ayin 23u', kaynak: 'SGK K. Md.86', oncelik: 'yuksek' },
  { baslik: 'Gecici Vergi 1.Donem: 17 Mayis', kaynak: 'GVK Md.120', oncelik: 'orta' },
  { baslik: 'Gecici Vergi 2.Donem: 17 Agustos', kaynak: 'GVK Md.120', oncelik: 'orta' },
  { baslik: 'Gecici Vergi 3.Donem: 17 Kasim', kaynak: 'GVK Md.120', oncelik: 'orta' },
  { baslik: 'Yillik GV Beyannamesi: Mart sonu', kaynak: 'GVK Md.92', oncelik: 'yuksek' },
  { baslik: '2026 Asgari Ucret: 22.104,67 TL', kaynak: 'AGK Karari', oncelik: 'bilgi' },
  { baslik: '10380 CB Karari: Buyuksehir esnaf gercek usule gecti (1.1.2026)', kaynak: '10380 CB Karari', oncelik: 'kritik' },
  { baslik: 'MASAK Bildirimi: Supheli islemler 10 gun icinde', kaynak: 'MASAK Md.27', oncelik: 'yuksek' },
]
export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ','')
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth)
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Try live scrape, fall back to static
    let liveItems: { baslik: string; kaynak: string; oncelik: string }[] = []
    try {
      const results = await Promise.allSettled(GIB_SOURCES.map(s => fetchGIB(s.url)))
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          r.value.forEach((title: string) => liveItems.push({ baslik: title, kaynak: GIB_SOURCES[i].name, oncelik: 'bilgi' }))
        }
      })
    } catch { /* fall through to static */ }
    return NextResponse.json({
      success: true,
      data: { static: STATIC_MEVZUAT, live: liveItems.slice(0,15), lastChecked: new Date().toISOString() }
    })
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
