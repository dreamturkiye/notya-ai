/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Vasküler / kardiyak cerrahi acil bayrak. SAF fonksiyon.
 * Akut ekstremite iskemisi · greft trombozu · majör kanama → 112. Tanı dili yok.
 * SCORE2 / Kalbim / HT-KKY BURAYA GİRMEZ.
 */
import type { Dipnot } from './kalp-damar'

export type AcilKod =
  | 'akut_ekstremite_iskemi'
  | 'greft_tromboz'
  | 'major_kanama'
  | 'aort_semptom'
  | 'yara_enfeksiyon_siddetli'
  | 'ani_gogus_nefes'

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
    kod: 'akut_ekstremite_iskemi',
    re: /akut ekstremite|ani so[ğg]uk (ayak|bacak|el|kol)|soluk ekstremite|pulse.?less|5.?P|ani bacak a[ğg]r[ıi].{0,30}so[ğg]uk/i,
    ad: 'Akut ekstremite iskemisi şüphesi',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun. Portal mesajı ile yönetilmez; tanı ve girişim hekim/acil.',
    oncelik: 'hemen',
    dipnot: { ref: 'TKD_DAMAR', not: 'Akut ekstremite iskemisi — acil; tanı hekim/acil' },
  },
  {
    kod: 'greft_tromboz',
    re: /greft.{0,20}(t[ıi]kan|tromboz|kapand)|bypass.{0,20}(t[ıi]kan|tromboz)|stent.?graft.{0,20}(t[ıi]kan|tromboz)/i,
    ad: 'Greft / bypass trombozu şüphesi',
    eylem: 'Hemen 112 veya en yakın acil. Ayaktan randevu ile beklenmez; tanı hekim/acil.',
    oncelik: 'hemen',
    dipnot: { ref: 'TKDCD', not: 'Greft trombozu — acil' },
  },
  {
    kod: 'major_kanama',
    re: /maj[öo]r kanama|bol kanama|antikoag.{0,30}(kanama|hematom)|greft.{0,20}kanama|ameliyat yeri.{0,20}bol kan/i,
    ad: 'Majör kanama / greft bölgesi kanama şüphesi',
    eylem: 'Hemen 112. Antikoagülan dozu Notya yazmaz; acil değerlendirme hekim/acil.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_KV', not: 'Majör kanama — acil; doz hekimin' },
  },
  {
    kod: 'aort_semptom',
    re: /ani [şs]iddetli s[ıi]rt|y[ıi]rt[ıi]c[ıi] g[öo][ğg][üu]s|aort.{0,20}(disseksiyon|y[ıi]rt[ıi]l)|ani y[ıi]rt[ıi]c[ıi]/i,
    ad: 'Aort diseksiyon / yırtılma uyarı semptomları',
    eylem: 'Hemen 112. Portal mesajı yeterli değildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_KV', not: 'Aort acil — 112' },
  },
  {
    kod: 'yara_enfeksiyon_siddetli',
    re: /yara.{0,30}(ate[şs]|k[ıi]zar[ıi]kl[ıi]k|irin|apse)|cerrahi alan enfeksiyon|[şs]iddetli yara|sternum.{0,20}enfeksiyon/i,
    ad: 'Şiddetli yara / cerrahi alan enfeksiyon şüphesi',
    eylem: 'Aynı gün hekim değerlendirmesi veya acil. Antibiyotik dozu Notya yazmaz.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TKDCD', not: 'Ciddi yara enfeksiyonu — hekim/acil; doz hekimin' },
  },
  {
    kod: 'ani_gogus_nefes',
    re: /ani g[öo][ğg][üu]s a[ğg]r[ıi]|ani nefes darl[ıi][ğg][ıi]|postop.{0,20}(g[öo][ğg][üu]s|nefes)/i,
    ad: 'Ani göğüs ağrısı / nefes darlığı (post-op / vasküler)',
    eylem: 'Hemen 112 veya en yakın acil. Ayaktan portal mesajı yeterli değildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_KV', not: 'Akut göğüs/nefes — acil; tanı hekim/acil' },
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
  'Ani soğuk veya soluk el/ayak, greft bölgesinde ani şişlik veya bol kanama, yırtıcı göğüs/sırt ağrısı varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerKDC ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Ani soğuk / soluk el veya ayak ile şiddetli ağrı', kod: 'akut_ekstremite_iskemi' },
  { etiket: 'Greft veya bypass hattında ani tıkanma şüphesi', kod: 'greft_tromboz' },
  { etiket: 'Bol kanama veya greft bölgesinde hızla büyüyen şişlik', kod: 'major_kanama' },
  { etiket: 'Ani yırtıcı göğüs veya sırt ağrısı', kod: 'aort_semptom' },
  { etiket: 'Ameliyat sonrası ani göğüs ağrısı veya nefes darlığı', kod: 'ani_gogus_nefes' },
  { etiket: 'Yara çevresinde hızla artan kızarıklık, irin veya ateş', kod: 'yara_enfeksiyon_siddetli' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Ekstremite nabız / renk / ısı sorgulandı (mümkünse)',
  'Greft / yara durumu sorgulandı (varsa)',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
