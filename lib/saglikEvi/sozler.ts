/**
 * HASTA-PORTALI-GUNLUK — every patient-facing word of the daily health home, in one place. The shared views
 * (components/doktor/portal/saglikEvi) write no word themselves: Türkiye passes this object; a country build passes its
 * own translation of the same shape (gorunum-paritesi-ulke — one look, different words). Plain, warm Turkish; no
 * diagnosis, no dose advice; the 112 line wherever something may be urgent.
 */
import type { DozDurumu, GlukozBaglami, OlcumTipi } from './tipler'

export const SAGLIK_EVI_SOZLERI = {
  selam: (dakika: number) => (dakika < 5 * 60 ? 'İyi geceler' : dakika < 11 * 60 ? 'Günaydın' : dakika < 17 * 60 ? 'İyi günler' : dakika < 22 * 60 ? 'İyi akşamlar' : 'İyi geceler'),
  tarih: (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' }),
  seriEtiket: (n: number) => (n === 1 ? 'gün' : 'gün seri'),
  seriAria: (n: number, kalkan: number) => `${n} günlük seri${kalkan ? `, ${kalkan} kalkan` : ''}`,
  kadranAria: 'Bugünün saat kadranı: ilaç saatleri ve ölçümler',
  merkezEtiket: (kalan: number) => (kalan === 0 ? 'Bugünün planı tamam' : `bugün tamamlanan`),
  halkaIlac: 'İlaç',
  halkaOlcum: 'Ölçüm',
  halkaHedef: 'Hedefte',
  hedefYok: '—',

  simdiBaslik: (saat: string) => saat,
  simdiAldim: 'Aldım',
  simdiAtladim: 'Atladım',
  simdiErtele: '30 dk ertele',
  simdiHepsiTamam: 'Bugünün ilaçları tamam',
  simdiHepsiTamamAlt: 'Harika gidiyorsunuz. Yarın sabah görüşmek üzere.',
  ilacYokBaslik: 'Bugün planlı ilacınız yok',

  hizliBaslik: 'Hızlı kayıt',
  hizliHepsi: 'Günlük',
  hizliIlk: 'İlk ölçümünüz',
  hizliGunluk: (n: number, h: number) => (h > 0 ? `Bugün ${Math.min(n, h)}/${h}` : n > 0 ? `Bugün ${n}` : 'Bugün yok'),
  fotoIleGir: 'Cihaz ekranının fotoğrafıyla gir',
  olcumYok: 'Doktorunuz bu takip için ölçüm istemedi. İlaçlarınızı işaretlemeniz yeterli.',

  dozBaslik: 'Bugünün ilaçları',
  dozHepsi: 'Doz Takvimi',
  grupAldim: (n: number) => (n > 1 ? `${n} ilacın hepsini aldım` : 'Aldım'),
  durum: { alindi: 'Alındı', atlandi: 'Atlandı', ertelendi: 'Ertelendi', bekliyor: 'Sırada', zamani: 'Şimdi', kacirildi: 'İşaretlenmedi' } as Record<DozDurumu | 'bekliyor' | 'zamani' | 'kacirildi', string>,
  hastaEkledi: 'Sizin eklediğiniz',
  kritik: 'Doktorunuz önemli dedi',
  geriAl: 'Geri al',
  gerektikceBaslik: 'Gerektiğinde',
  gerektikceVerdim: 'Verdim / Aldım',
  sonDoz: (sure: string) => `Son doz ${sure} önce`,
  sonDozYok: 'Bugün verilmedi',
  aralik: (saat: number, uygun: string) => `Doktorunuzun belirttiği en kısa aralık ${saat} saat · uygun saat ${uygun}`,

  egilimBaslik: 'Eğilimler',
  egilimYon: { yukari: 'Yükseliyor', asagi: 'Düşüyor', sabit: 'Sabit' } as Record<'yukari' | 'asagi' | 'sabit', string>,
  haftaOrt: 'Bu hafta ort.',
  onceki: (v: string) => `Önceki: ${v}`,
  egilimYok: 'Eğilim için birkaç gün ölçüm gerekir.',

  uyariBaslik: 'Size not',
  uyariTamam: 'Okudum',
  ara112: '112’yi ara',
  acilTel: '112',
  mesajYaz: 'Doktoruma yaz',

  karneBaslik: 'Sağlık Karnesi',
  karneGit: 'Karnemi aç',
  rozetSonraki: (ad: string, kalan: string) => `Sıradaki rozet: ${ad} · ${kalan}`,

  kopruBaslik: 'Doktorumla',
  randevu: 'Sıradaki randevu',
  randevuYok: 'Planlı randevu yok',
  mesajlar: 'Mesajlar',
  mesajYeni: (n: number) => `${n} okunmamış mesaj`,
  mesajYok: 'Yeni mesaj yok',
  sonZiyaret: 'Son muayene özeti',
  ziyaretYok: 'Henüz paylaşılmış muayene yok',
  sonuclar: 'Tahlil ve belgeler',
  sonucSayisi: (n: number) => (n ? `${n} sonuç ve belge` : 'Henüz sonuç yok'),
  soruBaslik: 'Kontrolde sormak istediklerim',
  soruYer: 'Örn. Öğleden sonra şekerim neden yükseliyor?',
  soruEkle: 'Ekle',
  soruSil: 'Sil',
  soruNot: 'Sorularınız kontrolden bir gün önce doktorunuzun özetine eklenir.',
  ldl: (deger: number, hedef: number, tarih: string) => `LDL kolesterol ${deger} mg/dL (${tarih}) · doktorunuzun hedefi ${hedef} altı`,

  // Entry sheet
  kaydet: 'Kaydet',
  kaydediliyor: 'Kaydediliyor…',
  kaydedildi: 'Kaydedildi',
  kapat: 'Kapat',
  zaman: { simdi: 'Şimdi', y30: '30 dk önce', y60: '1 sa önce', y120: '2 sa önce' },
  baglam: { aclik: 'Açlık', tokluk2: 'Tokluk 2. saat', yatmadan: 'Yatmadan önce', rastgele: 'Diğer' } as Record<GlukozBaglami, string>,
  buyukTansiyon: 'Büyük tansiyon',
  kucukTansiyon: 'Küçük tansiyon',
  azalt: 'Azalt',
  artir: 'Artır',
  fotoOkunuyor: 'Fotoğraf okunuyor…',
  fotoOneri: 'Fotoğraftan okunan değer. Doğruysa kaydedin; değilse düzeltin.',
  fotoOkunamadi: 'Ekrandaki değer okunamadı. Değeri elle girebilirsiniz.',
  fotoCek: 'Fotoğraf çek',
  bardakEkle: '1 bardak ekle',

  // Doz Takvimi page
  dozTakvimiBaslik: 'Doz Takvimi',
  dozTakvimiAlt: 'İlaçlarınız, saatleri ve bu haftaki düzeniniz.',
  uyum7: 'Son 7 gün',
  uyum30: 'Son 30 gün',
  uyumNot: 'Uyum, saati geçmiş dozlardan alınanların oranıdır.',
  haftaBaslik: 'Bu hafta',
  ilaclarim: 'İlaçlarım',
  saatleriDuzenle: 'Saatleri değiştir',
  saatEkle: 'Saat ekle',
  saatKaydet: 'Saatleri kaydet',
  vazgec: 'Vazgeç',
  kendiIlacim: 'Kendi ilacımı ekle',
  kendiIlacimNot: 'Doktorunuzun yazmadığı bir ilaç ya da takviye kullanıyorsanız ekleyin; doktorunuz bunu "hastanın eklediği" olarak görür.',
  ilacAdi: 'İlacın adı',
  dozMetni: 'Nasıl kullanıyorsunuz? (isteğe bağlı)',
  gerektikceSecenek: 'Yalnız gerektiğinde',
  ekle: 'Ekle',
  kaldir: 'Listeden çıkar',
  doktorYazdi: 'Doktorunuzun yazdığı ilaç: dozu doktorunuz değiştirir, saatini siz ayarlayabilirsiniz.',

  // Günlük page
  gunlukBaslik: 'Günlük Kayıt',
  gunlukAlt: 'Tek dokunuşla ölçüm kaydı. Saat ve tarih kendiliğinden yazılır.',
  sonKayitlar: 'Son kayıtlar',
  sil: 'Sil',
  kayitYok: 'Henüz kayıt yok. İlk ölçümünüzü yukarıdaki kutulardan girin.',

  // Karne page
  karneAlt: 'Düzeninizin karnesi. Rozetler alışkanlığı kutlar; sağlık değerlendirmesini doktorunuz yapar.',
  hafta: 'Bu hafta',
  ay: 'Bu ay',
  karneHafta: 'Haftalık karne',
  karneAy: 'Aylık karne',
  rozetlerim: 'Rozetlerim',
  rozetKazanildi: (tarih: string) => `Kazanıldı · ${tarih}`,
  rozetIlerleme: (d: number, h: number) => `${d}/${h}`,
  yeniRozet: 'Yeni rozet!',
  harika: 'Teşekkürler',
  yazdir: 'Yazdır / PDF',
  karneDipnot: 'Ev ölçümleri kendi cihazınızla girilir. Hedef aralığı doktorunuzun belirlediği ya da kılavuzlara göre önerilen aralıktır; tedavinizi değerlendirmek doktorunuzun işidir.',
  notYok: 'Not yok',
  seriBaslik: 'Seri',
  seriAciklama: (seri: number, enUzun: number, kalkan: number) => `${seri} gündür her gün kayıt yapıyorsunuz. En uzun seriniz ${enUzun} gün.${kalkan ? ` ${kalkan} seri kalkanınız var: bir günü kaçırırsanız seriniz bozulmaz.` : ' Her 7 günlük seri bir kalkan kazandırır.'}`,

  // Tercihler
  tercihlerBaslik: 'Bildirimler ve gizlilik',
  tercihlerAlt: 'Hatırlatmalar, sessiz saatler, görünüm ve verileriniz.',
  bildirimBaslik: 'Telefon bildirimleri',
  bildirimAcik: 'Bu cihazda açık',
  bildirimKapali: 'İlaç saatlerinde bu cihaza bildirim gönderelim.',
  bildirimAc: 'Bildirimleri aç',
  bildirimKapat: 'Bu cihazda kapat',
  bildirimDesteklenmiyor: 'Bu tarayıcı bildirim desteklemiyor. iPhone’da önce Paylaş → Ana Ekrana Ekle ile Sağlığım’ı ekleyin, sonra oradan açın.',
  bildirimReddedildi: 'Bildirim izni tarayıcı ayarlarından kapatılmış.',
  bildirimNot: 'Bildirimde ilaç adı veya ölçüm değeri yazmaz.',
  hatirlatma: 'Hatırlatmalar',
  hatirlatmaAlt: 'İlaç saatleri ve iki gün işaretlenmeyen ilaçlar için nazik hatırlatma.',
  sessizSaat: 'Sessiz saatler',
  sessizSaatAlt: 'Bu saatlerde bildirim gönderilmez.',
  buyukYazi: 'Büyük yazı',
  buyukYaziAlt: 'Bütün Sağlığım ekranlarını büyütür.',
  yuksekKontrast: 'Yüksek kontrast',
  yuksekKontrastAlt: 'Yazılar ve çizgiler daha koyu görünür.',
  paylasimBaslik: 'Doktorumla paylaşım',
  paylasimAcik: (tarih: string) => `Ev ölçümleriniz ve ilaç kayıtlarınız doktorunuzla paylaşılıyor (onay: ${tarih}).`,
  paylasimKapali: 'Ev ölçümleriniz yalnız sizde. Doktorunuz bunları görmüyor ve uyarı almıyor.',
  paylasimGeriCek: 'Paylaşımı durdur',
  paylasimVer: 'Paylaşıma onay ver',
  verilerim: 'Verilerim',
  indirJson: 'Bütün verilerimi indir (JSON)',
  indirCsv: 'Ölçümlerimi indir (CSV)',
  sil1: 'Girdiğim bütün verileri sil',
  silOnay: 'Bütün ölçümleriniz, ilaç işaretleriniz, rozetleriniz ve sorularınız kalıcı olarak silinecek. Emin misiniz?',
  silEvet: 'Evet, sil',
  silindi: 'Verileriniz silindi.',

  // Consent card (KVKK açık rıza)
  onayBaslik: 'Ölçümleriniz doktorunuzla paylaşılsın mı?',
  onayMetni: 'Sağlığım’a girdiğiniz ev ölçümleri (tansiyon, şeker, kilo, ateş vb.), ilaç işaretleriniz ve kontrol sorularınız, onay verirseniz doktorunuza ve muayenehanesinin yetkili personeline gösterilir. Belirgin bir değişiklikte doktorunuza bildirim gider ve kontrolden bir gün önce doktorunuz için özet hazırlanır. Notya bu verileri 6698 sayılı KVKK kapsamında, yalnız tedaviniz için işler. Onayınızı istediğiniz zaman bu ekrandan geri çekebilir, verilerinizi indirebilir ya da silebilirsiniz.',
  onayKutu: 'Ev ölçümlerimin ve ilaç kayıtlarımın doktorumla paylaşılmasına açık rıza veriyorum.',
  onayVer: 'Onaylıyorum',
  onaySonra: 'Şimdi değil',
  onayKvkk: 'KVKK Aydınlatma Metni',
  acilDegil: 'Sağlığım bir acil yardım hizmeti değildir. Acil durumda 112’yi arayın.',

  // BUGUN-V2 — Bugün home (one next step, day rings, game layer)
  tarihKisa: (iso: string) => { const d = new Date(iso); const o = { timeZone: 'Europe/Istanbul' } as const; return `${d.toLocaleDateString('tr-TR', { ...o, weekday: 'long' })}, ${d.toLocaleDateString('tr-TR', { ...o, day: 'numeric', month: 'long' })}` },
  seriKisa: 'gün',
  ve: 've',
  siradakiIlac: 'Sıradaki ilaç',
  siradakiOlcum: 'Sıradaki ölçüm',
  kalan: (dk: number) => (dk <= 0 ? 'Şimdi zamanı' : dk < 60 ? `${dk} dk sonra` : `${Math.floor(dk / 60)} sa${dk % 60 ? ` ${dk % 60} dk` : ''} sonra`),
  ertelendiAlt: 'Ertelendi · birazdan yeniden hatırlatırız',
  aldimGrup: (n: number) => (n === 2 ? 'İkisini de aldım' : n > 2 ? `${n} ilacın hepsini aldım` : 'Aldım'),
  olcumCumle: (ad: string) => `${ad} ölçümü`,
  olcumAlt: (y: number, h: number) => `Bugün ${y}/${h} · tek dokunuşla girin`,
  olcumGir: 'Şimdi ölç',
  planTamam: 'Bugünün planı tamam',
  planTamamAlt: 'Hepsini işaretlediniz. Yarın görüşmek üzere.',
  planBos: 'Bugün için planlı bir şey yok',
  planBosAlt: 'İsterseniz aşağıdan bir ölçüm ekleyebilirsiniz.',
  eksik: (saat: string) => `${saat} dozu işaretlenmedi`,
  digerSecenek: 'Diğer seçenekler',
  halkaAria: (parcalar: string[]) => `Bugün: ${parcalar.join(', ')}`,
  halkaAlt: {
    ilacSirada: (n: number) => `${n} sırada`,
    ilacEksik: (n: number) => `${n} işaretlenmedi`,
    olcumKalan: (n: number) => `${n} kaldı`,
    tamam: 'Tamam',
    hedef: 'son 7 gün',
    hedefBekliyor: 'birkaç ölçümden sonra',
  },
  olcumlerBaslik: 'Ölçümler',
  olcumEkleAria: (ad: string) => `${ad} ekle`,
  bugunTamam: 'Bugün tamam',
  uyariEgilim: (ad: string, yon: 'yukari' | 'asagi') => `${ad} bu hafta ${yon === 'yukari' ? 'yükseliyor' : 'düşüyor'}`,
  buHafta: 'bu hafta',
  onceki2: (v: string) => `önceki haftalarda ${v}`,
  egilimAz: 'Eğilim için birkaç gün daha ölçüm gerekiyor',
  egilimBos: 'İlk ölçümlerinizden birkaç gün sonra eğilimleriniz burada çizilir.',
  hedefBandi: 'hedef aralığı',
  oyunBaslik: 'Düzenim',
  seriBuyuk: 'gün üst üste',
  seriSifir: 'Bugün bir kayıt yapın, seriniz başlasın.',
  seriBugunBekliyor: 'Bugün bir ölçüm ya da ilaç işareti serinizi sürdürür.',
  seriBugunTamam: 'Bugünkü kaydınız serinize eklendi.',
  kalkanSayi: (n: number) => (n ? `${n} kalkan` : 'Kalkan yok'),
  kalkanNot: 'Kalkan, kaçırdığınız bir günü korur. Her 7 gün bir kalkan kazandırır.',
  haftaDuzen: 'Bu haftaki düzeniniz',
  rozetBugun: 'Bugün',
  rozetSiradaki: 'Sıradaki',
  kopruRandevuYok: 'Planlı randevu yok',
} as const

export type SaglikEviSozleri = typeof SAGLIK_EVI_SOZLERI

export const TIP_SIRASI: OlcumTipi[] = ['kb', 'glukoz', 'kilo', 'nabiz', 'spo2', 'ates', 'bel', 'su']

/** "3 sa 20 dk", "45 dk", "2 gün". */
export function sureMetni(ms: number): string {
  const dk = Math.max(0, Math.round(ms / 60000))
  if (dk < 60) return `${dk} dk`
  const sa = Math.floor(dk / 60)
  if (sa < 48) return `${sa} sa${dk % 60 ? ` ${dk % 60} dk` : ''}`
  return `${Math.floor(sa / 24)} gün`
}

/** "Az önce" under a minute, else "3 sa 20 dk önce". */
export function onceMetni(ms: number): string {
  return ms < 60_000 ? 'Az önce' : `${sureMetni(ms)} önce`
}

export function saatMetni(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
}
export function kisaTarih(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' })
}
