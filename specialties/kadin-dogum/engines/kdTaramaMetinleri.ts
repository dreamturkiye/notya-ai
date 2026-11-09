/**
 * KD-TARAMA-01 — Türkçe metinler (Kadın Hastalıkları ve Doğum). Motor kod döner (lib/clinical/kdTaramalar.ts); her kelime
 * burada. Günlük maddeleri Notya'nın ÖZGÜN ifadeleridir: DRSP maddeleri kullanılmadı (ticari lisans doğrulanamadı) ve
 * DSM-5-TR kriter metni kopyalanmadı; her madde bir DSM-5-TR kriter grubuna (B1–B4, C1–C7) eşlenir.
 */
export const PMDD_ALAN_HASTA: Readonly<Record<string, string>> = {
  b1: 'Duygularım çok çabuk değişti (birden ağlamaklı ya da kırılgan oldum)',
  b2: 'Çok çabuk sinirlendim, öfkelendim ya da çevremle tartıştım',
  b3: 'Kendimi çok çökkün, umutsuz hissettim ya da kendimi suçladım',
  b4: 'Çok gergin, kaygılı ya da diken üstünde hissettim',
  c1: 'Her zamanki işlerime ve ilgilerime isteğim azaldı',
  c2: 'Dikkatimi toplamakta zorlandım',
  c3: 'Halsiz, çabuk yorulan ya da enerjisiz hissettim',
  c4: 'İştahım belirgin değişti, fazla yedim ya da belirli yiyecekleri çok istedim',
  c5: 'Çok uyudum ya da uyuyamadım',
  c6: 'Her şey üstüme geliyor ya da kontrolü kaybediyormuşum gibi hissettim',
  c7: 'Bedensel yakınmalarım oldu (memede hassasiyet, şişkinlik, eklem/kas ağrısı, kilo artışı hissi)',
}
export const PMDD_ALAN_KISA: Readonly<Record<string, string>> = {
  b1: 'B1 duygu dalgalanması', b2: 'B2 öfke / tartışma', b3: 'B3 çökkünlük', b4: 'B4 gerginlik / kaygı',
  c1: 'C1 ilgi azalması', c2: 'C2 dikkat', c3: 'C3 enerjisizlik', c4: 'C4 iştah', c5: 'C5 uyku', c6: 'C6 bunalmışlık', c7: 'C7 bedensel',
}
export const PMDD_ISLEV_HASTA: Readonly<Record<string, string>> = {
  is_okul: 'Bu belirtiler işimi, okulumu ya da ev işlerimi etkiledi',
  sosyal: 'Sosyal etkinliklerimi etkiledi',
  iliskiler: 'Yakın ilişkilerimi etkiledi',
}
/** Günlüğün kendi ölçeği (0–5). "Minimal" 0–1, "belirgin" 4–5: Notya günlüğünün tasarım seçimi, doğrulanmış kesim değil. */
export const PMDD_OLCEK_ETIKET = ['Yok', 'Çok az', 'Hafif', 'Orta', 'Belirgin', 'Şiddetli'] as const

export const PMDD_KRITER_ETIKET: Readonly<Record<string, string>> = {
  A: 'A — Çoğu döngüde adetten önceki son haftada ≥5 belirti; adet başlayınca birkaç günde azalıyor, adetten sonraki haftada yok/çok az',
  B: 'B — Belirtilerden en az biri duygusal grup (dalgalanma, öfke, çökkünlük, gerginlik)',
  C: 'C — Diğer gruptan ek belirtilerle toplam ≥5',
  D: 'D — Klinik olarak anlamlı sıkıntı ya da iş/okul/sosyal/ilişkilerde bozulma',
  E: 'E — Başka bir bozukluğun (majör depresyon, panik, kişilik bozukluğu…) yalnız alevlenmesi değil',
  F: 'F — En az iki semptomatik döngüde prospektif günlük puanlama ile doğrulandı (yoksa "geçici")',
  G: 'G — Madde, ilaç ya da başka bir tıbbi duruma (ör. hipertiroidi) bağlı değil',
}

export const TIROID_RISK_ETIKET: Readonly<Record<string, string>> = {
  oyku_tiroid_disfonksiyon: 'Hipotiroidi/hipertiroidi öyküsü', belirti_tiroid: 'Tiroid disfonksiyonu belirti/bulgusu', antikor_veya_guatr: 'Bilinen antikor pozitifliği veya guatr',
  bas_boyun_radyasyon_cerrahi: 'Baş-boyun radyasyonu veya tiroid cerrahisi', yas_30_ustu: '30 yaş üstü', tip1_diyabet: 'Tip 1 diyabet', diger_otoimmun: 'Diğer otoimmün hastalık',
  gebelik_kaybi_preterm_infertilite: 'Gebelik kaybı, erken doğum veya infertilite öyküsü', iki_veya_daha_fazla_gebelik: '≥2 önceki gebelik', aile_oykusu: 'Ailede otoimmün tiroid hastalığı/disfonksiyon',
  morbid_obezite: 'Morbid obezite (VKİ ≥40)', amiodaron_lityum_kontrast: 'Amiodaron, lityum veya yakın iyotlu kontrast', iyot_eksikligi_bolgesi: 'Orta-ağır iyot eksikliği bölgesi',
}
export const TIROID_DURUM_ETIKET: Readonly<Record<string, string>> = {
  yok: 'Bilinen tiroid hastalığı yok', hipotiroidi: 'Hipotiroidi (levotiroksin alıyor)', hipertiroidi: 'Hipertiroidi / Graves', antikor_pozitif: 'Ötiroid, TPO/Tg antikor pozitif',
}
export const TIROID_BAYRAK_ETIKET: Readonly<Record<string, string>> = {
  aralikta: 'Aralıkta', yuksek: 'Yüksek', dusuk: 'Düşük', aralik_yok: 'Trimester aralığı yok — laboratuvarın gebelik aralığını girin', deger_yok: '—',
}
export const TIROID_KAYNAK_ETIKET: Readonly<Record<string, string>> = {
  laboratuvar: 'laboratuvarın gebelik/trimester aralığı',
  yedek_duzeltilmis: 'ATA 2017 yedeği: gebelik dışı aralık −0,4 / −0,5 mU/L (1. trimester, 7. haftadan)',
  yedek_gebelik_disi: 'gebelik dışı aralık (kaynağın 2.–3. trimester kuralı)',
  yedek_sabit: 'ATA 2017 Öneri 26: üst sınır ~4,0 mU/L (başka aralık yokken)',
  yok: 'aralık yok (ATA 2017 2.–3. trimester için sayı vermez)',
}
export const TIROID_TAKIP_ETIKET: Readonly<Record<string, string>> = {
  tsh_kontrol: 'TSH kontrolü', tsh_ek: 'TSH kontrolü (30. hafta civarı, ATA Öneri 33)', postpartum_tft: 'Postpartum tiroid testi (doğumdan sonra hafta)',
  tft_kontrol: 'FT4/TT4 + TSH kontrolü', trab: 'TRAb ölçümü penceresi',
}
export const HPV_TIP_ETIKET: Readonly<Record<string, string>> = { '2v': 'İki değerlikli (2vHPV)', '4v': 'Dört değerlikli (4vHPV)', '9v': 'Dokuz değerlikli (9vHPV)', bilinmiyor: 'Bilinmiyor' }
export const SMA_DURUM_ETIKET: Readonly<Record<string, string>> = { teklif_edilmedi: 'Önerilmedi', teklif_edildi: 'Önerildi', reddetti: 'Hasta istemedi', yapildi: 'Yapıldı' }
export const SMA_SONUC_ETIKET: Readonly<Record<string, string>> = { tasiyici: 'Taşıyıcı (laboratuvar raporu)', tasiyici_degil: 'Taşıyıcı değil (laboratuvar raporu)', belirsiz: 'Belirsiz / yorumlanamadı' }
export const SMA_ES_ETIKET: Readonly<Record<string, string>> = { istenmedi: 'İstenmedi', istendi: 'İstendi', yapildi: 'Yapıldı' }
