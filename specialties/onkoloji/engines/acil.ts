/**
 * ONKOLOJI-EXCEPTIONAL-01 — Onkoloji acil kırmızı bayrak. SAF fonksiyon.
 * Febril nötropeni · spinal bası · TLS · şiddetli toksisite → 112. Tanı dili yok; eylem yönlendirmesi var.
 */
import type { Dipnot } from './onkoloji'

export type AcilKod =
  | 'febril_notropeni'
  | 'spinal_basi'
  | 'tumor_lizis'
  | 'siddetli_kusma_dehidratasyon'
  | 'nefes_darligi_oksijen'
  | 'kanama_siddetli'

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
    kod: 'febril_notropeni',
    re: /febril|ate[şs].{0,30}n[öo]trop|n[öo]tropeni.{0,20}ate[şs]|kemoterapi.{0,30}ate[şs]|38[,.]5|38\.5/i,
    ad: 'Febril nötropeni şüphesi',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun. Febril nötropeni portal mesajı ile yönetilmez; antibiyotik / doz Notya yazmaz.',
    oncelik: 'hemen',
    dipnot: { ref: 'TTOD', not: 'Febril nötropeni — acil; tanı ve tedavi hekim/acil' },
  },
  {
    kod: 'spinal_basi',
    re: /spinal bas[ıi]|medulla bas[ıi]|ani s[ıi]rt a[ğg]r[ıi].{0,40}(bacak|g[üu][çc]s[üu]z|idrar)|bacak g[üu][çc]s[üu]zl[üu][ğg]|cauda equina|idrar tutamama.{0,30}s[ıi]rt/i,
    ad: 'Spinal bası / nörolojik acil şüphesi',
    eylem: 'Hemen 112’yi arayın. Ani sırt ağrısı + bacak güçsüzlüğü / idrar-gaita sorunu ayaktan randevu ile beklenmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TTOD', not: 'Spinal bası — acil görüntüleme/yönlendirme hekim/acil' },
  },
  {
    kod: 'tumor_lizis',
    re: /t[üu]m[öo]r lizis|tumor lysis|tls\b|hiper[üu]risemi.{0,20}(akut|acil)|ani b[öo]brek.{0,20}bozul/i,
    ad: 'Tümör lizis sendromu şüphesi',
    eylem: 'Hemen 112 veya en yakın acil. Laboratuvar ve hidrasyon kararı hekim/acildir; Notya doz yazmaz.',
    oncelik: 'hemen',
    dipnot: { ref: 'TTOD', not: 'TLS — acil; tanı hekim/acil' },
  },
  {
    kod: 'siddetli_kusma_dehidratasyon',
    re: /[şs]iddetli kusma|kontrols[üu]z kusma|dehidratasyon|a[ğg][ıi]zdan s[ıi]v[ıi].{0,20}alam[ıi]|kusma.{0,20}(3|4|5).{0,10}g[üu]n/i,
    ad: 'Şiddetli kusma / dehidratasyon',
    eylem: 'Aynı gün acil değerlendirme veya 112. IV hidrasyon ve antiemetik dozu hekim kararıdır.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TTOD', not: 'Ciddi emesis — acil değerlendirme; doz hekimin' },
  },
  {
    kod: 'nefes_darligi_oksijen',
    re: /nefes darl[ıi][ğg][ıi]|oksijen.{0,15}d[üu][şs]|dispne|g[öo][ğg][üu]s a[ğg]r[ıi].{0,30}nefes|pulmoner embol/i,
    ad: 'Belirgin nefes darlığı / oksijen düşüklüğü',
    eylem: 'Hemen 112 veya en yakın acil. Ayaktan portal mesajı yeterli değildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_KANSER', not: 'Akut solunum — acil; tanı hekim/acil' },
  },
  {
    kod: 'kanama_siddetli',
    re: /[şs]iddetli kanama|bol kanama|melena|hematemez|burun kanamas[ıi].{0,20}durmuyor|pete[şs]i.{0,20}yayg[ıi]n/i,
    ad: 'Şiddetli kanama',
    eylem: 'Hemen 112’yi arayın. Trombosit / koagülasyon yönetimi hekim/acil kararıdır.',
    oncelik: 'hemen',
    dipnot: { ref: 'TTOD', not: 'Ciddi kanama — acil' },
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
  'Ateş ile birlikte aşırı halsizlik, ani sırt ağrısı ve bacak güçsüzlüğü, şiddetli nefes darlığı, kontrolsüz kusma veya durmayan kanama varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerOnko ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Ateş ile birlikte aşırı halsizlik (febril nötropeni şüphesi)', kod: 'febril_notropeni' },
  { etiket: 'Ani sırt ağrısı ve bacak güçsüzlüğü / idrar tutamama', kod: 'spinal_basi' },
  { etiket: 'Şiddetli nefes darlığı veya göğüs sıkışması', kod: 'nefes_darligi_oksijen' },
  { etiket: 'Kontrolsüz kusma veya ağızdan sıvı alamama', kod: 'siddetli_kusma_dehidratasyon' },
  { etiket: 'Durmayan / bol kanama', kod: 'kanama_siddetli' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Ateş / bilinç / oksijen durumu değerlendirildi (mümkünse)',
  'Son tedavi / kür tarihi sorgulandı (doz Notya yazmaz)',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
