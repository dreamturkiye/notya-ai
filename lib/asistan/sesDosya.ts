/**
 * NOTYA-SES-BAGLAM-KUCULT-01 (Kaan, 2026-09-28) — sesli turda hangi hasta dosyası gider?
 *
 * Varsayılan: kısa, güvenlik-tam özet (lib/doktor/hastaDosyaKisa.ts). İlk-10 dosya sorusunda özete kanıt bloğu
 * eklenir (soruTuruBul → kanitBlogu, dokunulmadı). Soru ne İlk-10 ne HIZLI KART ama özette olmayan bir kaydı
 * soruyorsa (eski vizit, tarih, görüntüleme, belge, rapor…) o tur bugünkü gibi TAM dosyayla gider — kısa özet
 * yüzünden "dosyada yok" denmesin. Yazılı kanal her zaman tam dosya (değişmedi).
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'

const AY = 'ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik'
const AYRINTI = new RegExp([
  String.raw`\b(vizit|ziyaret)`,
  String.raw`\bmuayene(si|sinde|de|den|lerde|lerin)\b`,
  String.raw`\bnot(ta|unda|lar|larda|larinda|lari)\b`,
  String.raw`\b(gecen|onceki|evvelki|ilk) (sefer|ay|hafta|yil|sene|kontrol|gelis|muayene|vizit|ziyaret|yatis)`,
  String.raw`\bonceki\b|\bdaha once\b|\bgecmis(te|i|teki)?\b|\bgecirdi\b|\bgecirmis\b`,
  String.raw`\btarih|\bne zaman (geldi|basla|yazil|yapil|cekil|verildi|kesildi|tani)`,
  String.raw`\b(${AY})\b`,
  String.raw`goruntuleme|rontgen|\bgrafi|\busg\b|ultrason|\bmr\b|\bmri\b|tomografi|\bbt\b|\bfilm|\bekg\b|\beko\b`,
  String.raw`\bbelge|\brapor|epikriz|konsultasyon|\bsevk|\bform|anamnez|\boyku|ozgecmis|\bcihaz`,
  String.raw`\b(dosya|kayit)(da|ta|ya|yi|sini|sinda|lar|larda)\b`,
  String.raw`(yaz|de|soyle|ver|basla|kes|iste|yap|cek)m[iu]s(t[iu]k|t[iu]m|t[iu])\b|\bneydi\b|\bnasildi\b`,
].join('|'))

/** Sesli turda bu mesaj özette olmayan bir kaydı mı soruyor (→ tam dosya)? İlk-10 soruları bunun DIŞINDA kalır. */
export function sesTamDosyaGerekirMi(mesaj: string | null | undefined): boolean {
  const n = trAramaNormalize(mesaj).replace(/[?!.,;:]+/g, ' ').replace(/\s+/g, ' ').trim()
  return Boolean(n) && AYRINTI.test(n)
}

/** Kısa özetin kural satırı — tam dosyanın KURALLAR'ı, özetin sınırı açık yazılarak. */
export function sesOzetKurali(ad: string): string {
  return `[KURALLAR: Bu hasta hakkındaki her soruda YALNIZCA yukarıdaki özete ve HIZLI KART'a dayan; her kesin cümleye hastanın adıyla ("${ad}") başla; aşı / ilaç / lab listesini yalnız bu bloktan kur, sohbet geçmişindeki listeden ya da başka hastadan kurma; ASLA "uydurdum" / "dayanağı yok" deme; bilgi uydurma. Bu SESLİ ÖZETTİR: alerji, ilaçlar, etkileşimler, kronik hastalık, kritik bulgular ve kilo TAMDIR; eski vizit notları, tam lab tablosu, tam aşı defteri, görüntüleme ve belgeler bu blokta YOK ama dosyada olabilir — onlar için "dosyada bu bilgi yok" DEME, "Bu ayrıntı sesli özetimde yok Hocam; vizit ya da tarih söylerseniz tam dosyadan bakarım" de. Bu bloktan sonra KESİN DOSYA CEVABI varsa o cümleyi AYNEN söyle. "Kaçıncı ziyaret" sorulursa toplam vizit sayısını ve tarih aralığını söyle. Doktor yeni bir ilaçtan bahsederse hastanın sürekli ilaçlarıyla olası etkileşimi KENDİLİĞİNDEN kontrol et; risk varsa "Hocam, hasta şu an X kullanıyor; Y ile ... riski olabilir" formatında uyar. Kritik dosya bilgilerini (alerji, kronik hastalık, önceki kritik bulgu) yeri geldiğinde kendiliğinden hatırlat. Nihai klinik karar ve sorumluluk doktorundur.]`
}
