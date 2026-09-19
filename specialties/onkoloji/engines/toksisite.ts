/**
 * ONKOLOJI-EXCEPTIONAL-01 — Toksisite kontrol listesi. SAF fonksiyon.
 * Hekim işaretli bulgular → hatırlatma / not taslağı. CTCAE grade tanı değildir.
 * Doz azaltma / gecikme kararı hekimde; Notya doz üretmez.
 */
import type { Dipnot } from './onkoloji'

export type ToksisiteKod =
  | 'bulanti_kusma'
  | 'ishal'
  | 'mukozit'
  | 'notropeni_risk'
  | 'anemi_halsizlik'
  | 'noropati'
  | 'deri_reaksiyon'
  | 'kardiyak_belirti'
  | 'bobrek_lab'
  | 'infeksiyon'

export const TOKSISITE_MADDELER: Array<{ kod: ToksisiteKod; ad: string }> = [
  { kod: 'bulanti_kusma', ad: 'Bulantı / kusma' },
  { kod: 'ishal', ad: 'İshal' },
  { kod: 'mukozit', ad: 'Mukozit / ağız yarası' },
  { kod: 'notropeni_risk', ad: 'Nötropeni riski / ateş takibi' },
  { kod: 'anemi_halsizlik', ad: 'Halsizlik / anemi izlemi' },
  { kod: 'noropati', ad: 'Nöropati belirtileri' },
  { kod: 'deri_reaksiyon', ad: 'Deri reaksiyonu' },
  { kod: 'kardiyak_belirti', ad: 'Kardiyak belirti (hekim değerlendirmesi)' },
  { kod: 'bobrek_lab', ad: 'Böbrek / lab izlemi planı' },
  { kod: 'infeksiyon', ad: 'Enfeksiyon belirtisi' },
]

export interface ToksisiteSonuc {
  tamamMi: boolean
  secilen: ToksisiteKod[]
  ozet: string
  dipnot: Dipnot
  gorevOnerileri: Array<{ kod: string; ad: string }>
}

export function toksisiteSkorla(secilenHam: unknown, not?: string | null): ToksisiteSonuc {
  const dipnot: Dipnot = { ref: 'TTOD', not: 'Toksisite listesi karar desteğidir; grade/tanı/doz hekimin' }
  const izinli = new Set(TOKSISITE_MADDELER.map((m) => m.kod))
  const secilen = (Array.isArray(secilenHam) ? secilenHam.map(String) : []).filter((k): k is ToksisiteKod => izinli.has(k as ToksisiteKod))
  if (not && /\d+\s*(mg|mg\/m|AUC)\b|grade\s*[3-5].{0,20}tan[ıi]/i.test(not)) {
    return { tamamMi: false, secilen, ozet: 'Notta doz veya tanı kilidi yazılamaz.', dipnot, gorevOnerileri: [] }
  }
  if (!secilen.length) {
    return { tamamMi: false, secilen, ozet: 'En az bir toksisite maddesi seçin (veya "yok" için boş bırakıp hekim notu yazın).', dipnot, gorevOnerileri: [] }
  }
  const adlar = TOKSISITE_MADDELER.filter((m) => secilen.includes(m.kod)).map((m) => m.ad)
  const gorevOnerileri = secilen.map((k) => ({
    kod: `tox_${k}`,
    ad: `${TOKSISITE_MADDELER.find((m) => m.kod === k)!.ad} izlem`,
  }))
  return {
    tamamMi: true,
    secilen,
    ozet: `Toksisite kontrol listesi: ${adlar.join('; ')}. Grade/tanı/doz hekim kararıdır.${not ? ` Not: ${String(not).slice(0, 200)}` : ''}`,
    dipnot,
    gorevOnerileri,
  }
}

export const TOKSISITE_KONTROL_LISTESI: readonly string[] = [
  'Hastanın belirttiği yan etkiler kaydedildi',
  'Ateş / enfeksiyon uyarısı anlatıldı',
  'Laboratuvar izlem tarihi planlandı (değer yorumu hekimde)',
  'Doz değişikliği kararı hekim tarafından ayrıca belgelenir (Notya doz yazmaz)',
  'Acil durumda 112 yolu hatırlatıldı',
]
