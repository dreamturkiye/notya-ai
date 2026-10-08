/**
 * NOTYA-ULKE-01 — Turkish text of the core surfaces. Turkish is the source: every other language is written against
 * the same keys (lib/ulke/tipler.ts → YuzeyAnahtarlari).
 *
 * Türkiye does not show `giris`, `davetliKayit`, `bekletme` or `sistem` yet: its own login, sign-up and error pages
 * are still the pre-split screens (docs/COUNTRY-PACK-SPLIT-PLAN.md, jobs 3 and 6). The source text is kept here so
 * that a translator always has the Turkish sentence each key stands for, and so the pre-split pages can move onto
 * these keys without rewording.
 */
import type { YuzeyMetinleri } from '@/lib/ulke/tipler'

/** Same sentence a wrong password gets (app/giris/authHataMesaji.ts) — a refused account must not learn why. */
export const TR_HESAP: YuzeyMetinleri<'hesap'> = {
  girisReddi: 'E-posta veya şifre hatalı.',
}

export const TR_GIRIS: YuzeyMetinleri<'giris'> = {
  altBaslik: 'Hesabınıza giriş yapın',
  eposta: 'E-posta',
  epostaOrnek: 'ad@ornek.com',
  sifre: 'Şifre',
  sifreOrnek: 'Şifreniz',
  gonder: 'Giriş yap',
  gonderiliyor: 'Giriş yapılıyor…',
  bosAlan: 'E-posta ve şifre gereklidir.',
  hata: 'Giriş başarısız. Lütfen tekrar deneyin.',
  baglantiHatasi: 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.',
  cokDeneme: 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.',
  hazirDegil: 'Giriş şu an kullanılamıyor.',
  davetSorusu: 'Davet kodunuz mu var?',
  kayitBaglantisi: 'Kayıt olun',
  anaSayfa: 'Ana sayfa',
}

export const TR_DAVETLI_KAYIT: YuzeyMetinleri<'davetliKayit'> = {
  baslik: 'Davet koduyla kayıt',
  aciklama: 'Notya şu an yalnızca davetle açılıyor.',
  adSoyad: 'Ad soyad',
  eposta: 'E-posta',
  sifre: 'Şifre',
  sifreTekrar: 'Şifre (tekrar)',
  davetKodu: 'Davet kodu',
  dil: 'Arayüz dili',
  gonder: 'Hesap oluştur',
  gonderiliyor: 'Hesap oluşturuluyor…',
  eksikAlan: 'Lütfen bütün alanları doldurun.',
  epostaGecersiz: 'E-posta adresi geçersiz görünüyor. Lütfen kontrol edin.',
  sifreKisa: 'Şifre en az 8 karakter olmalıdır.',
  sifreUyusmuyor: 'Şifreler eşleşmiyor.',
  kodGecersiz: 'Davet kodu geçersiz ya da kullanılmış.',
  olusturulamadi: 'Hesap oluşturulamadı. Bilgilerinizi kontrol edip tekrar deneyin.',
  baglantiHatasi: 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.',
  basarili: 'Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.',
  girisSorusu: 'Zaten hesabınız var mı?',
  girisBaglantisi: 'Giriş yapın',
  kodYokSorusu: 'Davet kodunuz yok mu?',
  fiyatBaglantisi: 'Fiyat isteyin',
}

export const TR_BEKLETME: YuzeyMetinleri<'bekletme'> = {
  baslik: 'Pilot erişiminiz hazırlanıyor',
  govde: 'Hesabınız oluşturuldu. Notya aşamalı olarak açılıyor; sıranız geldiğinde sizinle iletişime geçeceğiz.',
  cikis: 'Çıkış yap',
  yukleniyor: 'Yükleniyor…',
}

export const TR_SISTEM: YuzeyMetinleri<'sistem'> = {
  bulunamadiBaslik: 'Sayfa bulunamadı',
  bulunamadiGovde: 'Bu adres mevcut değil veya taşınmış olabilir.',
  anaSayfa: 'Ana sayfa',
  hataBaslik: 'Bir hata oluştu',
  hataGovde: 'Bu sayfa yüklenirken bir sorun çıktı.',
  tekrarDene: 'Tekrar dene',
}
