/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Toraks cerrahi acil kırmızı bayrak. SAF fonksiyon.
 * Tansiyon pnömotoraks · masif hemotoraks · tüp disfonksiyonu → 112. Tanı dili yok.
 * CAT/mMRC / inhaler / Astım-KOAH aksiyon planı BURAYA GİRMEZ.
 */
import type { Dipnot } from './gogus-cerrahisi'

export type AcilKod =
  | 'tansiyon_pnomotoraks'
  | 'masif_hemotoraks'
  | 'tup_disfonksiyon'
  | 'ani_nefes_darligi'
  | 'yara_enfeksiyon_siddetli'
  | 'bol_kanli_balgam'

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
    kod: 'tansiyon_pnomotoraks',
    re: /tansiyon pn[öo]motoraks|tension pneumo|ani tek tarafl[ıi] g[öo][ğg][üu]s.{0,40}nefes|mediasten kayma|trakea kayma/i,
    ad: 'Tansiyon pnömotoraks şüphesi',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun. Portal mesajı ile yönetilmez; tanı ve girişim hekim/acil.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_TORAKS', not: 'Tansiyon pnömotoraks — acil; tanı hekim/acil' },
  },
  {
    kod: 'masif_hemotoraks',
    re: /masif hemotoraks|bol kanama.{0,20}g[öo][ğg][üu]s|hemotoraks.{0,20}(masif|acil)|toraks.{0,20}bol kan/i,
    ad: 'Masif hemotoraks / toraks kanama şüphesi',
    eylem: 'Hemen 112 veya en yakın acil. Ayaktan randevu ile beklenmez; tanı hekim/acil.',
    oncelik: 'hemen',
    dipnot: { ref: 'TGCD', not: 'Masif hemotoraks — acil' },
  },
  {
    kod: 'tup_disfonksiyon',
    re: /t[üu]p.{0,20}(t[ıi]kand|d[üu][şs]t[üu]|[çc][ıi]kt[ıi]|[çc]al[ıi][şs]m[ıi]yor)|dren.{0,20}(t[ıi]kand|d[üu][şs]t[üu])|chest.?tube.{0,15}dislodg/i,
    ad: 'Toraks tüpü / dren disfonksiyonu',
    eylem: 'Aynı gün acil değerlendirme veya 112. Tüp yönetimi hekim/acil kararıdır.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TGCD', not: 'Tüp disfonksiyonu — acil değerlendirme' },
  },
  {
    kod: 'ani_nefes_darligi',
    re: /ani nefes darl[ıi][ğg][ıi]|ani dispne|oksijen.{0,15}d[üu][şs].{0,20}(post|ameliyat|t[üu]p)|postop.{0,20}nefes dar/i,
    ad: 'Ani / belirgin nefes darlığı',
    eylem: 'Hemen 112 veya en yakın acil. Ayaktan portal mesajı yeterli değildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_TORAKS', not: 'Akut solunum — acil; tanı hekim/acil' },
  },
  {
    kod: 'yara_enfeksiyon_siddetli',
    re: /yara.{0,30}(ate[şs]|k[ıi]zar[ıi]kl[ıi]k|irin|apse)|cerrahi alan enfeksiyon|[şs]iddetli yara/i,
    ad: 'Şiddetli yara / cerrahi alan enfeksiyon şüphesi',
    eylem: 'Aynı gün hekim değerlendirmesi veya acil. Antibiyotik dozu Notya yazmaz.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TGCD', not: 'Ciddi yara enfeksiyonu — hekim/acil; doz hekimin' },
  },
  {
    kod: 'bol_kanli_balgam',
    re: /bol kanl[ıi] balgam|masif hemoptizi|bol hemoptizi|a[ğg][ıi]zdan bol kan/i,
    ad: 'Bol kanlı balgam / masif hemoptizi şüphesi',
    eylem: 'Hemen 112’yi arayın. Portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TGCD', not: 'Masif hemoptizi — acil' },
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
  'Ani tek taraflı göğüs ağrısı ve nefes darlığı, bol kanlı balgam, tüpünüzün yerinden çıkması veya yara çevresinde hızla artan kızarıklık ve ateş varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerGogusCerrahi ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Ani tek taraflı göğüs ağrısı ile nefes darlığı', kod: 'tansiyon_pnomotoraks' },
  { etiket: 'Bol kanlı balgam veya ağızdan bol kan', kod: 'bol_kanli_balgam' },
  { etiket: 'Toraks tüpü / drenin yerinden çıkması veya tıkanması', kod: 'tup_disfonksiyon' },
  { etiket: 'Ameliyat sonrası ani / belirgin nefes darlığı', kod: 'ani_nefes_darligi' },
  { etiket: 'Yara çevresinde hızla artan kızarıklık, irin veya ateş', kod: 'yara_enfeksiyon_siddetli' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Oksijen / bilinç durumu değerlendirildi (mümkünse)',
  'Toraks tüpü / dren durumu sorgulandı (varsa)',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
