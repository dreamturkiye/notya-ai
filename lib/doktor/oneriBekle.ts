/**
 * NOTYA-NOT-HIZ-03 — not sayfası / İnceleme: Ayşe'nin önerisi (B) not kaydedildikten SONRA gelir (lib/doktor/oneriArkaPlan).
 * Not yeni (≤ 3 dk) ve öneri alanları boşsa sayfa notu her 4 sn'de bir yeniden okur, en çok 90 sn; öneri gelince durur.
 * Onay bunu beklemez — öneri onaydan sonra gelse de gösterilir (not gövdesine hiç girmez).
 */

export const ONERI_YOKLAMA = { aralikMs: 4_000, azamiMs: 90_000, tazeNotMs: 3 * 60_000 }

/** Öneri alanları: GET /api/notes/[id] ve /api/notes listesi adlarıyla. `aiDegerlendirme` sayılmaz — çek listesi / büyüme
 * satırı B'den önce de orada olabilir. */
export interface OneriAlanlari {
  hastaOzeti?: string | null
  alarmBulgulari?: unknown[] | null
  receteOnerisi?: unknown[] | null
  kritikBulgular?: unknown[] | null
}

export function oneriGeldiMi(n: OneriAlanlari | null | undefined): boolean {
  if (!n) return false
  const dolu = (v: unknown) => Array.isArray(v) && v.length > 0
  return (typeof n.hastaOzeti === 'string' && n.hastaOzeti.trim().length > 0) || dolu(n.alarmBulgulari) || dolu(n.receteOnerisi) || dolu(n.kritikBulgular)
}

/** Yoklama başlasın mı: not 3 dakikadan genç ve öneri alanları boş. */
export function oneriYoklamasiGerekli(n: (OneriAlanlari & { createdAt?: string | null }) | null | undefined, simdi = Date.now()): boolean {
  if (!n || oneriGeldiMi(n)) return false
  const t = n.createdAt ? new Date(n.createdAt).getTime() : NaN
  if (Number.isNaN(t)) return false
  const yas = simdi - t
  return yas >= -60_000 && yas <= ONERI_YOKLAMA.tazeNotMs
}

export interface YoklamaSecenek<T> {
  getir: () => Promise<T | null>
  geldiMi: (v: T) => boolean
  aralikMs?: number
  azamiMs?: number
  bekle?: (ms: number) => Promise<void>
  simdi?: () => number
  iptal?: () => boolean
}

/** `getir`i aralıkla çağırır; öneri geldiğinde onu, süre dolunca / iptalde null döndürür. Getirme hatası yoklamayı bitirmez. */
export async function oneriyiYokla<T>(s: YoklamaSecenek<T>): Promise<T | null> {
  const aralik = s.aralikMs ?? ONERI_YOKLAMA.aralikMs
  const azami = s.azamiMs ?? ONERI_YOKLAMA.azamiMs
  const bekle = s.bekle ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const simdi = s.simdi ?? Date.now
  const bas = simdi()
  while (simdi() - bas + aralik <= azami) {
    await bekle(aralik)
    if (s.iptal?.()) return null
    try {
      const v = await s.getir()
      if (s.iptal?.()) return null
      if (v != null && s.geldiMi(v)) return v
    } catch { /* ağ hatası: bir sonraki turda yeniden */ }
  }
  return null
}
