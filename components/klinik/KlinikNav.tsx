'use client'
import { useRouter, usePathname } from 'next/navigation'

interface KlinikNavProps {
  clinicName: string
  adminName: string
}

const navItems = [
  { label: 'Genel Bakis', href: '/dashboard/klinik' },
  { label: 'Kullanicilar', href: '/dashboard/klinik/kullanicilar' },
  { label: 'Klinik Ayarlari', href: '/dashboard/klinik/ayarlar' },
  { label: 'Fatura & Plan', href: '/dashboard/klinik/fatura' },
  { label: 'Pabau', href: '/dashboard/klinik/pabau' },
]

export default function KlinikNav({ clinicName, adminName }: KlinikNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  function logout() {
    try { localStorage.removeItem('auth-token') } catch {}
    router.push('/giris')
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#FFFAFA', borderBottom: '1px solid rgba(10,22,40,0.08)',
      padding: '0 48px', height: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <span style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: 400, color: '#0A1628', letterSpacing: '-0.01em' }}>
        {clinicName}
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <button key={item.href} onClick={() => router.push(item.href)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 14px', borderRadius: '6px', fontSize: '13px',
              color: active ? '#0A1628' : 'rgba(10,22,40,0.45)',
              fontWeight: active ? 500 : 400,
              background: active ? 'rgba(10,22,40,0.05)' : 'none'
            }}>
              {item.label}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: 'rgba(10,22,40,0.4)' }}>{adminName}</span>
        <button onClick={logout} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '12px', color: '#2563EB', letterSpacing: '0.05em'
        }}>Cikis</button>
      </div>
    </nav>
  )
}