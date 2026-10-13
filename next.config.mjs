
import { existsSync } from 'node:fs'

// NOTYA-ULKE-01 (Kaan, 2026-10-08): one repository, one build per country. NOTYA_COUNTRY says which country THIS build
// serves; unset = Türkiye, exactly as before countries existed. It is inlined below so countries/active/ can drop every
// other country's pack at build time. An unknown code stops the build — it never guesses.
// Build-level facts (time zone, and for a new country its redirects) come from that country's own countries/<kod>/derleme.mjs.
const ULKE = process.env.NOTYA_COUNTRY || 'tr'
if (!/^[a-z]{2}$/.test(ULKE) || !existsSync(new URL(`./countries/${ULKE}/derleme.mjs`, import.meta.url))) {
  throw new Error(`NOTYA_COUNTRY="${ULKE}" is not a country in countries/. Refusing to build.`)
}
const { default: ulkeDerleme } = await import(`./countries/${ULKE}/derleme.mjs`)
// NOTYA-UZ-MUAYENE-01: a country may be served under a path of the main site (Uzbekistan: /uzbek). Empty / absent = the
// domain root, and then NOTHING is set below — Türkiye's config is what it was. A malformed value stops the build.
const YOL_ON_EKI = ulkeDerleme.yolOnEki || ''
if (!/^(\/[a-z0-9][a-z0-9-]*)?$/.test(YOL_ON_EKI)) {
  throw new Error(`countries/${ULKE}/derleme.mjs: yolOnEki="${YOL_ON_EKI}" must be empty or one path segment like "/uzbek". Refusing to build.`)
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTYA-ULKE-01: WHICH FILES ARE ROUTES. The pre-split application (Türkiye today) keeps Next's default — nothing is
  // set, exactly as before. Any other country's build takes ONLY files named *.ulke.tsx / *.ulke.ts as routes
  // (app/layout.ulke.tsx, app/page.ulke.tsx, middleware.ulke.ts, …): the Turkish route files are not part of that
  // build at all, and the *.ulke.* files are not routes in a Türkiye build. See app/layout.ulke.tsx.
  // `mjs` is there for ONE file, app/not-found.mjs: Next 14.2 builds the root not-found page only when its file name
  // has a single extension (see that file). Tests allow no other .mjs route file. Türkiye never treats .mjs as a route.
  ...(ulkeDerleme.bolunmemisUygulama ? {} : { pageExtensions: ['ulke.tsx', 'ulke.ts', 'mjs'] }),
  // NOTYA-UZ-MUAYENE-01: pages, API routes, assets (/_next/…), redirects and the middleware all move under the prefix.
  // Plain links and fetch() calls of the country screens add it themselves (lib/ulke/yol.ts).
  ...(YOL_ON_EKI ? { basePath: YOL_ON_EKI } : {}),
  env: {
    TZ: ulkeDerleme.saatDilimi,
    NOTYA_COUNTRY: ULKE,
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
    // NOTYA-ULKE-01: the list below belongs to the pre-split application (Türkiye today) and is returned only for it.
    // Any other country gets its own list from countries/<kod>/derleme.mjs — never these.
    if (!ulkeDerleme.bolunmemisUygulama) return ulkeDerleme.yonlendirmeler
    return [
      // NOTYA-KOK-DOKTOR-01 (Kaan, 2026-09-27): alan adının kökü doğrudan hekim açılış sayfasına. Uçta GERÇEK 307 + Location
      // (geçici: dikeyler yeniden öne çıkarsa bu satır silinir). app/page.tsx'teki redirect() tek başına yetmedi: statik
      // sayfa olarak derlenince Location başlıksız 307 + hata kabuğu üretiyordu.
      { source: '/', destination: '/doktor', permanent: false },
      { source: '/login', destination: '/giris', permanent: true },
      { source: '/signin', destination: '/giris', permanent: true },
      // KONSULTASYONLAR-01 — eski "Bekleyen Konsültasyonlar" kapısı yeni araca (308 kalıcı).
      { source: '/doktor-tools/bekleyen-konsultasyonlar', destination: '/doktor-tools/konsultasyonlar', permanent: true },
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
