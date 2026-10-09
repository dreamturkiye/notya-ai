/**
 * NOTYA-ULKE-SABLON-01 — Uzbekistan: what the pack brings for the country kit's shared screens. CONTENT ONLY.
 * Reached only through countries/active/arayuz, read through lib/ulke/arayuz.
 *
 * Nothing is written here: each entry points at the file of this folder that holds it.
 *   catalogues, three forms           ./uygulama/metinler.ts, ./uygulama/randevuMetinleri.ts, ./uygulama/portalMetinleri.ts,
 *                                     ./uygulama/formMetinleri.ts (the intake form's screens; its QUESTIONS are in ./klinik/hastaFormu/)
 *                                     ./uygulama/mesajMetinleri.ts (messages between a doctor and a patient)
 *                                     ./uygulama/sablonMetinleri.ts ("my templates"; the pack brings no template of its own)
 *   roles (40) and their names        ./klinik/rolAdlari.ts
 *   assistant names (owner's list)    ./klinik/asistanAdlari.ts, titles in ./klinik/asistanUnvanlari.ts, the forms a screen
 *                                     shows in ./klinik/asistanKimligi.ts
 *   note templates                    ./klinik/notSablonlari.ts
 *   tools: which, for whom, in which words  ./uygulama/araclar/ (the tools themselves are the kit's: lib/ulke/araclar/)
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
import { UZ_FORM_METINLERI } from './uygulama/formMetinleri'
import { UZ_MESAJ_METINLERI } from './uygulama/mesajMetinleri'
import { UZ_SABLON_METINLERI } from './uygulama/sablonMetinleri'
import { UZ_ARACLAR } from './uygulama/araclar'

export const UZ_ARAYUZ: UlkeArayuzu = {
  marka: 'Notya',
  metinler: UZ_UYGULAMA_METINLERI,
  randevuMetinleri: UZ_RANDEVU_METINLERI,
  portalMetinleri: UZ_PORTAL_METINLERI,
  formMetinleri: UZ_FORM_METINLERI,
  mesajMetinleri: UZ_MESAJ_METINLERI,
  sablonMetinleri: UZ_SABLON_METINLERI,
  araclar: UZ_ARACLAR,
  roller: UZ_ROL_TANIMLARI,
  asistan: uzAsistanKimligi,
  notSablonlari: UZ_NOT_SABLONLARI,
  acilis: UZ_ACILIS,
}
