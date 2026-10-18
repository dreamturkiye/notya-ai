'use client'

import { useRouter } from 'next/navigation'
import { CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme'
import { hekimProfilOturumSil } from '@/lib/doktor/hekimProfilIstemci'
import { NOTYA_KLINIK_AD, OZEL_BRANS_KATEGORI } from '@/lib/specialties/klinikDikey'

/** Özel Branşlar kabuğu. Notya Klinik masasının menüsünü taşımaz. */
export default function OzelBranslarBaslik() {
  const router = useRouter()

  function logout() {
    try { localStorage.removeItem('auth-token') } catch { /* oturum zaten yok */ }
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
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
      }}>
        <button type="button" onClick={() => router.push('/ozel-branslar')} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 18, color: '#3b2e24', padding: 0,
        }}>
          {OZEL_BRANS_KATEGORI}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button type="button" onClick={() => router.push('/asistan/ozel-branslar')} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, color: '#8b7d70',
          }}>
            Uzmanlar
          </button>
          <a href="/dashboard/notya-klinik" style={{ fontSize: 13, color: '#2f4334', fontWeight: 600, textDecoration: 'none' }}>
            {NOTYA_KLINIK_AD}
          </a>
          <button type="button" onClick={logout} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, color: '#2f4334', letterSpacing: '0.05em',
          }}>
            Çıkış
          </button>
        </div>
      </nav>
    </>
  )
}
