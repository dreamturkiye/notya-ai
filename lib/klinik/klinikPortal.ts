/**
 * Klinik Sağlığım — aynı kabuk (PIN, mesajlar, ziyaretler, sonuçlar, ilaçlar, öykü),
 * dala özel tek extra nav. Doktor TUS chapter’ına girmez.
 */
import type { PortalModulId, PortalNavOge } from '@/lib/specialties/profile'
import { KLINIK_YENI_SLUGS, klinikSlugCoz, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'

export type KlinikPortalModulId =
  | 'sacim'
  | 'estetik-ameliyatim'
  | 'estetik-bakimim'
  | 'klinik-derim'
  | 'longevitim'
  | 'fizyom'
  | 'seanslarim'
  | 'beslenmem'
  | 'ergom'
  | 'isitmem-odyoloji'

export const KLINIK_PORTAL_MODUL: Record<KlinikYeniSlug, KlinikPortalModulId> = {
  'sac-ekimi': 'sacim',
  'estetik-cerrahi': 'estetik-ameliyatim',
  'medikal-estetik': 'estetik-bakimim',
  'klinik-dermatoloji': 'klinik-derim',
  longevity: 'longevitim',
  fizyoterapi: 'fizyom',
  'klinik-psikolog': 'seanslarim',
  diyetisyen: 'beslenmem',
  ergoterapi: 'ergom',
  odyoloji: 'isitmem-odyoloji',
}

export const KLINIK_PORTAL_NAV: Record<KlinikPortalModulId, PortalNavOge> = {
  sacim: { key: 'sacim', label: 'Saçım', path: '/sacim' },
  'estetik-ameliyatim': { key: 'estetik-ameliyatim', label: 'Ameliyat bakımım', path: '/estetik-ameliyatim' },
  'estetik-bakimim': { key: 'estetik-bakimim', label: 'Bakımım', path: '/estetik-bakimim' },
  'klinik-derim': { key: 'klinik-derim', label: 'Bakımım', path: '/klinik-derim' },
  longevitim: { key: 'longevitim', label: 'Planım', path: '/longevitim' },
  fizyom: { key: 'fizyom', label: 'Egzersizim', path: '/fizyom' },
  seanslarim: { key: 'seanslarim', label: 'Görüşmelerim', path: '/seanslarim' },
  beslenmem: { key: 'beslenmem', label: 'Beslenmem', path: '/beslenmem' },
  ergom: { key: 'ergom', label: 'Günlük programım', path: '/ergom' },
  'isitmem-odyoloji': { key: 'isitmem-odyoloji', label: 'İşitme takibim', path: '/isitmem-odyoloji' },
}

export const KLINIK_PORTAL_IPUCU: Record<KlinikPortalModulId, string> = {
  sacim: 'Yıkama ve kontrol tarihleriniz',
  'estetik-ameliyatim': 'Pansuman ve kontrol tarihleriniz',
  'estetik-bakimim': 'İşlem sonrası bakım tarihleriniz',
  'klinik-derim': 'Seans ve bakım tarihleriniz',
  longevitim: 'Sonraki seans tarihiniz',
  fizyom: 'Seans ve ev programı tarihleriniz',
  seanslarim: 'Sonraki görüşme tarihiniz',
  beslenmem: 'Kontrol tarihiniz',
  ergom: 'Seans ve günlük programınız',
  'isitmem-odyoloji': 'Kontrol tarihiniz',
}

export function klinikPortalModulu(uzmanlik: string | null | undefined): KlinikPortalModulId | null {
  const dal = klinikSlugCoz(uzmanlik)
  return dal ? KLINIK_PORTAL_MODUL[dal] : null
}

export function klinikPortalNav(id: PortalModulId): PortalNavOge | null {
  return id in KLINIK_PORTAL_NAV ? KLINIK_PORTAL_NAV[id as KlinikPortalModulId] : null
}

export function klinikPortalDallariTam(): boolean {
  return KLINIK_YENI_SLUGS.every((d) => !!KLINIK_PORTAL_NAV[KLINIK_PORTAL_MODUL[d]])
}
