/**
 * Klinik canlı katman — takvimin, hafıza kartının ve slot kurtarmanın saf kuralları.
 *
 * Mevcut randevu motoru (`lib/randevu/v2/slot.ts`) doktorun çalışma saatini, izinini ve
 * meşgul aralıklarını zaten çıkarır. Oda burada ikinci bir meşgul aralıktır; yeni bir
 * takvim yazılmaz. Bekleme listesinin gün içi FIFO teklifi (`bekleme.ts`) durur.
 * Kurtarma yalnız 2–4 saat içindeki boşluğa sıralama üretir; mesajı o teklif yolu gönderir.
 * Hafıza kartı yapılandırılmış kayıttan kurulur. Luna çağrısı yok.
 */
import { bosSlotlar, type Aralik, type Slot, type SlotGirdisi } from '@/lib/randevu/v2/slot'

const SAAT_MS = 60 * 60 * 1000
/** Kurtarma penceresi: boşluk en az 2, en çok 4 saat sonra. Daha erkenine hasta yetişemez; daha uzağı sıradan bekleme listesidir. */
export const KURTARMA_EN_ERKEN_MS = 2 * SAAT_MS
export const KURTARMA_EN_GEC_MS = 4 * SAAT_MS

export function odaMesgul(
  odaId: string,
  rezervasyonlar: { odaId: string; bas: number; son: number }[],
): Aralik[] {
  return rezervasyonlar
    .filter((r) => r.odaId === odaId && r.son > r.bas)
    .map((r) => ({ bas: r.bas, son: r.son }))
}

/** Doktorun kendi meşgulüne odanın rezervasyonlarını ekler ve mevcut slot motorunu çağırır. */
export function klinikSlotlari(g: SlotGirdisi, oda: Aralik[]): Slot[] {
  return bosSlotlar({ ...g, mesgul: [...g.mesgul, ...oda] })
}

export type KlinikZiyaret = { doktorId: string; tarih: string; ozet: string }
export type KlinikTakip = { sahip: string; metin: string }
export type KlinikPaket = { ad: string; kalanSeans: number }
export type GelmeKaydi = { tarih: string; gelmedi: boolean }

export type HafizaKarti = {
  sonZiyaretler: KlinikZiyaret[]
  acikTakipler: KlinikTakip[]
  paket: KlinikPaket | null
  gelmediRiski: 'yok' | 'orta' | 'yuksek'
}

/** Son 3 ziyaret (tüm hekimler), açık takipler, paket bakiyesi, son 6 gelişten gelmedi riski. */
export function hafizaKarti(g: {
  ziyaretler: KlinikZiyaret[]
  takipler: KlinikTakip[]
  paket: KlinikPaket | null
  gelmeler: GelmeKaydi[]
}): HafizaKarti {
  const sonZiyaretler = [...g.ziyaretler].sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0)).slice(0, 3)
  const sonAlti = [...g.gelmeler].sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0)).slice(0, 6)
  const gelmedi = sonAlti.filter((x) => x.gelmedi).length
  const gelmediRiski = gelmedi >= 2 ? 'yuksek' : gelmedi === 1 ? 'orta' : 'yok'
  const paket = g.paket && g.paket.kalanSeans > 0 ? g.paket : null
  return { sonZiyaretler, acikTakipler: g.takipler, paket, gelmediRiski }
}

export type KurtarmaAday = { id: string; kaynak: 'bekleme' | 'gelmedi'; puan: number }

/**
 * 2–4 saat içindeki boşluk için sıra. Bekleme listesi, yakın gelmedinin önündedir.
 * Pencere dışındaki boşlukta boş dizi döner; o iş mevcut bekleme taramasında kalır.
 */
export function kurtarmaSirasi(g: {
  simdi: number
  slotBas: number
  bekleme: { id: string; sira: number }[]
  gelmedi: { id: string; gunOnce: number }[]
}): KurtarmaAday[] {
  const fark = g.slotBas - g.simdi
  if (fark < KURTARMA_EN_ERKEN_MS || fark > KURTARMA_EN_GEC_MS) return []
  const bekleyen = new Set(g.bekleme.map((b) => b.id))
  const adaylar: (KurtarmaAday & { sira: number })[] = []
  for (const b of g.bekleme) {
    const sira = Math.max(0, b.sira)
    adaylar.push({ id: b.id, kaynak: 'bekleme', puan: 80 + Math.max(0, 20 - sira), sira })
  }
  for (const n of g.gelmedi) {
    if (bekleyen.has(n.id)) continue
    const gun = Math.max(0, Math.min(30, n.gunOnce))
    adaylar.push({ id: n.id, kaynak: 'gelmedi', puan: 50 - gun, sira: 1000 + gun })
  }
  adaylar.sort((a, b) => b.puan - a.puan || a.sira - b.sira)
  return adaylar.map(({ id, kaynak, puan }) => ({ id, kaynak, puan }))
}
