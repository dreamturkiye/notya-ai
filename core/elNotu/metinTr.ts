/**
 * ESNEK-MUAYENE-A — Türkiye words for the El Notu screens and the reader (the Turkish build's injected copy).
 * Country builds inject their own object of the same type (countries/<cc>/elNotu.ts); the components never hold words.
 */
import type { OkuyucuDili } from './okuyucu'
import type { KaliteNedeni, KorumaliTur, DogrulaSinif } from './tipler'

export type ElNotuMetinleri = {
  dil: OkuyucuDili
  /** BCP-47 locale for dates / numbers in this build. */
  yerel: string
  ondalik: string
  elNotuEkle: string
  elNotuAlt: string
  kameraIleCek: string
  dosyaSec: string
  sayfaEkle: string
  sayfa: string
  sayfalar: string
  hazirlaniyor: string
  okunuyor: string
  okundu: string
  gonder: string
  vazgec: string
  kapat: string
  kaydet: string
  sil: string
  tekrarCekin: string
  kalite: Record<KaliteNedeni, string>
  gizlilik: {
    kopyadaGizli: string
    baslikGerekli: string
    baslikIsaretle: string
    kimlikYokBeyan: string
    kimlikYokAciklama: string
    gizlenemedi: string
    sablonKaydedildi: string
  }
  dogrula: {
    baslik: string
    alt: string
    bos: string
    sinif: Record<DogrulaSinif, string>
    korumali: Record<KorumaliTur, string>
    dogruOkundu: string
    duzelt: string
    atla: string
    kisaltmaSoru: string
    kisaltmaYer: string
    okunamadi: string
    celiskiSec: string
    kalan: string
  }
  derle: {
    notuOlustur: string
    notOlusturuluyor: string
    kaynaklar: string
    kaynakTuru: Record<'transkript' | 'el_notu' | 'yazili_not' | 'belge' | 'sekreter_yukleme', string>
    kaynaktanGeldi: string
    yeniKaynakOnerisi: string
    dosyaOnerileri: string
    dosyayaEkle: string
    dosyaTur: Record<'alerji' | 'aliskanlik' | 'kronik' | 'surekli_ilac', string>
    eklendi: string
  }
  akis: {
    hekimeGonder: string
    kesinlestir: string
    kesinlestirildi: string
    hekimeGonderildi: string
    onayBekleyen: string
    onayBekleyenBos: string
    hazirlayan: string
    acikSoruVar: string
    korumaliAcik: string
    onayla: string
    iadeEt: string
    eRecete: string
  }
  ayar: {
    baslik: string
    hekimOnayi: string
    hekimOnayiAlt: string
    hazirlayan: string
    hazirlayanDoktor: string
    hazirlayanSekreter: string
    taban: string
    tabanAlt: string
    sozluk: string
    sozlukAlt: string
    kisaltma: string
    anlam: string
    ekle: string
    sablonlar: string
    sablonAlt: string
    sablonYok: string
    serbestSablon: string
  }
  zaman: { bugun: string; hasta: string; dokumantasyon: string; kazanc: string; dk: string; tabanIste: string }
  toplu: {
    baslik: string
    alt: string
    hastaSec: string
    eslesmedi: string
    randevuYok: string
    dosyala: string
    tamamlandi: string
  }
  gelen: { elNotuOlarak: string; muayeneSec: string; yeniMuayene: string }
  masa: { baslik: string; alt: string; okumalar: string; taslaklar: string; hastaIcinEkle: string; yalnizElNotu: string }
  hata: { genel: string; yetki: string; boyut: string }
}

export const EL_NOTU_TR: ElNotuMetinleri = {
  dil: {
    dilAdi: 'Turkish',
    cizimBasligi: 'Çizim bulguları',
    taraf: { sag: 'Sağ', sol: 'Sol', iki: 'Bilateral' },
    okunamadi: '[okunamadı]',
    bagSozcukleri: ['ve', 'ile', 'de', 'da', 'ki', 'olarak', 'yok', 'var', 'normal', 'mevcut', 'bir', 'iki', 'sağ', 'sol', 'yaş', 'kadın', 'erkek', 'veya', 'ya', 'kez', 'günde', 'hasta', 'şikayet'],
  },
  yerel: 'tr-TR',
  ondalik: ',',
  elNotuEkle: 'El notu ekle',
  elNotuAlt: 'Kağıda yazdığınız muayene notunu fotoğraflayın ya da yükleyin; Notya okur, notu hazırlar.',
  kameraIleCek: 'Kamerayla çek',
  dosyaSec: 'Dosya / PDF seç',
  sayfaEkle: 'Sayfa ekle',
  sayfa: 'Sayfa',
  sayfalar: 'sayfa',
  hazirlaniyor: 'Sayfa hazırlanıyor…',
  okunuyor: 'El yazısı okunuyor…',
  okundu: 'Okundu',
  gonder: 'Okut',
  vazgec: 'Vazgeç',
  kapat: 'Kapat',
  kaydet: 'Kaydet',
  sil: 'Sil',
  tekrarCekin: 'Tekrar çekin',
  kalite: {
    bulanik: 'Fotoğraf bulanık — telefonu sabit tutup tekrar çekin.',
    parlama: 'Parlama var — ışığın yansımadığı bir açıdan tekrar çekin.',
    karanlik: 'Fotoğraf karanlık — daha aydınlık bir yerde tekrar çekin.',
    kucuk: 'Çözünürlük düşük — sayfaya biraz yaklaşıp tekrar çekin.',
    sayfa_yok: 'Sayfa bulunamadı — kağıdın tamamı kadraja girecek şekilde tekrar çekin.',
  },
  gizlilik: {
    kopyadaGizli: 'Hasta kimliği yalnız gönderilen kopyada karartıldı; asıl sayfa dosyada.',
    baslikGerekli: 'Bu sayfada hasta kimliğinin yazıldığı bölgeyi bulamadım.',
    baslikIsaretle: 'Kimlik bölgesini işaretle',
    kimlikYokBeyan: 'Bu tür kağıtlarda kimlik yazmıyorum',
    kimlikYokAciklama: 'Bir kez söylemeniz yeter: düz kağıtlarınız kimliksiz kabul edilir; basılı bir belge yine sorulur.',
    gizlenemedi: 'Kimlik gizlenemedi, sayfa gönderilmedi. Dosyada duruyor.',
    sablonKaydedildi: 'Form şablonu kaydedildi — bir sonraki sayfada kimlik bölgesi kendiliğinden karartılır.',
  },
  dogrula: {
    baslik: 'Doğrula',
    alt: 'Emin olamadığım yerler — fotoğraftaki haliyle. Cevabınızı öğrenirim.',
    bos: 'Doğrulanacak bir şey yok.',
    sinif: { kelime: 'Okuma', kisaltma: 'Kısaltma', korumali: 'Kritik bilgi', cizim: 'Çizim', celiski: 'Kaynaklar çelişiyor' },
    korumali: { taraf: 'Sağ / sol', olumsuzluk: 'Var / yok', sayi: 'Sayı', doz: 'Doz', ilac: 'İlaç adı', alerji: 'Alerji' },
    dogruOkundu: 'Doğru',
    duzelt: 'Düzelt',
    atla: 'Okunamıyor',
    kisaltmaSoru: 'Bu kısaltma ne anlama geliyor?',
    kisaltmaYer: 'Açılımı (ör. septum deviasyonu)',
    okunamadi: 'Okunamadı',
    celiskiSec: 'Hangisi doğru?',
    kalan: 'soru kaldı',
  },
  derle: {
    notuOlustur: 'Muayene notunu oluştur',
    notOlusturuluyor: 'Not oluşturuluyor…',
    kaynaklar: 'Bu muayenenin kaynakları',
    kaynakTuru: { transkript: 'Ses kaydı', el_notu: 'El notu', yazili_not: 'Yazılı not', belge: 'Belge', sekreter_yukleme: 'Sekreter yüklemesi' },
    kaynaktanGeldi: 'Kaynağı',
    yeniKaynakOnerisi: 'Yeni kaynaktan gelen öneri (düzenlediğiniz bölüme dokunulmadı)',
    dosyaOnerileri: 'Hasta dosyasına eklensin mi?',
    dosyayaEkle: 'Dosyaya ekle',
    dosyaTur: { alerji: 'Alerji', aliskanlik: 'Alışkanlık', kronik: 'Kronik hastalık', surekli_ilac: 'Sürekli ilaç' },
    eklendi: 'Eklendi',
  },
  akis: {
    hekimeGonder: 'Hekime onaya gönder',
    kesinlestir: 'Notu kesinleştir',
    kesinlestirildi: 'Not kesinleştirildi',
    hekimeGonderildi: 'Hekimin onayına gönderildi',
    onayBekleyen: 'Onay bekleyen notlar',
    onayBekleyenBos: 'Onay bekleyen not yok.',
    hazirlayan: 'Hazırlayan',
    acikSoruVar: 'Önce doğrulama sorularını cevaplayın.',
    korumaliAcik: 'Sağ/sol, var/yok, sayı, doz, ilaç ve alerji okumaları doğrulanmadan not kesinleşmez.',
    onayla: 'Onayla',
    iadeEt: 'Sekretere geri gönder',
    eRecete: 'e-Reçete her zaman hekimin e-imzasıyla gönderilir.',
  },
  ayar: {
    baslik: 'Esnek muayene ve el notları',
    hekimOnayi: 'Sekreterin hazırladığı notlar benim onayımı beklesin',
    hekimOnayiAlt: 'Kapalıysa sekreteriniz el notlarınızdan hazırladığı notu kesinleştirebilir; kim hazırladı, kim doğruladı, kim kesinleştirdi kaydedilir. e-Reçete her zaman sizin e-imzanızla gider.',
    hazirlayan: 'El notlarımdan notu kim hazırlasın?',
    hazirlayanDoktor: 'Ben',
    hazirlayanSekreter: 'Sekreterim',
    taban: 'Notya öncesi bir muayene notu kaç dakikanızı alıyordu?',
    tabanAlt: 'Bir kez girin; günlük kazanç bu sayıya göre hesaplanır.',
    sozluk: 'Kısaltma sözlüğüm',
    sozlukAlt: 'El yazınızdaki kısaltmalar. Doğrula sorularına verdiğiniz cevaplar buraya kendiliğinden eklenir.',
    kisaltma: 'Kısaltma',
    anlam: 'Anlamı',
    ekle: 'Ekle',
    sablonlar: 'Form şablonlarım',
    sablonAlt: 'Basılı muayene formlarınız: kimlik bölgesi konumuyla karartılır, çizim bölgeleri anatomiye bağlanır.',
    sablonYok: 'Henüz şablon yok — ilk form sayfanızda kimlik bölgesini işaretlediğinizde oluşur.',
    serbestSablon: 'Düz kağıt (kimlik yazılmaz)',
  },
  zaman: { bugun: 'Bugün', hasta: 'hasta', dokumantasyon: 'dokümantasyon', kazanc: 'kazanç', dk: 'dk', tabanIste: 'Kazancı görmek için ayarlarda Notya öncesi not sürenizi girin.' },
  toplu: {
    baslik: 'Toplu el notu yükleme',
    alt: 'Günün sayfalarını bir kerede yükleyin; sayfalar bugünkü randevulara göre hastalara ayrılır.',
    hastaSec: 'Hasta seçin',
    eslesmedi: 'Hastası bulunamadı — seçin',
    randevuYok: 'Bugün randevu yok; hastayı listeden seçin.',
    dosyala: 'Hastalara dosyala ve okut',
    tamamlandi: 'Sayfalar dosyalandı ve okunuyor.',
  },
  gelen: { elNotuOlarak: 'El notu olarak dosyala', muayeneSec: 'Hangi muayeneye?', yeniMuayene: 'Bu tarihte yeni muayene' },
  masa: {
    baslik: 'El Notları',
    alt: 'Kağıda yazılan muayene notları: okunanlar, doğrulanacaklar, taslaklar ve onay bekleyenler.',
    okumalar: 'Doğrulanacak okumalar',
    taslaklar: 'Taslak notlar',
    hastaIcinEkle: 'Hasta için el notu ekle',
    yalnizElNotu: 'El notundan muayene',
  },
  hata: { genel: 'Bir sorun oluştu, tekrar deneyin.', yetki: 'Bu işlem için yetkiniz yok.', boyut: 'Sayfa çok büyük; daha küçük bir fotoğrafla deneyin.' },
}
