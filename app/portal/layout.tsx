import type { CSSProperties, ReactNode } from 'react'
import { Fraunces, Nunito_Sans } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './sagligim.css'

const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-fraunces',
  display: 'swap',
})

const nunito = Nunito_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-nunito',
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
  themeColor: '#f4f1ea',
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const fontVars = {
    ['--sg-font-display']: 'var(--font-fraunces), Georgia, serif',
    ['--sg-font-ui']: 'var(--font-nunito), system-ui, sans-serif',
  } as CSSProperties

  return (
    <div className={`sagligim-root ${fraunces.variable} ${nunito.variable}`} style={fontVars}>
      {children}
    </div>
  )
}
