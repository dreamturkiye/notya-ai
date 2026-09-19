/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Kırmızı bayrak / acil triyaj (ayaktan genel cerrahi). SAF.
 * Akut karın, GI kanama, strangüle fıtık, post-op enfeksiyon, anastomoz kaçağı şüphesi, ileus
 * → "gecikme yok". PORTAL MESAJI ile yönetilmez. Tanı dili yok; yalnız eylem.
 */
import type { Dipnot } from './genel-cerrahi'

export type AcilKod =
  | 'akut_karin'
  | 'gi_kanama'
  | 'strangule_fitik'
  | 'postop_enfeksiyon'
  | 'anastomoz_kacagi'
  | 'ileus'

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
    kod: 'akut_karin',
    re: /akut kar[ıi]n|[şs]iddetli kar[ıi]n a[ğg]r[ıi].{0,40}(ate[şs]|kusma)|peritonit|board.?like|defans.{0,20}rebaund/i,
    ad: 'Şiddetli karın ağrısı + ateş/kusma (akut karın şüphesi)',
    eylem: 'Hemen 112’yi arayın veya en yakın acile gidin. Ayaktan randevu uygun değildir; portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'UTACD', not: 'Akut karın — zaman kritik; ayaktan beklenmez' },
  },
  {
    kod: 'gi_kanama',
    re: /bol (kanama|hematemez|melena)|kanl[ıi] kusma|siyah gaita.{0,20}bol|GI kanama|gastrointestinal kanama/i,
    ad: 'Bol gastrointestinal kanama',
    eylem: 'Hemen 112 veya en yakın acil. Ayaktan izlem yeterli değildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_CERRAHI', not: 'Aktif GI kanama — acil stabilizasyon' },
  },
  {
    kod: 'strangule_fitik',
    re: /s[ıi]k[ıi][şs]m[ıi][şs] f[ıi]t[ıi]k|strang[üu]le|f[ıi]t[ıi]k.{0,30}(geri girmiyor|kızarık|ate[şs])|incarcerat/i,
    ad: 'Sıkışmış / strangüle fıtık şüphesi',
    eylem: 'Aynı gün acil değerlendirme gerekir; 112 veya en yakın acil. Portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TCD', not: 'Strangüle fıtık — acil cerrahi penceresi' },
  },
  {
    kod: 'postop_enfeksiyon',
    re: /ameliyat sonras[ıi].{0,40}(ate[şs]|k[ıi]zar[ıi]k|apse)|yara.{0,20}(ate[şs]|irin|k[ıi]zar[ıi]kl[ıi]k)|cerrahi alan enfeksiyon/i,
    ad: 'Ameliyat sonrası ateş / yara enfeksiyon şüphesi',
    eylem: 'Aynı gün muayenehane veya acil değerlendirme. Kötüleşmede 112.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'SB_CERRAHI', not: 'Cerrahi alan enfeksiyon şüphesi — klinik değerlendirme' },
  },
  {
    kod: 'anastomoz_kacagi',
    re: /anastomoz ka[çc]a[ğg]|ameliyat sonras[ıi].{0,30}kar[ıi]n.{0,20}ate[şs]|leak.{0,20}anastom/i,
    ad: 'Ameliyat sonrası karın ağrısı + ateş (anastomoz kaçağı şüphesi)',
    eylem: 'Hemen 112 veya en yakın acil. Portal mesajı yeterli değildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'TKRCD', not: 'Anastomoz kaçağı şüphesi — acil değerlendirme' },
  },
  {
    kod: 'ileus',
    re: /gaz gaita (yok|[çc][ıi]karam)|ileus|kusma.{0,30}(gaz|gaita).{0,20}yok|ba[ğg][ıi]rsak t[ıi]kan/i,
    ad: 'Kusma + gaz/gaita çıkaramama (ileus / tıkanıklık şüphesi)',
    eylem: 'Aynı gün acil değerlendirme; kötüleşmede 112.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TCD', not: 'İleus / tıkanıklık şüphesi — acil değerlendirme' },
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
  'Şiddetli karın ağrısı ve ateş/kusma, bol kanama, sıkışmış fıtık, ameliyat sonrası ateş ile kötüleşen karın veya gaz-gaita çıkaramama ile kusma varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts `acilBelirtilerGenelCerrahi` ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Şiddetli karın ağrısı ile ateş veya kusma', kod: 'akut_karin' },
  { etiket: 'Bol miktarda kanama (kusma veya gaita ile)', kod: 'gi_kanama' },
  { etiket: 'Fıtık sıkıştı, geri girmiyor veya kızarık/ağrılı', kod: 'strangule_fitik' },
  { etiket: 'Ameliyat sonrası ateş veya yarada kızarıklık / irin', kod: 'postop_enfeksiyon' },
  { etiket: 'Ameliyat sonrası karın ağrısı ile ateş (kötüleşme)', kod: 'anastomoz_kacagi' },
  { etiket: 'Kusma ile birlikte gaz veya gaita çıkaramama', kod: 'ileus' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Karın muayenesi (defans / rebound) kaydedildi',
  'Kanama miktarı ve hemodinamik durum sorgulandı',
  'Fıtık redükte edilebilirlik değerlendirildi',
  'Ameliyat sonrası gün ve yara durumu not edildi',
  'Gaz / gaita çıkışı ve kusma sorgulandı',
  'Hastaya 112 / acil başvuru yolu anlatıldı ve kontrol aralığı riske göre kısaltıldı',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
