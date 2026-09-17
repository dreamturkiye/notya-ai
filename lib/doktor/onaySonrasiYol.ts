/**
 * NOTYA-ONAY-DONUS-01 (Gökhan, 2026-09-17, canlı): "Muayene notunda düzeltme yapıp Onayla'ya
 * bastım; İnceleme Kuyruğu'nda 'Bekleyen not yok' yazan boş bir sayfada kaldım, hasta dosyasına
 * dönemedim." Onayladığı not gözünün önünden kayboluyordu — beklentisi, onaydan sonra notun
 * kesinleşmiş halini görmek ve gerekirse oradan yeniden düzeltmekti.
 *
 * Sebep: onay sonrası hedefi hesaplayan tek bir yer yoktu. Her onay noktası kendi kararını
 * veriyordu — İnceleme Kuyruğu listeden siliyordu (hiçbir yere gitmeden), seans ekranı genel
 * panoya atıyordu. Bu dosya o kararın tek kaynağı.
 *
 * Kural: onaydan sonra hekim, notun KESİNLEŞMİŞ görünümüne gider — hasta dosyasındaki
 * "Muayene Geçmişi"nden o nota tıklandığında açılan sayfanın ta kendisi. Tek istisna:
 * hekim kuyrukta sıra işliyorsa ve HÂLÂ bekleyen not varsa kuyrukta kalır.
 */
import { muayeneFormuYolu } from './muayeneFormuYolu'

export const INCELEME_KUYRUGU_YOLU = '/dashboard/doktor/inceleme'
export const HASTA_LISTESI_YOLU = '/dashboard/doktor/hastalar'
export const DOKTOR_ANA_SAYFA_YOLU = '/dashboard/doktor'

/** Onay kutularında kullanılan ortak bağlantı metinleri — tek kaynakta. */
export const ONAYLANAN_NOTU_AC = 'Onaylanan notu aç →'
export const HASTA_LISTESINE_DON = 'Hasta Listesi →'
export const ANA_SAYFAYA_DON = 'Ana Sayfa →'

/**
 * Onaylanmış notun kesinleşmiş (yazdır / PDF) görünümü.
 * Hasta dosyasındaki "Muayene Geçmişi"nden açılan sayfayla AYNI yol — ayrı bir "onay sonrası"
 * ekranı yaratmıyoruz; hekimin sonradan göreceği notun tam olarak kendisine götürüyoruz.
 * Oradan "✏️ Yeniden Düzenle" zaten muayene formuna, o da yeniden onaya gider.
 */
export function onaylananNotYolu(notId: string): string {
  return `${muayeneFormuYolu(notId)}/yazdir`
}

/**
 * Hasta dosyası yolu. Hasta bağlı olmayan not (seansa hasta seçilmeden üretilen not) için
 * hasta listesine düşer — ölü bağlantı ya da bağlantısız ekran üretmemek için.
 */
export function hastaDosyasiYolu(patientId?: string | null): string {
  const id = String(patientId ?? '').trim()
  return id ? `${HASTA_LISTESI_YOLU}/${encodeURIComponent(id)}` : HASTA_LISTESI_YOLU
}

/** Onaydan sonra nereye gidileceği. 'kuyrukta-kal' = sayfa değişmez, sıradaki nota devam. */
export type OnaySonrasiHedef =
  | { tur: 'not'; yol: string }
  | { tur: 'kuyrukta-kal' }

/**
 * @param notId          az önce onaylanan notun kimliği
 * @param kalanBekleyen  bu onaydan SONRA kuyrukta kalan bekleyen not sayısı
 *
 * kalanBekleyen > 0  → hekim sırayı işliyor, kuyrukta kalsın (akışını bölmeyelim).
 * kalanBekleyen == 0 → kuyruk boşaldı; "Bekleyen not yok" çıkmazı yerine kesinleşmiş nota git.
 * notId yoksa        → gidecek not yok, kuyrukta kal (boş sayfa yine de yönlendirme sunar).
 */
export function onaySonrasiHedef(notId: string, kalanBekleyen: number): OnaySonrasiHedef {
  const id = String(notId ?? '').trim()
  if (!id) return { tur: 'kuyrukta-kal' }
  if (Number.isFinite(kalanBekleyen) && kalanBekleyen > 0) return { tur: 'kuyrukta-kal' }
  return { tur: 'not', yol: onaylananNotYolu(id) }
}
