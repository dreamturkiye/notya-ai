/**
 * AU-QUICK-02 — the procedure-code screen's words (Australia). English only.
 * Source: IHACPA's free "Medicare Benefits Schedule map to ACHI" table. ACHI procedure DESCRIPTIONS are licensed and are
 * never read or shown; only the MBS item (with the Medicare item text) and the mapped ACHI CODES are.
 */
import type { IslemKodlariTanimi } from '@/lib/ulke/uzanti/tipler'

export const AU_ISLEM_KAYNAK_ETIKETI = 'Medicare Benefits Schedule (MBS) item to ACHI code map, published free by IHACPA. ACHI codes only; not the licensed ACHI code set.'

export const AU_ISLEM_KODLARI_TANIMI: IslemKodlariTanimi = {
  metin: {
    baslik: 'Procedure codes',
    aciklama: 'Look up a procedure by MBS item number, ACHI code or words.',
    arac: 'Tools',
    araEtiketi: 'Search by item, code or words',
    araOrnek: 'An MBS item, an ACHI code or words',
    ara: 'Search',
    araniyor: 'Searching…',
    sonucSayisi: '{n} results',
    sonucYok: 'No procedure matches that search.',
    veriYok: 'The procedure table is not loaded on this server yet, so there is nothing to search.',
    kaynakEtiketi: AU_ISLEM_KAYNAK_ETIKETI,
    mbsEtiketi: 'MBS item',
    achiEtiketi: 'ACHI',
    esleme_yok: 'No ACHI mapping',
    surum: 'Edition {surum}',
    hata: 'The search could not be completed. Try again.',
  },
}
