import { NextRequest, NextResponse } from 'next/server'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { telegramGonder } from '@/lib/uyari/telegram'

const BASE_URL = 'https://www.notya.io'

export async function GET(req: NextRequest) {
  try {
    if (!cronYetkiliMi(req)) {
      return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 })
    }

    const routes = [
      { name: '/api/asistan/chat', url: BASE_URL + '/api/asistan/chat' },
      { name: '/api/asistan/mali-chat', url: BASE_URL + '/api/asistan/mali-chat' },
      { name: '/api/asistan/avukat-chat', url: BASE_URL + '/api/asistan/avukat-chat' },
    ]

    const results = await Promise.all(
      routes.map(async (route) => {
        const response = await fetch(route.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'ping', sessionId: 'healthcheck' }),
        })

        if (response.status >= 500) {
          await telegramGonder(`Alert: ${route.name} returned status ${response.status}`)
        }

        return { name: route.name, status: response.status }
      })
    )

    const summary = `Notya AI Health Check\n${results.map((r) => `${r.name}: ${r.status}`).join('\n')}`
    const uyari = await telegramGonder(summary)

    return NextResponse.json({ ok: true, results, uyari }, { status: 200 })
  } catch (error) {
    console.error('Health check failed:', error)
    await telegramGonder(`Sağlık kontrolü hatası: ${error instanceof Error ? error.message : String(error)}`)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
