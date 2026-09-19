/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Yara / dren izlem (pediatrik cerrahi ofis). SAF.
 * Enfeksiyon tanısı / antibiyotik dozu YOK.
 */
import { ISO_GUN, gunEkle, dozVeyaTaniKilidiIceriyorMu } from './cocuk-cerrahisi'
import type { Dipnot } from './cocuk-cerrahisi'

export type YaraTip = 'yara' | 'dren' | 'dikis' | 'taburcu_kontrol'

export const YARA_TIP_AD: Record<YaraTip, string> = {
  yara: 'Yara izlem',
  dren: 'Dren izlem',
  dikis: 'Dikiş alma',
  taburcu_kontrol: 'Taburcu sonrası kontrol',
}

export interface YaraKart {
  tip: YaraTip
  bolge: string | null
  tarih: string | null
  sonrakiKontrol: string | null
  drenCikisMl: number | null
  not: string | null
}

export interface YaraSonuc {
  tamamMi: boolean
  kart: YaraKart
  ozet: string
  dipnot: Dipnot
}

export function yaraNormalize(ham: unknown): YaraKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tipHam = String(o.tip || 'yara')
  const tip: YaraTip = (['yara', 'dren', 'dikis', 'taburcu_kontrol'] as YaraTip[]).includes(tipHam as YaraTip)
    ? (tipHam as YaraTip)
    : 'yara'
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  const ml = o.drenCikisMl ?? o.dren_cikis_ml
  const n = ml == null || ml === '' ? null : Number(ml)
  return {
    tip,
    bolge: o.bolge ? String(o.bolge).slice(0, 80) : null,
    tarih: tarih(o.tarih),
    sonrakiKontrol: tarih(o.sonrakiKontrol ?? o.sonraki_kontrol),
    drenCikisMl: n != null && Number.isFinite(n) && n >= 0 ? Math.round(n) : null,
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function yaraSkorla(ham: unknown): YaraSonuc {
  const kart = yaraNormalize(ham)
  const dipnot: Dipnot = { ref: 'CCD', not: 'Yara/dren izlem karar desteğidir; enfeksiyon tanısı hekimde' }
  if (!kart.tarih) {
    return { tamamMi: false, kart, ozet: 'İzlem tarihi gerekli.', dipnot }
  }
  if (kart.not && dozVeyaTaniKilidiIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Nota doz veya tanı kilidi yazılamaz.', dipnot }
  }
  const parcalar = [
    YARA_TIP_AD[kart.tip],
    kart.bolge ? `Bölge: ${kart.bolge}` : null,
    `Tarih: ${kart.tarih}`,
    kart.tip === 'dren' && kart.drenCikisMl != null ? `Dren çıkış: ${kart.drenCikisMl} mL (hekim kaydı)` : null,
    kart.sonrakiKontrol ? `Sonraki: ${kart.sonrakiKontrol}` : null,
  ].filter(Boolean)
  return {
    tamamMi: true,
    kart,
    ozet: `${parcalar.join(' · ')}. Pediatrik cerrahi ofis izlemi; enfeksiyon tanısı ve antibiyotik dozu hekimde.`,
    dipnot,
  }
}

export function yaraGorevleri(k: YaraKart): Array<{ kod: string; ad: string; due: string }> {
  const out: Array<{ kod: string; ad: string; due: string }> = []
  if (k.sonrakiKontrol) {
    out.push({
      kod: k.tip === 'dren' ? 'dren_kontrol' : k.tip === 'dikis' ? 'dikis_alma' : 'yara_kontrol',
      ad: k.tip === 'dren' ? 'Dren kontrolü' : k.tip === 'dikis' ? 'Dikiş alma kontrolü' : 'Yara kontrolü',
      due: k.sonrakiKontrol,
    })
  } else if (k.tarih && k.tip === 'dikis') {
    out.push({ kod: 'dikis_alma', ad: 'Dikiş alma kontrolü', due: gunEkle(k.tarih, 10) })
  }
  return out
}
