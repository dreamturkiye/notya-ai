'use client'

import { PortalKabukGorunumu } from '@/components/doktor/portal/PortalKabukGorunumu'
import { usePathname } from 'next/navigation'
import type { PortalNavKey, PortalNavOge } from '@/lib/portal/types'

/** Core nav — identical for every specialty. Chapter extras come from the registry (bundle.portal.nav). */
const NAV: Array<{ key: PortalNavKey; label: string; path: string }> = [
  { key: 'ozet', label: 'Özet', path: '' },
  { key: 'mesajlar', label: 'Mesajlar', path: '/mesajlar' },
  { key: 'ziyaretler', label: 'Ziyaretler', path: '/ziyaretler' },
  { key: 'sonuclar', label: 'Sonuçlar', path: '/sonuclar' },
  { key: 'ilaclar', label: 'İlaçlar', path: '/ilaclar' },
  { key: 'gecmis', label: 'Öykü', path: '/gecmis' },
  { key: 'takip', label: 'Takip', path: '/takip' },
]

export function PortalShell({
  basePath,
  ekNav = [],
  hastaAdi = null,
  children,
}: {
  basePath: string
  /** PORTAL-HASTA-ADI — unlocked bundle's patient name; null/empty → nothing rendered. */
  hastaAdi?: string | null
  /** SAGLIGIM-PORTAL-REGISTRY — attached specialty modules' nav (e.g. Gözlerim), never hardcoded per branş */
  ekNav?: PortalNavOge[]
  children: React.ReactNode
}) {
  const pathname = usePathname() || ''
  const nav = [...NAV, ...ekNav].map((item) => {
    const href = `${basePath}${item.path}`
    const active =
      item.path === ''
        ? pathname === basePath || pathname === `${basePath}/`
        : pathname === href || pathname.startsWith(`${href}/`)
    return { key: item.key, label: item.label, href, aktif: active }
  })

  return (
    <PortalKabukGorunumu
      marka="Notya"
      urun="Sağlığım"
      anaHref={basePath}
      hastaAdi={hastaAdi}
      hastaAlani="Hasta alanı"
      navEtiketi="Sağlığım bölümleri"
      nav={nav}
      altBilgi={
        <>
        <p style={{ margin: '0 0 10px' }}>
          Notya · Sağlığım — acil durumda 112&apos;yi veya muayenehaneyi arayın. Portal mesajları acil değildir.
        </p>
        <p style={{ margin: '0 0 10px', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          Kişisel sağlık verileriniz 6698 sayılı KVKK kapsamında işlenir. Verileriniz, tedavi ve
          iletişim süreçleri için doktorunuz ile aynı muayenehanedeki yetkili personel
          (sekreter / asistan / hemşire) arasında, yalnızca görevleri gereği ve KVKK sınırları
          içinde paylaşılabilir; gerekli hallerde sizinle ilgili diğer hekimlere de aktarılabilir.
          Detay:{' '}
          <a href="/kvkk">KVKK Aydınlatma Metni</a> ·{' '}
          <a href="/gizlilik">Gizlilik Politikası</a> ·{' '}
          <a href="/klinik-karar-destegi">Yapay Zekâ Açıklaması</a>.
        </p>
        <p style={{ margin: 0, opacity: 0.85 }}>Bu bağlantı size özeldir; başkalarıyla paylaşmayın.</p>
        </>
      }
    >
      {children}
    </PortalKabukGorunumu>
  )
}
