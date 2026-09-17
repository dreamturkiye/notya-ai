/**
 * NOTYA-SUPERUSER-BRANS-01 (Kaan talebi, 2026-09-17) — kendi hesabının aktif branşını
 * anında değiştirebilen İKİ kişi.
 *
 * Neden var: Kaan ve Dr. Gökhan Mamur (3000+ doğumluk Kadın Doğum uzmanı, aynı zamanda
 * Notya'nın Pediatri bölümünü aktif kullanıyor) tek hesap üzerinde Kadın Doğum ↔ Pediatri
 * arasında gidip gelmek zorunda: bir bölümü canlıda kontrol edip diğerine dönmek.
 * Bugüne kadar bunun tek yolu onboarding'i baştan çalıştırmak ya da veritabanını elle
 * düzenlemekti. Bu liste o iki kişiyi — ve YALNIZ o ikisini — o işten kurtarır.
 *
 * Bu ÖZELLİKLE iki kişiye özel bir kapıdır; çok-branşlı genel bir ürün özelliği DEĞİLDİR.
 * Onboarding'e eklenmez, hiçbir kullanıcıya duyurulmaz, listenin içeriği istemciye
 * sızdırılmaz (sunucu yalnızca "yetkili mi" sorusuna evet/hayır döner).
 *
 * Kimlikler 2026-09-17'de production `users` + `auth.users` tablosundan DOĞRULANDI
 * (tahmin edilmedi, e-posta eşleşmesiyle de yetinilmedi — kayıtlı UUID'ler):
 *   c4989e29-…  kaanari@mac.com          — Kaan Arioglu (o gün specialty=pediatri)
 *   94c4db57-…  dr.gokhanmamur@gmail.com — Dr. Gökhan Mamur (o gün specialty=pediatri)
 *
 * GÜNCELLEME (2026-09-17, Kaan onayı): Dr. Gökhan günlük olarak dr.gokhan@notya.ai
 * hesabıyla çalışıyor (son giriş bugün) — bu hesap da listeye eklendi. gmail hesabı
 * (dr.gokhanmamur@gmail.com, son giriş 2026-07-27) da listede kalıyor, ikisi de aynı
 * kişi.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'

/** Doğrulanmış kullanıcı kimlikleri. E-posta metni değil — kimlik. */
export const SUPERUSER_BRANS_IDS: readonly string[] = [
  'c4989e29-a219-45b6-bf17-18e260e3c7f9', // kaanari@mac.com — Kaan Arioglu
  '94c4db57-8b89-4880-80be-143f88f4bcc1', // dr.gokhanmamur@gmail.com — Dr. Gökhan Mamur
  '9030fe09-0a5f-484b-9cc9-3e1e1b0b5178', // dr.gokhan@notya.ai — Dr. Gökhan Mamur (günlük hesabı, Kaan onayladı 2026-09-17)
]

/**
 * Tek karar noktası. Sunucu tarafındaki API rotası bunu ÇAĞIRMAK ZORUNDA; arayüzdeki
 * gizleme yalnız kozmetiktir.
 */
export function bransDegistirebilir(userId: string | null | undefined): boolean {
  if (!userId || typeof userId !== 'string') return false
  return SUPERUSER_BRANS_IDS.includes(userId.trim())
}

/**
 * Geçerli branş anahtarı mı? Kaynak, uygulamanın her yerinde kullanılan kanonik kayıt:
 * `BRANS_ETIKETLERI` (lib/intake/bransSorulari.ts) — 30 branş, `SpecialtyKey` ile birebir
 * aynı ve `lib/doktor/specialties.ts` içindeki SPECIALTIES anahtarlarıyla da birebir aynı.
 * Burada ikinci bir liste TUTULMUYOR.
 */
export function gecerliBransMi(anahtar: unknown): anahtar is SpecialtyKey {
  return typeof anahtar === 'string' && Object.prototype.hasOwnProperty.call(BRANS_ETIKETLERI, anahtar)
}

/** Açılır listenin kaynağı — aynı kanonik kayıttan, Türkçe etiketiyle. */
export function bransSecenekleri(): Array<{ anahtar: SpecialtyKey; etiket: string }> {
  return (Object.keys(BRANS_ETIKETLERI) as SpecialtyKey[]).map((anahtar) => ({
    anahtar,
    etiket: BRANS_ETIKETLERI[anahtar],
  }))
}
