'use client'
import { useRouter, usePathname } from 'next/navigation'
import { CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme'
import { hekimProfilOturumSil } from '@/lib/doktor/hekimProfilIstemci'

interface KlinikNavProps {
  clinicName?: string
  adminName?: string
}

const navItems = [
  { label: 'Genel Bakış', href: '/dashboard/klinik' },
  { label: 'Hastalar', href: '/dashboard/klinik/hastalar' },
  { label: 'Randevular', href: '/dashboard/klinik/randevular' },
  { label: 'Araçlar', href: '/klinik-tools' },
  { label: 'Uzmanlar', href: '/asistan/klinik' },
  { label: 'Kullanıcılar', href: '/dashboard/klinik/kullanicilar' },
  { label: 'Klinik Ayarları', href: '/dashboard/klinik/ayarlar' },
  { label: 'Pabau', href: '/dashboard/klinik/pabau' },
]

export default function KlinikNav({ clinicName, adminName }: KlinikNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  function logout() {
    try { localStorage.removeItem('auth-token') } catch {}
    hekimProfilOturumSil()
    router.push('/giris')
  }

  return (
    <>
    {/* eslint-disable-next-line @next/next/no-page-custom-font */}
    <link rel="stylesheet" href={CHROME_FONT_HREF} />
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#f4eee3', borderBottom: '1px solid rgba(58,44,34,0.08)',
      paddingTop: 'env(safe-area-inset-top, 0px)', paddingLeft: '48px', paddingRight: '48px',
      minHeight: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: "'Source Sans 3', system-ui, sans-serif"
    }}>
      <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 400, color: '#3b2e24', letterSpacing: '-0.01em' }}>
        {clinicName}
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <button key={item.href} onClick={() => router.push(item.href)} style={{
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              padding: '6px 14px', borderRadius: '6px', fontSize: '13px',
              color: active ? '#3b2e24' : '#8b7d70',
              fontWeight: active ? 500 : 400,
              background: active ? 'rgba(58,44,34,0.045)' : 'none'
            }}>
              {item.label}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: '#8b7d70' }}>{adminName}</span>
        <button onClick={logout} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: '12px', color: '#2f4334', letterSpacing: '0.05em'
        }}>Çıkış</button>
      </div>
    </nav>
    </>
  )
}