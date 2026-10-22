import { robotsMetni } from '@/lib/ulke/seo/robotsSitemap'

export const dynamic = 'force-dynamic'

export function GET() {
  return new Response(robotsMetni(), { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300' } })
}
