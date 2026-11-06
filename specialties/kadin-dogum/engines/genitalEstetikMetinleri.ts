/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — Türkiye build: every Turkish word of the cosmetic gynaecology / genital aesthetics
 * package (KD only). The engine (lib/clinical/genitalEstetik.ts) returns keys; this file names them.
 *
 * KANIT VE KAYNAK KURALI: her kart kaynağını (kurum, belge, yıl) gösterir. Türkiye'de bu işlemlere özgü bir T.C. Sağlık
 * Bakanlığı veya TJOD tutumu bu çalışmada bulunamadı (2026-11-06 arandı): uluslararası kaynaklar "uluslararası kaynak"
 * etiketiyle gösterilir (docs/OPEN-COMMITMENTS.md GENITAL-ESTETIK-01, Kaan: TJOD görüşü). Kanıtın sınırlı olduğu yerde
 * (enerji cihazları, G-noktası dolgusu, PRP, beyazlatma) bu açıkça yazılır; hiçbir metin sonuç vaadi vermez.
 * Ölçek madde metni YOKTUR (lisans): yalnız toplam puan kaydedilir.
 */
import type { GeIslemTuru } from '@/lib/clinical/genitalEstetik'

export type GeKaynak = { kurum: string; belge: string; yil: string; tur: 'ulusal' | 'uluslararasi' }

export const GE_BOLUM_ADLARI: Record<GeIslemTuru | 'olcek' | 'foto', string> = {
  cerrahi: 'Cerrahi (ameliyat notu şablonları)', enerji: 'Enerji tabanlı seans (lazer / RF)', enjeksiyon: 'Enjeksiyon kaydı (lot izlenebilir)',
  beyazlatma: 'Genital beyazlatma seansı', olcek: 'Sonuç ölçekleri (öncesi / sonrası)', foto: 'Standart fotoğraf belgeleme',
}

export const GE_ETIKET: Record<string, Record<string, string>> = {
  endikasyon: { kozmetik: 'Kozmetik (tıbbi endikasyonsuz)', medikal: 'Tıbbi endikasyonlu (rekonstrüktif / fonksiyonel)' },
  medikalGerekce: {
    konjenital_anomali: 'Konjenital anomali', travma_onarimi: 'Travma onarımı', obstetrik_hasar_onarimi: 'Doğum hasarı onarımı', lezyon_eksizyonu: 'Lezyon eksizyonu / biyopsi',
    belgelenmis_fonksiyonel_yakinma: 'Belgelenmiş fonksiyonel yakınma', prolapsus: 'Pelvik organ prolapsusu', fgm_sonrasi_rekonstruksiyon: 'Kadın sünneti (FGM) sonrası rekonstrüksiyon',
    gsm_tedavisi: 'Menopozun genitoüriner sendromu', liken_skleroz: 'Liken skleroz', diger_tibbi: 'Diğer tıbbi neden',
  },
  modalite: { co2_lazer: 'CO2 lazer (10 600 nm)', erbiyum_yag_lazer: 'Er:YAG lazer (2 940 nm)', rf_monopolar: 'Radyofrekans — monopolar', rf_bipolar: 'Radyofrekans — bipolar', rf_fraksiyonel: 'Radyofrekans — fraksiyonel / mikroiğne', diger: 'Diğer' },
  amac: { vajinal_laksite: 'Vajinal gevşeklik ("vajinal gençleştirme")', gsm: 'Menopozun genitoüriner sendromu', stres_inkontinans: 'Stres idrar kaçırma', liken_skleroz: 'Liken skleroz', genital_beyazlatma: 'Genital beyazlatma', diger: 'Diğer' },
  enerjiBolge: { vajinal_kanal: 'Vajinal kanal', introitus: 'Vajen girişi (introitus)', vulva_labia: 'Vulva / labia', perine: 'Perine', periuretral: 'Periüretral' },
  urun: { ha_dolgu: 'Hyaluronik asit dolgu', prp: 'PRP (trombositten zengin plazma)', diger: 'Diğer enjektabl' },
  enjBolge: {
    g_noktasi_on_vajinal_duvar: 'G-noktası (ön vajen duvarı) — "G-Shot"', vajinal_duvar: 'Vajen duvarı', introitus: 'Vajen girişi', labia_majora: 'Labia majora', labia_minora: 'Labia minora',
    klitoral_baslik: 'Klitoral başlık', periuretral: 'Periüretral', perine: 'Perine', mons_pubis: 'Mons pubis',
  },
  teknik: { lineer_retrograd: 'Lineer retrograd', bolus: 'Bolus / depo', yelpaze: 'Yelpaze', mikro_damla: 'Mikro damla', diger: 'Diğer' },
  yontem: { kimyasal_peeling: 'Kimyasal peeling', topikal: 'Topikal ajan', lazer: 'Lazer' },
  beyBolge: { labia_majora: 'Labia majora', labia_minora: 'Labia minora', perine: 'Perine', perianal: 'Perianal', inguinal: 'Kasık', mons_pubis: 'Mons pubis' },
  advers: { yok: 'Yok', agri: 'Ağrı', kanama: 'Kanama', yanik: 'Yanık', skar: 'Skar', enfeksiyon: 'Enfeksiyon', disparoni: 'İlişkide ağrı', vaskuler_tikanma_suphesi: 'Damar tıkanması şüphesi', nodul: 'Nodül', asimetri: 'Asimetri', alerjik_reaksiyon: 'Alerjik reaksiyon', diger: 'Diğer' },
  reaksiyon: { yok: 'Yok', eritem: 'Kızarıklık', odem: 'Ödem', yanma_hissi: 'Yanma hissi', hiperpigmentasyon: 'Koyulaşma (hiperpigmentasyon)', hipopigmentasyon: 'Açılma (hipopigmentasyon)', vezikul_bul: 'Kabarcık / bül', enfeksiyon: 'Enfeksiyon', diger: 'Diğer' },
  olcek: { fsfi: 'FSFI — Kadın Cinsel İşlev Ölçeği', fgsis: 'FGSIS — Kadın Genital Benlik İmajı Ölçeği', vlq: 'VLQ — Vajinal Gevşeklik Sorusu', cops_l: 'COPS-L — Labioplasti için Kozmetik İşlem Tarama Ölçeği (beden algısı)' },
  asama: { oncesi: 'İşlem öncesi', sonrasi: 'İşlem sonrası', izlem: 'İzlem' },
  bant: {
    fsfi_kesim_alti: '26,55 ve altı — cinsel işlev bozukluğu aralığında (Wiegel 2005)', fsfi_kesim_ustu: '26,55 üstü',
    vlq_gevsek: 'Gevşek tarafta (1–3)', vlq_notr: 'Ne gevşek ne sıkı (4)', vlq_siki: 'Sıkı tarafta (5–7)',
    cops_l_pozitif: '40 ve üstü — beden algısı bozukluğu olasılığı', cops_l_negatif: '40 altı',
  },
  gorunum: { on_ayakta: 'Önden, ayakta', litotomi_istirahat: 'Litotomi — dinlenme', litotomi_ayrilmis: 'Litotomi — dudaklar nazikçe ayrılmış', perine: 'Perine', yakin_plan: 'Yakın plan (işlem bölgesi)' },
  lisans: { serbest: 'Serbest', 'izin-gerekli': 'Lisans / izin gerekli', ucretli: 'Ücretli lisans', belirsiz: 'Lisans durumu belirsiz', 'izin-alindi': 'İzin alındı' },
}

/** Server and form errors (keys of the engine and of the gate). */
export const GE_HATA: Record<string, string> = {
  endikasyon_yok: 'Endikasyonu seçin: kozmetik mi, tıbbi endikasyonlu mu?',
  yas_18_alti: '18 yaş altı hastada kozmetik genital işlem yapılamaz ve kaydedilemez. Tıbbi endikasyon varsa "Tıbbi endikasyonlu" seçip gerekçeyi yazın.',
  dogum_tarihi_yok: 'Hastanın doğum tarihi kayıtlı değil: kozmetik işlem için yaş doğrulanmalı. Önce doğum tarihini hasta kaydına ekleyin.',
  medikal_gerekce_yok: 'Tıbbi endikasyon için gerekçe seçin ve kendi cümlenizle açıklayın (en az 10 karakter).',
  medikal_bu_islemde_yok: 'Bu işlem yalnız kozmetik amaçlıdır; tıbbi endikasyon seçilemez.',
  tarih_gecersiz: 'Tarih GG.AA.YYYY olmalı.', metin_uzun: 'Metin çok uzun.', modalite_yok: 'Cihaz türünü seçin.', cihaz_yok: 'Cihaz marka / modelini yazın.',
  sayi_aralik_disi: 'Bir sayı geçerli aralığın dışında (yazım hatası olabilir).', amac_yok: 'Seansın amacını seçin.', bolge_yok: 'Bölge seçin.', seri_gecersiz: 'Seri toplamı seans numarasından küçük olamaz (en çok 12).',
  liste_gecersiz: 'Geçersiz seçim.', advers_aciklama_yok: 'Yan etki işaretlendi: kısaca açıklayın.', aralik_gerekli: 'Seri sürüyor: sonraki seans aralığını (14–90 gün) girin.', aralik_gecersiz: 'Aralık 14–90 gün olmalı.',
  gun_gecersiz: 'Tarih geçersiz.', urun_yok: 'Ürün türünü seçin.', urun_adi_yok: 'Ürün adını yazın.', lot_yok: 'Lot numarası zorunlu (geri çağırma için).', lot_gecersiz: 'Lot numarası harf, rakam ve - / . içerir (2–40 karakter).',
  lot_doz_iceriyor: 'Lot alanına mL veya ünite yazılmaz.', son_kullanma_gecersiz: 'Son kullanma tarihi YYYY-AA veya YYYY-AA-GG olmalı.', urun_suresi_gecmis: 'Ürünün son kullanma tarihi geçmiş: kaydedilemez.',
  teknik_yok: 'Tekniği seçin.', yontem_yok: 'Yöntemi seçin.', ajan_yok: 'Ajanı yazın.', olcek_yok: 'Ölçeği seçin.', asama_yok: 'Aşamayı seçin.', foto_onam_kapsam_yok: 'Fotoğraf onamı belgeleme amacını kapsamalı.',
  foto_onam_yok: 'Bu hasta için geçerli, ayrı bir fotoğraf onamı yok: önce fotoğraf onamını kaydedin.', gorunum_yok: 'Standart görünümü seçin.', foto_gecersiz: 'Yalnız JPEG veya PNG, en çok 3 MB.',
  ulkede_kapali: 'Bu işlem bu sürümde sunulmuyor.', kd_degil: 'Bu bölüm yalnız Kadın Hastalıkları ve Doğum içindir.',
}

/** COPS-L ≥ 40: the clinician's prompt. Blocks nothing; diagnoses nothing. */
export const GE_COPS_YONLENDIRME = 'COPS-L toplamı 40 veya üstü: beden algısı bozukluğu (BDD) olasılığı. İşlem kararından önce psikiyatri / klinik psikoloji değerlendirmesine yönlendirmeyi düşünün. Bu bir tanı değildir ve işlemi engellemez; karar hekimindir (ACOG Görüş No. 795, 2020: gerektiğinde BDD değerlendirmesi ve psikolojik değerlendirmeye yönlendirme).'

/** The licence line under every outcome measure. */
export const GE_OLCEK_NOTU = 'Ölçeğin maddeleri telif sahibine aittir ve ticari yazılımda kullanım izni henüz alınmadı: Notya madde metni göstermez. Yetkili formu hastaya kendiniz uygulayın ve TOPLAM puanı girin; öncesi / sonrası eğilim buradan izlenir.'

export const GE_KAYNAKLAR: Record<GeIslemTuru | 'olcek' | 'foto' | 'genel', GeKaynak[]> = {
  genel: [
    { kurum: 'American College of Obstetricians and Gynecologists', belge: 'Committee Opinion No. 795, Elective Female Genital Cosmetic Surgery, Obstet Gynecol 2020;135:e36–e42', yil: '2020', tur: 'uluslararasi' },
    { kurum: 'Royal College of Obstetricians and Gynaecologists', belge: 'Ethical Opinion Paper: Ethical considerations in relation to female genital cosmetic surgery (FGCS)', yil: '2013', tur: 'uluslararasi' },
    { kurum: 'T.C. Sağlık Bakanlığı', belge: 'Hasta Hakları Yönetmeliği (Resmî Gazete 01.08.1998, sayı 23420): bilgilendirme ve rıza', yil: '1998', tur: 'ulusal' },
  ],
  cerrahi: [
    { kurum: 'ACOG', belge: 'Committee Opinion No. 795 (labioplasti, klitoral başlık redüksiyonu, vajinoplasti kozmetik işlemler arasında; yüksek kaliteli etkinlik verisi yok)', yil: '2020', tur: 'uluslararasi' },
    { kurum: 'NICE', belge: 'NG123 Urinary incontinence and pelvic organ prolapse in women: management (sarkma onarımı)', yil: '2019', tur: 'uluslararasi' },
  ],
  enerji: [
    { kurum: 'U.S. Food and Drug Administration', belge: 'Energy-based devices for vaginal "rejuvenation" or vaginal cosmetic procedures: Safety Communication (30.07.2018) — bu amaçla onaylanmış / izin verilmiş cihaz yok; yanık, skar, ilişkide ağrı, süregen ağrı bildirildi', yil: '2018', tur: 'uluslararasi' },
    { kurum: 'NICE', belge: 'IPG697 Transvaginal laser therapy for urogenital atrophy (HTG582) ve IPG696 stress urinary incontinence (HTG581): yalnız araştırma kapsamında', yil: '2021', tur: 'uluslararasi' },
    { kurum: 'Therapeutic Goods Administration (Avustralya)', belge: 'Post-market review: energy-based devices used for vaginal rejuvenation — bu kullanım için kayıtlı cihaz kalmadı', yil: '2024', tur: 'uluslararasi' },
  ],
  enjeksiyon: [
    { kurum: 'ACOG', belge: 'Committee Opinion No. 795: G-noktası büyütme tıbbi endikasyonsuzdur; güvenlik ve etkinlik belirlenmemiştir', yil: '2020', tur: 'uluslararasi' },
  ],
  beyazlatma: [
    { kurum: 'ACOG', belge: 'Committee Opinion No. 795 (genital kozmetik işlemlerde kanıt eksikliği ve danışmanlık)', yil: '2020', tur: 'uluslararasi' },
  ],
  olcek: [
    { kurum: 'Rosen R, et al.', belge: 'FSFI, J Sex Marital Ther 2000;26:191–208; kesim değeri Wiegel M, et al., J Sex Marital Ther 2005;31:1–20. Türkçe uyarlama: Aygin D, Eti Aslan F, Türkiye Klinikleri J Med Sci 2005;25:393–399', yil: '2000/2005', tur: 'uluslararasi' },
    { kurum: 'Herbenick D, Reece M', belge: 'FGSIS, J Sex Med 2010. Türkçe geçerlik: Ellibeş Kaya A, et al., Int Urogynecol J 2019;30:89–99', yil: '2010/2019', tur: 'uluslararasi' },
    { kurum: 'Millheiser LS, et al.', belge: 'Vaginal Laxity Questionnaire (tek soru, 1 çok gevşek – 7 çok sıkı); biçimsel geçerlik çalışması yok (Polland A, et al., Sex Med 2021;9:100443). Doğrulanmış Türkçe çevirisi bulunamadı', yil: '2010', tur: 'uluslararasi' },
    { kurum: 'Veale D, et al.', belge: 'COPS-L, J Psychosom Obstet Gynaecol 2013;34:46–52 (toplam 0–72; ≥40 BDD olasılığı). Doğrulanmış Türkçe çevirisi bu çalışmada bulunamadı', yil: '2013', tur: 'uluslararasi' },
  ],
  foto: [
    { kurum: 'T.C. Kişisel Verileri Koruma Kanunu', belge: '6698 sayılı Kanun, md. 6 (özel nitelikli kişisel veri: sağlık)', yil: '2016', tur: 'ulusal' },
  ],
}

/** The evidence line of each card, written to the evidence — never a promise of a result. */
export const GE_KANIT: Record<GeIslemTuru, string> = {
  cerrahi: 'Kozmetik genital cerrahinin (labioplasti, klitoral başlık redüksiyonu, vajinoplasti) memnuniyet, cinsel işlev ve uzun dönem sonuçları için yüksek kaliteli kanıt sınırlıdır. Hasta bu kanıt eksikliği ve ağrı, kanama, enfeksiyon, skar, yapışıklık, his değişikliği, ilişkide ağrı ve yeniden ameliyat riskleri konusunda bilgilendirilir (ACOG 795).',
  enerji: 'KANIT SINIRLI. Vajinal "gençleştirme", gevşeklik, menopoz belirtileri veya idrar kaçırma için lazer / RF cihazlarının güvenlik ve etkinliği belirlenmemiştir: ABD FDA bu amaçla hiçbir cihaza izin vermediğini ve yanık, skar, ilişkide ağrı ile süregen ağrı bildirimlerini duyurdu (2018); NICE yalnız araştırma kapsamında kullanılmasını önerir. Hasta, cihazın bu endikasyon için onaysız olabileceği konusunda ayrıca bilgilendirilir.',
  enjeksiyon: 'KANIT SINIRLI. G-noktası dolgusu ("G-Shot") ve genital PRP için güvenlik ve etkinlik verisi yetersizdir; ACOG G-noktası büyütmeyi tıbbi endikasyonsuz ve güvenliği belirlenmemiş işlemler arasında sayar. Damar tıkanması belirtilerinde (ani şiddetli ağrı, renk değişikliği) acil değerlendirme gerekir.',
  beyazlatma: 'KANIT SINIRLI. Genital beyazlatmanın (kimyasal peeling, topikal ajan, lazer) etkinlik ve güvenliğine dair yüksek kaliteli çalışma yoktur; tahriş, yanık, kalıcı açılma veya koyulaşma olabilir. İşlem tıbbi endikasyonsuzdur ve 18 yaş altında yapılmaz.',
}

/** PATIENT INSTRUCTION SHEETS (Turkish), the clinician fills every "__". Keys: template codes and record kinds. */
export const GE_TALIMATLAR: Record<string, { baslik: string; maddeler: string[]; acil: string[] }> = {}
const ACIL_CERRAHI = ['Hızla artan şişlik veya tek tarafta büyüyen morluk', 'Durmayan veya pedi bir saatte ıslatan kanama', '38 °C ve üstü ateş, titreme', 'Kötü kokulu akıntı, yarada açılma', 'İdrar yapamama', 'Ağrı kesiciye yanıt vermeyen, artan ağrı']
const YARA_BAKIMI = [
  'İlk 48 saat, bez veya havluya sarılı soğuk uygulamayı 15–20 dakika aralıklarla yapın (doğrudan cilde koymayın).',
  'Her tuvaletten sonra bölgeyi ılık suyla durulayın, önden arkaya tamponlayarak kurulayın; parfümlü ürün kullanmayın.',
  'Dikişler kendiliğinden erir; çekmeyin, kesmeyin.',
  'Pamuklu, bol iç çamaşırı ve bol kıyafet giyin; dar pantolondan kaçının.',
  'Ağrı kesiciyi hekiminizin önerdiği şekilde kullanın.',
]
GE_TALIMATLAR.labioplasti = { baslik: 'Labioplasti sonrası bakım', maddeler: [...YARA_BAKIMI, 'Cinsel ilişki ve tampon kullanımından __ hafta kaçının.', 'Havuz, deniz ve küvet banyosundan __ hafta kaçının; duş alabilirsiniz.', 'Bisiklet, binicilik ve ağır egzersize __ hafta ara verin.', 'Şişlik birkaç hafta içinde azalır; son görünüm aylar içinde oturur.', 'Kontrol: __.'], acil: ACIL_CERRAHI }
GE_TALIMATLAR.labioplasti_klitoral = { baslik: 'Labioplasti ve klitoral başlık redüksiyonu sonrası bakım', maddeler: [...GE_TALIMATLAR.labioplasti.maddeler.slice(0, -1), 'Klitoral bölgede geçici duyarlılık artışı veya azalması olabilir; sürerse kontrolde söyleyin.', 'Kontrol: __.'], acil: ACIL_CERRAHI }
GE_TALIMATLAR.vajinoplasti_kolpoperineorafi = { baslik: 'Vajinoplasti / kolpoperineorafi sonrası bakım', maddeler: [...YARA_BAKIMI, 'Kabızlıktan kaçının: bol sıvı ve lifli beslenme; hekiminiz önerirse dışkı yumuşatıcı.', 'Ağır kaldırmaktan ve ıkınmaktan __ hafta kaçının.', 'Cinsel ilişki ve tampon kullanımından __ hafta kaçının; ilk ilişkide kayganlaştırıcı kullanın, ağrı olursa durun ve hekiminize söyleyin.', 'Havuz, deniz ve küvet banyosundan __ hafta kaçının.', 'Kontrol: __.'], acil: [...ACIL_CERRAHI, 'Vajinadan gaz veya dışkı gelmesi']}
GE_TALIMATLAR.perineoplasti_kolporafi = { baslik: 'Perineoplasti / kolporafi sonrası bakım', maddeler: GE_TALIMATLAR.vajinoplasti_kolpoperineorafi.maddeler, acil: GE_TALIMATLAR.vajinoplasti_kolpoperineorafi.acil }
GE_TALIMATLAR.labioplasti.maddeler.unshift('Bu sayfa hekiminizin size anlattıklarının yazılı özetidir; "__" yerlerini hekiminiz doldurur.')
GE_TALIMATLAR.enerji = { baslik: 'Lazer / radyofrekans seansı sonrası', maddeler: ['Birkaç gün hafif akıntı, kızarıklık veya yanma hissi olabilir.', 'Cinsel ilişki ve tampon kullanımından __ gün kaçının.', 'Havuz ve küvet banyosundan __ gün kaçının.', 'Bölgeye parfümlü ürün, kimyasal veya tahriş edici madde uygulamayın.', 'Sonraki seans: __.'], acil: ['Kabarcık, yara veya yanık görünümü', 'Artan ya da geçmeyen ağrı, ilişkide yeni başlayan ağrı', '38 °C ve üstü ateş, kötü kokulu akıntı', 'İdrar yaparken şiddetli yanma veya idrar yapamama'] }
GE_TALIMATLAR.enjeksiyon = { baslik: 'Genital enjeksiyon sonrası', maddeler: ['Birkaç gün hafif şişlik, morluk veya hassasiyet olabilir.', 'Enjeksiyon bölgesine __ gün masaj ve baskı uygulamayın.', 'Cinsel ilişkiden __ gün kaçının.', 'Havuz, sauna ve küvet banyosundan __ gün kaçının.', 'Kontrol: __ (kayıtlı kontrol tarihi).'], acil: ['Ani, şiddetli ve artan ağrı', 'Bölgede beyazlama, morarma veya ağ şeklinde renk değişikliği (damar tıkanması belirtisi olabilir)', 'Görme bozukluğu, nefes darlığı, yaygın kaşıntı veya şişlik', '38 °C ve üstü ateş, kızarıklıkla artan şişlik'] }
GE_TALIMATLAR.beyazlatma = { baslik: 'Genital beyazlatma seansı sonrası', maddeler: ['Birkaç gün kızarıklık, hafif soyulma veya yanma olabilir; kabukları koparmayın.', 'Bölgeyi yalnız ılık suyla temizleyin; parfümlü veya alkollü ürün kullanmayın.', 'Hekiminizin önerdiği nemlendirici / bariyer kremi uygulayın.', 'Cinsel ilişki, tıraş ve ağda için __ gün bekleyin.', 'Kontrol: __.'], acil: ['Kabarcık, yara veya akıntılı alan', 'Artan kızarıklık, ateş', 'Belirgin koyulaşma veya beyaz lekelenme'] }

/** Short card copy (commercial, no named people, no benchmark sites). */
export const GE_KART = {
  baslik: 'Genital Estetik',
  alt: 'Kozmetik jinekoloji kayıtları — yalnız Kadın Hastalıkları ve Doğum. Her kayıt endikasyon (kozmetik / tıbbi) taşır; 18 yaş altında kozmetik işlem kaydedilemez.',
  yasKilidi: '18 yaş altı: kozmetik genital işlemler kilitli. Tıbbi endikasyonlu işlemler gerekçeyle kaydedilebilir.',
  himen: 'Himenoplasti bu pakette yoktur.',
  fotoUyari: 'Fotoğraflar ayrı, şifreli bir alanda saklanır: listede küçük resim yoktur, tıklanana kadar bulanıktır, her görüntüleme denetim kaydına yazılır, hiçbir yapay zekâ değerlendirmesine gönderilmez ve dışa aktarıma girmez.',
  fotoOnamMetni: 'Hasta, genital bölge fotoğraflarının yalnız tıbbi kayıt ve tedavi takibi amacıyla çekilmesine, şifreli olarak saklanmasına ayrıca ve açıkça onay verdi. Fotoğraflar yapay zekâya gönderilmez ve hastanın ayrıca onayı olmadan eğitim / yayın amacıyla kullanılmaz.',
  ulusalNot: 'Türkiye için bu işlemlere özgü Sağlık Bakanlığı / TJOD tutumu bulunamadı; gösterilen kaynaklar uluslararasıdır.',
}
