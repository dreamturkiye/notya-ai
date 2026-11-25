/**
 * PORTAL-TABAN-ONCE (Kaan, 2026-11-25) — the order of the Sağlığım section tabs, in one place (core, all 30 branşlar +
 * 10 Özel Branşlar).
 *
 * "I want all the functionality of the old hasta portalı … and build the new stuff over and above the base
 * functionality." The pre-Sağlığım portal is the BASE: its tabs come first, in their old order; Randevu (only while the
 * doctor's 'Hasta Portalı Randevu' is ON) sits right after the home so a phone shows it without scrolling the strip;
 * the branş chapter modules (registry, bundle.portal.nav) follow; the daily-health-home pages added on 2026-11-24
 * (Günlük, Doz Takvimi, Karne) come LAST — added on top, never in place of or ahead of a base tab.
 *
 * Pinned by lib/portal/tabanOnce.test.ts. A change that moves a base tab later needs Kaan's explicit OK
 * (.cursor/skills/specialty-hasta-portali/SKILL.md § Taban önce).
 */
import type { PortalNavOge } from '@/lib/specialties/profile'

/** The home. Label "Bugün" since HASTA-PORTALI-GUNLUK; the key stays 'ozet'. */
export const ANA_NAV: PortalNavOge = { key: 'ozet', label: 'Bugün', path: '' }

/** NOTYA-RANDEVU-V2: joins the nav only while the doctor's 'Hasta Portalı Randevu' is ON. */
export const RANDEVU_NAV: PortalNavOge = { key: 'randevu', label: 'Randevu', path: '/randevu' }

/** The base record tabs, in the baseline (9163a02a) order. */
export const TABAN_NAV: readonly PortalNavOge[] = [
  { key: 'mesajlar', label: 'Mesajlar', path: '/mesajlar' },
  { key: 'ziyaretler', label: 'Ziyaretler', path: '/ziyaretler' },
  { key: 'sonuclar', label: 'Sonuçlar', path: '/sonuclar' },
  { key: 'ilaclar', label: 'İlaçlar', path: '/ilaclar' },
  { key: 'gecmis', label: 'Öykü', path: '/gecmis' },
  { key: 'takip', label: 'Takip', path: '/takip' },
]

/** HASTA-PORTALI-GUNLUK pages — new, so after every base tab and every chapter module. */
export const SAGLIK_EVI_NAV: readonly PortalNavOge[] = [
  { key: 'gunluk', label: 'Günlük', path: '/gunluk' },
  { key: 'doz-takvimi', label: 'Doz Takvimi', path: '/doz-takvimi' },
  { key: 'karne', label: 'Karne', path: '/karne' },
]

/** Bugün · Randevu (when open) · Mesajlar · Ziyaretler · Sonuçlar · İlaçlar · Öykü · Takip · chapter modules · Günlük · Doz Takvimi · Karne. */
export function portalNavSirasi({ randevuAcik = false, moduller = [] }: { randevuAcik?: boolean; moduller?: readonly PortalNavOge[] } = {}): PortalNavOge[] {
  const sabit = new Set([ANA_NAV, RANDEVU_NAV, ...TABAN_NAV, ...SAGLIK_EVI_NAV].map((n) => n.key))
  return [
    ANA_NAV,
    ...(randevuAcik ? [RANDEVU_NAV] : []),
    ...TABAN_NAV,
    // A registry module never duplicates a fixed tab.
    ...moduller.filter((m) => !sabit.has(m.key)),
    ...SAGLIK_EVI_NAV,
  ]
}
