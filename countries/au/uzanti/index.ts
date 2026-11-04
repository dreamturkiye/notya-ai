/** AU-BETA-01 — Australia's pack extensions (lib/ulke/uzanti/tipler.ts). */
import type { UlkeUzantisi } from '@/lib/ulke/uzanti/tipler'
import { AU_FATURA } from './fatura'
import { AU_GIZLILIK } from './gizlilik'
import { AU_KAYIT_SISTEMI, AU_REFERANS_ARAMALARI, AU_REFERANS_BOLUMLERI } from './referans'
import { AU_TANI_KODLARI_TANIMI } from './taniKodlari'
import { AU_ISLEM_KODLARI_TANIMI } from './islemKodlari'
import { AU_MUAYENEHANE } from './muayenehane'
import { AU_DATA_BREACH } from './veriIhlali'
import { AU_ALT_ISLEYEN_BELGESI, AU_DPA_BELGESI, AU_VERI_SAKLAMA } from './politikalar'

export const AU_EK_NOT = 'Initial Australian compliance and clinical content based on public guidelines. External clinician and legal review planned after first customers.'

export const AU_UZANTI: UlkeUzantisi = {
  ekNot: AU_EK_NOT,
  // AU-POLITIKA-01 (2026-11-03): + data storage and retention, sub-processors, data processing agreement.
  belgeler: { 'data-breach': AU_DATA_BREACH, 'data-storage': AU_VERI_SAKLAMA, 'sub-processors': AU_ALT_ISLEYEN_BELGESI, 'data-processing-agreement': AU_DPA_BELGESI },
  muayenehane: AU_MUAYENEHANE,
  gizlilik: AU_GIZLILIK,
  fatura: AU_FATURA,
  referansAramalari: AU_REFERANS_ARAMALARI,
  referansBolumleri: AU_REFERANS_BOLUMLERI,
  kayitSistemi: AU_KAYIT_SISTEMI,
  taniKodlari: AU_TANI_KODLARI_TANIMI,
  islemKodlari: AU_ISLEM_KODLARI_TANIMI,
}
