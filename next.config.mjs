
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TZ: 'Europe/Istanbul',
    // NOTYA-SES-ELEVEN-GERI-01: Ayşe's voice provider (elevenlabs | fish), inlined so the page and the server read
    // the same value — the page decides inside the tap, before any request. Empty → elevenlabs (lib/asistan/sesSaglayici.ts).
    AYSE_SES_SAGLAYICI: process.env.AYSE_SES_SAGLAYICI || '',
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // NOTYA-TC-01: type errors fail the build again. They were ignored here AND tsc was aborting on
  // a deprecation warning, so undefined names shipped to production (ICD-10, audit log, mali notes).
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },

  // Preview deploys restore the previous preview's `.next/cache`. After an OOM that cache is
  // bloated/partial; webpack loads it and the 6 GB heap dies during compile. Production keeps
  // its own healthy cache and compiles. Skip the filesystem cache on preview only.
  webpack: (config) => {
    config.parallelism = 1
    if (process.env.VERCEL_ENV === 'preview') {
      config.cache = false
    }
    return config
  },

  // DAH-/KD-/DERM-PROMPTS-LOCK: specialties/<branş>/prompts/*.md are read at runtime (fs) by SOAP, chat, hafıza (voice) and approve routes.
  experimental: {
    // Vercel 8 GB builder SIGKILL (OOM) on next build — one compile worker.
    cpus: 1,
    workerThreads: false,
    // NOTYA-GELEN-BELGELER: iPhone HEIC → JPEG runs libheif (WebAssembly) on the server; loaded from node_modules, not bundled.
    serverComponentsExternalPackages: ['heic-convert', 'heic-decode', 'libheif-js',
      // NOTYA-FISH-WS-01: Fish live socket (ws) + keep-alive agent (undici) run from node_modules, not the bundle.
      'ws', 'undici'],
    // ASI-KARNESI-01: aşı karnesi PDF'i Türkçe glifler için gömülü Liberation Sans okur (lib/asi/karnePdf.tsx) — yalnız iki PDF rotası.
    outputFileTracingIncludes: {
      '/api/**/*': ['./specialties/dahiliye/prompts/*.md', './specialties/kadin-dogum/prompts/*.md', './specialties/dermatoloji/prompts/*.md', './specialties/goz-hastaliklari/prompts/*.md'],
      '/api/portal/hasta/*/asi-karnesi/pdf': ['./node_modules/pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf', './node_modules/pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf'],
      '/api/doktor/asilar/karne/pdf': ['./node_modules/pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf', './node_modules/pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf'],
      '/api/doktor/raporlar/pdf': ['./node_modules/pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf', './node_modules/pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf'],
    },
  },

  // QA-2026-09-06 bulgu #1: /login 404'tı — alışkanlıkla yazılan yolları gerçek girişe yönlendir.
  async redirects() {
    return [
      // NOTYA-KOK-DOKTOR-01 (Kaan, 2026-09-27): alan adının kökü doğrudan hekim açılış sayfasına. Uçta GERÇEK 307 + Location
      // (geçici: dikeyler yeniden öne çıkarsa bu satır silinir). app/page.tsx'teki redirect() tek başına yetmedi: statik
      // sayfa olarak derlenince Location başlıksız 307 + hata kabuğu üretiyordu.
      { source: '/', destination: '/doktor', permanent: false },
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
            // Allow microphone from all origins including ElevenLabs WebRTC; geolocation same-origin only (weather chip)
            key: "Permissions-Policy",
            value: "microphone=*, camera=(), geolocation=(self)",
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
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.elevenlabs.io wss://api.elevenlabs.io https://*.elevenlabs.io wss://*.elevenlabs.io https://api.groq.com https://api.open-meteo.com",
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
