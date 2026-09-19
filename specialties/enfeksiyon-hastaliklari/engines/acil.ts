/**
 * ENFEKSIYON-EXCEPTIONAL-01 — Enfeksiyon acil kırmızı bayrak. SAF fonksiyon.
 * Sepsis · menenjit · nekrotizan · anafilaksi → 112. Tanı dili yok; eylem yönlendirmesi var.
 */
import type { Dipnot } from './enfeksiyon'

export type AcilKod =
  | 'sepsis_suphesi'
  | 'menenjit_suphesi'
  | 'nekrotizan_fasit'
  | 'anafilaksi'
  | 'siddetli_ates_bilinc'

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
    kod: 'sepsis_suphesi',
    re: /sepsis|septik|hipotansiyon[^.]{0,30}ate[şs]|laktat|organ yetmez|qsofa/i,
    ad: 'Sepsis / septik şok şüphesi',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun. Sepsis şüphesi portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'KLIMIK', not: 'Sepsis — acil; tanı hekim/acil' },
  },
  {
    kod: 'menenjit_suphesi',
    re: /menenjit|ensefalit|boyun sert|ense sert|pete[şs]i|fotofobi[^.]{0,20}ate[şs]|ba[şs] a[ğg]r[ıi][^.]{0,30}ate[şs]/i,
    ad: 'Menenjit / ensefalit şüphesi',
    eylem: 'Hemen 112’yi arayın. Menenjit şüphesinde ayaktan randevu beklenmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'KLIMIK', not: 'Menenjit şüphesi — acil' },
  },
  {
    kod: 'nekrotizan_fasit',
    re: /nekrotizan|fas[iy]it|gazl[ıi] gangren|ciddi yumu[şs]ak doku|h[ıi]zl[ıi] yay[ıi]lan sel[üu]lit/i,
    ad: 'Nekrotizan yumuşak doku enfeksiyonu şüphesi',
    eylem: 'Hemen 112’yi arayın. Cerrahi acil değerlendirme gerekebilir; Notya tanı/doz yazmaz.',
    oncelik: 'hemen',
    dipnot: { ref: 'KLIMIK', not: 'Nekrotizan fasit — acil cerrahi değerlendirme' },
  },
  {
    kod: 'anafilaksi',
    re: /anafilaksi|anafilaktik|[şs]ok[^.]{0,20}alerji|nefes darl[ıi][ğg][ıi][^.]{0,30}d[öo]k[üu]nt[üu]|epinefrin|adrenalin/i,
    ad: 'Anafilaksi / ciddi alerjik reaksiyon',
    eylem: 'Hemen 112’yi arayın. Epinefrin dozu Notya yazmaz — acil müdahale hekim/acil kararıdır.',
    oncelik: 'hemen',
    dipnot: { ref: 'TITCK', not: 'Anafilaksi — acil; doz hekim/acil' },
  },
  {
    kod: 'siddetli_ates_bilinc',
    re: /y[üu]ksek ate[şs][^.]{0,30}bilin[çc]|ate[şs][^.]{0,20}(39|40)[^.]{0,30}bilin[çc]|bilin[çc] bulan[^.]{0,30}ate[şs]/i,
    ad: 'Yüksek ateş ile bilinç değişikliği',
    eylem: 'Aynı gün acil değerlendirme veya 112. Ayaktan randevu yeterli olmayabilir.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'SB_ATB', not: 'Yüksek ateş + bilinç — acil değerlendirme kararı hekimin' },
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
  'Yüksek ateş ile bilinç bulanıklığı, boyun sertliği, mor noktalı döküntü, nefes darlığı ile yaygın döküntü veya hızla yayılan cilt/yumuşak doku şikayetinde portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerEnfeksiyon ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Yüksek ateş ile bilinç bulanıklığı veya aşırı halsizlik', kod: 'siddetli_ates_bilinc' },
  { etiket: 'Boyun sertliği, ışığa bakamama veya mor noktalı döküntü', kod: 'menenjit_suphesi' },
  { etiket: 'Hızla yayılan cilt / yumuşak doku şişliği veya şiddetli ağrı', kod: 'nekrotizan_fasit' },
  { etiket: 'Nefes darlığı ile yaygın döküntü veya alerjik şok şüphesi', kod: 'anafilaksi' },
  { etiket: 'Ateş ile tansiyon düşüklüğü veya organ yetmezliği şüphesi', kod: 'sepsis_suphesi' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Ateş / bilinç / tansiyon değerlendirildi (mümkünse)',
  'Son antibiyotik / antiviral kullanımı sorgulandı (doz Notya yazmaz)',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
