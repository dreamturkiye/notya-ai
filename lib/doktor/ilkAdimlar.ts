/**
 * YENI-DOKTOR-UX-2026-10 — İlk adımlar (first-run checklist) karar mantığı.
 *
 * Yeni bir doktor hesabı Ana Sayfa'da kurulum listesini görür: profil/branş, ilk hasta,
 * ilk randevu, ilk muayene, fiyat kataloğu, iletişim ayarları — her satır doğrudan ilgili
 * ekrana götürür. Kart kapatılabilir; her şey tamamlanınca ya da hesap yeni olmaktan
 * çıkınca kendiliğinden kaybolur. Veri /api/doktor/ilk-adimlar'dan tek istekle gelir.
 *
 * Saf fonksiyonlar burada — rota ve kart bileşeni bunları paylaşır, testler bunları sınar.
 */

export type IlkAdimAnahtari = 'profil' | 'hasta' | 'randevu' | 'muayene' | 'katalog' | 'iletisim'

export type IlkAdimlar = Record<IlkAdimAnahtari, boolean>

export interface IlkAdimSatiri {
  anahtar: IlkAdimAnahtari
  etiket: string
  aciklama: string
  href: string
}

/** Sıra = yeni doktorun doğal kurulum sırası. Her satır İLGİLİ ekrana doğrudan gider. */
export const ILK_ADIM_SATIRLARI: readonly IlkAdimSatiri[] = [
  {
    anahtar: 'profil',
    etiket: 'Profil ve branş',
    aciklama: 'Adınız ve uzmanlık alanınız kayıtlı',
    href: '/dashboard/doktor/hesap',
  },
  {
    anahtar: 'hasta',
    etiket: 'İlk hastanızı ekleyin',
    aciklama: 'Dosyası, muayeneleri ve belgeleri tek yerde toplanır',
    href: '/dashboard/doktor/hasta-ekle',
  },
  {
    anahtar: 'randevu',
    etiket: 'İlk randevuyu oluşturun',
    aciklama: 'Takvimden “+ Randevu” ile',
    href: '/dashboard/doktor/randevular',
  },
  {
    anahtar: 'muayene',
    etiket: 'İlk muayeneyi yapın',
    aciklama: 'Hasta dosyasındaki “Muayeneyi Başlat” ile',
    href: '/dashboard/doktor/hastalar',
  },
  {
    anahtar: 'katalog',
    etiket: 'Fiyat kataloğunuzu tanımlayın',
    aciklama: 'Faturalama için hizmet ve fiyat listesi (isteğe bağlı)',
    href: '/dashboard/doktor/entegrasyonlar/faturalama?tab=katalog',
  },
  {
    anahtar: 'iletisim',
    etiket: 'İletişim ayarlarını yapın',
    aciklama: 'Hasta mesajları için WhatsApp / e-posta (isteğe bağlı)',
    href: '/dashboard/doktor/ayarlar/iletisim',
  },
] as const

/** localStorage: kart "Gizle" ile kapatıldı (cihaz başına — zararsız, kart yalnız kolaylık). */
export const ILK_ADIM_GIZLE_ANAHTAR = 'notya_ilk_adimlar_gizli'

export function tumuTamam(adimlar: IlkAdimlar): boolean {
  return ILK_ADIM_SATIRLARI.every((s) => adimlar[s.anahtar])
}

/**
 * "Yeni hesap" eşiği: 3'ten az onaylı/taslak muayene notu. Mevcut beta doktorları (onlarca not)
 * bu kartı HİÇ görmez — kart kurulum dönemine aittir, çalışan muayenehaneye değil.
 */
export function yeniHesapMi(notSayisi: number): boolean {
  return Number.isFinite(notSayisi) && notSayisi < 3
}

/** Kart yalnız: yeni hesap + veri geldi + gizlenmedi + en az bir adım eksikken görünür. */
export function kartGorunurMu(
  yeniHesap: boolean,
  adimlar: IlkAdimlar | null,
  gizlendi: boolean,
): boolean {
  if (!yeniHesap || !adimlar || gizlendi) return false
  return !tumuTamam(adimlar)
}
