/**
 * NOTYA-COZGER-TAKIP-01 — ÇÖZGER (Çocuklar İçin Özel Gereksinim Değerlendirmesi Raporu) TAKİP.
 * Araçlar → Hasta Raporları → Çocuk Hasta Raporları ile AYNI alt bölüm/ekran (brief: "do not create
 * a new top-level section"). Pediatri + Çocuk Cerrahisi dışında anlamlı değil — AYNI gate olan
 * `cocukHastaRaporuBransiMi` (lib/doktor/belgeTurleri.ts) burada da kullanılır, ikinci bir kapı icat
 * edilmez.
 *
 * KAPSAM ARAŞTIRMASI (bu işin başında doğrulandı — 20.02.2019 tarihli, RG 30692 sayılı "Çocuklar
 * İçin Özel Gereksinim Değerlendirmesi Hakkında Yönetmelik", lexpera.com.tr + aile.gov.tr üzerinden
 * okunan birincil metin):
 *   - Madde 6/1: çok branşlı başvurularda kurul en az 6 daimi üyeden oluşur (başkan + ÇÖZGER yetkili
 *     hekimi + çocuk sağlığı, göz, KBB, ÇOCUK CERRAHİSİ, çocuk nörolojisi, çocuk ve ergen psikiyatrisi,
 *     fizik tedavi, ortopedi dallarından en az 4 uzman hekim).
 *   - Madde 6/6: tek branşlı başvurularda ilgili daldan en az 3 uzman + ÇÖZGER yetkili hekimi (alan
 *     çocuk sağlığıysa en az 2 uzman + ÇÖZGER yetkili hekimi).
 *   - Madde 7/2: rapor, ancak kurulu madde 6'daki şekilde oluşturabilen, Sağlık Bakanlığı'nca
 *     yetkilendirilmiş kurumlarca düzenlenir; yetkisiz kurumdan/kurul oluşturamayan kurumdan gelen
 *     raporlar kabul edilmez.
 *   -> SONUÇ: tek bir hekim (özel muayenehane/Notya dahil) resmi ÇÖZGER raporunu TEK BAŞINA
 *      düzenleyemez — görev brifinginin "tracking" (takip), "generation" (üretim) değil vurgusu
 *      regülasyonun birincil metniyle doğrulanmıştır. GÜVEN DÜZEYİ: yüksek — doğrudan yönetmeliğin
 *      ilgili maddeleri okunarak teyit edildi (iki ayrı kaynaktan, lexpera.com.tr ve aile.gov.tr,
 *      aynı madde numaralarıyla); yönetmeliğin EK-1/EK-2/EK-3 (rapor formu, değerlendirme kılavuzu,
 *      düzey tablosu) sayfa metninde değil yalnız ayrı PDF ekinde olduğundan, bu dosyadaki metinsel
 *      düzey kataloğu (COZGER_DUZEYLERI) EK-3'ün birebir kopyası değil, madde 15/1'de adı geçen üç
 *      düzey + "saptanmadı" sonucunun serbest-metin karşılığıdır.
 *   - Madde 6/1 çocuk cerrahisini kurul üyesi branşlar arasında açıkça saydığı için bu takip özelliği
 *     Çocuk Hasta Raporları ile AYNI branş kapısını (pediatri + çocuk cerrahisi) kullanır — ayrıca
 *     bir genişletme/daraltma gerekmez.
 *   - Madde 8/f: rapora "%" engel oranı YAZILMAZ — EK-3 düzey tablosuna göre metinsel düzey kullanılır.
 *     Bu yüzden `sonuc_duzeyi` hep metinsel bir katalog değeridir, hiçbir ekranda sayısal oran alanı
 *     yoktur/olmamalıdır.
 *   - Madde 11: rapor "sürekli" ya da "süreli"dir; süreli ise geçerlilik süresi belirtilir — bu
 *     dosyadaki `gecerlilik_tipi` + `gecerlilik_bitis_tarihi` ve yenileme hatırlatma hesaplaması
 *     buradan gelir.
 *   - Madde 8/ğ: sistem numarası olmayan rapor geçersizdir — `rapor_no` bu numarayı (hekim resmi
 *     raporu aldığında) saklamak içindir, Notya'nın ürettiği bir numara DEĞİLDİR.
 *
 * Referans/esinlenme (üzerine İNŞA EDİLMEDİ — brief'in standing talimatı): origin/feat/pediatri-okul-
 * raporlari dalındaki cozger-takip sayfası ve 151_okul_cozger_raporlari.sql okunmuştur. O dal tüm
 * branşlara açık (ORTAK_DOKTOR_ARACLARI) + kurul üyeleri arası paylaşımlı "katkı" tablosu (çok-doktor
 * mimarisi) kuruyordu; bu iş ise brief'in istediği daha dar kapsamı izler: pediatri+çocuk cerrahisi
 * branş kapısı, var olan Hasta Raporları ekranı, tek-doktor hasta-izolasyon deseni (hastaSahibiMi) —
 * kurul üyeleri arası paylaşım bu sürümün kapsamı DIŞINDADIR (OPEN, bkz. docs/OPEN-COMMITMENTS.md).
 */
import { veliOnamGerekliMi } from '@/lib/specialties/kapsam'

export type CozgerDurum =
  | 'hazirlik'
  | 'basvuru_yapildi'
  | 'heyet_tarihi_belli'
  | 'sonuc_bekleniyor'
  | 'sonuclandi'
  | 'itiraz_sureci'

export const COZGER_DURUMLARI: ReadonlyArray<{ id: CozgerDurum; etiket: string }> = [
  { id: 'hazirlik', etiket: 'Hazırlık (bulgu/belge toplanıyor)' },
  { id: 'basvuru_yapildi', etiket: 'Başvuru yapıldı' },
  { id: 'heyet_tarihi_belli', etiket: 'Heyet değerlendirme tarihi belli' },
  { id: 'sonuc_bekleniyor', etiket: 'Heyet değerlendirmesi yapıldı, sonuç bekleniyor' },
  { id: 'sonuclandi', etiket: 'Rapor sonuçlandı' },
  { id: 'itiraz_sureci', etiket: 'İtiraz sürecinde' },
]

export function cozgerDurumGecerliMi(v: string | null | undefined): v is CozgerDurum {
  return COZGER_DURUMLARI.some((d) => d.id === v)
}

/**
 * Madde 15/1'de adı geçen üç düzey + kurulun "özel gereksinim yok" sonucunun metinsel karşılığı.
 * Madde 8/f: "%" oranı asla yazılmaz — bu katalog dışında serbest sayısal bir alan EKLENMEMELİDİR.
 */
export const COZGER_DUZEYLERI = [
  'Özel koşul gereksinimi var (ÖKGV)',
  'Belirgin ÖGV',
  'Çok ileri düzeyde ÖGV',
  'Özel gereksinim saptanmadı',
] as const
export type CozgerDuzey = (typeof COZGER_DUZEYLERI)[number]

export function cozgerDuzeyiGecerliMi(v: string | null | undefined): v is CozgerDuzey {
  return (COZGER_DUZEYLERI as readonly string[]).includes(String(v))
}

export const COZGER_GECERLILIK_TIPLERI = ['sureli', 'surekli'] as const
export type CozgerGecerlilikTipi = (typeof COZGER_GECERLILIK_TIPLERI)[number]

export function cozgerGecerlilikTipiGecerliMi(v: string | null | undefined): v is CozgerGecerlilikTipi {
  return (COZGER_GECERLILIK_TIPLERI as readonly string[]).includes(String(v))
}

/** Her ekranda ve basılı çıktıda SABİT kalması gereken uyarı — asla resmi ÇÖZGER raporu gibi sunulmaz. */
export const COZGER_UYARI_METNI =
  'Bu, resmi ÇÖZGER raporu değildir ve onun yerine geçmez. Resmi ÇÖZGER raporu, "Çocuklar İçin Özel ' +
  'Gereksinim Değerlendirmesi Hakkında Yönetmelik" (RG 20.02.2019/30692) madde 6-7 uyarınca Sağlık ' +
  'Bakanlığı\'nca yetkilendirilmiş bir sağlık kurumunun ÇÖZGER sağlık kurulu tarafından düzenlenir. ' +
  'Bu ekran yalnız bu hekimin kendi hastası için süreç takibidir.'

/** 1970'den itibaren takvim günü — tarih-saat kaymasına karşı yerel gece yarısı ile ayrıştırılır. */
function yerelTarih(iso: string): Date | null {
  const d = new Date(`${iso}T00:00:00`)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Geçerlilik bitişine kalan gün — süreli değilse veya tarih yoksa null. Negatif değer süresi geçmiş
 * anlamına gelir (yenileme zaten gecikmiş).
 */
export function cozgerKalanGun(
  gecerlilikTipi: string | null | undefined,
  gecerlilikBitisIso: string | null | undefined,
  nowMs: number = Date.now()
): number | null {
  if (gecerlilikTipi !== 'sureli' || !gecerlilikBitisIso) return null
  const bitis = yerelTarih(String(gecerlilikBitisIso))
  if (!bitis) return null
  const simdi = new Date(nowMs)
  const simdiGunBasi = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate())
  const farkMs = bitis.getTime() - simdiGunBasi.getTime()
  return Math.round(farkMs / 86_400_000)
}

/** Süreli rapor eşiğe (varsayılan 60 gün) girdiyse veya süresi zaten geçtiyse true — yenileme hatırlatması. */
export function cozgerYenilemeUyarisiGerekliMi(
  gecerlilikTipi: string | null | undefined,
  gecerlilikBitisIso: string | null | undefined,
  nowMs: number = Date.now(),
  esikGun: number = 60
): boolean {
  const kalan = cozgerKalanGun(gecerlilikTipi, gecerlilikBitisIso, nowMs)
  return kalan !== null && kalan <= esikGun
}

export type CozgerTakipHasta = {
  adSoyad: string
  dogumTarihiIso: string | null
}

export type CozgerYonlendirmeDurumu = {
  durum: CozgerDurum
  kurumAdi: string | null
  heyetTarihi: string | null
}

function trTarih(iso: string): string {
  const d = yerelTarih(iso)
  return d ? d.toLocaleDateString('tr-TR') : iso
}

/**
 * Aileye verilecek, ÇÖZGER sürecine yönlendirme/bilgilendirme metni. Bu bir resmi karar/rapor DEĞİLDİR
 * — klinikBaslik her zaman "BİLGİLENDİRME" olmalı, COZGER_UYARI_METNI ayrıca `uyari` alanında sabit
 * kalır (lib/doktor/raporPdfSablonu.tsx uyarıKutu). VELI-YASAL-ONAM: "çocuğun" / "hastanın" ayrımı
 * branş değil YAŞ ile kararlaştırılır — ÇÖZGER hastaları fiilen hep çocuk olsa da bu varsayım burada
 * da sabit kodlanmaz.
 */
export function cozgerYonlendirmeNotuMetni(
  hasta: CozgerTakipHasta,
  durum: CozgerYonlendirmeDurumu,
  nowMs?: number
): string {
  const konu = veliOnamGerekliMi(hasta.dogumTarihiIso, nowMs) ? 'çocuğun' : 'hastanın'
  const parcalar: string[] = [
    `Yukarıda kimlik bilgileri yazılı ${konu}, Çocuklar İçin Özel Gereksinim Değerlendirmesi Raporu (ÇÖZGER) başvuru/takip süreci kapsamında Çocuk Sağlık Kurulu değerlendirmesine yönlendirilmesi uygun görülmüştür.`,
  ]
  if (durum.kurumAdi) parcalar.push(`Yönlendirilen kurum: ${durum.kurumAdi}.`)
  if (durum.heyetTarihi) parcalar.push(`Heyet değerlendirme tarihi: ${trTarih(durum.heyetTarihi)}.`)
  const durumEtiketi = COZGER_DURUMLARI.find((d) => d.id === durum.durum)?.etiket
  if (durumEtiketi) parcalar.push(`Güncel süreç durumu: ${durumEtiketi}.`)
  return parcalar.join('\n\n')
}
