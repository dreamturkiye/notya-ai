/**
 * NOTYA-YAS-01 — Tek yaş biçimlendirici (pediatri hassasiyetiyle):
 * - 0-12 ay: "8 ay 3 günlük" (ay dönümünden kalan günlerle; <1 ay: "12 günlük")
 * - 12-24 ay: "18 aylık" (pediatri geleneği)
 * - 24 ay+: "5 yaşında"
 * Takvim ayı üzerinden hesaplanır (30.44 gün yaklaşıklığı değil) — gün hassasiyeti
 * bebeklerde klinik olarak anlamlıdır. Dosya sayfası, Ayşe'nin dosya bağlamı ve
 * Yazdır/PDF başlığı hepsi bunu kullanır ki yaş her yerde aynı görünsün.
 */
export function yasHesapla(dogumIso: string): string {
  const d = new Date(dogumIso)
  if (isNaN(d.getTime())) return ''
  const simdi = new Date()
  let ay = (simdi.getFullYear() - d.getFullYear()) * 12 + (simdi.getMonth() - d.getMonth())
  if (simdi.getDate() < d.getDate()) ay -= 1
  if (ay < 0) return ''
  if (ay < 12) {
    const donum = new Date(d)
    donum.setMonth(d.getMonth() + ay)
    const gun = Math.max(0, Math.floor((simdi.getTime() - donum.getTime()) / 86400000))
    if (ay === 0) return `${gun} günlük`
    return gun > 0 ? `${ay} ay ${gun} günlük` : `${ay} aylık`
  }
  if (ay < 24) return `${ay} aylık`
  return `${Math.floor(ay / 12)} yaşında`
}

/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — resmî belge yaş biçimi: "yıl + ay" (ör. "3 yaş 4 ay",
 * "0 yaş 7 ay"). `yasHesapla` konuşma diline uygundur ("8 aylık", "5 yaşında") ve resmî
 * rapor başlığında bu haliyle kalır; Çocuk Hasta Raporları'nın hasta bloğu hem yılı hem
 * ayı ayrı ayrı istediği için (spec: "Yaş (years + months for pediatric reports)") aynı
 * takvim-ayı hesabı burada ayrı bir biçimde sunulur — iki fonksiyon aynı günü sayar,
 * farklı yazar.
 */
export function yasYilAy(dogumIso: string, bugunIso?: string): string {
  const d = new Date(dogumIso)
  if (isNaN(d.getTime())) return ''
  const simdi = bugunIso ? new Date(bugunIso) : new Date()
  if (isNaN(simdi.getTime())) return ''
  let ay = (simdi.getFullYear() - d.getFullYear()) * 12 + (simdi.getMonth() - d.getMonth())
  if (simdi.getDate() < d.getDate()) ay -= 1
  if (ay < 0) return ''
  const yil = Math.floor(ay / 12)
  const kalanAy = ay % 12
  return `${yil} yaş ${kalanAy} ay`
}
