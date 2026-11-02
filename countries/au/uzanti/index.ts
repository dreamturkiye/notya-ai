/** AU-BETA-01 — Australia's pack extensions (lib/ulke/uzanti/tipler.ts). */
import type { UlkeUzantisi } from '@/lib/ulke/uzanti/tipler'
import { AU_FATURA } from './fatura'
import { AU_GIZLILIK } from './gizlilik'
import { AU_KAYIT_SISTEMI, AU_REFERANS_ARAMALARI, AU_REFERANS_BOLUMLERI } from './referans'
import { AU_TANI_KODLARI_TANIMI } from './taniKodlari'
import { AU_ISLEM_KODLARI_TANIMI } from './islemKodlari'
import { AU_MUAYENEHANE } from './muayenehane'
import { AU_MBS_ONERI, AU_MEKTUP, AU_PMS_ENTEGRASYON, AU_TELEHEALTH_IPUCU } from './mektup'
import { AU_DATA_BREACH } from './veriIhlali'

export const AU_EK_NOT = 'Initial Australian compliance and clinical content based on public guidelines. External clinician and legal review planned after first customers.'

export const AU_UZANTI: UlkeUzantisi = {
  ekNot: AU_EK_NOT,
  belgeler: { 'data-breach': AU_DATA_BREACH },
  muayenehane: AU_MUAYENEHANE,
  gizlilik: AU_GIZLILIK,
  fatura: AU_FATURA,
  referansAramalari: AU_REFERANS_ARAMALARI,
  referansBolumleri: AU_REFERANS_BOLUMLERI,
  kayitSistemi: AU_KAYIT_SISTEMI,
  taniKodlari: AU_TANI_KODLARI_TANIMI,
  islemKodlari: AU_ISLEM_KODLARI_TANIMI,
  // AU-GAP-CLOSE-01 — competitive gap close: letters, MBS suggest, honest PMS export/roadmap.
  mektup: AU_MEKTUP,
  mbsOneri: AU_MBS_ONERI,
  pmsEntegrasyon: AU_PMS_ENTEGRASYON,
  telehealthIpucu: AU_TELEHEALTH_IPUCU,
}
