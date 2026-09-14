/**
 * NOTYA-MCHAT-01 (Kaan 2026-09-14): M-CHAT-R/F — Değiştirilmiş Erken Çocukluk Dönemi Otizm
 * Tarama Ölçeği, resmi Türkçe çeviri (Robins, Fein, Barton 2009; www.mchatscreen.com).
 * 20 madde, evet/hayır. Puanlama TAMAMEN DETERMİNİSTİK — model bu sonucu YORUMLAMAZ/HESAPLAMAZ,
 * yalnız resmi algoritma uygulanır (büyüme persentili ile aynı ilke: LLM'e güvenme, gerçek
 * algoritmayı koda göm).
 *
 * Ters puanlanan maddeler (EVET = risk puanı): 2, 5, 12. Diğer 17 maddede HAYIR = risk puanı.
 * Bu, M-CHAT-R'nin resmi puanlama sayfasının standart kuralıdır.
 *
 * Resmi kesim noktaları (kaynak PDF, "Puanlama" bölümü):
 * - Düşük Risk: 0-2  → OSB için ek işlem gerekmez (24 aydan küçükse 2. yaş gününden sonra tekrar tara)
 * - Orta Risk:  3-7  → İzlem (Follow-Up) bölümü doldurulmalı; İzlem'de skor ≥2 ise pozitif kabul edilir
 * - Yüksek Risk: 8-20 → İzlem atlanır, doğrudan tanısal değerlendirmeye sevk edilir
 *
 * Not (dürüstçe belirtilmeli): Bu uygulama yalnız M-CHAT-R'yi (ilk 20 soruluk anket) içerir.
 * Resmi araç Orta Risk'te (3-7) sevkten önce ayrıntılı bir İzlem görüşmesi (M-CHAT-R/F'nin
 * ikinci, çok daha uzun kısmı) öngörür — bu henüz uygulanmadı. Kaan'ın istediği iki sonuçlu
 * çıktıya ("Otizm özelliği yok" / "İleri araştırma gerekir") uyum için Orta ve Yüksek Risk
 * burada TEK kategoride ("İleri araştırma gerekir") birleştirildi; klinik olarak doğrudur
 * (ikisi de ek işlem gerektirir), yalnız İzlem görüşmesinin kendisi eksik.
 */

export interface MchatSoru { no: number; metin: string; ornek?: string }

export const MCHAT_R_SORULARI: MchatSoru[] = [
  { no: 1, metin: 'Eğer odada herhangi bir şeyi işaret ederseniz, çocuğunuz ona bakar mı?', ornek: 'Örn. bir oyuncağı veya hayvanı işaret ederseniz, çocuğunuz ona bakar mı?' },
  { no: 2, metin: 'Hiç çocuğunuzun sağır olabileceğini düşündünüz mü?' },
  { no: 3, metin: 'Çocuğunuz hayali veya "mış gibi" oyunlar oynar mı?', ornek: 'Örn. boş bir bardaktan su içer gibi yapma, telefonla konuşurmuş gibi yapma' },
  { no: 4, metin: 'Çocuğunuz eşyaların üzerine tırmanır mı?', ornek: 'Örn. mobilyalar, merdivenler, çocuk parkındaki aletler' },
  { no: 5, metin: 'Çocuğunuz gözlerinin yakınında parmaklarıyla garip hareketler yapar mı?', ornek: 'Örn. parmaklarını gözlerinin yakınında oynatır mı?' },
  { no: 6, metin: 'Çocuğunuz bir şey istediğinde veya yardım gerektiğinde tek parmağıyla işaret eder mi?', ornek: 'Örn. yetişemeyeceği bir yerdeki yiyecek/oyuncağa işaret etme' },
  { no: 7, metin: 'Çocuğunuz ilginç bir şeyi size göstermek için tek parmağıyla işaret eder mi?', ornek: 'Örn. gökyüzündeki bir uçağı işaret etme — 6. sorudaki İSTEMEKten farklı' },
  { no: 8, metin: 'Çocuğunuz diğer çocuklarla ilgilenir mi?', ornek: 'Örn. onları izler mi, gülümser mi, yanlarına gider mi?' },
  { no: 9, metin: 'Çocuğunuz yardım istemek için değil, sadece paylaşmak için size bir şey getirip gösterir mi?', ornek: 'Örn. bir çiçeği, oyuncağı göstermek için getirme' },
  { no: 10, metin: 'Çocuğunuz ismiyle çağırdığınızda size yanıt verir mi?', ornek: 'Bakar mı, konuşur/gıgıldar mı, yaptığı şeyi bırakır mı?' },
  { no: 11, metin: 'Çocuğunuza gülümsediğinizde, o da size gülümser mi?' },
  { no: 12, metin: 'Çocuğunuz günlük seslerden rahatsız olur mu?', ornek: 'Örn. elektrikli süpürge veya yüksek sesli müzik olduğunda ağlar/çığlık atar mı?' },
  { no: 13, metin: 'Çocuğunuz yürüyor mu?' },
  { no: 14, metin: 'Çocuğunuz konuşurken, oynarken veya giydirirken gözlerinize bakar mı?' },
  { no: 15, metin: 'Çocuğunuz yaptığınız şeyi taklit etmeye çalışır mı?', ornek: 'Örn. bay bay yapma, alkış yapma, komik sesleri taklit etme' },
  { no: 16, metin: 'Bir şeye bakmak için başınızı çevirirseniz, çocuğunuz neye baktığınızı görmek için etrafa bakar mı?' },
  { no: 17, metin: 'Çocuğunuz sizin ona bakmanızı sağlamaya çalışır mı?', ornek: 'Örn. aferin almak için bakar mı, "bak"/"beni izle" der mi?' },
  { no: 18, metin: 'Çocuğunuz ona bir şey yapmasını söylediğinizde anlar mı?', ornek: 'Örn. işaret etmeden "kitabı sandalyenin üzerine koy" dediğinizde anlar mı?' },
  { no: 19, metin: 'Yeni bir şey olduğunda, çocuğunuz bu konuda ne hissettiğinizi anlamak için yüzünüze bakar mı?', ornek: 'Örn. farklı bir ses duyarsa veya yeni bir oyuncak görürse yüzünüze bakar mı?' },
  { no: 20, metin: 'Çocuğunuz hareketli aktivitelerden hoşlanır mı?', ornek: 'Örn. sallanmak veya dizde hoplatılmak' },
]

/** Ters puanlanan maddeler — EVET risk puanı sayılır. Diğerlerinde HAYIR risk puanı sayılır. */
export const MCHAT_TERS_MADDELER = new Set([2, 5, 12])

export type MchatRiskSeviyesi = 'dusuk' | 'orta' | 'yuksek'

export interface MchatSonuc {
  toplamPuan: number
  riskSeviyesi: MchatRiskSeviyesi
  riskEtiket: string
  sonucMetni: 'Otizm özelliği yok' | 'İleri araştırma gerekir'
}

/** cevaplar: soru no (1-20) → true (Evet) / false (Hayır). Eksik soru olmamalı. */
export function mchatPuanla(cevaplar: Record<number, boolean>): MchatSonuc {
  let toplamPuan = 0
  for (const soru of MCHAT_R_SORULARI) {
    const evet = !!cevaplar[soru.no]
    const tersMi = MCHAT_TERS_MADDELER.has(soru.no)
    const riskliMi = tersMi ? evet : !evet
    if (riskliMi) toplamPuan += 1
  }
  let riskSeviyesi: MchatRiskSeviyesi
  if (toplamPuan <= 2) riskSeviyesi = 'dusuk'
  else if (toplamPuan <= 7) riskSeviyesi = 'orta'
  else riskSeviyesi = 'yuksek'

  const riskEtiket = riskSeviyesi === 'dusuk' ? 'Düşük Risk' : riskSeviyesi === 'orta' ? 'Orta Risk' : 'Yüksek Risk'
  const sonucMetni = riskSeviyesi === 'dusuk' ? 'Otizm özelliği yok' : 'İleri araştırma gerekir'
  return { toplamPuan, riskSeviyesi, riskEtiket, sonucMetni }
}
