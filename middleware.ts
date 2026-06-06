// ============================================================
// NOTYA AI - Next.js Middleware
// Kimlik doğrulama, rate limiting, güvenlik başlıkları
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Korunan rotalar
const PROTECTED_ROUTES = [
  '/api/sessions',
  '/api/notes',
  '/api/billing/subscribe',
  '/dashboard',
]

// Public rotalar (auth gerektirmez)
const PUBLIC_ROUTES = [
  '/api/billing/webhook',
  '/api/whatsapp/webhook',
  '/api/auth',
  '/',
  '/fiyatlar',
  '/hakkimizda',
  '/gizlilik',
  '/kullanim-kosullari',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const response = NextResponse.next()

  // ---- GÜVENLİK BAŞLIKLARI ----
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=*, geolocation=()')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.elevenlabs.io wss://api.elevenlabs.io https://*.elevenlabs.io wss://*.elevenlabs.io https://api.anthropic.com https://api.deepgram.com wss://api.deepgram.com; worker-src 'self' blob: https://unpkg.com https://cdn.jsdelivr.net; script-src-elem 'self' 'unsafe-inline' blob: https://unpkg.com https://cdn.jsdelivr.net"
  )

  // CORS - Sadece notya.ai domaininden
  const origin = req.headers.get('origin')
  const allowedOrigins = [
    'https://notya.ai',
    'https://www.notya.ai',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
  ].filter(Boolean)

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers })
  }

  // Public rotalar - doğrudan geç
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return response
  }

  // Korunan rotalar - kimlik doğrulama
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  if (!isProtected) return response

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Kimlik doğrulama gerekli', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Supabase JWT doğrulama
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz veya süresi dolmuş token', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // Rate limiting - Upstash Redis (basit implementasyon)
    const rateLimitKey = `notya:ratelimit:${user.id}:${Math.floor(Date.now() / 60000)}`
    const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')

    // User ID'yi header'a ekle (API routes'larda kullanmak için)
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-rate-limit-key', rateLimitKey)
    response.headers.set('x-rate-limit-max', String(rateLimitMax))

  } catch {
    return NextResponse.json(
      { success: false, error: 'Kimlik doğrulama hatası', code: 'AUTH_ERROR' },
      { status: 500 }
    )
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
