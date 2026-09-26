/**
 * NOTYA-AYSE-STANDART-01 — hekimin mesajı 10 kanonik dosya sorusundan hangisi? (yazı ve ses aynı fonksiyon)
 *
 * Konuşma dolguları ("hocam", "şey", "acaba", "bi", "Ayşe") atılır; eşleşme katlanmış Türkçe üzerindedir. Tek
 * bilgilik sorular (kan grubu, alerji, son vizit tarihi, telefon / kimlik, "kilosu kaç") bilerek YAKALANMAZ — onları
 * deterministik HIZLI KART (lib/doktor/hastaDosyaKart dosyaSoruCevap) ve kimlik yolu cevaplar.
 *
 * Sıra önemlidir: daha özgül soru önce ("daha önce aynı şikayetle" → 7, "lab'da dikkat etmem gereken" → 5, lab dışı
 * "dikkat etmem gereken" → 10).
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export type SoruTuru = 'ozet' | 'degisim' | 'buyume' | 'asi' | 'lab' | 'ilac' | 'benzer' | 'gelisim' | 'takip' | 'gozden-kacan'

const DOLGU = /\b(hocam|ayse|ayşe|sey|seyy|acaba|bi|bir de|ya|yani|peki|simdi|hani|lutfen|bakar misin|soyler misin|bana|bu hastanin|hastanin|cocugun|bebegin)\b/g

const KALIP: [SoruTuru, RegExp][] = [
  ['benzer', /\b(ayni|benzer|boyle|bu)( bir)? (sikayet|sorun|problem|yakinma|tablo|sikayetle|sorunla)|daha once(den)? (de )?(bu|ayni|boyle|benzer|bununla|bu sikayet)|(daha once|onceden|gecmiste) .*(geldi mi|gelmis mi|olmus mu|yasadi mi|gecirdi mi|gecirmis mi)|kac (kez|kere|defa) .*(oldu|gecirdi|geldi)|tekrarlayan (bir )?(sikayet|atak|enfeksiyon)/],
  ['asi', /\basi(lari|si|larinin)? (tam|eksik|durum|karne|takvim|guncel|yasina|zamaninda)|eksik asi|asi karnesi|asi durumu|hangi asi(lari|si)? (eksik|kaldi|yapilmali|gerek|yapilacak)|asilari nasil/],
  ['ilac', /ilaclari (neler|ne|nedir|nelerdir)|hangi ilac(lari|i)? (kullaniyor|aliyor|kullanmakta)|kullandigi ilac|su an(ki|da)? (kullandigi |aldigi )?ilac|aktif ilaclar|dozlari (ne|nedir|neler)|ilac(lari)? ve doz|ilac listesi|ne ilac(lar)? kullaniyor/],
  ['gelisim', /\bgelisim|\bgidr\b|m-?chat|\bdenver\b|konusuyor mu|yuruyor mu|kelime (soyluyor|cikariyor)|otizm|ortak dikkat|ismine (donuyor|bakiyor)/],
  ['degisim', /son (muayene|vizit|kontrol|gorusme|gelis)(den|ten|inden|sinden)? (bu yana|beri|sonra)|ne(ler)? degis|degisen (ne|neler|bir sey)|gecen (sefer|vizit|muayene|kontrol)(den|ten)? (bu yana|beri|farkli)|farkli ne var/],
  ['buyume', /buyume|buyumesi|persentil|kilo aliyor mu|kilo alimi|kilo alamiyor|kilosu nasil|boy(u)? (uzuyor|nasil|uzamasi)|boy uzamasi|bas cevresi (nasil|buyuyor)|tarti (artisi|alimi)|egrisi/],
  ['lab', /\blab\b|laboratuvar|tahlil|tetkik sonuc|kan sonuc|sonuclari(nda)?|hemogram|kan sayimi|ferritin|demir (degeri|degerleri|paneli)|\bhb(si)? (kac|nasil)|kan testi/],
  ['gozden-kacan', /gozumden kac|gozden kac|atladigim|atlamis olabilecegim|kacirdigim|kacirmis olabilecegim|dikkat etmem gereken|dikkat edilmesi gereken|onemli bir sey var mi|guvenlik (sorunu|problemi)/],
  ['takip', /bugun (ne|neler) (yap|bak)|yapmam(iz)? gereken|takip etmem(iz)? gereken|takip (edilmesi|gereken)|\btakip\b|acik (is|konu|kalan)|bekleyen|eksik kalan|yapilacak(lar| bir sey)? (var mi|neler)|bugun .*var mi/],
  ['ozet', /ozetle|ozetler misin|ozetlesene|kisaca anlat|kisaca (bahset|soyle)|ozet(i|ini)? (ver|nedir|cikar|gec)|bu hastayi anlat|hastayi (tanit|anlat)|dosyayi ozetle|genel durum(u)? (ne|nasil)|kimdir bu/],
]

/** Kanonik soru türü ya da null (dosya sorusu değil / tek bilgilik soru). */
export function soruTuruBul(mesaj: string | null | undefined): SoruTuru | null {
  const n = trAramaNormalize(mesaj).replace(/[?!.,;:]+/g, ' ').replace(DOLGU, ' ').replace(/\s+/g, ' ').trim()
  if (!n) return null
  for (const [tur, re] of KALIP) if (re.test(n)) return tur
  return null
}
