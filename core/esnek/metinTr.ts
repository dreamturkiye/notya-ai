/**
 * ESNEK-MUAYENE-B — Türkiye words for the Phase B screens (shadow mode, learning, autonomy, fark notu, suggestion profile,
 * "Notya sizi böyle tanıyor", time meter). Country builds inject their own object of the same type; components hold no words.
 */
import type { OzerkAlan } from './ozerklik'
import type { OneriTuru } from './oneriProfili'
import type { FarkKelimeleri } from './farkNotu'
import type { ZamanKelimeleri, TabanKaynagi } from './zamanOlcer'

export type EsnekMetinleri = {
  yerel: string
  ondalik: string
  golge: {
    baslik: string
    aciklama: string
    baslat: string
    durdur: string
    acik: string
    kapali: string
    gunluk: (toplam: number, ayni: number) => string
    gunlukBos: string
    kayan: (oran: number, not: number) => string
    teklif: string
    teklifEvet: string
    teklifHayir: string
    teklifKabul: string
    yarindan: string
    yukleBaslik: string
    yukleAlt: string
    sayfalarOkundu: string
    sekreterNotu: string
    sekreterNotuYer: string
    beyanDk: string
    gonder: string
    gonderildi: string
    karsilastiriliyor: string
    hastaSec: string
    ayrinti: string
    durum: Record<'ayni' | 'farkli' | 'eksik' | 'fazla', string>
    neden: Record<'taraf' | 'olumsuzluk' | 'sayi' | 'okunamadi', string>
    notya: string
    sekreter: string
  }
  ogrenme: {
    haftalik: string
    haftalikBos: string
    geriAl: string
    geriAlindi: string
    sozluk: (kisaltma: string, anlam: string) => string
    bolumSirasi: (etiketler: string) => string
    planNumarali: string
    planTire: string
  }
  ozerklik: {
    baslik: string
    basamak: Record<0 | 1 | 2 | 3, string>
    basamakAlt: Record<0 | 1 | 2 | 3, string>
    alan: Record<OzerkAlan, string>
    durum: Record<'otomatik' | 'yesil' | 'sari' | 'taslak', string>
    tekDokunus: string
    bakilacak: (n: number) => string
    asagi: string
    korumaliNot: string
    b3Teklif: string
    b3Evet: string
    b3Kapat: string
    topluBaslik: string
    topluAlt: string
    topluBos: string
    ac: string
    acildi: string
    gordum: string
    topluOnayla: (n: number) => string
    topluOnaylandi: (n: number) => string
    topluHata: string
    korumaliOnayla: string
    gidilecek: string
  }
  fark: {
    baslik: string
    alt: string
    yer: string
    oncekiYok: string
    onizle: string
    kaydet: string
    kaydedildi: string
    notaGit: string
    sayim: (d: number, a: number, y: number) => string
    kelimeler: FarkKelimeleri
    tarih: (iso: string) => string
  }
  oneri: {
    tur: Record<OneriTuru, string>
    sessizler: (n: number) => string
    gizle: string
    durum: Record<'sessiz' | 'one_cikar' | 'normal', string>
    sessizeAl: string
    gosterYeniden: string
  }
  tanima: {
    baslik: string
    alt: string
    calisma: string
    sekil: Record<'kagit' | 'ses' | 'karma', string>
    sekilYok: string
    onay: string
    onayGunSonu: (saat: string) => string
    onayAnlik: string
    onayYok: string
    kisaltmalar: string
    kisaltmaYok: string
    uslup: string
    uslupYok: string
    oneriler: string
    oneriYok: string
    ozerklik: string
    golge: string
    zaman: string
    duzelt: string
    unut: string
    kaydet: string
    vazgec: string
    degistir: string
    elNotuEkle: string
    elNotuAlt: string
    bildirim: (n: number) => string
    bildirimAc: string
    kapat: string
    topluOnayaGec: string
  }
  zaman: ZamanKelimeleri & { tabanKaynagi: Record<TabanKaynagi, string>; tabanIste: string; haftalik: string; gunluk: string }
  hata: string
}

/** Turkish possessive-accusative suffix after a number written in digits ("15'ini", "18'ini", "3'ünü", "20'sini"). */
export function sayiEkiTr(n: number): string {
  const birler = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz']
  const onlar = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan']
  const m = Math.abs(Math.trunc(n))
  const kelime = m === 0 ? 'sıfır' : m % 10 ? birler[m % 10] : m % 100 ? onlar[(m % 100) / 10] : m % 1000 ? 'yüz' : 'bin'
  const unlu = [...kelime].reverse().find((c) => 'aeıioöuü'.includes(c)) || 'e'
  const h = 'ei'.includes(unlu) ? 'i' : 'aı'.includes(unlu) ? 'ı' : 'ou'.includes(unlu) ? 'u' : 'ü'
  const sonUnlu = 'aeıioöuü'.includes(kelime[kelime.length - 1])
  return `${sonUnlu ? 's' : ''}${h}n${h}`
}

const tarihTr = (iso: string) => { try { return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }) } catch { return iso.slice(0, 10) } }

export const ESNEK_TR: EsnekMetinleri = {
  yerel: 'tr-TR',
  ondalik: ',',
  golge: {
    baslik: 'Gölge mod',
    aciklama: 'İlk hafta hiçbir şey değişmez: sekreteriniz sayfaları yükler ve kendi yazdığı notu yapıştırır; Notya kendi notunu sayfalardan hazırlar, ikisini içerik düzeyinde karşılaştırır ve sizin biçiminizi öğrenir. Size günde tek satır gösterilir.',
    baslat: 'Gölge modu başlat',
    durdur: 'Gölge modu durdur',
    acik: 'Gölge mod açık',
    kapali: 'Gölge mod kapalı',
    gunluk: (t, a) => `Bugünkü ${t} notun ${a}'${sayiEkiTr(a)} sekreterinizle aynı içerikte yazdım.`,
    gunlukBos: 'Bugün henüz karşılaştırılan not yok.',
    kayan: (o, n) => `Son ${n} notta içerik uyumu %${Math.round(o * 100)}.`,
    teklif: 'Yarın sekreteriniz yazmasın, siz yalnızca onaylayın — deneyelim mi?',
    teklifEvet: 'Deneyelim',
    teklifHayir: 'Şimdi değil',
    teklifKabul: 'Tamam. Yarından itibaren sekreteriniz yalnızca sayfaları yükler; notu Notya hazırlar, siz onaylarsınız.',
    yarindan: 'Yarından itibaren: sekreter yazmıyor, siz onaylıyorsunuz.',
    yukleBaslik: 'Gölge mod — sayfalar ve sekreterin notu',
    yukleAlt: 'Sayfaları yükleyin, ardından bu hasta için yazdığınız notu yapıştırın ya da buraya yazın. Doktorun ekranında hiçbir şey değişmez.',
    sayfalarOkundu: 'Sayfalar okundu. Şimdi notunuzu ekleyin.',
    sekreterNotu: 'Sekreterin yazdığı not',
    sekreterNotuYer: 'Notu buraya yapıştırın ya da yazın',
    beyanDk: 'Bu notu yazmak yaklaşık kaç dakika sürdü? (isteğe bağlı)',
    gonder: 'Karşılaştırmaya gönder',
    gonderildi: 'Gönderildi. Notya kendi notunu hazırlayıp karşılaştıracak.',
    karsilastiriliyor: 'Karşılaştırılıyor…',
    hastaSec: 'Hasta seçin',
    ayrinti: 'Ayrıntı',
    durum: { ayni: 'Aynı', farkli: 'Farklı', eksik: 'Notya\'da yok', fazla: 'Sekreterde yok' },
    neden: { taraf: 'taraf', olumsuzluk: 'var/yok', sayi: 'sayı', okunamadi: 'okuma doğrulanmadı' },
    notya: 'Notya',
    sekreter: 'Sekreter',
  },
  ogrenme: {
    haftalik: 'Bu hafta öğrendiklerim',
    haftalikBos: 'Bu hafta yeni bir şey öğrenmedim.',
    geriAl: 'Geri al',
    geriAlindi: 'Geri alındı',
    sozluk: (k, a) => `"${k}" yazdığınızda "${a}" olarak okuyorum.`,
    bolumSirasi: (e) => `Bölüm sırası: ${e}`,
    planNumarali: 'Plan maddelerini numaralı yaz',
    planTire: 'Plan maddelerini tire ile yaz',
  },
  ozerklik: {
    baslik: 'Alan alan özerklik',
    basamak: { 0: 'B0 · Taslak', 1: 'B1 · Vurgulu', 2: 'B2 · Tek dokunuş', 3: 'B3 · Günlük toplu onay' },
    basamakAlt: { 0: 'Her alanı gözden geçirirsiniz.', 1: 'Yeşil alanlar güvenli; yalnız sarılara bakın.', 2: 'Son 20 notta düzeltmediğiniz alan otomatik kabul edilir.', 3: 'Notları gün sonunda açıp toplu onaylarsınız.' },
    alan: { basvuruYakinmasi: 'Başvuru yakınması', subjektif: 'Anamnez', objektif: 'Muayene', degerlendirme: 'Değerlendirme', plan: 'Plan', hastaOzeti: 'Hasta özeti', alarm_bulgulari: 'Evde dikkat', vitaller: 'Vitaller', content_tetkikler: 'Tetkikler', content_asilar: 'Aşılar', content_ilaclar: 'İlaçlar ve dozlar', icd10_codes: 'Tanı kodları' },
    durum: { otomatik: 'otomatik kabul', yesil: 'güvenli', sari: 'bakın', taslak: 'taslak' },
    tekDokunus: 'Bu not tek dokunuşla onaylanabilir: yeşil alanlar kabul edildi, yalnız sarı satırlara bakın.',
    bakilacak: (n) => `${n} alana bakmanız gerekiyor.`,
    asagi: 'Bir basamak indir',
    korumaliNot: 'İlaç/doz, sağ/sol, alerji, tanı kodu, e-Reçete ve raporlar hiçbir basamakta otomatik değildir.',
    b3Teklif: 'Son 40 notta temel alanları düzeltmediniz. Notları gün sonunda açıp toplu onaylamak ister misiniz?',
    b3Evet: 'Toplu onayı aç',
    b3Kapat: 'Toplu onayı kapat',
    topluBaslik: 'Günlük toplu onay',
    topluAlt: 'Her notu açın; sarı satırları (ilaç/doz, sağ/sol, alerji, tanı kodu) tek tek işaretleyin, sonra açtıklarınızı birlikte onaylayın.',
    topluBos: 'Toplu onaya uygun bekleyen not yok.',
    ac: 'Notu aç',
    acildi: 'Açıldı',
    gordum: 'Gördüm',
    topluOnayla: (n) => `Açılan ${n} notu onayla`,
    topluOnaylandi: (n) => `${n} not onaylandı.`,
    topluHata: 'Bazı notlar onaylanamadı; tek tek açın.',
    korumaliOnayla: 'Önce sarı satırları işaretleyin.',
    gidilecek: 'Tek tek incele',
  },
  fark: {
    baslik: 'Kontrol: yalnız değişeni yazın',
    alt: 'Önceki muayeneyi biliyorum. Değişeni yazın (ör. "taş ↓, ağrı Ø, sialendoskopi 12.12"); değişmeyenleri değişmedi olarak, değişenleri vurgulu yazarım. Hiçbir şey eklemem.',
    yer: 'Örn. taş ↓, ağrı Ø, sialendoskopi 12.12',
    oncekiYok: 'Bu hastanın onaylı önceki muayenesi yok.',
    onizle: 'Önizle',
    kaydet: 'Kontrol notunu oluştur',
    kaydedildi: 'Kontrol notu taslak olarak oluşturuldu.',
    notaGit: 'Notu aç',
    sayim: (d, a, y) => `${d} değişen · ${a} değişmeyen · ${y} yeni`,
    kelimeler: {
      degisim: { azaldi: 'azalmış', artti: 'artmış', yok: 'yok', var: 'var', ayni: 'değişmemiş', normal: 'normal' },
      onceki: (m) => `(önceki muayene: ${m})`,
      degisen: 'Değişen',
      degismeyen: (t) => `Önceki muayeneye (${t}) göre değişmeyen`,
      yeni: 'Bu kontrolde yeni',
      hekiminNotu: 'Kontrolde (hekimin notu)',
    },
    tarih: tarihTr,
  },
  oneri: {
    tur: { guvenlik: 'Güvenlik uyarısı', ayirici_tani: 'Ayırıcı tanı', tetkik: 'Tetkik', tedavi: 'Tedavi', recete: 'Reçete önerisi', takip: 'Takip', sevk: 'Sevk / konsültasyon', hasta_egitimi: 'Hasta bilgilendirme', kilavuz: 'Kılavuz notu', diger: 'Diğer' },
    sessizler: (n) => `Genelde kullanmadığınız ${n} öneri gizlendi — göster`,
    gizle: 'Gizle',
    durum: { sessiz: 'sessize alındı', one_cikar: 'öne çıkıyor', normal: 'normal' },
    sessizeAl: 'Sessize al',
    gosterYeniden: 'Yeniden göster',
  },
  tanima: {
    baslik: 'Notya sizi böyle tanıyor',
    alt: 'Her satır sizin kullanımınızdan öğrenildi; yanlışsa tek dokunuşla düzeltin ya da geri alın.',
    calisma: 'Çalışma şekliniz',
    sekil: { kagit: 'Kâğıda yazıyorsunuz (el notu)', ses: 'Muayeneyi kaydediyorsunuz (ses)', karma: 'Kâğıt ve ses birlikte' },
    sekilYok: 'Henüz yeterli muayene yok.',
    onay: 'Onay alışkanlığınız',
    onayGunSonu: (s) => `Notları gün sonunda onaylıyorsunuz (genelde ${s}). Size o saatte tek bildirim gösteririm.`,
    onayAnlik: 'Notları muayeneden hemen sonra onaylıyorsunuz.',
    onayYok: 'Henüz yeterli onay yok.',
    kisaltmalar: 'Kısaltmalarınız',
    kisaltmaYok: 'Henüz kısaltma öğrenmedim.',
    uslup: 'Yazım üslubunuz',
    uslupYok: 'Henüz üslup kuralı öğrenmedim.',
    oneriler: 'Öneri tercihleriniz',
    oneriYok: 'Henüz yeterli öneri geri bildirimi yok.',
    ozerklik: 'Alanlara göre güven basamağı',
    golge: 'Gölge mod',
    zaman: 'Zaman ölçümü',
    duzelt: 'Düzelt',
    unut: 'Unut',
    kaydet: 'Kaydet',
    vazgec: 'Vazgeç',
    degistir: 'Değiştir',
    elNotuEkle: 'El notu ekle',
    elNotuAlt: 'Kâğıda yazdığınız sayfaları çekin; notu Notya hazırlar.',
    bildirim: (n) => `Günlük onay zamanınız: ${n} not onayınızı bekliyor.`,
    bildirimAc: 'Notlara git',
    kapat: 'Kapat',
    topluOnayaGec: 'Toplu onaya geç',
  },
  zaman: {
    bugun: 'Bugün', buHafta: 'Bu hafta', hasta: 'hasta', dokumantasyon: 'dokümantasyon', once: 'önce', kazanc: 'kazanç', dk: 'dk', ondalik: ',',
    tabanKaynagi: { golge_olculen: '"önce": gölge modda sekreterinizin not başına ölçülen yazma süresi', golge_beyan: '"önce": gölge modda sekreterinizin beyan ettiği not başına süre', hekim: '"önce": ayarlarda girdiğiniz Notya öncesi not süresi' },
    tabanIste: 'Kazancı görmek için ayarlarda Notya öncesi not sürenizi girin ya da gölge modu bir hafta çalıştırın.',
    haftalik: 'Haftalık',
    gunluk: 'Günlük',
  },
  hata: 'Bir sorun oluştu, tekrar deneyin.',
}
