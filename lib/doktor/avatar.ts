/**
 * NOTYA-AVATAR-01 — Hekimin kendi profil fotoğrafı (PHI değil, hekimin kendi görseli).
 *
 * Kaan/Dr. Gökhan (2026-09-17): karşılama ekranında "Hoş geldiniz, Dr. …" yanında küçük bir
 * yuvarlak avatar — duygusal bağ için. Fotoğraf yoksa baş harfli avatar (kırık görsel veya
 * boşluk değil; hasta dosyasındaki kimlik başlığıyla aynı görsel dil).
 *
 * KARİKATÜRLEŞTİRME YOK: bu depoda görsel üreten hiçbir sağlayıcı bağlı değil (ayrıntı için
 * docs/OPEN-COMMITMENTS.md). Hedef Boy'daki "3D cartoon" aile, public/hedef-boy/*.png altındaki
 * önceden çizilmiş dört sabit PNG'dir — üretim değil. Bu yüzden burada gerçek fotoğraf gerçek
 * fotoğraf olarak gösterilir; CSS filtresiyle "karikatür" taklidi yapılmaz.
 */

/** Kasa (lib/vault) ile aynı çizgi: yalnız yaygın görsel türleri. */
export const AVATAR_IZINLI_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const
export type AvatarMime = (typeof AVATAR_IZINLI_MIME)[number]

/**
 * Kasa 4 MB'a kadar çıkıyor ama avatar her karşılama ekranında data URL olarak taşınıyor;
 * 2 MB profil fotoğrafı için fazlasıyla yeterli ve sayfayı şişirmez.
 */
export const AVATAR_MAX_BYTES = 4 * 1024 * 1024

export class AvatarGecersizError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AvatarGecersizError'
  }
}

/** Hekimin yazdığı unvanlar baş harfe karışmasın: "Prof. Dr. Ayşe Yılmaz" → "AY", "PD" değil. */
const UNVANLAR = new Set(['dr', 'dr.', 'uzm', 'uzm.', 'doc', 'doç', 'doc.', 'doç.', 'prof', 'prof.', 'op', 'op.', 'yrd', 'yrd.'])

/**
 * Türkçe duyarlı baş harfler. `toUpperCase()` "ismail" → "ISMAIL" verir ve avatarda "I" çıkar;
 * doğrusu "İ". Bu yüzden her yerde tr-TR yerel ayarı kullanılır.
 */
export function doktorBasHarfleri(ad: string): string {
  const parcalar = (ad || '')
    .normalize('NFC')
    .split(/\s+/)
    .filter(Boolean)
    .filter((p) => !UNVANLAR.has(p.toLocaleLowerCase('tr-TR')))

  const harfler = parcalar
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toLocaleUpperCase('tr-TR')

  return harfler || 'D'
}

export function avatarMimeGecerliMi(mime: string): mime is AvatarMime {
  return (AVATAR_IZINLI_MIME as readonly string[]).includes(mime)
}

/** Yükleme kapısı — rota ve QA betiği aynı kuralı paylaşsın diye tek yerde. */
export function avatarDogrula(mime: string, boyut: number): void {
  if (!avatarMimeGecerliMi(mime)) {
    throw new AvatarGecersizError('Desteklenen türler: JPEG, PNG, WebP')
  }
  if (!Number.isFinite(boyut) || boyut <= 0) {
    throw new AvatarGecersizError('Dosya boş olamaz')
  }
  if (boyut > AVATAR_MAX_BYTES) {
    throw new AvatarGecersizError('Fotoğraf 2 MB sınırını aşıyor')
  }
}

/** `<img src>` için taşınabilir biçim — imzalı URL altyapısı gerektirmez. */
export function avatarDataUrl(mime: string, base64: string): string {
  return `data:${mime};base64,${base64}`
}
