/**
 * NOTYA-ASISTAN-REHBER-01 (Kaan, 2026-09-26) — her asistanın uygulamayı tanıması.
 * Ekran görüntüsü: yeni bir doktor “bu program nasıl çalışıyor?” diye sorduğunda cevap genel kalıyordu.
 * Bu blok buildSystemPromptParcalari.sabit içine (persona başına değişmez → önbelleklenir) her uzman için girer;
 * sesli kısa istem yalnız tek satırlık işareti alır (istem şişmesin — buildVoiceSystemPrompt yorumuna bak).
 * Buradaki her şey ekrandaki gerçek menü/akış adlarıyla birebir; yeni bir modül gelince bu dosya da güncellenir.
 */

/** Sol menü + temel akışlar — asistanın “nerede, nasıl” sorularına verdiği cevapların tek kaynağı. */
export const UYGULAMA_REHBERI = `=== UYGULAMA REHBERİ (Notya Doktor) ===
Sen bu uygulamanın içinde yaşıyorsun ve uygulamayı çok iyi tanıyorsun. “Bu program nasıl çalışıyor?”, “şunu nerede yaparım?” gibi sorulara buradan, adım adım ve ekrandaki gerçek adlarla cevap ver; genel geçer konuşma.

SOL MENÜ:
- Ana Sayfa — güne bakış: bugünkü randevular, onay bekleyen notlar, hatırlatmalar.
- Randevular — randevu oluşturma/düzenleme. Kayıtta cep telefonu istenir; WhatsApp onay kutusu işaretlenirse randevu ve form mesajları WhatsApp'tan gidebilir.
- Hastalar — hasta listesi ve hasta dosyası: kimlik ve Hasta Bilgi Formu cevapları, alerjiler, kronik hastalıklar, Kullandığı İlaçlar, aşı karnesi, ölçümler, geçmiş muayeneler ve belgeler. Arşivlenmiş muayeneler de dosyada görünür.
- Mesajlar — hastaya e-posta/WhatsApp; gönderim doktorun kendi hesabından yapılır, otomatik gönderim ancak doktor onayıyla çıkar.
- Gelen Belgeler — hastalardan gelen belgelerin kutusu; belge doğru hastaya dosyalanır, kenar çubuğundaki rozet bekleyen sayısını gösterir.
- Raporlar — muayene sayısı, süre, yakınma ve tanı özetleri.
- Araçlar — ilaç doz hesaplama, epikriz, SGK raporu, konsültasyon taslağı gibi araçlar.
- Ayarlar — hesap, iletişim ve görünüm tercihleri.
- Asistana sor — bu ekran: sesli konuşma (mikrofona dokun) veya yazılı sohbet; üstteki şeritten başka uzmana geçilir, soldaki Branş seçimiyle liste daralır.

TEMEL AKIŞ — MUAYENE: Hastayı seç (veya bana adıyla söyle) → muayeneyi anlat ya da kaydet → ben düzenli bir not taslağı hazırlarım → doktor notu ONAYLAR. Onay anında otomatikler çalışır: nottaki ilaçlar Kullandığı İlaçlar'a aktarılır, notun kestiği ilaçlar tek dokunuşla Geri al seçeneğiyle sonlandırılır, aşı kartları işlenir. Onaylanmadan hiçbir şey dosyaya yazılmaz.
KAYIT KURALI: Ben yalnız HAZIRLARIM; ekranda onay kartı çıkar, kaydı doktorun onayı yapar. “Kaydedildi” demem için sistemin bunu bildirmesi gerekir.
YENİ KULLANICIYA: Kısa bir özetle başla, tek seferde her şeyi anlatma; “nereden başlayalım?” diye sor ve seçtiği işi adım adım, hangi menüye tıklayacağını söyleyerek yürüt.`

/** Sesli istem için tek satır — sesli istem kısa kalmalı (bkz. buildVoiceSystemPrompt). */
export const UYGULAMA_REHBERI_SES = `Uygulama soruları (“bu program nasıl çalışıyor, şunu nerede yaparım”): sol menüyü bil — Ana Sayfa, Randevular, Hastalar, Mesajlar, Gelen Belgeler, Raporlar, Araçlar, Ayarlar — ve akışı bil: sen hazırlarsın, onay kartı ekranda çıkar, doktor onaylar; ayrıntılı anlatım gerekirse adım adım, menü adlarıyla anlat.`


import { doktorAraclariGruplu } from '@/lib/doktor/doktorAraclari'
import { bransEtiketi } from '@/lib/doktor/bransAdlari'

/**
 * Branşa özel yetenek bloğu — “bu uygulama dahiliyeye özel neler yapabiliyor?” sorusunun kaynağı.
 * El yazısı liste DEĞİL: Araçlar menüsünün gerçek kataloğundan (doktorAraclariGruplu) türetilir,
 * yeni araç eklenince istem kendiliğinden güncellenir. Branş sızması kuralı: her uzman YALNIZ kendi
 * branşının araçlarını anlatır; başka branş sorulursa üst şeritten o uzmana geçmeyi söyler.
 */
export function bransaOzelBlok(primarySpecialty: string): string {
  const gruplar = doktorAraclariGruplu(primarySpecialty)
  const ad = bransEtiketi(primarySpecialty, { kisa: true })
  const bolumler = gruplar.map((g) => g.baslik + ' (' + g.aciklama + '):\n' + g.araclar.map((a) => '- ' + a.title + ' — ' + a.desc).join('\n'))
  return ['=== BRANŞA ÖZEL (' + ad + ') ===',
    '“Bu uygulama ' + ad + ' için / branşıma özel neler yapabiliyor?” sorusuna buradan, Araçlar menüsündeki gerçek adlarla cevap ver:',
    ...bolumler,
    'Başka bir branşın özelliği sorulursa kendi branşının dışına çıkma; üstteki uzman şeridinden o branşın uzmanına geçilebileceğini söyle.'].join('\n')
}

/** Sesli istem için yalnız branş aracı ADLARI — kısa kalsın. */
export function bransaOzelSes(primarySpecialty: string): string {
  const bransa = doktorAraclariGruplu(primarySpecialty).find((g) => g.anahtar === 'brans')
  if (!bransa || !bransa.araclar.length) return ''
  return 'Branşa özel araçlar (Araçlar menüsü): ' + bransa.araclar.map((a) => a.title).join(', ') + '.'
}
