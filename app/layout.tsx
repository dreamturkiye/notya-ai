
import type { Metadata, Viewport } from "next"
import "./globals.css"
import TurkceDogrulama from "@/components/core/TurkceDogrulama"
import { AsistanOturumProvider } from "@/components/asistan/AsistanOturumContext"
import AsistanYuzenPanel from "@/components/asistan/AsistanYuzenPanel"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A1628",
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "Notya AI — Yapay Zekâ Uzman Asistanı",
  description: "Doktorun cebindeki dünyaca ünlü uzman. Sesli komutla hasta oluştur, tanı al, reçete yaz.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    // Opaque light bar. black-translucent drew the clock/signal/Wi-Fi over the cream chrome.
    statusBarStyle: "default",
    title: "Notya AI",
    startupImage: ["/splash.png"],
  },
  formatDetection: { telephone: false },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-touch-fullscreen": "yes",
  } as Record<string, string>,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Notya AI" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body style={{margin:0,background:"#0A1628"}}>
        <TurkceDogrulama />
        {/* NOTYA-ASISTAN-YUZEN-01: asistan oturumu sayfa geçişlerinde yaşar; /asistan dışında yüzen panel. */}
        <AsistanOturumProvider>
          {children}
          <AsistanYuzenPanel />
        </AsistanOturumProvider>
        <script dangerouslySetInnerHTML={{__html:`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
          }
        `}} />
      </body>
    </html>
  )
}
