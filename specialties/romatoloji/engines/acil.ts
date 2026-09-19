/**
 * ROMATOLOJI-EXCEPTIONAL-01 — Romatoloji acil kırmızı bayrak. SAF fonksiyon.
 * Septik artrit · ciddi alev · nefes darlığı → 112. Tanı dili yok.
 */
import type { Dipnot } from './romatoloji'

export type AcilKod =
  | 'septik_artrit'
  | 'siddetli_alev'
  | 'nefes_gogus'
  | 'norolojik'
  | 'yaygin_dokuntu_ates'

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
    kod: 'septik_artrit',
    re: /septik|ate[şs][^.]{0,30}(s[ıi]cak|k[ıi]zar[ıi]k).{0,20}eklem|s[ıi]cak eklem|k[ıi]zar[ıi]k eklem[^.]{0,20}ate[şs]/i,
    ad: 'Ateşli sıcak / kızarık eklem (septik artrit şüphesi)',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun. Septik artrit şüphesi portal mesajı ile yönetilmez; aspirasyon kararı hekim/acilindir.',
    oncelik: 'hemen',
    dipnot: { ref: 'TRD', not: 'Septik artrit şüphesi — acil; tanı hekim/acil' },
  },
  {
    kod: 'siddetli_alev',
    re: /[şs]iddetli alev|yayg[ıi]n eklem[^.]{0,20}ate[şs]|lupus[^.]{0,20}kriz|ciddi alevlenme/i,
    ad: 'Şiddetli sistemik alevlenme şüphesi',
    eylem: 'Aynı gün acil değerlendirme veya 112. Ayaktan randevu yeterli olmayabilir.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'SB_ROMA', not: 'Ciddi alev — acil değerlendirme kararı hekimin' },
  },
  {
    kod: 'nefes_gogus',
    re: /nefes darl[ıi][ğg][ıi]|g[öo][ğg][üu]s a[ğg]r[ıi]s[ıi]|gogus agrisi|ani nefes/i,
    ad: 'Ani nefes darlığı / göğüs ağrısı',
    eylem: 'Hemen 112’yi arayın. Romatoloji portal mesajı bu durumu yönetmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_ROMA', not: 'Nefes/göğüs — acil' },
  },
  {
    kod: 'norolojik',
    re: /bilin[çc] de[ğg]i[şs]|bay[ıi]lma|n[öo]bet|y[üu]z kaymas[ıi]|ani g[üu][çc] kayb[ıi]/i,
    ad: 'Bilinç değişikliği / nörolojik kırmızı bayrak',
    eylem: 'Hemen 112’yi arayın.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_ROMA', not: 'Nörolojik acil — 112' },
  },
  {
    kod: 'yaygin_dokuntu_ates',
    re: /yayg[ıi]n d[öo]k[üu]nt[üu][^.]{0,20}ate[şs]|ate[şs][^.]{0,20}d[öo]k[üu]nt/i,
    ad: 'Yaygın döküntü + ateş',
    eylem: 'Aynı gün acil değerlendirme. İlaç reaksiyonu / ciddi sistemik hastalık ayırımı hekim/acilindir.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TRD', not: 'Döküntü+ateş — acil değerlendirme' },
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
  'Ateşli sıcak eklem, ani nefes darlığı / göğüs ağrısı, bilinç değişikliği veya yaygın döküntü ile ateş varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerRoma ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Ateş ile birlikte sıcak veya kızarık eklem', kod: 'septik_artrit' },
  { etiket: 'Şiddetli yaygın eklem ağrısı / alevlenme ile ateş', kod: 'siddetli_alev' },
  { etiket: 'Ani nefes darlığı veya göğüs ağrısı', kod: 'nefes_gogus' },
  { etiket: 'Bilinç değişikliği, bayılma veya ani güç kaybı', kod: 'norolojik' },
  { etiket: 'Yaygın döküntü ile birlikte ateş', kod: 'yaygin_dokuntu_ates' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Ateş ve etkilenen eklem değerlendirildi',
  'Biyolojik / DMARD kullanımı sorgulandı (doz Notya yazmaz)',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
