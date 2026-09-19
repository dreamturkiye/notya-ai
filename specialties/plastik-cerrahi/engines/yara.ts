/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Yara / greft / flep izlem. SAF fonksiyon.
 * Yalnız bölge + tip + tarihler. Tanı, skor, doz YOK.
 */
import { ISO_GUN, dozVeyaTaniKilidiIceriyorMu, gunEkle } from './plastik'
import type { Dipnot } from './plastik'

export type YaraTip = 'yara' | 'greft' | 'flep' | 'dikis' | 'pansiyel' | 'diger'

export interface YaraKart {
  tip: YaraTip | null
  bolge: string | null
  taraf: string | null
  islemTarihi: string | null
  pansumanTarihi: string | null
  dikisAlmaTarihi: string | null
  not: string | null
}

export interface YaraSonuc {
  tamamMi: boolean
  kart: YaraKart
  ozet: string
  dipnot: Dipnot
}

const TIPLER: YaraTip[] = ['yara', 'greft', 'flep', 'dikis', 'pansiyel', 'diger']

export const YARA_TIP_AD: Record<YaraTip, string> = {
  yara: 'Yara bakımı',
  greft: 'Greft izlem',
  flep: 'Flep izlem',
  dikis: 'Dikiş takip',
  pansiyel: 'Pansuman',
  diger: 'Diğer izlem',
}

export function yaraNormalize(ham: unknown): YaraKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  const tipHam = String(o.tip || '').toLowerCase()
  return {
    tip: TIPLER.includes(tipHam as YaraTip) ? (tipHam as YaraTip) : null,
    bolge: o.bolge ? String(o.bolge).slice(0, 80) : null,
    taraf: o.taraf ? String(o.taraf).slice(0, 40) : null,
    islemTarihi: tarih(o.islemTarihi ?? o.islem_tarihi),
    pansumanTarihi: tarih(o.pansumanTarihi ?? o.pansuman_tarihi),
    dikisAlmaTarihi: tarih(o.dikisAlmaTarihi ?? o.dikis_alma_tarihi),
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function yaraSkorla(ham: unknown): YaraSonuc {
  const kart = yaraNormalize(ham)
  const dipnot: Dipnot = { ref: 'TPRECD', not: 'Yara/greft izlem karar desteğidir; tanı ve doz hekimin' }
  if (!kart.tip) {
    return { tamamMi: false, kart, ozet: 'İzlem tipi gerekli (yara / greft / flep / dikiş…).', dipnot }
  }
  if (!kart.bolge) {
    return { tamamMi: false, kart, ozet: 'Bölge etiketi gerekli — tanı yazılmaz.', dipnot }
  }
  if (kart.not && dozVeyaTaniKilidiIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Notta doz / tanı kilidi / OR planı yazılamaz.', dipnot }
  }
  if (kart.bolge && dozVeyaTaniKilidiIceriyorMu(kart.bolge)) {
    return { tamamMi: false, kart, ozet: 'Bölge etiketinde doz veya tanı kilidi yazılamaz.', dipnot }
  }
  const parcalar = [
    YARA_TIP_AD[kart.tip],
    kart.bolge,
    kart.taraf || null,
    kart.islemTarihi ? `İşlem: ${kart.islemTarihi}` : null,
    kart.pansumanTarihi ? `Pansuman: ${kart.pansumanTarihi}` : null,
    kart.dikisAlmaTarihi ? `Dikiş alma: ${kart.dikisAlmaTarihi}` : null,
  ].filter(Boolean)
  return {
    tamamMi: true,
    kart,
    ozet: `${parcalar.join(' · ')}. Yara/greft izlem karar desteğidir; tanı/doz hekimin.`,
    dipnot,
  }
}

export function yaraGorevleri(k: YaraKart): Array<{ kod: string; ad: string; due: string }> {
  const out: Array<{ kod: string; ad: string; due: string }> = []
  if (k.pansumanTarihi) out.push({ kod: 'pansuman_izlem', ad: 'Pansuman / yara bakımı kontrolü', due: k.pansumanTarihi })
  if (k.dikisAlmaTarihi) out.push({ kod: 'dikis_alma', ad: 'Dikiş alma kontrolü', due: k.dikisAlmaTarihi })
  if (k.tip === 'greft' || k.tip === 'flep') {
    const due = k.pansumanTarihi || (k.islemTarihi ? gunEkle(k.islemTarihi, 3) : null)
    if (due) out.push({ kod: 'greft_flep_izlem', ad: 'Greft / flep izlem kontrolü', due })
  }
  return out
}

export function pansumanOneri(islemTarihi: string | null, gun = 3): string | null {
  return islemTarihi && ISO_GUN.test(islemTarihi) ? gunEkle(islemTarihi, gun) : null
}
