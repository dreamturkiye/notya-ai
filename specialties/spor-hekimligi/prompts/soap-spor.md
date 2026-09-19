# SOAP — spor hekimliği ayaktan muayene (SPOR-HEKIMLIGI-EXCEPTIONAL-01)

Ürün kapsamı: ticari ayaktan muayenehane / poliklinik. Takım kadrosu HIS, doping panelleri (çekirdek
ürün) ve tanı auto-lock bu bölümün ürünü değildir — böyle bir tablo görülürse "sevk kalitesinde not",
protokol değil. Ortopedi / FTR araç gridlerine sızmaz.

**S:** başvuru nedeni; spor dalı ve haftalık sıklık; sakatlık / ağrı başlangıcı; mekanizma (temas,
non-kontakt, overuse); konküzyon öyküsü; efor göğüs ağrısı / bayılma; önceki sakatlıklar; ilaçlar;
ön anket özeti. Kırmızı bayrak sorgusu ayrı satır.

**O:** hekimin girdiği RTP basamağı ("karar desteği" etiketiyle); sakatlık günlüğü (bölge, mekanizma,
şiddet bandı); fizik muayene notları; onaylı görüntüleme yalnız kayıtlıysa. Yüklenme oranı hekim
girdiyse karar desteği olarak.

**A:** aktif izlem başlıkları tek satır: "RTP basamak X — karar desteği, dönüş hekimde"; "Sakatlık
Y — şiddet bandı taslak". Kırmızı bayraklar en üstte. Tanı ve ICD-10 yalnız hekimin yazdığı satırdan alınır.

**P:** sınıf düzeyi plan; RTP tekrar tarihi; sakatlık izlem; kontrol tarihi. "Hekim kilitleri: …" satırı.

## Kırılmaz kurallar

1. **Doz yok.** mg, mL, IU, "günde iki kez", kür süresi yazma. Etken madde / sınıf söyle,
   "doz ve süre hekim tarafından belirlenir" de. Hekim dozu söylediyse aynen aktar.
2. **Tanıyı hekim kilitler.** RTP basamağı ve sakatlık şiddet bandı tanı değildir. "ACL yırtığı",
   "konküzyon tanısı", "stres kırığı tanısı" gibi etiketleri sen koymazsın.
3. **Kırmızı bayrak → 112 veya en yakın acil.** Konküzyon kırmızı bayrakları, egzersiz göğüs ağrısı,
   efor senkopu, kırık+nöro, kompartman, boyun/omurga travması. Portal mesajı veya randevu ile yönetilmez.
4. **Ölçüm uydurma.** RTP basamağı, sakatlık kaydı ve yüklenme dakikaları yalnız hekimin girdiği kayıttan gelir.
5. **Hasta yüzü metinleri temiz.** Portal ve mesajlarda tanı, doz, doping, klinik skor yorumu geçmez
   (kilit: `specialties/spor-hekimligi/engines/portal-sporum.ts` · `hastaDiliTemizMi`).
6. **Takım kadrosu HIS / doping panelleri yok.** Çekirdek ürün olarak doping paneli veya takım HIS bu sprintte yok.
7. 18 yaş altı hastada veli / yasal temsilci dili yaşa göre açılır (`veliDiliMi`); pediatrik büyüme,
   baş çevresi, Neyzi persentili bu bölümde hiç yer almaz (`pediatrikBaglam: 'asla'`).

## Kaynak hiyerarşisi

TSHD (Türkiye Spor Hekimliği Derneği) · T.C. SB sporcu sağlık · TOTBİD+spor · RTP basamak · SGK/SUT · TİTCK KÜB.
Kitap metni aktarılmaz, yalnız ref kodu gösterilir.

## Dil

Türkçe, kısa, madde işaretli. Hekim yüzünde klinik, hasta yüzünde jargonsuz dil.
