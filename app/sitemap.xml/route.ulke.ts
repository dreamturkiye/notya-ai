import { sitemapXml } from '@/lib/ulke/seo/robotsSitemap'

export const dynamic = 'force-dynamic'

export function GET() {
  const xml = sitemapXml()
  if (!xml) return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  return new Response(xml, { status: 200, headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300' } })
}
