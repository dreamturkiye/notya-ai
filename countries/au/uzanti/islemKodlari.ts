/**
 * AU-QUICK-02 — the procedure-code screen's words (Australia). English only.
 * Source: IHACPA's free "Medicare Benefits Schedule map to ACHI" table. ACHI procedure DESCRIPTIONS are licensed and are
 * never read or shown; only the MBS item (with the Medicare item text) and the mapped ACHI CODES are.
 */
import type { IslemKodlariTanimi } from '@/lib/ulke/uzanti/tipler'

export const AU_ISLEM_KAYNAK_ETIKETI = 'Medicare Benefits Schedule (MBS) item to ACHI stem code map, Twelfth Edition, published free by IHACPA. Stem codes only; not the licensed ACHI code set.'

export const AU_ISLEM_KODLARI_TANIMI: IslemKodlariTanimi = {
  metin: {
    baslik: 'Procedure codes',
    aciklama: 'Look up the ACHI stem code for an MBS item number, or the MBS items behind an ACHI stem code.',
    arac: 'Tools',
    araEtiketi: 'Search by MBS item or ACHI stem code',
    araOrnek: 'An MBS item number or an ACHI stem code',
    ara: 'Search',
    araniyor: 'Searching…',
    sonucSayisi: '{n} results',
    sonucYok: 'No procedure matches that search.',
    veriYok: 'The procedure table is not loaded on this server yet, so there is nothing to search.',
    kaynakEtiketi: AU_ISLEM_KAYNAK_ETIKETI,
    mbsEtiketi: 'MBS item',
    achiEtiketi: 'ACHI stem code',
    esleme_yok: 'No ACHI mapping',
    surum: 'Edition {surum}',
    hata: 'The search could not be completed. Try again.',
  },
}
