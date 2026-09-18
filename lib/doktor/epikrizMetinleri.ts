/**
 * Epikriz metin şablonları — app/api/doktor/araclar/epikriz/route.ts'den taşındı ki branşa göre dallanan satırlar test
 * edilebilsin. BRANS-ALAN-SIZMASI (Kaan 2026-09-17): "tüm seanslar" epikrizi HER hekim için "Kliniği: Pediatri (Çocuk
 * Sağlığı)" başlığı ve "Çocuk Sağlığı ve Hastalıkları Uzmanı" imzasıyla basılıyordu (branş sabit 'pediatri' yazılmıştı),
 * prompt da her hastada "sağlam çocuk kontrolleri / AŞI KARNESİ" istiyordu. Branş artık notun kapsamından
 * (lib/specialties/kapsam.ts), pediatrik satırlar yalnız pediatrik bağlamda.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { klinikAdi, resmiUzmanlikAdi } from '@/lib/doktor/bransAdlari'

const secici = (pediatrik: boolean) => (pediatrikMetin: string, yetiskinMetin: string) => (pediatrik ? pediatrikMetin : yetiskinMetin)

/** "Kliniği: …" başlık satırı — branş bilinmiyorsa satır yazılmaz (eskiden 'pediatri' varsayılırdı). */
export function epikrizKlinikSatiri(brans: SpecialtyKey | null): string | null {
  return brans ? `Kliniği: ${klinikAdi(brans)}` : null
}

/** İmzadaki unvan satırı — branş bilinmiyorsa boş. */
export function epikrizUnvanSatiri(brans: SpecialtyKey | null): string {
  return brans ? `${resmiUzmanlikAdi(brans)} Uzmanı` : ''
}

/** Tüm seanslar (kapsamlı) epikriz sistem promptu. */
export function epikrizKapsamliSistem(pediatrik: boolean): string {
  const ped = secici(pediatrik)
  return `Türkiye Sağlık Bakanlığı standart epikriz formatında, PROFESYONEL ve ÖZLÜ, hastanın İLK GELİŞİNDEN BU YANA TÜM İZLEMİNİ özetleyen kapsamlı bir epikriz yaz. Sadece JSON döndür: {"taniVeTedavi":"...","taburcuOzeti":"..."}
BAŞLIK BİLGİLERİNİ (ad, tarih, hekim, protokol no vb.) YAZMA — ayrıca ekleniyor. İMZA/TARİH SATIRI YAZMA — ayrıca ekleniyor.
ÜSLUP — anlatısal düzyazı DEĞİL, BÜYÜK HARF alt başlıklarla telegrafik: "taniVeTedavi" içinde SIRAYLA: ${ped(
    'TANI VE TARİHLER (sağlam çocuk/rutin kontroller ile geçirilen hastalıkları AYRI listele), AŞI KARNESİ (uygulanan aşılar ve tarihleri)',
    'TANI VE TARİHLER (rutin kontroller ile geçirilen hastalıkları AYRI listele), AŞILAR (yalnız dosyada aşı kaydı varsa; yoksa bu başlığı hiç yazma)',
  )}, İLAÇ VE TAKVİYELER (geçmiş ve güncel, tarihleriyle). Ölçüm/vital tekrarı yapma, yalnız klinik önemi olanı an.
"taburcuOzeti" 3-4 cümleyi geçmesin: genel klinik seyir, takip süresi, toplam vizit sayısı — telegrafik.
Yalnız dosyada YER ALAN bilgiyi kullan, uydurma; bir bölüm boşsa "Kayıt yok" yaz.`
}

/** Tek vizit epikriz sistem promptu. */
export function epikrizTekVizitSistem(pediatrik: boolean): string {
  const ped = secici(pediatrik)
  return `Türkiye Sağlık Bakanlığı standart epikriz formatında, PROFESYONEL ve ÖZLÜ yaz. Sadece JSON döndür, başka hiçbir şey yazma: {"taniVeTedavi":"...","taburcuOzeti":"..."}
BAŞLIK BİLGİLERİNİ (ad, tarih, hekim, protokol no vb.) YAZMA — ayrıca ekleniyor. İMZA/TARİH SATIRI YAZMA — ayrıca ekleniyor. Bilmediğin bir alan için ASLA köşeli parantez içinde yer tutucu ([...]) yazma.
ÜSLUP — standart Türk epikriz belgesi gibi, anlatısal/gevşek düzyazı DEĞİL:
- "taniVeTedavi" içinde BÜYÜK HARF alt başlıklar kullan: TANI (ICD-10 kodlarıyla, numaralı), ÖZGEÇMİŞ (yalnız klinik açıdan anlamlıysa — ${ped('doğum bilgileri gibi ', '')}rutin veriyi tek cümleyle geç), FİZİK MUAYENE (yalnız ANORMAL/dikkat çekici bulgular; "her sistem normal" tek satır yeterli), UYGULANAN TARAMA/AŞI${ped('', ' (yalnız yapıldıysa)')}, TEDAVİ VE TAKVİYELER (numaralı, ilaç adı+doz+kullanım), YÖNLENDİRMELER.
- Kilo/boy/vital gibi ölçümleri BURADA TEKRAR ETME — bunlar zaten Hasta Bilgileri'nde/notta kayıtlı; yalnız KLİNİK ÖNEMİ olan değeri (ör. anormal VKİ, ateş yüksekliği) bir kez, kısaca an.
- ${ped('"Anne beyanına göre çocuğun genel sağlık durumu iyi olup..."', '"Hastanın beyanına göre genel sağlık durumu iyi olup..."')} gibi dolgu cümleler kurma; doğrudan bulguyu yaz.
- "taburcuOzeti" 3-4 cümleyi geçmesin: klinik seyir + kontrol planı, telegrafik.
Kısacası: bir meslektaşın hızlı okuyup anlayacağı, laf kalabalığı olmayan bir belge — dergi makalesi değil.`
}
