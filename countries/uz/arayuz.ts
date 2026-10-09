/**
 * NOTYA-ULKE-SABLON-01 — Uzbekistan: what the pack brings for the country kit's shared screens. CONTENT ONLY.
 * Reached only through countries/active/arayuz, read through lib/ulke/arayuz.
 *
 * Nothing is written here: each entry points at the file of this folder that holds it.
 *   catalogues, three forms           ./uygulama/metinler.ts, ./uygulama/randevuMetinleri.ts, ./uygulama/portalMetinleri.ts
 *   roles (40) and their names        ./klinik/rolAdlari.ts
 *   assistant names (owner's list)    ./klinik/asistanAdlari.ts, titles in ./klinik/asistanUnvanlari.ts, the forms a screen
 *                                     shows in ./klinik/asistanKimligi.ts
 *   note templates                    ./klinik/notSablonlari.ts
 *   landing page copy, three forms    ./acilis/icerik.ts; what its plans cost: ./acilis/fiyatlar.ts
 */
import type { UlkeArayuzu } from '@/lib/ulke/arayuz/tipler'
import { UZ_ACILIS } from './acilis/icerik'
import { uzAsistanKimligi } from './klinik/asistanKimligi'
import { UZ_NOT_SABLONLARI } from './klinik/notSablonlari'
import { UZ_ROL_TANIMLARI } from './klinik/rolAdlari'
import { UZ_UYGULAMA_METINLERI } from './uygulama/metinler'
import { UZ_RANDEVU_METINLERI } from './uygulama/randevuMetinleri'
import { UZ_PORTAL_METINLERI } from './uygulama/portalMetinleri'

export const UZ_ARAYUZ: UlkeArayuzu = {
  marka: 'Notya',
  metinler: UZ_UYGULAMA_METINLERI,
  randevuMetinleri: UZ_RANDEVU_METINLERI,
  portalMetinleri: UZ_PORTAL_METINLERI,
  roller: UZ_ROL_TANIMLARI,
  asistan: uzAsistanKimligi,
  notSablonlari: UZ_NOT_SABLONLARI,
  acilis: UZ_ACILIS,
}
