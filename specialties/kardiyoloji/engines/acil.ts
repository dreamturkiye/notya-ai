/**
 * KARDIO-EXCEPTIONAL-01 — Kırmızı bayrak / acil triyaj (ayaktan kardiyoloji). SAF fonksiyon.
 * Göğüs baskısı, ani nefes darlığı, bayılma, inme bulgusu → "hemen". Portal mesajı yönetmez.
 */
import type { Dipnot } from './kardiyoloji'

export type AcilKod =
  | 'gogus_agrisi'
  | 'nefes_darligi_ani'
  | 'bayilma'
  | 'inme_bulgu'
  | 'carpinti_bayginlik'
  | 'akut_odem'

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
    kod: 'gogus_agrisi',
    re: /g[öo][ğg][üu]s (a[ğg]r[ıi]|bask[ıi]|bas[ıi]n[çc])|g[öo][ğg]s[üu]m[üu] (s[ıi]k[ıi]|ez|yan)|kalp krizi gibi|sol kola yay[ıi]lan/i,
    ad: 'Göğüs ağrısı / baskı',
    eylem: 'Beklemeyin: 112’yi arayın veya en yakın acile başvurun. Göğüs baskısı ayaktan randevu sırası beklenmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_AKS', not: 'Göğüs ağrısı / AKS şüphesi — acil değerlendirme; ayaktan izlem yeterli değildir' },
  },
  {
    kod: 'nefes_darligi_ani',
    re: /ani.{0,20}nefes darl|nefes alam[ıi]yor|istirahatte nefes|yatarak nefes|ortopne|paroksismal nokturnal/i,
    ad: 'Ani / şiddetli nefes darlığı',
    eylem: 'Hemen 112’yi arayın veya en yakın acile gidin. Şiddetli nefes darlığı portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'ESC_TKD', not: 'Akut nefes darlığı — acil; ayaktan randevu beklenmez' },
  },
  {
    kod: 'bayilma',
    re: /bay[ıi]ld[ıi]m|bayg[ıi]nl[ıi]k|senkop|bilin[çc] kayb[ıi]|kendimden ge[çc]tim/i,
    ad: 'Bayılma / senkop',
    eylem: 'En yakın acile başvurun; tekrar bayılma veya göğüs ağrısı eşlik ediyorsa 112. Araç kullanmayın.',
    oncelik: 'hemen',
    dipnot: { ref: 'TKD', not: 'Senkop — acil değerlendirme; neden hekim tarafından araştırılır' },
  },
  {
    kod: 'inme_bulgu',
    re: /y[üu]z kay|konu[şs]ma bozuk|ani g[üu][çc]s[üu]zl[üu]k|tek tarafl[ıi] fel[çc]|ani g[öo]rme kayb[ıi].{0,20}kol/i,
    ad: 'Yüz kayması / konuşma bozukluğu / ani güçsüzlük',
    eylem: 'Hemen 112’yi arayın. İnme belirtilerinde dakikalar önemlidir; portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_AKS', not: 'İnme bulguları — acil 112; kardiyoloji ayaktan izlem uygun değildir' },
  },
  {
    kod: 'carpinti_bayginlik',
    re: /[çc]arp[ıi]nt[ıi].{0,40}(bayg[ıi]n|ba[şs] d[öo]n|bilin[çc])|h[ıi]zl[ıi] kalp.{0,30}bay/i,
    ad: 'Çarpıntı ile birlikte baygınlık',
    eylem: 'Aynı gün acil değerlendirme gerekir; ulaşamıyorsanız 112. Araç kullanmayın.',
    oncelik: 'hemen',
    dipnot: { ref: 'ESC_TKD', not: 'Semptomatik aritmi şüphesi — acil; doz ve tanı hekimindir' },
  },
  {
    kod: 'akut_odem',
    re: /ani.{0,20}(bacak|[öo]dem|[şs]i[şs]lik)|akci[ğg]er [öo]demi|pembe k[öo]p[üu]kl[üu] balgam/i,
    ad: 'Ani ödem / solunumda köpüklü balgam',
    eylem: 'Hemen 112 veya en yakın acil. Ani şişlik ve nefes darlığı ayaktan beklenmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'ESC_TKD', not: 'Akut dekompansasyon şüphesi — acil' },
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
  'Göğsünüzde baskı veya ağrı, ani nefes darlığı, bayılma, yüz kayması / konuşma bozukluğu veya ani güçsüzlük varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts `acilBelirtilerKardio` ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Göğüs ağrısı veya baskı', kod: 'gogus_agrisi' },
  { etiket: 'Ani / şiddetli nefes darlığı', kod: 'nefes_darligi_ani' },
  { etiket: 'Bayılma veya bilinç kaybı', kod: 'bayilma' },
  { etiket: 'Yüz kayması, konuşma bozukluğu veya ani güçsüzlük', kod: 'inme_bulgu' },
  { etiket: 'Çarpıntı ile birlikte baygınlık veya baş dönmesi', kod: 'carpinti_bayginlik' },
  { etiket: 'Ani bacak şişliği veya nefes darlığı ile birlikte şişlik', kod: 'akut_odem' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Şikâyetin başlangıç zamanı ve efor / istirahat ilişkisi kaydedildi',
  'Göğüs ağrısının niteliği, yayılımı ve eşlik eden terleme sorgulandı',
  'Bayılma / çarpıntı / nefes darlığı ayrımı yapıldı',
  'İnme bulguları (yüz, konuşma, güç) sorgulandı',
  'Antikoagülan / antiagregan / nitrat kullanımı sorgulandı',
  'Hastaya 112 / acil başvuru yolu anlatıldı ve kontrol aralığı riske göre kısaltıldı',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
