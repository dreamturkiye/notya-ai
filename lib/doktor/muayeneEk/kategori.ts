/**
 * MUAYENE-EKLERI-01 — ek türü → belge kasası kategorisi (lib/doktor/belgeTur.ts + belgeTurleri.ts ile aynı yazımlar).
 * Branş kapısı korunur: "Yenidoğan Taburculuk Epikrizi" yalnız izinli branşta (belgeTuruIzinliMi).
 */
import { belgeTuruIzinliMi, YENIDOGAN_TABURCULUK_EPIKRIZI } from '@/lib/doktor/belgeTurleri'
import { belgeYenidoganTaburcuEpikriziMi } from '@/lib/doktor/belgeTur'
import { EK_TUR_KASA_KATEGORISI, type EkTuru } from './tipler'

export function kasaKategorisi(tur: EkTuru, g: { dosyaAdi?: string | null; fileType?: string | null; brans?: string | null }): string {
  if (tur === 'epikriz' && belgeYenidoganTaburcuEpikriziMi({ fileName: g.dosyaAdi, category: null }) && belgeTuruIzinliMi(YENIDOGAN_TABURCULUK_EPIKRIZI, g.brans)) {
    return YENIDOGAN_TABURCULUK_EPIKRIZI
  }
  // Rapor PDF'i "Görüntüleme Raporu", film/fotoğraf "Röntgen".
  if (tur === 'rontgen' && g.fileType === 'application/pdf') return 'Görüntüleme Raporu'
  return EK_TUR_KASA_KATEGORISI[tur]
}

/** Onaydan sonra görüntü bölümüne (goruntu_calisma) yönlenen kasa kategorileri → tip. */
export function goruntuTipi(kategori: string | null | undefined): 'xr' | 'ekg' | null {
  if (kategori === 'Röntgen') return 'xr'
  if (kategori === 'EKG') return 'ekg'
  return null
}
