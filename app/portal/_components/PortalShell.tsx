'use client'

import { PortalKabukGorunumu } from '@/components/doktor/portal/PortalKabukGorunumu'
import { usePathname } from 'next/navigation'
import type { PortalNavOge } from '@/lib/portal/types'
import { portalNavSirasi } from '@/lib/portal/navSirasi'
import { portalZemini } from '@/lib/portal/zemin'
import { BILINMEYEN_MARKA, BOLUM_ADI, type PortalMarka } from '@/lib/portal/marka'
import { MarkaBasligi, NotyaAltyapi } from '@/components/doktor/portal/HekimMarkasi'

/**
 * Core nav — identical for every specialty; chapter extras come from the registry (bundle.portal.nav).
 * PORTAL-TABAN-ONCE (Kaan, 2026-11-25): base tabs first (Randevu right after the home when booking is open), chapter
 * modules, then the daily-health-home pages — the order lives in lib/portal/navSirasi.ts.
 * HASTA-ALANI-MARKA (Kaan, 2026-11-25): the header is the DOCTOR's (logo → photo → monogram, name, "Sağlığım"); Notya
 * only as the small "Notya altyapısıyla" line at the end of the footer. `marka` comes from the server (token layout).
 */
export function PortalShell({
  basePath,
  ekNav = [],
  randevuAcik = false,
  hastaAdi = null,
  onSekizAlti = false,
  marka = null,
  children,
}: {
  /** HASTA-ALANI-MARKA — the resolved doctor / Notya Klinik brand; null → the neutral brand (still no Notya header). */
  marka?: PortalMarka | null
  basePath: string
  /** PORTAL-HASTA-ADI — unlocked bundle's patient name; null/empty → nothing rendered. */
  hastaAdi?: string | null
  /** SAGLIGIM-PORTAL-REGISTRY — attached specialty modules' nav (e.g. Gözlerim), never hardcoded per branş */
  ekNav?: PortalNavOge[]
  /** NOTYA-RANDEVU-V2 — the doctor's 'Hasta Portalı Randevu' is ON: Randevu sits right after the home. */
  randevuAcik?: boolean
  /** SAGLIGIM-ZEMIN — the bundle's under-18 flag: a child photo is only ever drawn for a child on a pediatric page. */
  onSekizAlti?: boolean
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
      marka={(marka || BILINMEYEN_MARKA).ad}
      urun={BOLUM_ADI}
      markaBasligi={<MarkaBasligi marka={marka || BILINMEYEN_MARKA} />}
      anaHref={basePath}
      hastaAdi={hastaAdi}
      hastaAlani="Hasta alanı"
      navEtiketi="Sağlığım bölümleri"
      nav={nav}
      zemin={portalZemini(nav.find((o) => o.aktif)?.key, { onSekizAlti })}
      altBilgi={
        <>
        <p style={{ margin: '0 0 10px' }}>
          Acil durumda 112&apos;yi veya muayenehaneyi arayın. Sağlığım mesajları acil değildir.
        </p>
        <p style={{ margin: '0 0 10px', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          Kişisel sağlık verileriniz 6698 sayılı KVKK kapsamında işlenir. Verileriniz, tedavi ve
          iletişim süreçleri için doktorunuz ile aynı muayenehanedeki yetkili personel
          (sekreter / asistan / hemşire) arasında, yalnızca görevleri gereği ve KVKK sınırları
          içinde paylaşılabilir; gerekli hallerde sizinle ilgili diğer hekimlere de aktarılabilir.
          Bu verilerin veri sorumlusu doktorunuz (ya da kliniğiniz), Notya ise bu alanın teknik altyapısını sağlayan veri
          işleyendir. Detay:{' '}
          <a href="/kvkk">KVKK Aydınlatma Metni</a> ·{' '}
          <a href="/gizlilik">Gizlilik Politikası</a> ·{' '}
          <a href="/klinik-karar-destegi">Yapay Zekâ Açıklaması</a>.
        </p>
        <p style={{ margin: 0, opacity: 0.85 }}>Bu bağlantı size özeldir; başkalarıyla paylaşmayın.</p>
        <NotyaAltyapi />
        </>
      }
    >
      {children}
    </PortalKabukGorunumu>
  )
}
