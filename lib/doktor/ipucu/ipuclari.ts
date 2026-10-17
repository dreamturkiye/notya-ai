/**
 * YENI-DOKTOR-UX-2026-10 — İpucu (contextual help) copy, one entry per major section.
 *
 * Kaan's ask (2026-10-17): small, optional pop-up briefs that teach the tool in place of
 * human training — "what this screen does, what belongs here, the one next action", in
 * 2–4 short, warm, professional Turkish sentences. No feature-marketing tone.
 *
 * brans-alan-sizmasi: every section below is universal chrome shared by all ~30 branşlar,
 * so NO specialty-specific vocabulary or examples may appear here (no persentil, no veli,
 * no gebelik, no branş adı). A future branş-gated section gets its copy gated the same way
 * the section itself is gated — never by editing these universal entries.
 *
 * Country builds (us/gb/ca/au/nz/uz) do NOT import this Turkish copy — each release/<cc>
 * branch carries its own language layer (see docs/OPEN-COMMITMENTS.md, YENI-DOKTOR-UX port).
 */

export type IpucuBolumu =
  | 'ana-sayfa'
  | 'randevular'
  | 'hastalar'
  | 'hasta-dosyasi'
  | 'fotograflar'
  | 'yeni-muayene'
  | 'mesajlar'
  | 'gelen-belgeler'
  | 'raporlar'
  | 'enabiz'
  | 'araclar'
  | 'faturalama'
  | 'hasta-portali'
  | 'ayarlar'

export interface Ipucu {
  /** Kısa başlık — popover üstünde. */
  baslik: string
  /** 2–4 kısa cümle; her biri ayrı satır olarak çizilir. */
  satirlar: string[]
}

export const IPUCLARI: Record<IpucuBolumu, Ipucu> = {
  'ana-sayfa': {
    baslik: 'Ana Sayfa',
    satirlar: [
      'Güne buradan başlarsınız: bugünün randevuları, onay bekleyen notlar ve yeni mesajlar tek bakışta.',
      'Bir hastayla çalışmak için Hastalar’ı, günü planlamak için Randevular’ı açın.',
      'Soldaki menü her ekrandan aynı yerlere götürür.',
    ],
  },
  randevular: {
    baslik: 'Randevular',
    satirlar: [
      'Takviminiz burada; gün, hafta ve ay görünümleri arasında geçebilirsiniz.',
      'Yeni randevu için “+ Randevu”ya dokunun — hastayı seçin, saat çakışmasını Notya denetler.',
      'Randevudan “Muayeneyi Başlat” ile doğrudan muayeneye geçersiniz.',
    ],
  },
  hastalar: {
    baslik: 'Hastalar',
    satirlar: [
      'Tüm hasta kayıtlarınız burada — yalnızca siz görürsünüz.',
      'Ada, T.C. kimlik numarasına ya da şikâyete göre arayabilirsiniz.',
      'Bir hastaya dokununca dosyası açılır; muayene o dosyadan başlar.',
    ],
  },
  'hasta-dosyasi': {
    baslik: 'Hasta Dosyası',
    satirlar: [
      'Bu hastaya ait her şey tek dosyada: özet, muayene geçmişi, belgeler ve ilaçlar.',
      'Üstteki sekmeler bölümler arasında gezdirir.',
      'Muayeneye başlamak için “Muayeneyi Başlat” düğmesini kullanın.',
    ],
  },
  fotograflar: {
    baslik: 'Fotoğraflar',
    satirlar: [
      'Hastanın klinik fotoğrafları burada, muayenelere bağlı olarak saklanır.',
      'Yeni fotoğrafı buradan ya da muayene sonundaki ekler adımından yükleyebilirsiniz.',
      'Fotoğraflar yalnızca bu hastanın dosyasında görünür.',
    ],
  },
  'yeni-muayene': {
    baslik: 'Yeni Muayene',
    satirlar: [
      'Muayene boyunca hastayla her zamanki gibi konuşmanız yeter — Notya dinler ve not taslağını hazırlar.',
      'Kayıt bitince tahlil, görüntü gibi ekleri aynı ekranda ekleyip anında değerlendirebilirsiniz.',
      'Hiçbir not siz onaylamadan kesinleşmez.',
    ],
  },
  mesajlar: {
    baslik: 'Mesajlar',
    satirlar: [
      'Hastalarınızın Sağlığım portalından gönderdiği mesajlar burada toplanır.',
      'Ekleri görüntüleyip hastanın belgelerine kaydedebilirsiniz.',
      'Bir hastaya portal erişimi vermek için Araçlar › Hasta Portalı’nı kullanın.',
    ],
  },
  'gelen-belgeler': {
    baslik: 'Gelen Belgeler',
    satirlar: [
      'Dışarıdan gelen tahlil, rapor ve fotoğrafların giriş kapısı.',
      'Bir belgeyi buraya bırakın; Notya türünü tanır ve doğru hastanın dosyasına yerleştirmeyi önerir.',
      'Dosyalamadan önce her öneriyi siz onaylarsınız.',
    ],
  },
  raporlar: {
    baslik: 'Raporlar',
    satirlar: [
      'Muayenehanenizin sayılarla özeti: muayene sayıları, en sık yakınmalar ve tanılar.',
      'Aralığı değiştirerek haftalık ya da aylık bakabilirsiniz.',
      'Veriler yalnızca sizin kayıtlarınızdan gelir.',
    ],
  },
  enabiz: {
    baslik: 'e-Nabız',
    satirlar: [
      'e-Nabız bildirimlerini siz yaparsınız; Notya alanları kopyalamaya hazır hâlde önünüze getirir.',
      'Onaylanmış bir muayene notunu seçin, alanları tek tek aktarın.',
      'Notya sizin adınıza hiçbir resmî sisteme veri göndermez.',
    ],
  },
  araclar: {
    baslik: 'Araçlar',
    satirlar: [
      'Reçete, rapor ve kodlama gibi yardımcı araçların tümü burada.',
      'Üstteki süzgeç temel araçlarla branşınıza özel araçları ayırır.',
      'Sık kullandıklarınıza Ana Sayfa’daki hızlı erişimden de ulaşırsınız.',
    ],
  },
  faturalama: {
    baslik: 'Faturalama & Tahsilat',
    satirlar: [
      'İsteğe bağlı faturalama modülü: hizmet kataloğunuzu tanımlayın, muayene sonrası fatura kesin, tahsilatı izleyin.',
      'Önce Kurulum sekmesinden modülü açın, sonra Katalog’a hizmet ve fiyatlarınızı girin.',
      'Muayene notu onaylandıktan sonra fatura o nottan tek adımda kesilir.',
    ],
  },
  'hasta-portali': {
    baslik: 'Hasta Portalı',
    satirlar: [
      'Hastanıza Sağlığım portalı için giriş linki ve PIN üretirsiniz.',
      'Hasta portalda randevularını, ilaçlarını ve sizin uygun gördüğünüz özetleri görür; size mesaj yazabilir.',
      'PIN yalnızca bir kez gösterilir — linkle birlikte hastaya iletin.',
    ],
  },
  ayarlar: {
    baslik: 'Ayarlar',
    satirlar: [
      'Kurulum ve yönetim işleri burada: iletişim kanalları, e-Reçete bilgileri, personel erişimi ve entegrasyonlar.',
      'Günlük akışta gerekmez — bir kez ayarlayın, gerektiğinde dönün.',
      'Faturalama ve fiyat kataloğu Entegrasyonlar’ın içindedir.',
    ],
  },
}

/** Bölüm listesi — testler ve denetim için. */
export const IPUCU_BOLUMLERI = Object.keys(IPUCLARI) as IpucuBolumu[]
