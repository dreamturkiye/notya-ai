/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Kırmızı bayrak / acil triyaj (ayaktan spor hekimliği). SAF.
 * Konküzyon bayrakları, egzersiz göğüs ağrısı, senkop, kırık+nöro, kompartman → "gecikme yok".
 * PORTAL MESAJI ile yönetilmez. Tanı dili yok; yalnız eylem. Karar hekimindir (spor_risk.hekim_onay).
 */
import type { Dipnot } from './spor'

export type AcilKod =
  | 'konkusyon_kirmizi'
  | 'egzersiz_gogus'
  | 'senkop_bayilma'
  | 'kirik_norolojik'
  | 'kompartman'
  | 'boyun_omurga'

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
    kod: 'konkusyon_kirmizi',
    re: /konk[üu]zyon|ba[şs].{0,20}darbe.{0,40}(kusma|bilin[çc]|n[öo]bet|çift g[öo]rme)|tekrarlayan kusma|bilin[çc] kayb[ıi]|n[öo]bet.{0,20}ba[şs]|çift g[öo]rme.{0,20}darbe/i,
    ad: 'Konküzyon kırmızı bayrakları (kusma / bilinç / nöbet / çift görme)',
    eylem: 'Hemen 112’yi arayın veya en yakın acile gidin. Portal mesajı beklemeyin; aynı gün saha dönüşü yapılmaz.',
    oncelik: 'hemen',
    dipnot: { ref: 'TSHD', not: 'Konküzyon kırmızı bayrak — ayaktan randevu sırası beklenmez; acil değerlendirme' },
  },
  {
    kod: 'egzersiz_gogus',
    re: /egzersiz.{0,30}g[öo][ğg][üu]s a[ğg]r|antrenman.{0,30}g[öo][ğg][üu]s|spor.{0,20}g[öo][ğg][üu]s a[ğg]r|efor.{0,20}g[öo][ğg][üu]s|g[öo][ğg][üu]s.{0,20}(ko[şs]|antrenman)/i,
    ad: 'Egzersiz / antrenman sırasında göğüs ağrısı',
    eylem: 'Egzersizi durdurun; 112 veya en yakın acile başvurun. Portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_SPOR', not: 'Egzersiz göğüs ağrısı — kardiyak red-flag; ayaktan izlem yeterli değildir' },
  },
  {
    kod: 'senkop_bayilma',
    re: /bay[ıi]lma|senkop|bilin[çc] kayb[ıi].{0,20}(spor|antrenman|efor)|efor.{0,20}bay[ıi]l/i,
    ad: 'Efor / spor sırasında bayılma veya bilinç kaybı',
    eylem: 'Hemen 112’yi arayın veya en yakın acile gidin. Spora dönüş ayaktan mesajla yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_SPOR', not: 'Efor senkopu — acil değerlendirme; ayaktan beklenmez' },
  },
  {
    kod: 'kirik_norolojik',
    re: /k[ıi]r[ıi]k.{0,40}(u[yş]u[şs]|g[üu][çc] kayb[ıi]|fel[çc]|kar[ıi]ncalanma)|n[öo]rolojik.{0,20}(k[ıi]r[ıi]k|travma)|a[çc][ıi]k k[ıi]r[ıi]k|deforme.{0,20}eklem/i,
    ad: 'Şüpheli kırık ile nörolojik bulgu / deformite',
    eylem: 'En yakın acile başvurun; ekstremiteyi zorlamayın. Portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TOTBID_SPOR', not: 'Kırık + nörolojik bulgu — acil değerlendirme' },
  },
  {
    kod: 'kompartman',
    re: /kompartman|a[şs][ıi]r[ıi] [şs]i[şs]lik.{0,30}(a[ğg]r[ıi]|bas[ıi]n[çc])|gergin [şs]i[şs]lik|kas.{0,20}gergin.{0,20}a[ğg]r[ıi]/i,
    ad: 'Kompartman sendromu şüphesi',
    eylem: 'Hemen 112 veya en yakın acile gidin. Saatler kritik olabilir; beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TOTBID_SPOR', not: 'Kompartman şüphesi — acil; ayaktan izlem uygun değildir' },
  },
  {
    kod: 'boyun_omurga',
    re: /boyun.{0,20}(travma|darbe|k[ıi]r[ıi]k)|omurga.{0,20}(travma|darbe)|ba[şs].{0,20}boyun.{0,20}hareket.{0,20}k[ıi]s[ıi]t|ense.{0,20}sertlik.{0,20}darbe/i,
    ad: 'Boyun / omurga travması şüphesi',
    eylem: 'Hareket ettirmeyin; 112’yi arayın. Portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_SPOR', not: 'Boyun/omurga travması — immobilizasyon ve acil değerlendirme' },
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
  'Baş darbesi sonrası kusma, bilinç kaybı, nöbet veya çift görme; egzersiz sırasında göğüs ağrısı veya bayılma; şüpheli kırık ile uyuşma/güç kaybı; aşırı gergin şişlik veya boyun/omurga travması varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts `acilBelirtilerSpor` ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Baş darbesi sonrası kusma, bilinç kaybı, nöbet veya çift görme', kod: 'konkusyon_kirmizi' },
  { etiket: 'Egzersiz / antrenman sırasında göğüs ağrısı', kod: 'egzersiz_gogus' },
  { etiket: 'Efor veya spor sırasında bayılma', kod: 'senkop_bayilma' },
  { etiket: 'Şüpheli kırık ile uyuşma veya güç kaybı', kod: 'kirik_norolojik' },
  { etiket: 'Aşırı gergin şişlik / kompartman şüphesi', kod: 'kompartman' },
  { etiket: 'Boyun veya omurga travması şüphesi', kod: 'boyun_omurga' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Baş darbesi / konküzyon kırmızı bayrakları sorgulandı',
  'Egzersiz sırasında göğüs ağrısı ve bayılma sorgulandı',
  'Nörolojik bulgu (uyuşma, güç kaybı) ile kırık şüphesi değerlendirildi',
  'Kompartman / gergin şişlik değerlendirildi',
  'Boyun / omurga travması sorgulandı',
  'Hastaya 112 / acil başvuru yolu anlatıldı ve spora dönüş riske göre durduruldu',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
