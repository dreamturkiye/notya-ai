/**
 * ACIL-TIP-EXCEPTIONAL-01 — Acil kırmızı bayrak (kötüleşme / resus). SAF fonksiyon.
 * Portal mesajı yönetmez. Tanı dili yok.
 */
import type { Dipnot } from './acilTip'

export type AcilKod =
  | 'hava_yolu_tehdit'
  | 'resus_ihtiyaci'
  | 'kontrolsuz_kanama'
  | 'ani_bilinc_kaybi'
  | 'siddetli_solunum_yetmezligi'
  | 'sok_suphesi'

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
    kod: 'hava_yolu_tehdit',
    re: /hava yolu|stridor|bo[ğg]ulma|yutam[ıi]yor|anafilaksi|dil [şs]i[şs]/i,
    ad: 'Hava yolu tehdidi',
    eylem: 'Hemen hava yolu protokolü / resus ekibi. Portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TATD', not: 'Hava yolu acili — tanı hekim/acil' },
  },
  {
    kod: 'resus_ihtiyaci',
    re: /resus|kardiyak arrest|nab[ıi]zs[ıi]z|CPR|defibril/i,
    ad: 'Resus ihtiyacı',
    eylem: 'Hemen resus protokolü. Doz şeması hekim / protokol sorumluluğundadır.',
    oncelik: 'hemen',
    dipnot: { ref: 'ERC_TR', not: 'Resus — doz hekim/protokol' },
  },
  {
    kod: 'kontrolsuz_kanama',
    re: /kontrols[üu]z kanama|masif kanama|aktif kanama durmuyor|hemorajik [şs]ok/i,
    ad: 'Kontrolsüz / masif kanama',
    eylem: 'Hemen kanama kontrolü ve resus. Sevk kararı hekimde.',
    oncelik: 'hemen',
    dipnot: { ref: 'ATLS_TR', not: 'Kanama acili' },
  },
  {
    kod: 'ani_bilinc_kaybi',
    re: /ani bilin[çc] kayb|glasgow.{0,10}d[üu][şs]|stupor|koma|yan[ıi]ts[ıi]z/i,
    ad: 'Ani bilinç kaybı / yanıtsızlık',
    eylem: 'Hemen ABC değerlendirme ve acil protokol.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_ACIL', not: 'Bilinç acili' },
  },
  {
    kod: 'siddetli_solunum_yetmezligi',
    re: /[şs]iddetli nefes darl[ıi][ğg]|solunum yetmez|SpO2.{0,8}(8[0-9]|7[0-9])|siyanoz/i,
    ad: 'Şiddetli solunum yetmezliği',
    eylem: 'Hemen oksijen / destek solunum değerlendirmesi. Doz hekimde.',
    oncelik: 'hemen',
    dipnot: { ref: 'TATD', not: 'Solunum acili' },
  },
  {
    kod: 'sok_suphesi',
    re: /[şs]ok [şs][üu]phesi|hipotansiyon.{0,15}so[ğg]uk ter|perfüzyon bozuk/i,
    ad: 'Şok şüphesi',
    eylem: 'Hemen resus / sıvı / neden değerlendirmesi. Tanı Notya yazmaz.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_ACIL', not: 'Şok — tanı hekim' },
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
  'Ani kötüleşme, nefes darlığı, göğüs ağrısı, bilinç değişikliği veya kontrolsüz kanamada portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerAcilTip ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Nefes alamıyorum veya boğulma hissi', kod: 'hava_yolu_tehdit' },
  { etiket: 'Bayılma / bilinç kaybı veya yanıtsızlık', kod: 'ani_bilinc_kaybi' },
  { etiket: 'Kontrol edilemeyen kanama', kod: 'kontrolsuz_kanama' },
  { etiket: 'Şiddetli nefes darlığı veya morarma', kod: 'siddetli_solunum_yetmezligi' },
  { etiket: 'Çok düşük tansiyon / soğuk ter / şok hissi', kod: 'sok_suphesi' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'ABC / vital değerlendirme yapıldı',
  'ESI seviyesi gözden geçirildi',
  'Kritik yol bayrağı (varsa) işaretlendi',
  'Hekim eylem ve onay kaydı kilitlendi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
