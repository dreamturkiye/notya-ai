/**
 * NOTYA-RANDEVU-14 — randevu durum geçişleri ve bir güncellemenin HANGİ alanlara dokunduğu.
 *
 * Dr. Gökhan (2026-09-17, canlı beta): bir randevuyu iptal etti, takvimde üstü çizili göründü
 * (doğru), sonra üstüne tıklayıp saatini değiştirdi ve "Güncelle"ye bastı — randevu hâlâ iptal
 * görünüyordu. Sorusu: "bu randevu nasıl yeniden aktif oluyor?" Cevap o gün itibarıyla: OLMUYORDU.
 * Saat/tür/not düzenlemesi `durum` alanına hiç dokunmaz (aşağıda da dokunmuyor — bu DOĞRU
 * davranış), ama arayüzde iptal edilmiş bir randevuyu geri açan tek bir düğme bile yoktu; iptal
 * tek yönlü bir kapıydı. Eksik olan şey durumun sessizce ezilmesi değil, REAKTİVASYON aksiyonuydu.
 *
 * Bu modül iki kararı tek yerde toplar ki arayüz ile API aynı cümleyi kursun:
 *   1. randevuGuncellemePlani() — gelen gövdenin hangi sütunları değiştirdiği (saf fonksiyon).
 *   2. randevuAksiyonlari()     — bir duruma bakınca doktora hangi düğmelerin gösterileceği.
 *
 * Çakışma kuralı: çakışma sorgusu `.neq('durum','iptal')` ile çalışır — yani İPTAL DIŞINDAKİ her
 * durum takvimde yer KAPLAR. Bundan iki sonuç çıkar ve ikisi de burada kodlu:
 *   - İptal edilmiş bir randevu yeniden aktif edilirken çakışma kontrolü ŞART: iptalden sonra o
 *     saate başka bir hasta yazılmış olabilir; kontrolsüz reaktivasyon çift kayıt üretir.
 *   - İptal durumundaki bir randevunun saatini değiştirmek çakışma kontrolü gerektirmez: iptal
 *     satırı kimsenin önünü kesmez, dolayısıyla kimse de onun önünü kesmemeli.
 */

export const RANDEVU_DURUMLARI = ['planlandi', 'onaylandi', 'tamamlandi', 'iptal', 'gelmedi'] as const

export type RandevuDurum = (typeof RANDEVU_DURUMLARI)[number]

/** İptal edilmiş bir randevu yeniden aktif edilince döndüğü durum — "henüz onaylanmadı" başlangıcı. */
export const REAKTIVASYON_DURUMU: RandevuDurum = 'planlandi'

export function gecerliDurumMu(durum: string): durum is RandevuDurum {
  return (RANDEVU_DURUMLARI as readonly string[]).includes(durum)
}

/** Bu durumdaki bir randevu takvimde yer kaplar mı (çakışma sorgusuyla birebir aynı kural)? */
export function slotKaplarMi(durum: string): boolean {
  return durum !== 'iptal'
}

export interface RandevuMevcutDurumu {
  baslangic: string
  bitis: string
  durum: string
}

export interface RandevuGuncellemeGovdesi {
  baslangic?: string
  bitis?: string
  durum?: string
  iptalNedeni?: string
  tur?: string
  notlar?: string
  hastaDurumu?: string
}

export interface RandevuGuncellemePlani {
  /** `randevular` tablosunda güncellenecek sütunlar. */
  alanlar: Record<string, unknown>
  /** null değilse bu pencere için çakışma kontrolü yapılmalı (kendisi hariç). */
  cakismaKontrolu: { baslangic: string; bitis: string } | null
  /** Doluysa istek 400 ile reddedilmeli. */
  hata: string | null
  /** İptalden aktif bir duruma dönüş — çağıran taraf kullanıcıya bunu söyleyebilsin diye. */
  reaktivasyon: boolean
}

/**
 * Bir PATCH gövdesinin randevuda neyi değiştirdiğini hesaplar. Saf: veritabanına dokunmaz,
 * yalnızca "ne yazılacak" ve "çakışma kontrolü gerekli mi" sorularını yanıtlar.
 *
 * ÖNEMLİ: `durum` gövdede YOKSA durum ALANINA DOKUNULMAZ. Saat/tür/not düzenlemesi bir randevuyu
 * ne iptal eder ne de aktif eder — iptali geri almak açık bir aksiyondur (bkz. REAKTIVASYON_DURUMU).
 */
export function randevuGuncellemePlani(
  mevcut: RandevuMevcutDurumu,
  govde: RandevuGuncellemeGovdesi
): RandevuGuncellemePlani {
  const alanlar: Record<string, unknown> = {}
  const bos = (deger: string | null | undefined) => deger?.trim() || null

  const zamanDegisti = !!(govde.baslangic || govde.bitis)
  const yeniBaslangic = govde.baslangic || mevcut.baslangic
  const yeniBitis = govde.bitis || mevcut.bitis

  if (zamanDegisti) {
    if (new Date(yeniBitis) <= new Date(yeniBaslangic)) {
      return { alanlar: {}, cakismaKontrolu: null, hata: 'Bitiş saati başlangıçtan sonra olmalıdır.', reaktivasyon: false }
    }
    alanlar.baslangic = yeniBaslangic
    alanlar.bitis = yeniBitis
    // Yeniden planlama, eski saat için gönderilmiş hatırlatmayı geçersiz kılar.
    alanlar.hatirlatma_gonderildi = false
  }

  if (govde.durum) {
    if (!gecerliDurumMu(govde.durum)) {
      return { alanlar: {}, cakismaKontrolu: null, hata: 'Geçersiz durum.', reaktivasyon: false }
    }
    alanlar.durum = govde.durum
    alanlar.iptal_nedeni = govde.durum === 'iptal' ? bos(govde.iptalNedeni) : null
  }
  if (govde.tur !== undefined) alanlar.tur = govde.tur
  if (govde.notlar !== undefined) alanlar.notlar = bos(govde.notlar)
  if (govde.hastaDurumu !== undefined) {
    alanlar.hasta_durumu = govde.hastaDurumu === 'saglikli' || govde.hastaDurumu === 'sikayetli' ? govde.hastaDurumu : null
  }

  const hedefDurum = govde.durum || mevcut.durum
  const reaktivasyon = mevcut.durum === 'iptal' && hedefDurum !== 'iptal'

  // Reaktivasyon sonrası hasta yeniden hatırlatma almalı — iptalde hatırlatma penceresi
  // kapanmış olabilir, aktif bir randevu hatırlatmasız kalmasın.
  if (reaktivasyon) alanlar.hatirlatma_gonderildi = false

  const cakismaKontrolu =
    slotKaplarMi(hedefDurum) && (zamanDegisti || reaktivasyon)
      ? { baslangic: yeniBaslangic, bitis: yeniBitis }
      : null

  return { alanlar, cakismaKontrolu, hata: null, reaktivasyon }
}

export interface RandevuAksiyonlari {
  /** İptal edilmiş randevuyu yeniden aktif et — iptalin tek çıkış kapısı. */
  aktifEt: boolean
  onayla: boolean
  tamamlandi: boolean
  gelmedi: boolean
  iptalEt: boolean
  yenidenPlanla: boolean
  sil: boolean
}

/**
 * Bir randevunun durumuna (ve bitişinin geçmişte kalıp kalmadığına) göre doktora gösterilecek
 * aksiyonlar. Gün kartı ile düzenleme modalı bunu PAYLAŞIR — hatanın çıktığı yer tam olarak bu
 * listenin iki ayrı yerde, iptal dalı eksik biçimde tekrarlanmış olmasıydı.
 */
export function randevuAksiyonlari(durum: string, gecmis: boolean): RandevuAksiyonlari {
  const iptalli = durum === 'iptal'
  const kapanmis = durum === 'tamamlandi' || durum === 'gelmedi'
  return {
    aktifEt: iptalli,
    onayla: !iptalli && durum === 'planlandi',
    tamamlandi: !iptalli && gecmis && !kapanmis,
    gelmedi: !iptalli && gecmis && !kapanmis,
    iptalEt: !iptalli,
    yenidenPlanla: true,
    sil: true,
  }
}
