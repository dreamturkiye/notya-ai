// ============================================================
// NOTYA AI - Meslek Şablonları
// Tıp Dışı Meslekler için Uzmanlaşmış Şablonlar  
// ============================================================

export type LegalArea =
  | 'ceza' | 'medeni' | 'aile' | 'ticaret' | 'is'
  | 'idare' | 'icra' | 'miras' | 'gayrimenkul' | 'sigorta_hukuku' | 'genel'

export type TherapyType =
  | 'bdt' | 'psikoanalitik' | 'gestalt' | 'emdr'
  | 'aile_terapisi' | 'grup' | 'cocuk' | 'travma' | 'genel'

export type AccountingService =
  | 'vergi_danismanligi' | 'muhasebe' | 'denetim'
  | 'sgk' | 'irs_planlama' | 'konkordato' | 'genel'

export type HRMeetingType =
  | 'performans' | 'ise_alim' | 'disiplin' | 'cikis'
  | 'kariyer_planlama' | 'is_guvenligi' | 'genel'

// ============================================================
// HUKUK ALANI ŞABLONLARI
// ============================================================

export function getLegalTemplate(legalArea: LegalArea) {
  const templates: Record<LegalArea, { name: string; systemContext: string; keyFocus: string[] }> = {
    ceza: {
      name: 'Ceza Hukuku',
      systemContext: `Türk Ceza Kanunu (TCK), Ceza Muhakemesi Kanunu (CMK) ve Türkiye'nin taraf olduğu uluslararası sözleşmeler çerçevesinde değerlendir.
      
Özel dikkat edilecek alanlar:
- Suç unsurları: maddi unsur, manevi unsur, hukuka aykırılık
- Soruşturma vs kovuşturma aşaması
- Tutukluluğun devamı kriterleri
- Delil değerlendirmesi ve hukuka aykırı delil yasağı
- Uzlaşma ve etkin pişmanlık hükümleri
- Zamanaşımı süreleri
- Sanık hakları ve savunma stratejisi`,
      keyFocus: ['suç tarihleri', 'tanıklar', 'deliller', 'zamanaşımı', 'CMK maddeleri']
    },
    medeni: {
      name: 'Medeni Hukuk',
      systemContext: `Türk Medeni Kanunu (TMK) ve ilgili mevzuat çerçevesinde değerlendir.
      
Özel dikkat:
- Ehliyetsizlik halleri
- Tapu ve tescil işlemleri
- Mülkiyet uyuşmazlıkları
- Kat mülkiyeti sorunları
- Vakıf ve dernek hukuku`,
      keyFocus: ['tapu', 'mülkiyet', 'ehliyetsizlik', 'hak kazanma', 'zamanaşımı']
    },
    aile: {
      name: 'Aile Hukuku',
      systemContext: `Türk Medeni Kanunu aile hukuku hükümleri çerçevesinde değerlendir.
      
Özel hassasiyet ve dikkat:
- Boşanma davası türleri (anlaşmalı/çekişmeli)
- Velayet, nafaka, tazminat talepleri
- Mal rejimi tasfiyesi (edinilmiş mallara katılma)
- Çocuğun üstün yararı ilkesi
- Yurt dışı geçerlilik ve tanıma-tenfiz
- Müvekkile psikolojik destek önerisi`,
      keyFocus: ['çocuk velayeti', 'nafaka miktarı', 'mal beyanı', 'evlilik tarihleri', 'şiddet']
    },
    ticaret: {
      name: 'Ticaret Hukuku',
      systemContext: `Türk Ticaret Kanunu (TTK), Türk Borçlar Kanunu (TBK) çerçevesinde değerlendir.
      
Özel dikkat:
- Şirket türü seçimi ve kuruluş süreçleri
- Ortaklık uyuşmazlıkları
- Ticari sözleşmeler ve iflas
- Ticaret sicili işlemleri
- Rekabet hukuku uyumu
- Ticari alacak takibi`,
      keyFocus: ['şirket türü', 'ortaklık', 'sözleşme', 'ticaret sicili', 'rekabet']
    },
    is: {
      name: 'İş Hukuku',
      systemContext: `İş Kanunu (4857), Sendikalar Kanunu ve ilgili mevzuat çerçevesinde değerlendir.
      
Özel dikkat:
- İş sözleşmesi türleri ve fesih halleri
- Kıdem ve ihbar tazminatı hesabı
- Mobbing, iş kazası, meslek hastalığı
- SGK primleri ve eksik bildirimi
- İş mahkemesi arabuluculuk zorunluluğu
- Yıllık izin, fazla mesai hakları`,
      keyFocus: ['fesih nedeni', 'tazminat hesabı', 'ihbar süresi', 'arabuluculuk', 'SGK']
    },
    idare: {
      name: 'İdare Hukuku',
      systemContext: `İdari Yargılama Usulü Kanunu (İYUK) ve ilgili mevzuat çerçevesinde değerlendir.
      
Özel dikkat:
- İdari işlemlere itiraz süreleri (kesin 60 gün)
- İptal ve tam yargı davaları
- Yürütmeyi durdurma kararı kriterleri
- Kamu ihaleleri ve EKAP
- İmar hukuku uyuşmazlıkları
- Disiplin soruşturmaları`,
      keyFocus: ['dava açma süresi', 'idari başvuru', 'yürütme durdurma', 'yetkili mahkeme']
    },
    icra: {
      name: 'İcra ve İflas Hukuku',
      systemContext: `İcra ve İflas Kanunu (İİK) çerçevesinde değerlendir.
      
Özel dikkat:
- İcra takip türleri (ilamlı/ilamsız)
- Ödeme emri ve itiraz süreleri
- Haciz işlemleri ve sıralaması
- İflas masası ve alacak sıraları
- Konkordato süreci
- Yeniden yapılandırma`,
      keyFocus: ['takip türü', 'itiraz süresi', 'haciz önceliği', 'alacak miktarı', 'faiz']
    },
    miras: {
      name: 'Miras Hukuku',
      systemContext: `Türk Medeni Kanunu miras hükümleri çerçevesinde değerlendir.
      
Özel dikkat:
- Yasal ve atanmış mirasçılar
- Saklı pay ve tenkis davası
- Miras reddî ve süresi (3 ay)
- Tereke tespiti ve paylaşımı
- Vasiyetname geçerlilik koşulları
- Mirastan ıskat sebepleri`,
      keyFocus: ['mirasçılar', 'saklı pay', 'ret süresi', 'tereke', 'vasiyetname']
    },
    gayrimenkul: {
      name: 'Gayrimenkul Hukuku',
      systemContext: `Tapu Kanunu, İmar Kanunu ve ilgili mevzuat çerçevesinde değerlendir.
      
Özel dikkat:
- Tapu devir işlemleri ve vergileri
- İmar durumu ve yapı ruhsatı
- Kat irtifakı ve kat mülkiyeti
- Kira hukuku (6570 ve 6098 TBK)
- Tapu iptali ve tescil davaları
- Arsa payı ve düzeltme`,
      keyFocus: ['tapu senedi', 'imar durumu', 'kira bedeli', 'devir tapu harcı', 'TOKİ']
    },
    sigorta_hukuku: {
      name: 'Sigorta Hukuku',
      systemContext: `Sigorta Kanunu (5684), Karayolları Trafik Kanunu ve Türk Ticaret Kanunu sigorta hükümleri çerçevesinde.
      
Özel dikkat:
- Tazminat hesaplaması ve aktüerya
- Sigorta şirketi ret gerekçeleri
- Zorunlu sigortalar
- Hasar/kaza tutanakları
- Sigorta tahkim komisyonu`,
      keyFocus: ['poliçe no', 'hasar tarihi', 'ret gerekçesi', 'tazminat miktarı', 'sigorta tahkim']
    },
    genel: {
      name: 'Genel Hukuk Danışmanlığı',
      systemContext: 'Türk hukuku genel ilkeleri çerçevesinde değerlendir. İlgili kanun maddelerini belirt.',
      keyFocus: ['hukuki dayanak', 'süre', 'yetkili mahkeme', 'deliller', 'yapılacaklar']
    }
  }

  return templates[legalArea] || templates['genel']
}

// ============================================================
// PSİKOLOJİ/TERAPİ ŞABLONLARI
// ============================================================

export function getTherapyTemplate(therapyType: TherapyType) {
  const templates: Record<TherapyType, { name: string; systemContext: string; keyFocus: string[] }> = {
    bdt: {
      name: 'Bilişsel Davranışçı Terapi (BDT)',
      systemContext: `Beck'in BDT modeline dayalı seans notu oluştur.
      
BDT odak noktaları:
- Otomatik düşünceler ve bilişsel çarpıtmalar
- Ara inançlar ve temel inançlar (şemalar)
- ABC modeli (Antecedent-Belief-Consequence)
- Davranışsal aktivasyon
- Düşünce kaydı ve yeniden yapılandırma
- Ev ödevleri ve takibi
- Seanslar arası egzersizler`,
      keyFocus: ['otomatik düşünceler', 'bilişsel çarpıtma', 'davranış', 'ev ödevi', 'ilerleme']
    },
    psikoanalitik: {
      name: 'Psikoanalitik/Psikodinamik Terapi',
      systemContext: `Psikoanalitik kuram çerçevesinde derinlemesine seans notu oluştur.
      
Odak noktaları:
- Aktarım ve karşı aktarım
- Savunma mekanizmaları
- Erken dönem ilişki kalıpları
- Rüya içerikleri (varsa)
- Bilinçdışı içerikler
- Direnç analizı`,
      keyFocus: ['aktarım', 'savunma', 'içgörü', 'erken çocukluk', 'tekrarlayan örüntüler']
    },
    gestalt: {
      name: 'Gestalt Terapi',
      systemContext: `Gestalt terapi yaklaşımıyla seans notu oluştur.
      
Odak noktaları:
- Şimdi ve burada farkındalığı
- Tamamlanmamış işler (Zeigarnik etkisi)
- Temas ve geri çekilme döngüsü
- Boş sandalye tekniği
- Bütünleşme çalışması
- Beden farkındalığı`,
      keyFocus: ['farkındalık', 'şimdi ve burada', 'temas', 'bütünleşme', 'tamamlanmamış işler']
    },
    emdr: {
      name: 'EMDR (Göz Hareketleriyle Duyarsızlaştırma)',
      systemContext: `EMDR protokolüne uygun seans notu oluştur.
      
EMDR 8 aşama protokolü:
- Aşama ve ilerleme
- Hedef anı ve SUDS skoru
- Negatif/pozitif biliş
- VOC skoru
- Beden tarama bulguları
- Tamamlanmamış işlem
- Güvenli yer kaynağı`,
      keyFocus: ['SUDS skoru', 'hedef anı', 'VOC', 'beden tarama', 'kanal']
    },
    aile_terapisi: {
      name: 'Aile/Çift Terapisi',
      systemContext: `Sistemik aile terapisi yaklaşımıyla seans notu oluştur.
      
Odak noktaları:
- Aile/çift dinamikleri
- İletişim kalıpları
- Rol ve sınır sorunları
- Nesiller arası kalıplar
- Görev dağılımı
- Bireysel vs sistem hedefleri`,
      keyFocus: ['iletişim', 'sınırlar', 'roller', 'çatışma', 'güç dengesi']
    },
    grup: {
      name: 'Grup Terapisi',
      systemContext: `Grup terapisi seans notu oluştur.
      
Odak noktaları:
- Grup dinamikleri ve birleşiklik
- Üye etkileşimleri
- Yardımcı etkenler (umut, evrensellik, bilgi aktarımı)
- Bireysel üye ilerleme notları
- Grup süreci gözlemleri
- Grup normları`,
      keyFocus: ['grup dinamiği', 'üye gelişimi', 'liderlik', 'norm', 'süreç']
    },
    cocuk: {
      name: 'Çocuk ve Ergen Terapisi',
      systemContext: `Çocuk/ergen terapisi seans notu oluştur. Gelişimsel düzey gözetilmeli.
      
Odak noktaları:
- Oyun terapisi teknikleri kullanımı
- Gelişimsel uyum değerlendirmesi
- Ebeveyn geri bildirimi
- Okul uyumu
- Akran ilişkileri
- Aile sistemi dinamikleri
- Reşit olmayanın gizliliği (özel kurallar)`,
      keyFocus: ['gelişimsel düzey', 'ebeveyn', 'okul', 'oyun', 'güvenlik']
    },
    travma: {
      name: 'Travma Odaklı Terapi',
      systemContext: `Travma odaklı terapi seans notu oluştur.
      
Odak noktaları:
- Travma tipolojisi (Tip 1/Tip 2)
- Tetikleyiciler ve kaçınma davranışları
- Disosiyasyon belirtileri
- Güvenlik ve stabilizasyon
- Duygu düzenleme becerileri
- Travma anlatısı aşaması
- Entegrasyon`,
      keyFocus: ['güvenlik', 'tetikleyici', 'disosiyasyon', 'stabilizasyon', 'entegrasyon']
    },
    genel: {
      name: 'Genel Psikoterapi',
      systemContext: 'Genel psikoterapi ilkeleri çerçevesinde seans notu oluştur. Risk değerlendirmesi zorunludur.',
      keyFocus: ['şikayetler', 'duygudurum', 'risk', 'hedefler', 'müdahaleler']
    }
  }

  return templates[therapyType] || templates['genel']
}

// ============================================================
// MUHASEBECİ/MALİ MÜŞAVİR ŞABLONLARI
// ============================================================

export function getAccountingTemplate(serviceType: AccountingService) {
  const templates: Record<AccountingService, { name: string; systemContext: string; keyMevzuat: string[] }> = {
    vergi_danismanligi: {
      name: 'Vergi Danışmanlığı',
      systemContext: `Türk Vergi Mevzuatı çerçevesinde kapsamlı vergi danışmanlığı notu oluştur.
      
Dikkat edilecek vergi kanunları:
- Gelir Vergisi Kanunu (GVK)
- Kurumlar Vergisi Kanunu (KVK)
- KDV Kanunu
- Özel Tüketim Vergisi Kanunu
- Damga Vergisi Kanunu
- Vergi Usul Kanunu (VUK) - ceza ve uzlaşma`,
      keyMevzuat: ['GVK', 'KVK', 'KDVK', 'VUK', 'vergi daireleri mevzuatı']
    },
    muhasebe: {
      name: 'Muhasebe ve Finansal Raporlama',
      systemContext: `Türkiye Muhasebe Standartları (TMS/TFRS) ve TÜRMOB standartlarına uygun muhasebe notu.
      
Odak alanları:
- Finansal tablo hazırlama
- Dönem sonu işlemleri
- Amortisman ve değer düşüklüğü
- Stok değerleme yöntemleri
- Şüpheli alacak karşılığı
- E-fatura, e-arşiv uyumu`,
      keyMevzuat: ['TMS', 'TFRS', 'TTK', 'GİB tebliğleri']
    },
    sgk: {
      name: 'SGK ve İş Hukuku Uyumu',
      systemContext: `5510 sayılı Sosyal Sigortalar Kanunu ve İş Kanunu mevzuatı çerçevesinde değerlendir.
      
Odak alanları:
- Prim bildirimi ve ödeme
- İşçi/işveren prim oranları
- Teşvik ve destek unsurları
- Eksik gün bildirimi
- SGK denetimi hazırlığı
- E-bildirge sistemi`,
      keyMevzuat: ['5510', 'İş Kanunu 4857', 'SGK tebliğleri']
    },
    denetim: {
      name: 'Bağımsız Denetim',
      systemContext: `6102 TTK ve Bağımsız Denetim Standartları (BDS) çerçevesinde denetim notu oluştur.
      
Odak alanları:
- Denetim risk değerlendirmesi
- Maddi yanlışlık riski
- Örnekleme ve test sonuçları
- Yönetimle görüşme konuları
- Denetçi görüşü tipi
- KAYİK uygulamaları`,
      keyMevzuat: ['TTK 6102', 'BDS', 'SPK', 'KGK tebliğleri']
    },
    irs_planlama: {
      name: 'Vergi Planlaması ve Optimizasyonu',
      systemContext: `Yasal vergi avantajlarını en üst düzeyde kullanmak için kapsamlı planlama notu.
      
Odak alanları:
- Transfer fiyatlandırması
- Holding yapılanması
- Yatırım indirimi ve teşvikler
- Ar-Ge indirimi ve vergi avantajları
- Uluslararası çifte vergilendirme
- Vergi cennetleri ve treaty shopping`,
      keyMevzuat: ['KVK 32A', 'OECD BEPS', 'çifte vergi anlaşmaları', 'KGF teşvikleri']
    },
    konkordato: {
      name: 'Konkordato ve Yeniden Yapılandırma',
      systemContext: `İİK 285-309 maddeleri çerçevesinde konkordato süreç notu.
      
Odak alanları:
- Ön proje hazırlama
- Mahkeme başvuru süreci
- Geçici/kesin mühlet talepleri
- Alacaklı sınıflandırması
- Oy hesaplaması
- Tasfiye alternatifleri`,
      keyMevzuat: ['İİK 285-309', 'TMSF mevzuatı', 'banka alacakları protokolü']
    },
    genel: {
      name: 'Genel Mali Müşavirlik',
      systemContext: 'Türk mali mevzuatı çerçevesinde genel mali danışmanlık notu oluştur.',
      keyMevzuat: ['VUK', 'GVK', 'KVK', 'KDVK', 'TTK']
    }
  }

  return templates[serviceType] || templates['genel']
}

// ============================================================
// İNSAN KAYNAKLARI ŞABLONLARI
// ============================================================

export function getHRTemplate(meetingType: HRMeetingType) {
  const templates: Record<HRMeetingType, { name: string; systemContext: string; legalRefs: string[] }> = {
    performans: {
      name: 'Performans Değerlendirme Görüşmesi',
      systemContext: `Türk İş Kanunu 4857 ve şirket performans politikaları çerçevesinde performans görüşmesi notu.
      
Dikkat edilecek noktalar:
- KPI hedefleri ve gerçekleşme oranları
- Yetkinlik değerlendirmesi
- Geliştirme planı (IDP)
- Terfi/ücret artış önerisi
- Performans iyileştirme planı (PIP) kriterleri
- İş Kanunu fesih prosedürleri (gerekirse)`,
      legalRefs: ['İş Kanunu 4857', 'İş Güvencesi', 'İşe İade Davaları']
    },
    ise_alim: {
      name: 'İşe Alım Görüşmesi',
      systemContext: `İş başvurusu görüşme notunu KVKK uyumlu şekilde oluştur.
      
Dikkat edilecek noktalar:
- Aday yetkinlik değerlendirmesi
- Teknik bilgi testi sonuçları
- Mülakat soruları ve yanıtları
- Referans kontrol notları
- Ücret beklentisi ve teklif
- KVKK aydınlatma metni onayı
- Kişisel veri imhası taahhüdü`,
      legalRefs: ['KVKK', 'İş Kanunu', 'Eşit Davranma İlkesi', 'Ayrımcılık Yasağı']
    },
    disiplin: {
      name: 'Disiplin/Uyarı Görüşmesi',
      systemContext: `İş Kanunu disiplin hükümleri çerçevesinde disiplin görüşmesi tutanağı.
      
KRİTİK: İspat yükü işverende. Hukuki süreç takibi gerektirebilir.
      
Dikkat edilecek noktalar:
- Tutanakların düzenlenmesi
- Savunma alınması zorunluluğu
- Fesih halinde ihbar/kıdem hakları
- Orantılılık ilkesi
- Belgeleme standartları
- Avukata danışma gerekliliği`,
      legalRefs: ['İş Kanunu 25', 'Haklı Fesih Nedenleri', 'Kıdem Tazminatı Kanunu']
    },
    cikis: {
      name: 'Çıkış Görüşmesi',
      systemContext: `Çalışan çıkış görüşmesi notu. Veri analitiği için yapılandırılmış format.
      
Odak noktaları:
- Ayrılma nedeni (gerçek/resmi)
- Organizasyonel geri bildirimler
- Süreç/sistem sorunları
- Yönetim değerlendirmesi
- Tavsiye skoru (NPS)
- İkale sözleşmesi konuları (varsa)
- Kıdem/ihbar hesabı onayı`,
      legalRefs: ['İş Kanunu', 'İkale Sözleşmesi', 'Kıdem Tazminatı']
    },
    kariyer_planlama: {
      name: 'Kariyer Planlama/Mentorluk Görüşmesi',
      systemContext: `Çalışan gelişimi ve kariyer planlama görüşmesi notu.
      
Odak noktaları:
- Kariyer hedefleri (1-3-5 yıl)
- Güçlü yönler ve gelişim alanları
- Eğitim ve gelişim ihtiyaçları
- Terfi kriterleri ve yol haritası
- Mentor/koç desteği ihtiyacı
- Şirket içi fırsatlar`,
      legalRefs: ['Eğitim Hakkı', 'Eşit Fırsat', 'İş Sözleşmesi']
    },
    is_guvenligi: {
      name: 'İş Sağlığı ve Güvenliği Görüşmesi',
      systemContext: `6331 sayılı İş Sağlığı ve Güvenliği Kanunu çerçevesinde İSG görüşme notu.
      
Odak noktaları:
- Kaza/ramak kala bildirim
- Risk değerlendirmesi güncelleme
- Kişisel koruyucu donanım uyumu
- OSGB eğitim ve sertifika durumu
- Ramak kala analizi
- Periyodik muayene takibi`,
      legalRefs: ['6331 İSG Kanunu', 'İş Kazası Bildirimi', 'SGK İş Kazası']
    },
    genel: {
      name: 'Genel İK Görüşmesi',
      systemContext: 'İş Kanunu ve şirket politikaları çerçevesinde İK görüşme notu oluştur.',
      legalRefs: ['İş Kanunu 4857', 'KVKK', 'Eşit Davranma İlkesi']
    }
  }

  return templates[meetingType] || templates['genel']
}

// ============================================================
// TÜM MESLEKLER - ÖZET LİSTE
// ============================================================

export const PROFESSION_LIST = {
  saglik: {
    label: 'Sağlık',
    icon: '🏥',
    professions: [
      { id: 'doktor_dahiliye', label: 'Dahiliye Uzmanı', specialty: 'dahiliye' },
      { id: 'doktor_kardiyoloji', label: 'Kardiyolog', specialty: 'kardiyoloji' },
      { id: 'doktor_noroloji', label: 'Nörolog', specialty: 'nöroloji' },
      { id: 'doktor_pediatri', label: 'Pediatrist', specialty: 'pediatri' },
      { id: 'doktor_psikiyatri', label: 'Psikiyatrist', specialty: 'psikiyatri' },
      { id: 'doktor_kadin', label: 'Kadın Doğum Uzmanı', specialty: 'kadin_hastaliklari' },
      { id: 'doktor_ortopedi', label: 'Ortopedist', specialty: 'ortopedi' },
      { id: 'doktor_genel', label: 'Pratisyen Hekim', specialty: 'genel' },
      { id: 'doktor_acil', label: 'Acil Tıp Uzmanı', specialty: 'acil' },
    ]
  },
  hukuk: {
    label: 'Hukuk',
    icon: '⚖️',
    professions: [
      { id: 'avukat_ceza', label: 'Ceza Avukatı', area: 'ceza' },
      { id: 'avukat_aile', label: 'Aile Avukatı', area: 'aile' },
      { id: 'avukat_is', label: 'İş Hukuku Avukatı', area: 'is' },
      { id: 'avukat_ticaret', label: 'Ticaret Avukatı', area: 'ticaret' },
      { id: 'avukat_gayrimenkul', label: 'Gayrimenkul Avukatı', area: 'gayrimenkul' },
      { id: 'avukat_icra', label: 'İcra Avukatı', area: 'icra' },
    ]
  },
  ruh_sagligi: {
    label: 'Ruh Sağlığı',
    icon: '🧠',
    professions: [
      { id: 'psikolog_bdt', label: 'BDT Uzmanı', therapy: 'bdt' },
      { id: 'psikolog_emdr', label: 'EMDR Uzmanı', therapy: 'emdr' },
      { id: 'psikolog_aile', label: 'Aile Terapisti', therapy: 'aile_terapisi' },
      { id: 'psikolog_cocuk', label: 'Çocuk Terapisti', therapy: 'cocuk' },
      { id: 'psikolog_travma', label: 'Travma Terapisti', therapy: 'travma' },
    ]
  },
  mali_musavirlik: {
    label: 'Mali Müşavirlik',
    icon: '📊',
    professions: [
      { id: 'smm_vergi', label: 'Vergi Danışmanı', service: 'vergi_danismanligi' },
      { id: 'smm_muhasebe', label: 'Muhasebeci', service: 'muhasebe' },
      { id: 'smm_denetim', label: 'Bağımsız Denetçi', service: 'denetim' },
      { id: 'smm_sgk', label: 'SGK Uzmanı', service: 'sgk' },
    ]
  },
  ik: {
    label: 'İnsan Kaynakları',
    icon: '👥',
    professions: [
      { id: 'ik_performans', label: 'Performans Yöneticisi', meeting: 'performans' },
      { id: 'ik_ise_alim', label: 'İşe Alım Uzmanı', meeting: 'ise_alim' },
      { id: 'ik_genel', label: 'İK Uzmanı', meeting: 'genel' },
    ]
  },
  gayrimenkul: {
    label: 'Gayrimenkul',
    icon: '🏠',
    professions: [
      { id: 'emlak_alim', label: 'Satış Danışmanı', type: 'alım' },
      { id: 'emlak_kiralama', label: 'Kiralama Uzmanı', type: 'kiralama' },
    ]
  },
  sigorta: {
    label: 'Sigorta',
    icon: '🛡️',
    professions: [
      { id: 'sigorta_hayat', label: 'Hayat Sigorta Uzmanı', type: 'hayat' },
      { id: 'sigorta_kaza', label: 'Kaza Sigorta Uzmanı', type: 'kaza' },
    ]
  },
  egitim: {
    label: 'Eğitim',
    icon: '📚',
    professions: [
      { id: 'egitim_okul', label: 'Okul Danışmanı', context: 'okul' },
      { id: 'egitim_ozel', label: 'Özel Eğitim Uzmanı', context: 'ozel' },
    ]
  },
  yonetim: {
    label: 'Yönetim',
    icon: '💼',
    professions: [
      { id: 'yonetici_toplanti', label: 'Toplantı Yöneticisi', type: 'toplanti' },
      { id: 'yonetici_strateji', label: 'Strateji Danışmanı', type: 'strateji' },
    ]
  }
}

// ============================================================
// UNIFIED PROFESSION TEMPLATE GETTER
// ============================================================

export type ProfessionType = 'doktor' | 'avukat' | 'psikolog' | 'muhasebeci' | 'ik' | 'emlakci' | 'sigortaci' | 'egitimci' | 'yonetici'

export function getProfessionTemplate(
  professionType: ProfessionType,
  subType?: string
): { name: string; systemContext: string; keyFocus?: string[] } {
  switch (professionType) {
    case 'avukat':
      return getLegalTemplate((subType as LegalArea) || 'genel')
    case 'psikolog':
      return getTherapyTemplate((subType as TherapyType) || 'genel')
    case 'muhasebeci':
      return getAccountingTemplate((subType as AccountingService) || 'genel')
    case 'ik':
      return getHRTemplate((subType as HRMeetingType) || 'genel')
    default:
      return {
        name: 'Genel Profesyonel',
        systemContext: 'Profesyonel not asistanı olarak görev yap. Türkçe, net ve yapılandırılmış notlar oluştur.',
        keyFocus: ['anahtar noktalar', 'kararlar', 'eylem maddeleri', 'takip']
      }
  }
}
