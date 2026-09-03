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
