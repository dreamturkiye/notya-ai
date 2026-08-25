import type { Metadata } from 'next'
import { Bricolage_Grotesque, Source_Serif_4 } from 'next/font/google'

const display = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-doktor-display',
  display: 'swap',
})

const serif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-doktor-serif',
  display: 'swap',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Notya AI — Doktor',
  description:
    'Cebinizdeki dünyaca ünlü uzman doktor. Sesli konuşun; tanı, reçete ve güvenlik ağı aynı anda.',
}

export default function DoktorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${serif.variable}`} style={{ minHeight: '100vh' }}>
      {children}
    </div>
  )
}
