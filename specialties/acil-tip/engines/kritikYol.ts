/**
 * ACIL-TIP-EXCEPTIONAL-01 — Kritik yol checklist (STEMI / inme / travma). SAF fonksiyon.
 * Bayrak + madde. Tanı kilidi YOK. Kardiyoloji STEMI / nöroloji İnme tile sızmaz.
 */
import { dozIceriyorMu, type Dipnot } from './acilTip'

export type KritikYol =
  | 'stemi'
  | 'inme'
  | 'travma'
  | 'sepsis'
  | 'hava_yolu'

export type KritikMadde =
  | 'saat_kaydi'
  | 'ekg_10dk'
  | 'noroloji_skala'
  | 'goruntu_plan'
  | 'travma_primer'
  | 'kan_kultur'
  | 'hava_yolu_hazir'
  | 'hekim_yonlendirme'

export const KRITIK_YOLLAR: Array<{ kod: KritikYol; ad: string }> = [
  { kod: 'stemi', ad: 'STEMI / ACS yol bayrağı' },
  { kod: 'inme', ad: 'İnme / TIA yol bayrağı' },
  { kod: 'travma', ad: 'Travma yol bayrağı' },
  { kod: 'sepsis', ad: 'Sepsis yol bayrağı' },
  { kod: 'hava_yolu', ad: 'Hava yolu / kritik solunum bayrağı' },
]

export const KRITIK_MADDELER: Array<{ kod: KritikMadde; ad: string; yollar: KritikYol[] }> = [
  { kod: 'saat_kaydi', ad: 'Semptom / olay başlangıç saati kaydedildi', yollar: ['stemi', 'inme', 'travma', 'sepsis', 'hava_yolu'] },
  { kod: 'ekg_10dk', ad: 'Erken EKG planı (yorum hekimde; tanı yazılmaz)', yollar: ['stemi'] },
  { kod: 'noroloji_skala', ad: 'Odaklı nöro değerlendirme kaydı (skor tanı değildir)', yollar: ['inme'] },
  { kod: 'goruntu_plan', ad: 'Görüntüleme planı / köprü (tanı yok)', yollar: ['inme', 'travma'] },
  { kod: 'travma_primer', ad: 'Primer survey checklist (ABCDE) — doz yok', yollar: ['travma'] },
  { kod: 'kan_kultur', ad: 'Enfeksiyon / sepsis paket maddesi (doz hekimde)', yollar: ['sepsis'] },
  { kod: 'hava_yolu_hazir', ad: 'Hava yolu ekipmanı / yardım çağrısı hazır', yollar: ['hava_yolu'] },
  { kod: 'hekim_yonlendirme', ad: 'Sevk / konsültasyon / yatış yönlendirmesi hekim kilitledi', yollar: ['stemi', 'inme', 'travma', 'sepsis', 'hava_yolu'] },
]

export interface KritikYolSonuc {
  tamamMi: boolean
  yollar: KritikYol[]
  maddeler: KritikMadde[]
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string }>
  dipnot: Dipnot
}

export function kritikYolSkorla(girdi: { yollar?: unknown; maddeler?: unknown; not?: string | null }): KritikYolSonuc {
  const dipnot: Dipnot = { ref: 'TATD', not: 'Kritik yol bayrağı karar desteğidir; tanı ve doz hekimin' }
  if (girdi.not && dozIceriyorMu(girdi.not)) {
    return { tamamMi: false, yollar: [], maddeler: [], ozet: 'Kritik yol notunda mg / ilaç dozu yazılamaz.', gorevOnerileri: [], dipnot }
  }
  const yolIzin = new Set(KRITIK_YOLLAR.map((y) => y.kod))
  const madIzin = new Set(KRITIK_MADDELER.map((m) => m.kod))
  const yollar = (Array.isArray(girdi.yollar) ? girdi.yollar.map(String) : []).filter((k): k is KritikYol => yolIzin.has(k as KritikYol))
  const maddeler = (Array.isArray(girdi.maddeler) ? girdi.maddeler.map(String) : []).filter((k): k is KritikMadde => madIzin.has(k as KritikMadde))
  if (!yollar.length) {
    return { tamamMi: false, yollar, maddeler, ozet: 'En az bir kritik yol bayrağı seçin.', gorevOnerileri: [], dipnot }
  }
  if (!maddeler.length) {
    return { tamamMi: false, yollar, maddeler, ozet: 'En az bir checklist maddesi seçin.', gorevOnerileri: [], dipnot }
  }
  const yolAd = KRITIK_YOLLAR.filter((y) => yollar.includes(y.kod)).map((y) => y.ad)
  const madAd = KRITIK_MADDELER.filter((m) => maddeler.includes(m.kod)).map((m) => m.ad)
  const gorevOnerileri = yollar.map((y) => ({
    kod: `kritik_${y}`,
    ad: `${KRITIK_YOLLAR.find((x) => x.kod === y)!.ad} izlem`,
  }))
  return {
    tamamMi: true,
    yollar,
    maddeler,
    ozet: `Kritik yol: ${yolAd.join('; ')}. Maddeler: ${madAd.join('; ')}. Tanı kilidi yoktur; doz hekimdedir.`,
    gorevOnerileri,
    dipnot,
  }
}
