
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TZ: 'Europe/Istanbul',
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // NOTYA-TC-01: type errors fail the build again. They were ignored here AND tsc was aborting on
  // a deprecation warning, so undefined names shipped to production (ICD-10, audit log, mali notes).
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },

  // DAH-/KD-/DERM-PROMPTS-LOCK: specialties/<branş>/prompts/*.md are read at runtime (fs) by SOAP, chat, hafıza (voice) and approve routes.
  experimental: {
    // ASI-KARNESI-01: aşı karnesi PDF'i Türkçe glifler için gömülü Liberation Sans okur (lib/asi/karnePdf.tsx) — yalnız iki PDF rotası.
    outputFileTracingIncludes: {
      '/api/**/*': ['./specialties/dahiliye/prompts/*.md', './specialties/kadin-dogum/prompts/*.md', './specialties/dermatoloji/prompts/*.md', './specialties/goz-hastaliklari/prompts/*.md'],
      '/api/portal/hasta/*/asi-karnesi/pdf': ['./node_modules/pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf', './node_modules/pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf'],
      '/api/doktor/asilar/karne/pdf': ['./node_modules/pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf', './node_modules/pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf'],
    },
  },

  // QA-2026-09-06 bulgu #1: /login 404'tı — alışkanlıkla yazılan yolları gerçek girişe yönlendir.
  async redirects() {
    return [
      { source: '/login', destination: '/giris', permanent: true },
      { source: '/signin', destination: '/giris', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Allow microphone from all origins including ElevenLabs WebRTC
            key: "Permissions-Policy",
            value: "microphone=*, camera=(), geolocation=()",
          },
          {
            // Allow connections to ElevenLabs WebSocket and Supabase
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' blob: https:",
              // Critical: allow ElevenLabs WebSocket connections
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.elevenlabs.io wss://api.elevenlabs.io https://*.elevenlabs.io wss://*.elevenlabs.io https://api.anthropic.com https://api.groq.com",
              "worker-src 'self' blob: data:",
            ].join("; "),
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ]
  },
}

export default nextConfig
