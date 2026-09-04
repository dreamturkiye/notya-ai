import type { CSSProperties, ReactNode } from 'react'
import { Newsreader, Outfit } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './sagligim.css'

const newsreader = Newsreader({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-newsreader',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Notya · Sağlığım',
  description: 'Sağlık kayıtlarınız, sonuçlarınız ve mesajlarınız tek yerde.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#E8EEF2',
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const fontVars = {
    ['--sg-font-display']: 'var(--font-newsreader), Georgia, "Times New Roman", serif',
    ['--sg-font-ui']: 'var(--font-outfit), "Segoe UI", sans-serif',
  } as CSSProperties

  return (
    <div className={`sagligim-root ${newsreader.variable} ${outfit.variable}`} style={fontVars}>
      {children}
    </div>
  )
}
