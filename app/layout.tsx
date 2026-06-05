import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Notya AI — Konuş, Biz Yazalım',
  description: "Türkiye'nin ilk çok alanlı AI not asistanı. Doktorlar, avukatlar ve tüm profesyoneller için.",
  keywords: 'AI not asistanı, tıbbi not, avukat notu, KVKK, Türkçe AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
