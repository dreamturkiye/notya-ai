/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Pre/post-op izlem checklist. SAF.
 * Tanı kilidi, doz, OR scheduling YOK. Pediatri büyüme maddesi YOK.
 */
import { ISO_GUN, gunEkle, dozVeyaTaniKilidiIceriyorMu } from './cocuk-cerrahisi'
import type { Dipnot } from './cocuk-cerrahisi'

export type PrepostMaddeId =
  | 'onam'
  | 'laboratuvar'
  | 'goruntu'
  | 'acil_kisi'
  | 'anestezi_not'
  | 'postop_yara'
  | 'postop_agri'
  | 'postop_beslenme'
  | 'kontrol_plan'

export const PREOP_MADDELER: Array<{ id: PrepostMaddeId; ad: string }> = [
  { id: 'onam', ad: 'Cerrahi onam alındı / belgelendi (veli yaşına göre)' },
  { id: 'laboratuvar', ad: 'Pre-op laboratuvar tamamlandı (hekim listesi)' },
  { id: 'goruntu', ad: 'Pre-op görüntüleme / rapor kontrol edildi' },
  { id: 'acil_kisi', ad: 'Acil durumda aranacak kişi bilgisi alındı' },
  { id: 'anestezi_not', ad: 'Anestezi notu hekim dosyasında' },
]

export const POSTOP_MADDELER: Array<{ id: PrepostMaddeId; ad: string }> = [
  { id: 'postop_yara', ad: 'Yara / pansuman planı anlatıldı' },
  { id: 'postop_agri', ad: 'Ağrı yönetimi planı (doz hekimde) anlatıldı' },
  { id: 'postop_beslenme', ad: 'Beslenme / aktivite kısıtı anlatıldı' },
  { id: 'kontrol_plan', ad: 'Kontrol tarihi planlandı' },
  { id: 'acil_kisi', ad: 'Kötüleşmede 112 / acil yolu anlatıldı' },
]

export type PrepostTip = 'preop' | 'postop'

export interface PrepostKart {
  tip: PrepostTip
  planlananAmeliyatEtiket: string | null
  ameliyatTarihi: string | null
  tamamlanan: PrepostMaddeId[]
  not: string | null
}

export interface PrepostSonuc {
  tamamMi: boolean
  kart: PrepostKart
  ozet: string
  eksik: string[]
  dipnot: Dipnot
}

export function prepostMaddeler(tip: PrepostTip) {
  return tip === 'preop' ? PREOP_MADDELER : POSTOP_MADDELER
}

export function prepostNormalize(ham: unknown): PrepostKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tipHam = String(o.tip || 'preop')
  const tip: PrepostTip = tipHam === 'postop' ? 'postop' : 'preop'
  const izinli = new Set(prepostMaddeler(tip).map((m) => m.id))
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  const tamamlanan = Array.isArray(o.tamamlanan)
    ? o.tamamlanan.map(String).filter((id): id is PrepostMaddeId => izinli.has(id as PrepostMaddeId))
    : []
  return {
    tip,
    planlananAmeliyatEtiket: o.planlananAmeliyatEtiket || o.etiket
      ? String(o.planlananAmeliyatEtiket ?? o.etiket).slice(0, 80)
      : null,
    ameliyatTarihi: tarih(o.ameliyatTarihi ?? o.tarih),
    tamamlanan: [...new Set(tamamlanan)],
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function prepostSkorla(ham: unknown): PrepostSonuc {
  const kart = prepostNormalize(ham)
  const maddeler = prepostMaddeler(kart.tip)
  const dipnot: Dipnot = { ref: 'SB_CERRAHI', not: 'Pre/post-op kontrol listesi karar desteğidir; tanı ve doz hekimde' }
  if (kart.not && dozVeyaTaniKilidiIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Nota doz / ameliyathane planı / tanı kilidi / Neyzi yazılamaz.', eksik: [], dipnot }
  }
  if (kart.planlananAmeliyatEtiket && dozVeyaTaniKilidiIceriyorMu(kart.planlananAmeliyatEtiket)) {
    return { tamamMi: false, kart, ozet: 'Etikette tanı/ICD veya doz yazılamaz — yalnız hekim kısa etiketi.', eksik: [], dipnot }
  }
  const eksik = maddeler.filter((m) => !kart.tamamlanan.includes(m.id)).map((m) => m.ad)
  const parcalar = [
    kart.tip === 'preop' ? 'Pre-op' : 'Post-op',
    kart.planlananAmeliyatEtiket ? `Etiket: ${kart.planlananAmeliyatEtiket}` : null,
    kart.ameliyatTarihi ? `Tarih: ${kart.ameliyatTarihi}` : null,
    `Tamamlanan ${kart.tamamlanan.length}/${maddeler.length}`,
    eksik.length ? `Eksik: ${eksik.slice(0, 3).join('; ')}${eksik.length > 3 ? '…' : ''}` : 'Kontrol listesi tamam',
  ].filter(Boolean)
  return {
    tamamMi: true,
    kart,
    ozet: `${parcalar.join(' · ')}. Karar desteğidir; ameliyathane/HIS ve tanı hekimde.`,
    eksik,
    dipnot,
  }
}

export function prepostGorevleri(k: PrepostKart): Array<{ kod: string; ad: string; due: string }> {
  const out: Array<{ kod: string; ad: string; due: string }> = []
  if (k.ameliyatTarihi && k.tip === 'preop') {
    out.push({ kod: 'preop_gun', ad: 'Ameliyat / işlem günü', due: k.ameliyatTarihi })
    if (!k.tamamlanan.includes('laboratuvar') || !k.tamamlanan.includes('onam')) {
      out.push({ kod: 'preop_kontrol', ad: 'Pre-op hazırlık kontrolü', due: gunEkle(k.ameliyatTarihi, -3) })
    }
  }
  if (k.ameliyatTarihi && k.tip === 'postop' && !k.tamamlanan.includes('kontrol_plan')) {
    out.push({ kod: 'postop_kontrol', ad: 'Ameliyat sonrası kontrol', due: gunEkle(k.ameliyatTarihi, 7) })
  }
  return out
}
