/** Klinik kurulum alanlarının saf doğrulaması. Veritabanı yok. */

export type GunSaati = { acik: boolean; baslangic: string; bitis: string }
export type CalismaHaftasi = Record<string, GunSaati>

const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/

export function varsayilanHafta(): CalismaHaftasi {
  const gun = (acik: boolean): GunSaati => ({ acik, baslangic: '09:00', bitis: '18:00' })
  return { '0': gun(false), '1': gun(true), '2': gun(true), '3': gun(true), '4': gun(true), '5': gun(true), '6': gun(false) }
}

export function haftayiDogrula(hafta: CalismaHaftasi): string | null {
  for (let i = 0; i < 7; i++) {
    const g = hafta[String(i)]
    if (!g || typeof g.acik !== 'boolean') return 'Çalışma haftası eksik.'
    if (!SAAT.test(g.baslangic) || !SAAT.test(g.bitis)) return 'Saat 09:00 biçiminde olmalı.'
    if (g.acik && g.bitis <= g.baslangic) return 'Kapanış, açılıştan sonra olmalı.'
  }
  return null
}

export function vergiNoDogrula(vergiNo: string): string | null {
  const s = vergiNo.trim()
  if (!s) return null
  if (!/^\d{10}$/.test(s)) return 'Vergi numarası 10 haneli olmalı.'
  return null
}

export function klinikAdiDogrula(ad: string): string | null {
  const s = ad.trim()
  if (s.length < 2) return 'Klinik adı en az 2 karakter.'
  if (s.length > 120) return 'Klinik adı çok uzun.'
  return null
}

export type RezervasyonKurali = {
  slotDakika: number
  tamponDk: number
  minBildirimSaat: number
  maxIleriGun: number
  iptalSinirSaat: number
}

export function rezervasyonDogrula(k: RezervasyonKurali): string | null {
  if (!Number.isInteger(k.slotDakika) || k.slotDakika < 5 || k.slotDakika > 240) return 'Slot 5 ile 240 dakika arasında olmalı.'
  if (!Number.isInteger(k.tamponDk) || k.tamponDk < 0 || k.tamponDk > 120) return 'Tampon 0 ile 120 dakika arasında olmalı.'
  if (!Number.isInteger(k.minBildirimSaat) || k.minBildirimSaat < 0 || k.minBildirimSaat > 168) return 'En erken bildirim geçersiz.'
  if (!Number.isInteger(k.maxIleriGun) || k.maxIleriGun < 1 || k.maxIleriGun > 365) return 'İleri gün sayısı geçersiz.'
  if (!Number.isInteger(k.iptalSinirSaat) || k.iptalSinirSaat < 0 || k.iptalSinirSaat > 168) return 'İptal sınırı geçersiz.'
  return null
}

export function varsayilanRezervasyon(): RezervasyonKurali {
  return { slotDakika: 20, tamponDk: 0, minBildirimSaat: 2, maxIleriGun: 30, iptalSinirSaat: 24 }
}

export type WidgetAyari = { acik: boolean; baslik: string }

export function widgetDogrula(w: WidgetAyari): string | null {
  if (w.baslik.trim().length > 80) return 'Widget başlığı çok uzun.'
  if (w.acik && w.baslik.trim().length < 2) return 'Açık widget için bir başlık yazın.'
  return null
}

export type MesajAyari = { hatirlatma: boolean }

export function koltukMusaitMi(g: { kapasite: number; kullanilan: number; bekleyen: number }): boolean {
  if (!Number.isInteger(g.kapasite) || g.kapasite < 1) return false
  return g.kullanilan + g.bekleyen < g.kapasite
}

export function epostaDogrula(email: string): string | null {
  const s = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || s.length > 160) return 'E-posta geçersiz.'
  return null
}

export function paketDogrula(g: { ad: string; seans: number; ucretKurus: number }): string | null {
  if (g.ad.trim().length < 2 || g.ad.trim().length > 80) return 'Paket adı 2 ile 80 karakter arasında olmalı.'
  if (!Number.isInteger(g.seans) || g.seans < 1 || g.seans > 200) return 'Seans sayısı 1 ile 200 arasında olmalı.'
  if (!Number.isInteger(g.ucretKurus) || g.ucretKurus < 0 || g.ucretKurus > 100_000_000) return 'Ücret geçersiz.'
  return null
}

export function planDogrula(g: { ad: string; taksit: number; pesinatKurus: number }): string | null {
  if (g.ad.trim().length < 2 || g.ad.trim().length > 80) return 'Plan adı geçersiz.'
  if (!Number.isInteger(g.taksit) || g.taksit < 1 || g.taksit > 36) return 'Taksit 1 ile 36 arasında olmalı.'
  if (!Number.isInteger(g.pesinatKurus) || g.pesinatKurus < 0) return 'Peşinat geçersiz.'
  return null
}

export function odaAdiDogrula(ad: string): string | null {
  const s = ad.trim()
  if (s.length < 1 || s.length > 60) return 'Oda adı 1 ile 60 karakter arasında olmalı.'
  return null
}
