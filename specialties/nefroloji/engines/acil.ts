/**
 * NEFROLOJI-EXCEPTIONAL-01 — Nefro acil kırmızı bayrak. SAF fonksiyon.
 * Hiperkalemi · aşırı sıvı · üremik acil → 112. Tanı dili yok; eylem yönlendirmesi var.
 */
import type { Dipnot } from './nefroloji'

export type AcilKod =
  | 'hiperkalemi'
  | 'asiri_sivi'
  | 'uremik_acil'
  | 'diyaliz_acil'
  | 'anuri_oliguri'

export interface AcilBayrak {
  kod: AcilKod
  ad: string
  eylem: string
  oncelik: 'hemen' | 'ayni_gun'
  dipnot: Dipnot
}

const KURALLAR: Array<{
  kod: AcilKod
  re: RegExp
  ad: string
  eylem: string
  oncelik: 'hemen' | 'ayni_gun'
  dipnot: Dipnot
}> = [
  {
    kod: 'hiperkalemi',
    re: /hiperkalemi|y[üu]ksek potasyum|k\s*[>≥]\s*6|potasyum[^.]{0,20}(6|7)|ekg[^.]{0,20}(hiper|peak)/i,
    ad: 'Ciddi hiperkalemi şüphesi',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun. Hiperkalemide ayaktan randevu beklenmez; EKG / acil müdahale hekim/acil kararıdır.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_NEF', not: 'Hiperkalemi — acil; doz ve tedavi hekim/acil' },
  },
  {
    kod: 'asiri_sivi',
    re: /a[şs][ıi]r[ıi] s[ıi]v[ıi]|pulmoner [öo]dem|[öo]dem[^.]{0,20}nefes|ani nefes darl[ıi][ğg][ıi]|ortopne|k[öo]p[üu]kl[üu] balgam/i,
    ad: 'Aşırı sıvı / pulmoner ödem şüphesi',
    eylem: 'Hemen 112’yi arayın. Aşırı sıvı yükü portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TND_DIYALIZ', not: 'Aşırı sıvı — acil değerlendirme' },
  },
  {
    kod: 'uremik_acil',
    re: /[üu]remik|[üu]remi[^.]{0,20}(bilin[çc]|konv[üu]l|ensefal)|perikardit[^.]{0,20}[üu]rem|bilin[çc][^.]{0,30}[üu]rem/i,
    ad: 'Üremik acil / ensefalopati şüphesi',
    eylem: 'Hemen 112’yi arayın. Üremik acil ayaktan izlem ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TND_KBH', not: 'Üremik acil — acil; tanı hekim/acil' },
  },
  {
    kod: 'diyaliz_acil',
    re: /diyaliz[^.]{0,25}(acil|ka[çc][ıi]r|eri[şs]im|fist[üu]l[^.]{0,15}kanama)|kateter[^.]{0,20}(enfeksiyon|tıkan)/i,
    ad: 'Diyaliz erişim / kaçırılan seans acili',
    eylem: 'Aynı gün nefroloji / acil değerlendirme. Portal mesajı yeterli olmayabilir.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TND_DIYALIZ', not: 'Diyaliz erişim acili — hekim/acil kararı' },
  },
  {
    kod: 'anuri_oliguri',
    re: /an[üu]ri|olig[üu]ri|[ıi]drar[^.]{0,20}(yok|azald[ıi]|[çc][ıi]km[ıi]yor)|ani b[öo]brek yetmez/i,
    ad: 'Ani anüri / oligüri',
    eylem: 'Aynı gün acil değerlendirme veya 112. Ayaktan randevu yeterli olmayabilir.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'SB_NEF', not: 'Ani oligüri — acil değerlendirme kararı hekimin' },
  },
]

function trKucuk(metin: string): string {
  return metin.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr-TR')
}

export function acilTara(metinler: Array<string | null | undefined>, hekimIsaretleri: AcilKod[] = []): AcilBayrak[] {
  const metin = trKucuk(metinler.filter(Boolean).join(' \n '))
  const bulunan = new Map<AcilKod, AcilBayrak>()
  for (const k of KURALLAR) {
    if (k.re.test(metin) || hekimIsaretleri.includes(k.kod)) {
      bulunan.set(k.kod, { kod: k.kod, ad: k.ad, eylem: k.eylem, oncelik: k.oncelik, dipnot: k.dipnot })
    }
  }
  return [...bulunan.values()].sort((a, b) => (a.oncelik === b.oncelik ? 0 : a.oncelik === 'hemen' ? -1 : 1))
}

export const ACIL_KODLARI: Array<{ kod: AcilKod; ad: string }> = KURALLAR.map((k) => ({ kod: k.kod, ad: k.ad }))

export const HASTA_ACIL_METNI =
  'Ani nefes darlığı, göğüs ağrısı, şiddetli halsizlik, bilinç bulanıklığı veya idrarın birden kesilmesi varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerNef ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Şiddetli halsizlik veya çarpıntı (yüksek potasyum şüphesi)', kod: 'hiperkalemi' },
  { etiket: 'Ani nefes darlığı veya aşırı şişlik', kod: 'asiri_sivi' },
  { etiket: 'Bilinç bulanıklığı veya nöbet (üremik acil şüphesi)', kod: 'uremik_acil' },
  { etiket: 'Diyaliz erişiminde kanama / enfeksiyon veya kaçırılan seans', kod: 'diyaliz_acil' },
  { etiket: 'İdrarın birden azalması veya kesilmesi', kod: 'anuri_oliguri' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Potasyum / EKG / oksijen ihtiyacı değerlendirildi (mümkünse)',
  'Diyaliz programı / son seans sorgulandı',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
