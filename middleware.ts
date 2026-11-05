// ============================================================
// NOTYA AI - Next.js Middleware
// Kimlik doğrulama, rate limiting, güvenlik başlıkları
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { demoCspGenislet, demoYoluMu } from './lib/demo/demoBaglantisi'

// Doctor and clinical APIs require authentication by default.
const PROTECTED_PREFIXES = [
  '/api/sessions',
  '/api/notes',
  '/api/billing/subscribe',
  '/api/doktor',
  '/api/accounting',
  '/dashboard',
]

// Public rotalar (auth gerektirmez)
const PUBLIC_ROUTES = [
  '/api/billing/webhook',
  '/api/whatsapp/webhook',
  '/api/auth',
  '/api/sandbox',
  '/sandbox',
  '/',
  '/fiyatlar',
  '/hakkimizda',
  '/gizlilik',
  '/kullanim-kosullari',
  '/kvkk',
  '/veri-isleme',
  '/cerez-politikasi',
  '/klinik-karar-destegi',
  '/iade-ve-iptal',
  '/telif-hakki',
  '/yasal',
  '/giris',
  '/onboarding',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const response = NextResponse.next()

  // ---- GÜVENLİK BAŞLIKLARI ----
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=*, geolocation=(self)')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // CSP tightened: removed unsafe-eval. unsafe-inline kept temporarily for styles and
  // existing script patterns; further reduction via nonces is a follow-up.
  const csp =
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.elevenlabs.io wss://api.elevenlabs.io https://*.elevenlabs.io wss://*.elevenlabs.io https://api.groq.com https://api.deepgram.com wss://api.deepgram.com https://api.open-meteo.com https://*.facebook.com; worker-src 'self' blob: data: https://unpkg.com https://cdn.jsdelivr.net; frame-src 'self' blob: https://*.facebook.com; script-src-elem 'self' 'unsafe-inline' blob: https://unpkg.com https://cdn.jsdelivr.net https://connect.facebook.net"
  response.headers.set('Content-Security-Policy', demoYoluMu(pathname) ? demoCspGenislet(csp) : csp)

  // CORS
  const origin = req.headers.get('origin')
  const allowedOrigins = [
    'https://notya.io',
    'https://www.notya.io',
    'https://notya-ai.vercel.app',
    'https://notya-ai-getvelacom.vercel.app',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
  ].filter(Boolean)
  const vercelOnizleme = /^https:\/\/notya(-ai)?-[a-z0-9-]+-getvelacom\.vercel\.app$/i.test(origin || '')

  if (origin && (allowedOrigins.includes(origin) || vercelOnizleme)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers })
  }

  if (isPublic(pathname)) {
    return response
  }

  if (!isProtected(pathname)) {
    return response
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Kimlik doğrulama gerekli', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

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

    response.headers.set('x-user-id', user.id)
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
