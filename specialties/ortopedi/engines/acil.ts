/**
 * ORTOPEDI-EXCEPTIONAL-01 — Kırmızı bayrak / acil triyaj (ayaktan ortopedi). SAF fonksiyon.
 *
 * Kompartman, NV kayıp, açık kırık, septik eklem, kauda, çıkık+NV → "gecikme yok".
 * PORTAL MESAJI ile yönetilmez. Tanı dili yok; yalnız eylem. Karar hekimindir (orto_risk.hekim_onay).
 */
import type { Dipnot } from './ortopedi'

export type AcilKod =
  | 'kompartman'
  | 'nv_kayip'
  | 'acik_kirik'
  | 'septik_eklem'
  | 'kauda'
  | 'cikik_nv'

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
    kod: 'kompartman',
    re: /kompartman|dayan[ıi]lmaz a[ğg]r[ıi].{0,40}[şs]i[şs]lik|pasif gerilme.{0,20}a[ğg]r[ıi]|cast.{0,20}too tight|al[çc][ıi].{0,20}(s[ıi]k[ıi]|bas[ıi])/i,
    ad: 'Kompartman sendromu şüphesi',
    eylem: 'Hemen 112’yi arayın veya en yakın acile gidin. Alçı/ortez gevşetilmeden beklenmez; portal mesajı yeterli değildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_ORTO', not: 'Kompartman şüphesi — zaman kritik; ayaktan randevu uygun değildir' },
  },
  {
    kod: 'nv_kayip',
    re: /nab[ıi]z yok|his kayb[ıi]|ani (güç|his) kayb|n[öo]rovask[üu]ler|parmak (u[yu]uş|mor)|so[ğg]uk ekstremite/i,
    ad: 'Ani his / güç / nabız kaybı (nörovasküler tehdit)',
    eylem: 'Hemen 112 veya en yakın acil. Ayaktan izlem yeterli değildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'TOTBID', not: 'NV tehdit — acil değerlendirme; portal mesajı beklenmez' },
  },
  {
    kod: 'acik_kirik',
    re: /a[çc][ıi]k k[ıi]r[ıi]k|kemik d[ıi][şs]ar[ıi]|yara.{0,30}k[ıi]r[ıi]k|open fracture/i,
    ad: 'Açık kırık şüphesi',
    eylem: 'En yakın acile başvurun; yara steril örtü ile örtülür, beklemeyin. 112 gerekebilir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_ORTO', not: 'Açık kırık — acil antibiyotik / debridman penceresi; ayaktan beklenmez' },
  },
  {
    kod: 'septik_eklem',
    re: /ate[şs].{0,40}(s[ıi]cak|k[ıi]zar[ıi]k).{0,20}eklem|septik artrit|eklem.{0,20}ate[şs]|hot joint/i,
    ad: 'Ateşli sıcak / kızarık eklem (septik artrit şüphesi)',
    eylem: 'Aynı gün acil değerlendirme gerekir; 112 veya en yakın acil. Portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TOTBID', not: 'Septik eklem şüphesi — acil aspirasyon kararı hekimde; ayaktan beklenmez' },
  },
  {
    kod: 'kauda',
    re: /kauda|eyer anestezi|idrar.{0,20}(yapamama|tutamama)|gaita.{0,20}(ka[çc][ıi]r|tutam)|bel.{0,30}bacak.{0,30}idrar/i,
    ad: 'Bel + bacak + idrar/gaita kontrol kaybı (kauda şüphesi)',
    eylem: 'Hemen 112 veya en yakın acil. Saatler içinde değerlendirme gerekir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_ORTO', not: 'Kauda equina şüphesi — acil görüntüleme / dekompresyon penceresi' },
  },
  {
    kod: 'cikik_nv',
    re: /[çc][ıi]k[ıi]k.{0,30}(nab[ıi]z|his|mor)|omuz [çc][ıi]k[ıi]k.*so[ğg]uk|diz [çc][ıi]k[ıi]k/i,
    ad: 'Çıkık + nörovasküler bulgu',
    eylem: 'Hemen acile başvurun; redüksiyon denemesi ayaktan geciktirilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TOTBID', not: 'Çıkık + NV bulgu — acil redüksiyon; ayaktan beklenmez' },
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
  'Şiddetli şişlik ve dayanılmaz ağrı, ani his/güç kaybı, açık kırık, ateşli sıcak eklem, bel+bacak ile idrar/gaita sorunu veya çıkıkta nabız kaybı varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts `acilBelirtilerOrtopedi` ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Şiddetli şişlik ile dayanılmaz ağrı (kompartman şüphesi)', kod: 'kompartman' },
  { etiket: 'Ani his, güç veya nabız kaybı', kod: 'nv_kayip' },
  { etiket: 'Açık kırık / kemik dışarıda görünmesi', kod: 'acik_kirik' },
  { etiket: 'Ateş ile sıcak veya kızarık eklem', kod: 'septik_eklem' },
  { etiket: 'Bel ve bacak ağrısı ile idrar veya gaita kontrol kaybı', kod: 'kauda' },
  { etiket: 'Çıkık ile birlikte soğukluk veya nabız kaybı', kod: 'cikik_nv' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Travma zamanı ve mekanizma kaydedildi',
  'Nörovasküler durum (his, güç, nabız, renk) değerlendirildi',
  'Kompartman bulguları (pasif gerilme ağrısı, şişlik) sorgulandı',
  'Açık yara / açık kırık varlığı incelendi',
  'Ateş + sıcak eklem (septik) sorgulandı',
  'Bel + idrar/gaita (kauda) sorgulandı',
  'Hastaya 112 / acil başvuru yolu anlatıldı ve kontrol aralığı riske göre kısaltıldı',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
