/**
 * NOTYA-AYSE-STANDART-01 — Ayşe klinik dosya sorgulama standardı (Dr. Gökhan Mamur, pediatri, 2026-09-26): GENEL
 * KURALLAR + CEVAP STANDARDI + soru başına cevap ŞABLONU. Metin standarttan alındı; model yalnız düzyazıyı kurar,
 * kanıtı lib/asistan/dosyaSorgu/kanit.ts deterministik olarak verir.
 *
 * Bu blok yalnız bir dosya sorusu tanındığında (soruTuruBul) system prompt'un DEĞİŞKEN kısmına eklenir — sabit
 * persona bloğunun önbelleği bozulmaz (ai-model-politikasi: prompt caching).
 */
import type { SoruTuru } from '@/lib/asistan/dosyaSorgu/soruTuru'

export const DOSYA_SORGU_AMACI = 'Amaç: hekime hastanın kaydını ANLAMLANDIRMADA yardım etmek — kelime bulmak, kayıt sıralamak ya da bilgiyi tekrarlamak değil. Farklı tarihlere ait notlar, anamnez, fizik muayene, vital, büyüme, gelişim, lab, aşı, ilaç, alerji, konsültasyon, epikriz ve belgeleri BİRLİKTE değerlendir; kısa, doğru, klinik olarak anlamlı, eyleme dönük cevap ver.'

export const GENEL_KURALLAR: readonly string[] = [
  'Kayıtları gerektiği ölçüde kronolojik değerlendir; güncel bilgiyi eskisinden ayır; aynı olaya ait belgeleri birleştir.',
  'Çelişen kayıt varsa gizleme, hekime açıkça belirt.',
  'Planlandı / önerildi / istendi / reçete edildi / uygulanacak ile uygulandı / yapıldı AYNI DEĞİLDİR.',
  'Dosyada olmayanı üretme; emin değilsen veya kayıt yetersizse bunu açıkça söyle.',
  'Kayıt yoksa "yapılmadı" DEME; "yapıldığına / uygulandığına / sonuçlandığına dair kayıt bulamadım" de. Bu yasak seçenek cümlelerinde de geçerlidir: "ya hiç yapılmadı ya da başka yerde yapıldı" DEME; "uygulandığına dair kayıt yok; başka merkezde yapılmış olabilir" de. "yapılmadı / uygulanmadı / yapılmamış / uygulanmamış" kelimeleri cevabında hiç geçmesin.',
  'Soru 9 ve Soru 10 cevaplarında açık iş varsa "Dikkat / Eksik kayıt / Takip" başlığını mutlaka kullan; yoksa standardın "saptamadım" cümlesini yaz.',
  'Kronolojik yaşı (gerekirse düzeltilmiş yaşı), cinsiyeti ve kiloyu dikkate al.',
  'Lab: yaşa ve cinsiyete uygun pediatrik referansla yorumla; laboratuvarın H/L işaretine güvenme.',
  'İlaç dozu: reçete tarihindeki kilo ile güncel kiloyu karıştırma.',
  'Aşı: planlanan aşı ile uygulandığı belgelenmiş aşıyı kesin olarak ayır.',
  'Planlanmış bir tarama testini yapılmış ya da normal sayma.',
  'Hasta güvenliği problemi görürsen sorulmasa da cevabın SONUNDA belirgin bildir; gereksiz alarm üretme.',
]

export const CEVAP_STANDARDI: readonly string[] = [
  '1) ÖNCE DOĞRUDAN CEVAP — ilk cümle sorunun cevabıdır ve hastanın adıyla başlar (sesli okumada ilk duyulan budur).',
  '2) DAYANAK — en önemli hasta verileri ve TARİHLERİ; dosyayı baştan tekrar etme.',
  '3) Varsa "Dikkat / Eksik kayıt / Takip gereken konu" başlığı — açık işler buraya.',
  '4) Kaynak veriyi ("Kayıt:") klinik yorumdan ("Yorum:") ayır.',
  '5) Belirsizliği gizleme; "normaldir / yapılmıştır / uygulanmıştır" yalnız kayıt destekliyorsa.',
]

export const HEDEF = 'Hedef: hekim üç saniyede üç cevabı görsün — Durum nedir? Hangi veriye dayanarak? Şimdi yapmam gereken var mı?'

/** Soru başına kanonik soru cümlesi ve cevap şablonu (standarttaki ölçütten). */
export const SORU_SABLONLARI: Record<SoruTuru, { no: number; soru: string; sablon: string }> = {
  ozet: {
    no: 1, soru: 'Bu hastayı bana kısaca özetler misin?',
    sablon: 'Longitudinal özet: demografi; prenatal/natal/neonatal (varsa); özgeçmiş; aktif ve önemli tanılar; kronik hastalık; alerji; aktif ilaç; büyüme-gelişim; aşı durumu; önemli lab; konsültasyon; devam eden tedavi; takip gerektirenler. Her viziti anlatma; tek bir viral enfeksiyonu uzatma. Tekrarlayan otit, demir eksikliği, büyüme bozukluğu, gelişimsel kaygı, ilaç alerjisi ve eksik aşı KANITTA varsa MUTLAKA yaz.',
  },
  degisim: {
    no: 2, soru: 'Son muayeneden bu yana neler değişmiş?',
    sablon: 'Son muayeneyi öncekiyle karşılaştır: yeni şikayet/tanı; yeni başlanan, kesilen, tamamlanan ilaç; kilo-boy-baş çevresi ve eğilim; gelişim; lab; aşı; konsültasyon; alerji. ÖNCEKİ VİZİTTE PLANLANANLARIN gerçekleşip gerçekleşmediğini sonraki kayıtlardan doğrula (kanıttaki "→ karşılık" satırları). Metinsel fark değil, klinik anlamlı değişiklik.',
  },
  buyume: {
    no: 3, soru: 'Büyümesi nasıl gidiyor?',
    sablon: 'Kilo / boy / baş çevresini kronolojik ver: persentil ve Z (varsa), yön ve hız, HANGİ TARİHLER ARASINDA. Tek ölçümle karar verme. Growth faltering, catch-up, kilo-boy orantısızlığı, baş çevresi; anne-baba boyu varsa hedef boy.',
  },
  asi: {
    no: 4, soru: 'Aşıları yaşına göre tam mı? Eksik aşısı var mı?',
    sablon: 'Doğum tarihinden kesin yaş. Aşı tablosu + not metni + belgeler karşılaştırılır. Kategoriler AYRI: planlandı / önerildi / reçete edildi / randevu verildi / uygulanacağı söylendi / UYGULANDIĞI BELGELENMİŞ / belirsiz. Örnek: notta "Bugün Hepatit B ikinci dozunu yapacağız" yazıyor ama uygulama kaydı yoksa → "Hepatit B ikinci dozu planlanmış; uygulanmış olduğuna dair kayıt göremiyorum". Eksik / zamanı gelmiş / yaklaşan ve telafi (catch-up); rutin ile risk bazlı ayrı.',
  },
  lab: {
    no: 5, soru: 'Son lab sonuçlarında dikkat etmem gereken bir şey var mı?',
    sablon: 'En güncel sonuç + trend; yaş, cinsiyet, tanı ve ilaçla birlikte yorumla. Demir panelini BİRLİKTE değerlendir (Hb, Hct, MCV, MCH/MCHC, RDW, ferritin, demir, TDBK, satürasyon). Önemli anormallik önce; düzelen anormalliği longitudinal belirt. İstenip sonucu olmayan tetkiki "istendi, sonuç yok" diye yaz.',
  },
  ilac: {
    no: 6, soru: 'Şu anda kullandığı ilaçlar neler ve dozları nedir?',
    sablon: 'Geçmiş reçeteleri aktif sayma. Her aktif ilaç için: ad, form/konsantrasyon, tek doz, yol, sıklık, endikasyon, başlangıç, planlanan süre, durum. mg/kg için REÇETE TARİHİNDEKİ kiloyu kullan (kanıtta yazıyor); akut antibiyotiği aylar sonra aktif gösterme. Doz / alerji / güvenlik sorunu varsa bildir.',
  },
  benzer: {
    no: 7, soru: 'Daha önce aynı şikayetle geldi mi?',
    sablon: 'Eşdeğer terimlerle aranmıştır (kanıttaki eşanlam listesi). Tarih — şikayet — tanı — bulgu — tedavi — sonuç kronolojik. Tekrarlayan patern varsa belirt. Eşleşme yoksa "bu şikayetle (eşdeğer terimler dahil) önceki vizit kaydı bulamadım" de.',
  },
  gelisim: {
    no: 8, soru: 'Gelişimi yaşına uygun mu?',
    sablon: 'GİDR yaklaşımı (açık uçlu, günlük yaşam), M-CHAT-R/F ve standart gelişim testi AYRI veri kaynaklarıdır. Kronolojik / düzeltilmiş yaş. Ebeveyn kaygısı klinik veridir. Regresyon = yüksek öncelik. Planlanmış taramayı yapılmış sayma → "Gelişimsel tarama planlanmış; tamamlanmış sonuç dosyada görünmüyor". 18-24 ayda sosyal iletişim, ortak dikkat, isme yanıt. Yapı: Genel değerlendirme; Güçlü alanlar; İzlenmesi gereken alanlar; Risk ve koruyucu etmenler; Tarama durumu; Önerilen sonraki adım.',
  },
  takip: {
    no: 9, soru: 'Bugün yapmam veya takip etmem gereken bir şey var mı?',
    sablon: 'Açık işler: eksik / zamanı gelmiş aşı, planlanmış ama kaydı olmayan aşı, istenmiş sonucu olmayan lab, tekrar gereken anormal lab, büyüme, gelişim / GİDR / M-CHAT, ilaç sonrası kontrol, bekleyen konsültasyon, konsültasyon sonrası takip, planlanmış kontrol, yaşa uygun koruyucu uygulamalar. Öncelik sırası: 1) Bugün 2) Yakın zamanda 3) Rutin. Kaydı yoksa tamamlanmış sayma.',
  },
  'gozden-kacan': {
    no: 10, soru: 'Gözümden kaçabilecek önemli bir şey var mı?',
    sablon: 'Proaktif gözetim: takipsiz anormal lab, büyüme eğrisinde beklenmedik değişim, tekrarlayan enfeksiyon / otit, eksik ya da planlanmış-uygulanmamış aşı, sonucu olmayan test, gelişimsel kaygı / regresyon, tamamlanmamış GİDR / M-CHAT, doz güvenliği, alerjiyle çelişen reçete, kontrolü belgelenmemiş hastalık, bekleyen konsültasyon, çelişen kayıt. Sorun yoksa: "Dosyada şu anda belirgin bir açık güvenlik problemi veya takip edilmemiş önemli bulgu saptamadım"; veri eksikse bunu söyle.',
  },
}

/** GENEL KURALLAR + CEVAP STANDARDI — dosya sorusu turunda system prompt'a eklenen kurallar bloğu. */
export function dosyaSorguKuralBlogu(hastaAdi: string): string {
  return [
    '\n\n=== AYŞE KLİNİK DOSYA SORGULAMA STANDARDI (bu tur için zorunlu) ===',
    DOSYA_SORGU_AMACI,
    'GENEL KURALLAR:',
    ...GENEL_KURALLAR.map((k) => `- ${k}`),
    'CEVAP STANDARDI:',
    ...CEVAP_STANDARDI.map((k) => `- ${k}`),
    HEDEF,
    `BİÇİM: "speech" alanının İLK cümlesi doğrudan cevaptır ve "${hastaAdi}" adıyla başlar; sonra **Dayanak:** maddeleri (tarihli), varsa **Dikkat / Eksik kayıt / Takip:** maddeleri, gerekiyorsa **Yorum:**. Hasta güvenliği maddesi en SONDA "⚠ Dikkat:" ile. Yalnız aşağıdaki KANIT bloğuna dayan; kanıtta olmayan tarih, değer, doz, aşı ya da sonuç yazma. "uydurdum" deme.`,
    '=== STANDART SONU ===',
  ].join('\n')
}
