'use client'

import { PortalKabukGorunumu } from '@/components/doktor/portal/PortalKabukGorunumu'
import { usePathname } from 'next/navigation'
import type { PortalNavOge } from '@/lib/portal/types'
import { portalNavSirasi } from '@/lib/portal/navSirasi'

/**
 * Core nav — identical for every specialty; chapter extras come from the registry (bundle.portal.nav).
 * PORTAL-TABAN-ONCE (Kaan, 2026-11-25): base tabs first (Randevu right after the home when booking is open), chapter
 * modules, then the daily-health-home pages — the order lives in lib/portal/navSirasi.ts.
 */
export function PortalShell({
  basePath,
  ekNav = [],
  randevuAcik = false,
  hastaAdi = null,
  children,
}: {
  basePath: string
  /** PORTAL-HASTA-ADI — unlocked bundle's patient name; null/empty → nothing rendered. */
  hastaAdi?: string | null
  /** SAGLIGIM-PORTAL-REGISTRY — attached specialty modules' nav (e.g. Gözlerim), never hardcoded per branş */
  ekNav?: PortalNavOge[]
  /** NOTYA-RANDEVU-V2 — the doctor's 'Hasta Portalı Randevu' is ON: Randevu sits right after the home. */
  randevuAcik?: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname() || ''
  const nav = portalNavSirasi({ randevuAcik, moduller: ekNav }).map((item) => {
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
