/**
 * NOTYA-OKUL-RAPOR-01 — İstirahat ve Geçici Hastalık Raporu (okul/kreş izin raporu).
 *
 * Standing rules (task brief, Kaan):
 *   - Tek hekim tek seferde en fazla 10 gün istirahat raporu yazabilir.
 *   - Öğrencinin bir eğitim yılındaki TOPLAM raporlu devamsızlık hakkı 20 gün — birikimli bir sayaç
 *     (tek rapor değil, yıl boyunca). 20 günü aştığında hekime UYARI verilir (engelleme değil, bilgi —
 *     karar hekimde).
 *   - e-Okul'a otomatik aktarım gerçek bir MEB/Sağlık Bakanlığı entegrasyonu gerektirir; Notya'nın bugün
 *     böyle bir API erişimi/yetkilendirmesi YOK (DERM-FORM014-BILDIRIM ile aynı desen): yazdırılabilir
 *     resmi rapor + "e-Okul'a iletildi" işaretleme kutusu (hekimin kendi okul/veli iletişimini kaydetmesi
 *     için). Bu bir canlı entegrasyon DEĞİLDİR — docs/OPEN-COMMITMENTS.md'de açıkça not edilmiştir.
 */

export const ISTIRAHAT_TEK_RAPOR_MAX_GUN = 10
export const ISTIRAHAT_YILLIK_LIMIT_GUN = 20

/** Türkiye eğitim yılı etiketi ("2026-2027"): Eylül'den itibaren yeni yıl, yoksa önceki yılın ikinci yarısı. */
export function egitimYiliEtiketi(tarihIso: string | null | undefined, nowMs?: number): string {
  const d = tarihIso ? new Date(tarihIso) : new Date(nowMs ?? Date.now())
  if (isNaN(d.getTime())) return ''
  const y = d.getUTCFullYear()
  const ay = d.getUTCMonth() + 1 // 1–12
  return ay >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

export function egitimYiliGecerliMi(v: string): boolean {
  return /^\d{4}-\d{4}$/.test(v) && Number(v.slice(5)) === Number(v.slice(0, 4)) + 1
}

export type IstirahatRaporuSatiri = { gun_sayisi: number; egitim_yili: string }

/** Aynı öğrenci için aynı eğitim yılındaki tüm raporların gün toplamı (yeni rapor dahil, çağıran ekler). */
export function egitimYiliToplamGun(raporlar: readonly IstirahatRaporuSatiri[], egitimYili: string): number {
  return raporlar
    .filter((r) => r.egitim_yili === egitimYili)
    .reduce((toplam, r) => toplam + (Number(r.gun_sayisi) || 0), 0)
}

/** 20 günlük yıllık hak aşıldı mı (bilgi amaçlı uyarı — engelleme yok, karar hekimde). */
export function yillikLimitAsildiMi(toplamGunDahilBuRapor: number): boolean {
  return toplamGunDahilBuRapor > ISTIRAHAT_YILLIK_LIMIT_GUN
}

/** 1–10 gün aralığına kilitle (tek hekim tek seferde en fazla 10 gün). */
export function gunSayisiSinirla(n: number): number {
  const r = Math.round(Number(n) || 0)
  return Math.min(ISTIRAHAT_TEK_RAPOR_MAX_GUN, Math.max(1, r))
}

/** Başlangıç tarihi + (gün sayısı − 1) → bitiş tarihi (YYYY-MM-DD, UTC takvim günü). */
export function bitisTarihiHesapla(baslangicIso: string, gunSayisi: number): string {
  const d = new Date(`${baslangicIso}T00:00:00Z`)
  if (isNaN(d.getTime())) return baslangicIso
  d.setUTCDate(d.getUTCDate() + Math.max(0, Math.round(gunSayisi) - 1))
  return d.toISOString().slice(0, 10)
}
