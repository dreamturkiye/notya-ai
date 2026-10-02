/**
 * NOTYA-SES-BAGLAM-KUCULT-01 (Kaan, 2026-09-28) — sesli turda hangi hasta dosyası gider?
 *
 * Varsayılan: kısa, güvenlik-tam özet (lib/doktor/hastaDosyaKisa.ts). İlk-10 dosya sorusunda özete kanıt bloğu
 * eklenir (soruTuruBul → kanitBlogu, dokunulmadı). Soru ne İlk-10 ne HIZLI KART ama özette olmayan bir kaydı
 * soruyorsa (eski vizit, tarih, görüntüleme, belge, rapor…) o tur bugünkü gibi TAM dosyayla gider — kısa özet
 * yüzünden "dosyada yok" denmesin. Yazılı kanal her zaman tam dosya (değişmedi).
 *
 * NOTYA-AYSE-GERI-06 (audit §4.6, PR 7): two holes in that rule.
 *   1. The detail list missed the requests a doctor actually makes by voice — a LIST, a SERIES, a HISTORY or a
 *      TABLE: "bütün muayenelerdeki kilo ölçümlerini sırayla göster", "6 aylık muayenesini anlat", "reçete
 *      geçmişini göster", "son üç muayenesini özetle". They got the short chart, which has none of it.
 *   2. When the short chart did not hold the answer, the model was told to SAY so ("Bu ayrıntı sesli özetimde yok
 *      Hocam; vizit ya da tarih söylerseniz…") — the doctor had to ask again in other words. Now the model answers
 *      with a marker instead of that sentence, and the server runs the same turn again on the full chart
 *      (lib/asistan/ayseCevapla.ts). The marker is never spoken and never shown.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'

const AY = 'ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik'
const AYRINTI = new RegExp([
  String.raw`\b(vizit|ziyaret)`,
  String.raw`\bmuayene\w*`,
  String.raw`\bkontrol(u|unde|unu|ler\w*)\b`,
  String.raw`\bnot(ta|unda|lar|larda|larinda|lari)\b`,
  String.raw`\b(gecen|onceki|evvelki|ilk) (sefer|ay|hafta|yil|sene|kontrol|gelis|muayene|vizit|ziyaret|yatis)`,
  String.raw`\bonceki\b|\bdaha once\b|\bgecmis\w*|\bgecirdi\b|\bgecirmis\b`,
  String.raw`\btarih|\bne zaman (geldi|basla|yazil|yapil|cekil|verildi|kesildi|tani)`,
  String.raw`\b(${AY})\b`,
  String.raw`goruntuleme|rontgen|\bgrafi|\busg\b|ultrason|\bmr\b|\bmri\b|tomografi|\bbt\b|\bfilm|\bekg\b|\beko\b`,
  String.raw`\bbelge|\brapor|epikriz|konsultasyon|\bsevk|\bform|anamnez|\boyku|ozgecmis|\bcihaz`,
  String.raw`\b(dosya|kayit)(da|ta|ya|yi|sini|sinda|lar|larda)\b`,
  String.raw`(yaz|de|soyle|ver|basla|kes|iste|yap|cek)m[iu]s(t[iu]k|t[iu]m|t[iu])\b|\bneydi\b|\bnasildi\b`,
  // NOTYA-AYSE-GERI-06 — a list, a series, a history or a table: none of it is in the short chart.
  String.raw`\b(tum|tumu|tumunu|butun|hepsi|hepsini|tek tek|sirayla|sirasiyla|sira ile)\b`,
  String.raw`\b(liste\w*|tablo\w*|seri\w*|seyri\w*|dokum\w*|kronoloji\w*)\b`,
  String.raw`\b(olcumler|kilolar|boylar|receteler|tahliller|sonuclar|tanilar|sikayetler|asilar|ilaclar)\w*`,
  String.raw`\b\d{1,2} (aylik|yas|haftalik|gunluk)\w*`,
  String.raw`\bkac (kez|kere|defa)\b|\bher (seferinde|muayene|vizit|kontrol)\w*`,
].join('|'))

/** Sesli turda bu mesaj özette olmayan bir kaydı mı soruyor (→ tam dosya)? İlk-10 soruları bunun DIŞINDA kalır. */
export function sesTamDosyaGerekirMi(mesaj: string | null | undefined): boolean {
  const n = trAramaNormalize(mesaj).replace(/[?!.,;:]+/g, ' ').replace(/\s+/g, ' ').trim()
  return Boolean(n) && AYRINTI.test(n)
}

/** The marker the model writes when the short chart does not hold the answer. Never spoken, never shown. */
export const SES_TAM_DOSYA_ISARETI = '[TAM-DOSYA]'

/**
 * Did the model ask for the full chart? The marker — or the sentence the old rule taught it, which a model that
 * has seen the earlier turns of this conversation may still produce.
 */
export function sesTamDosyaIstendiMi(yanit: string | null | undefined): boolean {
  const y = String(yanit || '')
  if (y.includes(SES_TAM_DOSYA_ISARETI) || /\[\s*TAM[- ]?DOSYA\s*\]/i.test(y)) return true
  return /sesli (ö|o)zetimde (yok|bulunmuyor)|(ö|o)zetimde bu ayr[ıi]nt[ıi]/i.test(y)
}

/** Kısa özetin kural satırı — tam dosyanın KURALLAR'ı, özetin sınırı açık yazılarak. */
export function sesOzetKurali(ad: string): string {
  return `[KURALLAR: Bu hasta hakkındaki her soruda YALNIZCA yukarıdaki özete ve HIZLI KART'a dayan; her kesin cümleye hastanın adıyla ("${ad}") başla; aşı / ilaç / lab listesini yalnız bu bloktan kur, sohbet geçmişindeki listeden ya da başka hastadan kurma; ASLA "uydurdum" / "dayanağı yok" deme; bilgi uydurma. Bu SESLİ ÖZETTİR: alerji, ilaçlar, etkileşimler, kronik hastalık, kritik bulgular ve kilo TAMDIR; eski vizit notları, tam lab tablosu, tam aşı defteri, görüntüleme ve belgeler bu blokta YOK ama dosyada olabilir — onlar için "dosyada bu bilgi yok" DEME ve hekime "tam dosyadan bakarım" diye söz VERME: sorunun cevabı bu blokta yoksa speech alanına YALNIZCA ${SES_TAM_DOSYA_ISARETI} yaz, başka hiçbir şey yazma — sistem aynı soruyu tam dosyayla yeniden sorar. Bu bloktan sonra KESİN DOSYA CEVABI varsa o cümleyi AYNEN söyle. "Kaçıncı ziyaret" sorulursa toplam vizit sayısını ve tarih aralığını söyle. Doktor yeni bir ilaçtan bahsederse hastanın sürekli ilaçlarıyla olası etkileşimi KENDİLİĞİNDEN kontrol et; risk varsa "Hocam, hasta şu an X kullanıyor; Y ile ... riski olabilir" formatında uyar. Kritik dosya bilgilerini (alerji, kronik hastalık, önceki kritik bulgu) yeri geldiğinde kendiliğinden hatırlat. Nihai klinik karar ve sorumluluk doktorundur.]`
}
