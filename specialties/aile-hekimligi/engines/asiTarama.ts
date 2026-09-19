/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Aşı / tarama paketi hatırlatma. SAF fonksiyon.
 * Vade hatırlatması üretir; doz, lot, aşı ürün adı ve tanı yazılmaz.
 */
import type { Dipnot } from './aile'
import { ayEkle } from './aile'

export type AsiTaramaKod =
  | 'cocuk_takvim'
  | 'grip'
  | 'pnomo'
  | 'tetanoz'
  | 'hpv'
  | 'kolon'
  | 'meme'
  | 'serviks'
  | 'prostat'
  | 'kv_risk'

export interface AsiTaramaPaket {
  kod: AsiTaramaKod
  ad: string
  varsayilanAy: number
  dipnot: Dipnot
}

/** Hekim seçer — Notya aşı yaptırmaz, doz yazmaz. */
export const ASI_TARAMA_PAKETLER: AsiTaramaPaket[] = [
  { kod: 'cocuk_takvim', ad: 'Çocuk ulusal aşı takvimi kontrolü', varsayilanAy: 1, dipnot: { ref: 'SB_ASI', not: 'Ulusal takvim vadesi; doz/lot hekim / ASM kaydında' } },
  { kod: 'grip', ad: 'Erişkin grip aşısı hatırlatması (sezon)', varsayilanAy: 12, dipnot: { ref: 'SB_ASI', not: 'Sezonluk hatırlatma; ürün ve doz hekimde' } },
  { kod: 'pnomo', ad: 'Pnömokok bağışıklama kontrolü (risk grubu)', varsayilanAy: 60, dipnot: { ref: 'SB_ASI', not: 'Risk grubu endikasyonu hekimde; doz yok' } },
  { kod: 'tetanoz', ad: 'Td / Tdap hatırlatması', varsayilanAy: 120, dipnot: { ref: 'SB_ASI', not: 'Erişkin takviye aralığı hekim kararı' } },
  { kod: 'hpv', ad: 'HPV bağışıklama / tamamlanma kontrolü', varsayilanAy: 6, dipnot: { ref: 'SB_ASI', not: 'Seri tamamlanma hatırlatması; doz şeması hekimde' } },
  { kod: 'kolon', ad: 'Kolorektal tarama hatırlatması', varsayilanAy: 12, dipnot: { ref: 'SB_TARAMA', not: 'Yaş / risk aralığı hekimde; yöntem seçimi hekimde' } },
  { kod: 'meme', ad: 'Meme tarama hatırlatması', varsayilanAy: 24, dipnot: { ref: 'SB_TARAMA', not: 'Yaş / risk; tanı yazılmaz' } },
  { kod: 'serviks', ad: 'Serviks tarama (Pap / HPV) hatırlatması', varsayilanAy: 36, dipnot: { ref: 'SB_TARAMA', not: 'Aralık hekimde; sonuç yorumu hekimde' } },
  { kod: 'prostat', ad: 'Prostat tarama tartışması hatırlatması', varsayilanAy: 12, dipnot: { ref: 'SB_TARAMA', not: 'Paylaşılan karar; PSA sayı portala düşmez' } },
  { kod: 'kv_risk', ad: 'KV risk / metabolik tarama paketi', varsayilanAy: 12, dipnot: { ref: 'SB_AH', not: 'Birinci basamak risk değerlendirmesi; skor tanı değildir' } },
]

export const ASI_TARAMA_AD: Record<AsiTaramaKod, string> = Object.fromEntries(
  ASI_TARAMA_PAKETLER.map((p) => [p.kod, p.ad]),
) as Record<AsiTaramaKod, string>

export function asiTaramaGorevleri(
  kodlar: AsiTaramaKod[],
  bugun: string,
): Array<{ kod: string; ad: string; due: string; kaynak: string }> {
  const secili = ASI_TARAMA_PAKETLER.filter((p) => kodlar.includes(p.kod))
  return secili.map((p) => ({
    kod: `asi_tarama_${p.kod}`,
    ad: p.ad,
    due: ayEkle(bugun, p.varsayilanAy),
    kaynak: 'asi_tarama',
  }))
}

export function asiTaramaOzeti(kodlar: AsiTaramaKod[]): string {
  if (!kodlar.length) return 'Aşı/tarama paketi seçilmedi — hekim değerlendirmesi esas'
  return `Aşı/tarama paketi: ${kodlar.map((k) => ASI_TARAMA_AD[k] || k).join('; ')} — vade hatırlatması (doz/lot yok)`
}
