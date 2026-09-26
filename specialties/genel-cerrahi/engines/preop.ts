/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Pre-op checklist. SAF fonksiyon.
 * Yalnız hekim işaretleri + tarihler. Tanı kilidi, doz, OR scheduling YOK.
 */
import { ISO_GUN, gunEkle } from './genel-cerrahi'
import type { Dipnot } from './genel-cerrahi'

export type PreopMaddeId =
  | 'onam'
  | 'laboratuvar'
  | 'goruntu'
  | 'anticoag_durdur'
  | 'acil_acil'
  | 'acil_kisi'
  | 'anestezi_not'
  | 'acil_acil_yok'

export const PREOP_MADDELER: Array<{ id: PreopMaddeId; ad: string }> = [
  { id: 'onam', ad: 'Cerrahi onam alındı / belgelendi' },
  { id: 'laboratuvar', ad: 'Pre-op laboratuvar tamamlandı (hekim listesi)' },
  { id: 'goruntu', ad: 'Pre-op görüntüleme / rapor kontrol edildi' },
  { id: 'anticoag_durdur', ad: 'Kan sulandırıcı / antitrombotik planı hekim tarafından belirlendi' },
  { id: 'acil_kisi', ad: 'Acil durumda aranacak kişi bilgisi alındı' },
  { id: 'anestezi_not', ad: 'Anestezi / ASA notu hekim dosyasında' },
]

export interface PreopKart {
  planlananAmeliyatEtiket: string | null
  ameliyatTarihi: string | null
  tamamlanan: PreopMaddeId[]
  not: string | null
}

export interface PreopSonuc {
  tamamMi: boolean
  kart: PreopKart
  ozet: string
  eksik: string[]
  dipnot: Dipnot
}

/** Tanı / doz / OR slot sızıntısı. */
export function preopYasakIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug)\b|doz şeması|OR slot|ameliyathane plan|HIS randevu|tanı kilit|ICD-?\d/i.test(metin)
}

export function preopNormalize(ham: unknown): PreopKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  const tamamlanan = Array.isArray(o.tamamlanan)
    ? o.tamamlanan.map(String).filter((id): id is PreopMaddeId => PREOP_MADDELER.some((m) => m.id === id))
    : []
  return {
    planlananAmeliyatEtiket: o.planlananAmeliyatEtiket || o.etiket
      ? String(o.planlananAmeliyatEtiket ?? o.etiket).slice(0, 80)
      : null,
    ameliyatTarihi: tarih(o.ameliyatTarihi ?? o.tarih),
    tamamlanan: [...new Set(tamamlanan)],
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function preopSkorla(ham: unknown): PreopSonuc {
  const kart = preopNormalize(ham)
  const dipnot: Dipnot = { ref: 'SB_CERRAHI', not: 'Pre-op kontrol listesi karar desteğidir; tanı ve doz hekimde' }
  if (kart.not && preopYasakIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Pre-op notunda doz / ameliyathane planı / tanı kilidi yazılamaz.', eksik: [], dipnot }
  }
  if (kart.planlananAmeliyatEtiket && preopYasakIceriyorMu(kart.planlananAmeliyatEtiket)) {
    return { tamamMi: false, kart, ozet: 'Ameliyat etiketinde tanı/ICD veya doz yazılamaz — yalnız hekim kısa etiketi.', eksik: [], dipnot }
  }
  const eksik = PREOP_MADDELER.filter((m) => !kart.tamamlanan.includes(m.id)).map((m) => m.ad)
  const parcalar = [
    kart.planlananAmeliyatEtiket ? `Etiket: ${kart.planlananAmeliyatEtiket}` : null,
    kart.ameliyatTarihi ? `Planlanan tarih: ${kart.ameliyatTarihi}` : null,
    `Tamamlanan ${kart.tamamlanan.length}/${PREOP_MADDELER.length}`,
    eksik.length ? `Eksik: ${eksik.slice(0, 3).join('; ')}${eksik.length > 3 ? '…' : ''}` : 'Kontrol listesi tamam',
  ].filter(Boolean)
  return {
    tamamMi: true,
    kart,
    ozet: `${parcalar.join(' · ')}. Pre-op kontrol listesi karar desteğidir; ameliyathane/HIS ve tanı hekimde.`,
    eksik,
    dipnot,
  }
}

export function preopGorevleri(k: PreopKart): Array<{ kod: string; ad: string; due: string }> {
  const out: Array<{ kod: string; ad: string; due: string }> = []
  if (k.ameliyatTarihi) {
    out.push({ kod: 'preop_gun', ad: 'Ameliyat / işlem günü', due: k.ameliyatTarihi })
    const pre = gunEkle(k.ameliyatTarihi, -3)
    if (!k.tamamlanan.includes('laboratuvar') || !k.tamamlanan.includes('onam')) {
      out.push({ kod: 'preop_kontrol', ad: 'Pre-op hazırlık kontrolü', due: pre })
    }
  }
  return out
}
