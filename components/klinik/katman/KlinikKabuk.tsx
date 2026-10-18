'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'

const LINKS = [
  { href: '/klinik/ayarlar', ad: 'Kurulum' },
  { href: '/klinik/takvim', ad: 'Takvim' },
]

export default function KlinikKabuk({ children }: { children: React.ReactNode }) {
  const yol = usePathname()
  return (
    <div style={{ minHeight: '100vh', background: CHROME_RENK.cream, color: CHROME_RENK.ink, fontFamily: CHROME_FONT.sans }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px', borderBottom: `1px solid ${CHROME_RENK.border}` }}>
        <div>
          <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 22 }}>Notya Klinik</div>
          <div style={{ color: CHROME_RENK.muted, fontSize: 13 }}>Hekimler kendi Notya’sında kalır. Klinik, onların üstündeki ortak masadır.</div>
        </div>
        <nav style={{ display: 'flex', gap: 8 }}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} style={{
              textDecoration: 'none', color: CHROME_RENK.ink, padding: '8px 12px', borderRadius: 999,
              background: yol === l.href ? CHROME_RENK.gold : 'transparent',
            }}>{l.ad}</Link>
          ))}
        </nav>
      </header>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 20px 64px' }}>{children}</main>
    </div>
  )
}
