/**
 * AU-QUICK-01 — the diagnosis-code screen's words (Australia). English only.
 * The source label below is exact (Kaan, 2026-10-25) and is printed on the screen whenever codes are shown.
 */
import type { TaniKodlariTanimi } from '@/lib/ulke/uzanti/tipler'

export const AU_TANI_KAYNAK_ETIKETI = 'WHO ICD-10 + open ICD-10 to ICD-10-AM mapping (Digital Health Implementer Hub / IHACPA). Not the full licensed ICD-10-AM code set.'

export const AU_TANI_KODLARI_TANIMI: TaniKodlariTanimi = {
  // 'acik' = the open WHO list + open mapping files. 'lisansli' = the licensed ICD-10-AM Electronic Code Lists (seam: lib/ulke/kayit/taniKaynagi.ts).
  saglayici: 'acik',
  metin: {
    baslik: 'Diagnosis codes',
    aciklama: 'Look up a diagnosis by ICD-10 code, by ICD-10-AM code or by words.',
    arac: 'Tools',
    araEtiketi: 'Search by code or words',
    araOrnek: 'A code or words',
    ara: 'Search',
    araniyor: 'Searching…',
    sonucSayisi: '{n} results',
    sonucYok: 'No code matches that search.',
    veriYok: 'The code list is not loaded on this server yet, so there is nothing to search.',
    kaynakEtiketi: AU_TANI_KAYNAK_ETIKETI,
    esleme_yok: 'No Australian mapping',
    whoKodu: 'WHO ICD-10',
    esleme_etiketi: 'ICD-10-AM',
    surum: 'Edition {surum}',
    hata: 'The search could not be completed. Try again.',
  },
}
