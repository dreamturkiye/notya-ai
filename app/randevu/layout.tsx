import type { CSSProperties, ReactNode } from 'react'
import { Newsreader, Outfit } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import '../portal/sagligim.css'

/** NOTYA-RANDEVU-V2 — e-mail action links (/randevu/<signed token>) use the Sağlığım look, no login. */
const newsreader = Newsreader({ subsets: ['latin', 'latin-ext'], variable: '--font-newsreader', display: 'swap' })
const outfit = Outfit({ subsets: ['latin', 'latin-ext'], variable: '--font-outfit', display: 'swap' })

export const metadata: Metadata = {
  title: 'Notya · Randevu',
  description: 'Randevunuzu onaylayın, erteleyin ya da iptal edin.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f4eee3' }

export default function RandevuLayout({ children }: { children: ReactNode }) {
  const fontVars = {
    ['--sg-font-display']: 'var(--font-newsreader), Georgia, "Times New Roman", serif',
    ['--sg-font-ui']: 'var(--font-outfit), "Segoe UI", sans-serif',
  } as CSSProperties
  return (
    <div className={`sagligim-root ${newsreader.variable} ${outfit.variable}`} style={fontVars}>
      <div className="sg-shell">
        <header className="sg-header">
          <div className="sg-header-inner">
            <span className="sg-brand-lockup">
              <span className="sg-brand-mark">Notya</span>
              <span className="sg-brand-product">Randevu</span>
            </span>
          </div>
        </header>
        <main className="sg-main">{children}</main>
      </div>
    </div>
  )
}
