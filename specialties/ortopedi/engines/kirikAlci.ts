/**
 * ORTOPEDI-EXCEPTIONAL-01 — Kırık / alçı / ortez izlem notu. SAF fonksiyon, LLM yok.
 *
 * Hekim girdilerinden düzenli izlem özeti üretir. Tanı yazılmaz; doz yok.
 * Alçı alma / yük verme tarihleri yalnız hekimin girdiği ISO tarihlerdir.
 */
import type { Dipnot } from './ortopedi'
import { ISO_GUN, gunFarki } from './ortopedi'

export type KirikAlciTip = 'kirik' | 'alci' | 'ortez' | 'op_sonrasi'

export const TIP_AD: Record<KirikAlciTip, string> = {
  kirik: 'Kırık izlem',
  alci: 'Alçı takip',
  ortez: 'Ortez takip',
  op_sonrasi: 'Op-sonrası protokol',
}

export const BOLGELER = [
  'Omuz / üst kol',
  'Dirsek / ön kol',
  'El bileği / el',
  'Kalça / pelvis',
  'Diz / bacak',
  'Ayak bileği / ayak',
  'Omurga',
  'Diğer',
] as const

export const TARAFLAR = ['Sağ', 'Sol', 'İki taraf', 'Belirtilmedi'] as const

export const NV_DURUMLARI = [
  'NV tam — his/güç/nabız normal',
  'Hafif parestezi — hekim izliyor',
  'NV tehdit — acil değerlendirme',
  'Değerlendirilmedi',
] as const

export interface KirikAlciGirdi {
  tip: KirikAlciTip
  bolge: string
  taraf: string
  baslangic: string | null
  alciAlma: string | null
  yukVerme: string | null
  nvDurum: string
  goruntuHazir: boolean
  notHekim: string | null
  bugun: string
}

export interface KirikAlciSonuc {
  ozet: string
  gorevler: Array<{ kod: string; ad: string; due: string | null }>
  uyarilar: string[]
  dipnot: Dipnot
}

export function ozetle(g: KirikAlciGirdi): KirikAlciSonuc {
  const tipAd = TIP_AD[g.tip] || g.tip
  const bolge = (g.bolge || 'Belirtilmedi').slice(0, 80)
  const taraf = (g.taraf || 'Belirtilmedi').slice(0, 40)
  const uyarilar: string[] = []
  const gorevler: KirikAlciSonuc['gorevler'] = []

  if (g.nvDurum.includes('NV tehdit')) {
    uyarilar.push('NV tehdit işaretli — acil değerlendirme; ayaktan izlem yeterli olmayabilir')
  }
  if (g.alciAlma && ISO_GUN.test(g.alciAlma) && g.bugun && gunFarki(g.alciAlma, g.bugun) > 0) {
    uyarilar.push(`Alçı alma tarihi geçti (${g.alciAlma})`)
  }
  if (g.yukVerme && ISO_GUN.test(g.yukVerme) && g.bugun && gunFarki(g.yukVerme, g.bugun) > 0) {
    uyarilar.push(`Yük verme / mobilizasyon tarihi geçti (${g.yukVerme})`)
  }

  if (g.alciAlma && ISO_GUN.test(g.alciAlma)) {
    gorevler.push({ kod: 'alci_alma', ad: 'Alçı / ortez alma kontrolü', due: g.alciAlma })
  }
  if (g.yukVerme && ISO_GUN.test(g.yukVerme)) {
    gorevler.push({ kod: 'yuk_verme', ad: 'Yük verme / mobilizasyon kontrolü', due: g.yukVerme })
  }
  if (g.goruntuHazir) {
    gorevler.push({ kod: 'goruntu_kontrol', ad: 'Görüntüleme kontrol randevusu', due: null })
  }
  if (g.tip === 'op_sonrasi' && g.baslangic && ISO_GUN.test(g.baslangic)) {
    gorevler.push({ kod: 'op_kontrol', ad: 'Ameliyat sonrası kontrol', due: null })
  }

  const satirlar = [
    `${tipAd}: ${bolge} · ${taraf}`,
    g.baslangic && ISO_GUN.test(g.baslangic) ? `Başlangıç / işlem: ${g.baslangic}` : null,
    g.alciAlma && ISO_GUN.test(g.alciAlma) ? `Alçı alma planı: ${g.alciAlma}` : null,
    g.yukVerme && ISO_GUN.test(g.yukVerme) ? `Yük verme planı: ${g.yukVerme}` : null,
    `NV: ${g.nvDurum}`,
    g.goruntuHazir ? 'Görüntüleme kaydı hekim tarafından işaretlendi (yorum hekimde).' : null,
    g.notHekim ? `Hekim notu: ${g.notHekim.slice(0, 200)}` : null,
    'Özet karar desteğidir; tanı ve doz hekimindir.',
  ].filter(Boolean) as string[]

  return {
    ozet: satirlar.join('\n'),
    gorevler,
    uyarilar,
    dipnot: {
      ref: 'TOTBID',
      not: 'Kırık/alçı/ortez izlem özeti hekim girdilerinden üretilir; kaynama / artroz tanısı yazılmaz.',
    },
  }
}

/** Op-sonrası protokol kontrol listesi — hekim tarihleri doldurur; doz / tanı yok. */
export const OP_PROTOKOL_MADDELERI: readonly string[] = [
  'İşlem tarihi ve taraf kaydedildi',
  'Dikiş / yara kontrol tarihi belirlendi',
  'Yük verme / hareket kısıtı hekim tarafından anlatıldı',
  'Görüntüleme kontrolü (gerekirse) planlandı',
  'Fizik tedavi sevk kararı hekimde (Notya sevk HIS değildir)',
  'Kırmızı bayraklar (şişlik↑, ateş, NV kayıp) hastaya anlatıldı',
]
