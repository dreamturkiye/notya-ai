/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Plastik acil kırmızı bayrak. SAF fonksiyon.
 * Flep kompromisi · hematom · enfeksiyon · ayrışma → 112. Tanı dili yok; eylem yönlendirmesi var.
 */
import type { Dipnot } from './plastik'

export type AcilKod =
  | 'flep_kompromisi'
  | 'hematom_buyuyen'
  | 'yara_enfeksiyon'
  | 'yara_ayrisma'
  | 'kanama_siddetli'
  | 'alerji_sargi'

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
    kod: 'flep_kompromisi',
    re: /flep.{0,40}(soluk|mor|siyah|so[ğg]uk|kapiller|renk)|greft.{0,30}(soluk|siyah|d[üu][şs]m[üu][şs])|kapiller dolum|ven[öo]z konjesyon|arteriyel yetmez/i,
    ad: 'Flep / greft renk-dolaşım değişikliği şüphesi',
    eylem: 'Hemen 112 veya en yakın acil / plastik cerrahi acil değerlendirme. Flep kurtarma kararı hekim/acilindir; portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TPRECD', not: 'Flep kompromisi — acil; tanı hekim/acil' },
  },
  {
    kod: 'hematom_buyuyen',
    re: /hematom|h[ıi]zla b[üu]y[üu]yen [şs]i[şs]lik|gergin [şs]i[şs]lik|flap alt[ıi] kanama|ani [şs]i[şs]lik.{0,20}a[ğg]r[ıi]/i,
    ad: 'Hızla büyüyen hematom / gergin şişlik',
    eylem: 'Hemen 112 veya en yakın acil. Boşaltma / revizyon kararı hekim/acilindir.',
    oncelik: 'hemen',
    dipnot: { ref: 'TPRECD', not: 'Postop hematom — acil değerlendirme' },
  },
  {
    kod: 'yara_enfeksiyon',
    re: /yara.{0,30}(ate[şs]|k[ıi]zar[ıi]k|irin|ak[ıi]nt[ıi])|sel[üu]lit|ate[şs].{0,30}yara|yara enfeksiyon/i,
    ad: 'Yara enfeksiyonu şüphesi (kızarıklık / ateş / akıntı)',
    eylem: 'Aynı gün değerlendirme veya 112. Antibiyotik dozu Notya yazmaz — hekim kararı.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'SB_YARA', not: 'Yara enfeksiyonu — klinik değerlendirme; doz hekimin' },
  },
  {
    kod: 'yara_ayrisma',
    re: /yara ayr[ıi][şs]|dehisens|diki[şs].{0,20}a[çc][ıi]ld[ıi]|kenarlar ayr[ıi]ld[ıi]|insizyon a[çc][ıi]ld[ıi]/i,
    ad: 'Yara kenarı ayrışması / dikiş açılması',
    eylem: 'Aynı gün plastik değerlendirme. Onarım kararı hekimindir; tanı yazılmaz.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TPRECD', not: 'Yara ayrışması (dehisens) — klinik değerlendirme' },
  },
  {
    kod: 'kanama_siddetli',
    re: /[şs]iddetli kanama|bol kanama|durmayan kanama|pansuman.{0,20}kanama|aktif kanama/i,
    ad: 'Şiddetli / durmayan kanama',
    eylem: 'Hemen 112’yi arayın. Kanama kontrolü hekim/acil kararıdır.',
    oncelik: 'hemen',
    dipnot: { ref: 'TPRECD', not: 'Ciddi kanama — acil' },
  },
  {
    kod: 'alerji_sargi',
    re: /sarg[ıi].{0,20}alerji|bandaj.{0,20}ka[şs][ıi]nt[ıi]|kontakt dermatit.{0,20}pansuman|flaster.{0,20}kızar/i,
    ad: 'Sargı / pansuman alerjisi şüphesi',
    eylem: 'Aynı gün muayenehane değerlendirmesi. Alternatif sargı hekim kararıdır.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'SB_YARA', not: 'Kontakt reaksiyon — hekim değerlendirir' },
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
  'Yara veya greftte ani renk değişikliği, hızla büyüyen şişlik, yüksek ateş ile kızarıklık veya yara kenarlarının açılması varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerPlastik ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Yara/greftte ani solukluk, morarma veya soğukluk', kod: 'flep_kompromisi' },
  { etiket: 'Hızla büyüyen gergin şişlik (hematom şüphesi)', kod: 'hematom_buyuyen' },
  { etiket: 'Yara çevresinde kızarıklık, ateş veya irinli akıntı', kod: 'yara_enfeksiyon' },
  { etiket: 'Yara kenarlarının açılması / dikişlerin ayrılması', kod: 'yara_ayrisma' },
  { etiket: 'Durmayan / bol kanama', kod: 'kanama_siddetli' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Flep / greft rengi ve kapiller dolum hekim tarafından değerlendirildi (mümkünse)',
  'Pansuman / dikiş durumu not edildi (doz Notya yazmaz)',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
