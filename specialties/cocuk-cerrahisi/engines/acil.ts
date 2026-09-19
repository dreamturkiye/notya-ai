/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Kırmızı bayrak / acil (ayaktan çocuk cerrahisi). SAF.
 * PORTAL MESAJI ile yönetilmez. Tanı dili yok; yalnız eylem.
 */
import type { Dipnot } from './cocuk-cerrahisi'

export type AcilKod =
  | 'akut_karin'
  | 'strangule_fitik'
  | 'postop_enfeksiyon'
  | 'gi_kanama'
  | 'ileus'
  | 'skrotal_acil'

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
    re: /akut kar[ıi]n|[şs]iddetli kar[ıi]n a[ğg]r[ıi].{0,40}(ate[şs]|kusma)|peritonit|defans.{0,20}rebaund|apandisit [şs][üu]phe/i,
    ad: 'Şiddetli karın ağrısı + ateş/kusma (akut karın şüphesi)',
    eylem: 'Hemen 112’yi arayın veya en yakın acile gidin. Ayaktan randevu uygun değildir; portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'CCD', not: 'Akut karın — zaman kritik; ayaktan beklenmez' },
  },
  {
    kod: 'strangule_fitik',
    re: /s[ıi]k[ıi][şs]m[ıi][şs] f[ıi]t[ıi]k|strang[üu]le|f[ıi]t[ıi]k.{0,30}(geri girmiyor|kızarık|ate[şs])|incarcerat/i,
    ad: 'Sıkışmış / strangüle fıtık şüphesi',
    eylem: 'Aynı gün acil değerlendirme; 112 veya en yakın acil. Portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'CCD', not: 'Strangüle fıtık — acil cerrahi penceresi' },
  },
  {
    kod: 'postop_enfeksiyon',
    re: /ameliyat sonras[ıi].{0,40}(ate[şs]|k[ıi]zar[ıi]k|apse)|yara.{0,20}(ate[şs]|irin|k[ıi]zar[ıi]kl[ıi]k)/i,
    ad: 'Ameliyat sonrası ateş / yara enfeksiyon şüphesi',
    eylem: 'Aynı gün muayenehane veya acil değerlendirme. Kötüleşmede 112.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'SB_CERRAHI', not: 'Cerrahi alan enfeksiyon şüphesi — klinik değerlendirme' },
  },
  {
    kod: 'gi_kanama',
    re: /bol (kanama|hematemez|melena)|kanl[ıi] kusma|siyah gaita.{0,20}bol|GI kanama/i,
    ad: 'Bol gastrointestinal kanama',
    eylem: 'Hemen 112 veya en yakın acil.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_CERRAHI', not: 'Aktif GI kanama — acil stabilizasyon' },
  },
  {
    kod: 'ileus',
    re: /gaz gaita (yok|[çc][ıi]karam)|ileus|kusma.{0,30}(gaz|gaita).{0,20}yok|ba[ğg][ıi]rsak t[ıi]kan/i,
    ad: 'Kusma + gaz/gaita çıkaramama (ileus / tıkanıklık şüphesi)',
    eylem: 'Aynı gün acil değerlendirme; kötüleşmede 112.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'CCD', not: 'İleus / tıkanıklık şüphesi — acil değerlendirme' },
  },
  {
    kod: 'skrotal_acil',
    re: /skrotal.{0,20}(a[ğg]r[ıi]|[şs]i[şs]|kızarık)|testis torsiyon|[şs]iddetli skrotum/i,
    ad: 'Şiddetli skrotal ağrı / şişlik (acil değerlendirme)',
    eylem: 'Hemen 112 veya en yakın acil. Saatler içinde değerlendirme gerekir.',
    oncelik: 'hemen',
    dipnot: { ref: 'CCD', not: 'Skrotal acil — zaman kritik' },
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
  'Şiddetli karın ağrısı ve ateş/kusma, sıkışmış fıtık, ameliyat sonrası ateş ile kötüleşme, bol kanama veya gaz-gaita çıkaramama ile kusma varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Karın muayenesi kaydedildi',
  'Fıtık redükte edilebilirlik değerlendirildi',
  'Ameliyat sonrası gün ve yara durumu not edildi',
  'Gaz / gaita çıkışı ve kusma sorgulandı',
  'Skrotal acil (uygun hastada) sorgulandı',
  'Veliye / hastaya 112 / acil başvuru yolu anlatıldı',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
